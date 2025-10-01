"use client"

import { useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"

interface Props {
  boardId: number
  listId: number | null
  onSuccess: () => void
}

export default function AddCardForm({ listId, boardId, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function fetchCards(boardId: number) {
    const { data } = await supabaseClient
      .from("cards")
      .select("*")
      .eq("board_id", boardId)
      .order("position")

    return data
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || listId === null) return

    setLoading(true)

    try {
      const cards = (await fetchCards(boardId)) || []
      const cardsForList = cards.filter((card) => card.list_id === listId)
      const nextPosition = cardsForList.length
      const { error } = await supabaseClient.from("cards").insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          list_id: listId,
          board_id: boardId,
          position: nextPosition,
        },
      ])
      if (error) {
        alert(error.message)
      } else {
        setTitle("")
        setDescription("")
        onSuccess()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add New Card</h3>
      <input
        type="text"
        placeholder="Card title"
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
        required
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        {loading ? "Adding..." : "Add Card"}
      </button>
    </form>
  )
}
