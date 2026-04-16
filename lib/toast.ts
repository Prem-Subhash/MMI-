// Singleton toast event emitter — works across entire Next.js app
// No React context needed. Call toast() from anywhere.

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastEvent {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type Listener = (event: ToastEvent) => void

const listeners: Listener[] = []

export const toastEmitter = {
  subscribe(fn: Listener) {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx > -1) listeners.splice(idx, 1)
    }
  },
  emit(event: ToastEvent) {
    listeners.forEach((fn) => fn(event))
  },
}

let idCounter = 0

export function toast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = `toast-${++idCounter}-${Date.now()}`
  console.log(`[Toast] ${type}: ${message}`)
  toastEmitter.emit({ id, message, type, duration })
}
