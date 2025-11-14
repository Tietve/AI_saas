# PDF Q&A System Implementation Plan

**Project:** my-saas-chat PDF Q&A Integration
**Start Date:** 2025-11-13
**Timeline:** 3 weeks (Phase 1 MVP)
**Status:** Planning

---

## Overview

Integrate PDF upload and semantic search capabilities into chat-service, enabling users to upload documents and query them using RAG (Retrieval-Augmented Generation) with OpenAI embeddings.

**Business Model:** B2C Freemium
- Free tier: 5 PDFs, 10MB max, 50 messages/day
- Budget: $100-500/month (infrastructure + OpenAI API)

**Tech Stack:**
- Vector DB: pgvector (PostgreSQL extension)
- Embeddings: OpenAI text-embedding-3-small (1536 dims)
- PDF Parsing: pdf-parse (primary), pdfjs-dist (fallback)
- Storage: Cloudflare R2 (98% egress savings)
- RAG: Hybrid search (semantic + BM25) with reranking

---

## Phases

### Phase 1: Infrastructure Setup
**Dates:** Week 1 (Nov 13-19)
**Priority:** Critical
**Status:** Not Started
**Details:** [phase-01-infrastructure-setup.md](./phase-01-infrastructure-setup.md)

Setup foundational infrastructure:
- Enable pgvector extension in PostgreSQL
- Configure Cloudflare R2 bucket with lifecycle policies
- Install dependencies (pdf-parse, OpenAI SDK, AWS SDK)
- Update Prisma schema with Document and DocumentChunk models
- Create vector indexes (HNSW for cosine similarity)

### Phase 2: Core Implementation
**Dates:** Week 2-3 (Nov 20 - Dec 3)
**Priority:** High
**Status:** Not Started
**Details:** [phase-02-core-implementation.md](./phase-02-core-implementation.md)

Build PDF processing and RAG query pipeline:
- PDF upload endpoint with validation
- Text extraction with hybrid parser (pdf-parse + pdfjs-dist fallback)
- Semantic chunking (512 tokens, 20% overlap)
- Embedding generation with OpenAI API
- Vector storage in pgvector
- RAG query endpoint with hybrid search
- Streaming SSE responses

### Phase 3: Cost Monitoring & Limits
**Dates:** Week 3 (Nov 27 - Dec 3)
**Priority:** High
**Status:** Not Started
**Details:** [phase-03-cost-monitoring-limits.md](./phase-03-cost-monitoring-limits.md)

Implement cost controls and monitoring:
- Rate limiting (5 uploads/day, 50 queries/day for free tier)
- Token usage tracking and billing integration
- Cost alerts and anomaly detection
- Quota enforcement middleware
- Analytics dashboard for admin

---

## Success Criteria

**Phase 1 (Infrastructure):**
- [ ] pgvector extension operational
- [ ] R2 bucket accessible with presigned URLs
- [ ] Database schema migrated successfully
- [ ] Vector indexes created (query time <200ms)

**Phase 2 (Core Features):**
- [ ] Upload PDF and extract text (95%+ success rate)
- [ ] Generate embeddings for chunks
- [ ] Query documents with relevant results (top-5 accuracy >80%)
- [ ] Stream RAG responses in <2 seconds
- [ ] Handle errors gracefully (corrupted PDFs, quota exceeded)

**Phase 3 (Cost Control):**
- [ ] Rate limits enforced correctly
- [ ] Token usage tracked per user/request
- [ ] Cost alerts trigger at 80% budget
- [ ] Free tier restrictions work as expected

**Overall MVP:**
- [ ] Users can upload 5 PDFs (10MB max)
- [ ] Users can query PDFs with natural language
- [ ] System costs stay under $200/month for 1000 users
- [ ] Query response time <3 seconds (p95)
- [ ] No data leaks between users (security audit passes)

---

## Risk Summary

**High Risk:**
- **Cost overrun:** OpenAI embeddings scale with usage → Mitigation: Hard limits + monitoring
- **Performance:** Large PDFs slow to process → Mitigation: Background queue + status updates
- **Accuracy:** RAG hallucinations → Mitigation: Source citation + confidence scoring

**Medium Risk:**
- **Corrupted PDFs:** Parser failures → Mitigation: Multi-parser fallback (pdf-parse → pdfjs-dist)
- **Storage costs:** R2 charges grow → Mitigation: Lifecycle policies (delete after 90 days)

**Low Risk:**
- **Schema changes:** Breaking migrations → Mitigation: Use Prisma migrations + backup DB

**Mitigation Strategy:**
- Start with strict limits (5 PDFs/user)
- Monitor costs daily during beta
- Use batch embeddings API (50% cost savings)
- Implement circuit breakers for OpenAI API

---

## Dependencies

**External Services:**
- OpenAI API (embeddings + chat completion)
- Cloudflare R2 (PDF storage)
- PostgreSQL with pgvector

**Internal Services:**
- auth-service (JWT verification)
- billing-service (quota checks)
- analytics-service (usage tracking)

**New NPM Packages:**
- pdf-parse (text extraction)
- @aws-sdk/client-s3 (R2 integration)
- js-tiktoken (token counting)

---

## Team Notes

**Key Files to Review:**
- Research reports: `./research/researcher-*.md`
- Scout report: `./scout/scout-01-chat-service-structure.md`
- Phase details: `./phase-*.md`

**Development Principles:**
- Follow existing chat-service patterns (controller → service → repository)
- Reuse OpenAI client, auth middleware, billing integration
- Test with production-like data (100+ page PDFs)
- Security: Validate user ownership before queries

**Next Steps:**
1. Review phase-01 details
2. Setup pgvector + R2 (Week 1)
3. Begin PDF upload implementation (Week 2)
4. Deploy MVP to staging for testing (Week 3)

---

**Plan Version:** 1.0
**Last Updated:** 2025-11-13
**Owner:** Planner Agent
