# Daily Quiz Web App - Replit Development Guide

## Overview

The Daily Quiz Web App is a gamified daily learning platform that delivers personalized quizzes every morning at 7:00 AM ET. Built with React, TypeScript, Supabase, and designed for mobile-first learning experiences, it transforms mornings with 2-minute daily quizzes across 37+ learning topics.

**Core Promise:** "Learn something new every day in under two minutes."

### Key Features
- Daily quizzes delivered at 7:00 AM ET across 13 learning categories
- Gamification with XP, streaks, badges, and leaderboards
- Email automation for daily reminders
- Admin console for content management
- Mobile-first responsive design
- Interactive flashcard system with 3D animations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite
- **Routing**: React Router for client-side navigation
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: TailwindCSS with custom design system
- **Component Library**: Radix UI primitives with shadcn/ui components
- **Animations**: Framer Motion for transitions and 3D card flips

**Key Design Decisions**:
- Mobile-first responsive design approach
- Component-driven architecture with reusable UI primitives
- Type-safe development with TypeScript
- Real-time updates via Supabase subscriptions

### Backend Architecture

**Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password and Google OAuth
- **Row Level Security (RLS)**: Enforced for all user data
- **Real-time**: Subscriptions for live updates

**Core Data Models**:
1. **Users** - Authentication and profile data
2. **Topics** - 37 selectable learning topics across 13 categories
3. **Quizzes** - Daily quiz content (30 days per topic)
4. **Questions** - 3 questions per quiz with multiple choice answers
5. **Quiz Attempts** - User progress tracking
6. **User Topics** - User subscriptions to topics with progress tracking
7. **Badges** - Achievement system

**Progress Tracking System**:
- `current_day`: Current quiz day user is on (starts at 1)
- `completed_days`: Count of quizzes user has completed
- `unlock_day`: Which day's quiz is available (increments daily at 7 AM ET)
- Daily unlock mechanism via cron job

**Key Architectural Decisions**:
- Chose Supabase over custom backend for faster development and built-in auth/real-time
- RLS policies ensure users can only access their own data
- Service role key used for admin operations and cron jobs
- Quiz content stored in CSV and imported via Node.js scripts

### Email Automation

**Service**: Configurable (Resend/SendGrid/Postmark)
- Daily reminder emails at 7:00 AM ET via cron job
- Responsive email templates with progress updates
- Direct quiz links for one-click access

**Implementation**:
- Supabase Edge Functions triggered by pg_cron
- Email templates stored in edge function code
- User preferences for email notifications

### Gamification System

**XP System**:
- 10 XP per correct answer + bonuses
- Stored in user profile, displayed on dashboard

**Streak Tracking**:
- Daily completion tracking
- Streak counter resets if day missed
- Visual streak display on dashboard

**Badge System**:
- 5 achievement badges to unlock
- Awarded based on milestones (XP, streaks, topics completed)
- Displayed on user profile

**Leaderboards**:
- Weekly/monthly XP rankings
- Topic-specific leaderboards
- Friendly competition features

## External Dependencies

### Third-Party Services

**Supabase**
- PostgreSQL database hosting
- Authentication service (email/password, OAuth)
- Real-time subscriptions
- Edge Functions for serverless functions
- Storage for future media assets
- Project URL: `https://lnvebvrayuveygycpolc.supabase.co`

**Email Service (Configurable)**
- Options: Resend, SendGrid, or Postmark
- Used for daily quiz reminders at 7 AM ET
- Requires API key configuration

**Meta WhatsApp Business API** (Optional)
- Alternative notification channel
- Free tier: 1000 conversations/month
- Requires phone number ID and access token
- Setup documented in `WHATSAPP_SETUP.md`

**Telegram Bot API** (Optional)
- Free notification channel
- Requires bot token from @BotFather
- Setup documented in `CHATBOT_SETUP.md`

### Build Dependencies

**Core Framework**:
- React 18.3.1
- TypeScript 5.6.2
- Vite 5.4.11

**UI & Styling**:
- TailwindCSS 3.4.17
- Radix UI components (@radix-ui/*)
- Framer Motion 12.23.24
- shadcn/ui component system

**Data & State**:
- @supabase/supabase-js 2.75.0
- @tanstack/react-query 5.83.0
- React Hook Form 7.54.2
- Zod 3.24.1 (validation)

**Utilities**:
- date-fns 3.6.0 (date manipulation)
- KaTeX 0.16.25 (math rendering)
- Recharts 2.15.0 (charts/graphs)
- Lucide React 0.462.0 (icons)

### Database & Cron Jobs

**PostgreSQL Extensions**:
- `pg_cron`: Daily quiz unlock at 7 AM ET
- `pg_net`: HTTP requests from edge functions

**Cron Jobs**:
- Daily unlock: Increments `unlock_day` at 7:00 AM ET
- Email reminders: Triggers daily notification emails
- Setup: `SETUP_CRON_JOBS.md`

### Authentication Providers

**Email/Password**: Built-in Supabase Auth
**Google OAuth**: 
- Requires OAuth credentials from Google Cloud Console
- Setup: `GOOGLE_OAUTH_SETUP.md`
- Redirect URI: `{supabase_url}/auth/v1/callback`

### CSV Data Import

**Quiz Content**: 
- All quiz data stored in `quizzes.csv`
- Import scripts in root directory (`import_*.js`)
- Each quiz has 3 questions with 4 answer options
- 30-day curriculum per topic

**CSV Structure**:
- Topic, Day, QuizID, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Difficulty, Explanation

### Deployment

**Platform**: Render.com (recommended) or similar
- Node.js environment
- Static site deployment
- Environment variables required:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Email service API keys (optional)

**Migration Scripts**:
- Located in `supabase/migrations/`
- Must be run in specific order (see `DEPLOYMENT.md`)
- Includes schema, sample data, cron setup, indexes, admin roles