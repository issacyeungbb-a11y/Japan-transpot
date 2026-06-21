import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './GameConfig'

interface Props {
  className?: string
}

export function PhaserGame({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config = createGameConfig(containerRef.current)
    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div id="phaser-canvas" ref={containerRef} className={className} />
}
