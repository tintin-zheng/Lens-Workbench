import { useLayoutEffect, useRef } from 'react'

export default function SlidingTabs<T extends string>({ items, value, onChange }: {
  items: { key: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const previous = useRef(value)
  useLayoutEffect(() => {
    const element = root.current!
    const update = (animate: boolean) => {
      const selected = element.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      if (!selected) return
      element.dataset.animate = String(animate)
      element.style.setProperty('--slider-x', `${selected.offsetLeft}px`)
      element.style.setProperty('--slider-width', `${selected.offsetWidth}px`)
      element.dataset.measured = 'true'
    }
    update(previous.current !== value)
    previous.current = value
    const observer = new ResizeObserver(() => update(false))
    observer.observe(element)
    return () => observer.disconnect()
  }, [value])
  return <div ref={root} className={`status-tabs ${items.length === 2 ? 'status-tabs-wide' : ''}`} role="group" aria-label="页面分类">
    <span className="status-slider" aria-hidden="true" />
    {items.map(item => <button type="button" key={item.key} className={`status-tab ${value === item.key ? 'selected' : ''}`} aria-pressed={value === item.key} onClick={() => onChange(item.key)}><span>{item.label}</span></button>)}
  </div>
}
