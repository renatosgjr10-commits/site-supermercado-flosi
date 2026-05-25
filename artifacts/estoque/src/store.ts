import { Product, Movement, Supplier, getCategories } from './types';

const PRODUCTS_KEY = 'flosi_products';
const MOVEMENTS_KEY = 'flosi_movements';
const SUPPLIERS_KEY = 'flosi_suppliers';

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getProducts(): Product[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    return (raw as Record<string, unknown>[]).map(p => ({
      id: String(p.id || ''),
      name: String(p.name || ''),
      sku: String(p.sku || ''),
      category: String(p.category || 'outros'),
      quantity: Number(p.quantity ?? 0),
      minQuantity: Number(p.minQuantity ?? 5),
      purchasePrice: Number(p.purchasePrice ?? (p as Record<string, unknown>).price ?? 0),
      salePrice: Number(p.salePrice ?? (p as Record<string, unknown>).price ?? 0),
      unit: String(p.unit || 'un'),
      supplierId: String(p.supplierId || ''),
      expirationDate: String(p.expirationDate || ''),
      createdAt: String(p.createdAt || new Date().toISOString()),
    }));
  } catch { return []; }
}
export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getMovements(): Movement[] {
  try { return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]'); } catch { return []; }
}
export function saveMovements(movements: Movement[]) {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

export function getSuppliers(): Supplier[] {
  try { return JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || '[]'); } catch { return []; }
}
export function saveSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
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
  saveProducts(getProducts().filter(p => p.id !== id));
  saveMovements(getMovements().filter(m => m.productId !== id));
}

export function addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const suppliers = getSuppliers();
  const s: Supplier = { ...data, id: generateId(), createdAt: new Date().toISOString() };
  suppliers.push(s);
  saveSuppliers(suppliers);
  return s;
}

export function updateSupplier(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Supplier | null {
  const suppliers = getSuppliers();
  const idx = suppliers.findIndex(s => s.id === id);
  if (idx === -1) return null;
  suppliers[idx] = { ...suppliers[idx], ...data };
  saveSuppliers(suppliers);
  return suppliers[idx];
}

export function deleteSupplier(id: string) {
  saveSuppliers(getSuppliers().filter(s => s.id !== id));
}

export function addMovement(
  productId: string,
  type: 'entrada' | 'saida',
  quantity: number,
  reason: string,
  observation: string
): Movement | null {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return null;
  if (type === 'saida' && products[idx].quantity < quantity) return null;
  products[idx].quantity += type === 'entrada' ? quantity : -quantity;
  saveProducts(products);
  const movement: Movement = {
    id: generateId(), productId, productName: products[idx].name,
    type, quantity, reason, observation, date: new Date().toISOString(),
  };
  const movements = getMovements();
  movements.unshift(movement);
  saveMovements(movements);
  return movement;
}

export function seedDemoData() {
  if (getProducts().length > 0) return;

  const sup1 = addSupplier({ name: 'Distribuidora Pão de Açúcar', cnpj: '12.345.678/0001-99', phone: '(11) 98765-4321', email: 'contato@distribuidor.com.br', address: 'Rua das Flores, 123 - São Paulo, SP' });
  const sup2 = addSupplier({ name: 'Atacadão Bebidas Ltda', cnpj: '98.765.432/0001-10', phone: '(11) 91234-5678', email: 'vendas@atacadao.com', address: 'Av. Industrial, 456 - Guarulhos, SP' });

  const prods: Omit<Product, 'id' | 'createdAt'>[] = [
    { name: 'Arroz Tipo 1 (5kg)', sku: 'ALI-001', category: 'alimentos', quantity: 42, minQuantity: 10, purchasePrice: 18.50, salePrice: 24.90, unit: 'pct', supplierId: sup1.id, expirationDate: '2026-12-01' },
    { name: 'Feijão Carioca (1kg)', sku: 'ALI-002', category: 'alimentos', quantity: 8, minQuantity: 15, purchasePrice: 6.90, salePrice: 9.50, unit: 'pct', supplierId: sup1.id, expirationDate: '2026-09-15' },
    { name: 'Óleo de Soja (900ml)', sku: 'ALI-003', category: 'alimentos', quantity: 30, minQuantity: 12, purchasePrice: 5.20, salePrice: 7.80, unit: 'un', supplierId: sup1.id, expirationDate: '2026-06-30' },
    { name: 'Refrigerante Cola 2L', sku: 'BEB-001', category: 'bebidas', quantity: 96, minQuantity: 48, purchasePrice: 5.50, salePrice: 8.90, unit: 'un', supplierId: sup2.id, expirationDate: '2025-11-01' },
    { name: 'Água Mineral (500ml)', sku: 'BEB-002', category: 'bebidas', quantity: 5, minQuantity: 24, purchasePrice: 0.80, salePrice: 1.50, unit: 'un', supplierId: sup2.id, expirationDate: '2026-03-01' },
    { name: 'Detergente Neutro 500ml', sku: 'LIM-001', category: 'limpeza', quantity: 24, minQuantity: 6, purchasePrice: 1.80, salePrice: 3.20, unit: 'un', supplierId: sup1.id, expirationDate: '' },
    { name: 'Sabão em Pó 1kg', sku: 'LIM-002', category: 'limpeza', quantity: 3, minQuantity: 8, purchasePrice: 6.50, salePrice: 9.90, unit: 'cx', supplierId: sup1.id, expirationDate: '' },
    { name: 'Queijo Mussarela (kg)', sku: 'FRI-001', category: 'frios', quantity: 15, minQuantity: 5, purchasePrice: 28.00, salePrice: 42.90, unit: 'kg', supplierId: sup1.id, expirationDate: '2025-06-10' },
    { name: 'Leite Integral (1L)', sku: 'FRI-002', category: 'frios', quantity: 60, minQuantity: 20, purchasePrice: 3.50, salePrice: 5.49, unit: 'un', supplierId: sup1.id, expirationDate: '2025-07-01' },
    { name: 'Pão Francês (kg)', sku: 'PAD-001', category: 'padaria', quantity: 20, minQuantity: 10, purchasePrice: 8.00, salePrice: 14.90, unit: 'kg', supplierId: sup1.id, expirationDate: '2025-05-26' },
  ];

  const products: Product[] = prods.map(d => ({ ...d, id: generateId(), createdAt: new Date().toISOString() }));
  saveProducts(products);

  const movements: Movement[] = [
    { id: generateId(), productId: products[0].id, productName: products[0].name, type: 'entrada', quantity: 50, reason: 'Compra fornecedor', observation: 'NF 12345', date: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: generateId(), productId: products[3].id, productName: products[3].name, type: 'entrada', quantity: 96, reason: 'Reposição', observation: '', date: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: generateId(), productId: products[0].id, productName: products[0].name, type: 'saida', quantity: 8, reason: 'Venda', observation: '', date: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: generateId(), productId: products[2].id, productName: products[2].name, type: 'saida', quantity: 5, reason: 'Venda', observation: '', date: new Date(Date.now() - 43200000).toISOString() },
    { id: generateId(), productId: products[1].id, productName: products[1].name, type: 'saida', quantity: 7, reason: 'Venda', observation: 'Promoção do dia', date: new Date(Date.now() - 3600000).toISOString() },
  ];
  saveMovements(movements);
}
