/*
  Warnings:

  - Changed the type of `model` on the `TokenUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."ModelId" AS ENUM ('gpt_4_turbo', 'gpt_4o', 'gpt_4o_mini', 'gpt_3_5_turbo', 'claude_3_opus', 'claude_3_5_sonnet', 'claude_3_5_haiku', 'gemini_1_5_pro', 'gemini_1_5_flash', 'gemini_2_0_flash', 'gpt5_thinking', 'gpt5_mini', 'gpt4o_mini');

-- AlterTable
ALTER TABLE "public"."TokenUsage" DROP COLUMN "model",
ADD COLUMN     "model" "public"."ModelId" NOT NULL;
