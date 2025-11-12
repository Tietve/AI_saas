import OpenAI from 'openai';
import logger from '../config/logger.config';
import { env } from '../config/env.config';

export interface Scores {
  relevance: number;
  faithfulness: number;
  helpfulness: number;
}

/**
 * LLM-as-Judge Service
 * Uses GPT-4o-mini to score prompt upgrade quality
 */
export class LLMJudgeService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.openai.apiKey,
    });
  }

  /**
   * Score relevance: How relevant is the answer to the question?
   * @returns Score from 0.0 (irrelevant) to 1.0 (perfectly relevant)
   */
  public async scoreRelevance(question: string, answer: string): Promise<number> {
    try {
      const prompt = `You are an expert evaluator. Score how relevant the answer is to the question.

Question: ${question}

Answer: ${answer}

Rate from 0.0 (completely irrelevant) to 1.0 (perfectly relevant).

Respond with ONLY a number between 0.0 and 1.0. No explanation.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 10,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || '0';
      const score = parseFloat(scoreText);

      if (isNaN(score) || score < 0 || score > 1) {
        logger.warn(`[LLMJudge] Invalid relevance score: ${scoreText}, defaulting to 0`);
        return 0;
      }

      logger.debug(`[LLMJudge] Relevance score: ${score}`);
      return score;
    } catch (error) {
      logger.error('[LLMJudge] Failed to score relevance:', error);
      return 0;
    }
  }

  /**
   * Score faithfulness: Is the answer faithful to the context?
   * @returns Score from 0.0 (contradicts) to 1.0 (perfectly faithful)
   */
  public async scoreFaithfulness(context: string, answer: string): Promise<number> {
    try {
      const prompt = `You are an expert evaluator. Score how faithful the answer is to the given context.

Context: ${context}

Answer: ${answer}

Rate from 0.0 (contradicts context or adds false information) to 1.0 (perfectly faithful to context).

Respond with ONLY a number between 0.0 and 1.0. No explanation.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 10,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || '0';
      const score = parseFloat(scoreText);

      if (isNaN(score) || score < 0 || score > 1) {
        logger.warn(`[LLMJudge] Invalid faithfulness score: ${scoreText}, defaulting to 0`);
        return 0;
      }

      logger.debug(`[LLMJudge] Faithfulness score: ${score}`);
      return score;
    } catch (error) {
      logger.error('[LLMJudge] Failed to score faithfulness:', error);
      return 0;
    }
  }

  /**
   * Score helpfulness: How helpful is the answer?
   * @returns Score from 0.0 (not helpful) to 1.0 (extremely helpful)
   */
  public async scoreHelpfulness(question: string, answer: string): Promise<number> {
    try {
      const prompt = `You are an expert evaluator. Score how helpful the answer is.

Question: ${question}

Answer: ${answer}

Rate from 0.0 (not helpful at all) to 1.0 (extremely helpful and actionable).

Respond with ONLY a number between 0.0 and 1.0. No explanation.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 10,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || '0';
      const score = parseFloat(scoreText);

      if (isNaN(score) || score < 0 || score > 1) {
        logger.warn(`[LLMJudge] Invalid helpfulness score: ${scoreText}, defaulting to 0`);
        return 0;
      }

      logger.debug(`[LLMJudge] Helpfulness score: ${score}`);
      return score;
    } catch (error) {
      logger.error('[LLMJudge] Failed to score helpfulness:', error);
      return 0;
    }
  }

  /**
   * Score all metrics at once
   */
  public async scoreAll(
    question: string,
    context: string,
    answer: string
  ): Promise<Scores> {
    const [relevance, faithfulness, helpfulness] = await Promise.all([
      this.scoreRelevance(question, answer),
      this.scoreFaithfulness(context, answer),
      this.scoreHelpfulness(question, answer),
    ]);

    logger.info(
      `[LLMJudge] Scores - Relevance: ${relevance.toFixed(2)}, ` +
      `Faithfulness: ${faithfulness.toFixed(2)}, ` +
      `Helpfulness: ${helpfulness.toFixed(2)}`
    );

    return { relevance, faithfulness, helpfulness };
  }
}

// Export singleton
export const llmJudgeService = new LLMJudgeService();
