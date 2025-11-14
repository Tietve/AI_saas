# Phase 3: Frontend Integration - PDF Q&A System

**Created:** 2025-11-13
**Status:** Planning
**Priority:** High
**Dependencies:** Phase 1 (Backend API), Phase 2 (RAG System)

---

## Overview

Integrate PDF upload, management, and Q&A functionality into the existing React frontend using Feature-Sliced Design architecture. Build upon existing patterns (Zustand, React Query, MUI + Tailwind).

---

## Tech Stack

**Framework:** React 19.1.1 + TypeScript 5.9.3 + Vite 7.1.7
**State Management:** Zustand (UI state) + TanStack React Query v5 (server state)
**UI Components:** Material-UI v7.3.4 + Tailwind CSS v3.4.18
**Architecture:** Feature-Sliced Design (FSD)
**File Upload:** react-dropzone v14+ + Axios
**Streaming:** EventSource (SSE) for AI responses

---

## Implementation Phases

### Phase 1: Document Upload & Management
**Status:** Not Started
**Duration:** 4-6 hours
**Details:** [phase-01-document-upload.md](./phase-01-document-upload.md)

- PDF upload with drag-drop (react-dropzone)
- Document list with real-time status (PROCESSING/COMPLETED/FAILED)
- Quota management (5 PDFs max)
- Delete functionality with optimistic updates
- Integration with existing FSD architecture

### Phase 2: Q&A Chat Interface
**Status:** Not Started
**Duration:** 6-8 hours
**Details:** phase-02-qa-chat-interface.md

- Chat UI extending existing chat feature
- Document context selection
- SSE streaming for AI responses
- Source citations with page numbers
- Message history with document references

### Phase 3: Advanced Features
**Status:** Not Started
**Duration:** 4-6 hours
**Details:** phase-03-advanced-features.md

- PDF viewer with page navigation
- Citation click → PDF page jump
- Multi-document Q&A
- Search within documents
- Export conversation history

---

## Research Reports

All research findings located in `research/` directory:

- [researcher-01-pdf-upload-patterns.md](./research/researcher-01-pdf-upload-patterns.md) - React PDF upload with drag-drop
- [researcher-02-sse-streaming.md](./research/researcher-02-sse-streaming.md) - SSE streaming implementation
- [researcher-03-react-query-patterns.md](./research/researcher-03-react-query-patterns.md) - React Query for API integration
- [researcher-04-chat-ui-patterns.md](./research/researcher-04-chat-ui-patterns.md) - Modern chat UI patterns
- [researcher-05-state-management.md](./research/researcher-05-state-management.md) - State management architecture

**Scout Report:** [scout/scout-01-frontend-structure.md](./scout/scout-01-frontend-structure.md)

---

## Backend APIs

- `POST /api/documents/upload` - Upload PDF
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/query` - Q&A (non-streaming)
- `POST /api/documents/query?stream=true` - Q&A streaming (SSE)

---

## Success Criteria

- [ ] Users can upload PDFs via drag-drop
- [ ] Real-time processing status updates
- [ ] Document list with quotas displayed
- [ ] Ask questions about uploaded PDFs
- [ ] Streaming AI responses with citations
- [ ] Delete documents with instant UI feedback
- [ ] Zero breaking changes to existing chat feature
- [ ] Mobile-responsive design
- [ ] Type-safe TypeScript implementation

---

## Timeline

**Total Estimate:** 14-20 hours
**Target Completion:** 3-4 days (part-time development)

**Phase 1:** 4-6 hours (Core functionality)
**Phase 2:** 6-8 hours (Q&A interface)
**Phase 3:** 4-6 hours (Polish & advanced features)

---

## Next Steps

1. Review Phase 1 detailed plan: [phase-01-document-upload.md](./phase-01-document-upload.md)
2. Set up Feature-Sliced Design structure: `frontend/src/features/documents/`
3. Install dependencies: `react-dropzone`, `axios` (if not already installed)
4. Implement document upload UI
5. Integrate with existing chat store (Zustand)
