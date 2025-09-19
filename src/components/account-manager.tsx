'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface GoogleAccount {
  id: string;
  accountEmail: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
  sites: SearchConsoleSite[];
}

interface SearchConsoleSite {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  verified: boolean;
  lastSynced: string | null;
}

export function AccountManager() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncSites = async (accountId: string) => {
    setIsSyncing(accountId);
    try {
      const response = await fetch(`/api/accounts/${accountId}/sync`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Error syncing sites:', error);
    } finally {
      setIsSyncing(null);
    }
  };

  const addNewAccount = async () => {
    // Trigger Google OAuth flow for additional account
    window.location.href = '/api/auth/signin/google?callbackUrl=/';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-2">Loading accounts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Google Accounts</h3>
          <p className="text-sm text-gray-600">
            Manage your connected Google Search Console accounts
          </p>
        </div>
        <Button onClick={addNewAccount}>
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              No Google accounts connected yet. Add your first account to get started.
            </p>
            <Button onClick={addNewAccount}>
              Connect Google Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.accountName}</CardTitle>
                    <CardDescription>{account.accountEmail}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={account.isActive ? 'default' : 'secondary'}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncSites(account.id)}
                      disabled={isSyncing === account.id}
                    >
                      {isSyncing === account.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                          Syncing...
                        </>
                      ) : (
                        'Sync Sites'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-medium mb-2">Search Console Sites</h4>
                  {account.sites.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No sites found. Click "Sync Sites" to fetch your Search Console properties.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {account.sites.map((site) => (
                        <div
                          key={site.id}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-sm">{site.siteUrl}</p>
                            <p className="text-xs text-gray-600">
                              {site.permissionLevel} • {site.verified ? 'Verified' : 'Not verified'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            Last synced: {formatDate(site.lastSynced)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Connected: {formatDate(account.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

