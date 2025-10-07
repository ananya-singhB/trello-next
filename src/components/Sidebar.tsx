"use client"

import { useState } from "react"
import Modal from "./Modal"
import AddBoardForm from "./AddBoardForm"
import type { Board } from "@/types"

interface Props {
  boards: Board[]
  selectedBoardId: number | null
  onSelect: (id: number) => void
  onBoardsChange: () => void
  onDeleteBoard: (id: number) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  onUpdateBoardTitle: (id: number, title: string) => Promise<void>
}

export default function Sidebar({
  boards,
  selectedBoardId,
  onSelect,
  onBoardsChange,
  onDeleteBoard,
  sidebarOpen,
  setSidebarOpen,
  onUpdateBoardTitle,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<number | null>(null)

  const [editingBoardId, setEditingBoardId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [saving, setSaving] = useState(false)

  function handleDelete(board_id: number) {
    setBoardToDelete(board_id)
    setShowDeleteModal(true)
  }

  function confirmDelete() {
    if (boardToDelete !== null) {
      onDeleteBoard(boardToDelete)
      setShowDeleteModal(false)
      setBoardToDelete(null)
    }
  }

  function startEdit(board: Board) {
    if (editingBoardId && editingBoardId !== board.board_id) return
    setEditingBoardId(board.board_id)
    setEditTitle(board.title)
  }

  function cancelEdit() {
    setEditingBoardId(null)
    setEditTitle("")
    setSaving(false)
  }

  async function handleSave(boardId: number) {
    const title = editTitle.trim()
    if (title.length < 3) {
      alert("Board name must be at least 3 characters.")
      return
    }
    setSaving(true)
    try {
      await onUpdateBoardTitle(boardId, title)
      onBoardsChange()
      cancelEdit()
    } catch (err: any) {
      alert(err?.message || "Failed to update board title.")
      setSaving(false)
    }
  }

  if (!sidebarOpen) {
    return (
      <aside className="flex flex-col h-full border-r border-gray-200">
        <button
          className="m-4 p-1 bg-gray-100 hover:bg-gray-300 focus:outline-none flex flex-col gap-1 items-center justify-center w-8 h-8 shadow"
          aria-label="Open Sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="block w-4 h-0.5 bg-gray-800"></span>
          <span className="block w-4 h-0.5 bg-gray-800"></span>
          <span className="block w-4 h-0.5 bg-gray-800"></span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="flex flex-col h-full border-r border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-300 pb-2">
        <div className="m-4 p-1 bg-gray-100 hover:bg-gray-300 focus:outline-none flex flex-col gap-1 items-center justify-center w-8 h-8 shadow">
          <button
            className="font-bold"
            aria-label="Close Sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            &#10005;
          </button>
        </div>
        <div
          className="flex items-center gap-2 hover:bg-gray-200 py-0.5 px-1.5 rounded mr-2"
          onClick={() => setShowModal(true)}
        >
          <h2 className="text-lg font-semibold cursor-pointer">Create Board</h2>
          <button
            onClick={() => setShowModal(true)}
            aria-label="Create Board"
            className="px-2 py-0.5 bg-green-600 text-white rounded-2xl hover:bg-green-700"
          >
            +
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto justify-center">
        {boards.length === 0 ? (
          <p className="text-gray-500 mt-2">No boards created</p>
        ) : (
          boards.map((board) => {
            const isActive = selectedBoardId === board.board_id
            const isEditing = editingBoardId === board.board_id

            return (
              <div
                key={board.board_id}
                className={`flex items-center justify-between px-4 py-2 ${
                  isActive
                    ? "bg-black text-white border-r border-blue-500!"
                    : "hover:bg-blue-100 hover:text-black! odd:bg-white even:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {!isEditing ? (
                    <span
                      onClick={() => onSelect(board.board_id)}
                      className="cursor-pointer flex-1 font-bold"
                    >
                      {board.title}
                    </span>
                  ) : (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`flex-1 px-2 py-1 rounded border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none bg-white ${
                        isActive ? "text-black" : ""
                      }`}
                      disabled={saving}
                      placeholder="Board name"
                    />
                  )}

                  {!isEditing && (
                    <button
                      onClick={() => startEdit(board)}
                      className={`px-1.5 rounded hover:bg-gray-300 ${
                        isActive
                          ? "text-white hover:text-black"
                          : "text-gray-700"
                      } -scale-x-100 inline-block`}
                      aria-label="Edit board name"
                      title="Edit"
                    >
                      ✎
                    </button>
                  )}

                  {isEditing && (
                    <>
                      <button
                        onClick={() => handleSave(board.board_id)}
                        disabled={saving}
                        className={`px-1.5 rounded hover:bg-green-100 text-green-700 disabled:opacity-50`}
                        aria-label="Save board name"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-1.5 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
                        aria-label="Cancel editing"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  )}

                  {!isEditing && (
                    <button
                      onClick={() => handleDelete(board.board_id)}
                      className={`ml-1 font-bold px-1.5 rounded ${
                        isActive
                          ? "text-white hover:text-white hover:bg-red-700"
                          : "text-red-600 hover:bg-red-100"
                      }`}
                      aria-label="Delete board"
                      title="Delete"
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </nav>

      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <AddBoardForm
          onSuccess={() => {
            onBoardsChange()
            setShowModal(false)
          }}
        />
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Delete Board</h3>
          <p className="mb-4">Are you sure you want to delete this board?</p>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
