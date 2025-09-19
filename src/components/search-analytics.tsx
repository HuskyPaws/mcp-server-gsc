'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface Site {
  id: string;
  siteUrl: string;
  accountEmail: string;
}

interface AnalyticsData {
  rows: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType: string;
}

export function SearchAnalytics() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-31');
  const [dimensions, setDimensions] = useState('query,page');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);
      if (data.length > 0) {
        setSelectedSite(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const runAnalytics = async () => {
    if (!selectedSite) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        siteId: selectedSite,
        startDate,
        endDate,
        dimensions,
      });

      const response = await fetch(`/api/analytics/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Analytics</CardTitle>
          <CardDescription>
            Analyze your Google Search Console performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="site">Site</Label>
              <select
                id="site"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteUrl} ({site.accountEmail})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="query,page"
              />
            </div>
          </div>

          <Button
            onClick={runAnalytics}
            disabled={!selectedSite || isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Running Analytics...
              </>
            ) : (
              'Run Analytics'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {analyticsData && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Search performance data for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.rows && analyticsData.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {dimensions.split(',').map((dim) => (
                        <th key={dim} className="border border-gray-300 p-2 text-left">
                          {dim.charAt(0).toUpperCase() + dim.slice(1)}
                        </th>
                      ))}
                      <th className="border border-gray-300 p-2 text-right">Clicks</th>
                      <th className="border border-gray-300 p-2 text-right">Impressions</th>
                      <th className="border border-gray-300 p-2 text-right">CTR</th>
                      <th className="border border-gray-300 p-2 text-right">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.rows.slice(0, 100).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {row.keys.map((key, keyIndex) => (
                          <td key={keyIndex} className="border border-gray-300 p-2">
                            {key}
                          </td>
                        ))}
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(row.clicks)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatNumber(row.impressions)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatPercentage(row.ctr)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {row.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analyticsData.rows.length > 100 && (
                  <p className="mt-4 text-sm text-gray-600">
                    Showing first 100 rows of {analyticsData.rows.length} total results.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No data available for the selected criteria.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

