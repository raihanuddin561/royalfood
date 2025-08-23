# 🌐 Domain Update Guide: royalfoodbd.vercel.app

## Updated Domain Configuration

Your Royal Food application domain has been updated from `royal-food-rs.vercel.app` to `royalfoodbd.vercel.app`.

## ✅ Updated Files

### Core Configuration Files:
- `src/lib/env.ts` - Updated production URL
- `.env.production` - Updated NEXTAUTH_URL
- `.env.example` - Updated example NEXTAUTH_URL

### Domain-Specific Settings:
- **New Domain**: `royalfoodbd.vercel.app`
- **NEXTAUTH_URL**: `https://royalfoodbd.vercel.app`
- **Cookie Domain**: `.vercel.app` (unchanged - covers all Vercel subdomains)

## 🔧 Vercel Environment Variables to Update

In your Vercel dashboard, update the following environment variable:

1. Go to your project settings in Vercel
2. Navigate to Environment Variables
3. Update: `NEXTAUTH_URL` = `https://royalfoodbd.vercel.app`
4. Redeploy the application

## 🚀 Post-Update Testing URLs

After deployment, test these URLs:

- **Main App**: https://royalfoodbd.vercel.app
- **Login**: https://royalfoodbd.vercel.app/auth/signin
- **Dashboard**: https://royalfoodbd.vercel.app/dashboard
- **Environment Test**: https://royalfoodbd.vercel.app/api/test-env
- **Admin Users**: https://royalfoodbd.vercel.app/admin/users

## 🔑 Login Credentials

Use the same credentials:
- **Admin**: admin@royalfood.com / admin123
- **Test Staff**: staff@example.com / staffpass123
- **Test Manager**: manager@example.com / managerpass123

## 📝 Key Points

1. **Cookie Domain**: Still uses `.vercel.app` to work across all Vercel subdomains
2. **Session Management**: All session handling remains the same
3. **Database**: No database changes needed
4. **Authentication**: NextAuth configuration automatically uses new domain

## ✅ Verification Steps

1. Deploy the updated configuration
2. Visit https://royalfoodbd.vercel.app
3. Test login functionality
4. Verify session persistence works
5. Test user switching functionality

Your application is now configured for the new domain `royalfoodbd.vercel.app`!
