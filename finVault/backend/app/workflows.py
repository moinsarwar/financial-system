from .models import ApplicationStatus as S, ProductType as P
WORKFLOWS={
 'loan':[S.DRAFT,S.SUBMITTED,S.REVIEW,S.ELIGIBILITY_CHECK,S.CREDIT_ASSESSMENT,S.OFFER_ISSUED,S.ACCEPTED,S.DISBURSED],
 'insurance':[S.DRAFT,S.SUBMITTED,S.REVIEW,S.UNDERWRITING,S.QUOTED,S.ACCEPTED,S.POLICY_ISSUED],
 'creditCard':[S.DRAFT,S.SUBMITTED,S.REVIEW,S.IDENTITY_CHECK,S.CREDIT_ASSESSMENT,S.APPROVED,S.CARD_ISSUED,S.ACTIVATED],
 'bankAccount':[S.DRAFT,S.SUBMITTED,S.REVIEW,S.KYC_VALIDATION,S.COMPLIANCE_SCREENING,S.APPROVED,S.ACCOUNT_CREATED,S.ACTIVATED]}
CATEGORY={P.CAR_LOAN:'loan',P.PERSONAL_LOAN:'loan',P.MORTGAGE:'loan',P.HEALTH_INSURANCE:'insurance',P.ACCIDENT_INSURANCE:'insurance',P.LIFE_INSURANCE:'insurance',P.CREDIT_CARD:'creditCard',P.BANK_ACCOUNT:'bankAccount'}
SUCCESS={'loan':S.DISBURSED,'insurance':S.POLICY_ISSUED,'creditCard':S.ACTIVATED,'bankAccount':S.ACTIVATED}
def stages(p): return WORKFLOWS[CATEGORY[p]]
def successful(p): return SUCCESS[CATEGORY[p]]
def terminal(status,p): return status in {successful(p),S.REJECTED}
def next_status(status,p):
 st=stages(p)
 try:i=st.index(status)
 except ValueError:return None
 return st[i+1] if i+1<len(st) else None
DOCS={
 P.CAR_LOAN:[('cnic','CNIC Copy'),('application','Application Form'),('income','Income Proof'),('vehicle','Vehicle Documents')],
 P.PERSONAL_LOAN:[('cnic','CNIC Copy'),('application','Application Form'),('income','Income Proof')],
 P.MORTGAGE:[('cnic','CNIC Copy'),('application','Application Form'),('income','Income Proof'),('property','Property Documents')],
 P.HEALTH_INSURANCE:[('cnic','CNIC Copy'),('application','Application Form'),('medical','Medical History')],
 P.ACCIDENT_INSURANCE:[('cnic','CNIC Copy'),('application','Application Form'),('medical','Medical History')],
 P.LIFE_INSURANCE:[('cnic','CNIC Copy'),('application','Application Form'),('medical','Medical History')],
 P.CREDIT_CARD:[('cnic','CNIC Copy'),('application','Application Form'),('income','Income Proof')],}
def document_requirements(p,holder='individual'):
 if p!=P.BANK_ACCOUNT:return DOCS[p]
 base=[('cnic','CNIC Copy'),('application','Application Form')]
 if holder=='business': return base+[('business_registration','Business Registration Certificate'),('constitutional','Constitutional Documents'),('ntn','Tax Registration (NTN)'),('ubo','Beneficial Owner Declaration'),('mandates','Authority Mandates'),('business_address','Proof of Address (Business)')]
 x=base+[('address','Proof of Address'),('income','Income Proof'),('source_funds','Source of Funds Declaration'),('fatca','Tax Residency & FATCA/CRS'),('signature','Specimen Signature'),('nominee','Nominee Information')]
 return x+([('joint_details','Joint Applicant Details')] if holder=='joint' else [])
