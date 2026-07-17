import { PageShell } from '@/components/layout/PageShell';
import { BlogPostClient } from '@/features/blog/BlogPostClient';
import { mockBlogPosts } from '@/mocks/blog';

// Prebuild the mock slugs; admin-added posts render on demand.
export function generateStaticParams() {
  return mockBlogPosts.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = true;

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = mockBlogPosts.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  // Server fallback from the mock set (SSG/SEO); the client prefers the live
  // admin post from the content store by slug.
  const post = mockBlogPosts.find((p) => p.slug === params.slug) ?? null;
  const related = post
    ? mockBlogPosts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3)
    : [];

  return (
    <PageShell>
      <BlogPostClient slug={params.slug} fallbackPost={post} fallbackRelated={related} />
    </PageShell>
  );
}
