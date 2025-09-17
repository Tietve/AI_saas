export class QueryComplexityAnalyzer {
    private patterns = {
        simple: [
            /^(what|who|when|where) is/i,
            /^define/i,
            /^translate/i,
            /^(hello|hi|hey)/i,
            /^thank/i
        ],
        medium: [
            /^explain/i,
            /^how (do|does|to)/i,
            /^list/i,
            /^compare/i,
            /^summarize/i
        ],
        complex: [
            /^analyze/i,
            /^create.*comprehensive/i,
            /^develop.*strategy/i,
            /^debug/i,
            /code/i,
            /\bmath\b/i,
            /\bproof\b/i
        ]
    };

    analyzeComplexity(query: string): number {
        const wordCount = query.split(/\s+/).length;
        const charCount = query.length;

        // Check patterns
        let patternScore = 0.5; // default medium

        for (const pattern of this.patterns.simple) {
            if (pattern.test(query)) {
                patternScore = 0.2;
                break;
            }
        }

        for (const pattern of this.patterns.complex) {
            if (pattern.test(query)) {
                patternScore = 0.8;
                break;
            }
        }

        // Length-based scoring
        const lengthScore = Math.min(charCount / 500, 1);

        // Word complexity
        const avgWordLength = charCount / wordCount;
        const wordComplexityScore = Math.min(avgWordLength / 10, 1);

        // Special markers
        const hasCode = /```/.test(query) ? 0.3 : 0;
        const hasMath = /[\d+\-*/=<>]/.test(query) ? 0.2 : 0;
        const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1 ? 0.2 : 0;

        // Weighted average
        const finalScore = (
            patternScore * 0.4 +
            lengthScore * 0.2 +
            wordComplexityScore * 0.2 +
            hasCode +
            hasMath +
            hasMultipleQuestions
        ) / 1.4;

        return Math.min(Math.max(finalScore, 0), 1);
    }

    estimateTokens(text: string): number {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
}