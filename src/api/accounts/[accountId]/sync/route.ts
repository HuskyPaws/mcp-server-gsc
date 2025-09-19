import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, googleAccounts, searchConsoleSites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
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

    // Get the Google account
    const account = await db.select()
      .from(googleAccounts)
      .where(
        and(
          eq(googleAccounts.id, params.accountId),
          eq(googleAccounts.userId, user[0].id)
        )
      )
      .limit(1);

    if (account.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const googleAccount = account[0];

    // Create Google Search Console service
    const gscService = new GoogleSearchConsoleService({
      accessToken: googleAccount.accessToken,
      refreshToken: googleAccount.refreshToken,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });

    try {
      // Refresh token if needed
      await gscService.refreshTokenIfNeeded();

      // Fetch sites from Google Search Console
      const sitesData = await gscService.listSites();

      if (sitesData.siteEntry) {
        // Delete existing sites for this account
        await db.delete(searchConsoleSites)
          .where(eq(searchConsoleSites.googleAccountId, googleAccount.id));

        // Insert new sites
        const sitesToInsert = sitesData.siteEntry.map((site) => ({
          googleAccountId: googleAccount.id,
          siteUrl: site.siteUrl || '',
          permissionLevel: site.permissionLevel || 'unknown',
          verified: true, // If it's in the list, it's accessible
          lastSynced: new Date(),
        }));

        if (sitesToInsert.length > 0) {
          await db.insert(searchConsoleSites).values(sitesToInsert);
        }
      }

      return NextResponse.json({ success: true, message: 'Sites synced successfully' });
    } catch (gscError) {
      console.error('Google Search Console API error:', gscError);
      return NextResponse.json(
        { error: 'Failed to sync sites from Google Search Console' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
