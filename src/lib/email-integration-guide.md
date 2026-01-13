# Email Service Integration Guide

This guide shows how to integrate the Daily Quiz app with real email services for production deployment.

## 🚀 Quick Setup Options

### Option 1: Resend (Recommended)
```bash
npm install resend
```

Update `supabase/functions/daily-email-cron/index.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendDailyEmail(email: string, data: EmailData): Promise<boolean> {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Aurzo <noreply@yourdomain.com>',
      to: [email],
      subject: 'Your Daily Quizzes Are Ready!',
      html: generateEmailHTML(data),
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Email sent successfully:', emailData);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}
```

### Option 2: SendGrid
```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));

async function sendDailyEmail(email: string, data: EmailData): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com',
      subject: 'Your Daily Quizzes Are Ready!',
      html: generateEmailHTML(data),
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

### Option 3: Postmark
```bash
npm install postmark
```

```typescript
import { ServerClient } from 'postmark';

const client = new ServerClient(Deno.env.get('POSTMARK_SERVER_TOKEN'));

async function sendDailyEmail(email: string, data: EmailData): Promise<boolean> {
  try {
    const response = await client.sendEmail({
      From: 'noreply@yourdomain.com',
      To: email,
      Subject: 'Your Daily Quizzes Are Ready!',
      HtmlBody: generateEmailHTML(data),
    });

    console.log('Email sent:', response);
    return true;
  } catch (error) {
    console.error('Postmark error:', error);
    return false;
  }
}
```

## 🔧 Environment Variables

Add to your Supabase project settings:

```env
# Resend
RESEND_API_KEY=re_xxxxxxxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxx

# Postmark
POSTMARK_SERVER_TOKEN=xxxxxxxxxx

# App Configuration
APP_URL=https://yourdomain.com
```

## 📧 Email Template Customization

The `generateEmailHTML()` function creates responsive email templates. Customize:

1. **Brand Colors**: Update CSS variables in the template
2. **Logo**: Replace the sunrise emoji with your logo
3. **Content**: Modify the copy and structure
4. **CTA Buttons**: Update quiz links and styling

## 🚦 Production Checklist

- [ ] Set up email service account
- [ ] Configure domain authentication (SPF, DKIM, DMARC)
- [ ] Test email delivery with real addresses
- [ ] Set up bounce and complaint handling
- [ ] Monitor delivery rates and reputation
- [ ] Implement unsubscribe functionality
- [ ] Add email analytics tracking

## 📊 Monitoring & Analytics

Track email performance:
- Open rates
- Click-through rates
- Bounce rates
- Unsubscribe rates
- Delivery time

## 🔒 Security Best Practices

1. **API Key Security**: Store keys in Supabase secrets
2. **Rate Limiting**: Implement to prevent abuse
3. **List Hygiene**: Regular cleanup of invalid emails
4. **Compliance**: Follow GDPR, CAN-SPAM regulations
5. **Authentication**: Verify sender domains

## 🧪 Testing

Test email delivery:
```bash
# Manual trigger
curl -X POST https://your-project.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 📈 Scaling Considerations

- **Batch Processing**: Send emails in batches of 100-500
- **Queue System**: Use Redis or database queues for large lists
- **Rate Limits**: Respect provider limits (Resend: 10k/day free)
- **Monitoring**: Set up alerts for failures
- **Backup**: Have multiple email providers ready

## 🎯 Advanced Features

- **A/B Testing**: Test different email templates
- **Segmentation**: Send different content to different user groups
- **Scheduling**: More flexible timing than daily
- **Personalization**: Dynamic content based on user preferences
- **Analytics**: Track user engagement with emails
