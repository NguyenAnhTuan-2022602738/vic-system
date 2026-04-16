"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform, animate } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  precision?: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
  delay?: number
}

export function AnimatedNumber({ 
  value, 
  precision = 2, 
  prefix = "", 
  suffix = "", 
  className,
  duration = 1.5,
  delay = 0 
}: AnimatedNumberProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(latest) {
          setCount(latest)
        }
      })
      return () => controls.stop()
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [value, duration, delay])

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })}
      {suffix}
    </span>
  )
}
