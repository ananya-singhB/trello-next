"use client"

import { useState, useEffect, Suspense } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Board } from "@/types"
import Sidebar from "@/components/Sidebar"

import dynamic from "next/dynamic"
import Loader from "@/components/Loader"

const BoardContent = dynamic(() => import("@/components/BoardContent"), {})

export default function BoardsPage() {
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
          sidebarOpen ? "w-64" : "w-0"
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
      <main className="flex-1 overflow-auto flex flex-col p-6">
        <Suspense fallback={<Loader />}>
          {selectedBoardId ? (
            <BoardContent selectedBoardId={selectedBoardId} boards={boards} />
          ) : (
            <div className="text-center text-gray-400 text-xl mt-20">
              No board selected
              <br />
              <span className="text-base">Create or select a board</span>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  )
}
