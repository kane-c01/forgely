/**
 * @forgely/ui — shared React component library themed with
 * `@forgely/design-tokens`. Provides three layers:
 *
 * 1. shadcn/ui primitives (T03)
 * 2. Aceternity / Magic UI animated surfaces (T04)
 * 3. shared utilities (`cn`, etc.)
 *
 * Every component is dark-first, accessible, and free of hard-coded
 * colors. See `docs/MASTER.md` chapter 32 for the catalogue.
 */

export { cn } from './utils'

export { Button, buttonVariants, type ButtonProps } from './button'
export { Input, type InputProps } from './input'
export { Textarea, type TextareaProps } from './textarea'
export { Label } from './label'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export { Badge, badgeVariants, type BadgeProps } from './badge'
export { Alert, AlertDescription, AlertTitle, alertVariants, type AlertProps } from './alert'
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
export {
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
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from './drawer'
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
export { Toaster, toast } from './toast'
export { Avatar, AvatarFallback, AvatarImage } from './avatar'
export { Separator } from './separator'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
export { Progress } from './progress'
export { Spinner, type SpinnerProps } from './spinner'
export { Skeleton } from './skeleton'
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './form'
export { Checkbox } from './checkbox'
export { Switch } from './switch'
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover'
export { Stepper, type StepperProps, type StepperStep } from './stepper'
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  SimplePagination,
  type PaginationLinkProps,
  type SimplePaginationProps,
} from './pagination'
export { EmptyState, type EmptyStateProps } from './empty-state'
export { CodeBlock, type CodeBlockProps } from './code-block'
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command'

export { Marquee, type MarqueeProps } from './marquee'
export { BorderBeam, type BorderBeamProps } from './border-beam'
export { ShineBorder, type ShineBorderProps } from './shine-border'
export { NumberTicker, type NumberTickerProps } from './number-ticker'
export { AnimatedBeam, type AnimatedBeamProps } from './animated-beam'
export { Spotlight, type SpotlightProps } from './spotlight'
export { TextGenerateEffect, type TextGenerateEffectProps } from './text-generate-effect'
export {
  CardContainer,
  CardBody,
  CardItem,
  type CardContainerProps,
  type CardItemProps,
} from './three-d-card'
export { StickyScroll, type StickyScrollProps, type StickyScrollSection } from './sticky-scroll'
export { BentoGrid, BentoCard, type BentoCardProps } from './bento-grid'
export { HeroParallax, type HeroParallaxProps, type HeroParallaxItem } from './hero-parallax'
export { CanvasReveal, type CanvasRevealProps } from './canvas-reveal'
export {
  InfiniteMovingCards,
  type InfiniteMovingCardsProps,
  type InfiniteMovingCardsItem,
} from './infinite-moving-cards'
