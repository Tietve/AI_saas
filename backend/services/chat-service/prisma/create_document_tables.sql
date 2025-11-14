-- Create DocumentStatus enum
CREATE TYPE "DocumentStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- Create documents table
CREATE TABLE "documents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
  "fileSize" INTEGER NOT NULL,
  "pageCount" INTEGER,
  "storageKey" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PROCESSING',
  "errorMessage" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3)
);

-- Create document_chunks table
CREATE TABLE "document_chunks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "pageNumber" INTEGER,
  "tokens" INTEGER NOT NULL,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for documents
CREATE INDEX "documents_userId_uploadedAt_idx" ON "documents"("userId", "uploadedAt");
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- Create indexes for document_chunks
CREATE INDEX "document_chunks_documentId_chunkIndex_idx" ON "document_chunks"("documentId", "chunkIndex");
