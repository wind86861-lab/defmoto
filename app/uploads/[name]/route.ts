/**
 * Serve runtime-uploaded files from public/uploads at /uploads/<name>.
 *
 * `next start` only serves files that existed in public/ when the server
 * booted, so admin uploads written after boot 404 until a restart. This route
 * streams them straight from disk on every request, so uploads work instantly.
 */
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  // Basename only — block any path traversal.
  const name = path.basename(params.name || '');
  if (!name || name.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const ext = (name.split('.').pop() || '').toLowerCase();
  const type = MIME[ext];
  if (!type) return new Response('Not found', { status: 404 });

  const file = path.join(UPLOAD_DIR, name);
  let buf: Buffer;
  try {
    buf = fs.readFileSync(file);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(buf.length),
    },
  });
}
