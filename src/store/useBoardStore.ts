import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { supabaseClient } from "@/lib/supabaseClient"
import type { Board, List, Card } from "@/types"
import { User } from "@supabase/supabase-js"

interface BoardStore {
  user: User | null
  userEmail: string | null
  userLoading: boolean

  boards: Board[]
  lists: List[]
  cards: Card[]
  selectedBoardId: number | null
  loading: boolean
  error: string | null
  cardsVersion: number

  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  clearUser: () => void

  fetchBoards: () => Promise<void>
  addBoard: (title: string) => Promise<void>
  updateBoard: (id: number, title: string) => Promise<void>
  deleteBoard: (id: number) => Promise<void>

  setSelectedBoardId: (id: number | null) => void

  fetchLists: (boardId: number) => Promise<void>
  addList: (boardId: number, title: string) => Promise<List | null>
  updateList: (id: number, title: string) => Promise<void>
  deleteList: (id: number) => Promise<void>

  fetchCards: (boardId: number) => Promise<void>
  addCard: (
    listId: number,
    boardId: number,
    title: string,
    description?: string
  ) => Promise<void>
  updateCard: (id: number, title: string, description: string) => Promise<void>
  deleteCard: (id: number) => Promise<void>
  updateCardPositions: (
    updates: Array<{ card_id: number; list_id: number; position: number }>
  ) => Promise<void>

  setCards: (cards: Card[]) => void
  setLists: (lists: List[]) => void
}

