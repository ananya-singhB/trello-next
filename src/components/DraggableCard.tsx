"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Card } from "@/types"

interface DraggableCardProps {
  card: Card
  dragOverlay?: boolean
  onDoubleClick: (card: Card) => void
}

export default function DraggableCard({
  card,
  dragOverlay,
  onDoubleClick,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.card_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 bg-gray-200 rounded mb-1 flex-1 ${
        dragOverlay ? "shadow-lg scale-105 z-50" : ""
      }`}
      onDoubleClick={() => onDoubleClick(card)}
    >
      <h4 className="font-semibold truncate">{card.title}</h4>
      {card.description && (
        <p className="text-gray-600 mt-1 text-sm whitespace-pre-wrap truncate">
          {card.description}
        </p>
      )}
    </div>
  )
}
