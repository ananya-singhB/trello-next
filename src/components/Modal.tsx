'use client';

import { ReactNode } from 'react';

interface Props {
  open: boolean;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({ children, onClose, open }: Props) {
  if(!open){
    return null
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex justify-center items-center p-4 z-50">
        <div className="bg-white rounded shadow max-w-lg w-full relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 hover:bg-gray-200 py-1 px-2 mx-2 rounded"
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
