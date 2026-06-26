export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export const mockColors: ColorOption[] = [
  { id: 'black', name: 'Qora', hex: '#0A0A0A' },
  { id: 'white', name: 'Oq', hex: '#F5F5F5' },
  { id: 'red', name: 'Qizil', hex: '#DC2626' },
  { id: 'blue', name: 'Ko\'k', hex: '#2563EB' },
  { id: 'yellow', name: 'Sariq', hex: '#FFB800' },
  { id: 'green', name: 'Yashil', hex: '#16A34A' },
  { id: 'gray', name: 'Kulrang', hex: '#737373' },
  { id: 'orange', name: 'To\'q sariq', hex: '#EA580C' },
  { id: 'silver', name: 'Kumush', hex: '#9CA3AF' },
];
