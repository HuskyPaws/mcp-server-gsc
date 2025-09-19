import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, googleAccounts, searchConsoleSites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { GoogleSearchConsoleService } from '@/lib/google-search-console';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dimensions = searchParams.get('dimensions') || 'query,page';
    const rowLimit = parseInt(searchParams.get('rowLimit') || '1000');
    const enableQuickWins = searchParams.get('enableQuickWins') === 'true';

    if (!siteId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: siteId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get site and associated Google account
    const siteWithAccount = await db.select({
      site: searchConsoleSites,
      account: googleAccounts,
    })
    .from(searchConsoleSites)
    .innerJoin(googleAccounts, eq(searchConsoleSites.googleAccountId, googleAccounts.id))
    .where(
      and(
        eq(searchConsoleSites.id, siteId),
        eq(googleAccounts.userId, user[0].id)
      )
    )
    .limit(1);

    if (siteWithAccount.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { site, account } = siteWithAccount[0];

    // Create Google Search Console service
    const gscService = new GoogleSearchConsoleService({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });

    try {
      // Refresh token if needed
      await gscService.refreshTokenIfNeeded();

      // Build request body
      const requestBody = {
        startDate,
        endDate,
        dimensions: dimensions.split(','),
        rowLimit: Math.min(rowLimit, 25000), // Cap at 25k
      };

      // Call the appropriate analytics method
      const analyticsData = enableQuickWins
        ? await gscService.enhancedSearchAnalytics(site.siteUrl, requestBody, {
            enableQuickWins: true,
          })
        : await gscService.searchAnalytics(site.siteUrl, requestBody);

      return NextResponse.json(analyticsData);
    } catch (gscError) {
      console.error('Google Search Console API error:', gscError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data from Google Search Console' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
