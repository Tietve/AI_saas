-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "color" VARCHAR(20),
    "icon" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMetrics" (
    "id" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" "ModelId" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "errorCode" VARCHAR(100),
    "errorMessage" TEXT,
    "userId" TEXT,
    "requestId" VARCHAR(100),
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_userId_updatedAt_idx" ON "Project"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ProviderMetrics_provider_createdAt_idx" ON "ProviderMetrics"("provider", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProviderMetrics_model_createdAt_idx" ON "ProviderMetrics"("model", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProviderMetrics_success_createdAt_idx" ON "ProviderMetrics"("success", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProviderMetrics_provider_model_createdAt_idx" ON "ProviderMetrics"("provider", "model", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProviderMetrics_userId_createdAt_idx" ON "ProviderMetrics"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_userId_pinned_updatedAt_idx" ON "Conversation"("userId", "pinned", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Conversation_projectId_updatedAt_idx" ON "Conversation"("projectId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
