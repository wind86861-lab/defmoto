import { PageShell } from '@/components/layout/PageShell';
import { BlogListClient } from '@/features/blog/BlogListClient';

export default function BlogPage() {
  return (
    <PageShell>
      <BlogListClient />
    </PageShell>
  );
}
