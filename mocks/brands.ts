import type { Brand } from '@/types/product';

export const mockBrands: Brand[] = [
  { id: 'b1', slug: 'honda', name: 'Honda' },
  { id: 'b2', slug: 'yamaha', name: 'Yamaha' },
  { id: 'b3', slug: 'suzuki', name: 'Suzuki' },
  { id: 'b4', slug: 'kawasaki', name: 'Kawasaki' },
  { id: 'b5', slug: 'ktm', name: 'KTM' },
  { id: 'b6', slug: 'ducati', name: 'Ducati' },
  { id: 'b7', slug: 'bmw', name: 'BMW Motorrad' },
  { id: 'b8', slug: 'ls2', name: 'LS2' },
  { id: 'b9', slug: 'shoei', name: 'Shoei' },
  { id: 'b10', slug: 'agv', name: 'AGV' },
  { id: 'b11', slug: 'alpinestars', name: 'Alpinestars' },
  { id: 'b12', slug: 'dainese', name: 'Dainese' },
  { id: 'b13', slug: 'michelin', name: 'Michelin' },
  { id: 'b14', slug: 'pirelli', name: 'Pirelli' },
  { id: 'b15', slug: 'motul', name: 'Motul' },
  { id: 'b16', slug: 'castrol', name: 'Castrol' },
];

export const popularBrands = mockBrands.slice(0, 8);
