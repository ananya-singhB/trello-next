"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { List, Card, Board } from "@/types"

import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
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

export default function BoardContent({
  selectedBoardId,
  boards,
}: BoardContentProps) {
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])

  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [cardModalListId, setCardModalListId] = useState<number | null>(null)

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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    console.log("active, over____", active, over)
    if (!over || active.id === over.id) return

    const activeCard = cards.find((c) => c.card_id === active.id)
    const overCard = cards.find((c) => c.card_id === over.id)
    if (!activeCard || !overCard) return

    const activeListId = activeCard.list_id
    const overListId = overCard.list_id

    // Cards in source list without active card
    const activeListCards = cards
      .filter((c) => c.list_id === activeListId)
      .sort((a, b) => a.position - b.position)
      .filter((c) => c.card_id !== activeCard.card_id)

    // Cards in target list including active card if moving
    let overListCards = cards
      .filter((c) => c.list_id === overListId)
      .sort((a, b) => a.position - b.position)

    if (activeListId === overListId) {
      // Reordering within same list
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
      // Moving card between lists
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

  function handleCloseListModal() {
    setIsListModalOpen(false)
  }

  function handleCloseCardModal() {
    setIsCardModalOpen(false)
  }

  return (
    <div className="flex flex-col p-6">
      <div className="bg-gray-100 rounded shadow p-4 min-w-[250px] flex items-center justify-between mb-4">
        <h3 className="text-lg">Total lists: {lists?.length}</h3>
        <div className="flex">
          <button
            onClick={() => setIsListModalOpen(true)}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Add List
          </button>
        </div>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-1 overflow-x-auto h-screen py-2 px-0.5">
          {lists.map((list) => (
            <div
              key={list.list_id}
              className="bg-white rounded shadow p-4 min-w-[250px]"
            >
              <h3 className="text-lg font-bold mb-2">{list.title}</h3>
              <button
                onClick={() => {
                  setCardModalListId(list.list_id)
                  setIsCardModalOpen(true)
                }}
                className="mb-2 px-2 py-0.5 bg-blue-500 text-white rounded"
              >
                Add Card
              </button>
              <SortableContext
                items={cards
                  .filter((card) => card.list_id === list.list_id)
                  .map((card) => card.card_id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1 max-h-[500px] overflow-y-auto">
                  {cards
                    .filter((card) => card.list_id === list.list_id)
                    .sort((a, b) => a.position - b.position)
                    .map((card) => (
                      <DraggableCard key={card.card_id} card={card} />
                    ))}
                </ul>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      <Modal open={isListModalOpen} onClose={handleCloseListModal}>
        <AddListForm
          boardId={selectedBoardId}
          onSuccess={() => {
            // show toast message
            fetchLists(selectedBoardId)
            handleCloseListModal()
          }}
        />
      </Modal>

      <Modal open={isCardModalOpen} onClose={handleCloseCardModal}>
        <AddCardForm
          boardId={selectedBoardId}
          onSuccess={() => {
            // show toast message
            fetchCards(selectedBoardId)
            handleCloseCardModal()
          }}
          listId={cardModalListId}
        />
      </Modal>
    </div>
  )
}
