import type { Category } from '@/types/product';

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80`;

// Only verified motorcycle / gear images used as category covers.
export const mockCategories: Category[] = [
  {
    id: 'c1',
    slug: 'motorcycles',
    name: 'Mototsikllar',
    icon: '🏍️',
    image: u('1568772585407-9361f9bf3a87'), // Red Ducati sport
    productCount: 1245,
  },
  {
    id: 'c2',
    slug: 'cruisers',
    name: 'Kruizerlar',
    icon: '🏍',
    image: u('1622185135505-2d795003994a'), // Royal Enfield (faces left)
    productCount: 2115,
  },
  {
    id: 'c3',
    slug: 'scooters',
    name: 'Skuterlar',
    icon: '🛵',
    image: u('1558981403-c5f9899a28bc'), // Harley LiveWire orange
    productCount: 587,
  },
  {
    id: 'c4',
    slug: 'sportbikes',
    name: 'Sport-baykler',
    icon: '🏁',
    image: u('1609630875171-b1321377ee65'), // Yamaha R6 yellow
    productCount: 412,
  },
  {
    id: 'c5',
    slug: 'naked',
    name: 'Naked',
    icon: '⚡',
    image: u('1547549082-6bc09f2049ae'), // Yamaha black naked-style
    productCount: 268,
  },
  {
    id: 'c6',
    slug: 'helmets',
    name: 'Shlemlar',
    icon: '⛑️',
    image: u('1558981852-426c6c22a060'), // Cruiser + sunset (placeholder)
    productCount: 213,
  },
  {
    id: 'c7',
    slug: 'gear',
    name: 'Ekipirovka',
    icon: '🧥',
    image: u('1591047139829-d91aecb6caea'), // Bomber jacket
    productCount: 245,
  },
  {
    id: 'c8',
    slug: 'parts',
    name: "Ehtiyot qismlar",
    icon: '⚙️',
    productCount: 1284,
  },
  {
    id: 'c9',
    slug: 'accessories',
    name: 'Aksessuarlar',
    icon: '🎒',
    productCount: 432,
  },
  {
    id: 'c10',
    slug: 'oils',
    name: 'Moylar va kimyo',
    icon: '🛢️',
    productCount: 187,
  },
  {
    id: 'c11',
    slug: 'tires',
    name: 'Shinalar',
    icon: '⭕',
    productCount: 156,
  },
  { id: 'c12', slug: 'engines', name: 'Dvigatellar', icon: '🔧', productCount: 92 },
  { id: 'c13', slug: 'electronics', name: 'Elektronika', icon: '🔋', productCount: 64 },
  { id: 'c14', slug: 'tuning', name: 'Tuning', icon: '✨', productCount: 178 },
];

export const popularCategories = mockCategories
  .filter((c) => c.image)
  .slice(0, 5);
