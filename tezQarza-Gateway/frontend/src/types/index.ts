export interface Product {
  id: string;
  lfe_product_id: string;
  name: string;
  icon: string;
  type: string;
  group_name: string;
  max_amount: number;
  min_tenure: number;
  max_tenure: number;
  tag: string;
  ideal: string;
  processing: string;
}

export interface Application {
  id: number;
  ref: string;
  product_id: string;
  full_name: string;
  cnic_masked: string;
  mobile_masked: string;
  income: number;
  liabilities: number;
  amount: number;
  tenure: number;
  status: 'submitted' | 'lfe_received' | 'lfe_processing' | 'lfe_decided' | 'referred' | 'failed';
  decision?: 'approved' | 'rejected' | 'review' | 'conditional' | 'no_match';
  score?: number;
  risk_band?: string;
  route?: string;
  matched_lenders: string[];
  reason_codes: string[];
  policy_version?: string;
  audit_id?: string;
  lfe_application_id?: string;
  lfe_decision_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_submitted: number;
  lfe_accepted: number;
  decisions_returned: number;
  routed_to_lender: number;
  approved_in_principle: number;
  rejected: number;
  manual_review: number;
  avg_lfe_response_time: number;
  top_rejection_reasons: Array<{reason: string, count: number}>;
  top_product_routes: Array<{route: string, count: number}>;
  lender_match_rate: number;
  channel_failed: number;
  channel_pending_lfe: number;
}
