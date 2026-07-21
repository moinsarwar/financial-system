import api from './client';  
  
export interface Product {  
  id: string;  
  client_id: string;  
  client_name: string;  
  product_type: string;  
  product_label: string;  
  status: string;  
  policy_number?: string;  
  start_date?: string;  
  end_date?: string;  
  premium?: number;  
  sum_assured?: number;  
  holding_type?: string;  
  opened_at?: string;  
  details?: Record<string, unknown>;  
}  
  
export async function getProducts(params?: {  
  search?: string;  
  product_type?: string;  
  status?: string;  
  department?: string;  
}): Promise<Product[]> {  
  const { data } = await api.get<Product[]>('/products', { params });  
  return data;  
}  
  
export async function getProduct(id: string): Promise<Product> {  
  const { data } = await api.get<Product>(`/products/${id}`);  
  return data;  
}

export interface FrontProduct {
  product_id: string;
  provider_id: string;
  product_type: string;
  features: { name: string }[];
}

export async function getFrontProducts(): Promise<FrontProduct[]> {
  const { data } = await api.get<{products: FrontProduct[]}>('/front_products?limit=100');
  return data.products;
}
