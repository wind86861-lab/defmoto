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
  // Video — operator video replies (and admin product videos) are saved here too.
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  ogg: 'video/ogg',
  m4v: 'video/mp4',
};

export async function GET(req: Request, { params }: { params: { name: string } }) {
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

  const total = buf.length;
  const baseHeaders: Record<string, string> = {
    'Content-Type': type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };

  // Range support — Safari/iOS refuse to play <video> without a 206 response,
  // and it lets the browser seek. Harmless for images (they just request 200).
  const range = req.headers.get('range');
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m) {
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end || start >= total) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }
    const slice = buf.subarray(start, end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(slice.length),
      },
    });
  }

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(total) },
  });
}
