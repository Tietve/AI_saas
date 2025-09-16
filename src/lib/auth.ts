import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export function requireUserId(): string {
    const cookieStore = cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) throw new Error('UNAUTHENTICATED');

    const decoded = jwt.verify(session, process.env.AUTH_SECRET!) as { uid: string };
    return decoded.uid;
}
