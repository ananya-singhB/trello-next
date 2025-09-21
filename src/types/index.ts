export interface Board {
  board_id: number;
  title: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface List {
  list_id: number;
  title: string;
  board_id: number;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export interface Card {
  card_id: number;
  title: string;
  list_id: number;
  board_id: number;
  position: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
