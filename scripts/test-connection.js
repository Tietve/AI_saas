// scripts/test-connection.js
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    console.log('🔍 Testing PostgreSQL Connection...\n');

    // Hiển thị connection string (ẩn password cho security)
    const connectionString = process.env.DATABASE_URL;
    const maskedUrl = connectionString?.replace(/:([^@]+)@/, ':***@') || 'Not configured';
    console.log('📝 Connection String:', maskedUrl);

    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // Test 1: Kết nối cơ bản
        console.log('\n1️⃣ Testing basic connection...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Test 2: Kiểm tra thông tin connection
        console.log('\n2️⃣ Connection details:');
        const userResult = await client.query('SELECT current_user, current_database()');
        console.log('   User:', userResult.rows[0].current_user);
        console.log('   Database:', userResult.rows[0].current_database);

        // Test 3: Kiểm tra quyền tạo bảng
        console.log('\n3️⃣ Testing permissions...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_connection (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Can create tables');

        // Test 4: Test insert và select
        await client.query('INSERT INTO test_connection DEFAULT VALUES');
        const testResult = await client.query('SELECT COUNT(*) FROM test_connection');
        console.log('✅ Can insert and query data');

        // Clean up test table
        await client.query('DROP TABLE test_connection');
        console.log('✅ Cleanup successful');

        // Test 5: Kiểm tra các tables của Prisma
        console.log('\n4️⃣ Checking Prisma tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        if (tablesResult.rows.length > 0) {
            console.log('📊 Existing tables:');
            tablesResult.rows.forEach(row => {
                console.log('   -', row.table_name);
            });
        } else {
            console.log('⚠️  No tables found. You need to run: npx prisma db push');
        }

        console.log('\n✨ All tests passed! Database is ready.');

    } catch (error) {
        console.error('\n❌ Connection test failed!');
        console.error('Error:', error.message);

        // Cung cấp hướng dẫn cụ thể dựa trên lỗi
        if (error.message.includes('password authentication failed')) {
            console.error('\n🔧 Fix: Check username and password in DATABASE_URL');
        } else if (error.message.includes('database') && error.message.includes('does not exist')) {
            console.error('\n🔧 Fix: Create the database first:');
            console.error('   psql -U mysaas -h localhost -c "CREATE DATABASE \\"my-saas-chat\\""');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('\n🔧 Fix: PostgreSQL service is not running. Start it from Services.');
        }

        process.exit(1);
    } finally {
        await client.end();
    }
}

// Chạy test
testConnection().catch(console.error);