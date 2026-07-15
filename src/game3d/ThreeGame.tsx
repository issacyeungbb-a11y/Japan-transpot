import { useEffect, useRef } from 'react'
import { CourseEngine } from './engine'

interface Props {
  className?: string
}

// Mounts the three.js course engine into a div. The engine talks to the rest
// of the app exclusively through the EventBridge.
export function ThreeGame({ className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const engine = new CourseEngine(ref.current)
    return () => engine.dispose()
  }, [])

  return <div ref={ref} className={className} style={{ touchAction: 'none' }} />
}
