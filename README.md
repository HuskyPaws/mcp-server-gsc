# GSC Web Dashboard

A modern web application for managing multiple Google Search Console accounts and analyzing search performance data. Built with Next.js, TypeScript, and deployed on Railway.

## Features

- 🔐 **Multi-Account Management**: Connect and manage multiple Google Search Console accounts
- 📊 **Advanced Analytics**: Enhanced search analytics with up to 25,000 rows of data
- 🚀 **Quick Wins Detection**: Automatically identify SEO optimization opportunities
- 🎯 **Smart Filtering**: Support for regex patterns and advanced filters
- 📱 **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS
- ☁️ **Cloud Deployed**: Hosted on Railway with PostgreSQL database

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Railway
- **APIs**: Google Search Console API, Google Webmasters API

## Quick Start

### Prerequisites

1. **Google Cloud Project** with Search Console API enabled
2. **OAuth 2.0 credentials** (Client ID and Secret)
3. **PostgreSQL database** (Railway provides this)

### Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
NEXTAUTH_URL="https://your-app.railway.app"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Search Console API**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-app.railway.app/api/auth/callback/google`
5. Add your service account email to Search Console properties as a user

### Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

1. Click "Deploy on Railway"
2. Connect your GitHub repository
3. Add environment variables
4. Deploy!

### Local Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

## Usage

### 1. Authentication
- Sign in with your Google account
- Grant Search Console permissions
- Your account will be automatically connected

### 2. Managing Accounts
- View all connected Google accounts
- Sync Search Console properties
- Monitor account status and permissions

### 3. Search Analytics
- Select any connected property
- Configure date ranges and dimensions
- Run advanced analytics queries
- Export results and identify quick wins

## API Endpoints

### Accounts
- `GET /api/accounts` - List all connected Google accounts
- `POST /api/accounts/{id}/sync` - Sync Search Console sites

### Sites
- `GET /api/sites` - List all accessible Search Console properties

### Analytics
- `GET /api/analytics/search` - Run search analytics queries

## Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `google_accounts` - Connected Google accounts with OAuth tokens
- `search_console_sites` - Search Console properties and permissions
- `analytics_queries` - Saved queries and schedules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Review the [Google Search Console API documentation](https://developers.google.com/webmaster-tools)
3. Contact support through the application

---

Built with ❤️ using Next.js and deployed on Railway