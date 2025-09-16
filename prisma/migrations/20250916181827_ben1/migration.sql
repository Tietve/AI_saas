/*
  Warnings:

  - The `model` column on the `Conversation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `defaultModel` column on the `UserSetting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `model` on the `TokenUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Conversation" DROP COLUMN "model",
ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini';

-- AlterTable
ALTER TABLE "public"."TokenUsage" DROP COLUMN "model",
ADD COLUMN     "model" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserSetting" DROP COLUMN "defaultModel",
ADD COLUMN     "defaultModel" TEXT;

-- DropEnum
DROP TYPE "public"."ModelId";
