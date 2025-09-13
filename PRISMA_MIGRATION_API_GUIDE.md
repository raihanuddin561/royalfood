# Prisma Migration API for Production Deployment

This document explains how to use the Prisma migration API endpoint for managing database schema changes after deployment to Vercel or other production environments.

## API Endpoint

**Base URL**: `/api/admin/prisma-migrate`

## Authentication

The endpoint uses the existing admin authentication system from `@/lib/api-protection`. Additional security can be added with the `MIGRATION_ADMIN_TOKEN` environment variable.

### Environment Variables

```bash
# Optional: Additional security token for migration operations
MIGRATION_ADMIN_TOKEN=your-secure-migration-token
```

## API Methods

### GET - Check Migration Status

Get the current status of database migrations.

```bash
curl -X GET https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer your-admin-token"
```

**Response:**
```json
{
  "success": true,
  "status": "up-to-date",
  "output": "Database schema is up to date!",
  "hasPendingMigrations": false,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST - Execute Migration Operations

Perform various migration operations.

#### Deploy Migrations

Apply pending migrations to the database:

```bash
curl -X POST https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "deploy"}'
```

#### Generate Prisma Client

Update the Prisma client after schema changes:

```bash
curl -X POST https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate"}'
```

#### Reset Database (Development Only)

**⚠️ DANGEROUS**: Only available in non-production environments:

```bash
curl -X POST https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "force": true}'
```

#### Resolve Migration Issues

Mark a migration as applied or rolled back:

```bash
curl -X POST https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resolve",
    "migrationName": "20240915000001_add_new_feature",
    "action": "applied"
  }'
```

## Response Format

All responses follow this structure:

```json
{
  "success": boolean,
  "action": string,
  "message": string,
  "output": string,
  "error": string | null,
  "timestamp": string
}
```

## Common Use Cases

### 1. Post-Deployment Migration Check

After deploying to Vercel, check if migrations need to be applied:

```javascript
// Check status
const status = await fetch('/api/admin/prisma-migrate').then(r => r.json())

if (status.hasPendingMigrations) {
  // Deploy pending migrations
  const result = await fetch('/api/admin/prisma-migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deploy' })
  }).then(r => r.json())
  
  console.log('Migration result:', result)
}
```

### 2. Continuous Integration Pipeline

```bash
#!/bin/bash
# deploy-with-migrations.sh

# Deploy to Vercel
vercel --prod

# Wait for deployment
sleep 30

# Check and apply migrations
curl -X POST https://your-app.vercel.app/api/admin/prisma-migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "deploy"}'
```

### 3. Admin Panel Integration

Use the provided `MigrationManager` component in your admin panel:

```tsx
import MigrationManager from '@/components/admin/MigrationManager'

export default function AdminMigrationsPage() {
  return (
    <div>
      <h1>Database Migrations</h1>
      <MigrationManager />
    </div>
  )
}
```

## Security Considerations

1. **Admin Authentication**: Endpoint requires admin privileges
2. **Additional Token**: Optional `MIGRATION_ADMIN_TOKEN` for extra security
3. **Production Safety**: Reset operations blocked in production
4. **Audit Logging**: All operations are logged with timestamps

## Error Handling

Common error scenarios and solutions:

### Migration Conflicts
```json
{
  "success": false,
  "error": "Migration conflict detected",
  "action": "deploy"
}
```
**Solution**: Use the resolve action to mark conflicting migrations as applied.

### Database Connection Issues
```json
{
  "success": false,
  "error": "Database connection failed",
  "action": "deploy"
}
```
**Solution**: Check database credentials and network connectivity.

### Pending Schema Changes
```json
{
  "success": false,
  "error": "Schema drift detected",
  "action": "deploy"
}
```
**Solution**: Create a new migration file or resolve the drift.

## Best Practices

1. **Always check status first** before deploying migrations
2. **Use the admin panel** for visual feedback during operations
3. **Monitor logs** in Vercel dashboard during migration execution
4. **Backup database** before major schema changes
5. **Test migrations** in staging environment first

## Integration with Existing Migration System

This Prisma migration API works alongside the existing custom migration system at `/api/admin/migrate`. You can use both systems:

- **Custom SQL migrations**: Use `/api/admin/migrate` for complex, hand-written SQL
- **Prisma migrations**: Use `/api/admin/prisma-migrate` for schema changes managed by Prisma

## Troubleshooting

### Migration Stuck in Pending State

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Resolve manually if needed:
   ```bash
   npx prisma migrate resolve --applied migration_name
   ```

3. Or use the API:
   ```bash
   curl -X POST /api/admin/prisma-migrate \
     -d '{"action": "resolve", "migrationName": "migration_name", "action": "applied"}'
   ```

### Client Generation Issues

If the Prisma client is out of sync:

1. Generate client via API:
   ```bash
   curl -X POST /api/admin/prisma-migrate -d '{"action": "generate"}'
   ```

2. Or manually:
   ```bash
   npx prisma generate
   ```

## Vercel Deployment Notes

1. **Build Hook**: Consider using Vercel build hooks to trigger deployments after migrations
2. **Environment Variables**: Ensure all database credentials are properly set
3. **Function Timeout**: Migration operations may take time; ensure adequate function timeout limits
4. **Monitoring**: Use Vercel's function logs to monitor migration execution

---

**For more information about Prisma migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate