'use client'

import * as React from 'react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
} from './sheet'

/**
 * Drawer — semantic alias of {@link Sheet} pinned to the bottom edge by
 * default. Mirrors the shadcn/ui drawer surface so app-side code can stay
 * idiomatic while reusing one primitive.
 */
export const Drawer = Sheet
export const DrawerTrigger = SheetTrigger
export const DrawerClose = SheetClose
export const DrawerPortal = SheetPortal
export const DrawerOverlay = SheetOverlay
export const DrawerHeader = SheetHeader
export const DrawerFooter = SheetFooter
export const DrawerTitle = SheetTitle
export const DrawerDescription = SheetDescription

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  Omit<SheetContentProps, 'side'>
>(function DrawerContent(props, ref) {
  return <SheetContent ref={ref} side="bottom" {...props} />
})
