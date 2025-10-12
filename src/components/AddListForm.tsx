"use client"

import { useState } from "react"
import { useBoardStore } from "@/store/useBoardStore"

interface Props {
  onSuccess: () => void
}

export default function AddListForm({ onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { selectedBoardId, addList } = useBoardStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await addList(selectedBoardId || "", title.trim())
      setTitle("")
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  )
}
