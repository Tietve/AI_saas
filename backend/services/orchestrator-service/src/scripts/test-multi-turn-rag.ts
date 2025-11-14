/**
 * Test script for Multi-Turn RAG system
 * Tests 3-turn conversation to verify no redundancy
 */

import { smartPromptUpgraderAgent } from '../agents/smart-prompt-upgrader.agent';
import { conversationStateService } from '../services/conversation-state.service';
import logger from '../config/logger.config';
import fs from 'fs';
import path from 'path';

interface TurnResult {
  turnNumber: number;
  userMessage: string;
  upgradedPrompt: string;
  reasoning: string;
  confidence: number;
  isFirstTurn: boolean;
  knowledgeUsed: number;
  tokensUsed: number;
  latencyMs: number;
  promptLength: number;
}

interface TestReport {
  testName: string;
  conversationId: string;
  userId: string;
  totalTurns: number;
  totalTokens: number;
  totalLatency: number;
  turns: TurnResult[];
  analysis: {
    redundancyDetected: boolean;
    redundantPhrases: string[];
    tokenSavings: number;
    avgPromptLengthByTurn: { turn1: number; turn2: number; turn3: number };
  };
  timestamp: string;
}

class MultiTurnRAGTester {
  /**
   * Test 3-turn conversation
   */
  public async testConversation(
    scenario: {
      name: string;
      turns: string[];
    }
  ): Promise<TestReport> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST: ${scenario.name}`);
    console.log(`${'='.repeat(80)}\n`);

    const conversationId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = 'test_user_123';

    const results: TurnResult[] = [];
    let totalTokens = 0;
    let totalLatency = 0;

    // Run 3 turns
    for (let i = 0; i < scenario.turns.length; i++) {
      const userMessage = scenario.turns[i];

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📝 Turn ${i + 1}: "${userMessage}"`);
      console.log(`${'─'.repeat(80)}`);

      try {
        const result = await smartPromptUpgraderAgent.upgrade({
          userMessage,
          conversationId,
          userId,
        });

        const turnResult: TurnResult = {
          turnNumber: i + 1,
          userMessage,
          upgradedPrompt: result.upgradedPrompt,
          reasoning: result.reasoning,
          confidence: result.confidence,
          isFirstTurn: result.isFirstTurn,
          knowledgeUsed: result.knowledgeUsed,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
          promptLength: result.upgradedPrompt.length,
        };

        results.push(turnResult);
        totalTokens += result.tokensUsed;
        totalLatency += result.latencyMs;

        // Print result
        console.log(`\n✅ Upgraded Prompt:`);
        console.log(`${'-'.repeat(80)}`);
        console.log(result.upgradedPrompt);
        console.log(`${'-'.repeat(80)}`);
        console.log(
          `📊 Stats: ${result.tokensUsed} tokens | ${result.latencyMs}ms | Confidence: ${result.confidence} | Knowledge: ${result.knowledgeUsed} docs`
        );
        console.log(`🧠 Reasoning: ${result.reasoning}`);

        // Wait a bit between turns
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Turn ${i + 1} failed:`, error);
        throw error;
      }
    }

    // Analyze results
    const analysis = this.analyzeResults(results);

    const report: TestReport = {
      testName: scenario.name,
      conversationId,
      userId,
      totalTurns: results.length,
      totalTokens,
      totalLatency,
      turns: results,
      analysis,
      timestamp: new Date().toISOString(),
    };

    // Print analysis
    this.printAnalysis(report);

    // Cleanup
    await conversationStateService.clear(conversationId);

    return report;
  }

  /**
   * Analyze results for redundancy
   */
  private analyzeResults(turns: TurnResult[]): TestReport['analysis'] {
    const redundantPhrases: string[] = [];

    // Check if Turn 2 or 3 repeats phrases from Turn 1
    if (turns.length >= 2) {
      const turn1Lower = turns[0].upgradedPrompt.toLowerCase();
      const turn1Phrases = this.extractKeyPhrases(turn1Lower);

      for (let i = 1; i < turns.length; i++) {
        const turnLower = turns[i].upgradedPrompt.toLowerCase();

        for (const phrase of turn1Phrases) {
          if (turnLower.includes(phrase) && phrase.length > 20) {
            redundantPhrases.push(phrase);
          }
        }
      }
    }

    const redundancyDetected = redundantPhrases.length > 0;

    // Calculate token savings vs stateless approach
    const turn1Tokens = turns[0]?.tokensUsed || 0;
    const followUpTokens = turns
      .slice(1)
      .reduce((sum, t) => sum + t.tokensUsed, 0);

    // In stateless, all turns would use ~turn1 tokens
    const statelessEstimate = turn1Tokens * turns.length;
    const actualUsed = turn1Tokens + followUpTokens;
    const tokenSavings = statelessEstimate - actualUsed;

    // Avg prompt length by turn
    const avgPromptLengthByTurn = {
      turn1: turns[0]?.promptLength || 0,
      turn2: turns[1]?.promptLength || 0,
      turn3: turns[2]?.promptLength || 0,
    };

    return {
      redundancyDetected,
      redundantPhrases,
      tokenSavings,
      avgPromptLengthByTurn,
    };
  }

  /**
   * Extract key phrases from text
   */
  private extractKeyPhrases(text: string): string[] {
    const phrases: string[] = [];

    // Extract sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Common role/persona phrases
    const rolePatterns = [
      /you are (?:a|an) [^.]{10,}/gi,
      /your task is to [^.]{10,}/gi,
      /please ensure [^.]{10,}/gi,
      /requirements:[^.]{10,}/gi,
    ];

    for (const pattern of rolePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.map((m) => m.toLowerCase()));
      }
    }

    return phrases;
  }

  /**
   * Print analysis report
   */
  private printAnalysis(report: TestReport): void {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 ANALYSIS REPORT`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`Test: ${report.testName}`);
    console.log(`Total Turns: ${report.totalTurns}`);
    console.log(`Total Tokens: ${report.totalTokens}`);
    console.log(`Total Latency: ${report.totalLatency}ms`);
    console.log(
      `Avg Latency per Turn: ${Math.round(report.totalLatency / report.totalTurns)}ms`
    );

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📏 Prompt Length by Turn:`);
    console.log(
      `  Turn 1: ${report.analysis.avgPromptLengthByTurn.turn1} chars`
    );
    console.log(
      `  Turn 2: ${report.analysis.avgPromptLengthByTurn.turn2} chars (${Math.round(((report.analysis.avgPromptLengthByTurn.turn1 - report.analysis.avgPromptLengthByTurn.turn2) / report.analysis.avgPromptLengthByTurn.turn1) * 100)}% shorter)`
    );
    console.log(
      `  Turn 3: ${report.analysis.avgPromptLengthByTurn.turn3} chars (${Math.round(((report.analysis.avgPromptLengthByTurn.turn1 - report.analysis.avgPromptLengthByTurn.turn3) / report.analysis.avgPromptLengthByTurn.turn1) * 100)}% shorter)`
    );

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`💰 Token Savings:`);
    console.log(
      `  Stateless approach (estimated): ${report.turns[0].tokensUsed * report.totalTurns} tokens`
    );
    console.log(`  Stateful approach (actual): ${report.totalTokens} tokens`);
    console.log(
      `  Savings: ${report.analysis.tokenSavings} tokens (${Math.round((report.analysis.tokenSavings / (report.turns[0].tokensUsed * report.totalTurns)) * 100)}%)`
    );

    console.log(`\n${'─'.repeat(80)}`);
    if (report.analysis.redundancyDetected) {
      console.log(`❌ REDUNDANCY DETECTED:`);
      console.log(
        `   Found ${report.analysis.redundantPhrases.length} redundant phrases:`
      );
      report.analysis.redundantPhrases.forEach((phrase, i) => {
        console.log(`   ${i + 1}. "${phrase.substring(0, 80)}..."`);
      });
    } else {
      console.log(`✅ NO REDUNDANCY DETECTED - Perfect!`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }

  /**
   * Save report to file
   */
  public saveReport(report: TestReport, filename?: string): void {
    const outputDir = path.join(__dirname, '../../test-reports');

    // Create directory if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(
      outputDir,
      filename ||
        `multi-turn-test-${Date.now()}.json`
    );

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`💾 Report saved to: ${filepath}`);
  }
}

// ====== Test Scenarios ======

import { ALL_SCENARIOS, printScenarios } from './test-scenarios';

// ====== Run Tests ======

async function runAllTests() {
  const tester = new MultiTurnRAGTester();

  console.log(`\n🚀 Starting Multi-Turn RAG Tests...`);
  console.log(`Running ${ALL_SCENARIOS.length} test scenarios\n`);

  // Print all scenarios first
  printScenarios();

  const reports: TestReport[] = [];

  for (const scenario of ALL_SCENARIOS) {
    try {
      const report = await tester.testConversation(scenario);
      reports.push(report);

      // Save individual report
      tester.saveReport(
        report,
        `${scenario.name.toLowerCase().replace(/\s+/g, '-')}.json`
      );

      // Wait between scenarios
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Scenario "${scenario.name}" failed:`, error);
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📈 SUMMARY OF ALL TESTS`);
  console.log(`${'='.repeat(80)}\n`);

  reports.forEach((report) => {
    const hasRedundancy = report.analysis.redundancyDetected ? '❌' : '✅';
    const savings = Math.round(
      (report.analysis.tokenSavings /
        (report.turns[0].tokensUsed * report.totalTurns)) *
        100
    );

    console.log(
      `${hasRedundancy} ${report.testName}: ${savings}% token savings, ${report.analysis.redundantPhrases.length} redundant phrases`
    );
  });

  console.log(
    `\n✅ All tests completed! Reports saved to test-reports/\n`
  );
}

// Run if executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ Tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}

export { MultiTurnRAGTester, TurnResult, TestReport };
