"use client"

import { useState, useEffect } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Board } from "@/types"
import Sidebar from "@/components/Sidebar"

import dynamic from "next/dynamic"

import { useRouter } from "next/navigation"
import Boards from "@/components/Boards"

export default function BoardsPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchBoards()
  }, [])

  async function fetchBoards() {
    const { data } = await supabaseClient
      .from("boards")
      .select("*")
      .order("created_at")
    setBoards(data || [])
    if (data && data.length > 0) {
      setSelectedBoardId(data[0].board_id)
    }
  }

  async function deleteBoard(boardId: number) {
    await supabaseClient.from("boards").delete().eq("board_id", boardId)
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null)
    }
    fetchBoards()
  }

  return (
    <div className="flex h-screen bg-gray-50 w-full">
      <div
        className={`flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white shadow h-full overflow-y-auto`}
      >
        <Sidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelect={(id) => setSelectedBoardId(id)}
          onBoardsChange={fetchBoards}
          onDeleteBoard={deleteBoard}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="flex justify-between p-4 bg-white shadow sticky top-0 z-10 text-center align-middle">
          <h2 className="text-2xl font-bold">
            {boards.find((b) => b.board_id === selectedBoardId)?.title}
          </h2>
          <button
            onClick={() => router.push("/profile")}
            aria-label="Go to profile"
            className="hover:bg-gray-200 rounded-full p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-600 rounded-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A8.966 8.966 0 0112 15a8.966 8.966 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </header>
        <Boards selectedBoardId={selectedBoardId} boards={boards} />
      </main>
    </div>
  )
}
