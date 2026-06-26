import type { BlogPost } from '@/types/content';

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=85`;

export const mockBlogPosts: BlogPost[] = [
  {
    id: 'bp1',
    slug: 'yozgi-aksiya-2026',
    title: '☀️ Yozgi aksiya: 30% gacha chegirma!',
    excerpt:
      'Iyun oyi davomida barcha mototsikllar, shlemlar va ekipirovkaga maxsus chegirma. Tezda yetkazib berish va rasmiy kafolat.',
    body: '',
    cover: u('1568772585407-9361f9bf3a87'),
    category: 'promotion',
    author: 'DEFT MOTO',
    publishedAt: '2026-06-01',
    readMinutes: 3,
    isPromotion: true,
    promotionBadge: '−30%',
  },
  {
    id: 'bp2',
    slug: 'yangi-yamaha-r6-2026',
    title: '🏁 Yangi Yamaha R6 2026 — birinchi taassurotlar',
    excerpt:
      "2026-yilning kutilayotgan sport-bayki Yamaha R6 endi DEFT MOTO'da. Birinchi sinov, xususiyatlar va narxlar.",
    body: '',
    cover: u('1609630875171-b1321377ee65'),
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'reviews',
    author: 'Sardor Karimov',
    publishedAt: '2026-05-20',
    readMinutes: 7,
  },
  {
    id: 'bp3',
    slug: 'yangi-mavsumga-tayyorgarlik',
    title: '🔧 Yangi mototsikl mavsumiga qanday tayyorlanish kerak',
    excerpt:
      "Bahor keldi — vaqt mototsiklni saqlash joyidan olib chiqish vaqti. 7 bosqichli to'liq qo'llanma.",
    body: '',
    cover: u('1547549082-6bc09f2049ae'),
    category: 'tips',
    author: 'DEFT Service',
    publishedAt: '2026-04-15',
    readMinutes: 5,
  },
  {
    id: 'bp4',
    slug: 'kafedra-honda-deft',
    title: "🤝 DEFT MOTO Honda bilan rasmiy hamkorlik shartnoma imzoladi",
    excerpt:
      "Endi Honda'ning barcha rasmiy modellarini DEFT MOTO orqali bevosita zavoddan to'g'ridan-to'g'ri buyurtma berish mumkin.",
    body: '',
    cover: u('1558981403-c5f9899a28bc'),
    category: 'news',
    author: 'DEFT MOTO',
    publishedAt: '2026-03-10',
    readMinutes: 4,
  },
  {
    id: 'bp5',
    slug: 'shlemni-qanday-tanlash',
    title: "⛑️ Shlemni qanday tanlash: 5 muhim mezon",
    excerpt:
      "Sifatli shlem — bu hayot. Qaysi sertifikatlar muhim, qanday o'lcham olish va nima uchun arzonni olmaslik kerak.",
    body: '',
    cover: u('1558981852-426c6c22a060'),
    category: 'tips',
    author: 'DEFT MOTO',
    publishedAt: '2026-02-22',
    readMinutes: 6,
  },
  {
    id: 'bp6',
    slug: 'qishki-saqlash',
    title: "❄️ Mototsiklni qishda saqlash qo'llanmasi",
    excerpt:
      'Qish kelmasdan oldin mototsiklni to\'g\'ri "uxlatish" — bahor uchun ham sog\'lom moto.',
    body: '',
    cover: u('1622185135505-2d795003994a'),
    category: 'tips',
    author: 'DEFT Service',
    publishedAt: '2026-01-12',
    readMinutes: 8,
  },
];

export const promotions = mockBlogPosts.filter((p) => p.isPromotion);
