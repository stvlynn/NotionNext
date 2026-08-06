'use client'

import { mergeProps, useRender } from '@base-ui-components/react'
import type React from 'react'
import { cn } from '@/lib/cn'

export function Label({
  className,
  render,
  ...props
}: useRender.ComponentProps<'label'>): React.ReactElement {
  const defaultProps = {
    className: cn(
      'inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4',
      className
    ),
    'data-slot': 'label'
  }

  return useRender({
    defaultTagName: 'label',
    props: mergeProps<'label'>(defaultProps, props),
    render: render as useRender.RenderProp
  })
}
