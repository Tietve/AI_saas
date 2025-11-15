-- Initialize Test Database
-- This script runs when the PostgreSQL test container starts

-- Enable pgvector extension for document embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE ai_saas_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_saas_test')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_saas_test TO postgres;

-- Connect to test database
\c ai_saas_test

-- Enable pgvector on the test database
CREATE EXTENSION IF NOT EXISTS vector;

-- Success message
\echo 'Test database initialized successfully!'
