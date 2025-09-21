"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Board, List, Card } from "@/types"

export default function BoardsPage({ selectedBoardId }: { selectedBoardId: number | null }) {
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [newListTitle, setNewListTitle] = useState("")
  const [newCardTitle, setNewCardTitle] = useState<{ [key: number]: string }>({})

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

  useEffect(() => {
    if (selectedBoardId) {
      fetchLists(selectedBoardId)
      fetchCards(selectedBoardId)
    }
  }, [selectedBoardId])

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

  if (!selectedBoardId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select or create a board
      </div>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">
        {/* Optionally fetch board title if needed */}
      </h2>
      <div className="flex gap-6">
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
            <ul className="space-y-1">
              {cards
                .filter((card) => card.list_id === list.list_id)
                .sort((a, b) => a.position - b.position)
                .map((card) => (
                  <li
                    key={card.card_id}
                    className="px-2 py-1 bg-gray-200 rounded"
                  >
                    {card.title}
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {/* Add List */}
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
    </>
  )
}