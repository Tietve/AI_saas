-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(200),
    "systemPrompt" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(100),
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "latencyMs" INTEGER,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL,
    "meta" JSONB,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_createdAt_idx" ON "public"."Conversation"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Message_idempotencyKey_key" ON "public"."Message"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "public"."Attachment"("messageId");

-- CreateIndex
CREATE INDEX "Attachment_conversationId_idx" ON "public"."Attachment"("conversationId");

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
