const fs = require('fs');
const prodData = JSON.parse(fs.readFileSync('test_products.json', 'utf8'));

try {
    let PRODUCTS = prodData.products.map(p => {
        const pr = p.pricing || {};
        const el = p.eligibility_rules || {};
        
        let uiType = 'unknown';
        let pt = (p.product_type || '').toLowerCase();
        if (pt.includes('saving')) uiType = 'savings';
        else if (pt.includes('loan')) uiType = 'personal_loan';
        else if (pt.includes('card')) uiType = 'credit_card';
        else if (pt.includes('health')) uiType = 'health_insurance';
        else if (pt.includes('motor')) uiType = 'motor_insurance';
        else if (pt.includes('life')) uiType = 'life_insurance';

        return {
            id: p.product_id,
            provider: p.provider_id || 'System Provider',
            name: p.provider_id + ' ' + (p.product_type || 'Product').replace('_', ' ').toUpperCase(),
            type: uiType,
            jurisdiction: p.jurisdiction || ['PK'],
            pricing: pr,
            features: p.features ? p.features.map(f => f.name || JSON.stringify(f)) : [],
            compliance: { sharia: p.compliance ? (p.compliance.sharia === true || p.compliance.sharia_certified === true) : false },
            eligibility: { 
                minAge: p.eligibility_rules ? (p.eligibility_rules.min_age || p.eligibility_rules.minAge || 18) : 18, 
                maxAge: p.eligibility_rules ? (p.eligibility_rules.max_age || p.eligibility_rules.maxAge || 65) : 65, 
                minIncome: p.eligibility_rules ? (p.eligibility_rules.min_income || p.eligibility_rules.minIncome || '<50k') : '<50k' 
            },
            monthlyCost: pr.max_amount ? Math.round(pr.max_amount / 100) : 0,
            annualCost: pr.max_amount ? Math.round(pr.max_amount / 10) : 0,
            trustBadges: ['Live DB Product'],
            rating: 4,
            completeness: 90,
            catalogueVersion: p.version || '1.0',
            status: p.status || 'Active',
            dataFreshness: 'Live',
            hash: p.schema_hash || 'not_provided',
            effectiveDate: p.effective_date || '2026-07-01',
            publishedBy: p.published_by || 'System Admin',
            approvedBy: p.approved_by || 'Compliance Team',
            changeRequest: p.change_request || 'CR-1001',
            previousVersion: p.previous_version || 'v0.9'
        };
    });
    console.log("Success! Mapped", PRODUCTS.length, "products.");
    console.log("Savings products:", PRODUCTS.filter(p => p.type === 'savings').length);
    console.log("First 2 savings products:");
    console.log(PRODUCTS.filter(p => p.type === 'savings').slice(0, 2).map(p => p.name));
} catch (e) {
    console.error("Failed mapping:", e);
}
