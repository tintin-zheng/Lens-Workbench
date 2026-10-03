import { useEffect, useRef, type ReactNode } from 'react'

// Keep the dimming layer fixed; only resize the card's positioning viewport.
export default function FormDialogBackdrop({ children, busy, onClose }: { children: ReactNode; busy: boolean; onClose: () => void }) {
  const viewport = useRef<HTMLDivElement>(null)
  const latest = useRef({ busy, onClose })
  useEffect(() => { latest.current = { busy, onClose } }, [busy, onClose])
  useEffect(() => {
    const element = viewport.current!
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const position = () => {
      const visible = window.visualViewport
      element.style.top = `${visible?.offsetTop ?? 0}px`
      element.style.height = `${visible?.height ?? window.innerHeight}px`
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !latest.current.busy) latest.current.onClose()
      if (event.key !== 'Tab') return
      const controls = Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'))
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    position()
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    window.addEventListener('resize', position)
    element.addEventListener('keydown', keydown)
    return () => {
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
      window.removeEventListener('resize', position)
      element.removeEventListener('keydown', keydown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus({ preventScroll: true })
    }
  }, [])
  return <div className="form-dialog-layer"><div className="form-dialog-dimmer" /><div ref={viewport} className="form-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>{children}</div></div>
}
