'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Lead, LeadStatus, PIPELINE_COLUMNS } from '@/lib/types';
import KanbanColumn from './KanbanColumn';
import LeadCard, { CardDensity } from '../leads/LeadCard';
import { useRouter } from 'next/navigation';

/* ── Columns that auto-collapse by default ─────── */
const DEFAULT_COLLAPSED = ['fechado', 'perdido'];
const EXTRA_COLLAPSED_LG = ['diagnostico_tecnico', 'proposta_enviada']; // <1024px

interface KanbanBoardProps {
  leads: Lead[];
  onDrop: (updates: { id: string; status: string; order: number }[]) => Promise<void>;
  density?: CardDensity;
}

export default function KanbanBoard({ leads, onDrop, density = 'compact' }: KanbanBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  /* ── Screen width (responsive) ─────────────────── */
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  useEffect(() => {
    const handle = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const mobileMode = screenWidth < 768;
  const effectiveDensity: CardDensity = mobileMode
    ? 'comfortable'
    : screenWidth < 1280
    ? 'compact'
    : density;

  /* ── Collapsed columns state ──────────────────── */
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(DEFAULT_COLLAPSED);
    try {
      const stored = localStorage.getItem('niit-crm-collapsed-columns');
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set(DEFAULT_COLLAPSED);
    } catch {
      return new Set(DEFAULT_COLLAPSED);
    }
  });

  // Persist collapsed columns to localStorage
  useEffect(() => {
    localStorage.setItem('niit-crm-collapsed-columns', JSON.stringify(Array.from(collapsedColumns)));
  }, [collapsedColumns]);

  // Effective collapsed = user's set + screen-size overrides
  const effectiveCollapsed = useMemo<Set<string>>(() => {
    if (mobileMode) return new Set<string>();
    const base = new Set(collapsedColumns);
    if (screenWidth < 1024) {
      EXTRA_COLLAPSED_LG.forEach(id => base.add(id));
    }
    return base;
  }, [collapsedColumns, screenWidth, mobileMode]);

  const collapseColumn = (id: string) =>
    setCollapsedColumns(prev => new Set(Array.from(prev).concat(id)));
  const expandColumn = (id: string) =>
    setCollapsedColumns(prev => { const n = new Set(Array.from(prev)); n.delete(id); return n; });

  /* ── Auto-expand on drag hover ─────────────────── */
  const pendingExpandRef = useRef<{ status: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [autoExpandingCol, setAutoExpandingCol] = useState<string | null>(null);

  function clearPendingExpand() {
    if (pendingExpandRef.current) {
      clearTimeout(pendingExpandRef.current.timer);
      pendingExpandRef.current = null;
    }
    setAutoExpandingCol(null);
  }

  /* ── Sync local leads with server ──────────────── */
  useEffect(() => {
    if (!activeId) setLocalLeads(leads);
  }, [leads, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {} as Record<LeadStatus, Lead[]>;
    PIPELINE_COLUMNS.forEach(col => {
      map[col.id] = localLeads
        .filter(l => l.status === col.id)
        .sort((a, b) => a.order - b.order);
    });
    return map;
  }, [localLeads]);

  const activeLead = activeId ? localLeads.find(l => l.id === activeId) : null;

  /* ── Drag handlers ─────────────────────────────── */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) { clearPendingExpand(); return; }

    const activeItem = localLeads.find(l => l.id === active.id);
    if (!activeItem) return;

    const overIsColumn = PIPELINE_COLUMNS.some(col => col.id === over.id);
    const overItem = localLeads.find(l => l.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as LeadStatus)
      : overItem?.status;

    if (!targetStatus) return;

    // Auto-expand collapsed column after 400ms hover
    if (effectiveCollapsed.has(targetStatus)) {
      if (!pendingExpandRef.current || pendingExpandRef.current.status !== targetStatus) {
        clearPendingExpand();
        setAutoExpandingCol(targetStatus);
        pendingExpandRef.current = {
          status: targetStatus,
          timer: setTimeout(() => {
            expandColumn(targetStatus);
            pendingExpandRef.current = null;
            setAutoExpandingCol(null);
          }, 400),
        };
      }
    } else {
      clearPendingExpand();
    }

    if (activeItem.status === targetStatus) return;

    // Optimistic status update
    setLocalLeads(prev =>
      prev.map(l => l.id === activeItem.id ? { ...l, status: targetStatus } : l)
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    clearPendingExpand();
    setActiveId(null);

    if (!over) {
      setLocalLeads(leads);
      return;
    }

    const activeItem = localLeads.find(l => l.id === active.id);
    if (!activeItem) return;

    const overItem = localLeads.find(l => l.id === over.id);
    const overIsColumn = PIPELINE_COLUMNS.some(col => col.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as LeadStatus)
      : (overItem?.status ?? activeItem.status);

    let finalLeads = localLeads;

    if (activeItem.status === targetStatus && !overIsColumn && overItem) {
      const colLeads = localLeads
        .filter(l => l.status === targetStatus)
        .sort((a, b) => a.order - b.order);
      const oldIdx = colLeads.findIndex(l => l.id === active.id);
      const newIdx = colLeads.findIndex(l => l.id === over.id);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(colLeads, oldIdx, newIdx).map((l, i) => ({ ...l, order: i }));
        const map = new Map(reordered.map(l => [l.id, l]));
        finalLeads = localLeads.map(l => map.get(l.id) ?? l);
        setLocalLeads(finalLeads);
      }
    }

    const serverMap = new Map(leads.map(l => [l.id, l]));
    const changed = finalLeads.filter(l => {
      const orig = serverMap.get(l.id);
      return !orig || orig.status !== l.status || orig.order !== l.order;
    });

    if (changed.length > 0) {
      try {
        await onDrop(changed.map(({ id, status, order }) => ({ id, status, order })));
      } catch {
        setLocalLeads(leads);
      }
    }
  }

  /* ── Column width for mobile (no collapse, 240px) ─ */
  const colStyle = mobileMode ? { width: 240, flexShrink: 0 } : {};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-2 h-full pb-4 kanban-scroll"
        style={{ overflowX: 'auto', alignItems: 'flex-start' }}
      >
        {PIPELINE_COLUMNS.map(col => {
          const colLeads = leadsByStatus[col.id] || [];
          const isCollapsed = !mobileMode && effectiveCollapsed.has(col.id);
          return (
            <SortableContext
              key={col.id}
              id={col.id}
              items={colLeads.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {/* Wrapper for width transition */}
              <div
                style={{
                  transition: 'width 200ms ease-out',
                  ...colStyle,
                }}
              >
                <KanbanColumn
                  column={col}
                  leads={colLeads}
                  onClickLead={id => router.push(`/leads/${id}`)}
                  collapsed={isCollapsed}
                  onCollapse={() => collapseColumn(col.id)}
                  onExpand={() => expandColumn(col.id)}
                  density={effectiveDensity}
                  autoExpanding={autoExpandingCol === col.id}
                />
              </div>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging density={effectiveDensity} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
