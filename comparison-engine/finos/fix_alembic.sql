UPDATE alembic_version SET version_num='0004';
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_policy_id_fkey;
