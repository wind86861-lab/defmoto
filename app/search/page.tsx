import { PageShell } from '@/components/layout/PageShell';
import { SearchClient } from '@/features/search/SearchClient';

export default function SearchPage() {
  return (
    <PageShell hideFooter>
      <SearchClient />
    </PageShell>
  );
}
