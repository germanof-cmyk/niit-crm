'use client';

import { useState, useMemo } from 'react';
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
  onUpdateLead: (id: string, data: Partial<Lead>) => void;
  onUpdateOrder: (leads: Lead[]) => void;
}

export default function KanbanBoard({ leads, onUpdateLead, onUpdateOrder }: KanbanBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {} as Record<LeadStatus, Lead[]>;
    PIPELINE_COLUMNS.forEach(col => {
      map[col.id] = leads
        .filter(l => l.status === col.id)
        .sort((a, b) => a.order - b.order);
    });
    return map;
  }, [leads]);

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeLeadItem = leads.find(l => l.id === active.id);
    if (!activeLeadItem) return;

    // Check if dragging over a column (not a card)
    const overIsColumn = PIPELINE_COLUMNS.some(col => col.id === over.id);
    const overLeadItem = leads.find(l => l.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as LeadStatus)
      : overLeadItem?.status;

    if (!targetStatus || activeLeadItem.status === targetStatus) return;

    // Update status when moving to a new column
    onUpdateLead(activeLeadItem.id, { status: targetStatus });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeLeadItem = leads.find(l => l.id === active.id);
    if (!activeLeadItem) return;

    const overLeadItem = leads.find(l => l.id === over.id);
    const overIsColumn = PIPELINE_COLUMNS.some(col => col.id === over.id);

    const targetStatus = overIsColumn
      ? (over.id as LeadStatus)
      : overLeadItem?.status || activeLeadItem.status;

    if (activeLeadItem.status === targetStatus && !overIsColumn && overLeadItem) {
      // Reorder within same column
      const colLeads = leads
        .filter(l => l.status === targetStatus)
        .sort((a, b) => a.order - b.order);

      const oldIndex = colLeads.findIndex(l => l.id === active.id);
      const newIndex = colLeads.findIndex(l => l.id === over.id);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(colLeads, oldIndex, newIndex).map((l, i) => ({
          ...l,
          order: i,
        }));
        onUpdateOrder(reordered);
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
