# Daily Quiz Web App

A modern, gamified daily learning platform that delivers personalized quizzes every morning at 7:00 AM ET. Built with React, TypeScript, Supabase, and designed for mobile-first learning experiences.

## 🌅 Vision

Transform your mornings with 2-minute daily quizzes. Build knowledge, one sunrise at a time. The Daily Quiz Web App is a movement disguised as a product — a daily ritual that turns curiosity into growth.

**Core Promise:** "Learn something new every day in under two minutes."

## ✨ Features

### 🎯 Core Learning Experience
- **Daily Quizzes**: Fresh content delivered at 7:00 AM ET
- **13 Learning Topics**: Academic and adult learning categories
- **2-Minute Format**: Quick, effective knowledge building
- **Interactive Flashcards**: 3D flip animations for review
- **Mobile-First Design**: Optimized for phone learning

### 🏆 Gamification System
- **XP System**: Earn 10 XP per correct answer + bonuses
- **Streak Tracking**: Maintain daily learning habits
- **Badge System**: 5 achievement badges to unlock
- **Leaderboards**: Friendly competition with other learners
- **Progress Charts**: Visualize your learning journey

### 📧 Email Automation
- **Daily Reminders**: Personalized emails at 7:00 AM ET
- **Beautiful Templates**: Responsive email design
- **Progress Updates**: Streak and XP notifications
- **Direct Quiz Links**: One-click access to daily content

### 🛠️ Admin Console
- **Content Management**: Create and edit quizzes
- **User Analytics**: Track engagement and progress
- **Badge Management**: Award and manage achievements
- **Email Testing**: Test daily email delivery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd daily-quiz-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### 4. Database Setup

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Manual Migration (Alternative)
If you prefer to run migrations manually, execute these SQL files in order:

1. `supabase/migrations/20251010232223_3081fb48-d1a3-4a51-a205-03ec99eb25ed.sql` (Initial schema)
2. `supabase/migrations/20250110000000_seed_sample_quizzes.sql` (Sample quiz data)
3. `supabase/migrations/20250110000001_setup_email_cron.sql` (Email automation)
4. `supabase/migrations/20250110000002_helper_functions.sql` (Database functions)
5. `supabase/migrations/20250110000003_performance_indexes.sql` (Performance indexes)
6. `supabase/migrations/20250110000004_admin_roles.sql` (Admin role support)

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

## 📱 Mobile Optimization

This app is designed mobile-first for the best learning experience:

### Key Mobile Features
- **Touch-Friendly**: 44px minimum tap targets
- **Responsive Design**: Works on all screen sizes (320px - 428px)
- **Fast Loading**: Optimized images and assets
- **Swipe Gestures**: Natural navigation for flashcards
- **Haptic Feedback**: Subtle vibrations for interactions
- **PWA Ready**: Can be installed as a mobile app

### Browser Support
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 8+)
- ✅ Samsung Internet
- ✅ Firefox Mobile

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend Stack
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Edge Functions** for serverless logic
- **pg_cron** for scheduled tasks

### Key Components

```
src/
├── components/ui/          # Reusable UI components
├── pages/                  # Main application pages
├── lib/                    # Utility functions and services
├── hooks/                  # Custom React hooks
├── integrations/supabase/  # Database client and types
└── assets/                 # Images and static files
```

## 📊 Database Schema

### Core Tables
- **users**: User profiles and stats
- **topics**: Learning categories
- **quizzes**: Daily quiz content
- **questions**: Individual quiz questions
- **quiz_attempts**: User quiz submissions
- **badges**: Achievement system
- **user_badges**: User badge assignments

### Key Relationships
- Users have many topics (user_topics)
- Topics have many quizzes (by day)
- Quizzes have many questions
- Users have many quiz attempts
- Users can earn multiple badges

## 🔧 Configuration

### Email Service Setup
The app includes mock email functionality. For production:

1. **Choose Email Provider**: Resend, SendGrid, or Postmark
2. **Update Edge Functions**: Modify `supabase/functions/daily-email-cron/index.ts`
3. **Add API Keys**: Set environment variables in Supabase
4. **Test Delivery**: Use the manual trigger endpoint

### Admin Access
To grant admin access:

1. Update the admin email in `supabase/migrations/20250110000004_admin_roles.sql`
2. Run the migration: `supabase db push`
3. The specified email will have super_admin privileges

### Cron Job Setup
For production email delivery:

1. **Enable pg_cron**: Ensure it's enabled in your Supabase project
2. **Schedule Job**: Uncomment the cron.schedule line in the migration
3. **Monitor Logs**: Check `cron_logs` table for execution status

## 🎨 Design System

### Color Palette
- **Primary**: Orange gradient (#f97316 to #9333ea)
- **Secondary**: Purple accent (#9333ea)
- **Background**: Soft white with gradients
- **Text**: High contrast for readability

### Typography
- **Font**: Inter (system font stack)
- **Sizes**: Mobile-optimized (16px minimum for inputs)
- **Weights**: Regular (400), Medium (500), Bold (700)

### Components
- **Cards**: Rounded corners (2xl), subtle shadows
- **Buttons**: Gradient backgrounds, hover effects
- **Animations**: Smooth transitions, micro-interactions
- **Spacing**: Consistent 8px grid system

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and topic selection
- [ ] Quiz completion and XP calculation
- [ ] Badge awarding system
- [ ] Streak calculation
- [ ] Email delivery (manual trigger)
- [ ] Mobile responsiveness
- [ ] Admin console functionality

### Performance Testing
- [ ] Page load times < 2 seconds
- [ ] Quiz completion < 2 minutes
- [ ] Mobile performance on 3G
- [ ] Database query optimization

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
- **Netlify**: Static site hosting
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_URL=https://your-domain.com
```

## 📈 Analytics & Monitoring

### Key Metrics
- **Daily Active Users (DAU)**
- **Quiz Completion Rate**
- **Average Session Duration**
- **Email Open Rates**
- **Streak Retention**

### Monitoring Setup
- **Supabase Dashboard**: Database and function monitoring
- **Vercel Analytics**: Performance and usage metrics
- **Email Provider**: Delivery and bounce tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Prettier**: Consistent code formatting
- **Mobile-First**: Always consider mobile experience

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons

## 📞 Support

For questions or support:
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this README and code comments
- **Community**: Join our Discord server (coming soon)

---

**Built with ❤️ for lifelong learners**

*"Progress is built one day at a time."*