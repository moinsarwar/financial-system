from typing import Optional, List, Literal, Union, Dict, Any, Annotated
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator, model_validator
from decimal import Decimal
from datetime import datetime

# ---------- COMMON ----------
class Address(BaseModel):
    street: str
    city: str
    province: str
    postal_code: str

# ---------- APPLICANT ----------
class ApplicantInfo(BaseModel):
    full_name: str = Field(..., min_length=1)
    father_name: Optional[str] = None
    cnic: str = Field(..., pattern=r'^\d{5}-\d{7}-\d{1}$')
    cnic_issue_date: Optional[str] = None
    cnic_expiry_date: Optional[str] = None
    date_of_birth: str
    gender: Literal["Male", "Female", "Other"]
    marital_status: Literal["Single", "Married", "Divorced", "Widowed"]
    nationality: str
    resident_status: Literal["Resident", "Non-Resident"]
    mobile: str = Field(..., pattern=r'^\+92[\d\s]{10,13}$')
    email: EmailStr
    address: str
    city: str
    province: str
    postal_code: str
    years_at_address: int = Field(ge=0)
    residential_status: Literal["Owned", "Rented", "Family-owned", "Employer-provided"]

# ---------- EMPLOYMENT ----------
class SalariedEmployment(BaseModel):
    applicant_type: Literal["salaried"] = "salaried"
    employer_name: str
    employer_sector: Literal["Private", "Public", "Government"]
    employment_status: Literal["Permanent", "Contract", "Probation"]
    designation: str
    employee_id: Optional[str] = None
    employment_start_date: str
    length_of_service_years: int = Field(ge=0)
    monthly_gross_income: Decimal = Field(ge=0)
    monthly_net_income: Decimal = Field(ge=0)
    salary_payment_bank: str
    salary_account_iban: str
    employer_address: str
    employer_contact_number: str

class SelfEmployedEmployment(BaseModel):
    applicant_type: Literal["self-employed"] = "self-employed"
    business_name: str
    business_legal_type: Literal["Sole Proprietorship", "Partnership", "Private Limited"]
    nature_of_business: str
    industry: str
    ntn: str
    strn: Optional[str] = None
    registration_number: str
    commencement_date: str
    years_in_business: int = Field(ge=0)
    business_address: str
    employees: int = Field(ge=0)
    annual_turnover: Decimal = Field(ge=0)
    monthly_revenue: Decimal = Field(ge=0)
    monthly_operating_expenses: Decimal = Field(ge=0)
    primary_bank: str
    business_iban: str
    ownership_percentage: Decimal = Field(ge=0, le=100)
    beneficial_owners: str

EmploymentProfile = Union[SalariedEmployment, SelfEmployedEmployment]

# ---------- FINANCIAL PROFILE ----------
class FinancialProfile(BaseModel):
    monthly_gross_income: Decimal = Field(ge=0)
    monthly_net_income: Decimal = Field(ge=0)
    other_monthly_income: Decimal = Field(ge=0)
    source_of_other_income: str
    household_expenses: Decimal = Field(ge=0)
    existing_loan_repayments: Decimal = Field(ge=0)
    credit_card_payments: Decimal = Field(ge=0)
    rent_or_mortgage: Decimal = Field(ge=0)
    other_obligations: Decimal = Field(ge=0)
    total_existing_debt: Decimal = Field(ge=0)
    active_loans: int = Field(ge=0)
    active_cards: int = Field(ge=0)
    requested_tenor_months: int = Field(ge=1)
    source_of_funds: str
    expected_repayment_source: str
    primary_bank: str
    iban: str
    tax_filer_status: Literal["Filer", "Non-Filer"]
    ntn: Optional[str] = None
    estimated_assets: Decimal = Field(ge=0)
    estimated_liabilities: Decimal = Field(ge=0)
    estimated_net_worth: Decimal

# ---------- KYC / AML ----------
class KycAml(BaseModel):
    pep: Literal["No", "Yes"]
    pep_relationship: Optional[str] = None
    sanctions_declaration: Literal["No", "Yes"]
    tax_residency: str
    tax_residence_countries: str
    foreign_tax_id: Optional[str] = None
    us_person: Literal["No", "Yes"]
    fatca: Literal["Compliant", "Not Applicable"]
    product_purpose: str
    expected_monthly_transaction_value: Decimal = Field(ge=0)
    expected_transaction_frequency: Literal["Daily", "Weekly", "Monthly"]
    international_transactions_expected: Literal["No", "Yes"]
    source_of_wealth: str
    source_of_funds: str
    beneficial_owner: Literal["Yes", "No"]
    acting_for_another_person: Literal["No", "Yes"]
    criminal_proceedings: Literal["No", "Yes"]
    insolvency_or_bankruptcy: Literal["No", "Yes"]

    @model_validator(mode="after")
    def validate_pep_relationship(self):
        if self.pep == "Yes" and not self.pep_relationship:
            raise ValueError("pep_relationship is required when PEP is Yes")
        return self

# ---------- PRODUCT-SPECIFIC DATA (discriminated) ----------
class BaseProductData(BaseModel):
    product_type: str

