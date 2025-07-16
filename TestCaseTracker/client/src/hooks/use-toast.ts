import { useState, useCallback } from "react"
import { useSound } from "./use-sound"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

export interface ToastProps extends Omit<Toast, "id"> {}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const { playSound } = useSound()

  const toast = useCallback(
    ({ variant = "default", ...props }: ToastProps) => {
      const id = (++toastCount).toString()

      // Play appropriate sound based on variant
      if (variant === "destructive") {
        playSound("error").catch(console.warn)
      } else {
        playSound("success").catch(console.warn)
      }

      const newToast: Toast = {
        id,
        variant,
        ...props,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)

      return {
        id,
        dismiss: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        },
      }
    },
    [playSound]
  )

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId ? prev.filter((t) => t.id !== toastId) : []
    )
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}