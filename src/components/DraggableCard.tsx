"use client"

import { useState, useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Card } from "@/types"

interface DraggableCardProps {
  card: Card
  dragOverlay?: boolean
  editingCardId?: string | null
  onEditStart?: (card: Card) => void
  onEditSave?: (cardId: string, title: string, description: string) => void
  onEditCancel?: () => void
}

export default function DraggableCard({
  card,
  dragOverlay,
  editingCardId,
  onEditStart,
  onEditSave,
  onEditCancel,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: card.card_id,
    })
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editingCardId === card?.card_id && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingCardId, card.card_id])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  }

  const isEditing = editingCardId === card?.card_id

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!isEditing ? listeners : {})}
      className={`px-2 py-1 bg-gray-200 rounded mb-1 flex-1 w-[250px] ${
        dragOverlay ? "shadow-lg scale-105 z-50" : ""
      }`}
      onDoubleClick={() => !isEditing && onEditStart?.(card)}
    >
      {!isEditing ? (
        <div
          className="transition-transform duration-300 ease-out origin-top"
          style={{
            transform: isEditing ? "scaleY(0)" : "scaleY(1)",
            opacity: isEditing ? 0 : 1,
            pointerEvents: isEditing ? "none" : "auto",
          }}
          aria-hidden={isEditing}
        >
          <h4 className="font-semibold truncate">{card.title}</h4>
          {card.description && (
            <p className="text-gray-600 mt-1 text-sm whitespace-pre-wrap truncate">
              {card.description}
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onEditSave?.(card.card_id, title, description)
          }}
          className="transition-transform duration-300 ease-in origin-top space-y-1 mt-2"
          style={{
            transform: isEditing ? "scaleY(1)" : "scaleY(0)",
            opacity: isEditing ? 1 : 0,
            pointerEvents: isEditing ? "auto" : "none",
            height: isEditing ? "auto" : 0,
          }}
          aria-hidden={!isEditing}
        >
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1 border-[0.5px] rounded focus:ring-2 focus:ring-blue-500 focus:outline-0 focus:border-blue-500"
            autoFocus
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1 border-[0.5px] rounded focus:ring-2 focus:ring-blue-500 focus:outline-0 focus:border-blue-500"
            rows={2}
            placeholder="Description (optional)"
          />
          <div className="flex gap-2 justify-end mt-1">
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onEditCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
