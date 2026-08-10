/* GreenDrive Pakistan — API-wired frontend (from HTML simulation) */
const API = '/api';
let authToken = localStorage.getItem('gd_token') || null;
let currentUser = JSON.parse(localStorage.getItem('gd_user') || 'null');
let productCatalog = [];
let vendors = [];
let users = [];
let applications = [];
let cashSales = [];
let lenders = [];
let activeLenderId = 1;
let currentPage = 'public-home';
let pendingProductForApplication = null;
let currentCategory = 'all';
let currentSearch = '';
let currentLegalTab = 'terms';

async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const opts = Object.assign({}, options, { headers });
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch (e) { /* ignore */ }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

function computeProfit(price) {
  const lender = lenders.find(l => l.id === activeLenderId) || lenders.find(l => l.is_active) || lenders[0];
  const rate = lender ? lender.profitRate : 0.13;
  return Math.round(price * rate);
}
function updateProductProfits() {
  productCatalog.forEach(p => {
    if (p.profit == null) p.profit = computeProfit(p.price);
  });
}

function mapProduct(p) {
  return {
    id: p.id,
    vendorId: p.vendor_id,
    name: p.name,
    price: p.price,
    profit: p.profit,
    category: p.category,
    type: p.type,
    savingFactorElectric: p.saving_factor_electric,
    savingFactorFuel: p.saving_factor_fuel,
    description: p.description || '',
    warranty: p.warranty,
    installation: p.installation,
    monthlySaving: p.monthly_saving,
    annualSaving: p.annual_saving,
    payback: p.payback,
    rating: p.rating,
    vendor: p.vendor
  };
}

function mapApp(a) {
  return {
    id: a.id,
    userId: a.user_id,
    productId: a.product_id,
    vendorId: a.vendor_id,
    status: a.status,
    appliedDate: a.applied_date ? String(a.applied_date).slice(0, 10) : '',
    reviewedDate: a.reviewed_date ? String(a.reviewed_date).slice(0, 10) : null,
    approvedDate: a.approved_date ? String(a.approved_date).slice(0, 10) : null,
    downPayment: a.down_payment,
    monthlyInstallment: a.monthly_installment,
    tenure: a.tenure,
    totalDeferred: a.total_deferred,
    paidAmount: a.paid_amount,
    remainingAmount: a.remaining_amount,
    nextDueDate: a.next_due_date ? String(a.next_due_date).slice(0, 10) : 'N/A',
    repayments: (a.repayments || []).map(r => ({
      id: r.id,
      dueDate: r.due_date ? String(r.due_date).slice(0, 10) : '',
      paidDate: r.paid_date ? String(r.paid_date).slice(0, 10) : null,
      amount: r.amount,
      status: r.status
    })),
    applicationDetails: a.application_details || {},
    product: a.product,
    vendor: a.vendor,
    user: a.user
  };
}

async function uploadDocuments(files, docType, applicationId = null) {
  if (!files || !files.length) return [];
  const results = [];
  for (const file of Array.from(files)) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', docType);
    if (applicationId != null) fd.append('application_id', String(applicationId));
    results.push(await api('/documents/upload', { method: 'POST', body: fd }));
  }
  return results;
}

async function updateApplicationStatus(appId, status) {
  try {
    await api(`/applications/${appId}/status`, { method: 'PATCH', body: { status } });
    await loadUserScopedData();
    if (currentUser.role === 'admin') renderAdminDashboard();
    if (currentUser.role === 'vendor') renderVendorDashboard();
    if (currentUser.role === 'user') renderUserDashboard();
  } catch (e) { alert(e.message); }
}

async function markRepaymentPaid(appId, repaymentId) {
  try {
    await api(`/applications/${appId}/repayments/${repaymentId}/pay`, { method: 'POST' });
    await loadUserScopedData();
    renderUserDashboard();
    if (currentUser.role === 'admin') renderAdminDashboard();
  } catch (e) { alert(e.message); }
}

async function loadPublicData() {
  const [prods, vends] = await Promise.all([api('/products/'), api('/vendors/')]);
  productCatalog = prods.map(mapProduct);
  vendors = vends.map(v => ({ id: v.id, name: v.name, email: v.email }));
  updateProductProfits();
}

async function loadUserScopedData() {
  if (!currentUser || !authToken) return;
  try {
    const apps = await api('/applications/');
    applications = apps.map(mapApp);
  } catch (e) { console.warn(e); }

  if (currentUser.role === 'vendor') {
    try {
      const cash = await api('/vendors/me/cash-sales');
      cashSales = cash.map(c => ({
        id: c.id, vendorId: c.vendor_id, productId: c.product_id,
        buyerName: c.buyer_name, amount: c.amount,
        date: c.sale_date ? String(c.sale_date).slice(0, 10) : ''
      }));
    } catch (e) { console.warn(e); }
  }
  if (currentUser.role === 'admin') {
    try {
      const ls = await api('/admin/lenders');
      lenders = ls.map(l => ({
        id: l.id, name: l.name, profitRate: l.profit_rate,
        maxTenure: l.max_tenure, is_active: l.is_active
      }));
      const active = lenders.find(l => l.is_active);
      activeLenderId = active ? active.id : (lenders[0] && lenders[0].id);
      const us = await api('/users/');
      users = us.map(u => ({
        id: u.id, name: u.name, email: u.email, salary: u.salary,
        cnic: u.cnic, phone: u.phone, address: u.address
      }));
      const cash = await api('/admin/cash-sales');
      cashSales = cash.map(c => ({
        id: c.id, vendorId: c.vendor_id, productId: c.product_id,
        buyerName: c.buyer_name, amount: c.amount,
        date: c.sale_date ? String(c.sale_date).slice(0, 10) : ''
      }));
    } catch (e) { console.warn(e); }
  }
}

