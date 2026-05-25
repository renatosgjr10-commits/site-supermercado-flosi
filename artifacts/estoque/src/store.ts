import { Product, Movement, Category } from './types';

const PRODUCTS_KEY = 'estoque_products';
const MOVEMENTS_KEY = 'estoque_movements';

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getProducts(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getMovements(): Movement[] {
  try {
    return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMovements(movements: Movement[]) {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

export function addProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getProducts();
  const product: Product = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  products.push(product);
  saveProducts(products);
  return product;
}

export function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data };
  saveProducts(products);
  return products[idx];
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
  const movements = getMovements().filter(m => m.productId !== id);
  saveMovements(movements);
}

export function addMovement(
  productId: string,
  type: 'entrada' | 'saida',
  quantity: number,
  reason: string
): Movement | null {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return null;

  if (type === 'saida' && products[idx].quantity < quantity) return null;

  products[idx].quantity += type === 'entrada' ? quantity : -quantity;
  saveProducts(products);

  const movement: Movement = {
    id: generateId(),
    productId,
    productName: products[idx].name,
    type,
    quantity,
    reason,
    date: new Date().toISOString(),
  };

  const movements = getMovements();
  movements.unshift(movement);
  saveMovements(movements);
  return movement;
}

export function seedDemoData() {
  if (getProducts().length > 0) return;

  const demos: Omit<Product, 'id' | 'createdAt'>[] = [
    { name: 'Arroz Tipo 1 (5kg)', sku: 'ALI-001', category: 'alimentos', quantity: 42, minQuantity: 10, price: 24.90, unit: 'pct' },
    { name: 'Feijão Carioca (1kg)', sku: 'ALI-002', category: 'alimentos', quantity: 8, minQuantity: 15, price: 9.50, unit: 'pct' },
    { name: 'Óleo de Soja (900ml)', sku: 'ALI-003', category: 'alimentos', quantity: 30, minQuantity: 12, price: 7.80, unit: 'un' },
    { name: 'Refrigerante Lata 350ml', sku: 'BEB-001', category: 'bebidas', quantity: 144, minQuantity: 48, price: 3.50, unit: 'un' },
    { name: 'Água Mineral (500ml)', sku: 'BEB-002', category: 'bebidas', quantity: 5, minQuantity: 24, price: 1.20, unit: 'un' },
    { name: 'Detergente Neutro 500ml', sku: 'LIM-001', category: 'limpeza', quantity: 24, minQuantity: 6, price: 2.90, unit: 'un' },
    { name: 'Sabão em Pó 1kg', sku: 'LIM-002', category: 'limpeza', quantity: 3, minQuantity: 8, price: 8.70, unit: 'cx' },
    { name: 'Carregador USB-C', sku: 'ELE-001', category: 'eletronicos', quantity: 12, minQuantity: 3, price: 49.90, unit: 'un' },
  ];

  const products: Product[] = demos.map(d => ({ ...d, id: generateId(), createdAt: new Date().toISOString() }));
  saveProducts(products);

  const movements: Movement[] = [
    { id: generateId(), productId: products[0].id, productName: products[0].name, type: 'entrada', quantity: 50, reason: 'Compra fornecedor', date: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: generateId(), productId: products[3].id, productName: products[3].name, type: 'entrada', quantity: 144, reason: 'Reposição de estoque', date: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: generateId(), productId: products[0].id, productName: products[0].name, type: 'saida', quantity: 8, reason: 'Venda balcão', date: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: generateId(), productId: products[2].id, productName: products[2].name, type: 'saida', quantity: 5, reason: 'Venda', date: new Date(Date.now() - 86400000 / 2).toISOString() },
    { id: generateId(), productId: products[1].id, productName: products[1].name, type: 'saida', quantity: 7, reason: 'Venda balcão', date: new Date(Date.now() - 3600000).toISOString() },
  ];
  saveMovements(movements);
}
