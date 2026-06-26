import { PageShell } from '@/components/layout/PageShell';
import { BranchesClient } from '@/features/branches/BranchesClient';

export default function BranchesPage() {
  return (
    <PageShell>
      <BranchesClient />
    </PageShell>
  );
}