const pageSections = {
  'public-home': document.getElementById('section-public-home'),
  'public-about': document.getElementById('section-public-about'),
  'public-products': document.getElementById('section-public-products'),
  'public-compare': document.getElementById('section-public-compare'),
  'public-faq': document.getElementById('section-public-faq'),
  'public-ecosystem': document.getElementById('section-public-ecosystem'),
  'public-legal': document.getElementById('section-public-legal'),
  'user-dashboard': document.getElementById('section-user-dashboard'),
  'vendor-dashboard': document.getElementById('section-vendor-dashboard'),
  'admin-dashboard': document.getElementById('section-admin-dashboard')
};
const navLinks = document.getElementById('navLinks');
const hamburger = document.getElementById('hamburgerBtn');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const appModal = document.getElementById('applicationModal');
const productDetailModal = document.getElementById('productDetailModal');
const userBadge = document.getElementById('userNavBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

function getProduct(id) { return productCatalog.find(p => p.id === id); }
function getVendor(id) { return vendors.find(v => v.id === id); }
function getUser(id) { return users.find(u => u.id === id); }
function formatCurrency(amt) { return 'PKR ' + Number(amt).toLocaleString(); }
function getStatusLabel(status) {
  const map = {
    pending_review: 'Under Review', approved: 'Approved', rejected: 'Rejected',
    active: 'Active', completed: 'Completed', reviewed: 'Reviewed'
  };
  return map[status] || status;
}
function getLender(id) { return lenders.find(l => l.id === id); }

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  let filtered = productCatalog.filter(p => {
    const matchCategory = currentCategory === 'all' || p.category === currentCategory;
    const search = currentSearch.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      (getVendor(p.vendorId)?.name.toLowerCase().includes(search) || false);
    return matchCategory && matchSearch;
  });
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="card text-center" style="grid-column:1/-1;padding:40px;"><i class="fas fa-search" style="font-size:32px;color:var(--gray);"></i><p class="text-muted mt-12">No products found. Try adjusting your search.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const down = Math.round(p.price * 0.2);
    const monthly = Math.round((p.price + (p.profit || computeProfit(p.price))) / 24);
    const vendor = getVendor(p.vendorId);
    return `
      <div class="card product-card" onclick="openProductDetail(${p.id})">
        <div class="flex-between"><span class="badge">${p.category}</span><span style="font-size:12px;color:var(--gray);">${vendor ? vendor.name : ''}</span></div>
        <h4 style="margin:8px 0;">${p.name}</h4>
        <div class="price">${formatCurrency(p.price)} <small>MRP</small></div>
        <div style="margin:6px 0;"><i class="fas fa-calendar-alt"></i> <strong>${formatCurrency(monthly)}</strong> / mo × 24</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
          <span class="badge" style="background:#e0f2fe;">Down: ${formatCurrency(down)}</span>
          <span class="sharia-badge"><i class="fas fa-handshake"></i> Murabaha</span>
          ${p.type === 'cash' ? '<span class="badge" style="background:#dbeafe;">Cash</span>' : ''}
          ${p.type === 'both' ? '<span class="badge" style="background:#fef3c7;">Both</span>' : ''}
        </div>
        <div style="margin-top:10px;font-size:13px;">
          <div class="spec"><span>Warranty</span><span>${p.warranty}</span></div>
          <div class="spec"><span>Installation</span><span>${p.installation}</span></div>
          <div class="spec"><span>Monthly Saving</span><span class="saving-positive">${formatCurrency(p.monthlySaving)}</span></div>
          <div class="spec"><span>Annual Saving</span><span class="saving-positive">${formatCurrency(p.annualSaving)}</span></div>
          <div class="spec"><span>Payback</span><span>${p.payback}</span></div>
          <div class="spec"><span>Rating</span><span>${'★'.repeat(Math.floor(p.rating))} ${p.rating}</span></div>
        </div>
        <button class="btn-primary btn-sm" style="margin-top:12px;width:100%;justify-content:center;" onclick="event.stopPropagation();initiatePurchase(${p.id})"><i class="fas fa-shopping-bag"></i> Buy Now (BNPL)</button>
      </div>`;
  }).join('');
}

