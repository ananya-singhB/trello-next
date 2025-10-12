export interface Board {
  board_id: string;
  title: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface List {
  list_id: string;
  title: string;
  board_id: string;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface Card {
  card_id: string;
  title: string;
  list_id: string;
  board_id: string;
  position: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
