import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const googleAccounts = pgTable('google_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountEmail: text('account_email').notNull(),
  accountName: text('account_name'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiry: timestamp('token_expiry'),
  scopes: jsonb('scopes').$type<string[]>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const searchConsoleSites = pgTable('search_console_sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleAccountId: uuid('google_account_id').references(() => googleAccounts.id, { onDelete: 'cascade' }).notNull(),
  siteUrl: text('site_url').notNull(),
  permissionLevel: text('permission_level').notNull(), // 'siteOwner', 'siteFullUser', 'siteRestrictedUser'
  verified: boolean('verified').default(false).notNull(),
  lastSynced: timestamp('last_synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const analyticsQueries = pgTable('analytics_queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  siteId: uuid('site_id').references(() => searchConsoleSites.id, { onDelete: 'cascade' }).notNull(),
  queryName: text('query_name').notNull(),
  queryParams: jsonb('query_params').notNull(),
  lastExecuted: timestamp('last_executed'),
  isScheduled: boolean('is_scheduled').default(false).notNull(),
  scheduleInterval: text('schedule_interval'), // 'daily', 'weekly', 'monthly'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GoogleAccount = typeof googleAccounts.$inferSelect;
export type NewGoogleAccount = typeof googleAccounts.$inferInsert;

export type SearchConsoleSite = typeof searchConsoleSites.$inferSelect;
export type NewSearchConsoleSite = typeof searchConsoleSites.$inferInsert;

export type AnalyticsQuery = typeof analyticsQueries.$inferSelect;
export type NewAnalyticsQuery = typeof analyticsQueries.$inferInsert;

