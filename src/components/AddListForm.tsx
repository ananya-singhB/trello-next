"use client"

import { useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"

interface Props {
  boardId: number
  onSuccess: () => void
}

export default function AddListForm({ boardId, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  async function fetchLists(boardId: number) {
    const { data } = await supabaseClient
      .from("lists")
      .select("*")
      .eq("board_id", boardId)
      .order("position")
    return { data }
  }

  async function handleSubmit(e: React.FormEvent) {
    try {
      e.preventDefault()
      if (!title) return
      setLoading(true)

      // Position is count of existing lists
      const { data: existingLists = [] } = await fetchLists(boardId)

      const nextPosition = existingLists?.length || 0

      const { error } = await supabaseClient
        .from("lists")
        .insert([{ title, board_id: boardId, position: nextPosition }])
      if (error) {
        alert(error.message)
      } else {
        onSuccess()
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
      setTitle("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Create New List</h3>
      <input
        type="text"
        placeholder="List title"
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
        required
      />
      <div className="flex justify-start gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          Save
        </button>
      </div>
    </form>
  )
}
