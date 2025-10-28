import { ProviderProfileClient } from './ProviderProfileClient'

interface ProviderPageProps {
  params: { id: string }
}

export default function ProviderProfilePage({ params }: ProviderPageProps) {
  return <ProviderProfileClient providerId={params.id} />
}
