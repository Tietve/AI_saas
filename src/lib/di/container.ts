/**
 * Dependency Injection Container
 *
 * Centralizes all service registrations for dependency injection.
 * Uses tsyringe for automatic constructor injection.
 *
 * Benefits:
 * - Testability: Easy to mock dependencies in tests
 * - Loose coupling: Services don't know about concrete implementations
 * - Single responsibility: Each service has one job
 * - Maintainability: Easy to swap implementations
 *
 * Usage:
 *   import { container } from '@/lib/di/container'
 *   const chatService = container.resolve(ChatService)
 */

import 'reflect-metadata'
import { container } from 'tsyringe'

// Repositories
import { UserRepository } from '@/repositories/user.repository'
import { ConversationRepository } from '@/repositories/conversation.repository'
import { MessageRepository } from '@/repositories/message.repository'
import { SubscriptionRepository } from '@/repositories/subscription.repository'
import { TokenUsageRepository } from '@/repositories/token-usage.repository'
import { ProviderMetricsRepository } from '@/repositories/provider-metrics.repository'

// Services
import { ChatService } from '@/services/chat.service'
import { AuthService } from '@/services/auth.service'
import { QuotaService } from '@/services/quota.service'
import { EmailService } from '@/services/email.service'
import { MetricsService } from '@/services/metrics.service'

// Controllers
import { ChatController } from '@/controllers/chat.controller'
import { AuthController } from '@/controllers/auth.controller'

// Providers
import { MultiProviderGateway } from '@/lib/ai-providers/multi-provider-gateway'

/**
 * Initialize DI container with all dependencies
 *
 * Call this once at application startup
 */
export function initializeDependencyInjection() {
  // Register repositories as singletons
  container.registerSingleton(UserRepository)
  container.registerSingleton(ConversationRepository)
  container.registerSingleton(MessageRepository)
  container.registerSingleton(SubscriptionRepository)
  container.registerSingleton(TokenUsageRepository)
  container.registerSingleton(ProviderMetricsRepository)

  // Register services as singletons
  container.registerSingleton(QuotaService)
  container.registerSingleton(EmailService)
  container.registerSingleton(ChatService)
  container.registerSingleton(AuthService)
  container.registerSingleton(MetricsService)

  // Register controllers (can be transient as they're created per request)
  container.register(ChatController, { useClass: ChatController })
  container.register(AuthController, { useClass: AuthController })

  // Register AI Gateway as singleton
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (openaiKey || anthropicKey) {
    // Resolve MetricsService to inject into gateway
    const metricsService = container.resolve(MetricsService)

    const gateway = new MultiProviderGateway({
      openai: openaiKey,
      claude: anthropicKey,
      enableSemanticCache: true,
      metricsService,
    })

    container.registerInstance(MultiProviderGateway, gateway)
  }

  console.log('✅ Dependency injection container initialized')
}

/**
 * Export configured container
 */
export { container }

/**
 * Helper to resolve dependencies
 */
export function resolve<T>(token: any): T {
  return container.resolve<T>(token)
}
