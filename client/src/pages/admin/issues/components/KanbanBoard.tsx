import { useRef, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Issue, KanbanBoard as KanbanBoardType, KanbanColumnStatus } from '@/types/issues';
import { KANBAN_COLUMNS } from '@/types/issues';
import { KanbanColumn } from './KanbanColumn';
import { IssueCard, type CardSize } from './IssueCard';
import { useUpdateIssueStatus } from '@/hooks/queries/useIssues';

interface KanbanBoardProps {
  board: KanbanBoardType;
  onCardClick: (issue: Issue) => void;
  onAddClick: (status: KanbanColumnStatus) => void;
  size?: CardSize;
}

export function KanbanBoard({ board, onCardClick, onAddClick, size }: KanbanBoardProps) {
  const [localBoard, setLocalBoard] = useState<KanbanBoardType>(board);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const snapshot = useRef<KanbanBoardType | null>(null);

  const updateStatusMutation = useUpdateIssueStatus();

  useEffect(() => {
    setLocalBoard(board);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumn(issueId: string): KanbanColumnStatus | null {
    for (const col of KANBAN_COLUMNS) {
      if (localBoard[col].some((i) => i.id === issueId)) return col;
    }
    return null;
  }

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const col = findColumn(id);
    if (!col) return;
    const issue = localBoard[col].find((i) => i.id === id) ?? null;
    setActiveIssue(issue);
    snapshot.current = structuredClone(localBoard);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const sourceCol = findColumn(activeId);
    const destCol: KanbanColumnStatus | null = KANBAN_COLUMNS.includes(overId as KanbanColumnStatus)
      ? (overId as KanbanColumnStatus)
      : findColumn(overId);

    if (!sourceCol || !destCol) return;

    if (sourceCol === destCol) {
      // Reorder within the same column
      setLocalBoard((prev) => {
        const items = [...prev[sourceCol]];
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { ...prev, [sourceCol]: arrayMove(items, oldIndex, newIndex) };
      });
      return;
    }

    // Move to a different column
    setLocalBoard((prev) => {
      const sourceItems = [...prev[sourceCol]];
      const destItems = [...prev[destCol]];
      const movedIndex = sourceItems.findIndex((i) => i.id === activeId);
      if (movedIndex === -1) return prev;
      const [moved] = sourceItems.splice(movedIndex, 1);

      const overIndex = destItems.findIndex((i) => i.id === overId);
      const insertAt = overIndex === -1 ? destItems.length : overIndex;
      destItems.splice(insertAt, 0, { ...moved, status: destCol });

      return { ...prev, [sourceCol]: sourceItems, [destCol]: destItems };
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) {
      if (snapshot.current) setLocalBoard(snapshot.current);
      snapshot.current = null;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const destCol: KanbanColumnStatus | null = KANBAN_COLUMNS.includes(overId as KanbanColumnStatus)
      ? (overId as KanbanColumnStatus)
      : findColumn(overId);

    if (!destCol) {
      if (snapshot.current) setLocalBoard(snapshot.current);
      snapshot.current = null;
      return;
    }

    const destItems = localBoard[destCol];
    const newIndex = destItems.findIndex((i) => i.id === activeId);
    const kanbanOrder = newIndex === -1 ? destItems.length : newIndex;

    updateStatusMutation.mutate(
      { id: activeId, status: destCol, kanbanOrder },
      {
        onError: () => {
          if (snapshot.current) setLocalBoard(snapshot.current);
        },
      },
    );

    snapshot.current = null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 pr-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible lg:pb-4 lg:pr-0">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            issues={localBoard[status] ?? []}
            onCardClick={onCardClick}
            onAddClick={onAddClick}
            size={size}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeIssue && (
          <div className="rotate-1 opacity-95 cursor-grabbing">
            <IssueCard issue={activeIssue} onClick={() => {}} size={size} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
