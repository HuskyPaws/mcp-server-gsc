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

    // Get all sites for the user's accounts
    const sites = await db.select({
      id: searchConsoleSites.id,
      siteUrl: searchConsoleSites.siteUrl,
      permissionLevel: searchConsoleSites.permissionLevel,
      verified: searchConsoleSites.verified,
      accountEmail: googleAccounts.accountEmail,
      googleAccountId: googleAccounts.id,
    })
    .from(searchConsoleSites)
    .innerJoin(googleAccounts, eq(searchConsoleSites.googleAccountId, googleAccounts.id))
    .where(eq(googleAccounts.userId, user[0].id));

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

