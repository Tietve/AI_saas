/*
  Warnings:

  - A unique constraint covering the columns `[conversationId,idempotencyKey]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Message_idempotencyKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_idempotencyKey_key" ON "public"."Message"("conversationId", "idempotencyKey");
