#!/usr/bin/env node

/**
 * ClickHouse Database Migration Script
 *
 * Runs all SQL schema files in order to setup analytics database
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// ClickHouse connection config
const CLICKHOUSE_CONFIG = {
  host: process.env.CLICKHOUSE_HOST || 'localhost',
  port: process.env.CLICKHOUSE_PORT || 8123,
  user: process.env.CLICKHOUSE_USER || 'analytics',
  password: process.env.CLICKHOUSE_PASSWORD || 'analytics_password',
  database: process.env.CLICKHOUSE_DB || 'analytics_db',
};

/**
 * Execute SQL query against ClickHouse
 */
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = `http://${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port}`;
    const auth = `${CLICKHOUSE_CONFIG.user}:${CLICKHOUSE_CONFIG.password}`;
    const encodedAuth = Buffer.from(auth).toString('base64');

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'text/plain',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(sql);
    req.end();
  });
}

/**
 * Split SQL file into individual statements
 */
function splitSQL(sql) {
  // Remove comments
  const cleanSQL = sql
    .replace(/--[^\n]*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Split by semicolons, filter empty statements
  return cleanSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Run migration files
 */
async function runMigrations() {
  console.log('🚀 Starting ClickHouse Database Migration...\n');

  const schemaDir = path.join(__dirname, 'schema');
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`📂 Found ${files.length} migration files:\n`);

  for (const file of files) {
    const filePath = path.join(schemaDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`📄 Running: ${file}`);

    // Split into individual statements
    const statements = splitSQL(sql);
    console.log(`   Found ${statements.length} statements`);

    for (let i = 0; i < statements.length; i++) {
      try {
        await executeSQL(statements[i]);
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        console.error(`   ❌ Statement ${i + 1} failed: ${error.message}\n`);
        throw error;
      }
    }

    console.log(`   ✅ File completed\n`);
  }

  console.log('✅ All migrations completed successfully!');
}

/**
 * Verify tables were created
 */
async function verifySchema() {
  console.log('\n🔍 Verifying schema...\n');

  const queries = [
    'SHOW TABLES FROM analytics_db',
    'SELECT count() FROM analytics_db.events',
  ];

  for (const query of queries) {
    try {
      const result = await executeSQL(query);
      console.log(`✅ ${query}`);
      if (result.trim()) {
        console.log(`   ${result.trim()}\n`);
      }
    } catch (error) {
      console.error(`❌ ${query}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await runMigrations();
    await verifySchema();

    console.log('\n✨ Database setup complete!\n');
    console.log('📊 Tables created:');
    console.log('   - analytics_db.events (main events table)');
    console.log('   - analytics_db.user_metrics (materialized view)');
    console.log('   - analytics_db.daily_active_users (materialized view)');
    console.log('   - analytics_db.user_retention (materialized view)');
    console.log('   - analytics_db.chat_statistics (materialized view)');
    console.log('   - analytics_db.chat_metrics_hourly (materialized view)');
    console.log('   - analytics_db.provider_usage (materialized view)');
    console.log('   - analytics_db.revenue_analytics (materialized view)');
    console.log('   - analytics_db.mrr_metrics (materialized view)');
    console.log('   - analytics_db.revenue_by_country (materialized view)');
    console.log('   - analytics_db.churn_metrics (materialized view)');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { executeSQL, runMigrations, verifySchema };
