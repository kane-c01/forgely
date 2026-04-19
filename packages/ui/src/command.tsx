'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'

import { Dialog, DialogContent } from './dialog'
import { cn } from './utils'

/**
 * Command — Linear-style ⌘K palette built on `cmdk` and themed for the
 * Forgely Cinematic Industrial dark surface.
 *
 * Compose freely: `<CommandDialog>` mounts the palette in a modal.
 */
export const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        'bg-bg-elevated text-text-primary flex h-full w-full flex-col overflow-hidden rounded-lg',
        className,
      )}
      {...props}
    />
  )
})

export function CommandDialog({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogContent className="shadow-overlay overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em]">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(function CommandInput({ className, ...props }, ref) {
  return (
    <div className="border-border-subtle flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="text-text-muted mr-2 h-4 w-4 shrink-0" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'text-small text-text-primary placeholder:text-text-muted flex h-11 w-full bg-transparent py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
})

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[320px] overflow-y-auto overflow-x-hidden p-1', className)}
      {...props}
    />
  )
})

export const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(function CommandEmpty(props, ref) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className="text-small text-text-muted py-6 text-center"
      {...props}
    />
  )
})

export const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn('text-text-primary overflow-hidden p-1', className)}
      {...props}
    />
  )
})

export const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn('bg-border-subtle -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
})

export const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'text-small relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 outline-none',
        'data-[selected=true]:bg-bg-surface data-[selected=true]:text-forge-orange',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-caption text-text-muted ml-auto font-mono uppercase tracking-[0.18em]',
        className,
      )}
      {...props}
    />
  )
}
