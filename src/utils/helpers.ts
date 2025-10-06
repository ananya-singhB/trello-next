import { supabaseClient } from "@/lib/supabaseClient"

export async function fetchLists(boardId: number) {
  const { data } = await supabaseClient
    .from("lists")
    .select("*")
    .eq("board_id", boardId)
    .order("position")

  return data || []
}
