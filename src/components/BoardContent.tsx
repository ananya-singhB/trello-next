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

interface BoardContentProps {
  selectedBoardId: number;
  boards: Board[]
}

export default function BoardContent({ selectedBoardId, boards }: BoardContentProps) {
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [newListTitle, setNewListTitle] = useState("")
  const [newCardTitle, setNewCardTitle] = useState<{ [key: number]: string }>(
    {}
  )

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

  async function addList() {
    if (!newListTitle) return
    const nextPosition = lists.length
    await supabaseClient
      .from("lists")
      .insert([
        {
          title: newListTitle,
          board_id: selectedBoardId,
          position: nextPosition,
        },
      ])
    setNewListTitle("")
    fetchLists(selectedBoardId)
  }

  async function addCard(listId: number) {
    if (!newCardTitle[listId]) return
    const cardsForList = cards.filter((card) => card.list_id === listId)
    const nextPosition = cardsForList.length
    await supabaseClient
      .from("cards")
      .insert([
        {
          title: newCardTitle[listId],
          list_id: listId,
          board_id: selectedBoardId,
          position: nextPosition,
        },
      ])
    setNewCardTitle((prev) => ({ ...prev, [listId]: "" }))
    fetchCards(selectedBoardId)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
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

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">
        {boards.find((b) => b.board_id === selectedBoardId)?.title}
      </h2>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto">
          {lists.map((list) => (
            <div
              key={list.list_id}
              className="bg-white rounded shadow p-4 min-w-[250px]"
            >
              <div className="font-medium mb-2">{list.title}</div>
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 px-2 py-1 border border-gray-300 rounded"
                  placeholder="New card title"
                  value={newCardTitle[list.list_id] || ""}
                  onChange={(e) =>
                    setNewCardTitle((prev) => ({
                      ...prev,
                      [list.list_id]: e.target.value,
                    }))
                  }
                />
                <button
                  className="px-2 py-1 bg-blue-600 text-white rounded"
                  onClick={() => addCard(list.list_id)}
                  disabled={!newCardTitle[list.list_id]}
                >
                  Add Card
                </button>
              </div>
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
          <div className="bg-gray-100 rounded shadow p-4 min-w-[250px] flex flex-col justify-center items-center">
            <input
              className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
              placeholder="New list title"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={addList}
              disabled={!newListTitle}
            >
              Add List
            </button>
          </div>
        </div>
      </DndContext>
    </>
  )
}
