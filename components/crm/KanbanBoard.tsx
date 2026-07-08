'use client';

import { useState, useMemo, useEffect } from 'react';
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
import LeadCard from '../leads/LeadCard';
import { useRouter } from 'next/navigation';

interface KanbanBoardProps {
  leads: Lead[];
  onDrop: (updates: { id: string; status: string; order: number }[]) => Promise<void>;
}

export default function KanbanBoard({ leads, onDrop }: KanbanBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Local optimistic state — updated during drag, synced from prop on server refresh
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  // Keep local in sync with server data (but not while dragging)
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = localLeads.find(l => l.id === active.id);
    if (!activeItem) return;

    const overIsColumn = PIPELINE_COLUMNS.some(col => col.id === over.id);
    const overItem = localLeads.find(l => l.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as LeadStatus)
      : overItem?.status;

    if (!targetStatus || activeItem.status === targetStatus) return;

    // Optimistically update status in local state only — no API call here
    setLocalLeads(prev =>
      prev.map(l => l.id === activeItem.id ? { ...l, status: targetStatus } : l)
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      // Cancelled — reset local state to server state
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

    // Reorder within same column
    if (activeItem.status === targetStatus && !overIsColumn && overItem) {
      const colLeads = localLeads
        .filter(l => l.status === targetStatus)
        .sort((a, b) => a.order - b.order);
      const oldIdx = colLeads.findIndex(l => l.id === active.id);
      const newIdx = colLeads.findIndex(l => l.id === over.id);

      if (oldIdx !== newIdx) {
        const reordered = arrayMove(colLeads, oldIdx, newIdx).map((l, i) => ({ ...l, order: i }));
        const reorderedMap = new Map(reordered.map(l => [l.id, l]));
        finalLeads = localLeads.map(l => reorderedMap.get(l.id) ?? l);
        setLocalLeads(finalLeads);
      }
    }

    // Compute what changed vs the original server data
    const serverMap = new Map(leads.map(l => [l.id, l]));
    const changed = finalLeads.filter(l => {
      const orig = serverMap.get(l.id);
      return !orig || orig.status !== l.status || orig.order !== l.order;
    });

    if (changed.length > 0) {
      try {
        await onDrop(changed.map(({ id, status, order }) => ({ id, status, order })));
      } catch {
        // Rollback on error
        setLocalLeads(leads);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4 kanban-scroll">
        {PIPELINE_COLUMNS.map(col => {
          const colLeads = leadsByStatus[col.id] || [];
          return (
            <SortableContext
              key={col.id}
              id={col.id}
              items={colLeads.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                column={col}
                leads={colLeads}
                onClickLead={id => router.push(`/leads/${id}`)}
              />
            </SortableContext>
          );
        })}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
