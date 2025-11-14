/**
 * FREE Alerting System with Discord/Telegram Webhooks
 *
 * Usage:
 * 1. Create Discord webhook: Server Settings → Integrations → Webhooks
 * 2. OR create Telegram bot: @BotFather → /newbot
 * 3. Set DISCORD_WEBHOOK_URL or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env
 * 4. Call sendAlert() from anywhere in your code
 *
 * Cost: $0 (completely free!)
 */

import { logger } from '@/lib/logger'

export interface AlertOptions {
  title: string
  message: string
  level?: 'info' | 'warning' | 'error' | 'critical'
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * Send alert to Discord webhook
 */
async function sendDiscordAlert(options: AlertOptions): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  const color = {
    info: 0x3498db, // Blue
    warning: 0xf39c12, // Orange
    error: 0xe74c3c, // Red
    critical: 0x8b0000, // Dark red
  }[options.level || 'info']

  const embed = {
    title: options.title,
    description: options.message,
    color,
    fields: options.metadata
      ? Object.entries(options.metadata).map(([key, value]) => ({
          name: key,
          value: String(value),
          inline: true,
        }))
      : [],
    footer: {
      text: `${options.level?.toUpperCase() || 'INFO'} | ${new Date().toISOString()}`,
    },
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!response.ok) {
      logger.error({ status: response.status }, 'Failed to send Discord alert')
    }
  } catch (error) {
    logger.error({ err: error }, 'Discord webhook error')
  }
}

/**
 * Send alert to Telegram
 */
async function sendTelegramAlert(options: AlertOptions): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return

  const emoji = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  }[options.level || 'info']

  let message = `${emoji} *${options.title}*\n\n${options.message}`

  if (options.metadata) {
    message += '\n\n*Details:*\n'
    for (const [key, value] of Object.entries(options.metadata)) {
      message += `• ${key}: \`${value}\`\n`
    }
  }

  if (options.tags) {
    message += `\n🏷️ ${options.tags.map((t) => `#${t}`).join(' ')}`
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    )

    if (!response.ok) {
      logger.error({ status: response.status }, 'Failed to send Telegram alert')
    }
  } catch (error) {
    logger.error({ err: error }, 'Telegram webhook error')
  }
}

/**
 * Send alert to all configured channels
 */
export async function sendAlert(options: AlertOptions): Promise<void> {
  logger.info({ alert: options }, 'Sending alert')

  await Promise.all([sendDiscordAlert(options), sendTelegramAlert(options)])
}

/**
 * Example alerts for monitoring
 */
export const AlertTemplates = {
  errorRateHigh: (rate: number) => ({
    title: '🚨 High Error Rate Detected',
    message: `Error rate is at ${rate.toFixed(2)}% which exceeds the threshold of 5%`,
    level: 'critical' as const,
    tags: ['errors', 'performance'],
    metadata: {
      errorRate: `${rate.toFixed(2)}%`,
      threshold: '5%',
    },
  }),

  slowResponse: (endpoint: string, time: number) => ({
    title: '⚠️ Slow API Response',
    message: `Endpoint ${endpoint} took ${time}ms to respond`,
    level: 'warning' as const,
    tags: ['performance', 'api'],
    metadata: {
      endpoint,
      responseTime: `${time}ms`,
      threshold: '2000ms',
    },
  }),

  databaseDown: () => ({
    title: '🚨 DATABASE CONNECTION FAILED',
    message: 'Cannot connect to PostgreSQL database. System may be down!',
    level: 'critical' as const,
    tags: ['database', 'critical'],
  }),

  paymentFailed: (userId: string, amount: number, error: string) => ({
    title: '❌ Payment Failed',
    message: `Payment processing failed for user ${userId}`,
    level: 'error' as const,
    tags: ['payment', 'billing'],
    metadata: {
      userId,
      amount: `${amount} VND`,
      error,
    },
  }),

  newSignup: (email: string) => ({
    title: '🎉 New User Signup',
    message: `New user registered: ${email}`,
    level: 'info' as const,
    tags: ['signup', 'growth'],
  }),
}
