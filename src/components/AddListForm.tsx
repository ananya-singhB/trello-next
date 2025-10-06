"use client"

import { useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import { fetchLists } from "@/utils/helpers"

interface Props {
  boardId: number
  onSuccess: () => void
}

export default function AddListForm({ boardId, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    try {
      e.preventDefault()
      if (!title) return
      setLoading(true)

      // Position is count of existing lists
      const data = await fetchLists(boardId)

      const nextPosition = data?.length || 0

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
        placeholder="Enter List Title"
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
