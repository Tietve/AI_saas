/**
 * Quick Test - Chỉ test 3 scenarios để verify nhanh
 */

import { smartPromptUpgraderAgent } from '../agents/smart-prompt-upgrader.agent';
import { conversationStateService } from '../services/conversation-state.service';

async function quickTest() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 QUICK TEST - Multi-Turn RAG`);
  console.log(`${'='.repeat(80)}\n`);

  const conversationId = `test_${Date.now()}`;
  const userId = 'test_user';

  const scenario = {
    name: 'API Development',
    turns: [
      'Tôi cần tạo REST API với Node.js',
      'Làm sao thêm JWT authentication?',
      'Còn rate limiting thì sao?',
    ],
  };

  console.log(`📝 Scenario: ${scenario.name}\n`);

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

      console.log(`\n✅ Upgraded Prompt (${result.upgradedPrompt.length} chars):`);
      console.log(`${'─'.repeat(80)}`);
      console.log(result.upgradedPrompt);
      console.log(`${'─'.repeat(80)}`);
      console.log(
        `📊 ${result.tokensUsed} tokens | ${result.latencyMs}ms | Turn ${result.turnNumber} | ${result.isFirstTurn ? 'FIRST' : 'FOLLOW-UP'}`
      );
      console.log(`🧠 ${result.reasoning}`);

      // Check for redundancy
      if (!result.isFirstTurn) {
        const hasRoleRepetition =
          result.upgradedPrompt.toLowerCase().includes('you are') &&
          result.upgradedPrompt.toLowerCase().includes('backend developer');

        if (hasRoleRepetition) {
          console.log(`\n⚠️  WARNING: Detected role repetition!`);
        } else {
          console.log(`\n✅ Good: No role repetition detected`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n❌ Turn ${i + 1} failed:`, error);
      throw error;
    }
  }

  // Cleanup
  await conversationStateService.clear(conversationId);

  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`✅ QUICK TEST COMPLETED`);
  console.log(`${'='.repeat(80)}\n`);
}

if (require.main === module) {
  quickTest()
    .then(() => {
      console.log('✅ Success');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

export { quickTest };