function filterProducts(category) {
  if (category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.filter-btn[data-category="${category}"]`)?.classList.add('active');
  }
  const searchEl = document.getElementById('productSearch');
  currentSearch = searchEl ? searchEl.value : '';
  renderProducts();
}

function openProductDetail(productId) {
  const p = getProduct(productId);
  if (!p) return;
  const vendor = getVendor(p.vendorId);
  const down = Math.round(p.price * 0.2);
  const monthly = Math.round((p.price + (p.profit || computeProfit(p.price))) / 24);
  document.getElementById('productDetailContent').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <h2>${p.name}</h2>
      <div><span class="badge">${p.category}</span> <span class="badge" style="background:#e0f2fe;">${vendor ? vendor.name : ''}</span></div>
      <div><strong>Price:</strong> ${formatCurrency(p.price)} <small>MRP</small></div>
      <div><strong>Financing:</strong> ${formatCurrency(down)} down + ${formatCurrency(monthly)}/mo for 24 months</div>
      <div><strong>Description:</strong> ${p.description}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><strong>Warranty:</strong> ${p.warranty}</div>
        <div><strong>Installation:</strong> ${p.installation}</div>
        <div><strong>Monthly Saving:</strong> ${formatCurrency(p.monthlySaving)}</div>
        <div><strong>Annual Saving:</strong> ${formatCurrency(p.annualSaving)}</div>
        <div><strong>Payback Period:</strong> ${p.payback}</div>
        <div><strong>Rating:</strong> ${'★'.repeat(Math.floor(p.rating))} ${p.rating}</div>
      </div>
      <div style="background:var(--primary-light);padding:12px;border-radius:12px;">
        <strong>Savings Calculator</strong><br>
        Current bill (avg): PKR 15,000<br>
        New bill: PKR ${Math.round(15000 * (1 - p.savingFactorElectric))}<br>
        Monthly saving: ${formatCurrency(p.monthlySaving)}
      </div>
      <button class="btn-primary" onclick="initiatePurchase(${p.id});document.getElementById('closeProductModal').click();"><i class="fas fa-shopping-bag"></i> Buy Now</button>
    </div>`;
  productDetailModal.classList.add('open');
}

document.getElementById('closeProductModal')?.addEventListener('click', () => productDetailModal.classList.remove('open'));
productDetailModal?.addEventListener('click', (e) => { if (e.target === productDetailModal) productDetailModal.classList.remove('open'); });

function initiatePurchase(productId) {
  if (!currentUser || currentUser.role !== 'user') {
    alert('Please login as a User to purchase.');
    loginModal.classList.add('open');
    return;
  }
  const prod = getProduct(productId);
  if (!prod) return;
  if (applications.some(a => a.userId === currentUser.id && a.productId === productId)) {
    alert('You already have an application for this product.');
    return;
  }
  pendingProductForApplication = productId;
  const down = Math.round(prod.price * 0.2);
  const monthly = Math.round((prod.price + (prod.profit || computeProfit(prod.price))) / 24);
  document.getElementById('appProductInfo').innerHTML = `
    <strong>${prod.name}</strong><br>
    Price: ${formatCurrency(prod.price)} | Down: ${formatCurrency(down)} | Installment: ${formatCurrency(monthly)}/mo<br>
    <span class="text-muted">${prod.description}</span>`;
  document.getElementById('appMonthlyIncome').value = '';
  document.getElementById('appExistingBills').value = '15000';
  appModal.classList.add('open');
}

document.getElementById('submitAppBtn')?.addEventListener('click', async function () {
  if (!currentUser || !pendingProductForApplication) return;
  const prod = getProduct(pendingProductForApplication);
  if (!prod) return;
  const income = parseFloat(document.getElementById('appMonthlyIncome').value) || 0;
  const employment = document.getElementById('appEmployment').value.trim() || 'Not specified';
  const bills = document.getElementById('appExistingBills').value.trim() || 'Not specified';
  const notes = document.getElementById('appNotes').value.trim() || '';
  const files = document.getElementById('appFileUploadInput')?.files;
  if (income <= 0) { alert('Please enter your monthly income.'); return; }
  try {
    const created = await api('/applications/', {
      method: 'POST',
      body: {
        product_id: prod.id,
        application_details: {
          monthly_income: income,
          employment,
          existing_bills: bills,
          notes
        }
      }
    });
    if (files && files.length) {
      try { await uploadDocuments(files, 'application', created.id); } catch (ue) { console.warn(ue); }
    }
    appModal.classList.remove('open');
    pendingProductForApplication = null;
    const afi = document.getElementById('appFileUploadInput');
    if (afi) afi.value = '';
    await loadUserScopedData();
    alert(`✅ Application submitted for "${prod.name}". Your journey has started!`);
    switchPage('user-dashboard');
  } catch (e) {
    alert(e.message || 'Failed to submit application');
  }
});

async function renderCompare() {
  const electric = parseFloat(document.getElementById('electricBill')?.value) || 0;
  const fuel = parseFloat(document.getElementById('fuelBill')?.value) || 0;
  const compareType = document.getElementById('compareType')?.value || 'both';
  const tbody = document.getElementById('compareTableBody');
  const summary = document.getElementById('compareSummary');
  if (!tbody) return;

  try {
    const data = await api('/compare/', {
      method: 'POST',
      body: { electricity_bill: electric, fuel_bill: fuel, compare_type: compareType }
    });
    const results = data.results || [];
    const best = data.best_product;
    const totalBill = data.total_current_bill || 0;

    if (totalBill > 0 && best) {
      summary.classList.remove('hidden');
      document.getElementById('totalMonthlyCost').innerHTML = formatCurrency(totalBill);
      document.getElementById('bestProductName').innerText = best.product_name;
      document.getElementById('bestNewBill').innerHTML = formatCurrency(best.new_total_bill);
      document.getElementById('bestInstallment').innerHTML = formatCurrency(best.monthly_installment);
      document.getElementById('bestMonthlySaving').innerHTML = formatCurrency(best.monthly_saving);
      document.getElementById('bestYearlySaving').innerHTML = formatCurrency(best.yearly_saving);
      document.getElementById('bestFiveYearSaving').innerHTML = formatCurrency(best.five_year_net_saving);
      document.getElementById('bestPickText').innerHTML =
        `🏆 <strong>${best.product_name}</strong> — New bill: ${formatCurrency(best.new_total_bill)} + installment ${formatCurrency(best.monthly_installment)} = ${formatCurrency(best.new_total_bill + best.monthly_installment)}. Monthly saving: <strong>${formatCurrency(best.monthly_saving)}</strong> (${formatCurrency(best.yearly_saving)}/year). 5-year net saving: <strong>${formatCurrency(best.five_year_net_saving)}</strong>.`;
    } else {
      summary.classList.add('hidden');
    }

    tbody.innerHTML = results.map(p => {
      const savingColor = p.monthly_saving > 0 ? 'var(--primary)' : '#b91c1c';
      return `<tr>
        <td><strong>${p.product_name}</strong> <span class="badge" style="background:#e0f2fe;">${p.saving_factor_electric > 0 ? '⚡' : ''}${p.saving_factor_fuel > 0 ? '⛽' : ''}</span></td>
        <td>${formatCurrency(p.price)}</td>
        <td>${formatCurrency(p.monthly_installment)}</td>
        <td>${formatCurrency(p.current_total_bill)}</td>
        <td>${formatCurrency(p.new_total_bill)}</td>
        <td style="color:${savingColor};">${formatCurrency(p.monthly_saving)}</td>
        <td style="color:${savingColor};">${formatCurrency(p.yearly_saving)}</td>
        <td style="color:${p.five_year_net_saving > 0 ? 'var(--primary)' : '#b91c1c'};">${formatCurrency(p.five_year_net_saving)}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.warn(e);
    tbody.innerHTML = `<tr><td colspan="8" class="text-muted">Compare unavailable: ${e.message}</td></tr>`;
  }
}

const legalData = {
  terms: `<h3>Terms of Service</h3><p><strong>Acceptance:</strong> By using GreenDrive.pk you agree to these terms. <strong>Eligibility:</strong> 18+ Pakistani resident with valid CNIC. <strong>Financing:</strong> Subject to LFE Sharia screening. <strong>Delivery:</strong> Est. timelines; install by certified partners. <strong>Governing Law:</strong> Pakistan.</p><p><strong>Liability:</strong> We are not liable for product defects beyond manufacturer warranty. All financing decisions are at LFE's discretion.</p>`,
  privacy: `<h3>Privacy Policy</h3><p>We collect: Name, CNIC, phone, address, utility bills, bank details. Used for: order processing, LFE underwriting, support. <strong>No data sold.</strong> SSL encrypted. Request deletion anytime via support@greendrive.pk.</p><p>We share data only with LFE and logistics partners. You may opt out of marketing communications.</p>`,
  sale: `<h3>Terms of Sale</h3><p><strong>Order Confirmation:</strong> All orders are subject to availability and confirmation of financing. <strong>Pricing:</strong> Prices are fixed at time of order. <strong>Delivery:</strong> Standard delivery within 5-7 working days. <strong>Installation:</strong> Solar and electrical installations must be performed by our certified technicians.</p><p><strong>Cancellation:</strong> Cancellation within 24 hours of order is free of charge. After that, a 10% restocking fee applies.</p>`,
  agreement: `<h3>Murabaha Financing Agreement</h3><p><strong>Seller:</strong> GreenDrive (Pvt) Ltd. <strong>Buyer:</strong> [Customer]. <strong>Disclosure:</strong> Cost + fixed profit shown separately. <strong>Deferred Price:</strong> Equal installments. <strong>Ownership:</strong> passes immediately. <strong>Default:</strong> No monetary penalty; hardship restructuring available. <strong>Early Payment:</strong> Rebate (<em>Ibra</em>) on remaining profit. This contract is free from Riba and Gharar.</p><p><strong>Sharia Supervisory Board:</strong> LFE certifies compliance.</p>`
};
function renderLegal(tab) {
  currentLegalTab = tab;
  const el = document.getElementById('legalContent');
  if (el) el.innerHTML = legalData[tab] || legalData.terms;
  document.querySelectorAll('.legal-tabs button').forEach(b => b.classList.toggle('active', b.dataset.legalTab === tab));
}

function renderUserDashboard() {
  if (!currentUser || currentUser.role !== 'user') return;
  const userApps = applications.filter(a => a.userId === currentUser.id);
  const container = document.getElementById('userJourneyContainer');
  if (!container) return;
  if (userApps.length === 0) {
    container.innerHTML = `<div class="card"><p class="text-muted">You have no applications yet. Browse the marketplace to apply.</p></div>`;
  } else {
    container.innerHTML = userApps.map(app => {
      const prod = getProduct(app.productId) || (app.product ? mapProduct(app.product) : null);
      const vendor = getVendor(app.vendorId) || app.vendor;
      const status = app.status;
      const steps = ['pending_review', 'reviewed', 'approved', 'active', 'completed'];
      const labels = ['Apply', 'Review', 'Approval', 'Active', 'Complete'];
      const currentIdx = steps.indexOf(status) >= 0 ? steps.indexOf(status) : 0;
      const stepper = steps.map((s, i) => {
        let cls = 'pending';
        if (i < currentIdx) cls = 'completed';
        else if (i === currentIdx) cls = 'active';
        return `<div class="step-item"><div class="step-circle ${cls}">${i + 1}</div><div class="step-label ${cls}">${labels[i]}</div></div>`;
      }).join('');
      return `<div class="card mb-12">
        <div class="flex-between"><h4>${prod ? prod.name : 'Product'}</h4><span class="badge">${getStatusLabel(status)}</span></div>
        <p class="text-muted">Vendor: ${vendor ? vendor.name : 'N/A'} | Applied: ${app.appliedDate}</p>
        <div class="stepper">${stepper}</div>
        <div style="font-size:14px;background:#f8fafc;padding:10px;border-radius:10px;">
          <div class="flex-between"><span>Total Deferred</span><strong>${formatCurrency(app.totalDeferred)}</strong></div>
          <div class="flex-between"><span>Paid</span><strong>${formatCurrency(app.paidAmount)}</strong></div>
          <div class="flex-between"><span>Remaining</span><strong>${formatCurrency(app.remainingAmount)}</strong></div>
          <div class="flex-between"><span>Next Due</span><strong>${app.nextDueDate || 'N/A'}</strong></div>
        </div>
        <div class="mt-12"><button class="btn-secondary btn-sm" onclick="toggleRepayments(${app.id})"><i class="fas fa-chevron-down"></i> View Repayments</button></div>
        <div id="repayments-${app.id}" style="display:none;margin-top:8px;">
          <div class="table-wrap"><table><thead><tr><th>Due Date</th><th>Amount</th><th>Paid Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
          ${(app.repayments || []).map(r => `<tr><td>${r.dueDate}</td><td>${formatCurrency(r.amount)}</td><td>${r.paidDate || '—'}</td><td><span class="badge" style="background:${r.status === 'paid' ? '#d1fae5' : r.status === 'overdue' ? '#fee2e2' : '#fef3c7'};color:${r.status === 'paid' ? '#065f2e' : r.status === 'overdue' ? '#b91c1c' : '#92400e'};">${r.status}</span></td><td>${(r.status === 'pending' || r.status === 'overdue') ? `<button class="btn-primary btn-sm" onclick="markRepaymentPaid(${app.id},${r.id})">Mark paid</button>` : '—'}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </div>`;
    }).join('');
  }
  const totalFinanced = userApps.reduce((s, a) => s + a.totalDeferred, 0);
  const totalPaid = userApps.reduce((s, a) => s + a.paidAmount, 0);
  const totalRemaining = userApps.reduce((s, a) => s + a.remainingAmount, 0);
  let totalMonthlySaving = 0;
  userApps.forEach(app => {
    const prod = getProduct(app.productId);
    if (prod && (app.status === 'approved' || app.status === 'active')) {
      const elec = 15000, fuel = 10000;
      const saving = (elec * prod.savingFactorElectric) + (fuel * prod.savingFactorFuel) - app.monthlyInstallment;
      if (saving > 0) totalMonthlySaving += saving;
    }
  });
  const totalSavings = totalMonthlySaving * 12;
  document.getElementById('userTotalSavings').innerHTML = formatCurrency(totalSavings);
  const nextDue = userApps.length > 0 ? userApps[0].monthlyInstallment : 0;
  document.getElementById('userNextPayment').innerHTML = formatCurrency(nextDue);
  document.getElementById('userTotalFinanced').innerText = formatCurrency(totalFinanced);
  document.getElementById('userTotalPaid').innerText = formatCurrency(totalPaid);
  document.getElementById('userTotalRemaining').innerText = formatCurrency(totalRemaining);
}

function toggleRepayments(appId) {
  const el = document.getElementById('repayments-' + appId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function renderVendorDashboard() {
  if (!currentUser || currentUser.role !== 'vendor') return;
  const vendorId = currentUser.id;
  const myProducts = productCatalog.filter(p => p.vendorId === vendorId);
  const myApps = applications.filter(a => a.vendorId === vendorId);
  const myCash = cashSales.filter(c => c.vendorId === vendorId);
  document.getElementById('vendorProductCount').innerText = myProducts.length;
  document.getElementById('vendorFinancedCount').innerText = myApps.length;
  document.getElementById('vendorCashCount').innerText = myCash.length;
  const tbody = document.getElementById('vendorOrdersTable');
  const allOrders = [
    ...myApps.map(a => {
      const prod = getProduct(a.productId) || (a.product ? mapProduct(a.product) : null);
      const user = a.user || getUser(a.userId);
      const actions = a.status === 'pending_review'
        ? `<button class="btn-primary btn-sm" onclick="updateApplicationStatus(${a.id},'approved')">Approve</button>
           <button class="btn-danger btn-sm" onclick="updateApplicationStatus(${a.id},'rejected')">Reject</button>`
        : '—';
      return { product: prod ? prod.name : 'N/A', buyer: user ? user.name : 'N/A', type: 'Financed', amount: a.totalDeferred, status: a.status, actions };
    }),
    ...myCash.map(c => {
      const prod = getProduct(c.productId);
      return { product: prod ? prod.name : 'N/A', buyer: c.buyerName, type: 'Cash', amount: c.amount, status: 'Completed', actions: '—' };
    })
  ];
  tbody.innerHTML = allOrders.length
    ? allOrders.map(o => `<tr><td>${o.product}</td><td>${o.buyer}</td><td>${o.type}</td><td>${formatCurrency(o.amount)}</td><td><span class="badge">${o.status}</span></td><td>${o.actions}</td></tr>`).join('')
    : `<tr><td colspan="6" class="text-muted">No orders yet.</td></tr>`;
  const revFinanced = myApps.reduce((s, a) => s + a.totalDeferred, 0);
  const revCash = myCash.reduce((s, c) => s + c.amount, 0);
  document.getElementById('vendorRevenue').innerHTML = formatCurrency(revFinanced + revCash);
  document.getElementById('vendorRevFinanced').innerHTML = formatCurrency(revFinanced);
  document.getElementById('vendorRevCash').innerHTML = formatCurrency(revCash);

  const ptbody = document.getElementById('vendorProductsTable');
  if (ptbody) {
    ptbody.innerHTML = myProducts.length
      ? myProducts.map(p => `<tr>
          <td>${p.name}</td><td>${formatCurrency(p.price)}</td><td>${p.category}</td><td>${p.type}</td>
          <td>
            <button class="btn-secondary btn-sm" onclick="editVendorProduct(${p.id})">Edit</button>
            <button class="btn-danger btn-sm" onclick="deactivateVendorProduct(${p.id})">Deactivate</button>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="text-muted">No products yet.</td></tr>`;
  }
}

async function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const stats = await api('/admin/stats');
    document.getElementById('adminTotalUsers').innerText = stats.total_users;
    document.getElementById('adminTotalVendors').innerText = stats.total_vendors;
    document.getElementById('adminTotalApps').innerText = stats.total_applications;
    document.getElementById('adminFinancedVol').innerHTML = formatCurrency(stats.financed_volume);
    document.getElementById('adminCashVol').innerHTML = formatCurrency(stats.cash_volume);
    document.getElementById('adminTotalRev').innerHTML = formatCurrency(stats.total_revenue);
    document.getElementById('adminPendingApps').innerText = stats.pending_applications;
    document.getElementById('adminActiveLoans').innerText = stats.active_loans;
    document.getElementById('adminCompleted').innerText = stats.completed_loans;
  } catch (e) { console.warn(e); }

  const tbody = document.getElementById('adminAllAppsTable');
  tbody.innerHTML = applications.map(a => {
    const user = a.user || getUser(a.userId);
    const vendor = getVendor(a.vendorId) || a.vendor;
    const prod = getProduct(a.productId) || (a.product ? mapProduct(a.product) : null);
    let actions = '—';
    if (a.status === 'pending_review') {
      actions = `<button class="btn-primary btn-sm" onclick="updateApplicationStatus(${a.id},'approved')">Approve</button>
         <button class="btn-danger btn-sm" onclick="updateApplicationStatus(${a.id},'rejected')">Reject</button>`;
    } else {
      const pending = (a.repayments || []).find(r => r.status === 'pending' || r.status === 'overdue');
      if (pending) {
        actions = `<button class="btn-primary btn-sm" onclick="markRepaymentPaid(${a.id},${pending.id})">Mark paid</button>`;
      }
    }
    return `<tr><td>${user ? user.name : 'N/A'}</td><td>${vendor ? vendor.name : 'N/A'}</td><td>${prod ? prod.name : 'N/A'}</td><td>${formatCurrency(a.totalDeferred)}</td><td><span class="badge">${getStatusLabel(a.status)}</span></td><td>${actions}</td></tr>`;
  }).join('');
  renderLendersTable();
  const active = getLender(activeLenderId);
  document.getElementById('activeLenderDisplay').innerText = active ? active.name : 'None';
}

function renderLendersTable() {
  const tbody = document.getElementById('adminLendersTable');
  if (!tbody) return;
  tbody.innerHTML = lenders.map(l => `
    <tr>
      <td>${l.name}</td>
      <td>${(l.profitRate * 100).toFixed(0)}%</td>
      <td>${l.maxTenure}</td>
      <td>
        ${activeLenderId === l.id ? '<span class="badge" style="background:#d1fae5;">Active</span>' : `<button class="btn-primary btn-sm" onclick="setActiveLender(${l.id})">Set Active</button>`}
        <button class="btn-danger btn-sm" onclick="deleteLender(${l.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

async function setActiveLender(id) {
  try {
    await api(`/admin/lenders/${id}/activate`, { method: 'POST' });
    await loadUserScopedData();
    await loadPublicData();
    renderAdminDashboard();
    renderProducts();
    renderCompare();
    alert('Active lender updated and product profits recalculated.');
  } catch (e) { alert(e.message); }
}

async function deleteLender(id) {
  if (lenders.length <= 1) { alert('Cannot delete the last lender.'); return; }
  if (!confirm('Delete this lender?')) return;
  try {
    await api(`/admin/lenders/${id}`, { method: 'DELETE' });
    await loadUserScopedData();
    await loadPublicData();
    renderAdminDashboard();
    renderProducts();
    renderCompare();
  } catch (e) { alert(e.message); }
}

document.getElementById('addLenderBtn')?.addEventListener('click', () => {
  document.getElementById('addLenderForm').style.display = 'block';
});
document.getElementById('cancelLenderBtn')?.addEventListener('click', () => {
  document.getElementById('addLenderForm').style.display = 'none';
});
document.getElementById('saveLenderBtn')?.addEventListener('click', async function () {
  const name = document.getElementById('newLenderName').value.trim();
  const rate = parseFloat(document.getElementById('newLenderRate').value);
  const tenure = parseInt(document.getElementById('newLenderTenure').value, 10);
  if (!name || isNaN(rate) || isNaN(tenure) || rate <= 0 || tenure <= 0) {
    alert('Please fill all fields with valid values.');
    return;
  }
  try {
    await api('/admin/lenders', {
      method: 'POST',
      body: { name, profit_rate: rate / 100, max_tenure: tenure }
    });
    document.getElementById('newLenderName').value = '';
    document.getElementById('newLenderRate').value = '';
    document.getElementById('newLenderTenure').value = '';
    document.getElementById('addLenderForm').style.display = 'none';
    await loadUserScopedData();
    await loadPublicData();
    renderAdminDashboard();
    renderProducts();
    renderCompare();
    alert('Lender added.');
  } catch (e) { alert(e.message); }
});

function applyLenderToAllProducts() {
  updateProductProfits();
  renderProducts();
  renderCompare();
  alert('All product profits updated based on active lender.');
}

document.getElementById('toggleAddProductBtn')?.addEventListener('click', () => {
  const form = document.getElementById('addProductForm');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('cancelProductBtn')?.addEventListener('click', () => {
  const form = document.getElementById('addProductForm');
  if (form) form.style.display = 'none';
});
document.getElementById('saveProductBtn')?.addEventListener('click', async function () {
  if (!currentUser || currentUser.role !== 'vendor') return;
  const name = document.getElementById('vpName').value.trim();
  const price = parseFloat(document.getElementById('vpPrice').value);
  const category = document.getElementById('vpCategory').value.trim();
  const type = document.getElementById('vpType').value;
  const description = document.getElementById('vpDescription').value.trim();
  if (!name || !category || isNaN(price) || price <= 0) {
    alert('Name, category, and a valid price are required.');
    return;
  }
  try {
    await api('/products/', {
      method: 'POST',
      body: {
        name,
        price,
        category,
        type,
        description,
        saving_factor_electric: parseFloat(document.getElementById('vpSaveElec').value) || 0,
        saving_factor_fuel: parseFloat(document.getElementById('vpSaveFuel').value) || 0,
        warranty: document.getElementById('vpWarranty').value.trim() || null,
        installation: document.getElementById('vpInstallation').value.trim() || null,
        monthly_saving: parseFloat(document.getElementById('vpMonthlySaving').value) || 0,
        annual_saving: parseFloat(document.getElementById('vpAnnualSaving').value) || 0,
        payback: document.getElementById('vpPayback').value.trim() || null,
        rating: parseFloat(document.getElementById('vpRating').value) || 4.0
      }
    });
    document.getElementById('addProductForm').style.display = 'none';
    ['vpName', 'vpPrice', 'vpCategory', 'vpDescription', 'vpSaveElec', 'vpSaveFuel', 'vpWarranty', 'vpInstallation', 'vpMonthlySaving', 'vpAnnualSaving', 'vpPayback'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    await loadPublicData();
    renderVendorDashboard();
    renderProducts();
    alert('Product created.');
  } catch (e) { alert(e.message); }
});

async function editVendorProduct(productId) {
  const p = getProduct(productId);
  if (!p) return;
  const name = prompt('Product name', p.name);
  if (name == null) return;
  const priceStr = prompt('Price (PKR)', String(p.price));
  if (priceStr == null) return;
  const price = parseFloat(priceStr);
  if (!name.trim() || isNaN(price) || price <= 0) {
    alert('Invalid name or price.');
    return;
  }
  const description = prompt('Description', p.description || '') ?? p.description;
  const category = prompt('Category', p.category) ?? p.category;
  try {
    await api(`/products/${productId}`, {
      method: 'PUT',
      body: { name: name.trim(), price, description, category }
    });
    await loadPublicData();
    renderVendorDashboard();
    renderProducts();
  } catch (e) { alert(e.message); }
}

async function deactivateVendorProduct(productId) {
  if (!confirm('Deactivate this product?')) return;
  try {
    await api(`/products/${productId}`, { method: 'DELETE' });
    await loadPublicData();
    renderVendorDashboard();
    renderProducts();
  } catch (e) { alert(e.message); }
}

document.getElementById('signupBtn')?.addEventListener('click', () => signupModal.classList.add('open'));
document.getElementById('closeSignupModal')?.addEventListener('click', () => signupModal.classList.remove('open'));

document.getElementById('signupSubmitBtn')?.addEventListener('click', async function () {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const cnic = document.getElementById('signupCnic').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const address = document.getElementById('signupAddress').value.trim();
  const salary = parseFloat(document.getElementById('signupSalary').value) || 0;
  const files = document.getElementById('fileUploadInput')?.files;
  if (!name || !email || !password || !cnic || !phone || !address || salary <= 0) {
    alert('Please fill all fields with valid values.');
    return;
  }
  try {
    await api('/auth/register', {
      method: 'POST',
      body: { name, email, password, cnic, phone, address, salary }
    });
    const loggedIn = await performLogin(email, password);
    if (loggedIn && files && files.length) {
      try { await uploadDocuments(files, 'signup'); } catch (ue) { console.warn(ue); }
    }
    signupModal.classList.remove('open');
    alert('Registration successful!');
    ['signupName', 'signupEmail', 'signupPassword', 'signupCnic', 'signupPhone', 'signupAddress', 'signupSalary'].forEach(id => {
      document.getElementById(id).value = '';
    });
    const fl = document.getElementById('fileList');
    if (fl) fl.innerHTML = '';
    const fi = document.getElementById('fileUploadInput');
    if (fi) fi.value = '';
  } catch (e) { alert(e.message); }
});

document.getElementById('fileUploadInput')?.addEventListener('change', function (e) {
  const files = e.target.files;
  const list = document.getElementById('fileList');
  if (files.length) {
    list.innerHTML = Array.from(files).map(f => `<div><i class="fas fa-file"></i> ${f.name} (${(f.size / 1024).toFixed(0)} KB)</div>`).join('');
  }
});
document.getElementById('appFileUploadInput')?.addEventListener('change', function (e) {
  const area = document.getElementById('appFileUploadArea');
  area.innerHTML = `<i class="fas fa-check-circle" style="color:var(--primary);"></i> ${e.target.files.length} file(s) selected.`;
});

function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const icon = el.querySelector('i');
  if (answer.style.display === 'block') {
    answer.style.display = 'none';
    icon.className = 'fas fa-chevron-down';
  } else {
    answer.style.display = 'block';
    icon.className = 'fas fa-chevron-up';
  }
}

function switchPage(page) {
  currentPage = page;
  if ((page === 'user-dashboard' || page === 'vendor-dashboard' || page === 'admin-dashboard') && !currentUser) {
    loginModal.classList.add('open');
    return;
  }
  if (page === 'user-dashboard' && currentUser && currentUser.role !== 'user') { alert('Switch to a User account.'); return; }
  if (page === 'vendor-dashboard' && currentUser && currentUser.role !== 'vendor') { alert('Switch to a Vendor account.'); return; }
  if (page === 'admin-dashboard' && currentUser && currentUser.role !== 'admin') { alert('Switch to Super Admin.'); return; }

  Object.values(pageSections).forEach(el => el && el.classList.remove('active'));
  const target = document.getElementById('section-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-links .nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-links .nav-btn[data-page]').forEach(b => {
    if (b.dataset.page === page) b.classList.add('active');
  });
  navLinks?.classList.remove('open');

  if (page === 'public-products') renderProducts();
  if (page === 'public-compare') renderCompare();
  if (page === 'public-legal') renderLegal(currentLegalTab);
  if (page === 'user-dashboard') renderUserDashboard();
  if (page === 'vendor-dashboard') renderVendorDashboard();
  if (page === 'admin-dashboard') renderAdminDashboard();
}

async function performLogin(email, password) {
  const form = new FormData();
  form.append('username', email);
  form.append('password', password);
  try {
    const res = await fetch(API + '/auth/login', { method: 'POST', body: form });
    if (!res.ok) {
      document.getElementById('loginError').style.display = 'block';
      return false;
    }
    const data = await res.json();
    authToken = data.access_token;
    currentUser = {
      role: data.user.role,
      id: data.user.id,
      name: data.user.name,
      email: data.user.email
    };
    localStorage.setItem('gd_token', authToken);
    localStorage.setItem('gd_user', JSON.stringify(currentUser));
    await loadUserScopedData();
    updateUIForLogin();
    loginModal.classList.remove('open');
    if (currentUser.role === 'user') switchPage('user-dashboard');
    else if (currentUser.role === 'vendor') switchPage('vendor-dashboard');
    else switchPage('admin-dashboard');
    return true;
  } catch (e) {
    document.getElementById('loginError').style.display = 'block';
    return false;
  }
}

function updateUIForLogin() {
  if (!currentUser) {
    userBadge.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    document.getElementById('navUserDash').style.display = 'none';
    document.getElementById('navVendorDash').style.display = 'none';
    document.getElementById('navAdminDash').style.display = 'none';
    return;
  }
  userBadge.style.display = 'flex';
  userNameDisplay.innerText = currentUser.name;
  logoutBtn.style.display = 'inline-block';
  loginBtn.style.display = 'none';
  signupBtn.style.display = 'none';
  document.getElementById('navUserDash').style.display = currentUser.role === 'user' ? 'inline-block' : 'none';
  document.getElementById('navVendorDash').style.display = currentUser.role === 'vendor' ? 'inline-block' : 'none';
  document.getElementById('navAdminDash').style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
  document.getElementById('userRoleBadge').innerText =
    currentUser.role === 'admin' ? 'Super Admin' : currentUser.role === 'vendor' ? 'Vendor' : 'Customer';
}

function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('gd_token');
  localStorage.removeItem('gd_user');
  applications = [];
  cashSales = [];
  updateUIForLogin();
  switchPage('public-home');
}

document.querySelectorAll('.nav-links .nav-btn[data-page]').forEach(btn => {
  btn.addEventListener('click', function () { switchPage(this.dataset.page); });
});
hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));
loginBtn?.addEventListener('click', () => loginModal.classList.add('open'));
document.getElementById('closeLoginModal')?.addEventListener('click', () => loginModal.classList.remove('open'));
loginModal?.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('open'); });
signupModal?.addEventListener('click', (e) => { if (e.target === signupModal) signupModal.classList.remove('open'); });
appModal?.addEventListener('click', (e) => { if (e.target === appModal) appModal.classList.remove('open'); });
document.getElementById('closeAppModal')?.addEventListener('click', () => appModal.classList.remove('open'));

document.getElementById('loginSubmitBtn')?.addEventListener('click', function () {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  performLogin(email, pass);
});
document.querySelectorAll('#loginEmail, #loginPassword').forEach(f => {
  f.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginSubmitBtn').click();
  });
});
logoutBtn?.addEventListener('click', logout);

document.querySelectorAll('.legal-tabs button').forEach(btn => {
  btn.addEventListener('click', function () { renderLegal(this.dataset.legalTab); });
});
document.getElementById('calcCompareBtn')?.addEventListener('click', renderCompare);
['electricBill', 'fuelBill', 'compareType'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function () {
    clearTimeout(this._timer);
    this._timer = setTimeout(renderCompare, 400);
  });
  el.addEventListener('change', renderCompare);
});

async function init() {
  try {
    await loadPublicData();
  } catch (e) {
    console.error(e);
    alert('Failed to load products from API. Is the backend running?');
  }
  renderProducts();
  await renderCompare();
  renderLegal('terms');
  updateUIForLogin();
  if (currentUser) {
    try { await loadUserScopedData(); } catch (e) { console.warn(e); }
  }
  switchPage('public-home');
}
init();

window.switchPage = switchPage;
window.initiatePurchase = initiatePurchase;
window.toggleRepayments = toggleRepayments;
window.setActiveLender = setActiveLender;
window.deleteLender = deleteLender;
window.applyLenderToAllProducts = applyLenderToAllProducts;
window.filterProducts = filterProducts;
window.openProductDetail = openProductDetail;
window.toggleFaq = toggleFaq;
window.updateApplicationStatus = updateApplicationStatus;
window.markRepaymentPaid = markRepaymentPaid;
window.editVendorProduct = editVendorProduct;
window.deactivateVendorProduct = deactivateVendorProduct;
