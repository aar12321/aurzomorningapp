import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Flashcard {
  front: string;
  back: string;
  order: number;
}

// Topic-specific prompt configurations
const TOPIC_PROMPTS: Record<string, { system: string; user: string }> = {
  'Personal Finance': {
    system: `You are a personal finance educator. Create 5 daily flashcards teaching practical money management skills.`,
    user: `Create 5 flashcards about Personal Finance covering: budgeting methods, understanding credit scores, managing debt, and banking basics. Each card should teach ONE practical concept that people can use today. Make it clear, actionable, and easy to understand.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Investing 101': {
    system: `You are an investment educator. Create 5 daily flashcards teaching investing fundamentals.`,
    user: `Create 5 flashcards about Investing 101 covering: how the stock market works, 401(k)s/IRAs explained, crypto basics, and risk management. Each card should teach ONE practical concept. Keep it beginner-friendly and actionable.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Taxes & Insurance': {
    system: `You are a tax and insurance educator. Create 5 daily flashcards teaching practical tax and insurance knowledge.`,
    user: `Create 5 flashcards about Taxes & Insurance covering: understanding tax brackets, common deductions, health insurance terms, and filing basics. Each card should teach ONE practical concept that helps people navigate taxes and insurance.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Real Estate Smarts': {
    system: `You are a real estate educator. Create 5 daily flashcards teaching practical real estate knowledge.`,
    user: `Create 5 flashcards about Real Estate covering: renting vs. buying, understanding mortgages, tenant rights, and property maintenance. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Car Maintenance': {
    system: `You are an automotive educator. Create 5 daily flashcards teaching practical car maintenance skills.`,
    user: `Create 5 flashcards about Car Maintenance covering: changing a tire, understanding dashboard lights, oil change schedules, and buying/leasing tips. Each card should teach ONE practical skill or concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Home Repair DIY': {
    system: `You are a home repair educator. Create 5 daily flashcards teaching practical DIY home repair skills.`,
    user: `Create 5 flashcards about Home Repair DIY covering: fixing leaky faucets, patching drywall, basic electrical safety, and using power tools. Each card should teach ONE practical skill with clear, safe instructions.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Digital Security': {
    system: `You are a cybersecurity educator. Create 5 daily flashcards teaching practical digital security skills.`,
    user: `Create 5 flashcards about Digital Security covering: password management, spotting phishing scams, two-factor authentication, and data privacy. Each card should teach ONE practical security concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Tech Trends': {
    system: `You are a technology educator. Create 5 daily flashcards explaining current tech trends and innovations.`,
    user: `Create 5 flashcards about Tech Trends covering: updates on AI (Artificial Intelligence), new smart home gadgets, and emerging software tools. Each card should explain ONE current trend or technology in simple terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Global Affairs': {
    system: `You are a world affairs educator. Create 5 daily flashcards explaining current global events and international relations.`,
    user: `Create 5 flashcards about Global Affairs covering: breakdowns of current geopolitical conflicts, international trade basics, and world summits. Each card should explain ONE concept in neutral, clear terms. Avoid political bias.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Civics & Government': {
    system: `You are a civics educator. Create 5 daily flashcards teaching how government and citizenship work.`,
    user: `Create 5 flashcards about Civics & Government covering: how local elections work, understanding the justice system, and basic citizen rights. Each card should teach ONE practical concept about how government functions.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Media Literacy': {
    system: `You are a media literacy educator. Create 5 daily flashcards teaching critical thinking about media and information.`,
    user: `Create 5 flashcards about Media Literacy covering: how to spot fake news, understanding bias in reporting, and fact-checking sources. Each card should teach ONE practical skill for evaluating information.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Modern Etiquette': {
    system: `You are an etiquette educator. Create 5 daily flashcards teaching modern social and professional etiquette.`,
    user: `Create 5 flashcards about Modern Etiquette covering: email professionalism, tipping rules, wedding guest protocols, and digital communication manners. Each card should teach ONE practical etiquette concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Job Hunting': {
    system: `You are a career coach. Create 5 daily flashcards teaching practical job hunting skills.`,
    user: `Create 5 flashcards about Job Hunting covering: resume optimization, cover letter writing, interview preparation, and salary negotiation. Each card should teach ONE practical job search skill.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Office Politics': {
    system: `You are a workplace dynamics educator. Create 5 daily flashcards teaching how to navigate office politics professionally.`,
    user: `Create 5 flashcards about Office Politics covering: navigating hierarchy, dealing with difficult coworkers, and effective meeting strategies. Each card should teach ONE practical workplace skill. Keep it professional and constructive.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Productivity Hacks': {
    system: `You are a productivity coach. Create 5 daily flashcards teaching practical productivity techniques.`,
    user: `Create 5 flashcards about Productivity Hacks covering: time-blocking techniques, software shortcuts (Excel/Google Sheets), and focus management. Each card should teach ONE practical productivity method.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Health & Wellness': {
    system: `You are a health and wellness educator. Create 5 daily flashcards teaching practical health knowledge.`,
    user: `Create 5 flashcards about Health & Wellness covering: nutrition label reading, sleep hygiene, stress management, and ergonomic desk setups. Each card should teach ONE practical health concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'First Aid & Safety': {
    system: `You are a first aid and safety educator. Create 5 daily flashcards teaching essential safety and first aid skills.`,
    user: `Create 5 flashcards about First Aid & Safety covering: CPR basics, treating burns/cuts, building emergency kits, and fire safety. Each card should teach ONE practical safety skill. Include clear, actionable instructions.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Relationship Skills': {
    system: `You are a relationship educator. Create 5 daily flashcards teaching practical relationship and communication skills.`,
    user: `Create 5 flashcards about Relationship Skills covering: active listening, conflict resolution, understanding attachment styles, and boundary setting. Each card should teach ONE practical relationship concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Parenting & Family': {
    system: `You are a family life educator. Create 5 daily flashcards teaching practical parenting and family management skills.`,
    user: `Create 5 flashcards about Parenting & Family covering: child development milestones, navigating elder care, and family financial planning. Each card should teach ONE practical family concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Sustainable Living': {
    system: `You are an environmental educator. Create 5 daily flashcards teaching practical sustainable living practices.`,
    user: `Create 5 flashcards about Sustainable Living covering: recycling rules, energy-saving home tips, reducing plastic, and eco-friendly shopping. Each card should teach ONE practical environmental action.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Travel Intelligence': {
    system: `You are a travel educator. Create 5 daily flashcards teaching practical travel skills and tips.`,
    user: `Create 5 flashcards about Travel Intelligence covering: maximizing credit card points/miles, visa requirements, packing hacks, and solo travel safety. Each card should teach ONE practical travel concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Beverage Connoisseur': {
    system: `You are a beverage educator. Create 5 daily flashcards teaching about coffee, wine, beer, and cocktails.`,
    user: `Create 5 flashcards about Beverage Connoisseur covering: coffee brewing methods, wine pairing basics, craft beer styles, and cocktail mixing. Each card should teach ONE practical beverage concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Cooking Techniques': {
    system: `You are a cooking instructor. Create 5 daily flashcards teaching fundamental cooking techniques.`,
    user: `Create 5 flashcards about Cooking Techniques covering: knife skills, mastering heat control, flavor profiling, and meal prepping strategies. Each card should teach ONE practical cooking technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Science Breakthroughs': {
    system: `You are a science educator. Create 5 daily flashcards explaining recent scientific discoveries and breakthroughs.`,
    user: `Create 5 flashcards about Science Breakthroughs covering: updates on space exploration, medical advancements, and renewable energy technologies. Each card should explain ONE scientific concept in simple, accessible terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Psychology Basics': {
    system: `You are a psychology educator. Create 5 daily flashcards teaching fundamental psychology concepts.`,
    user: `Create 5 flashcards about Psychology Basics covering: cognitive biases, habit formation, behavioral economics, and understanding personality types. Each card should teach ONE psychology concept in practical terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Logical Thinking': {
    system: `You are a critical thinking educator. Create 5 daily flashcards teaching logical reasoning and debate skills.`,
    user: `Create 5 flashcards about Logical Thinking covering: identifying logical fallacies, debate skills, and mental models for decision-making. Each card should teach ONE logical reasoning concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'History Context': {
    system: `You are a history educator. Create 5 daily flashcards explaining historical context for modern events.`,
    user: `Create 5 flashcards about History Context explaining "Why things are the way they are" - background on modern borders, conflicts, and alliances. Each card should explain ONE historical concept that helps understand the present.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Interior Design': {
    system: `You are an interior design educator. Create 5 daily flashcards teaching practical interior design principles.`,
    user: `Create 5 flashcards about Interior Design covering: layout rules for small spaces, color theory, lighting basics, and furniture selection. Each card should teach ONE practical design concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Gardening & Plants': {
    system: `You are a gardening educator. Create 5 daily flashcards teaching practical plant care and gardening skills.`,
    user: `Create 5 flashcards about Gardening & Plants covering: caring for houseplants, growing herbs, lawn maintenance, and soil basics. Each card should teach ONE practical gardening concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Survival Skills': {
    system: `You are a survival skills educator. Create 5 daily flashcards teaching essential survival and preparedness skills.`,
    user: `Create 5 flashcards about Survival Skills covering: wilderness basics, reading a compass, water purification, and urban survival preparedness. Each card should teach ONE practical survival skill with clear instructions.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Business & Management (First List)
  'Project Management': {
    system: `You are a project management educator. Create 5 daily flashcards teaching practical project management skills.`,
    user: `Create 5 flashcards about Project Management covering: understanding Agile, managing timelines, resource allocation, and using tools like Trello/Asana. Each card should teach ONE practical project management concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Data Literacy': {
    system: `You are a data literacy educator. Create 5 daily flashcards teaching how to read and interpret data.`,
    user: `Create 5 flashcards about Data Literacy covering: how to read charts/graphs, understanding statistics, and avoiding "lying with data." Each card should teach ONE practical data interpretation skill.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Business Writing': {
    system: `You are a business writing educator. Create 5 daily flashcards teaching professional writing skills.`,
    user: `Create 5 flashcards about Business Writing covering: writing clear memos, structuring reports, persuasive copywriting, and editing for brevity. Each card should teach ONE practical writing technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Marketing & Branding': {
    system: `You are a marketing educator. Create 5 daily flashcards teaching marketing and branding fundamentals.`,
    user: `Create 5 flashcards about Marketing & Branding covering: the "4 Ps" of marketing, understanding target audiences, and building a personal brand. Each card should teach ONE practical marketing concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Sales Psychology': {
    system: `You are a sales educator. Create 5 daily flashcards teaching sales psychology and techniques.`,
    user: `Create 5 flashcards about Sales Psychology covering: persuasion techniques, closing strategies, overcoming objections, and the sales funnel. Each card should teach ONE practical sales concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Strategic Planning': {
    system: `You are a strategic planning educator. Create 5 daily flashcards teaching strategic thinking and planning.`,
    user: `Create 5 flashcards about Strategic Planning covering: setting OKRs (Objectives and Key Results), SWOT analysis, and long-term visioning. Each card should teach ONE practical strategic planning concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Remote Work Mastery': {
    system: `You are a remote work educator. Create 5 daily flashcards teaching effective remote work practices.`,
    user: `Create 5 flashcards about Remote Work Mastery covering: asynchronous communication, managing time zones, and home office ergonomics. Each card should teach ONE practical remote work skill.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Small Business Basics': {
    system: `You are a small business educator. Create 5 daily flashcards teaching small business fundamentals.`,
    user: `Create 5 flashcards about Small Business Basics covering: setting up an LLC, invoicing, quarterly taxes, and separating personal/business finances. Each card should teach ONE practical small business concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Event Planning': {
    system: `You are an event planning educator. Create 5 daily flashcards teaching event planning skills.`,
    user: `Create 5 flashcards about Event Planning covering: logistics for corporate or social events, vendor management, and budgeting strategies. Each card should teach ONE practical event planning concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Artificial Intelligence Ethics': {
    system: `You are an AI ethics educator. Create 5 daily flashcards teaching responsible AI usage.`,
    user: `Create 5 flashcards about Artificial Intelligence Ethics covering: understanding bias in AI, copyright issues with generative AI, and responsible usage. Each card should teach ONE practical AI ethics concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Communication & Skills (First List)
  'Public Speaking': {
    system: `You are a public speaking coach. Create 5 daily flashcards teaching public speaking skills.`,
    user: `Create 5 flashcards about Public Speaking covering: overcoming stage fright, vocal projection, storytelling structures, and presentation slide design. Each card should teach ONE practical public speaking technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Emotional Intelligence (EQ)': {
    system: `You are an emotional intelligence educator. Create 5 daily flashcards teaching EQ skills.`,
    user: `Create 5 flashcards about Emotional Intelligence (EQ) covering: self-regulation, empathy in the workplace, and reading room dynamics. Each card should teach ONE practical emotional intelligence concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Negotiation Tactics': {
    system: `You are a negotiation educator. Create 5 daily flashcards teaching negotiation skills.`,
    user: `Create 5 flashcards about Negotiation Tactics covering: salary negotiation, contract bargaining, and "win-win" strategies. Each card should teach ONE practical negotiation technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Creative Problem Solving': {
    system: `You are a creative problem-solving educator. Create 5 daily flashcards teaching innovative thinking.`,
    user: `Create 5 flashcards about Creative Problem Solving covering: design thinking principles, lateral thinking puzzles, and brainstorming techniques. Each card should teach ONE practical problem-solving method.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Adaptability & Resilience': {
    system: `You are a resilience educator. Create 5 daily flashcards teaching adaptability and resilience.`,
    user: `Create 5 flashcards about Adaptability & Resilience covering: managing change, "grit," and bouncing back from professional failure. Each card should teach ONE practical resilience concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Cross-Cultural Communication': {
    system: `You are a cross-cultural communication educator. Create 5 daily flashcards teaching cultural awareness.`,
    user: `Create 5 flashcards about Cross-Cultural Communication covering: navigating international business norms, cultural sensitivity, and global etiquette. Each card should teach ONE practical cross-cultural concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Mentorship & Coaching': {
    system: `You are a mentorship educator. Create 5 daily flashcards teaching mentorship and coaching skills.`,
    user: `Create 5 flashcards about Mentorship & Coaching covering: how to find a mentor, how to be a mentor, and giving constructive feedback. Each card should teach ONE practical mentorship concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Conflict De-escalation': {
    system: `You are a conflict resolution educator. Create 5 daily flashcards teaching de-escalation techniques.`,
    user: `Create 5 flashcards about Conflict De-escalation covering: specific techniques for lowering tension in heated arguments (customer service or personal). Each card should teach ONE practical de-escalation technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Learning to Learn': {
    system: `You are a meta-learning educator. Create 5 daily flashcards teaching learning strategies.`,
    user: `Create 5 flashcards about Learning to Learn covering: meta-learning strategies, memory palaces, and speed-reading techniques. Each card should teach ONE practical learning method.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Decision Making': {
    system: `You are a decision-making educator. Create 5 daily flashcards teaching effective decision-making.`,
    user: `Create 5 flashcards about Decision Making covering: using decision matrices, weighing pros/cons effectively, and overcoming analysis paralysis. Each card should teach ONE practical decision-making technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Legal & Economics (First List)
  'Legal Life Skills': {
    system: `You are a legal educator. Create 5 daily flashcards teaching practical legal knowledge.`,
    user: `Create 5 flashcards about Legal Life Skills covering: basics of wills, power of attorney, reading contracts, and intellectual property. Each card should teach ONE practical legal concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Macroeconomics': {
    system: `You are an economics educator. Create 5 daily flashcards teaching macroeconomic concepts.`,
    user: `Create 5 flashcards about Macroeconomics covering: understanding inflation, interest rates, GDP, and how the Fed impacts your wallet. Each card should explain ONE macroeconomic concept in simple terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Supply Chain Basics': {
    system: `You are a supply chain educator. Create 5 daily flashcards teaching supply chain fundamentals.`,
    user: `Create 5 flashcards about Supply Chain Basics covering: how global trade works, shipping logistics, and why shortages happen. Each card should explain ONE supply chain concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Consumer Rights': {
    system: `You are a consumer rights educator. Create 5 daily flashcards teaching consumer protection.`,
    user: `Create 5 flashcards about Consumer Rights covering: warranty laws, return policies, small claims court basics, and fighting unfair charges. Each card should teach ONE practical consumer rights concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Life Management (First List)
  'Pet Ownership': {
    system: `You are a pet care educator. Create 5 daily flashcards teaching pet ownership skills.`,
    user: `Create 5 flashcards about Pet Ownership covering: training basics, pet health insurance, nutrition, and understanding vet bills. Each card should teach ONE practical pet care concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Moving & Logistics': {
    system: `You are a moving logistics educator. Create 5 daily flashcards teaching moving skills.`,
    user: `Create 5 flashcards about Moving & Logistics covering: packing strategies, hiring movers vs DIY, lease breaking, and address changing. Each card should teach ONE practical moving concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Wardrobe Maintenance': {
    system: `You are a wardrobe care educator. Create 5 daily flashcards teaching clothing maintenance.`,
    user: `Create 5 flashcards about Wardrobe Maintenance covering: understanding fabric types, ironing/steaming, sewing buttons, and shoe care. Each card should teach ONE practical wardrobe care skill.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Urban Planning': {
    system: `You are an urban planning educator. Create 5 daily flashcards teaching urban planning concepts.`,
    user: `Create 5 flashcards about Urban Planning covering: how cities are designed, zoning laws, public transit systems, and gentrification. Each card should explain ONE urban planning concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Mental Health Awareness': {
    system: `You are a mental health educator. Create 5 daily flashcards teaching mental health awareness.`,
    user: `Create 5 flashcards about Mental Health Awareness covering: recognizing burnout, supporting colleagues/friends in crisis, and destigmatizing therapy. Each card should teach ONE practical mental health concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Charity & Philanthropy': {
    system: `You are a philanthropy educator. Create 5 daily flashcards teaching charitable giving.`,
    user: `Create 5 flashcards about Charity & Philanthropy covering: how to vet non-profits, tax implications of donating, and effective altruism. Each card should teach ONE practical philanthropy concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Leadership & Career (Second List)
  'Networking Strategy': {
    system: `You are a networking educator. Create 5 daily flashcards teaching professional networking.`,
    user: `Create 5 flashcards about Networking Strategy covering: building professional circles, mastering LinkedIn, and maintaining business relationships. Each card should teach ONE practical networking technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Leadership Fundamentals': {
    system: `You are a leadership educator. Create 5 daily flashcards teaching leadership skills.`,
    user: `Create 5 flashcards about Leadership Fundamentals covering: inspiring teams, delegation techniques, servant leadership, and motivating others. Each card should teach ONE practical leadership concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Freelancing & Gig Work': {
    system: `You are a freelancing educator. Create 5 daily flashcards teaching freelance work skills.`,
    user: `Create 5 flashcards about Freelancing & Gig Work covering: navigating platforms like Upwork, setting freelance rates, and managing client contracts. Each card should teach ONE practical freelancing concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Hiring & Recruiting': {
    system: `You are a recruiting educator. Create 5 daily flashcards teaching hiring and recruiting skills.`,
    user: `Create 5 flashcards about Hiring & Recruiting covering: how to interview candidates, spotting red flags in resumes, and onboarding new staff. Each card should teach ONE practical recruiting technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Meeting Facilitation': {
    system: `You are a meeting facilitation educator. Create 5 daily flashcards teaching effective meeting management.`,
    user: `Create 5 flashcards about Meeting Facilitation covering: running effective agendas, keeping discussions on time, and managing dominant personalities. Each card should teach ONE practical facilitation technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Video Content Creation': {
    system: `You are a video production educator. Create 5 daily flashcards teaching video creation skills.`,
    user: `Create 5 flashcards about Video Content Creation covering: basic video editing, lighting for Zoom calls, and framing for social media or presentations. Each card should teach ONE practical video production technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Humor at Work': {
    system: `You are a workplace communication educator. Create 5 daily flashcards teaching appropriate workplace humor.`,
    user: `Create 5 flashcards about Humor at Work covering: using wit to build rapport, appropriate boundaries, and defusing tension with humor. Each card should teach ONE practical humor concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Customer Experience (CX)': {
    system: `You are a customer experience educator. Create 5 daily flashcards teaching CX principles.`,
    user: `Create 5 flashcards about Customer Experience (CX) covering: mapping user journeys, understanding customer satisfaction metrics (NPS), and service design. Each card should teach ONE practical CX concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Receiving Feedback': {
    system: `You are a feedback educator. Create 5 daily flashcards teaching how to receive feedback effectively.`,
    user: `Create 5 flashcards about Receiving Feedback covering: handling criticism without defensiveness, processing advice, and actionable growth. Each card should teach ONE practical feedback reception technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Technology & Digital (Second List)
  'Cloud Computing Basics': {
    system: `You are a cloud computing educator. Create 5 daily flashcards teaching cloud fundamentals.`,
    user: `Create 5 flashcards about Cloud Computing Basics covering: understanding "The Cloud" (AWS/Azure), cloud storage security, and SaaS models. Each card should explain ONE cloud computing concept in simple terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Blockchain Technology': {
    system: `You are a blockchain educator. Create 5 daily flashcards teaching blockchain fundamentals.`,
    user: `Create 5 flashcards about Blockchain Technology covering: how digital ledgers work, understanding NFTs beyond the hype, and decentralized finance. Each card should explain ONE blockchain concept in accessible terms.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Identity Theft Protection': {
    system: `You are a cybersecurity educator. Create 5 daily flashcards teaching identity protection.`,
    user: `Create 5 flashcards about Identity Theft Protection covering: freezing credit reports, monitoring for fraud, and steps to take if your data is breached. Each card should teach ONE practical identity protection step.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Home & Security (Second List)
  'Home Security Systems': {
    system: `You are a home security educator. Create 5 daily flashcards teaching home security.`,
    user: `Create 5 flashcards about Home Security Systems covering: smart locks, camera placement strategies, monitoring services, and physical home safety. Each card should teach ONE practical security concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Defensive Driving': {
    system: `You are a driving safety educator. Create 5 daily flashcards teaching defensive driving.`,
    user: `Create 5 flashcards about Defensive Driving covering: accident avoidance techniques, handling hazardous weather, and managing road rage. Each card should teach ONE practical driving safety technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Insurance Deep Dive': {
    system: `You are an insurance educator. Create 5 daily flashcards teaching advanced insurance concepts.`,
    user: `Create 5 flashcards about Insurance Deep Dive covering: understanding umbrella policies, disability insurance, and gap coverage for vehicles. Each card should explain ONE insurance concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Finance Advanced (Second List)
  'Retirement Strategy': {
    system: `You are a retirement planning educator. Create 5 daily flashcards teaching retirement strategies.`,
    user: `Create 5 flashcards about Retirement Strategy covering: safe withdrawal rates, Social Security timing, and required minimum distributions (RMDs). Each card should teach ONE practical retirement planning concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Global Banking Systems': {
    system: `You are a banking educator. Create 5 daily flashcards teaching global banking.`,
    user: `Create 5 flashcards about Global Banking Systems covering: how international money moves (SWIFT), central banks, and fractional reserve banking. Each card should explain ONE banking concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Society & Culture (Second List)
  'Genealogy & Ancestry': {
    system: `You are a genealogy educator. Create 5 daily flashcards teaching family history research.`,
    user: `Create 5 flashcards about Genealogy & Ancestry covering: tracing family trees, understanding DNA test results, and preserving family history. Each card should teach ONE practical genealogy technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Community Organizing': {
    system: `You are a community organizing educator. Create 5 daily flashcards teaching grassroots organizing.`,
    user: `Create 5 flashcards about Community Organizing covering: grassroots campaigning, creating petitions, and mobilizing local groups for a cause. Each card should teach ONE practical organizing technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Crisis Communication': {
    system: `You are a crisis communication educator. Create 5 daily flashcards teaching crisis management.`,
    user: `Create 5 flashcards about Crisis Communication covering: managing public relations disasters, writing holding statements, and reputation repair. Each card should teach ONE practical crisis communication technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Energy Markets': {
    system: `You are an energy markets educator. Create 5 daily flashcards teaching energy economics.`,
    user: `Create 5 flashcards about Energy Markets covering: how oil/gas prices are set, the transition to renewables, and understanding the power grid. Each card should explain ONE energy market concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Global Demographics': {
    system: `You are a demographics educator. Create 5 daily flashcards teaching demographic trends.`,
    user: `Create 5 flashcards about Global Demographics covering: population aging, migration trends, birth rate shifts, and their economic impact. Each card should explain ONE demographic concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Travel & Transportation (Second List)
  'Aviation Basics': {
    system: `You are an aviation educator. Create 5 daily flashcards teaching aviation fundamentals.`,
    user: `Create 5 flashcards about Aviation Basics covering: how planes fly, understanding airport codes, air traffic control, and travel logistics. Each card should explain ONE aviation concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Science & Learning (Second List)
  'Linguistics 101': {
    system: `You are a linguistics educator. Create 5 daily flashcards teaching language science.`,
    user: `Create 5 flashcards about Linguistics 101 covering: how languages evolve, syntax vs. semantics, and the science of human speech. Each card should explain ONE linguistics concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Archaeology': {
    system: `You are an archaeology educator. Create 5 daily flashcards teaching archaeological methods.`,
    user: `Create 5 flashcards about Archaeology covering: understanding excavation, carbon dating, ancient civilizations, and preserving ruins. Each card should explain ONE archaeological concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Forensic Science': {
    system: `You are a forensic science educator. Create 5 daily flashcards teaching forensic methods.`,
    user: `Create 5 flashcards about Forensic Science covering: crime scene basics, fingerprinting technology, DNA profiling, and digital forensics. Each card should explain ONE forensic science concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Anthropology': {
    system: `You are an anthropology educator. Create 5 daily flashcards teaching anthropological concepts.`,
    user: `Create 5 flashcards about Anthropology covering: human evolution, understanding tribal behaviors, and the study of cultural development. Each card should explain ONE anthropology concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Business & Economics (Second List)
  'Sports Business': {
    system: `You are a sports business educator. Create 5 daily flashcards teaching sports economics.`,
    user: `Create 5 flashcards about Sports Business covering: salary caps, franchise valuations, sponsorship deals, and the economics of major leagues. Each card should explain ONE sports business concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  'Game Theory': {
    system: `You are a game theory educator. Create 5 daily flashcards teaching strategic decision making.`,
    user: `Create 5 flashcards about Game Theory covering: strategic decision making, the Prisoner's Dilemma, Nash Equilibrium, and competitive strategy. Each card should explain ONE game theory concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  },
  // Creative Skills (Second List)
  'Photography Skills': {
    system: `You are a photography educator. Create 5 daily flashcards teaching photography fundamentals.`,
    user: `Create 5 flashcards about Photography Skills covering: composition (Rule of Thirds), understanding ISO/Shutter Speed, and mobile photo editing. Each card should teach ONE practical photography technique.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { topicType, topicName, newsArticles } = body
    
    console.log('[Edge Function] Received request:', { topicType, topicName, hasNews: !!newsArticles })
    
    if (!topicType) {
      return new Response(JSON.stringify({ error: 'topicType is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('[Edge Function] OPENAI_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'OpenAI API key is not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    let systemPrompt = ''
    let userPrompt = ''

    switch (topicType) {
      case 'daily_learn':
        if (newsArticles && newsArticles.length > 0) {
          systemPrompt = `You are an educational content creator. Convert today's news into 5 simple, clear flashcards that help people understand what happened, why it matters, and how it affects their lives. Keep each card focused on ONE idea. Be neutral, practical, and avoid political bias.`
          userPrompt = `Create 5 flashcards from these news articles:\n\n${newsArticles.map((a: any, i: number) => `${i + 1}. ${a.title}\n${a.summary || ''}`).join('\n\n')}\n\nCard 1: Headline simplified\nCard 2: What actually happened (plain English)\nCard 3: Why people should care\nCard 4: How this could affect you\nCard 5: One smart insight or question to think about\n\nReturn a JSON object with a "flashcards" array containing objects with "front", "back", and "order" fields:\n{"flashcards": [{"front": "Card 1 front text", "back": "Card 1 back text", "order": 1}, ...]}`
        } else {
          systemPrompt = `You are an educational content creator. Create 5 simple, clear flashcards about today's most important topics.`
          userPrompt = `Create 5 flashcards about today's most important topics.\n\nReturn a JSON object: {"flashcards": [{"front": "Question", "back": "Answer", "order": 1}, ...]}`
        }
        break
      case 'life':
        systemPrompt = `You are a life skills educator. Create 5 daily flashcards teaching practical life skills.`
        userPrompt = `Create 5 flashcards about ${topicName || 'life skills'}. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
        break
      case 'work_money':
        systemPrompt = `You are a career and finance educator. Create 5 flashcards teaching practical work and money skills.`
        userPrompt = `Create 5 flashcards about ${topicName || 'work and money'}. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
        break
      case 'world_society':
        systemPrompt = `You are a world affairs educator. Create 5 flashcards explaining how the world works.`
        userPrompt = `Create 5 flashcards about ${topicName || 'world and society'}. Each card should explain ONE concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
        break
      case 'self_growth':
        systemPrompt = `You are a personal development coach. Create 5 flashcards teaching self-improvement concepts.`
        userPrompt = `Create 5 flashcards about ${topicName || 'self-growth'}. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
        break
      case 'cooking':
        const recipeNames = ['Garlic Butter Chicken', 'Simple Pasta Aglio e Olio', 'Perfect Scrambled Eggs', 'Basic Stir Fry', 'One-Pan Salmon']
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
        const dailyRecipe = recipeNames[dayOfYear % recipeNames.length]
        systemPrompt = `You are a cooking instructor. Create 5 flashcards for a daily recipe. Each card is ONE step.`
        userPrompt = `Create 5 flashcards for today's recipe: ${dailyRecipe}. Each card should be ONE step.\n\nReturn a JSON object: {"flashcards": [{"front": "Step title", "back": "Detailed step instructions", "order": 1}, ...]}`
        break
      case 'topic':
        // Handle all 30 specific topics
        if (topicName && TOPIC_PROMPTS[topicName]) {
          const topicConfig = TOPIC_PROMPTS[topicName]
          systemPrompt = topicConfig.system
          userPrompt = topicConfig.user
        } else {
          // Fallback for unknown topics
          systemPrompt = `You are an educational content creator. Create 5 daily flashcards teaching practical knowledge.`
          userPrompt = `Create 5 flashcards about ${topicName || 'this topic'}. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
        }
        break
      default:
        // Generic fallback
        systemPrompt = `You are an educational content creator. Create 5 daily flashcards teaching practical knowledge.`
        userPrompt = `Create 5 flashcards about ${topicName || 'this topic'}. Each card should teach ONE practical concept.\n\nReturn a JSON object: {"flashcards": [{"front": "Question or concept", "back": "Explanation or answer", "order": 1}, ...]}`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from OpenAI')

    const parsed = JSON.parse(response)
    const flashcards = parsed.flashcards || []

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcard format')
    }

    const formatted = flashcards.map((card: any, index: number) => ({
      front: card.front || card.question || card.title || '',
      back: card.back || card.answer || card.explanation || card.content || '',
      order: card.order || index + 1
    })).slice(0, 5)

    return new Response(JSON.stringify({ flashcards: formatted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Error generating flashcards:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
