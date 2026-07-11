import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAdminRequest } from '@/lib/server/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const IMAGE_MAX = 5 * 1024 * 1024; // 5 MB
const VIDEO_MAX = 60 * 1024 * 1024; // 60 MB
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif']);
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogg']);

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isVideo = VIDEO_EXT.has(ext);
  if (!isVideo && !IMAGE_EXT.has(ext)) {
    return NextResponse.json({ ok: false, error: 'type' }, { status: 415 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > (isVideo ? VIDEO_MAX : IMAGE_MAX)) {
    return NextResponse.json({ ok: false, error: 'size' }, { status: 413 });
  }
  const name = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
