export type Category = 'alimentos' | 'bebidas' | 'limpeza' | 'eletronicos' | 'vestuario' | 'outros';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  quantity: number;
  minQuantity: number;
  price: number;
  unit: string;
  createdAt: string;
}

export type MovementType = 'entrada' | 'saida';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  date: string;
}

export const CATEGORIES: Record<Category, { label: string; emoji: string }> = {
  alimentos: { label: 'Alimentos', emoji: '🍎' },
  bebidas: { label: 'Bebidas', emoji: '🥤' },
  limpeza: { label: 'Limpeza', emoji: '🧹' },
  eletronicos: { label: 'Eletrônicos', emoji: '📱' },
  vestuario: { label: 'Vestuário', emoji: '👕' },
  outros: { label: 'Outros', emoji: '📦' },
};

export const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'par'];
