/**
 * Re-export shim — apps/web local imports kept for source compatibility
 * during the W2 ↔ T07 migration. Forwards to the canonical
 * `@forgely/ui` Button component.
 *
 * `buttonClasses` is the variant builder previously published locally;
 * we re-export `buttonVariants` under both names so neither call-site
 * has to be touched.
 */
export {
  Button,
  buttonVariants,
  buttonVariants as buttonClasses,
  type ButtonProps,
} from '@forgely/ui'
