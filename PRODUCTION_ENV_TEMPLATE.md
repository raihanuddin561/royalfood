# Production Environment Variables Template

Copy these variables to your Vercel dashboard or production environment:

```bash
# Database URL (Required - Use Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@your-neon-host/your-database?sslmode=require"

# NextAuth Configuration (Required)
NEXTAUTH_URL="https://royal-food-rs.vercel.app"
NEXTAUTH_SECRET="generate-a-secure-32-character-string-for-production"

# Node Environment (Required)
NODE_ENV="production"
```

## How to Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Checklist

1. ✅ Set up Neon PostgreSQL database
2. ✅ Configure environment variables in Vercel
3. ✅ Deploy to Vercel
4. ✅ Run database initialization (one-time setup)
5. ✅ Test login with default admin account

## Default Admin Account
- Email: admin@royalfood.com  
- Password: admin123
- **Important**: Change this password immediately after first login!
