// 📁 File: src/lib/provider/index.ts (chọn provider theo ENV)
// ============================================================================
import type { LLMProvider } from "./base";
import { OpenAIProvider } from "./openai";


export function getProvider(): LLMProvider {
    const name = (process.env.AI_PROVIDER || "openai").toLowerCase();
    switch (name) {
        case "openai":
        default:
            return new OpenAIProvider();
    }
}