'use client'
import { useEffect, useRef } from 'react'

interface ActionGateProps {
  completeOn: string
  onComplete: () => void
  active?: boolean
}

export function ActionGate({ completeOn, onComplete, active = true }: ActionGateProps) {
  const firedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    if (!active) return
    firedRef.current = false

    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string }>
      if (ce.detail?.id === completeOn && !firedRef.current) {
        firedRef.current = true
        onCompleteRef.current()
      }
    }

    window.addEventListener('onboarding:action', handler)
    return () => window.removeEventListener('onboarding:action', handler)
  }, [completeOn, active])

  return null
}
