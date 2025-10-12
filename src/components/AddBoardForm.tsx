"use client"

import { useState } from "react"
import { useBoardStore } from "@/store/useBoardStore"

interface Props {
  onSuccess: () => void;
}

export default function AddBoardForm({ onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const addBoard = useBoardStore((state) => state.addBoard)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await addBoard(title.trim())
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
      <h3 className="text-lg font-semibold">Create New Board</h3>
      <input
        type="text"
        placeholder="Board title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={loading}
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={loading}
      >
        Save
      </button>
    </form>
  );
}
