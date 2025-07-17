import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.variant === "destructive") {
        // Dispatch custom event for error toasts
        document.dispatchEvent(new CustomEvent('toast:error', { detail: toast }));
      } else {
        // Dispatch custom event for success toasts
        document.dispatchEvent(new CustomEvent('toast:success', { detail: toast }));
      }
    });
  }, [toasts]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
