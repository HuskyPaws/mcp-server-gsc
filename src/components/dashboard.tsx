'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountManager } from '@/components/account-manager';
import { SearchAnalytics } from '@/components/search-analytics';

export function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                GSC Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session?.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name}
          </h2>
          <p className="text-gray-600">
            Manage your Google Search Console accounts and analyze your search performance data.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="accounts">Google Accounts</TabsTrigger>
            <TabsTrigger value="analytics">Search Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <AccountManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <SearchAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

