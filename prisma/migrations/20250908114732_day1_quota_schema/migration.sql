-- CreateEnum
CREATE TYPE "public"."PlanTier" AS ENUM ('FREE', 'PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "public"."ModelId" AS ENUM ('gpt5_thinking', 'gpt5_mini', 'gpt4o_mini');

-- DropIndex
DROP INDEX "public"."Conversation_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "model" "public"."ModelId" NOT NULL DEFAULT 'gpt5_mini';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "monthlyTokenUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planTier" "public"."PlanTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planTier" "public"."PlanTier" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "model" "public"."ModelId" NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSetting" (
    "userId" TEXT NOT NULL,
    "theme" TEXT,
    "layoutConfig" JSONB,
    "defaultModel" "public"."ModelId",

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Subscription_userId_isActive_idx" ON "public"."Subscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "TokenUsage_userId_createdAt_idx" ON "public"."TokenUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "public"."Conversation"("userId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenUsage" ADD CONSTRAINT "TokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
