import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users, googleAccounts } from './db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/webmasters',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session.user?.email) {
        // Get user from database
        const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
        if (dbUser.length > 0) {
          session.user.id = dbUser[0].id;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && account.access_token && account.refresh_token) {
        try {
          // Check if user exists
          const existingUser = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
          
          if (existingUser.length > 0) {
            // Update or create Google account record
            const existingAccount = await db.select()
              .from(googleAccounts)
              .where(eq(googleAccounts.userId, existingUser[0].id))
              .limit(1);

            if (existingAccount.length > 0) {
              // Update existing account
              await db.update(googleAccounts)
                .set({
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  updatedAt: new Date(),
                })
                .where(eq(googleAccounts.id, existingAccount[0].id));
            } else {
              // Create new Google account record
              await db.insert(googleAccounts).values({
                userId: existingUser[0].id,
                accountEmail: user.email!,
                accountName: user.name || '',
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                scopes: account.scope?.split(' ') || [],
              });
            }
          }
        } catch (error) {
          console.error('Error saving Google account:', error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

