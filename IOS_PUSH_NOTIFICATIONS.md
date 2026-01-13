# iOS Push Notifications Setup

## Why Not Direct iMessage?

Apple **does not provide a public API** to send iMessages programmatically. This is by design for privacy and security. However, you can send notifications that appear similar to iMessages using:

1. **iOS Push Notifications (APNs)** - Official, recommended
2. **Web Push Notifications (PWA)** - Works on iOS 16.4+ Safari
3. **Third-party services** - Limited and may violate ToS

## Option 1: iOS Push Notifications (APNs) - Recommended

### How It Works
- Users install your app (native or PWA)
- They grant notification permissions
- You send push notifications via Apple's Push Notification Service
- Notifications appear in Notification Center, similar to messages

### Setup Steps

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)

2. **Create App ID**
   - Go to Certificates, Identifiers & Profiles
   - Create new App ID with Push Notifications enabled

3. **Generate APNs Key**
   - Go to Keys section
   - Create new key with Apple Push Notifications service (APNs) enabled
   - Download the `.p8` key file
   - Note the Key ID and Team ID

4. **Environment Variables**
   ```env
   APNS_KEY_ID=your_key_id
   APNS_TEAM_ID=your_team_id
   APNS_BUNDLE_ID=com.morninggrowthloop.app
   APNS_KEY_PATH=./path/to/AuthKey.p8
   APNS_PRODUCTION=false  # true for production
   ```

5. **Install Dependencies**
   ```bash
   npm install jsonwebtoken
   ```

6. **Store Device Tokens**
   - Add `device_tokens` column to users table (JSONB array)
   - Store device tokens when users enable notifications

### Pros
- ✅ Official Apple solution
- ✅ Works on all iOS devices
- ✅ Reliable delivery
- ✅ Rich notifications (images, actions, deep links)

### Cons
- ❌ Requires Apple Developer account ($99/year)
- ❌ Requires app/PWA installation
- ❌ More complex setup

## Option 2: Web Push Notifications (PWA) - Easier

### How It Works
- Users visit your website in Safari (iOS 16.4+)
- They grant notification permissions
- You send push notifications via web push API
- Works on iOS, Android, and desktop

### Setup Steps

1. **Generate VAPID Keys**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. **Environment Variables**
   ```env
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_EMAIL=mailto:notifications@morning-growth-loop.com
   ```

3. **Install Dependencies**
   ```bash
   npm install web-push
   ```

4. **Service Worker Setup**
   - Create `public/sw.js` for handling push notifications
   - Register service worker in your app
   - Store push subscriptions in database

5. **Store Push Subscriptions**
   - Add `push_subscriptions` column to users table (JSONB)
   - Store subscription when user grants permission

### Pros
- ✅ No Apple Developer account needed
- ✅ Works on iOS 16.4+ Safari
- ✅ Works on all platforms (iOS, Android, desktop)
- ✅ Easier to set up
- ✅ Free

### Cons
- ❌ Requires iOS 16.4+ (older devices can't use)
- ❌ Requires user to visit website in Safari
- ❌ Less reliable than native push

## Option 3: Third-Party Services (Not Recommended)

Services like SendBlue, Twilio, etc. claim to send iMessages, but they:
- Usually just send SMS (not true iMessage)
- Are expensive
- May violate Apple's Terms of Service
- Not reliable for production

## Recommendation

**Use Web Push Notifications (Option 2)** because:
1. ✅ Free to implement
2. ✅ Works on iOS 16.4+ (most users)
3. ✅ Also works on Android and desktop
4. ✅ Easier setup than native APNs
5. ✅ No annual Apple Developer fee needed

For maximum compatibility, you can implement both:
- Web Push for most users (free, easy)
- APNs for users who need native app experience

## Implementation

See `src/lib/push-notification-service.ts` for the service implementation.

## Next Steps

1. Choose Option 1 (APNs) or Option 2 (Web Push) or both
2. Set up the required credentials
3. Create service worker for web push (if using Option 2)
4. Update database to store device tokens/subscriptions
5. Add UI to request notification permissions
6. Update daily notifications cron to send push notifications

## User Experience

Users will:
1. Visit your website (or install app)
2. See a prompt: "Allow notifications?"
3. Click "Allow"
4. Receive daily quiz reminders as push notifications
5. Tap notification to open quiz directly

The notifications will look and feel similar to iMessages!

