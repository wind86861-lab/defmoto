/**
 * Upload an image file to the server and get back its public URL.
 * Replaces inline base64 (which bloated the content blobs). Admin-only
 * (the API requires the admin session cookie, sent automatically).
 */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload-failed');
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error('upload-failed');
  return data.url;
}

/** Upload a video file (same endpoint — the server routes by extension). */
export function uploadVideo(file: File): Promise<string> {
  return uploadImage(file);
}

export interface UploadedAttachment {
  url: string;
  kind: 'image' | 'video' | 'file';
  name: string;
  size?: number;
}

/** Upload any supported file (image/video/document) and get its kind + metadata. */
export async function uploadAttachment(file: File): Promise<UploadedAttachment> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload-failed');
  const data = (await res.json()) as Partial<UploadedAttachment>;
  if (!data.url || !data.kind) throw new Error('upload-failed');
  return { url: data.url, kind: data.kind, name: data.name || file.name, size: data.size };
}