export const useBoardStore = create<BoardStore>()(
  devtools(
    (set, get) => ({
      user: null,
      userEmail: null,
      userLoading: false,

      boards: [],
      lists: [],
      cards: [],
      selectedBoardId: null,
      loading: false,
      error: null,
      cardsVersion: 0,

      fetchUser: async () => {
        set({ userLoading: true })
        try {
          const { data, error } = await supabaseClient.auth.getUser()

          if (error) {
            console.error("Error fetching user:", error)
            set({ user: null, userEmail: null, userLoading: false })
            throw error
          }

          console.log("user data", data)
          set({
            user: data.user,
            userEmail: data.user?.email ?? null,
            userLoading: false,
          })
        } catch (error: any) {
          set({ error: error.message, userLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          const { error } = await supabaseClient.auth.signOut()
          if (error) throw error

          set({
            user: null,
            userEmail: null,
            boards: [],
            lists: [],
            cards: [],
            selectedBoardId: null,
          })
        } catch (error: any) {
          console.error("Logout error:", error)
          set({ error: error.message })
        }
      },

      clearUser: () => {
        set({
          user: null,
          userEmail: null,
          boards: [],
          lists: [],
          cards: [],
          selectedBoardId: null,
        })
      },

      fetchBoards: async () => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabaseClient
            .from("boards")
            .select("*")
            .order("created_at", { ascending: false })

          if (error) throw error

          const sortedBoards = (data || []).sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )

          set({ boards: sortedBoards, loading: false })

          const { selectedBoardId } = get()
          if (!selectedBoardId && sortedBoards.length > 0) {
            get().setSelectedBoardId(sortedBoards[0].board_id)
          }
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      addBoard: async (title: string) => {
        try {
          const { data, error } = await supabaseClient
            .from("boards")
            .insert([{ title }])
            .select()
            .single()

          if (error) throw error
          if (data) {
            set((state) => ({ boards: [...state.boards, data] }))
            get().setSelectedBoardId(data.board_id)

            return data
          }
          return null
        } catch (error: any) {
          set({ error: error.message })
          return null
        }
      },

      updateBoard: async (id: number, title: string) => {
        try {
          const { error } = await supabaseClient
            .from("boards")
            .update({ title: title.trim() })
            .eq("board_id", id)

          if (error) throw error

          set((state) => ({
            boards: state.boards.map((b) =>
              b.board_id === id ? { ...b, title: title.trim() } : b
            ),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      deleteBoard: async (id: number) => {
        try {
          // Delete cards and lists inside board first and then the board
          await supabaseClient.from("cards").delete().eq("board_id", id)
          await supabaseClient.from("lists").delete().eq("board_id", id)
          const { error } = await supabaseClient
            .from("boards")
            .delete()
            .eq("board_id", id)

          if (error) throw error

          set((state) => ({
            boards: state.boards.filter((b) => b.board_id !== id),
            selectedBoardId:
              state.selectedBoardId === id ? null : state.selectedBoardId,
            lists: state.lists.filter((l) => l.board_id !== id),
            cards: state.cards.filter((c) => c.board_id !== id),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      setSelectedBoardId: (id: number | null) => {
        set({ selectedBoardId: id })
        if (id) {
          get().fetchLists(id)
          get().fetchCards(id)
        } else {
          set({ lists: [], cards: [] })
        }
      },

      fetchLists: async (boardId: number) => {
        try {
          const { data, error } = await supabaseClient
            .from("lists")
            .select("*")
            .eq("board_id", boardId)
            .order("position")

          if (error) throw error
          set({ lists: data || [] })
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      addList: async (boardId: number, title: string) => {
        try {
          const { lists } = get()
          const position = lists.filter((l) => l.board_id === boardId).length

          const { data, error } = await supabaseClient
            .from("lists")
            .insert([{ title, board_id: boardId, position }])
            .select()
            .single()

          if (error) throw error
          if (data) {
            set((state) => ({ lists: [...state.lists, data] }))
            return data
          }
        } catch (error: any) {
          set({ error: error.message })
          return null
        }
      },

      updateList: async (id: number, title: string) => {
        try {
          const { error } = await supabaseClient
            .from("lists")
            .update({ title })
            .eq("list_id", id)

          if (error) throw error

          set((state) => ({
            lists: state.lists.map((l) =>
              l.list_id === id ? { ...l, title } : l
            ),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      deleteList: async (id: number) => {
        try {
          const { count } = await supabaseClient
            .from("cards")
            .select("card_id", { count: "exact", head: true })
            .eq("list_id", id)

          if ((count ?? 0) > 0) {
            const confirmed = confirm(
              "Are you sure you want to delete this list? All cards under it will be deleted too."
            )
            if (!confirmed) return
          }

          if ((count ?? 0) > 0) {
            await supabaseClient.from("cards").delete().eq("list_id", id)
          }

          const { error } = await supabaseClient
            .from("lists")
            .delete()
            .eq("list_id", id)

          if (error) throw error

          set((state) => ({
            lists: state.lists.filter((l) => l.list_id !== id),
            cards: state.cards.filter((c) => c.list_id !== id),
          }))

          const { selectedBoardId } = get()
          if (selectedBoardId) {
            await get().fetchLists(selectedBoardId)
          }
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      fetchCards: async (boardId: number) => {
        try {
          const { data, error } = await supabaseClient
            .from("cards")
            .select("*")
            .eq("board_id", boardId)
            .order("position")

          if (error) throw error
          set({ cards: data || [] })
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      addCard: async (
        listId: number,
        boardId: number,
        title: string,
        description?: string
      ) => {
        try {
          const { cards } = get()
          const position = cards.filter((c) => c.list_id === listId).length

          const { data, error } = await supabaseClient
            .from("cards")
            .insert([
              {
                title,
                description: description || null,
                list_id: listId,
                board_id: boardId,
                position,
              },
            ])
            .select()
            .single()

          if (error) throw error
          if (data) {
            set((state) => ({ cards: [...state.cards, data] }))
          }
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      updateCard: async (id: number, title: string, description: string) => {
        try {
          const { error } = await supabaseClient
            .from("cards")
            .update({ title, description })
            .eq("card_id", id)

          if (error) throw error

          set((state) => ({
            cards: state.cards.map((c) =>
              c.card_id === id ? { ...c, title, description } : c
            ),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      deleteCard: async (id: number) => {
        try {
          const { error } = await supabaseClient
            .from("cards")
            .delete()
            .eq("card_id", id)

          if (error) throw error

          set((state) => ({
            cards: state.cards.filter((c) => c.card_id !== id),
          }))
        } catch (error: any) {
          set({ error: error.message })
        }
      },

      updateCardPositions: async (updates) => {
        try {
          set((state) => {
            const updateMap = new Map(
              updates.map((u) => [
                u.card_id,
                { list_id: u.list_id, position: u.position },
              ])
            )

            const updatedCards = state.cards.map((card) => {
              const update = updateMap.get(card.card_id)
              if (update) {
                return {
                  ...card,
                  list_id: update.list_id,
                  position: update.position,
                }
              }
              return card
            })

            return {
              cards: updatedCards,
              cardsVersion: state.cardsVersion + 1,
            }
          })

          for (const update of updates) {
            await supabaseClient
              .from("cards")
              .update({
                position: update.position,
                list_id: Number(update.list_id),
              })
              .eq("card_id", Number(update.card_id))
          }
        } catch (error: any) {
          console.error("Update card positions error:", error)
          set({ error: error.message })
        }
      },
      setCards: (cards: Card[]) => set({ cards }),
      setLists: (lists: List[]) => set({ lists }),
    }),
    { name: "BoardStore" }
  )
)
