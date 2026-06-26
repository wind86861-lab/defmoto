import { PageShell } from '@/components/layout/PageShell';
import { ProfileClient } from '@/features/profile/ProfileClient';

export default function ProfilePage() {
  return (
    <PageShell hideFooter>
      <ProfileClient />
    </PageShell>
  );
}
