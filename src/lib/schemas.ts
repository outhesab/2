import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Ürün adı gerekli'),
  category: z.string().min(1, 'Kategori gerekli'),
  supplierId: z.string().optional(),
  brand: z.string().optional(),
  cost: z.number().min(0),
  costCurrency: z.enum(['TRY', 'USD', 'EUR']).default('TRY'),
  price: z.number().min(0),
  stock: z.number().int(),
  minStock: z.number().int().default(5),
  barcode: z.string().optional(),
  description: z.string().optional(),
  vat: z.number().min(0).max(100).optional(),
  deleted: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const SaleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  cost: z.number().min(0),
  total: z.number().min(0),
});

export const SaleIntentSchema = z.object({
  items: z.array(SaleItemSchema).min(1, 'En az bir ürün eklenmelidir'),
  payment: z.enum(['nakit', 'kart', 'havale', 'cari']),
  cariId: z.string().optional(),
  cariName: z.string().optional(),
  customerName: z.string().optional(),
  discount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  tahsilat: z.number().min(0).optional(),
  saleDate: z.string().optional(),
  dueDays: z.number().int().min(0).optional(),
});

export const CariTahsilatSchema = z.object({
  cariId: z.string().min(1, 'Cari seçimi gerekli'),
  amount: z.number().positive('Tutar pozitif olmalıdır'),
  kasa: z.string().min(1, 'Kasa seçimi gerekli'),
});

export const CariEkleSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  taxNumber: z.string().optional(),
  email: z.string().email('Geçersiz e-posta').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const StokGuncelleSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi gerekli'),
  quantity: z.number().positive('Miktar pozitif olmalıdır'),
  type: z.enum(['giris', 'cikis']).default('cikis'),
  label: z.string().optional(),
});

export const KasaIslemSchema = z.object({
  amount: z.number().positive('Tutar pozitif olmalıdır'),
  kasa: z.string().min(1, 'Kasa seçimi gerekli'),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const SaleIptalSchema = z.object({
  saleId: z.string().min(1, 'Satış ID gerekli'),
});

export const SaleIadeSchema = z.object({
  saleId: z.string().min(1, 'Satış ID gerekli'),
  quantity: z.union([z.number().positive(), z.record(z.string(), z.number())]).optional(),
});

export const SaleFiyatDuzeltSchema = z.object({
  saleId: z.string().min(1, 'Satış ID gerekli'),
  yeniFiyat: z.union([z.number().min(0), z.record(z.string(), z.number())]).optional(),
  unitPrice: z.union([z.number().min(0), z.record(z.string(), z.number())]).optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
export type SaleIntentInput = z.infer<typeof SaleIntentSchema>;
export type CariTahsilatInput = z.infer<typeof CariTahsilatSchema>;
export type CariEkleInput = z.infer<typeof CariEkleSchema>;
export type StokGuncelleInput = z.infer<typeof StokGuncelleSchema>;
export type KasaIslemInput = z.infer<typeof KasaIslemSchema>;
export type SaleIptalInput = z.infer<typeof SaleIptalSchema>;
export type SaleIadeInput = z.infer<typeof SaleIadeSchema>;
export type SaleFiyatDuzeltInput = z.infer<typeof SaleFiyatDuzeltSchema>;
