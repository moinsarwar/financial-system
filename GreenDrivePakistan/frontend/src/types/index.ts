export type UserRole = 'user' | 'vendor' | 'admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vendor {
  id: number;
  name: string;
  email?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
  phone?: string | null;
  address?: string | null;
  cnic?: string | null;
  salary?: number;
  is_active?: boolean;
}

export interface Product {
  id: number;
  vendorId: number;
  name: string;
  price: number;
  profit: number | null;
  category: string;
  type: string;
  savingFactorElectric: number;
  savingFactorFuel: number;
  description: string;
  warranty: string | null;
  installation: string | null;
  monthlySaving: number;
  annualSaving: number;
  payback: string | null;
  rating: number;
  vendor?: Vendor;
}

export interface Repayment {
  id: number;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: string;
}

export interface Application {
  id: number;
  userId: number;
  productId: number;
  vendorId: number;
  status: string;
  appliedDate: string;
  reviewedDate: string | null;
  approvedDate: string | null;
  downPayment: number;
  monthlyInstallment: number;
  tenure: number;
  totalDeferred: number;
  paidAmount: number;
  remainingAmount: number;
  nextDueDate: string;
  repayments: Repayment[];
  applicationDetails: Record<string, unknown>;
  product?: Product | ApiProduct;
  vendor?: Vendor;
  user?: { id: number; name: string; email?: string };
}

export interface Lender {
  id: number;
  name: string;
  profitRate: number;
  maxTenure: number;
  is_active: boolean;
}

export interface CashSale {
  id: number;
  vendorId: number;
  productId: number;
  buyerName: string;
  amount: number;
  date: string;
}

export interface ApiProduct {
  id: number;
  vendor_id: number;
  name: string;
  price: number;
  profit: number | null;
  category: string;
  type: string;
  saving_factor_electric: number;
  saving_factor_fuel: number;
  description?: string;
  warranty?: string | null;
  installation?: string | null;
  monthly_saving: number;
  annual_saving: number;
  payback?: string | null;
  rating: number;
  vendor?: Vendor;
}

export interface CompareResult {
  product_id: number;
  product_name: string;
  price: number;
  category?: string | null;
  monthly_installment: number;
  current_total_bill: number;
  new_total_bill: number;
  monthly_saving: number;
  yearly_saving: number;
  horizon_net_saving?: number;
  five_year_net_saving: number;
  down_payment?: number;
  saving_factor_electric: number;
  saving_factor_fuel: number;
  tenure_months?: number;
  horizon_years?: number;
  down_payment_rate?: number;
}

export interface CompareResponse {
  results: CompareResult[];
  best_product: CompareResult | null;
  total_current_bill: number;
  tenure_months?: number;
  horizon_years?: number;
  down_payment_rate?: number;
  lender_name?: string | null;
  lender_max_tenure?: number | null;
  categories?: string[];
}

export interface AdminStats {
  total_users: number;
  total_vendors: number;
  total_applications: number;
  financed_volume: number;
  cash_volume: number;
  total_revenue: number;
  pending_applications: number;
  active_loans: number;
  completed_loans: number;
}

export interface ProductFormData {
  name: string;
  price: number;
  category: string;
  type: string;
  description: string;
  saving_factor_electric: number;
  saving_factor_fuel: number;
  warranty: string | null;
  installation: string | null;
  monthly_saving: number;
  annual_saving: number;
  payback: string | null;
  rating: number;
}
