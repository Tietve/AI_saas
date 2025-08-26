import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionCookie } from "@/lib/session";


export async function GET() {
    try {
        const jar = cookies();
        const token = jar.get("session")?.value;
        if (!token) return NextResponse.json({ authenticated: false }, { status: 200 });
        const payload = await verifySessionCookie(token);
        return NextResponse.json({ authenticated: true, user: payload }, { status: 200 });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }
}