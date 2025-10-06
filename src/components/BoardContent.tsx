"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabaseClient"
import type { List, Card, Board } from "@/types"
import Modal from "./Modal"
import AddListForm from "./AddListForm"
import AddCardForm from "./AddCardForm"
import { fetchCards, fetchLists } from "@/utils/helpers"
import DragDrop from "./DragDrop"

interface BoardContentProps {
  selectedBoardId: number
}

function EditCardModal({
  card,
  open,
  onClose,
  onSave,
}: {
  card: Card | null
  open: boolean
  onClose: () => void
  onSave: (card: Card, title: string, description: string) => Promise<void>
}) {
  const [title, setTitle] = useState(card?.title ?? "")
  const [description, setDescription] = useState(card?.description ?? "")

  useEffect(() => {
    setTitle(card?.title ?? "")
    setDescription(card?.description ?? "")
  }, [card])

  return (
    <Modal open={open} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!card) return
          await onSave(card, title, description)
        }}
      >
        <h3 className="text-lg font-semibold">Edit Card</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Enter Card Title"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Description (optional)"
          rows={3}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function BoardContent({ selectedBoardId }: BoardContentProps) {
  const [lists, setLists] = useState<List[]>([])
  const [cards, setCards] = useState<Card[]>([])

  const [editCard, setEditCard] = useState<Card | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)

  async function handleFetchLists() {
    const listsData = await fetchLists(selectedBoardId)
    setLists(listsData)
  }

  async function handleFetchCards() {
    const listsData = await fetchCards(selectedBoardId)
    setCards(listsData)
  }

  useEffect(() => {
    handleFetchLists()
    handleFetchCards()
  }, [selectedBoardId])

  function handleSetCards(cardsData: Card[]) {
    setCards(cardsData)
  }

  function handleCloseListModal() {
    setIsListModalOpen(false)
  }

  function handleCloseCardModal() {
    setIsCardModalOpen(false)
  }

  async function handleEditCardSave(
    card: Card,
    title: string,
    description: string
  ) {
    await supabaseClient
      .from("cards")
      .update({ title, description })
      .eq("card_id", card.card_id)
    setShowEditModal(false)
    setEditCard(null)
  }

  function handleEditCancel() {
    setEditingCardId(null)
  }

  return (
    <div className="flex flex-col p-6">
      <div className="bg-gray-100 rounded shadow p-4 min-w-[280px] flex items-center justify-between mb-4">
        <h3 className="text-lg">Total lists: {lists?.length}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsListModalOpen(true)
              handleEditCancel()
            }}
            className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            + Create List
          </button>

          <button
            onClick={() => {
              setIsCardModalOpen(true)
              handleEditCancel()
            }}
            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            + Create Card
          </button>
        </div>
      </div>

      <DragDrop
        selectedBoardId={selectedBoardId}
        editingCardId={editingCardId}
        setEditingCardId={setEditingCardId}
        lists={lists}
        handleFetchLists={handleFetchLists}
        cards={cards}
        handleFetchCards={handleFetchCards}
        handleSetCards={handleSetCards}
      />
      <Modal open={isListModalOpen} onClose={handleCloseListModal}>
        <AddListForm
          boardId={selectedBoardId}
          onSuccess={() => {
            fetchLists(selectedBoardId)
            handleCloseListModal()
          }}
        />
      </Modal>
      <Modal open={isCardModalOpen} onClose={handleCloseCardModal}>
        <AddCardForm
          boardId={selectedBoardId}
          onSuccess={() => {
            handleFetchLists()
            handleFetchCards()
            setIsCardModalOpen(false)
          }}
        />
      </Modal>
      <EditCardModal
        card={editCard}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditCard(null)
        }}
        onSave={handleEditCardSave}
      />
    </div>
  )
}
