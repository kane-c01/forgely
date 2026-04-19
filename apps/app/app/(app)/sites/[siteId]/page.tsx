import { redirect } from 'next/navigation'

export default function SiteRoot({ params }: { params: { siteId: string } }) {
  redirect(`/sites/${params.siteId}/products`)
}
