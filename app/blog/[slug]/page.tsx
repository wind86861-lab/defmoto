import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { BlogPostClient } from '@/features/blog/BlogPostClient';
import { mockBlogPosts } from '@/mocks/blog';

export function generateStaticParams() {
  return mockBlogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = mockBlogPosts.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = mockBlogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const related = mockBlogPosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  return (
    <PageShell>
      <BlogPostClient post={post} related={related} />
    </PageShell>
  );
}
