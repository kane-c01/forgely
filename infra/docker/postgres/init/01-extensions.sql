-- Forgely dev Postgres bootstrap.
-- Idempotent: re-running is safe.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
-- pgvector for AI Copilot long-term memory (services/api/src/copilot).
-- pulled from postgres:16-alpine? Not by default — dev simply ignores if missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "vector"';
  END IF;
END
$$;
