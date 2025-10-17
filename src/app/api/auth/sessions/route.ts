/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: List active sessions
 *     description: Get list of all active sessions for the current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved
 *       401:
 *         description: Not authenticated
 *
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Revoke all sessions
 *     description: Logout from all devices (revoke all sessions)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *       401:
 *         description: Not authenticated
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import {
  getUserActiveSessions,
  getUserSessionCount,
  revokeAllUserSessions,
} from '@/lib/auth/session-revocation'
import { logger } from '@/lib/logger'
import { sendAlert } from '@/lib/alerting/webhook'

export const runtime = 'nodejs'

/**
 * GET - List active sessions
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const sessionIds = await getUserActiveSessions(session.userId as string)
    const count = await getUserSessionCount(session.userId as string)

    return NextResponse.json({
      ok: true,
      count,
      sessions: sessionIds,
      currentSession: session.userId || '',
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to list sessions')
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revoke all sessions (logout from all devices)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const revokedCount = await revokeAllUserSessions(session.userId as string)

    // Send alert
    await sendAlert({
      title: '🔒 All Sessions Revoked',
      message: `User logged out from all devices`,
      level: 'info',
      tags: ['security', 'sessions'],
      metadata: {
        userId: session.userId || '',
        email: session.email || '',
        revokedCount: String(revokedCount),
      },
    })

    logger.info(
      { userId: session.userId || '', revokedCount },
      'All sessions revoked by user'
    )

    // Clear session cookie
    const response = NextResponse.json({
      ok: true,
      message: 'Logged out from all devices',
      revokedCount,
    })

    response.cookies.delete('session')

    return response
  } catch (error) {
    logger.error({ err: error }, 'Failed to revoke sessions')
    return NextResponse.json(
      { error: 'Failed to revoke sessions' },
      { status: 500 }
    )
  }
}
