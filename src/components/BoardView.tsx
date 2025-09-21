'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import AddListForm from './AddListForm';
import Modal from './Modal';
import Card from './Card';
import type { List, Card as CardType } from '@/types';
import {
  DndContext,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  boardId: number;
}

export default function BoardView({ boardId }: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);

  async function fetchData() {
    const { data: listsData } = await supabaseClient
      .from('lists')
      .select('*')
      .eq('board_id', boardId)
      .order('position');
    setLists(listsData || []);

    if (listsData && listsData.length > 0) {
      const listIds = listsData.map((l) => l.list_id);
      const { data: cardsData } = await supabaseClient
        .from('cards')
        .select('*')
        .in('list_id', listIds)
        .order('position');
      setCards(cardsData || []);
    } else {
      setCards([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [boardId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = cards.findIndex((c) => c.card_id === active.id);
      const newIndex = cards.findIndex((c) => c.card_id === over!.id);
      const newCards = arrayMove(cards, oldIndex, newIndex).map((card, index) => ({
        ...card,
        position: index,
      }));
      setCards(newCards);

      // Update positions in DB (optimistic update)
      for (let card of newCards) {
        await supabaseClient
          .from('cards')
          .update({ position: card.position })
          .eq('card_id', card.card_id);
      }
    }
  }

  return (
    <div className="p-4 flex gap-4 overflow-x-auto">
      {loading ? (
        <div>Loading lists and cards...</div>
      ) : (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex gap-4">
              {lists.map((list) => (
                <SortableList
                  key={list.list_id}
                  list={list}
                  cards={cards.filter((card) => card.list_id === list.list_id)}
                />
              ))}
            </div>
          </DndContext>
          <button
            onClick={() => setShowListModal(true)}
            className="h-10 px-4 py-2 rounded bg-green-600 text-white self-start"
          >
            + Add List
          </button>
          {showListModal && (
            <Modal onClose={() => setShowListModal(false)}>
              <AddListForm boardId={boardId} onSuccess={() => { fetchData(); setShowListModal(false); }} />
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

function SortableList({ list, cards }: { list: List; cards: CardType[] }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: list.list_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded shadow p-3 min-w-[250px] flex flex-col"
    >
      <div className="font-semibold mb-3">{list.title}</div>
      <SortableContext items={cards.map((c) => c.card_id)} strategy={verticalListSortingStrategy}>
        {cards.map((card) => (
          <Card key={card.card_id} card={card} />
        ))}
      </SortableContext>
    </div>
  );
}