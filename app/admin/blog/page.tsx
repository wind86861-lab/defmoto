'use client';

import { useRef, useState } from 'react';
import { Newspaper, Plus, Trash2, Pencil, Upload, Save, X, Info } from 'lucide-react';
import { useContentStore } from '@/lib/stores/content';
import { useMounted } from '@/hooks/useMounted';
import { uploadImage } from '@/lib/uploadImage';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatDate } from '@/lib/format';
import type { BlogPost, BlogCategory, AboutStat } from '@/types/content';

const CATEGORIES: { v: BlogCategory; label: string }[] = [
  { v: 'news', label: 'Yangiliklar' },
  { v: 'tips', label: 'Maslahatlar' },
  { v: 'reviews', label: 'Sharhlar' },
  { v: 'promotion', label: 'Aksiya' },
];
const CAT_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.v, c.label]));

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9Ѐ-ӿ]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `post-${Date.now().toString(36)}`
  );
}

const inputCls =
  'w-full rounded-xl border border-brand-surface-border bg-brand-dark px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-brand-yellow/60';
const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/55';

function ImageUpload({ value, onChange, label }: { value?: string; onChange: (url: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
          <ProductImage src={value ?? ''} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
        </span>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border bg-brand-surface px-3.5 py-2.5 text-sm font-semibold text-white/80 hover:border-brand-yellow/40 hover:text-brand-yellow disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {busy ? '…' : 'Rasm yuklash'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-white/45 hover:text-danger">
            ✕ olib tashlash
          </button>
        )}
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const mounted = useMounted();
  const posts = useContentStore((s) => s.blogPosts);
  const about = useContentStore((s) => s.about);
  const setAbout = useContentStore((s) => s.setAbout);
  const addBlogPost = useContentStore((s) => s.addBlogPost);
  const updateBlogPost = useContentStore((s) => s.updateBlogPost);
  const removeBlogPost = useContentStore((s) => s.removeBlogPost);

  const [draft, setDraft] = useState<BlogPost | null>(null);
  const isNew = draft && !posts.some((p) => p.id === draft.id);

  const startNew = () =>
    setDraft({
      id: `bp_${Date.now().toString(36)}`,
      slug: '',
      title: '',
      excerpt: '',
      body: '',
      cover: '',
      category: 'news',
      author: 'DEFT MOTO',
      publishedAt: new Date().toISOString().slice(0, 10),
      readMinutes: 3,
    });

  const saveDraft = () => {
    if (!draft || !draft.title.trim()) return;
    const post: BlogPost = { ...draft, slug: draft.slug.trim() || slugify(draft.title) };
    if (isNew) addBlogPost(post);
    else updateBlogPost(post.id, post);
    setDraft(null);
  };

  // About stats — always 4 editable cells.
  const stats: AboutStat[] = [0, 1, 2, 3].map(
    (i) => about.stats?.[i] || { value: '', label: '' },
  );
  const setStat = (i: number, patch: Partial<AboutStat>) => {
    const next = stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    setAbout({ stats: next });
  };

  return (
    <div className="max-w-3xl space-y-10">
      {/* ===================== About page ===================== */}
      <section className="space-y-4">
        <header>
          <h1 className="flex items-center gap-2 font-display text-display-sm font-extrabold sm:text-display-md">
            <Info className="h-6 w-6 text-brand-yellow" /> Biz haqimizda (sahifa)
          </h1>
          <p className="mt-1 text-sm text-white/55">
            «Biz haqimizda» sahifasi matnlari. Boʻsh qoldirsangiz — standart matn koʻrsatiladi.
          </p>
        </header>

        <div className="grid gap-4 rounded-2xl border border-brand-surface-border bg-brand-surface p-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelCls}>Sarlavha</span>
            <input className={inputCls} value={about.title ?? ''} onChange={(e) => setAbout({ title: e.target.value })} placeholder="DEFT MOTO — biz haqimizda" />
          </label>
          <label className="sm:col-span-2">
            <span className={labelCls}>Matn (paragraflar boʻsh qator bilan ajratiladi)</span>
            <textarea className={`${inputCls} min-h-[120px] resize-y`} value={about.intro ?? ''} onChange={(e) => setAbout({ intro: e.target.value })} placeholder={'Birinchi paragraf...\n\nIkkinchi paragraf...'} />
          </label>
          <label>
            <span className={labelCls}>Video (YouTube havola)</span>
            <input className={inputCls} value={about.videoUrl ?? ''} onChange={(e) => setAbout({ videoUrl: e.target.value })} placeholder="https://youtu.be/..." />
          </label>
          <div className="flex items-end">
            <div className="w-full">
              <ImageUpload label="Rasm" value={about.photo} onChange={(url) => setAbout({ photo: url })} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className={labelCls}>Statistika (4 ta)</span>
            <div className="grid grid-cols-2 gap-2">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inputCls} w-20`} value={s.value} onChange={(e) => setStat(i, { value: e.target.value })} placeholder="5+" />
                  <input className={inputCls} value={s.label} onChange={(e) => setStat(i, { label: e.target.value })} placeholder="Filial" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Blog posts ===================== */}
      <section className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-display-sm font-extrabold">
            <Newspaper className="h-6 w-6 text-brand-yellow" /> Blog maqolalari
          </h2>
          {!draft && (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-3.5 py-2 text-sm font-bold text-brand-dark shadow-glow-sm hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Yangi
            </button>
          )}
        </header>

        {/* Editor */}
        {draft && (
          <div className="grid gap-4 rounded-2xl border border-brand-yellow/30 bg-brand-surface p-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelCls}>Sarlavha *</span>
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Maqola sarlavhasi" />
            </label>
            <label>
              <span className={labelCls}>Slug (havola, boʻsh = avto)</span>
              <input className={inputCls} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="avto-yaratiladi" />
            </label>
            <label>
              <span className={labelCls}>Kategoriya</span>
              <select className={inputCls} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as BlogCategory })}>
                {CATEGORIES.map((c) => (
                  <option key={c.v} value={c.v}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={labelCls}>Qisqa matn (excerpt)</span>
              <textarea className={`${inputCls} min-h-[70px] resize-y`} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
            </label>
            <label className="sm:col-span-2">
              <span className={labelCls}>Toʻliq matn</span>
              <textarea className={`${inputCls} min-h-[160px] resize-y`} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Maqola matni (paragraflar boʻsh qator bilan)" />
            </label>
            <div className="sm:col-span-2">
              <ImageUpload label="Muqova rasm" value={draft.cover} onChange={(url) => setDraft({ ...draft, cover: url })} />
            </div>
            <label>
              <span className={labelCls}>Muallif</span>
              <input className={inputCls} value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
            </label>
            <label>
              <span className={labelCls}>Sana</span>
              <input type="date" className={inputCls} value={draft.publishedAt?.slice(0, 10)} onChange={(e) => setDraft({ ...draft, publishedAt: e.target.value })} />
            </label>
            <label>
              <span className={labelCls}>Oʻqish (daqiqa)</span>
              <input type="number" min={1} className={inputCls} value={draft.readMinutes} onChange={(e) => setDraft({ ...draft, readMinutes: Number(e.target.value) || 1 })} />
            </label>
            <label>
              <span className={labelCls}>Video (ixtiyoriy)</span>
              <input className={inputCls} value={draft.videoUrl ?? ''} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} placeholder="https://youtu.be/..." />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={!!draft.isPromotion} onChange={(e) => setDraft({ ...draft, isPromotion: e.target.checked })} />
              <span className="text-sm">Aksiya maqolasi</span>
              {draft.isPromotion && (
                <input className={`${inputCls} ml-2 w-28`} value={draft.promotionBadge ?? ''} onChange={(e) => setDraft({ ...draft, promotionBadge: e.target.value })} placeholder="−30%" />
              )}
            </label>

            <div className="flex gap-2 sm:col-span-2">
              <button type="button" onClick={saveDraft} disabled={!draft.title.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-yellow px-4 py-2.5 text-sm font-bold text-brand-dark shadow-glow-sm hover:brightness-110 disabled:opacity-50">
                <Save className="h-4 w-4" /> Saqlash
              </button>
              <button type="button" onClick={() => setDraft(null)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-surface-border px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white">
                <X className="h-4 w-4" /> Bekor
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {mounted && (
          <div className="space-y-2.5">
            {posts.length === 0 && (
              <p className="rounded-xl border border-dashed border-brand-surface-border px-3 py-6 text-center text-sm text-white/45">
                Hali maqola yoʻq. «Yangi» tugmasi bilan qoʻshing.
              </p>
            )}
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-surface p-3">
                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-surface-border bg-brand-dark">
                  <ProductImage src={p.cover} alt="" className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {CAT_LABEL[p.category] || p.category} · {formatDate(new Date(p.publishedAt).toISOString())}
                  </p>
                </div>
                <button type="button" onClick={() => setDraft(p)} aria-label="Tahrirlash" className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-surface-border text-white/60 hover:border-brand-yellow/40 hover:text-brand-yellow">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`"${p.title}" oʻchirilsinmi?`)) removeBlogPost(p.id);
                  }}
                  aria-label="Oʻchirish"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-surface-border text-white/60 hover:border-danger/40 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
