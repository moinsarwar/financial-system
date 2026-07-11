import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { createUnifiedApplication, UnifiedApplicationRequest } from '../api/applications';
import { getClients } from '../api/clients';
import { useQuery } from '@tanstack/react-query';

export const UnifiedApplication: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [productType, setProductType] = useState('loan');
  const [amount, setAmount] = useState('50000');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
    enabled: user?.role !== 'client',
  });

  const handleSubmit = async () => {
    const effectiveClientId = user?.role === 'client' ? user.client_id ?? '' : selectedClientId;
    
    if (!effectiveClientId) {
      toast.error('Client ID is required');
      return;
    }

    const payload: UnifiedApplicationRequest = {
      client_id: effectiveClientId,
      submission_mode: 'simulation',
      product_type: productType as any,
      loan_subtype: productType === 'loan' ? 'personal' : undefined,
      amount: Number(amount),
      currency: 'PKR',
      purpose: 'General',
      applicant: {
        full_name: 'Test Applicant',
        cnic: '12345-1234567-1',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        marital_status: 'Single',
        nationality: 'Pakistani',
        resident_status: 'Resident',
        mobile: '+923001234567',
        email: 'test@example.com',
        address: 'Test Address',
        city: 'Karachi',
        province: 'Sindh',
        postal_code: '74200',
        years_at_address: 5,
        residential_status: 'Owned',
      },
      employment_profile: {
        applicant_type: 'salaried',
        employer_name: 'Test Company',
        employer_sector: 'Private',
        employment_status: 'Permanent',
        designation: 'Manager',
        employment_start_date: '2020-01-01',
        length_of_service_years: 5,
        monthly_gross_income: 100000,
        monthly_net_income: 90000,
        salary_payment_bank: 'Test Bank',
        salary_account_iban: 'PK12TEST0000000000000000',
        employer_address: 'Test Env',
        employer_contact_number: '111222333',
      },
      financial_profile: {
        monthly_gross_income: 100000,
        monthly_net_income: 90000,
        other_monthly_income: 0,
        source_of_other_income: '',
        household_expenses: 30000,
        existing_loan_repayments: 0,
        credit_card_payments: 0,
        rent_or_mortgage: 0,
        other_obligations: 0,
        total_existing_debt: 0,
        active_loans: 0,
        active_cards: 0,
        requested_tenor_months: 12,
        source_of_funds: 'Salary',
        expected_repayment_source: 'Salary',
        primary_bank: 'Test Bank',
        iban: 'PK12TEST0000000000000000',
        tax_filer_status: 'Filer',
        estimated_assets: 500000,
        estimated_liabilities: 0,
        estimated_net_worth: 500000,
      },
      kyc_aml: {
        pep: 'No',
        sanctions_declaration: 'No',
        tax_residency: 'Pakistan',
        tax_residence_countries: 'Pakistan',
        us_person: 'No',
        fatca: 'Not Applicable',
        product_purpose: 'Personal use',
        expected_monthly_transaction_value: 50000,
        expected_transaction_frequency: 'Monthly',
        international_transactions_expected: 'No',
        source_of_wealth: 'Salary',
        source_of_funds: 'Salary',
        beneficial_owner: 'Yes',
        acting_for_another_person: 'No',
        criminal_proceedings: 'No',
        insolvency_or_bankruptcy: 'No',
      },
      product_data: {
        product_type: productType,
        tenor: 12,
        purpose_detail: 'Personal Loan',
        secured: 'Unsecured',
        guarantor_required: 'No',
      },
      declarations: {
        accuracy: true,
        cnic_consent: true,
        credit_bureau: true,
        bank_verification: true,
        fraud_screening: true,
        data_sharing: true,
        sensitive_data: true,
        electronic_comm: true,
        electronic_sign: true,
        privacy: true,
        product_terms: true,
        marketing: false,
      },
      consents: {},
      document_ids: [],
      calculated_indicators: {},
      simulation_metadata: { created_at: new Date().toISOString() },
    };

    try {
      const result = await createUnifiedApplication(payload);
      toast.success(`Application ${result.application_id} created`);
      navigate('/applications');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Unified Application</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
        
        {user?.role !== 'client' && (
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select
              className="form-input"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Select client</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Product Type *</label>
          <select className="form-input" value={productType} onChange={(e) => setProductType(e.target.value)}>
            <option value="loan">Loan</option>
            <option value="motor">Motor</option>
            <option value="health">Health</option>
            <option value="life">Life</option>
            <option value="travel">Travel</option>
            <option value="business">Business</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Amount *</label>
          <input
            type="number"
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <p className="text-sm text-gray-500 my-4">Note: A simplified dummy payload is used for simulation in this view.</p>

        <button className="btn gold w-full" onClick={handleSubmit}>
          Submit Application
        </button>
      </div>
    </div>
  );
};
