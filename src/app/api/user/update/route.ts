import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import argon2 from 'argon2'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'


// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs'
// Validation schemas
const profileUpdateSchema = z.object({
    type: z.literal('profile'),
    email: z.string().email().optional(),
    name: z.string().min(1).max(100).optional()
})

const passwordUpdateSchema = z.object({
    type: z.literal('password'),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100)
})

const preferencesUpdateSchema = z.object({
    type: z.literal('preferences'),
    theme: z.string().optional(),
    defaultModel: z.string().optional()
})

const updateSchema = z.discriminatedUnion('type', [
    profileUpdateSchema,
    passwordUpdateSchema,
    preferencesUpdateSchema
])

export async function PATCH(request: NextRequest) {
    try {
        // 1. Verify authentication
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('session')

        if (!sessionCookie?.value) {
            return NextResponse.json(
                { code: 'UNAUTHORIZED', message: 'Not authenticated' },
                { status: 401 }
            )
        }

        const payload = await verifySession(sessionCookie.value)

        const userId = String(payload.uid || payload.sub || payload.userId)

        // 2. Parse and validate request body
        const body = await request.json()
        const validatedData = updateSchema.parse(body)

        // 3. Handle different update types
        switch (validatedData.type) {
            case 'profile': {
                const { email, name } = validatedData

                // Check if email is already taken by another user
                if (email) {
                    const existingUser = await prisma.user.findFirst({
                        where: {
                            emailLower: email.toLowerCase(),
                            id: { not: userId }
                        }
                    })

                    if (existingUser) {
                        return NextResponse.json(
                            { code: 'EMAIL_TAKEN', message: 'Email already in use' },
                            { status: 400 }
                        )
                    }
                }

                // Update user profile
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        ...(email && { email, emailLower: email.toLowerCase() }),
                        ...(name !== undefined && { name })
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Profile updated successfully'
                })
            }

            case 'password': {
                const { currentPassword, newPassword } = validatedData

                // Get user with password hash
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { passwordHash: true }
                })

                if (!user) {
                    return NextResponse.json(
                        { code: 'USER_NOT_FOUND', message: 'User not found' },
                        { status: 404 }
                    )
                }

                // Verify current password
                const isValid = await argon2.verify(user.passwordHash, currentPassword)
                if (!isValid) {
                    return NextResponse.json(
                        { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
                        { status: 400 }
                    )
                }

                // Hash new password
                const newPasswordHash = await argon2.hash(newPassword)

                // Update password
                await prisma.user.update({
                    where: { id: userId },
                    data: { passwordHash: newPasswordHash }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Password changed successfully'
                })
            }

            case 'preferences': {
                const { theme, defaultModel } = validatedData

                // Upsert user settings
                await prisma.userSetting.upsert({
                    where: { userId },
                    create: {
                        userId,
                        theme,
                        defaultModel
                    },
                    update: {
                        ...(theme && { theme }),
                        ...(defaultModel && { defaultModel })
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Preferences saved successfully'
                })
            }

            default:
                return NextResponse.json(
                    { code: 'INVALID_TYPE', message: 'Invalid update type' },
                    { status: 400 }
                )
        }
    } catch (error: any) {
        console.error('[User Update] Error:', error)

        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    errors: error.errors
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Failed to update user data' },
            { status: 500 }
        )
    }
}
