// Re-export for convenience
export * from './types';
export { initEventPublisher, publishAnalyticsEvent, closeEventPublisher } from './publisher';
// Export wrapper as EventPublisher for singleton pattern
export { EventPublisher } from './wrapper';
