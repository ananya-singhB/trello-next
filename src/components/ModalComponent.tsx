import { useState } from "react"

export function Modal({
  title,
  isOpen,
  onClose,
  onSubmit,
}: {
  title: string
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
}) {
  const [inputValue, setInputValue] = useState("")

  function handleSubmit() {
    if (!inputValue.trim()) return
    onSubmit(inputValue.trim())
    setInputValue("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-80">
        <h3 className="text-xl mb-4">{title}</h3>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-1 mb-4 focus:outline-blue-600"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-1 rounded border border-gray-300 hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}