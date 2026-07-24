import { useState, useEffect } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

let memoryState = { toasts: [] }
let listeners = []

function dispatch(updater) {
  memoryState = updater(memoryState)
  listeners.forEach((listener) => listener(memoryState))
}

export function toast({ ...props }) {
  const id = generateId()

  const update = (props) =>
    dispatch((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...props } : t
      ),
    }))

  const dismiss = () =>
    dispatch((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    }))

  dispatch((state) => ({
    ...state,
    toasts: [
      { ...props, id, dismiss },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }))

  return {
    id,
    dismiss,
    update,
  }
}

export function useToast() {
  const [state, setState] = useState(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if(index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  useEffect(() => {
    const timeouts = []

    state.toasts.forEach((t) => {
      if(t.duration === Infinity) {
        return
      }

      const timeout = setTimeout(() => {
        t.dismiss()
      }, t.duration || 5000)

      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [state.toasts])

  return {
    toast,
    toasts: state.toasts,
  }
}