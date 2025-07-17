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
import { cn } from "@/lib/utils"

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
          <Toast
          key={id}
          {...props}
          className={cn(
            "group pointer-events-auto relative w-[360px] overflow-hidden rounded-md border p-1 pr-4 shadow-lg transition-all data-[swipe:ended]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe:cancel]:translate-x-0 data-[swipe:move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe:active]:cursor-grab",
            props.className,
            // Add green background for positive toasts
            !props.variant || props.variant === 'default' ? 'bg-green-50 border-green-200' : '',
            props.variant === "destructive" ? "ring-red-500/50 data-[state=open]:ring-2" : "ring-gray-500/50 data-[state=open]:ring-2"
          )}
          onOpenChange={(open) => {
            if (!open) dismiss()
          }}
        >
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