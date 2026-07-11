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
