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
}

export default function Sidebar({
  boards,
  selectedBoardId,
  onSelect,
  onBoardsChange,
  onDeleteBoard,
  sidebarOpen,
  setSidebarOpen,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<number | null>(null)

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

  console.log("boards in sidebar", boards)

  return (
    <aside className="border-r border-gray-300 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold">Boards</h2>
        <button
          onClick={() => setShowModal(true)}
          aria-label="Add Board"
          className="px-2 py-0.5 bg-green-600 text-white rounded-2xl hover:bg-green-700"
        >
          +
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto justify-center">
        {boards.length === 0 ? (
          <p className="text-gray-500 mt-2">No boards created</p>
        ) : (
          boards.map((board) => (
            <div
              key={board.board_id}
              className={`flex items-center justify-between px-4 py-2 ${
                selectedBoardId === board.board_id
                  ? "bg-blue-500 text-white border-r border-blue-500!"
                  : "hover:bg-blue-100 hover:text-black! odd:bg-white even:bg-gray-200"
              }`}
            >
              <span
                onClick={() => onSelect(board.board_id)}
                className="cursor-pointer flex-1 font-bold"
              >
                {board.title}
              </span>
              <button
                onClick={() => handleDelete(board.board_id)}
                className="ml-2 font-bold text-white bg-red-600 px-1.5 rounded hover:text-red-700"
                aria-label="Delete board"
              >
                &#10005;
              </button>
            </div>
          ))
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
