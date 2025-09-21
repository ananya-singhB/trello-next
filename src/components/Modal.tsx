'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ children, onClose }: Props) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex justify-center items-center p-4">
        <div className="bg-white rounded shadow max-w-lg w-full relative p-6">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            aria-label="Close modal"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
