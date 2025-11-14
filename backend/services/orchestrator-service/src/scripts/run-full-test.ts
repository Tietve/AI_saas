/**
 * Full Test Runner for Multi-Turn RAG
 *
 * Steps:
 * 1. Setup RAG knowledge base (parse RAG.md, create embeddings)
 * 2. Run 10+ test scenarios
 * 3. Generate comprehensive report
 */

import { RAGKnowledgeSetup } from './setup-rag-knowledge';
import { MultiTurnRAGTester } from './test-multi-turn-rag';
import { ALL_SCENARIOS, printScenarios } from './test-scenarios';
import fs from 'fs';
import path from 'path';

async function runFullTest() {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🧪 MULTI-TURN RAG - FULL TEST SUITE`);
  console.log(`${'='.repeat(100)}\n`);

  const startTime = Date.now();

  try {
    // ====== STEP 1: Setup Knowledge Base ======
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`📚 STEP 1: Setup RAG Knowledge Base`);
    console.log(`${'─'.repeat(100)}\n`);

    const setup = new RAGKnowledgeSetup();

    console.log(`⚠️  Note: This will clear existing knowledge base and re-upload from RAG.md`);
    console.log(`⏳ This may take 2-5 minutes...\n`);

    // Clear and setup
    await setup.clearKnowledgeBase();
    await setup.setup();

    console.log(`✅ Knowledge base ready!\n`);

    // Wait a bit for vector store to index
    console.log(`⏳ Waiting 5 seconds for vector store indexing...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ====== STEP 2: Run Test Scenarios ======
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`🧪 STEP 2: Run Test Scenarios`);
    console.log(`${'─'.repeat(100)}\n`);

    printScenarios();

    const tester = new MultiTurnRAGTester();
    const reports: any[] = [];

    for (let i = 0; i < ALL_SCENARIOS.length; i++) {
      const scenario = ALL_SCENARIOS[i];

      console.log(`\n${'='.repeat(100)}`);
      console.log(`📝 Running Scenario ${i + 1}/${ALL_SCENARIOS.length}: ${scenario.name}`);
      console.log(`${'='.repeat(100)}\n`);

      try {
        const report = await tester.testConversation(scenario);
        reports.push(report);

        // Save individual report
        tester.saveReport(
          report,
          `scenario-${i + 1}-${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
        );

        // Short pause between scenarios
        if (i < ALL_SCENARIOS.length - 1) {
          console.log(`\n⏳ Pausing 3 seconds before next scenario...\n`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`\n❌ Scenario ${i + 1} failed:`, error);
        reports.push({
          testName: scenario.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          failed: true,
        });
      }
    }

    // ====== STEP 3: Generate Summary Report ======
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`📊 STEP 3: Generate Summary Report`);
    console.log(`${'─'.repeat(100)}\n`);

    const summary = generateSummaryReport(reports);
    printSummaryReport(summary);

    // Save summary report
    const outputDir = path.join(__dirname, '../../test-reports');
    const summaryPath = path.join(outputDir, `SUMMARY-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    // Save human-readable report
    const readablePath = path.join(outputDir, `SUMMARY-${Date.now()}.txt`);
    fs.writeFileSync(readablePath, formatReadableReport(summary), 'utf-8');

    const totalTime = Date.now() - startTime;

    console.log(`\n${'='.repeat(100)}`);
    console.log(`✅ FULL TEST SUITE COMPLETED`);
    console.log(`${'='.repeat(100)}`);
    console.log(`Total time: ${Math.round(totalTime / 1000)}s`);
    console.log(`Reports saved to: ${outputDir}`);
    console.log(`Summary: ${summaryPath}`);
    console.log(`Readable: ${readablePath}`);
    console.log(`${'='.repeat(100)}\n`);

    return summary;

  } catch (error) {
    console.error(`\n❌ Full test suite failed:`, error);
    throw error;
  }
}

function generateSummaryReport(reports: any[]) {
  const successful = reports.filter(r => !r.failed);
  const failed = reports.filter(r => r.failed);

  const totalScenarios = reports.length;
  const totalTurns = successful.reduce((sum, r) => sum + (r.totalTurns || 0), 0);
  const totalTokens = successful.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
  const totalLatency = successful.reduce((sum, r) => sum + (r.totalLatency || 0), 0);

  const redundancyCount = successful.filter(
    r => r.analysis?.redundancyDetected
  ).length;

  const avgTokenSavings =
    successful.reduce((sum, r) => sum + (r.analysis?.tokenSavings || 0), 0) /
    (successful.length || 1);

  const avgPromptReduction = {
    turn1: 0,
    turn2: 0,
    turn3: 0,
  };

  successful.forEach(r => {
    if (r.analysis?.avgPromptLengthByTurn) {
      const t1 = r.analysis.avgPromptLengthByTurn.turn1;
      const t2 = r.analysis.avgPromptLengthByTurn.turn2;
      const t3 = r.analysis.avgPromptLengthByTurn.turn3;

      if (t1 > 0) {
        avgPromptReduction.turn2 += ((t1 - t2) / t1) * 100;
        avgPromptReduction.turn3 += ((t1 - t3) / t1) * 100;
      }
    }
  });

  avgPromptReduction.turn2 /= successful.length || 1;
  avgPromptReduction.turn3 /= successful.length || 1;

  return {
    testDate: new Date().toISOString(),
    summary: {
      totalScenarios,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round((successful.length / totalScenarios) * 100),
    },
    performance: {
      totalTurns,
      totalTokens,
      avgTokensPerTurn: Math.round(totalTokens / (totalTurns || 1)),
      totalLatency,
      avgLatencyPerTurn: Math.round(totalLatency / (totalTurns || 1)),
    },
    qualityMetrics: {
      redundancyDetected: redundancyCount,
      redundancyRate: Math.round((redundancyCount / successful.length) * 100),
      avgTokenSavings: Math.round(avgTokenSavings),
      avgPromptReduction: {
        turn2: Math.round(avgPromptReduction.turn2),
        turn3: Math.round(avgPromptReduction.turn3),
      },
    },
    scenarios: reports.map((r, i) => ({
      number: i + 1,
      name: r.testName,
      status: r.failed ? 'FAILED' : 'PASSED',
      redundancy: r.analysis?.redundancyDetected ? 'YES' : 'NO',
      tokenSavings: r.analysis?.tokenSavings || 0,
      error: r.error,
    })),
    failedScenarios: failed.map(r => ({
      name: r.testName,
      error: r.error,
    })),
  };
}

function printSummaryReport(summary: any): void {
  console.log(`\n📊 SUMMARY REPORT`);
  console.log(`${'─'.repeat(100)}\n`);

  console.log(`✅ Success Rate: ${summary.summary.successful}/${summary.summary.totalScenarios} (${summary.summary.successRate}%)`);
  console.log(`❌ Failed: ${summary.summary.failed}`);
  console.log(``);

  console.log(`🔢 Performance:`);
  console.log(`   Total turns: ${summary.performance.totalTurns}`);
  console.log(`   Total tokens: ${summary.performance.totalTokens}`);
  console.log(`   Avg tokens/turn: ${summary.performance.avgTokensPerTurn}`);
  console.log(`   Avg latency/turn: ${summary.performance.avgLatencyPerTurn}ms`);
  console.log(``);

  console.log(`📏 Quality Metrics:`);
  console.log(`   Redundancy detected: ${summary.qualityMetrics.redundancyDetected}/${summary.summary.successful} scenarios (${summary.qualityMetrics.redundancyRate}%)`);
  console.log(`   Avg token savings: ${summary.qualityMetrics.avgTokenSavings} tokens per scenario`);
  console.log(`   Avg prompt reduction:`);
  console.log(`     Turn 2: ${summary.qualityMetrics.avgPromptReduction.turn2}% shorter`);
  console.log(`     Turn 3: ${summary.qualityMetrics.avgPromptReduction.turn3}% shorter`);
  console.log(``);

  console.log(`📋 Scenario Results:`);
  summary.scenarios.forEach((s: any) => {
    const icon = s.status === 'PASSED' ? '✅' : '❌';
    const redundancyIcon = s.redundancy === 'YES' ? '⚠️' : '✅';
    console.log(`   ${icon} ${s.number}. ${s.name}`);
    console.log(`      Status: ${s.status} | Redundancy: ${redundancyIcon} ${s.redundancy} | Token Savings: ${s.tokenSavings}`);
  });

  if (summary.failedScenarios.length > 0) {
    console.log(`\n❌ Failed Scenarios:`);
    summary.failedScenarios.forEach((f: any) => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  console.log(``);
}

function formatReadableReport(summary: any): string {
  const lines: string[] = [];

  lines.push('='.repeat(100));
  lines.push('MULTI-TURN RAG - TEST SUMMARY REPORT');
  lines.push('='.repeat(100));
  lines.push('');
  lines.push(`Test Date: ${summary.testDate}`);
  lines.push('');

  lines.push('OVERALL RESULTS');
  lines.push('-'.repeat(100));
  lines.push(`Total Scenarios: ${summary.summary.totalScenarios}`);
  lines.push(`Successful: ${summary.summary.successful} (${summary.summary.successRate}%)`);
  lines.push(`Failed: ${summary.summary.failed}`);
  lines.push('');

  lines.push('PERFORMANCE METRICS');
  lines.push('-'.repeat(100));
  lines.push(`Total Turns: ${summary.performance.totalTurns}`);
  lines.push(`Total Tokens: ${summary.performance.totalTokens}`);
  lines.push(`Average Tokens per Turn: ${summary.performance.avgTokensPerTurn}`);
  lines.push(`Average Latency per Turn: ${summary.performance.avgLatencyPerTurn}ms`);
  lines.push('');

  lines.push('QUALITY METRICS');
  lines.push('-'.repeat(100));
  lines.push(`Redundancy Detected: ${summary.qualityMetrics.redundancyDetected}/${summary.summary.successful} (${summary.qualityMetrics.redundancyRate}%)`);
  lines.push(`Average Token Savings: ${summary.qualityMetrics.avgTokenSavings} tokens/scenario`);
  lines.push(`Average Prompt Reduction:`);
  lines.push(`  Turn 2: ${summary.qualityMetrics.avgPromptReduction.turn2}% shorter than Turn 1`);
  lines.push(`  Turn 3: ${summary.qualityMetrics.avgPromptReduction.turn3}% shorter than Turn 1`);
  lines.push('');

  lines.push('SCENARIO DETAILS');
  lines.push('-'.repeat(100));
  summary.scenarios.forEach((s: any) => {
    lines.push(`${s.number}. ${s.name}`);
    lines.push(`   Status: ${s.status}`);
    lines.push(`   Redundancy: ${s.redundancy}`);
    lines.push(`   Token Savings: ${s.tokenSavings}`);
    if (s.error) {
      lines.push(`   Error: ${s.error}`);
    }
    lines.push('');
  });

  lines.push('='.repeat(100));

  return lines.join('\n');
}

// Run if executed directly
if (require.main === module) {
  runFullTest()
    .then(() => {
      console.log('✅ Full test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Full test failed:', error);
      process.exit(1);
    });
}

export { runFullTest };
