"use client"

import { useState, useEffect } from "react"
import { useBoardStore } from "@/store/useBoardStore"
import type { List } from "@/types"
import CreatableSelect from "react-select/creatable"

interface Props {
  onSuccess: () => void
  onClose: () => void
}

interface ListOption {
  label: string
  value: string
  __isNew__?: boolean
}

export default function AddCardForm({ onSuccess, onClose }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<ListOption | null>(null)

  const { lists, selectedBoardId, addCard, addList } = useBoardStore()

  const listOptions: ListOption[] = lists
    .filter((list) => list.board_id === selectedBoardId)
    .map((list) => ({
      label: list.title,
      value: list.list_id.toString(),
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !selectedOption) {
      alert("Please enter a title and select or create a list")
      return
    }

    setLoading(true)
    try {
      let listId: string

      if (selectedOption.__isNew__) {
        const trimmedLabel = selectedOption.label.trim()
        if (trimmedLabel.length < 3) {
          alert("List name must be at least 3 characters long.")
          setLoading(false)
          return
        }
        const newList = await addList(selectedBoardId || "", trimmedLabel)

        if (!newList) {
          alert("Failed to create list. Please try again.")
          setLoading(false)
          return
        }

        listId = newList.list_id
      } else {
        listId = selectedOption.value
      }

      await addCard(
        listId,
        selectedBoardId || "",
        title.trim(),
        description.trim()
      )

      setTitle("")
      setDescription("")
      setSelectedOption(null)
      onSuccess()
      onClose()
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

      <div>
        <label className="block mb-1 font-semibold">
          Select or Create List
        </label>
        <CreatableSelect
          isClearable
          isDisabled={loading}
          options={listOptions}
          value={selectedOption}
          onChange={(newValue) => setSelectedOption(newValue)}
          placeholder="Select existing or create a new list..."
        />
      </div>

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
