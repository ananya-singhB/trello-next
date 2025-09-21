"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/types";

interface DraggableCardProps {
  card: Card;
}

export default function DraggableCard({ card }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.card_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="px-2 py-1 bg-gray-200 rounded mb-1">
      {card.title}
    </li>
  );
}