class LoanData(BaseProductData):
    product_type: Literal["loan"] = "loan"
    tenor: int = Field(ge=1)
    purpose_detail: str
    secured: Literal["Unsecured", "Secured"]
    repayment_date: Optional[int] = None
    repayment_account_iban: Optional[str] = None
    existing_lenders: Optional[str] = None
    existing_facilities: Optional[str] = None
    existing_outstanding: Decimal = Field(ge=0)
    existing_monthly: Decimal = Field(ge=0)
    collateral_type: Optional[str] = None
    collateral_description: Optional[str] = None
    collateral_value: Optional[Decimal] = None
    property_ownership: Optional[str] = None
    guarantor_required: Literal["No", "Yes"]
    guarantor_name: Optional[str] = None
    guarantor_cnic: Optional[str] = None
    guarantor_income: Optional[Decimal] = None
    business_turnover: Optional[Decimal] = None
    working_capital: Optional[Decimal] = None
    use_of_funds: Optional[str] = None
    repayment_source: Optional[str] = None
    grace_period: Optional[int] = None
    seasonal_info: Optional[str] = None

    @model_validator(mode="after")
    def validate_secured_loan(self):
        if self.secured == "Secured":
            if not self.collateral_type:
                raise ValueError("collateral_type required for secured loan")
            if self.collateral_value is None or self.collateral_value <= 0:
                raise ValueError("collateral_value required for secured loan")
        return self

    @model_validator(mode="after")
    def validate_guarantor(self):
        if self.guarantor_required == "Yes":
            if not self.guarantor_name:
                raise ValueError("guarantor_name required when guarantor is Yes")
            if not self.guarantor_cnic:
                raise ValueError("guarantor_cnic required when guarantor is Yes")
            if self.guarantor_income is None or self.guarantor_income <= 0:
                raise ValueError("guarantor_income required when guarantor is Yes")
        return self

class MotorData(BaseProductData):
    product_type: Literal["motor"] = "motor"
    make: str
    model: str
    variant: Optional[str] = None
    year: int = Field(ge=1900)
    registration_year: Optional[int] = None
    registration_number: str
    engine_number: Optional[str] = None
    chassis_number: Optional[str] = None
    color: Optional[str] = None
    engine_capacity: Optional[int] = None
    fuel_type: Literal["Petrol", "Diesel", "Electric", "Hybrid"]
    usage: Literal["Private", "Commercial", "Rental"]
    ownership_type: Literal["Owned", "Financed", "Leased"]
    financed_institution: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    sum_insured: Decimal = Field(ge=0)
    coverage_type: Literal["Comprehensive", "Third Party", "Fire & Theft"]
    deductible: Optional[Decimal] = None
    tracker_installed: Literal["Yes", "No"]
    anti_theft: Literal["Yes", "No"]
    modifications: Optional[str] = None
    parking_location: Optional[str] = None
    city_of_use: Optional[str] = None
    intercity_use: Literal["No", "Yes"]
    commercial_use: Literal["No", "Yes"]
    driver_name: str
    driver_cnic: str
    driver_license: str
    driver_license_date: Optional[str] = None
    driver_experience: int = Field(ge=0)
    previous_insurers: Optional[str] = None
    previous_policy: Optional[str] = None
    previous_claims: int = Field(ge=0)
    claim_amounts: Optional[str] = None
    at_fault_accidents: int = Field(ge=0)
    no_claim_discount: int = Field(ge=0)
    existing_damage: Optional[str] = None

    @model_validator(mode="after")
    def validate_financed(self):
        if self.ownership_type == "Financed" and not self.financed_institution:
            raise ValueError("financed_institution required when ownership_type is Financed")
        return self

# Added dummy structures for the omitted products to make it valid
class HealthData(BaseProductData):
    product_type: Literal["health"] = "health"

class LifeData(BaseProductData):
    product_type: Literal["life"] = "life"

class TravelData(BaseProductData):
    product_type: Literal["travel"] = "travel"

class BusinessData(BaseProductData):
    product_type: Literal["business"] = "business"

class SavingsData(BaseProductData):
    product_type: Literal["savings"] = "savings"

class CreditData(BaseProductData):
    product_type: Literal["credit"] = "credit"

# ---------- DECLARATIONS ----------
class Declarations(BaseModel):
    accuracy: bool
    cnic_consent: bool
    credit_bureau: bool
    bank_verification: bool
    fraud_screening: bool
    data_sharing: bool
    sensitive_data: bool
    electronic_comm: bool
    electronic_sign: bool
    privacy: bool
    product_terms: bool
    marketing: bool

# ---------- LEGAL ACCEPTANCE ----------
class LegalAcceptance(BaseModel):
    document_type: str
    version: str
    accepted: bool
    accepted_at: datetime
    simulation: bool

# ---------- UNIFIED REQUEST ----------
ProductData = Annotated[
    Union[
        LoanData,
        MotorData,
        HealthData,
        LifeData,
        TravelData,
        BusinessData,
        SavingsData,
        CreditData,
    ],
    Field(discriminator="product_type"),
]

class UnifiedApplicationRequest(BaseModel):
    client_id: str
    submission_mode: Literal["simulation", "live"] = "simulation"
    product_type: Literal["loan", "motor", "health", "life", "travel", "business", "savings", "credit"]
    loan_subtype: Optional[Literal["personal", "business"]] = None
    amount: Decimal = Field(ge=0)
    currency: Literal["PKR", "USD", "GBP"] = "PKR"
    purpose: str
    applicant: ApplicantInfo
    employment_profile: EmploymentProfile
    financial_profile: FinancialProfile
    kyc_aml: KycAml
    product_data: ProductData
    declarations: Declarations
    consents: Dict[str, bool]
    document_ids: List[str] = Field(default_factory=list)
    calculated_indicators: Dict[str, Any]
    simulation_metadata: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_product_consistency(self):
        if self.product_data.product_type != self.product_type:
            raise ValueError("product_data.product_type must match request product_type")
        return self

    @model_validator(mode="after")
    def validate_loan_subtype(self):
        if self.product_type == "loan" and not self.loan_subtype:
            raise ValueError("loan_subtype required for loan products")
        return self

class UnifiedApplicationResponse(BaseModel):
    application_id: str
    client_id: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
