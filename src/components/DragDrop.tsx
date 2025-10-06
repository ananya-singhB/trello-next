import { supabaseClient } from "@/lib/supabaseClient"
import { Card, List } from "@/types"
import { fetchCards } from "@/utils/helpers"
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import DraggableCard from "./DraggableCard"

const DragDrop = ({
  selectedBoardId,
  editingCardId,
  setEditingCardId,
  lists,
  handleFetchLists,
  cards,
  handleFetchCards,
  handleSetCards,
}: {
  selectedBoardId: number
  editingCardId: number | null
  setEditingCardId: Dispatch<SetStateAction<number | null>>
  lists: List[]
  handleFetchLists: () => void
  cards: Card[]
  handleFetchCards: () => void
  handleSetCards: (_: Card[]) => void
}) => {
  const [activeCardId, setActiveCardId] = useState<number | null>(null)

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as number)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCardId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeCard = cards.find((c) => c.card_id === active.id)
    if (!activeCard) return

    if (typeof over.id === "string" && over.id.startsWith("list-")) {
      const listId = Number(over.id.replace("list-", ""))
      if (activeCard.list_id === listId) return
      const updatedCardsExcludingActive = cards.filter(
        (c) => c.card_id !== activeCard.card_id
      )
      const targetListCards = updatedCardsExcludingActive
        .filter((c) => c.list_id === listId)
        .sort((a, b) => a.position - b.position)
      activeCard.list_id = listId
      const newTargetListCards = [...targetListCards, activeCard].map(
        (card, idx) => ({ ...card, position: idx })
      )
      const otherCards = updatedCardsExcludingActive.filter(
        (c) => c.list_id !== listId
      )
      handleSetCards([...otherCards, ...newTargetListCards])
      for (const card of newTargetListCards) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position, list_id: card.list_id })
          .eq("card_id", card.card_id)
      }
      return
    }

    if (typeof over.id === "string" && over.id.startsWith("card-end-")) {
      const listId = Number(over.id.replace("card-end-", ""))
      const updatedCardsExcludingActive = cards.filter(
        (c) => c.card_id !== activeCard.card_id
      )
      const targetListCards = updatedCardsExcludingActive
        .filter((c) => c.list_id === listId)
        .sort((a, b) => a.position - b.position)
      activeCard.list_id = listId
      const newTargetListCards = [...targetListCards, activeCard].map(
        (card, idx) => ({ ...card, position: idx })
      )
      const otherCards = updatedCardsExcludingActive.filter(
        (c) => c.list_id !== listId
      )
      handleSetCards([...otherCards, ...newTargetListCards])
      for (const card of newTargetListCards) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position, list_id: card.list_id })
          .eq("card_id", card.card_id)
      }
      return
    }

    const overCard = cards.find((c) => c.card_id === over.id)
    if (!overCard) return
    const activeListId = activeCard.list_id
    const overListId = overCard.list_id
    const activeListCards = cards
      .filter((c) => c.list_id === activeListId)
      .sort((a, b) => a.position - b.position)
      .filter((c) => c.card_id !== activeCard.card_id)
    let overListCards = cards
      .filter((c) => c.list_id === overListId)
      .sort((a, b) => a.position - b.position)

    if (activeListId === overListId) {
      const oldIndex = activeListCards.findIndex((c) => c.card_id === active.id)
      const newIndex = overListCards.findIndex((c) => c.card_id === over.id)
      const newCardsOrder = arrayMove(overListCards, oldIndex, newIndex).map(
        (card, idx) => ({ ...card, position: idx })
      )
      handleSetCards([
        ...cards.filter((c) => c.list_id !== activeListId),
        ...newCardsOrder,
      ])
      for (const card of newCardsOrder) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position })
          .eq("card_id", card.card_id)
      }
    } else {
      const newActiveListCards = activeListCards
      const overIndex = overListCards.findIndex((c) => c.card_id === over.id)
      const newOverListCards = [
        ...overListCards.slice(0, overIndex),
        activeCard,
        ...overListCards.slice(overIndex),
      ]
      activeCard.list_id = overListId
      const updatedActiveList = newActiveListCards.map((card, idx) => ({
        ...card,
        position: idx,
      }))
      const updatedOverList = newOverListCards.map((card, idx) => ({
        ...card,
        position: idx,
      }))
      handleSetCards([
        ...cards.filter(
          (c) => c.list_id !== activeListId && c.list_id !== overListId
        ),
        ...updatedActiveList,
        ...updatedOverList,
      ])
      for (const card of [...updatedActiveList, ...updatedOverList]) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position, list_id: card.list_id })
          .eq("card_id", card.card_id)
      }
    }
  }

  async function handleDeleteList(listId: number) {
    const hasCards = cards.some((c) => c.list_id === listId)

    if (
      !confirm(
        `Are you sure you want to delete this list?${
          hasCards ? " All cards under it will be deleted too." : ""
        }`
      )
    ) {
      return
    }

    const { error: delCardsError } = await supabaseClient
      .from("cards")
      .delete()
      .eq("list_id", listId)

    if (delCardsError) {
      alert("Error deleting cards in list: " + delCardsError.message)
      return
    }

    const { error: delListError } = await supabaseClient
      .from("lists")
      .delete()
      .eq("list_id", listId)

    if (delListError) {
      alert("Error deleting list: " + delListError.message)
      return
    }

    handleFetchLists()
    handleFetchCards()
  }

  function handleEditStart(card: Card) {
    if (editingCardId === null) {
      setEditingCardId(card.card_id)
    }
  }

  function handleDragCancel() {
    setActiveCardId(null)
  }

  function handleEditCancel() {
    setEditingCardId(null)
  }

  async function handleEditSave(
    cardId: number,
    title: string,
    description: string
  ) {
    await supabaseClient
      .from("cards")
      .update({ title, description })
      .eq("card_id", cardId)
    handleEditCancel()
    await fetchCards(selectedBoardId)
  }

  function DroppableListArea({
    id,
    children,
  }: {
    id: number
    children: React.ReactNode
  }) {
    const { isOver, setNodeRef } = useDroppable({ id: `list-${id}` })
    return (
      <div
        ref={setNodeRef}
        data-is-over={isOver}
        className={`droppable-list-area ${isOver ? "bg-blue-50" : ""}`}
        style={{ minHeight: "80vh" }}
      >
        {children}
      </div>
    )
  }

  function DropEndPlaceholder({ listId }: { listId: number }) {
    const { setNodeRef, isOver } = useDroppable({ id: `card-end-${listId}` })
    return (
      <li
        ref={setNodeRef}
        className={`flex items-center justify-center text-gray-400 transition border-dashed border-2 rounded ${
          isOver
            ? "bg-blue-100 border-blue-400 text-blue-600"
            : "bg-gray-100 border-gray-200"
        }`}
        style={{ minHeight: "180px" }}
      >
        Drop a card here
      </li>
    )
  }

  function EmptyListPlaceholder({ listId }: { listId: number }) {
    const { setNodeRef, isOver } = useDroppable({ id: `list-${listId}` })
    return (
      <li
        ref={setNodeRef}
        className={`flex items-center justify-center text-gray-400 transition border-dashed border-2 rounded ${
          isOver
            ? "bg-blue-100 border-blue-400 text-blue-600"
            : "bg-gray-100 border-gray-200"
        }`}
        style={{ minHeight: "180px" }}
      >
        Drop a card here
      </li>
    )
  }

  const activeCard = cards.find((card) => card?.card_id === activeCardId)

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-1 overflow-x-auto py-2 px-0.5">
        {lists.map((list) => {
          const cardsForList = cards
            .filter((card) => card.list_id === list.list_id)
            .sort((a, b) => a.position - b.position)

          return (
            <DroppableListArea key={list.list_id} id={list.list_id}>
              <div className="bg-white rounded shadow p-4 min-w-[250px] max-h-fit">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">{list.title}</h3>
                  <button
                    className="text-red-500 hover:text-red-700 font-bold px-2 text-xl hover:bg-gray-200 rounded"
                    onClick={() => handleDeleteList(list.list_id)}
                    aria-label={`Delete list ${list.title}`}
                    title="Delete list"
                  >
                    ×
                  </button>
                </div>
                <SortableContext
                  items={cardsForList.map((card) => card.card_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-1 overflow-y-auto">
                    {cardsForList.length === 0 ? (
                      <EmptyListPlaceholder listId={list.list_id} />
                    ) : (
                      <>
                        {cardsForList.map((card) => (
                          <DraggableCard
                            key={card.card_id}
                            card={card}
                            editingCardId={editingCardId}
                            onEditStart={handleEditStart}
                            onEditSave={handleEditSave}
                            onEditCancel={handleEditCancel}
                          />
                        ))}
                        <DropEndPlaceholder listId={list.list_id} />
                      </>
                    )}
                  </ul>
                </SortableContext>
              </div>
            </DroppableListArea>
          )
        })}
      </div>
      <DragOverlay>
        {activeCard ? (
          <DraggableCard
            card={activeCard}
            dragOverlay
            editingCardId={editingCardId}
            onEditStart={handleEditStart}
            onEditSave={handleEditSave}
            onEditCancel={handleEditCancel}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default DragDrop
