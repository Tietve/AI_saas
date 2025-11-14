/**
 * Test script for Event Publisher
 *
 * Usage: npx ts-node shared/events/test-publisher.ts
 */

import { initEventPublisher, publishAnalyticsEvent, closeEventPublisher } from './publisher';
import { EventCategory, UserEventType, UserEvent } from './types';

async function testPublisher() {
  console.log('🧪 Testing Event Publisher...\n');

  try {
    // Step 1: Initialize publisher
    console.log('1️⃣ Initializing publisher...');
    initEventPublisher({
      rabbitmqUrl: 'amqp://admin:admin@localhost:5672',
      exchange: 'analytics.events',
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Publish test events
    console.log('\n2️⃣ Publishing test events...');

    const testEvents: UserEvent[] = [
      {
        event_type: UserEventType.SIGNUP,
        event_category: EventCategory.USER,
        service_name: 'test-script',
        user_id: 'test-user-001',
        user_email: 'test1@example.com',
        plan_tier: 'FREE',
        ip_address: '127.0.0.1',
        user_agent: 'Test Script',
      },
      {
        event_type: UserEventType.SIGNIN,
        event_category: EventCategory.USER,
        service_name: 'test-script',
        user_id: 'test-user-001',
        user_email: 'test1@example.com',
        plan_tier: 'FREE',
        ip_address: '127.0.0.1',
      },
      {
        event_type: UserEventType.EMAIL_VERIFIED,
        event_category: EventCategory.USER,
        service_name: 'test-script',
        user_id: 'test-user-001',
        user_email: 'test1@example.com',
        plan_tier: 'FREE',
      },
    ];

    for (const event of testEvents) {
      await publishAnalyticsEvent(event);
      console.log(`   ✅ Published: ${event.event_type}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n3️⃣ Events published successfully!');
    console.log('   Check:');
    console.log('   - RabbitMQ: http://localhost:15672/#/queues/%2F/analytics_events_queue');
    console.log('   - Analytics Service logs for batch insert');
    console.log('   - ClickHouse: SELECT * FROM events WHERE user_id = \'test-user-001\'');

    // Wait before closing
    console.log('\n⏳ Waiting 10 seconds for events to be processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 3: Close publisher
    console.log('\n4️⃣ Closing publisher...');
    await closeEventPublisher();

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testPublisher();
