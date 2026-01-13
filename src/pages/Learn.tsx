import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Brain, Briefcase, Globe, TrendingUp, ChefHat, Sparkles,
  DollarSign, TrendingDown, FileText, Home, Wrench, Shield, 
  Smartphone, Users, Mail, BriefcaseIcon, Zap, Heart, Stethoscope,
  Leaf, Plane, Coffee, UtensilsCrossed, Atom, Lightbulb, 
  History, Palette, Flower2, Compass, Target, BarChart3, PenTool,
  Megaphone, Handshake, Calendar, Laptop, FileCheck, PartyPopper,
  Bot, Mic, Smile, Scale, Puzzle, RefreshCw, Languages, GraduationCap,
  AlertTriangle, BookMarked, Gavel, TrendingUp as TrendingUpIcon, Package,
  ShoppingCart, Dog, Truck, Shirt, Building2, Brain as BrainIcon, HeartHandshake,
  Network, Crown, UserCheck, Video, Cloud,
  Link, Lock, Car, Umbrella, PiggyBank, Building, Search,
  UsersRound, Laugh, Star, MessageSquare,
  Fuel, Users2, Pickaxe, Trophy, Gamepad2, Camera, Fingerprint
} from 'lucide-react';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { getFlashcards, TopicType } from '@/lib/ai-content-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const ALL_TOPICS: Topic[] = [
  // Money & Finance
  { id: 'personal_finance', name: 'Personal Finance', description: 'Budgeting, credit scores, debt management, banking', icon: <DollarSign className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Money & Finance' },
  { id: 'investing_101', name: 'Investing 101', description: 'Stock market, 401(k)s, IRAs, crypto basics', icon: <TrendingUp className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Money & Finance' },
  { id: 'taxes_insurance', name: 'Taxes & Insurance', description: 'Tax brackets, deductions, health insurance', icon: <FileText className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Money & Finance' },
  { id: 'real_estate', name: 'Real Estate Smarts', description: 'Renting vs buying, mortgages, tenant rights', icon: <Home className="w-6 h-6" />, color: 'from-orange-500/20 to-amber-500/20', category: 'Money & Finance' },
  
  // Home & Auto
  { id: 'car_maintenance', name: 'Car Maintenance', description: 'Changing tires, dashboard lights, oil changes', icon: <Wrench className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Home & Auto' },
  { id: 'home_repair', name: 'Home Repair DIY', description: 'Fixing faucets, drywall, electrical safety', icon: <Home className="w-6 h-6" />, color: 'from-yellow-500/20 to-orange-500/20', category: 'Home & Auto' },
  
  // Tech & Digital
  { id: 'digital_security', name: 'Digital Security', description: 'Password management, phishing, 2FA, privacy', icon: <Shield className="w-6 h-6" />, color: 'from-indigo-500/20 to-purple-500/20', category: 'Tech & Digital' },
  { id: 'tech_trends', name: 'Tech Trends', description: 'AI updates, smart home, emerging software', icon: <Smartphone className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Tech & Digital' },
  
  // World & Society
  { id: 'global_affairs', name: 'Global Affairs', description: 'Geopolitical conflicts, trade, world summits', icon: <Globe className="w-6 h-6" />, color: 'from-teal-500/20 to-green-500/20', category: 'World & Society' },
  { id: 'civics_government', name: 'Civics & Government', description: 'Elections, justice system, citizen rights', icon: <Users className="w-6 h-6" />, color: 'from-blue-500/20 to-indigo-500/20', category: 'World & Society' },
  { id: 'media_literacy', name: 'Media Literacy', description: 'Spotting fake news, bias, fact-checking', icon: <Mail className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'World & Society' },
  
  // Career & Work
  { id: 'modern_etiquette', name: 'Modern Etiquette', description: 'Email professionalism, tipping, digital manners', icon: <Users className="w-6 h-6" />, color: 'from-violet-500/20 to-purple-500/20', category: 'Career & Work' },
  { id: 'job_hunting', name: 'Job Hunting', description: 'Resume optimization, interviews, salary negotiation', icon: <BriefcaseIcon className="w-6 h-6" />, color: 'from-slate-500/20 to-gray-500/20', category: 'Career & Work' },
  { id: 'office_politics', name: 'Office Politics', description: 'Navigating hierarchy, difficult coworkers', icon: <Briefcase className="w-6 h-6" />, color: 'from-gray-500/20 to-slate-500/20', category: 'Career & Work' },
  { id: 'productivity_hacks', name: 'Productivity Hacks', description: 'Time-blocking, software shortcuts, focus', icon: <Zap className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Career & Work' },
  
  // Health & Wellness
  { id: 'health_wellness', name: 'Health & Wellness', description: 'Nutrition labels, sleep, stress, ergonomics', icon: <Heart className="w-6 h-6" />, color: 'from-red-500/20 to-pink-500/20', category: 'Health & Wellness' },
  { id: 'first_aid_safety', name: 'First Aid & Safety', description: 'CPR basics, treating injuries, emergency kits', icon: <Stethoscope className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Health & Wellness' },
  
  // Relationships & Family
  { id: 'relationship_skills', name: 'Relationship Skills', description: 'Active listening, conflict resolution, boundaries', icon: <Users className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'Relationships & Family' },
  { id: 'parenting_family', name: 'Parenting & Family', description: 'Child development, elder care, family planning', icon: <Heart className="w-6 h-6" />, color: 'from-rose-500/20 to-pink-500/20', category: 'Relationships & Family' },
  
  // Lifestyle
  { id: 'sustainable_living', name: 'Sustainable Living', description: 'Recycling, energy saving, eco-friendly shopping', icon: <Leaf className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Lifestyle' },
  { id: 'travel_intelligence', name: 'Travel Intelligence', description: 'Credit card points, visas, packing, solo travel', icon: <Plane className="w-6 h-6" />, color: 'from-sky-500/20 to-blue-500/20', category: 'Lifestyle' },
  { id: 'beverage_connoisseur', name: 'Beverage Connoisseur', description: 'Coffee, wine, beer, cocktails', icon: <Coffee className="w-6 h-6" />, color: 'from-amber-500/20 to-orange-500/20', category: 'Lifestyle' },
  { id: 'cooking_techniques', name: 'Cooking Techniques', description: 'Knife skills, heat control, flavor, meal prep', icon: <ChefHat className="w-6 h-6" />, color: 'from-orange-500/20 to-red-500/20', category: 'Lifestyle' },
  { id: 'interior_design', name: 'Interior Design', description: 'Layout rules, color theory, lighting, furniture', icon: <Palette className="w-6 h-6" />, color: 'from-purple-500/20 to-pink-500/20', category: 'Lifestyle' },
  { id: 'gardening_plants', name: 'Gardening & Plants', description: 'Houseplants, herbs, lawn care, soil basics', icon: <Flower2 className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Lifestyle' },
  
  // Learning & Thinking
  { id: 'science_breakthroughs', name: 'Science Breakthroughs', description: 'Space, medical advances, renewable energy', icon: <Atom className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Learning & Thinking' },
  { id: 'psychology_basics', name: 'Psychology Basics', description: 'Cognitive biases, habits, behavioral economics', icon: <Brain className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Learning & Thinking' },
  { id: 'logical_thinking', name: 'Logical Thinking', description: 'Logical fallacies, debate skills, mental models', icon: <Lightbulb className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Learning & Thinking' },
  { id: 'history_context', name: 'History Context', description: 'Why things are the way they are', icon: <History className="w-6 h-6" />, color: 'from-amber-500/20 to-orange-500/20', category: 'Learning & Thinking' },
  
  // Survival & Skills
  { id: 'survival_skills', name: 'Survival Skills', description: 'Wilderness basics, compass, water purification', icon: <Compass className="w-6 h-6" />, color: 'from-orange-500/20 to-red-500/20', category: 'Survival & Skills' },
  
  // Business & Management (First List)
  { id: 'project_management', name: 'Project Management', description: 'Agile, timelines, resource allocation, Trello/Asana', icon: <Target className="w-6 h-6" />, color: 'from-blue-500/20 to-indigo-500/20', category: 'Business & Management' },
  { id: 'data_literacy', name: 'Data Literacy', description: 'Reading charts/graphs, statistics, avoiding data lies', icon: <BarChart3 className="w-6 h-6" />, color: 'from-purple-500/20 to-pink-500/20', category: 'Business & Management' },
  { id: 'business_writing', name: 'Business Writing', description: 'Clear memos, reports, persuasive copywriting, editing', icon: <PenTool className="w-6 h-6" />, color: 'from-indigo-500/20 to-blue-500/20', category: 'Business & Management' },
  { id: 'marketing_branding', name: 'Marketing & Branding', description: '4 Ps of marketing, target audiences, personal brand', icon: <Megaphone className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'Business & Management' },
  { id: 'sales_psychology', name: 'Sales Psychology', description: 'Persuasion, closing, objections, sales funnel', icon: <Handshake className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Business & Management' },
  { id: 'strategic_planning', name: 'Strategic Planning', description: 'OKRs, SWOT analysis, long-term visioning', icon: <Target className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Business & Management' },
  { id: 'remote_work', name: 'Remote Work Mastery', description: 'Async communication, time zones, home office', icon: <Laptop className="w-6 h-6" />, color: 'from-slate-500/20 to-gray-500/20', category: 'Business & Management' },
  { id: 'small_business', name: 'Small Business Basics', description: 'LLC setup, invoicing, quarterly taxes, finances', icon: <FileCheck className="w-6 h-6" />, color: 'from-emerald-500/20 to-green-500/20', category: 'Business & Management' },
  { id: 'event_planning', name: 'Event Planning', description: 'Logistics, vendor management, budgeting', icon: <PartyPopper className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Business & Management' },
  { id: 'ai_ethics', name: 'AI Ethics', description: 'Bias in AI, copyright, responsible usage', icon: <Bot className="w-6 h-6" />, color: 'from-violet-500/20 to-purple-500/20', category: 'Business & Management' },
  
  // Communication & Skills (First List)
  { id: 'public_speaking', name: 'Public Speaking', description: 'Overcoming stage fright, vocal projection, storytelling', icon: <Mic className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Communication & Skills' },
  { id: 'emotional_intelligence', name: 'Emotional Intelligence', description: 'Self-regulation, empathy, reading room dynamics', icon: <Smile className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'Communication & Skills' },
  { id: 'negotiation_tactics', name: 'Negotiation Tactics', description: 'Salary negotiation, contracts, win-win strategies', icon: <Scale className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Communication & Skills' },
  { id: 'creative_problem_solving', name: 'Creative Problem Solving', description: 'Design thinking, lateral thinking, brainstorming', icon: <Puzzle className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Communication & Skills' },
  { id: 'adaptability_resilience', name: 'Adaptability & Resilience', description: 'Managing change, grit, bouncing back', icon: <RefreshCw className="w-6 h-6" />, color: 'from-orange-500/20 to-amber-500/20', category: 'Communication & Skills' },
  { id: 'cross_cultural', name: 'Cross-Cultural Communication', description: 'International norms, cultural sensitivity, etiquette', icon: <Languages className="w-6 h-6" />, color: 'from-teal-500/20 to-green-500/20', category: 'Communication & Skills' },
  { id: 'mentorship_coaching', name: 'Mentorship & Coaching', description: 'Finding mentors, being a mentor, feedback', icon: <GraduationCap className="w-6 h-6" />, color: 'from-indigo-500/20 to-purple-500/20', category: 'Communication & Skills' },
  { id: 'conflict_deescalation', name: 'Conflict De-escalation', description: 'Lowering tension, customer service, personal', icon: <AlertTriangle className="w-6 h-6" />, color: 'from-red-500/20 to-orange-500/20', category: 'Communication & Skills' },
  { id: 'learning_to_learn', name: 'Learning to Learn', description: 'Meta-learning, memory palaces, speed-reading', icon: <BookMarked className="w-6 h-6" />, color: 'from-blue-500/20 to-indigo-500/20', category: 'Communication & Skills' },
  { id: 'decision_making', name: 'Decision Making', description: 'Decision matrices, pros/cons, analysis paralysis', icon: <Target className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Communication & Skills' },
  
  // Legal & Economics (First List)
  { id: 'legal_life_skills', name: 'Legal Life Skills', description: 'Wills, power of attorney, contracts, IP', icon: <Gavel className="w-6 h-6" />, color: 'from-slate-500/20 to-gray-500/20', category: 'Legal & Economics' },
  { id: 'macroeconomics', name: 'Macroeconomics', description: 'Inflation, interest rates, GDP, Fed impact', icon: <TrendingUp className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Legal & Economics' },
  { id: 'supply_chain', name: 'Supply Chain Basics', description: 'Global trade, shipping logistics, shortages', icon: <Package className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Legal & Economics' },
  { id: 'consumer_rights', name: 'Consumer Rights', description: 'Warranty laws, returns, small claims, unfair charges', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-orange-500/20 to-amber-500/20', category: 'Legal & Economics' },
  
  // Life Management (First List)
  { id: 'pet_ownership', name: 'Pet Ownership', description: 'Training, pet insurance, nutrition, vet bills', icon: <Dog className="w-6 h-6" />, color: 'from-amber-500/20 to-orange-500/20', category: 'Life Management' },
  { id: 'moving_logistics', name: 'Moving & Logistics', description: 'Packing, movers vs DIY, lease breaking', icon: <Truck className="w-6 h-6" />, color: 'from-slate-500/20 to-gray-500/20', category: 'Life Management' },
  { id: 'wardrobe_maintenance', name: 'Wardrobe Maintenance', description: 'Fabric types, ironing, sewing, shoe care', icon: <Shirt className="w-6 h-6" />, color: 'from-purple-500/20 to-pink-500/20', category: 'Life Management' },
  { id: 'urban_planning', name: 'Urban Planning', description: 'City design, zoning, transit, gentrification', icon: <Building2 className="w-6 h-6" />, color: 'from-blue-500/20 to-indigo-500/20', category: 'Life Management' },
  { id: 'mental_health_awareness', name: 'Mental Health Awareness', description: 'Burnout, supporting others, destigmatizing therapy', icon: <Brain className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'Life Management' },
  { id: 'charity_philanthropy', name: 'Charity & Philanthropy', description: 'Vetting non-profits, tax implications, altruism', icon: <HeartHandshake className="w-6 h-6" />, color: 'from-red-500/20 to-pink-500/20', category: 'Life Management' },
  
  // Leadership & Career (Second List)
  { id: 'networking_strategy', name: 'Networking Strategy', description: 'Professional circles, LinkedIn, relationships', icon: <Network className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Leadership & Career' },
  { id: 'leadership_fundamentals', name: 'Leadership Fundamentals', description: 'Inspiring teams, delegation, servant leadership', icon: <Crown className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Leadership & Career' },
  { id: 'freelancing_gig_work', name: 'Freelancing & Gig Work', description: 'Upwork, setting rates, client contracts', icon: <BriefcaseIcon className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Leadership & Career' },
  { id: 'hiring_recruiting', name: 'Hiring & Recruiting', description: 'Interviewing, spotting red flags, onboarding', icon: <UserCheck className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Leadership & Career' },
  { id: 'meeting_facilitation', name: 'Meeting Facilitation', description: 'Effective agendas, time management, personalities', icon: <Calendar className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Leadership & Career' },
  { id: 'video_content_creation', name: 'Video Content Creation', description: 'Video editing, Zoom lighting, framing', icon: <Video className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Leadership & Career' },
  { id: 'humor_at_work', name: 'Humor at Work', description: 'Building rapport, boundaries, defusing tension', icon: <Laugh className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Leadership & Career' },
  { id: 'customer_experience', name: 'Customer Experience', description: 'User journeys, NPS, service design', icon: <Star className="w-6 h-6" />, color: 'from-purple-500/20 to-pink-500/20', category: 'Leadership & Career' },
  { id: 'receiving_feedback', name: 'Receiving Feedback', description: 'Handling criticism, processing advice, growth', icon: <MessageSquare className="w-6 h-6" />, color: 'from-blue-500/20 to-indigo-500/20', category: 'Leadership & Career' },
  
  // Technology & Digital (Second List)
  { id: 'cloud_computing', name: 'Cloud Computing Basics', description: 'AWS/Azure, cloud storage security, SaaS', icon: <Cloud className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20', category: 'Technology & Digital' },
  { id: 'blockchain_technology', name: 'Blockchain Technology', description: 'Digital ledgers, NFTs, decentralized finance', icon: <Link className="w-6 h-6" />, color: 'from-indigo-500/20 to-purple-500/20', category: 'Technology & Digital' },
  { id: 'identity_theft_protection', name: 'Identity Theft Protection', description: 'Freezing credit, monitoring fraud, data breaches', icon: <Lock className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Technology & Digital' },
  
  // Home & Security (Second List)
  { id: 'home_security', name: 'Home Security Systems', description: 'Smart locks, cameras, monitoring, safety', icon: <Shield className="w-6 h-6" />, color: 'from-slate-500/20 to-gray-500/20', category: 'Home & Security' },
  { id: 'defensive_driving', name: 'Defensive Driving', description: 'Accident avoidance, weather, road rage', icon: <Car className="w-6 h-6" />, color: 'from-orange-500/20 to-red-500/20', category: 'Home & Security' },
  { id: 'insurance_deep_dive', name: 'Insurance Deep Dive', description: 'Umbrella policies, disability, gap coverage', icon: <Umbrella className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Home & Security' },
  
  // Finance Advanced (Second List)
  { id: 'retirement_strategy', name: 'Retirement Strategy', description: 'Withdrawal rates, Social Security, RMDs', icon: <PiggyBank className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Finance Advanced' },
  { id: 'global_banking', name: 'Global Banking Systems', description: 'SWIFT, central banks, fractional reserve', icon: <Building className="w-6 h-6" />, color: 'from-indigo-500/20 to-purple-500/20', category: 'Finance Advanced' },
  
  // Society & Culture (Second List)
  { id: 'genealogy_ancestry', name: 'Genealogy & Ancestry', description: 'Family trees, DNA tests, preserving history', icon: <Search className="w-6 h-6" />, color: 'from-amber-500/20 to-orange-500/20', category: 'Society & Culture' },
  { id: 'community_organizing', name: 'Community Organizing', description: 'Grassroots, petitions, mobilizing groups', icon: <UsersRound className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20', category: 'Society & Culture' },
  { id: 'crisis_communication', name: 'Crisis Communication', description: 'PR disasters, holding statements, reputation', icon: <Megaphone className="w-6 h-6" />, color: 'from-red-500/20 to-orange-500/20', category: 'Society & Culture' },
  { id: 'energy_markets', name: 'Energy Markets', description: 'Oil/gas prices, renewables, power grid', icon: <Zap className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Society & Culture' },
  { id: 'global_demographics', name: 'Global Demographics', description: 'Population aging, migration, birth rates', icon: <Users2 className="w-6 h-6" />, color: 'from-blue-500/20 to-cyan-500/20', category: 'Society & Culture' },
  
  // Travel & Transportation (Second List)
  { id: 'aviation_basics', name: 'Aviation Basics', description: 'How planes fly, airport codes, air traffic', icon: <Plane className="w-6 h-6" />, color: 'from-sky-500/20 to-blue-500/20', category: 'Travel & Transportation' },
  
  // Science & Learning (Second List)
  { id: 'linguistics_101', name: 'Linguistics 101', description: 'Language evolution, syntax, semantics, speech', icon: <Languages className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Science & Learning' },
  { id: 'archaeology', name: 'Archaeology', description: 'Excavation, carbon dating, ancient civilizations', icon: <Pickaxe className="w-6 h-6" />, color: 'from-amber-500/20 to-orange-500/20', category: 'Science & Learning' },
  { id: 'forensic_science', name: 'Forensic Science', description: 'Crime scenes, fingerprinting, DNA, digital forensics', icon: <Fingerprint className="w-6 h-6" />, color: 'from-red-500/20 to-rose-500/20', category: 'Science & Learning' },
  { id: 'anthropology', name: 'Anthropology', description: 'Human evolution, tribal behaviors, culture', icon: <Users className="w-6 h-6" />, color: 'from-orange-500/20 to-amber-500/20', category: 'Science & Learning' },
  
  // Business & Economics (Second List)
  { id: 'sports_business', name: 'Sports Business', description: 'Salary caps, franchise valuations, sponsorships', icon: <Trophy className="w-6 h-6" />, color: 'from-yellow-500/20 to-amber-500/20', category: 'Business & Economics' },
  { id: 'game_theory', name: 'Game Theory', description: 'Strategic decisions, Prisoner\'s Dilemma, Nash Equilibrium', icon: <Gamepad2 className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20', category: 'Business & Economics' },
  
  // Creative Skills (Second List)
  { id: 'photography_skills', name: 'Photography Skills', description: 'Rule of Thirds, ISO/shutter speed, mobile editing', icon: <Camera className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20', category: 'Creative Skills' },
];

const CATEGORIES = [
  'Money & Finance',
  'Home & Auto',
  'Tech & Digital',
  'World & Society',
  'Career & Work',
  'Health & Wellness',
  'Relationships & Family',
  'Lifestyle',
  'Learning & Thinking',
  'Survival & Skills',
  'Business & Management',
  'Communication & Skills',
  'Legal & Economics',
  'Life Management',
  'Leadership & Career',
  'Technology & Digital',
  'Home & Security',
  'Finance Advanced',
  'Society & Culture',
  'Travel & Transportation',
  'Science & Learning',
  'Business & Economics',
  'Creative Skills',
];

const Learn = () => {
  const [selectedTopic, setSelectedTopic] = useState<{ type: TopicType; name?: string } | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyLearnLoading, setDailyLearnLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTopicClick = async (topic: Topic) => {
    setLoading(true);
    try {
      // Use 'topic' type with the topic name for all 30 new topics
      const cards = await getFlashcards('topic', topic.name);
      
      // Validate flashcards before setting
      if (!cards || cards.length === 0) {
        throw new Error('No flashcards were generated. Please try again.');
      }
      
      setFlashcards(cards);
      setSelectedTopic({ type: 'topic', name: topic.name });
    } catch (error: any) {
      console.error('Error loading flashcards:', error);
      const errorMessage = error?.message || 'Failed to load flashcards. Please try again.';
      toast({
        title: 'Error Loading Flashcards',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
      // Reset state on error
      setSelectedTopic(null);
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyLearn = async () => {
    setDailyLearnLoading(true);
    try {
      const cards = await getFlashcards('daily_learn');
      
      if (!cards || cards.length === 0) {
        throw new Error('No flashcards were generated. Please try again.');
      }
      
      setFlashcards(cards);
      setSelectedTopic({ type: 'daily_learn' });
    } catch (error: any) {
      console.error('Error loading daily learn:', error);
      const errorMessage = error?.message || 'Failed to load daily learn. Please check your OpenAI API key and try again.';
      toast({
        title: 'Error Loading Daily Learn',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setDailyLearnLoading(false);
    }
  };

  const filteredTopics = selectedCategory 
    ? ALL_TOPICS.filter(t => t.category === selectedCategory)
    : ALL_TOPICS;

  if (selectedTopic && flashcards.length > 0) {
    return (
      <AnimatePresence>
        <FlashcardDeck
          flashcards={flashcards}
          title={selectedTopic.name || selectedTopic.type === 'daily_learn' ? 'Daily Learn' : selectedTopic.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          onComplete={() => {
            setSelectedTopic(null);
            setFlashcards([]);
          }}
          onClose={() => {
            setSelectedTopic(null);
            setFlashcards([]);
          }}
        />
      </AnimatePresence>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 mt-8"
        >
          <div className="inline-block mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Learn
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Daily micro-learning in fast, scrollable flashcards. No pressure. Just better thinking, every day.
          </p>
        </motion.div>

        {/* Daily Learn Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Card
            className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
            onClick={handleDailyLearn}
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Daily Learn
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  Today's biggest news, explained in 5 simple flashcards
                </p>
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={dailyLearnLoading}
                >
                  {dailyLearnLoading ? 'Loading...' : 'Start Learning'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All Topics
            </Button>
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Topic Library */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            {selectedCategory ? `${selectedCategory} Topics` : 'Topic Library'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card
                  className={`p-5 bg-gradient-to-br ${topic.color} backdrop-blur-md border border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden h-full`}
                  onClick={() => handleTopicClick(topic)}
                >
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="p-2 bg-background/50 rounded-lg w-fit backdrop-blur-sm mb-3">
                      {topic.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      {topic.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground group-hover:text-foreground group-hover:bg-background/20 transition-all w-full mt-auto"
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Learn'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
    </Layout>
  );
};

export default Learn;
