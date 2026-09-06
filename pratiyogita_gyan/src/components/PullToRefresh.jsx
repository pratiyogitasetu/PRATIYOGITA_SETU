import React, { useState, useEffect, useRef } from 'react'
import { RotateCw } from 'lucide-react'
import { useLayout } from '../contexts/LayoutContext'

const PULL_THRESHOLD = 65

export const PullToRefresh = () => {
  const { isMobile } = useLayout()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const startYRef = useRef(0)
  const isPullingRef = useRef(false)

  useEffect(() => {
    if (!isMobile) return

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      
      // Find closest scrollable ancestor of the touch target
      let target = e.target
      let isAtTop = true
      
      while (target && target !== document.body && target !== document.documentElement) {
        if (target.scrollTop > 0) {
          isAtTop = false
          break
        }
        target = target.parentElement
      }

      if (isAtTop) {
        startYRef.current = e.touches[0].clientY
        isPullingRef.current = true
      } else {
        isPullingRef.current = false
      }
    }

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing) return
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startYRef.current

      if (deltaY > 0) {
        // Apply friction damping curve
        const damped = Math.min(deltaY * 0.45, 90)
        setPullDistance(damped)
      } else {
        setPullDistance(0)
        isPullingRef.current = false
      }
    }

    const handleTouchEnd = () => {
      if (!isPullingRef.current || isRefreshing) return
      isPullingRef.current = false

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true)
        setPullDistance(50)
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        setPullDistance(0)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, pullDistance, isRefreshing])

  if (!isMobile || (pullDistance === 0 && !isRefreshing)) return null

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const isReady = pullDistance >= PULL_THRESHOLD

  return (
    <div
      style={{
        position: 'fixed',
        top: 62 + pullDistance * 0.4,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: isPullingRef.current ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border text-xs font-semibold"
        style={{
          backgroundColor: '#ffffff',
          borderColor: isReady || isRefreshing ? '#E4572E' : '#e5e7eb',
          color: isReady || isRefreshing ? '#E4572E' : '#4b5563',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)'
        }}
      >
        <RotateCw
          className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
            transition: isPullingRef.current ? 'none' : 'transform 0.2s ease'
          }}
        />
        <span>
          {isRefreshing
            ? 'Reloading...'
            : isReady
            ? 'Release to refresh'
            : 'Pull to refresh'}
        </span>
      </div>
    </div>
  )
}

export default PullToRefresh
