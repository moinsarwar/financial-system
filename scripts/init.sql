CREATE TABLE IF NOT EXISTS schema_registry (
    schema_id VARCHAR(50) PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL,
    version INT NOT NULL,
    schema_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(100) PRIMARY KEY,
    provider_id VARCHAR(100) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    jurisdiction JSONB,
    status VARCHAR(20),
    version VARCHAR(20),
    last_updated TIMESTAMPTZ,
    pricing JSONB,
    eligibility_rules JSONB,
    features JSONB,
    compliance JSONB
);

INSERT INTO schema_registry (schema_id, product_type, version, schema_hash) VALUES ('schema_savings_v1', 'savings_account', 1, 'sha256:abc1234567890abcdef') ON CONFLICT DO NOTHING;