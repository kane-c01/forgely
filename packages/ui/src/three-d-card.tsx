'use client'

import * as React from 'react'

import { cn } from './utils'

interface CardContextValue {
  rotateRef: React.MutableRefObject<{ x: number; y: number }>
}

const CardContext = React.createContext<CardContextValue | null>(null)

export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  perspective?: number
}

/**
 * 3D Card — Aceternity inspired tilt container. Tracks pointer position
 * and reads-out rotation through context so children can opt-in via
 * {@link CardItem} for parallax depth.
 */
export function CardContainer({
  perspective = 1000,
  className,
  children,
  ...props
}: CardContainerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const rotateRef = React.useRef({ x: 0, y: 0 })

  const onMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (ev.clientX - rect.left - rect.width / 2) / 12
    const y = -(ev.clientY - rect.top - rect.height / 2) / 12
    rotateRef.current = { x: y, y: x }
    cardRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }

  const reset = () => {
    if (!cardRef.current) return
    rotateRef.current = { x: 0, y: 0 }
    cardRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`
  }

  return (
    <CardContext.Provider value={{ rotateRef }}>
      <div
        ref={containerRef}
        style={{ perspective: `${perspective}px` }}
        className={cn('flex items-center justify-center py-6', className)}
        {...props}
      >
        <div
          ref={cardRef}
          onPointerMove={onMove}
          onPointerLeave={reset}
          className="duration-medium ease-emphasized relative transition-transform will-change-transform [transform-style:preserve-3d]"
        >
          {children}
        </div>
      </div>
    </CardContext.Provider>
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'group/card border-border-strong bg-bg-elevated relative h-auto w-auto rounded-xl border p-6 [transform-style:preserve-3d]',
        className,
      )}
      {...props}
    />
  )
}

type CardItemTag = 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'a' | 'button'

export interface CardItemProps extends React.HTMLAttributes<HTMLElement> {
  as?: CardItemTag
  /** translation along the Z axis in pixels */
  translateZ?: number
}

export function CardItem({
  as: Tag = 'div',
  translateZ = 0,
  className,
  style,
  ...props
}: CardItemProps): React.ReactElement {
  const ctx = React.useContext(CardContext)
  if (!ctx) {
    throw new Error('CardItem must be used inside <CardContainer>')
  }
  const transform = `translateZ(${translateZ}px)`
  return React.createElement(Tag, {
    className: cn('transition-transform duration-medium ease-emphasized', className),
    style: { ...style, transform },
    ...props,
  })
}
