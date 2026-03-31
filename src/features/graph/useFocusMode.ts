import { useState } from 'react'

export function useFocusMode() {
  const [focusedId, setFocusedId] = useState<string | null>(null)

  function focus(id: string) {
    setFocusedId(prev => (prev === id ? null : id))
  }

  function clear() {
    setFocusedId(null)
  }

  return { focusedId, focus, clear }
}
