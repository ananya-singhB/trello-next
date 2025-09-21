'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

interface Props {
  onSuccess: () => void;
}

export default function AddBoardForm({ onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setLoading(true);

    const { error } = await supabaseClient.from('boards').insert([{ title }]);
    if (error) {
      alert(error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Create New Board</h3>
      <input
        type="text"
        placeholder="Board title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        disabled={loading}
        required
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        Create Board
      </button>
    </form>
  );
}
