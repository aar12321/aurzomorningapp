# 🚀 Daily Quiz App - Deployment Guide

Complete deployment checklist for the Daily Quiz Web App.

## 📋 Pre-Deployment Checklist

### ✅ Database Setup
- [ ] Run all database migrations in order
- [ ] Verify RLS policies are active
- [ ] Test database functions work correctly
- [ ] Check indexes are created for performance
- [ ] Verify admin roles are set up

### ✅ Environment Configuration
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Set up email service (Resend/SendGrid/Postmark)
- [ ] Configure domain for email sending
- [ ] Set up monitoring and logging

### ✅ Security Review
- [ ] Review RLS policies
- [ ] Test authentication flows
- [ ] Verify admin access controls
- [ ] Check for sensitive data exposure
- [ ] Test rate limiting

## 🗄️ Database Migration Order

Execute these migrations in order:

```bash
# 1. Initial schema
supabase db push --file supabase/migrations/20251010232223_3081fb48-d1a3-4a51-a205-03ec99eb25ed.sql

# 2. Sample quiz data
supabase db push --file supabase/migrations/20250110000000_seed_sample_quizzes.sql

# 3. Email automation
supabase db push --file supabase/migrations/20250110000001_setup_email_cron.sql

# 4. Helper functions
supabase db push --file supabase/migrations/20250110000002_helper_functions.sql

# 5. Performance indexes
supabase db push --file supabase/migrations/20250110000003_performance_indexes.sql

# 6. Admin roles
supabase db push --file supabase/migrations/20250110000004_admin_roles.sql
```

## 🌐 Frontend Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_APP_URL
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables in Netlify dashboard
```

### Other Platforms
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS with Docker
- **AWS**: S3 + CloudFront
- **Google Cloud**: App Engine

## 📧 Email Service Setup

### Resend (Recommended)
1. Create account at [resend.com](https://resend.com)
2. Add domain and verify DNS
3. Get API key
4. Update Edge Function code
5. Test email delivery

### SendGrid
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Set up sender authentication
3. Get API key
4. Update Edge Function code
5. Test email delivery

## 🔧 Supabase Configuration

### Edge Functions
```bash
# Deploy functions
supabase functions deploy daily-email-cron
supabase functions deploy send-daily-emails
```

### Cron Jobs
```sql
-- Enable pg_cron
SELECT cron.schedule('daily-emails', '0 12 * * *', 'SELECT trigger_daily_emails();');
```

### Environment Variables
Set in Supabase dashboard:
- `RESEND_API_KEY` (or your email service)
- `APP_URL` (your deployed app URL)

## 📱 Mobile Optimization

### PWA Setup
```json
// public/manifest.json
{
  "name": "Aurzo",
  "short_name": "Aurzo",
  "description": "Learn something new every day",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
```javascript
// public/sw.js
const CACHE_NAME = 'daily-quiz-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## 🔍 Testing Checklist

### Functional Testing
- [ ] User registration and login
- [ ] Topic selection and saving
- [ ] Quiz completion flow
- [ ] XP and streak calculation
- [ ] Badge awarding system
- [ ] Email delivery (manual trigger)
- [ ] Admin console functionality
- [ ] Mobile responsiveness

### Performance Testing
- [ ] Page load times < 2 seconds
- [ ] Quiz completion < 2 minutes
- [ ] Database query performance
- [ ] Mobile performance on 3G
- [ ] Email delivery speed

### Security Testing
- [ ] Authentication flows
- [ ] Authorization checks
- [ ] Data validation
- [ ] SQL injection prevention
- [ ] XSS protection

## 📊 Monitoring Setup

### Analytics
- **Vercel Analytics**: Performance metrics
- **Supabase Dashboard**: Database monitoring
- **Email Provider**: Delivery analytics
- **Custom Events**: User engagement tracking

### Alerts
- Database connection failures
- Email delivery failures
- High error rates
- Performance degradation

## 🚨 Production Issues

### Common Problems
1. **Email not sending**: Check API keys and domain setup
2. **Slow queries**: Review database indexes
3. **Authentication issues**: Verify RLS policies
4. **Mobile issues**: Test on real devices

### Debugging
```bash
# Check Supabase logs
supabase functions logs daily-email-cron

# Check database performance
SELECT * FROM pg_stat_activity;

# Test email manually
curl -X POST https://your-project.supabase.co/functions/v1/send-daily-emails
```

## 📈 Scaling Considerations

### Database
- Monitor query performance
- Add indexes as needed
- Consider read replicas for analytics
- Implement connection pooling

### Email
- Batch processing for large user bases
- Queue system for reliability
- Multiple email providers for redundancy
- Rate limiting to prevent abuse

### Frontend
- CDN for static assets
- Image optimization
- Code splitting for faster loads
- Caching strategies

## 🔄 Maintenance

### Regular Tasks
- Monitor email delivery rates
- Review user engagement metrics
- Update quiz content
- Check for security updates
- Backup database regularly

### Content Updates
- Add new topics and quizzes
- Update existing content
- Seasonal or trending topics
- User feedback integration

## 📞 Support

### Documentation
- README.md for setup
- API documentation
- Database schema docs
- Deployment guides

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Email delivery tracking

---

**🎉 Congratulations!** Your Daily Quiz app is now ready for production deployment!
