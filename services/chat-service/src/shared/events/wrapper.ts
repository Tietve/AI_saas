/**
 * EventPublisher wrapper with getInstance pattern for consistency
 */
import { initEventPublisher, publishAnalyticsEvent } from './publisher';
import { UserEvent, ChatEvent, BillingEvent } from './types';

export class EventPublisher {
  private static instance: EventPublisher;
  private initialized = false;

  private constructor() {}

  static getInstance(): EventPublisher {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher();
    }
    return EventPublisher.instance;
  }

  async initialize(rabbitmqUrl: string, exchange: string): Promise<void> {
    if (this.initialized) {
      return;
    }
    initEventPublisher({ rabbitmqUrl, exchange });
    this.initialized = true;
  }

  async publishUserEvent(event: Partial<UserEvent>): Promise<void> {
    await publishAnalyticsEvent({
      event_category: 'user',
      ...event
    } as any);
  }

  async publishChatEvent(event: Partial<ChatEvent>): Promise<void> {
    await publishAnalyticsEvent({
      event_category: 'chat',
      ...event
    } as any);
  }

  async publishBillingEvent(event: Partial<BillingEvent>): Promise<void> {
    await publishAnalyticsEvent({
      event_category: 'billing',
      ...event
    } as any);
  }
}
