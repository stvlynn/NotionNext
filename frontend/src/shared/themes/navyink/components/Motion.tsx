'use client'

import { type HTMLMotionProps, motion, type Variants } from 'motion/react'
import * as React from 'react'

/**
 * Small motion helpers shared across the Navy Ink theme.
 *
 * Principles (per the emil / make-interfaces-feel-better skills): motion is
 * quick, eased-out, and travels a short distance. Entrances animate once, on
 * scroll into view, and never block reading. `motion` respects the user's
 * reduced-motion preference automatically via the CSS guard in style.tsx.
 */

const EASE_OUT = [0.2, 0, 0, 1] as const

/** Fade + short rise, played once when the element scrolls into view. */
export function FadeIn({
  children,
  delay = 0,
  y = 8,
  className,
  ...props
}: HTMLMotionProps<'div'> & { delay?: number; y?: number }) {
  const motionClassName = typeof className === 'string' ? className : undefined
  return (
    <motion.div
      className={motionClassName}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.3, ease: EASE_OUT, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } }
}

/** Wraps a list; children rendered with <StaggerItem> rise in sequence. */
export function StaggerContainer({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const motionClassName = typeof className === 'string' ? className : undefined
  return (
    <motion.div
      className={motionClassName}
      variants={staggerParent}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const motionClassName = typeof className === 'string' ? className : undefined
  return (
    <motion.div className={motionClassName} variants={staggerChild} {...props}>
      {children}
    </motion.div>
  )
}

/** Subtle lift on hover/press — used for cards and interactive surfaces. */
export function Lift({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const motionClassName = typeof className === 'string' ? className : undefined
  return (
    <motion.div
      className={motionClassName}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
