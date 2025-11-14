/**
 * Test Multi-Turn Logic WITHOUT RAG
 * Just test conversation state management and prompt building
 */

import { conversationStateService } from '../services/conversation-state.service';
import { OpenAI } from 'openai';
import { env } from '../config/env.config';

const openai = new OpenAI({
  apiKey: env.openai.apiKey,
});

async function testWithoutRAG() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST MULTI-TURN LOGIC (Without RAG)`);
  console.log(`${'='.repeat(80)}\n`);

  const conversationId = `test_no_rag_${Date.now()}`;
  const userId = 'test_user';

  const turns = [
    'Tôi cần tạo REST API với Node.js',
    'Làm sao thêm JWT authentication?',
    'Còn rate limiting thì sao?',
  ];

  for (let i = 0; i < turns.length; i++) {
    const userMessage = turns[i];

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📝 Turn ${i + 1}: "${userMessage}"`);
    console.log(`${'─'.repeat(80)}\n`);

    // Get conversation state
    const state = await conversationStateService.getOrCreate(
      conversationId,
      userId
    );

    const isFirstTurn = conversationStateService.isFirstTurn(state);

    console.log(`🔍 State:`);
    console.log(`   - Turn number: ${state.turnNumber}`);
    console.log(`   - Is first turn: ${isFirstTurn}`);
    console.log(`   - Current role: ${state.currentRole || '(none)'}`);
    console.log(`   - Current task: ${state.currentTask || '(none)'}`);
    console.log(`   - Message history: ${state.messageHistory.length} messages`);

    // Build prompt based on turn
    let systemPrompt: string;
    let userPrompt: string;

    if (isFirstTurn) {
      // FIRST TURN: Full prompt
      systemPrompt = `You are an expert prompt engineer.

Create a COMPLETE professional prompt with:
- Clear ROLE definition
- Specific TASK description
- Relevant CONTEXT
- CONSTRAINTS and requirements
- OUTPUT FORMAT

Return JSON: {"final_prompt": "...", "reasoning": "...", "confidence": 0.0-1.0}`;

      userPrompt = `User's request: "${userMessage}"\n\nCreate a complete professional prompt.`;
    } else {
      // FOLLOW-UP TURN: Contextual enhancement
      const contextSummary = conversationStateService.buildContextSummary(state);

      systemPrompt = `You are continuing a conversation.

Previous context:
${contextSummary}

Your task: Build a CONTEXTUAL prompt enhancement that:
- Does NOT repeat the role/persona (already established)
- References the ongoing context naturally
- Adds new relevant instructions
- Keeps it concise

Return JSON: {"final_prompt": "...", "reasoning": "...", "confidence": 0.0-1.0}`;

      userPrompt = `User's follow-up: "${userMessage}"\n\nCreate contextual enhancement (NOT full prompt).`;
    }

    // Call GPT-4
    console.log(`\n🤖 Calling GPT-4...`);
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const latency = Date.now() - startTime;
    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    const upgradedPrompt = parsed.final_prompt || userMessage;
    const reasoning = parsed.reasoning || '';
    const confidence = parsed.confidence || 0.8;
    const tokensUsed = response.usage?.total_tokens || 0;

    console.log(`\n✅ Upgraded Prompt (${upgradedPrompt.length} chars, ${tokensUsed} tokens, ${latency}ms):`);
    console.log(`${'─'.repeat(80)}`);
    console.log(upgradedPrompt);
    console.log(`${'─'.repeat(80)}`);
    console.log(`🧠 Reasoning: ${reasoning}`);
    console.log(`📊 Confidence: ${confidence}`);

    // Analyze for redundancy
    if (!isFirstTurn) {
      const lowerPrompt = upgradedPrompt.toLowerCase();
      const hasRoleRepetition =
        (lowerPrompt.includes('you are') &&
          lowerPrompt.includes('developer')) ||
        lowerPrompt.includes('your role is');

      if (hasRoleRepetition) {
        console.log(`\n⚠️  WARNING: Detected potential role repetition!`);
      } else {
        console.log(`\n✅ Good: No role repetition detected`);
      }

      // Check length reduction
      const firstTurnLength = state.messageHistory[0]?.upgradedPrompt?.length || 0;
      if (firstTurnLength > 0) {
        const reduction = ((firstTurnLength - upgradedPrompt.length) / firstTurnLength) * 100;
        console.log(`📏 Prompt ${reduction > 0 ? 'reduced' : 'increased'} by ${Math.abs(Math.round(reduction))}% from Turn 1`);
      }
    }

    // Extract role/task from first turn
    if (isFirstTurn) {
      const roleMatch = upgradedPrompt.match(/You are (?:a|an) ([^.]+)/i);
      const taskMatch = upgradedPrompt.match(/Your task is to ([^.]+)/i);

      if (roleMatch || taskMatch) {
        await conversationStateService.updateContext(conversationId, {
          role: roleMatch ? roleMatch[1].trim() : undefined,
          task: taskMatch ? taskMatch[1].trim() : undefined,
        });

        console.log(`\n💾 Extracted context:`);
        if (roleMatch) console.log(`   Role: ${roleMatch[1].trim()}`);
        if (taskMatch) console.log(`   Task: ${taskMatch[1].trim()}`);
      }
    }

    // Save message
    await conversationStateService.addMessage(conversationId, {
      role: 'user',
      content: userMessage,
      upgradedPrompt,
      timestamp: new Date(),
    });

    // Increment turn
    await conversationStateService.incrementTurn(conversationId);

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final analysis
  const finalState = await conversationStateService.getOrCreate(
    conversationId,
    userId
  );

  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 FINAL ANALYSIS`);
  console.log(`${'='.repeat(80)}`);

  console.log(`\nTotal turns: ${finalState.turnNumber}`);
  console.log(`Message history: ${finalState.messageHistory.length}`);

  // Calculate token savings
  const turn1Tokens = finalState.messageHistory[0]?.upgradedPrompt?.length || 0;
  const turn2Tokens = finalState.messageHistory[1]?.upgradedPrompt?.length || 0;
  const turn3Tokens = finalState.messageHistory[2]?.upgradedPrompt?.length || 0;

  const statelessEstimate = turn1Tokens * 3;
  const statefulActual = turn1Tokens + turn2Tokens + turn3Tokens;
  const savings = statelessEstimate - statefulActual;
  const savingsPercent = (savings / statelessEstimate) * 100;

  console.log(`\nPrompt lengths:`);
  console.log(`  Turn 1: ${turn1Tokens} chars`);
  console.log(`  Turn 2: ${turn2Tokens} chars (${Math.round(((turn1Tokens - turn2Tokens) / turn1Tokens) * 100)}% shorter)`);
  console.log(`  Turn 3: ${turn3Tokens} chars (${Math.round(((turn1Tokens - turn3Tokens) / turn1Tokens) * 100)}% shorter)`);

  console.log(`\nSavings (vs stateless):`);
  console.log(`  Stateless (estimated): ${statelessEstimate} chars`);
  console.log(`  Stateful (actual): ${statefulActual} chars`);
  console.log(`  Savings: ${savings} chars (${Math.round(savingsPercent)}%)`);

  // Cleanup
  await conversationStateService.clear(conversationId);

  console.log(`\n✅ Test completed!\n`);

  // Return pass/fail
  const PASS_THRESHOLD = {
    turn2Reduction: 40, // Turn 2 should be at least 40% shorter
    turn3Reduction: 50, // Turn 3 should be at least 50% shorter
    savings: 25, // Total savings should be at least 25%
  };

  const turn2Reduction = ((turn1Tokens - turn2Tokens) / turn1Tokens) * 100;
  const turn3Reduction = ((turn1Tokens - turn3Tokens) / turn1Tokens) * 100;

  const passed =
    turn2Reduction >= PASS_THRESHOLD.turn2Reduction &&
    turn3Reduction >= PASS_THRESHOLD.turn3Reduction &&
    savingsPercent >= PASS_THRESHOLD.savings;

  if (passed) {
    console.log(`\n✅ TEST PASSED!`);
    console.log(`   - Turn 2 reduction: ${Math.round(turn2Reduction)}% ≥ ${PASS_THRESHOLD.turn2Reduction}% ✅`);
    console.log(`   - Turn 3 reduction: ${Math.round(turn3Reduction)}% ≥ ${PASS_THRESHOLD.turn3Reduction}% ✅`);
    console.log(`   - Total savings: ${Math.round(savingsPercent)}% ≥ ${PASS_THRESHOLD.savings}% ✅`);
  } else {
    console.log(`\n❌ TEST FAILED!`);
    console.log(`   - Turn 2 reduction: ${Math.round(turn2Reduction)}% < ${PASS_THRESHOLD.turn2Reduction}% ${turn2Reduction >= PASS_THRESHOLD.turn2Reduction ? '✅' : '❌'}`);
    console.log(`   - Turn 3 reduction: ${Math.round(turn3Reduction)}% < ${PASS_THRESHOLD.turn3Reduction}% ${turn3Reduction >= PASS_THRESHOLD.turn3Reduction ? '✅' : '❌'}`);
    console.log(`   - Total savings: ${Math.round(savingsPercent)}% < ${PASS_THRESHOLD.savings}% ${savingsPercent >= PASS_THRESHOLD.savings ? '✅' : '❌'}`);
  }

  console.log(``);

  return passed;
}

if (require.main === module) {
  testWithoutRAG()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testWithoutRAG };
