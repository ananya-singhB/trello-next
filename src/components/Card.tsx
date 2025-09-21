'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '@/types';

interface Props {
  card: CardType;
}

export default function Card({ card }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.card_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 p-2 bg-gray-200 rounded cursor-grab"
    >
      {card.title}
    </div>
  );
}
