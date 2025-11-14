const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIndexes() {
  console.log('=== DATABASE INDEXES VERIFICATION ===\n');

  try {
    const indexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('Conversation', 'Message', 'TokenUsage')
      ORDER BY tablename, indexname
    `;

    console.log('Indexes found:\n');
    indexes.forEach(idx => {
      console.log(`Table: ${idx.tablename}`);
      console.log(`  Index: ${idx.indexname}`);
      console.log(`  Definition: ${idx.indexdef}`);
      console.log('');
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
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('Conversation', 'Message', 'TokenUsage')
    `;

    console.log('=== FOREIGN KEYS ===\n');
    foreignKeys.forEach(fk => {
      console.log(`${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // Check constraints
    console.log('\n=== TABLE CONSTRAINTS ===\n');
    const constraints = await prisma.$queryRaw`
      SELECT
        conname as constraint_name,
        conrelid::regclass as table_name,
        contype as constraint_type
      FROM pg_constraint
      WHERE conrelid IN ('Conversation'::regclass, 'Message'::regclass, 'TokenUsage'::regclass)
      ORDER BY table_name, constraint_name
    `;

    constraints.forEach(c => {
      const type = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'c': 'CHECK',
        'u': 'UNIQUE'
      }[c.constraint_type] || c.constraint_type;
      console.log(`${c.table_name}: ${c.constraint_name} (${type})`);
    });

    console.log('\n✅ Index verification complete!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIndexes();
