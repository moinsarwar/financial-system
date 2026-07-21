import api from './client';

export interface Application {
  id: string;
  client_id: string;
  client_name?: string;
  product_type: string;
  product_label: string;
  department: string;
  steps: string[];
  step_index: number;
  current_step: string;
  amount: number | string;
  currency: string;
  status: 'in-progress' | 'approved' | 'completed' | 'declined' | 'withdrawn' | 'additional-info';
  created_at: string;
  updated_at: string;
  timeline: Array<{
    time: string;
    event: string;
    user: string;
  }>;
  decision_reason_code?: string | null;
  decision_notes?: string | null;
  decided_at?: string | null;
  decided_by_user_id?: string | null;
}

export interface ApplicationCreate {
  client_id: string;
  product_type: string;
  product_label?: string;
  department?: string;
  amount: number;
}

export interface ApplicationDecision {
  outcome: 'approved' | 'declined' | 'withdrawn';
  reason_code: string;
  notes?: string;
}

export async function getApplications(params?: {
  search?: string;
  step?: string;
  status?: string;
  department?: string;
}): Promise<Application[]> {
  const { data } = await api.get<Application[]>(
    '/applications',
    { params },
  );

  return data;
}

export async function getApplication(
  id: string,
): Promise<Application> {
  const { data } = await api.get<Application>(
    `/applications/${id}`,
  );

  return data;
}

export async function createApplication(
  application: ApplicationCreate,
): Promise<Application> {
  const { data } = await api.post<Application>(
    '/applications',
    application,
  );

  return data;
}

export async function advanceApplication(
  id: string,
): Promise<Application> {
  const { data } = await api.post<Application>(
    `/applications/${id}/advance`,
  );

  return data;
}

export async function decideApplication(
  id: string,
  decision: ApplicationDecision,
): Promise<Application> {
  const { data } = await api.post<Application>(
    `/applications/${id}/decision`,
    decision,
  );

  return data;
}

export interface ApplicantInfo {
  full_name: string;
  cnic: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  resident_status: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  years_at_address: number;
  residential_status: string;
}
export interface SalariedEmployment {
  applicant_type: 'salaried';
  employer_name: string;
  employer_sector: string;
  employment_status: string;
  designation: string;
  employment_start_date: string;
  length_of_service_years: number;
  monthly_gross_income: number;
  monthly_net_income: number;
  salary_payment_bank: string;
  salary_account_iban: string;
  employer_address: string;
  employer_contact_number: string;
}
export interface SelfEmployedEmployment {
  applicant_type: 'self-employed';
  business_name: string;
  business_legal_type: string;
  nature_of_business: string;
  industry: string;
  ntn: string;
  registration_number: string;
  commencement_date: string;
  years_in_business: number;
  business_address: string;
  employees: number;
  annual_turnover: number;
  monthly_revenue: number;
  monthly_operating_expenses: number;
  primary_bank: string;
  business_iban: string;
  ownership_percentage: number;
  beneficial_owners: string;
}
export type EmploymentProfile = SalariedEmployment | SelfEmployedEmployment;
export interface FinancialProfile {
  monthly_gross_income: number;
  monthly_net_income: number;
  other_monthly_income: number;
  source_of_other_income: string;
  household_expenses: number;
  existing_loan_repayments: number;
  credit_card_payments: number;
  rent_or_mortgage: number;
  other_obligations: number;
  total_existing_debt: number;
  active_loans: number;
  active_cards: number;
  requested_tenor_months: number;
  source_of_funds: string;
  expected_repayment_source: string;
  primary_bank: string;
  iban: string;
  tax_filer_status: string;
  estimated_assets: number;
  estimated_liabilities: number;
  estimated_net_worth: number;
}
export interface KycAml {
  pep: string;
  sanctions_declaration: string;
  tax_residency: string;
  tax_residence_countries: string;
  us_person: string;
  fatca: string;
  product_purpose: string;
  expected_monthly_transaction_value: number;
  expected_transaction_frequency: string;
  international_transactions_expected: string;
  source_of_wealth: string;
  source_of_funds: string;
  beneficial_owner: string;
  acting_for_another_person: string;
  criminal_proceedings: string;
  insolvency_or_bankruptcy: string;
}
export interface Declarations {
  accuracy: boolean;
  cnic_consent: boolean;
  credit_bureau: boolean;
  bank_verification: boolean;
  fraud_screening: boolean;
  data_sharing: boolean;
  sensitive_data: boolean;
  electronic_comm: boolean;
  electronic_sign: boolean;
  privacy: boolean;
  product_terms: boolean;
  marketing: boolean;
}

export interface UnifiedApplicationRequest {
  client_id: string;
  submission_mode: 'simulation' | 'live';
  product_type: 'loan' | 'motor' | 'health' | 'life' | 'travel' | 'business' | 'savings' | 'credit';
  loan_subtype?: 'personal' | 'business';
  amount: number;
  currency: 'PKR' | 'USD' | 'GBP';
  purpose: string;
  applicant: ApplicantInfo;
  employment_profile: EmploymentProfile;
  financial_profile: FinancialProfile;
  kyc_aml: KycAml;
  product_data: Record<string, any>;
  declarations: Declarations;
  consents: Record<string, boolean>;
  document_ids: string[];
  calculated_indicators: Record<string, any>;
  simulation_metadata?: Record<string, any>;
}

export async function createUnifiedApplication(payload: UnifiedApplicationRequest): Promise<{
  application_id: string;
  client_id: string;
  status: string;
  created_at: string;
}> {
  const { data } = await api.post('/applications/unified', payload);
  return data;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface InformationRequest {
  id: string;
  public_id: string;
  kind: string;
  label: string;
  document_requirement_code?: string;
  status: string;
  response_text?: string;
  created_at: string;
}

export async function getApplicationMessages(id: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/applications/${id}/messages`);
  return data;
}

export async function sendMessage(id: string, message: string): Promise<Message> {
  const { data } = await api.post<Message>(`/applications/${id}/messages`, { message });
  return data;
}

export async function markMessagesRead(id: string): Promise<void> {
  await api.post(`/applications/${id}/messages/read`);
}

export async function requestInformation(id: string, items: {kind: string, label: string, document_requirement_code?: string}[]): Promise<InformationRequest[]> {
  const { data } = await api.post<InformationRequest[]>(`/applications/${id}/information-requests`, { items });
  return data;
}

export async function submitInformationRequests(id: string): Promise<void> {
  await api.post(`/applications/${id}/information-requests/submit`);
}

export async function resolveInformationRequests(id: string): Promise<void> {
  await api.post(`/applications/${id}/information-requests/resolve`);
}

export async function respondToInformationRequest(appId: string, publicId: string, response_text: string): Promise<void> {
  await api.post(`/applications/${appId}/information-requests/${publicId}/response`, { response_text });
}

export async function uploadAppDocument(appId: string, code: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/applications/${appId}/documents/${code}`, formData);
  return data;
}

