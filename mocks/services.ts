import type { ServiceCenter } from '@/types/content';

export const mockServiceCenters: ServiceCenter[] = [
  {
    id: 's1',
    name: 'DEFT Service Yunusobod',
    shortName: 'Yunusobod',
    about:
      "DEFT Service Yunusobod — professional mototsikl ta'mirlash va xizmat ko'rsatish markazi. Tajribali ustalar, original ehtiyot qismlar, har qanday murakkablikdagi remont. Bizda mototsiklingizning barcha tizimlari professional darajada xizmat ko'rsatiladi.",
    address: "Toshkent, Yunusobod tumani, Amir Temur ko'chasi 12",
    phone: '+998 99 810 71 01',
    secondaryPhone: '+998 71 200 71 01',
    email: 'service.yunusobod@deftmoto.uz',
    workingHours: 'Du-Sh: 09:00 — 20:00',
    image:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    services: [
      {
        id: 'sv1',
        title: "TO va profilaktika",
        description: "Moy almashtirish, filtr, zanjir, tormoz tekshiruvi",
        priceFrom: 250_000,
        duration: '2-3 soat',
      },
      {
        id: 'sv2',
        title: "Dvigatel ta'miri",
        description: "To'liq dvigatel diagnostikasi va remont",
        priceFrom: 800_000,
        duration: '1-3 kun',
      },
      {
        id: 'sv3',
        title: 'Tormoz tizimi',
        description: 'Disklar, kolodkalar, gidravlika',
        priceFrom: 150_000,
        duration: '1-2 soat',
      },
      {
        id: 'sv4',
        title: 'Shina almashtirish va balansirovka',
        description: "Yangi shina o'rnatish, balansirovka",
        priceFrom: 90_000,
        duration: '1 soat',
      },
    ],
  },
  {
    id: 's2',
    name: 'DEFT Service Chilonzor',
    shortName: 'Chilonzor',
    about:
      "DEFT Service Chilonzor — elektronika va tюning bo'yicha ixtisoslashgan markaz. OBD-II diagnostika, dvigatel tюningi, vinil chiplash va aksessuarlar o'rnatish.",
    address: "Toshkent, Chilonzor tumani, Bunyodkor 45",
    phone: '+998 99 810 71 02',
    secondaryPhone: '+998 71 200 71 02',
    email: 'service.chilonzor@deftmoto.uz',
    workingHours: 'Du-Sh: 09:00 — 20:00',
    image:
      'https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=1200&q=85',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    services: [
      {
        id: 'sv5',
        title: 'Elektronika diagnostikasi',
        description: 'OBD-II skanerlash, sensor diagnostikasi',
        priceFrom: 120_000,
        duration: '1 soat',
      },
      {
        id: 'sv6',
        title: 'Tюning va vizual',
        description: "Aksessuarlar o'rnatish, vinil chiplash",
        priceFrom: 200_000,
        duration: 'Individual',
      },
      {
        id: 'sv7',
        title: "Yog'lash xizmati",
        description: 'Sintetik / mineral moylar bilan',
        priceFrom: 180_000,
        duration: '45 daqiqa',
      },
    ],
  },
  {
    id: 's3',
    name: 'DEFT Service Samarqand',
    shortName: 'Samarqand',
    about:
      "Samarqand viloyatidagi yetakchi mototsikl servis markazi. To'liq tashxis, reglamentli xizmat, original ehtiyot qismlar bilan ish.",
    address: "Samarqand, Registon ko'chasi 8",
    phone: '+998 99 810 71 03',
    email: 'service.samarqand@deftmoto.uz',
    workingHours: 'Du-Sh: 09:00 — 19:00',
    image:
      'https://images.unsplash.com/photo-1622185135505-2d795003994a?w=1200&q=85',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    services: [
      {
        id: 'sv8',
        title: "To'liq diagnostika",
        description: 'Mototsiklning barcha tizimlarini tekshirish',
        priceFrom: 100_000,
        duration: '1 soat',
      },
      {
        id: 'sv9',
        title: 'TO va texnik xizmat',
        description: 'Reglamentga muvofiq texnik xizmat',
        priceFrom: 220_000,
        duration: '2-3 soat',
      },
    ],
  },
];
