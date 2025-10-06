"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { List, Card, Board } from "@/types"
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
import DraggableCard from "./DraggableCard"
import Modal from "./Modal"
import AddListForm from "./AddListForm"
import AddCardForm from "./AddCardForm"

interface BoardContentProps {
  selectedBoardId: number
  boards: Board[]
}

function EditCardModal({
  card,
  open,
  onClose,
  onSave,
}: {
  card: Card | null
  open: boolean
  onClose: () => void
  onSave: (card: Card, title: string, description: string) => Promise<void>
}) {
  const [title, setTitle] = useState(card?.title ?? "")
  const [description, setDescription] = useState(card?.description ?? "")

  useEffect(() => {
    setTitle(card?.title ?? "")
    setDescription(card?.description ?? "")
  }, [card])

  return (
    <Modal open={open} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!card) return
          await onSave(card, title, description)
        }}
      >
        <h3 className="text-lg font-semibold">Edit Card</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Card Title"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Description (optional)"
          rows={3}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
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

export default function BoardContent({
  selectedBoardId,
  boards,
}: BoardContentProps) {
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])

  const [editCard, setEditCard] = useState<Card | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [cardModalListId, setCardModalListId] = useState<number | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  useEffect(() => {
    fetchLists(selectedBoardId)
    fetchCards(selectedBoardId)
  }, [selectedBoardId])

  async function fetchLists(boardId: number) {
    const { data } = await supabaseClient
      .from("lists")
      .select("*")
      .eq("board_id", boardId)
      .order("position")
    setLists(data || [])
  }

  async function fetchCards(boardId: number) {
    const { data } = await supabaseClient
      .from("cards")
      .select("*")
      .eq("board_id", boardId)
      .order("position")
    setCards(data || [])
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string)
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
      setCards([...otherCards, ...newTargetListCards])
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
      setCards([...otherCards, ...newTargetListCards])
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
      setCards([
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
      setCards([
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

  function handleDragCancel() {
    setActiveCardId(null)
  }

  function handleCloseListModal() {
    setIsListModalOpen(false)
  }

  function handleCloseCardModal() {
    setIsCardModalOpen(false)
  }

  async function handleEditCardSave(
    card: Card,
    title: string,
    description: string
  ) {
    await supabaseClient
      .from("cards")
      .update({ title, description })
      .eq("card_id", card.card_id)
    setShowEditModal(false)
    setEditCard(null)
    await fetchCards(selectedBoardId)
  }

  function handleEditStart(card: Card) {
    if (editingCardId === null) {
      setEditingCardId(card.card_id)
    }
  }

  function handleEditCancel() {
    setEditingCardId(null)
  }

  async function handleEditSave(
    cardId: string,
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

    await fetchLists(selectedBoardId)
    await fetchCards(selectedBoardId)
  }

  const activeCard = cards.find((card) => card.card_id === activeCardId)

  return (
    <div className="flex flex-col p-6">
      <div className="bg-gray-100 rounded shadow p-4 min-w-[280px] flex items-center justify-between mb-4">
        <h3 className="text-lg">Total lists: {lists?.length}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsListModalOpen(true)
              handleEditCancel()
            }}
            className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            + Add List
          </button>

          <button
            onClick={() => {
              setIsCardModalOpen(true)
              handleEditCancel()
            }}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            + Add Card
          </button>
        </div>
      </div>
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
                      className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 text-xl"
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
      <Modal open={isListModalOpen} onClose={handleCloseListModal}>
        <AddListForm
          boardId={selectedBoardId}
          onSuccess={() => {
            fetchLists(selectedBoardId)
            handleCloseListModal()
          }}
        />
      </Modal>
      <Modal open={isCardModalOpen} onClose={handleCloseCardModal}>
        <AddCardForm
          boardId={selectedBoardId}
          onSuccess={() => {
            fetchCards(selectedBoardId)
            fetchLists(selectedBoardId)
            setIsCardModalOpen(false)
          }}
          listId={cardModalListId}
        />
      </Modal>
      <EditCardModal
        card={editCard}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditCard(null)
        }}
        onSave={handleEditCardSave}
      />
    </div>
  )
}
