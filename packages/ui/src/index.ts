/**
 * @forgely/ui — entry point.
 *
 * Sprint-0 release ships five P0 primitives. The remaining shadcn / Aceternity /
 * Magic UI components land progressively as part of T03 / T04.
 */
export { Button, buttonVariants, type ButtonProps } from './button'
export { Input, type InputProps } from './input'
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'
export { Badge, badgeVariants, type BadgeProps } from './badge'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog'
export { cn } from './utils'
