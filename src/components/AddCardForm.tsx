"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { List } from "@/types"
import CreatableSelect from "react-select/creatable"
import { fetchLists } from "@/utils/helpers"

interface Props {
  boardId: number
  onSuccess: () => void
}

interface ListOption {
  label: string
  value: string
  __isNew__?: boolean
}

export default function AddCardForm({ boardId, onSuccess }: Props) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [lists, setLists] = useState<List[]>([])
  const [selectedOption, setSelectedOption] = useState<ListOption | null>(null)

  useEffect(() => {
    handleLists()
  }, [boardId])

  async function handleLists() {
    const data = await fetchLists(boardId)
    setLists(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (!selectedOption) {
      alert("Please select or create a list")
      return
    }

    setLoading(true)

    try {
      let listId: number | null = null

      if (selectedOption.__isNew__) {
        const trimmedLabel = selectedOption.label.trim()
        if (trimmedLabel.length < 3) {
          alert("List name must be at least 3 characters long.")
          setLoading(false)
          return
        }
        const { data: newListData, error: newListError } = await supabaseClient
          .from("lists")
          .insert([
            {
              title: trimmedLabel,
              board_id: boardId,
              position: lists.length,
            },
          ])
          .select()
          .single()
        if (newListError || !newListData) {
          alert(newListError?.message || "Failed to create new list")
          setLoading(false)
          return
        }
        listId = newListData.list_id
      } else {
        listId = parseInt(selectedOption.value)
      }

      const { data: cardsInList } = await supabaseClient
        .from("cards")
        .select("*")
        .eq("board_id", boardId)
        .eq("list_id", listId)
        .order("position")

      const nextPosition = cardsInList?.length || 0

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
        setSelectedOption(null)
        onSuccess()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const listOptions: ListOption[] = lists.map((list) => ({
    label: list.title,
    value: list.list_id.toString(),
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Create New Card</h3>

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
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  )
}
