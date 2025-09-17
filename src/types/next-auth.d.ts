import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        name?: string | null;
    }

    interface Session {
        user: {
            id: string;
        } & DefaultSession['user'];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userId: string;
    }
}