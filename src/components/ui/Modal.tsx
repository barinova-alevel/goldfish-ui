import { useEffect, type MouseEvent, type ReactNode } from 'react'

export const dialogActionsClass = 'mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'

export const dialogSecondaryButtonClass =
  'inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown hover:bg-tan sm:min-h-0 sm:w-auto'

export const dialogPrimaryButtonClass =
  'inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brown px-4 py-2 text-sm font-semibold text-cream hover:bg-brown-light disabled:opacity-60 sm:min-h-0 sm:w-auto'

export const dialogDangerButtonClass =
  'inline-flex min-h-11 w-full items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60 sm:min-h-0 sm:w-auto'

export const dialogFieldClass =
  'w-full min-h-11 rounded-md border border-brown/20 bg-white px-3 py-2.5 text-base text-brown focus:border-brown focus:ring-1 focus:ring-brown focus:outline-none lg:min-h-0 lg:text-sm'

interface ModalProps {
  children: ReactNode
  onClose: () => void
}

export function Modal({ children, onClose }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40">
      <div
        className="flex min-h-full items-center justify-center p-3 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="my-auto w-full max-w-md rounded-lg border border-brown/10 bg-cream p-4 shadow-lg sm:p-6"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
