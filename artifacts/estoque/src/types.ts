export type Category = string;

export const DEFAULT_CATEGORIES = [
  { id: 'alimentos', label: 'Alimentos', emoji: '🍎' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'limpeza', label: 'Limpeza', emoji: '🧹' },
  { id: 'hortifruti', label: 'Hortifruti', emoji: '🥦' },
  { id: 'frios', label: 'Frios e Laticínios', emoji: '🧀' },
  { id: 'padaria', label: 'Padaria', emoji: '🍞' },
  { id: 'acougue', label: 'Açougue', emoji: '🥩' },
  { id: 'higiene', label: 'Higiene Pessoal', emoji: '🧴' },
  { id: 'outros', label: 'Outros', emoji: '📦' },
];

const CATS_KEY = 'flosi_categories';
export function getCategories(): { id: string; label: string; emoji: string }[] {
  try {
    const saved = localStorage.getItem(CATS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}
export function saveCategories(cats: { id: string; label: string; emoji: string }[]) {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats));
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  purchasePrice: number;
  salePrice: number;
  unit: string;
  supplierId: string;
  expirationDate: string;
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
  observation: string;
  date: string;
}

export const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct', 'par', 'dz', 'fardo'];

export const CREDENTIALS = { user: 'admin', password: 'flosi123' };
