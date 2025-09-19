import { google, searchconsole_v1, webmasters_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface SearchConsoleCredentials {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export class GoogleSearchConsoleService {
  private oauth2Client: OAuth2Client;

  constructor(credentials: SearchConsoleCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    this.oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
  }

  private async getWebmasters() {
    return google.webmasters({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  private async getSearchConsole() {
    return google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client,
    });
  }

  async refreshTokenIfNeeded() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }

  async listSites() {
    const webmasters = await this.getWebmasters();
    const response = await webmasters.sites.list();
    return response.data;
  }

  async searchAnalytics(
    siteUrl: string,
    requestBody: webmasters_v3.Params$Resource$Searchanalytics$Query['requestBody']
  ) {
    const webmasters = await this.getWebmasters();
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody,
    });
    return response.data;
  }

  async enhancedSearchAnalytics(
    siteUrl: string,
    requestBody: webmasters_v3.Params$Resource$Searchanalytics$Query['requestBody'],
    options: {
      regexFilter?: string;
      enableQuickWins?: boolean;
      quickWinsThresholds?: {
        minImpressions?: number;
        maxCtr?: number;
        positionRangeMin?: number;
        positionRangeMax?: number;
      };
    } = {}
  ) {
    // Apply regex filter if provided
    if (options.regexFilter && requestBody?.dimensions?.includes('query')) {
      requestBody.dimensionFilterGroups = [
        ...(requestBody.dimensionFilterGroups || []),
        {
          groupType: 'and',
          filters: [{
            dimension: 'query',
            operator: 'includingRegex',
            expression: options.regexFilter
          }]
        }
      ];
    }

    const result = await this.searchAnalytics(siteUrl, requestBody);

    // Apply quick wins detection if enabled
    if (options.enableQuickWins && result.rows) {
      const quickWins = this.detectQuickWins(result.rows, options.quickWinsThresholds);
      return {
        ...result,
        quickWins,
        enhancedFeatures: {
          regexFilterApplied: !!options.regexFilter,
          quickWinsEnabled: true,
          rowLimit: requestBody?.rowLimit || 1000
        }
      };
    }

    return result;
  }

  private detectQuickWins(
    rows: any[],
    thresholds: {
      minImpressions?: number;
      maxCtr?: number;
      positionRangeMin?: number;
      positionRangeMax?: number;
    } = {}
  ) {
    const {
      minImpressions = 50,
      maxCtr = 2.0,
      positionRangeMin = 4,
      positionRangeMax = 10
    } = thresholds;

    return rows
      .filter(row => {
        const impressions = row.impressions || 0;
        const ctr = (row.ctr || 0) * 100;
        const position = row.position || 0;

        return impressions >= minImpressions &&
               ctr <= maxCtr &&
               position >= positionRangeMin &&
               position <= positionRangeMax;
      })
      .map(row => {
        const impressions = row.impressions || 0;
        const currentClicks = row.clicks || 0;
        const currentCtr = (row.ctr || 0) * 100;
        const position = row.position || 0;

        const targetCtr = 5.0;
        const potentialClicks = Math.round((impressions * targetCtr) / 100);
        const additionalClicks = Math.max(0, potentialClicks - currentClicks);

        return {
          query: row.keys?.[0] || 'N/A',
          page: row.keys?.[1] || 'N/A',
          currentPosition: Number(position.toFixed(1)),
          impressions,
          currentClicks,
          currentCtr: Number(currentCtr.toFixed(2)),
          potentialClicks,
          additionalClicks,
          opportunity: additionalClicks > 0 ? 'High' : 'Low',
          optimizationNote: `Move from position ${position.toFixed(1)} to improve CTR`
        };
      })
      .sort((a, b) => b.additionalClicks - a.additionalClicks);
  }

  async indexInspect(siteUrl: string, inspectionUrl: string, languageCode = 'en-US') {
    const searchConsole = await this.getSearchConsole();
    const response = await searchConsole.urlInspection.index.inspect({
      requestBody: {
        siteUrl,
        inspectionUrl,
        languageCode,
      },
    });
    return response.data;
  }

  async listSitemaps(siteUrl: string, sitemapIndex?: string) {
    const webmasters = await this.getWebmasters();
    const response = await webmasters.sitemaps.list({
      siteUrl,
      sitemapIndex,
    });
    return response.data;
  }

  async getSitemap(siteUrl: string, feedpath: string) {
    const webmasters = await this.getWebmasters();
    const response = await webmasters.sitemaps.get({
      siteUrl,
      feedpath,
    });
    return response.data;
  }

  async submitSitemap(siteUrl: string, feedpath: string) {
    const webmasters = await this.getWebmasters();
    const response = await webmasters.sitemaps.submit({
      siteUrl,
      feedpath,
    });
    return response.data;
  }
}

