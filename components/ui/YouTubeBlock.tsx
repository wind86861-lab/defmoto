import { cn } from '@/lib/cn';

interface YouTubeBlockProps {
  url?: string | null;
  title?: string;
  className?: string;
  aspect?: 'video' | 'wide';
}

/**
 * Conditional YouTube embed.
 * If `url` is empty/undefined → renders nothing (per spec).
 * Accepts both /watch?v=... and /embed/... URLs and normalises.
 */
export function YouTubeBlock({
  url,
  title,
  className,
  aspect = 'video',
}: YouTubeBlockProps) {
  if (!url) return null;

  const embedUrl = normaliseUrl(url);
  if (!embedUrl) return null;

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="mb-3 font-display text-lg font-bold sm:text-xl">
          {title}
        </h3>
      )}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border border-brand-surface-border bg-brand-surface shadow-card',
          aspect === 'video' ? 'aspect-video' : 'aspect-[21/9]',
        )}
      >
        <iframe
          src={embedUrl}
          title={title ?? 'YouTube video'}
          className="absolute inset-0 h-full w-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

function normaliseUrl(input: string): string | null {
  try {
    const url = new URL(input);
    // youtu.be/<id>
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // youtube.com/watch?v=<id>
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return input; // already embed
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
