import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, googleAccounts, searchConsoleSites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get accounts with their sites
    const accounts = await db.select({
      id: googleAccounts.id,
      accountEmail: googleAccounts.accountEmail,
      accountName: googleAccounts.accountName,
      isActive: googleAccounts.isActive,
      createdAt: googleAccounts.createdAt,
    })
    .from(googleAccounts)
    .where(eq(googleAccounts.userId, user[0].id));

    // Get sites for each account
    const accountsWithSites = await Promise.all(
      accounts.map(async (account) => {
        const sites = await db.select()
          .from(searchConsoleSites)
          .where(eq(searchConsoleSites.googleAccountId, account.id));

        return {
          ...account,
          sites,
        };
      })
    );

    return NextResponse.json(accountsWithSites);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
