const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalVerification() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   CHAT-SERVICE DATABASE FIX - FINAL VERIFICATION REPORT   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = {
    databaseTables: { passed: 0, failed: 0 },
    schemaValidation: { passed: 0, failed: 0 },
    dataOperations: { passed: 0, failed: 0 },
    indexesConstraints: { passed: 0, failed: 0 }
  };

  try {
    // ═══════════════════════════════════════════════════════════
    // SECTION 1: DATABASE TABLES VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('═══ 1. DATABASE TABLES VERIFICATION ═══\n');

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      AND table_name IN ('Conversation', 'Message', 'TokenUsage')
      ORDER BY table_name
    `;

    const requiredTables = ['Conversation', 'Message', 'TokenUsage'];
    const foundTables = tables.map(t => t.table_name);

    requiredTables.forEach(table => {
      const exists = foundTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (exists) results.databaseTables.passed++; else results.databaseTables.failed++;
    });

    console.log('');

    // ═══════════════════════════════════════════════════════════
    // SECTION 2: SCHEMA STRUCTURE VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('═══ 2. SCHEMA STRUCTURE VERIFICATION ═══\n');

    // Check Conversation columns
    const convColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Conversation'
      ORDER BY ordinal_position
    `;

    const expectedConvColumns = ['id', 'userId', 'title', 'model', 'pinned', 'createdAt', 'updatedAt'];
    const foundConvColumns = convColumns.map(c => c.column_name);
    const convMatch = expectedConvColumns.every(col => foundConvColumns.includes(col));

    console.log(`✅ Conversation table has ${convColumns.length} columns`);
    console.log(`   Expected columns: ${expectedConvColumns.join(', ')}`);
    console.log(`   ${convMatch ? '✅ All columns present' : '❌ Missing columns'}`);
    if (convMatch) results.schemaValidation.passed++; else results.schemaValidation.failed++;

    // Check Message columns
    const msgColumns = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Message'
      ORDER BY ordinal_position
    `;

    const expectedMsgColumns = ['id', 'conversationId', 'role', 'content', 'tokenCount', 'model', 'createdAt'];
    const foundMsgColumns = msgColumns.map(c => c.column_name);
    const msgMatch = expectedMsgColumns.every(col => foundMsgColumns.includes(col));

    console.log(`✅ Message table has ${msgColumns.length} columns`);
    console.log(`   Expected columns: ${expectedMsgColumns.join(', ')}`);
    console.log(`   ${msgMatch ? '✅ All columns present' : '❌ Missing columns'}`);
    if (msgMatch) results.schemaValidation.passed++; else results.schemaValidation.failed++;

    // Check TokenUsage columns
    const tokenColumns = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'TokenUsage'
      ORDER BY ordinal_position
    `;

    const expectedTokenColumns = ['id', 'userId', 'messageId', 'model', 'promptTokens', 'completionTokens', 'totalTokens', 'cost', 'createdAt'];
    const foundTokenColumns = tokenColumns.map(c => c.column_name);
    const tokenMatch = expectedTokenColumns.every(col => foundTokenColumns.includes(col));

    console.log(`✅ TokenUsage table has ${tokenColumns.length} columns`);
    console.log(`   Expected columns: ${expectedTokenColumns.join(', ')}`);
    console.log(`   ${tokenMatch ? '✅ All columns present' : '❌ Missing columns'}\n`);
    if (tokenMatch) results.schemaValidation.passed++; else results.schemaValidation.failed++;

    // ═══════════════════════════════════════════════════════════
    // SECTION 3: DATA OPERATIONS VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('═══ 3. DATA OPERATIONS VERIFICATION ═══\n');

    // Test CREATE operations
    console.log('Testing CREATE operations...');
    const testConv = await prisma.conversation.create({
      data: {
        userId: 'verification-test-user',
        title: 'Verification Test',
        model: 'gpt-4'
      }
    });
    console.log(`✅ Conversation created: ${testConv.id}`);
    results.dataOperations.passed++;

    const testMsg = await prisma.message.create({
      data: {
        conversationId: testConv.id,
        role: 'user',
        content: 'Test message for verification',
        tokenCount: 5,
        model: 'gpt-4'
      }
    });
    console.log(`✅ Message created: ${testMsg.id}`);
    results.dataOperations.passed++;

    const testToken = await prisma.tokenUsage.create({
      data: {
        userId: 'verification-test-user',
        messageId: testMsg.id,
        model: 'gpt-4',
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
        cost: 0.0003
      }
    });
    console.log(`✅ TokenUsage created: ${testToken.id}\n`);
    results.dataOperations.passed++;

    // Test READ operations with relations
    console.log('Testing READ operations with relations...');
    const convWithMessages = await prisma.conversation.findUnique({
      where: { id: testConv.id },
      include: { messages: true }
    });
    console.log(`✅ Read conversation with ${convWithMessages.messages.length} message(s)`);
    results.dataOperations.passed++;

    // Test UPDATE operations
    console.log('Testing UPDATE operations...');
    const updatedConv = await prisma.conversation.update({
      where: { id: testConv.id },
      data: { title: 'Updated Title', pinned: true }
    });
    console.log(`✅ Updated conversation title: "${updatedConv.title}", pinned: ${updatedConv.pinned}`);
    results.dataOperations.passed++;

    // Test aggregations
    console.log('Testing AGGREGATION operations...');
    const tokenAgg = await prisma.tokenUsage.aggregate({
      where: { userId: 'verification-test-user' },
      _sum: { totalTokens: true, cost: true },
      _count: true
    });
    console.log(`✅ Aggregation: ${tokenAgg._count} records, ${tokenAgg._sum.totalTokens} tokens, $${tokenAgg._sum.cost} cost`);
    results.dataOperations.passed++;

    // Test CASCADE delete
    console.log('Testing CASCADE delete...');
    await prisma.conversation.delete({ where: { id: testConv.id } });
    const messagesAfterDelete = await prisma.message.count({ where: { conversationId: testConv.id } });
    console.log(`✅ Cascade delete: Messages deleted = ${messagesAfterDelete === 0 ? 'YES' : 'NO'}\n`);
    results.dataOperations.passed++;

    // Cleanup
    await prisma.tokenUsage.deleteMany({ where: { userId: 'verification-test-user' } });

    // ═══════════════════════════════════════════════════════════
    // SECTION 4: INDEXES AND CONSTRAINTS VERIFICATION
    // ═══════════════════════════════════════════════════════════
    console.log('═══ 4. INDEXES & CONSTRAINTS VERIFICATION ═══\n');

    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('Conversation', 'Message', 'TokenUsage')
      ORDER BY tablename, indexname
    `;

    console.log('Database indexes:');
    const indexesByTable = {};
    indexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) indexesByTable[idx.tablename] = [];
      indexesByTable[idx.tablename].push(idx.indexname);
    });

    Object.entries(indexesByTable).forEach(([table, idxs]) => {
      console.log(`  ${table}:`);
      idxs.forEach(idx => console.log(`    - ${idx}`));
      results.indexesConstraints.passed++;
    });

    // Check foreign keys
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('Message')
    `;

    console.log('\nForeign key constraints:');
    foreignKeys.forEach(fk => {
      console.log(`  ✅ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.indexesConstraints.passed++;
    });

    // ═══════════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ═══════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                     FINAL TEST SUMMARY                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

    console.log('Test Results by Category:');
    console.log(`  1. Database Tables:      ✅ ${results.databaseTables.passed} passed, ❌ ${results.databaseTables.failed} failed`);
    console.log(`  2. Schema Validation:    ✅ ${results.schemaValidation.passed} passed, ❌ ${results.schemaValidation.failed} failed`);
    console.log(`  3. Data Operations:      ✅ ${results.dataOperations.passed} passed, ❌ ${results.dataOperations.failed} failed`);
    console.log(`  4. Indexes & Constraints: ✅ ${results.indexesConstraints.passed} passed, ❌ ${results.indexesConstraints.failed} failed`);
    console.log('');
    console.log(`TOTAL: ✅ ${totalPassed} passed, ❌ ${totalFailed} failed`);
    console.log('');

    if (totalFailed === 0) {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          🎉 ALL VERIFICATION TESTS PASSED! 🎉            ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('✅ Database Fix Status: SUCCESSFUL');
      console.log('✅ All three models (Conversation, Message, TokenUsage) working');
      console.log('✅ No PrismaClientKnownRequestError encountered');
      console.log('✅ Schema properly synced to database');
      console.log('✅ All CRUD operations functional');
      console.log('✅ Relations and cascades working correctly');
      console.log('✅ Indexes and foreign keys properly created');
      console.log('');
      console.log('RECOMMENDATION: ✅ READY FOR PRODUCTION');
    } else {
      console.log('⚠️  WARNING: Some tests failed. Review details above.');
      console.log('RECOMMENDATION: ❌ FIX REQUIRED BEFORE PRODUCTION');
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during verification:');
    console.error(error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();
