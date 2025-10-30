import { ProviderProfileClient } from './ProviderProfileClient'

interface ProviderPageProps {
  params: Promise<{ id: string }>
}

export default async function ProviderProfilePage({ params }: ProviderPageProps) {
  const resolved = await params
  return <ProviderProfileClient providerId={resolved.id} />
}
