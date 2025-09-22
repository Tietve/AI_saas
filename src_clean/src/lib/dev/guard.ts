import { NextResponse } from 'next/server'

export function devOnly() {
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse(JSON.stringify({ code: 'FORBIDDEN', message: 'Dev-only route' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        })
    }
    return null
}
