"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Board, List, Card } from "@/types"
import Sidebar from "@/components/Sidebar"

import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface DraggableCardProps {
  card: Card
}

function DraggableCard({ card }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: card.card_id,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-2 py-1 bg-gray-200 rounded mb-1"
    >
      {card.title}
    </li>
  )
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [newBoardTitle, setNewBoardTitle] = useState("")
  const [newListTitle, setNewListTitle] = useState("")
  const [newCardTitle, setNewCardTitle] = useState<{ [key: number]: string }>(
    {}
  )

  useEffect(() => {
    fetchBoards()
  }, [])

  useEffect(() => {
    if (selectedBoardId) {
      fetchLists(selectedBoardId)
      fetchCards(selectedBoardId)
    } else {
      setLists([])
      setCards([])
    }
  }, [selectedBoardId])

  async function fetchBoards() {
    const { data } = await supabaseClient
      .from("boards")
      .select("*")
      .order("created_at")
    setBoards(data || [])
    if (data && data.length > 0) {
      setSelectedBoardId(data[0].board_id)
    }
  }

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

  async function addBoard() {
    if (!newBoardTitle) return
    await supabaseClient.from("boards").insert([{ title: newBoardTitle }])
    setNewBoardTitle("")
    fetchBoards()
  }

  async function deleteBoard(boardId: number) {
    await supabaseClient.from("boards").delete().eq("board_id", boardId)
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null)
      setLists([])
      setCards([])
    }
    fetchBoards()
  }

  async function addList() {
    if (!selectedBoardId || !newListTitle) return
    const nextPosition = lists.length
    await supabaseClient.from("lists").insert([
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
    if (!selectedBoardId || !newCardTitle[listId]) return
    const cardsForList = cards.filter((card) => card.list_id === listId)
    const nextPosition = cardsForList.length
    await supabaseClient.from("cards").insert([
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

  //   async function handleDragEnd(event: DragEndEvent) {
  //     const { active, over } = event
  //     if (!over || active.id === over.id) return

  //     // Get all cards for same list
  //     const activeCard = cards.find((c) => c.card_id === active.id)
  //     const overCard = cards.find((c) => c.card_id === over.id)
  //     if (!activeCard || !overCard) return
  //     if (activeCard.list_id !== overCard.list_id) return // Only reorder within same list here

  //     const cardsForList = cards.filter((c) => c.list_id === activeCard.list_id)

  //     const oldIndex = cardsForList.findIndex((c) => c.card_id === active.id)
  //     const newIndex = cardsForList.findIndex((c) => c.card_id === over.id)

  //     const newCardsOrder = arrayMove(cardsForList, oldIndex, newIndex).map(
  //       (card, index) => ({ ...card, position: index })
  //     )

  //     // Update local state
  //     const otherCards = cards.filter((c) => c.list_id !== activeCard.list_id)
  //     setCards([...otherCards, ...newCardsOrder])

  //     // Persist positions in DB
  //     for (const card of newCardsOrder) {
  //       await supabaseClient
  //         .from("cards")
  //         .update({ position: card.position })
  //         .eq("card_id", card.card_id)
  //     }
  //   }

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

    // Cards in target list (include active card if moving across)
    let overListCards = cards
      .filter((c) => c.list_id === overListId)
      .sort((a, b) => a.position - b.position)

    if (activeListId === overListId) {
      // Moving within the same list

      const oldIndex = activeListCards.findIndex((c) => c.card_id === active.id)
      const newIndex = overListCards.findIndex((c) => c.card_id === over.id)

      const newCardsOrder = arrayMove(overListCards, oldIndex, newIndex).map(
        (card, index) => ({ ...card, position: index })
      )

      setCards([
        ...cards.filter((c) => c.list_id !== activeListId),
        ...newCardsOrder,
      ])

      // Persist changes
      for (const card of newCardsOrder) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position })
          .eq("card_id", card.card_id)
      }
    } else {
      // Moving card between lists

      // Remove active card from old list
      const newActiveListCards = activeListCards

      // Insert active card into new list at overCard's position
      const overIndex = overListCards.findIndex((c) => c.card_id === over.id)
      const newOverListCards = [
        ...overListCards.slice(0, overIndex),
        activeCard,
        ...overListCards.slice(overIndex),
      ]

      // Update activeCard's list_id to new list
      activeCard.list_id = overListId

      // Recalculate positions in both lists
      const updatedActiveList = newActiveListCards.map((card, idx) => ({
        ...card,
        position: idx,
      }))
      const updatedOverList = newOverListCards.map((card, idx) => ({
        ...card,
        position: idx,
      }))

      // Update local state
      setCards([
        ...cards.filter(
          (c) => c.list_id !== activeListId && c.list_id !== overListId
        ),
        ...updatedActiveList,
        ...updatedOverList,
      ])

      // Persist updates for the two lists
      for (const card of [...updatedActiveList, ...updatedOverList]) {
        await supabaseClient
          .from("cards")
          .update({ position: card.position, list_id: card.list_id })
          .eq("card_id", card.card_id)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 w-full">
      <div
        className={`flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white shadow h-full overflow-y-auto`}
      >
        <Sidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelect={(id) => setSelectedBoardId(id)}
          onBoardsChange={fetchBoards}
          onDeleteBoard={deleteBoard}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col p-6">
        {!selectedBoardId ? (
          <div className="text-center text-gray-400 text-xl mt-20">
            No board selected
            <br />
            <span className="text-base">Create or select a board</span>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">
              {boards.find((b) => b.board_id === selectedBoardId)?.title}
            </h2>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
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
        )}
      </main>
    </div>
  )
}
