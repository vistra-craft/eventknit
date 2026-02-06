#!/usr/bin/env node

/**
 * Comprehensive script to seed 20+ events with full details
 * - Complete agenda with speakers
 * - Social links
 * - Sponsors and exhibitors
 * - Mix of free/paid events
 * - Mix of in-person/virtual/hybrid events
 * - Uses local images from eventknit/images folder and Unsplash URLs
 * - All events start with PENDING status (require admin approval)
 * 
 * Usage: node scripts/seed-comprehensive-events.js
 */

import { PrismaClient, EventStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const env = process.env.NODE_ENV || 'production';
const envPath = path.resolve(__dirname, '..', `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config();

const prisma = new PrismaClient({
  log: ['error'],
});

// Unsplash image URLs - using photos from eventknit/images folder (converted to URLs)
// Format: photo ID extracted from original filename
const UNSPLASH_IMAGES = [
  'hzgs56Ze49s', // anthony-delanoix - Concert/crowd
  'dEjMN6JXcj8', // md-duran - Conference speaker
  'V8KOZEUTx9E', // product-school - Presentation
  'yDSe7sggb9Q', // quan-nguyen - Tech event
  'YRMWVcdyhmI', // dom-fou - Outdoor event
  'PAykYb-8Er8', // ian-schneider - Motivational
  '-GajrOEN6m4', // product-school - Workshop
  'ZhQCZjr9fHo', // aditya-chinchure - Nature/outdoor
  'RfiBK6Y_upQ', // miguel-henriques - Music/concert
  '4MWTlpP951U', // iker-urteaga - Food event
  '-8atMWER8bI', // miguel-henriques - DJ/music
  'NYrVisodQ2M', // yvette-de-wit - Concert crowd
  'vrkSVpOwchk', // gaelle-marcel - Festival
  'NcdG9mK3PBY', // nainoa-shizuru - Sports/running
  '4jtHJX4SNk8', // product-school - Business
  'aQWmCH_b3MU', // marc-babin - Outdoor festival
];

// Additional diverse Unsplash images for variety
const ADDITIONAL_IMAGES = [
  'photo-1540575467063-178a50c2df87', // Tech conference
  'photo-1505373877841-8d25f7d46678', // Business meeting
  'photo-1511578314322-379afb476865', // Music concert
  'photo-1523580494863-6f3031224c94', // Workshop
  'photo-1475721027785-f74eccf877e2', // Outdoor event
  'photo-1515187029135-18ee286d815b', // Art gallery
  'photo-1464047736614-af63643285bf', // Food festival
  'photo-1492684223066-81342ee5ff30', // Running event
  'photo-1517457373958-b7bdd4587205', // Conference
  'photo-1542744173-8e7e53415bb0', // Tech event
];

// Helper to get Unsplash image URL
const getImageUrl = (index) => {
  // Alternate between the two image sets for variety
  if (index % 2 === 0) {
    const photoId = UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length];
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
  } else {
    const photoId = ADDITIONAL_IMAGES[index % ADDITIONAL_IMAGES.length];
    return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;
  }
};

const eventTemplates = [
  {
    title: "Future of AI & Robotics Summit 2026",
    category: "Technology",
    description: "Explore cutting-edge developments in artificial intelligence and robotics with industry pioneers.",
    fullDescription: "Join us for an immersive exploration of AI and robotics. This summit brings together researchers, engineers, and business leaders to discuss the latest breakthroughs in machine learning, autonomous systems, and human-robot interaction. Network with innovators and witness live demonstrations of next-generation technology.",
    venue: "Silicon Valley Convention Center",
    location: "San Jose, CA, USA",
    price: 399.00,
    capacity: 800,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["AI", "Robotics", "Technology", "Innovation", "Machine Learning"],
    socialLinks: {
      website: "https://airoboticsummit.com",
      twitter: "https://twitter.com/airoboticsummit",
      linkedin: "https://linkedin.com/company/ai-robotics-summit",
      instagram: "https://instagram.com/airoboticsummit"
    },
    speakers: [
      {
        name: "Dr. Emily Zhang",
        title: "Chief AI Officer at TechFuture",
        bio: "Leading expert in neural networks with 20+ years of experience in AI research and development.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
      },
      {
        name: "Prof. Marcus Williams",
        title: "Robotics Professor at MIT",
        bio: "Pioneer in autonomous robotics and winner of multiple innovation awards.",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Registration & Welcome Coffee",
        description: "Check-in and networking with attendees",
        startTime: "08:00",
        endTime: "09:00",
        speakers: []
      },
      {
        title: "Keynote: The AI Revolution",
        description: "Opening keynote on the transformation of industries through AI",
        startTime: "09:00",
        endTime: "10:30",
        speakers: ["Dr. Emily Zhang"]
      },
      {
        title: "Workshop: Building Autonomous Systems",
        description: "Hands-on workshop on creating self-learning robots",
        startTime: "11:00",
        endTime: "13:00",
        speakers: ["Prof. Marcus Williams"]
      },
      {
        title: "Lunch & Networking",
        description: "Catered lunch with networking opportunities",
        startTime: "13:00",
        endTime: "14:30",
        speakers: []
      },
      {
        title: "Panel: Ethics in AI Development",
        description: "Discussion on responsible AI and ethical considerations",
        startTime: "14:30",
        endTime: "16:00",
        speakers: ["Dr. Emily Zhang", "Prof. Marcus Williams"]
      }
    ],
    sponsors: [
      { name: "TechCorp Global", level: "Platinum" },
      { name: "Innovation Labs", level: "Gold" }
    ],
    exhibitors: [
      { name: "RoboTech Inc", description: "Next-gen robotics solutions", booth: "A1" },
      { name: "AI Dynamics", description: "Enterprise AI platforms", booth: "A2" }
    ]
  },
  {
    title: "Global Climate Action Conference",
    category: "Environment",
    description: "Unite with world leaders, scientists, and activists to combat climate change.",
    fullDescription: "This conference brings together policymakers, environmental scientists, and climate activists from around the globe. Discuss actionable strategies for reducing carbon emissions, protecting biodiversity, and building sustainable communities. Participate in workshops, hear from keynote speakers, and join the movement for a greener planet.",
    venue: "Copenhagen Conference Center",
    location: "Copenhagen, Denmark",
    price: 0,
    capacity: 1200,
    isFree: true,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Climate", "Environment", "Sustainability", "Green Energy", "Conservation"],
    socialLinks: {
      website: "https://climateaction2026.org",
      twitter: "https://twitter.com/climateaction26",
      linkedin: "https://linkedin.com/company/climate-action-conference",
      facebook: "https://facebook.com/climateactionconference"
    },
    speakers: [
      {
        name: "Dr. Sarah Green",
        title: "Climate Scientist & UN Advisor",
        bio: "Leading climate researcher with expertise in carbon reduction strategies.",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Opening Ceremony",
        description: "Welcome address and overview of global climate challenges",
        startTime: "09:00",
        endTime: "10:00",
        speakers: ["Dr. Sarah Green"]
      },
      {
        title: "Workshop: Renewable Energy Solutions",
        description: "Practical approaches to transitioning to clean energy",
        startTime: "10:30",
        endTime: "12:30",
        speakers: []
      },
      {
        title: "Networking Lunch",
        description: "Plant-based lunch with networking",
        startTime: "12:30",
        endTime: "14:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Green Energy Corp", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Startup Pitch Night: Tech Edition",
    category: "Business",
    description: "Watch innovative tech startups pitch to top venture capitalists and angel investors.",
    fullDescription: "An exciting evening where early-stage tech startups present their groundbreaking ideas to a panel of experienced investors. Whether you're an entrepreneur seeking funding, an investor looking for the next big opportunity, or simply passionate about innovation, this event offers invaluable networking and learning experiences.",
    venue: "Innovation Hub Downtown",
    location: "Austin, TX, USA",
    price: 75.00,
    capacity: 250,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Startups", "Investment", "Technology", "Entrepreneurship", "Networking"],
    socialLinks: {
      website: "https://startuppitchnight.io",
      twitter: "https://twitter.com/pitchnighttech",
      linkedin: "https://linkedin.com/company/startup-pitch-night"
    },
    speakers: [
      {
        name: "Jennifer Lee",
        title: "Partner at Venture Capital Firm",
        bio: "Seasoned investor with portfolio of 50+ successful tech startups.",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Welcome Reception",
        description: "Networking with drinks and hors d'oeuvres",
        startTime: "18:00",
        endTime: "19:00",
        speakers: []
      },
      {
        title: "Startup Pitches",
        description: "10 startups pitch for 5 minutes each",
        startTime: "19:00",
        endTime: "21:00",
        speakers: []
      },
      {
        title: "Q&A and Networking",
        description: "Open discussion and networking with investors",
        startTime: "21:00",
        endTime: "22:00",
        speakers: ["Jennifer Lee"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "International Food & Wine Festival",
    category: "Food & Drink",
    description: "Savor gourmet dishes and fine wines from around the world in this spectacular culinary celebration.",
    fullDescription: "Indulge in a weekend of culinary excellence featuring Michelin-starred chefs, award-winning winemakers, and artisan food producers. Enjoy tastings, cooking demonstrations, wine pairings, and live music. This festival is a must-attend for food enthusiasts and industry professionals alike.",
    venue: "Waterfront Park",
    location: "Napa Valley, CA, USA",
    price: 150.00,
    capacity: 2000,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Food", "Wine", "Culinary", "Festival", "Gourmet"],
    socialLinks: {
      website: "https://foodwinefest.com",
      instagram: "https://instagram.com/foodwinefestival",
      facebook: "https://facebook.com/foodwinefestival"
    },
    speakers: [],
    agenda: [
      {
        title: "Festival Opening & Welcome Toast",
        description: "Opening ceremony with champagne toast",
        startTime: "11:00",
        endTime: "12:00",
        speakers: []
      },
      {
        title: "Chef's Table: Italian Cuisine",
        description: "Live cooking demo by renowned Italian chef",
        startTime: "13:00",
        endTime: "14:30",
        speakers: []
      },
      {
        title: "Wine Tasting Sessions",
        description: "Guided tasting of premium wines from around the world",
        startTime: "15:00",
        endTime: "17:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Premium Wines Inc", level: "Gold" },
      { name: "Gourmet Foods Co", level: "Silver" }
    ],
    exhibitors: [
      { name: "Artisan Cheese Makers", description: "Handcrafted cheeses", booth: "B1" },
      { name: "Olive Oil Producers", description: "Extra virgin olive oils", booth: "B2" }
    ]
  },
  {
    title: "Digital Marketing Masterclass 2026",
    category: "Marketing",
    description: "Master the latest digital marketing strategies from SEO to social media advertising.",
    fullDescription: "This intensive masterclass covers everything you need to excel in digital marketing. Learn advanced SEO techniques, social media advertising, content marketing, email automation, and analytics. Taught by industry experts with real-world case studies and hands-on exercises. Perfect for marketers, business owners, and anyone looking to boost their online presence.",
    venue: "Business Training Center",
    location: "New York, NY, USA",
    price: 299.00,
    capacity: 150,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Marketing", "Digital Marketing", "SEO", "Social Media", "Training"],
    socialLinks: {
      website: "https://digitalmarketingmasterclass.com",
      linkedin: "https://linkedin.com/company/digital-marketing-masterclass",
      twitter: "https://twitter.com/digimktgmaster"
    },
    speakers: [
      {
        name: "David Chen",
        title: "Chief Marketing Officer at AdTech",
        bio: "Digital marketing expert with 15 years of experience in Fortune 500 companies.",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "SEO Fundamentals & Advanced Strategies",
        description: "Deep dive into search engine optimization",
        startTime: "09:00",
        endTime: "11:00",
        speakers: ["David Chen"]
      },
      {
        title: "Social Media Advertising",
        description: "Master Facebook, Instagram, and LinkedIn ads",
        startTime: "11:30",
        endTime: "13:30",
        speakers: ["David Chen"]
      },
      {
        title: "Lunch Break",
        description: "Networking lunch",
        startTime: "13:30",
        endTime: "14:30",
        speakers: []
      },
      {
        title: "Content Marketing & Email Automation",
        description: "Building effective content and email campaigns",
        startTime: "14:30",
        endTime: "17:00",
        speakers: ["David Chen"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "Blockchain & Cryptocurrency Summit",
    category: "Finance",
    description: "Explore the future of finance with blockchain technology and digital currencies.",
    fullDescription: "This summit brings together blockchain developers, cryptocurrency enthusiasts, investors, and regulators to discuss the evolution of decentralized finance. Topics include smart contracts, DeFi protocols, NFTs, regulatory frameworks, and the future of digital assets. Network with leaders in the blockchain space and gain insights into this transformative technology.",
    venue: "Financial District Convention Hall",
    location: "London, UK",
    price: 500.00,
    capacity: 600,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Blockchain", "Cryptocurrency", "DeFi", "Finance", "Technology"],
    socialLinks: {
      website: "https://blockchainsummit.io",
      twitter: "https://twitter.com/blockchainsummit",
      linkedin: "https://linkedin.com/company/blockchain-summit"
    },
    speakers: [
      {
        name: "Alex Morgan",
        title: "Blockchain Developer & Consultant",
        bio: "Expert in smart contract development and DeFi protocols.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Keynote: The Future of Money",
        description: "Opening keynote on blockchain's impact on global finance",
        startTime: "09:00",
        endTime: "10:30",
        speakers: ["Alex Morgan"]
      },
      {
        title: "Workshop: Building Smart Contracts",
        description: "Hands-on coding session for developers",
        startTime: "11:00",
        endTime: "13:00",
        speakers: ["Alex Morgan"]
      }
    ],
    sponsors: [
      { name: "CryptoVentures", level: "Platinum" }
    ],
    exhibitors: [
      { name: "Blockchain Solutions Ltd", description: "Enterprise blockchain", booth: "C1" }
    ]
  },
  {
    title: "Mental Health & Wellness Retreat",
    category: "Health & Wellness",
    description: "A transformative weekend retreat focused on mental health, mindfulness, and well-being.",
    fullDescription: "Escape the daily grind and immerse yourself in a weekend of healing and self-discovery. This retreat offers yoga sessions, meditation workshops, counseling sessions, and wellness activities designed to improve mental health and overall well-being. Led by certified therapists and wellness coaches in a serene natural setting.",
    venue: "Mountain Wellness Resort",
    location: "Aspen, CO, USA",
    price: 450.00,
    capacity: 80,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Mental Health", "Wellness", "Mindfulness", "Yoga", "Retreat"],
    socialLinks: {
      website: "https://wellnessretreat.com",
      instagram: "https://instagram.com/wellnessretreat",
      facebook: "https://facebook.com/wellnessretreat"
    },
    speakers: [
      {
        name: "Dr. Lisa Thompson",
        title: "Licensed Therapist & Wellness Coach",
        bio: "Specializes in mindfulness-based stress reduction and cognitive behavioral therapy.",
        image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Morning Yoga & Meditation",
        description: "Start the day with mindful movement",
        startTime: "07:00",
        endTime: "08:30",
        speakers: []
      },
      {
        title: "Group Therapy Session",
        description: "Guided discussion on mental health challenges",
        startTime: "09:00",
        endTime: "11:00",
        speakers: ["Dr. Lisa Thompson"]
      },
      {
        title: "Mindfulness Workshop",
        description: "Learn techniques for daily mindfulness practice",
        startTime: "14:00",
        endTime: "16:00",
        speakers: ["Dr. Lisa Thompson"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "DevOps & Cloud Infrastructure Conference",
    category: "Technology",
    description: "Learn best practices for DevOps, CI/CD pipelines, and cloud infrastructure management.",
    fullDescription: "This conference is designed for DevOps engineers, cloud architects, and IT professionals. Explore topics like container orchestration with Kubernetes, infrastructure as code, monitoring and logging, security best practices, and multi-cloud strategies. Hands-on labs and real-world case studies included.",
    venue: "Tech Campus Auditorium",
    location: "Seattle, WA, USA",
    price: 350.00,
    capacity: 500,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["DevOps", "Cloud", "Kubernetes", "CI/CD", "Infrastructure"],
    socialLinks: {
      website: "https://devopsconf.tech",
      twitter: "https://twitter.com/devopsconf",
      linkedin: "https://linkedin.com/company/devops-conference"
    },
    speakers: [
      {
        name: "Michael Roberts",
        title: "Senior DevOps Engineer at CloudScale",
        bio: "Expert in Kubernetes, Terraform, and cloud automation.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Keynote: Modern DevOps Practices",
        description: "Overview of industry trends and best practices",
        startTime: "09:00",
        endTime: "10:00",
        speakers: ["Michael Roberts"]
      },
      {
        title: "Workshop: Kubernetes in Production",
        description: "Hands-on lab for deploying and managing K8s clusters",
        startTime: "10:30",
        endTime: "13:00",
        speakers: ["Michael Roberts"]
      }
    ],
    sponsors: [
      { name: "AWS", level: "Platinum" },
      { name: "Google Cloud", level: "Gold" }
    ],
    exhibitors: []
  },
  {
    title: "Photography & Videography Workshop",
    category: "Arts & Culture",
    description: "Enhance your photography and videography skills with professional instructors.",
    fullDescription: "This hands-on workshop covers camera settings, composition techniques, lighting, post-processing, and storytelling through visual media. Suitable for beginners and intermediate photographers/videographers. Bring your camera and get ready to capture stunning images and videos.",
    venue: "Creative Arts Studio",
    location: "Los Angeles, CA, USA",
    price: 200.00,
    capacity: 40,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Photography", "Videography", "Arts", "Creative", "Workshop"],
    socialLinks: {
      website: "https://photovideoworkshop.com",
      instagram: "https://instagram.com/photovideoworkshop"
    },
    speakers: [
      {
        name: "Sophia Martinez",
        title: "Professional Photographer & Filmmaker",
        bio: "Award-winning photographer with works featured in National Geographic.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Introduction to Camera Settings",
        description: "Master aperture, shutter speed, and ISO",
        startTime: "10:00",
        endTime: "11:30",
        speakers: ["Sophia Martinez"]
      },
      {
        title: "Outdoor Shooting Session",
        description: "Practice composition and lighting in natural settings",
        startTime: "12:00",
        endTime: "14:00",
        speakers: ["Sophia Martinez"]
      },
      {
        title: "Post-Processing Workshop",
        description: "Editing photos and videos with professional software",
        startTime: "15:00",
        endTime: "17:00",
        speakers: ["Sophia Martinez"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "E-Commerce Growth Strategies Summit",
    category: "Business",
    description: "Discover proven strategies to scale your e-commerce business and increase sales.",
    fullDescription: "This summit is tailored for e-commerce entrepreneurs, marketers, and business owners. Learn about customer acquisition, conversion optimization, email marketing, social commerce, influencer partnerships, and data analytics. Hear from successful e-commerce founders and industry experts.",
    venue: "Business Innovation Center",
    location: "Miami, FL, USA",
    price: 275.00,
    capacity: 300,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["E-Commerce", "Business", "Marketing", "Sales", "Growth"],
    socialLinks: {
      website: "https://ecommercegrowth.summit",
      linkedin: "https://linkedin.com/company/ecommerce-growth-summit",
      twitter: "https://twitter.com/ecommgrowth"
    },
    speakers: [
      {
        name: "Rachel Kim",
        title: "Founder of OnlineStore Pro",
        bio: "Built a multi-million dollar e-commerce brand from scratch.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Customer Acquisition Strategies",
        description: "Effective ways to attract and retain customers",
        startTime: "09:00",
        endTime: "11:00",
        speakers: ["Rachel Kim"]
      },
      {
        title: "Conversion Optimization",
        description: "Increase your website's conversion rate",
        startTime: "11:30",
        endTime: "13:30",
        speakers: ["Rachel Kim"]
      }
    ],
    sponsors: [
      { name: "Shopify", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Jazz & Blues Music Festival",
    category: "Music",
    description: "A weekend of soulful jazz and blues performances by world-renowned artists.",
    fullDescription: "Immerse yourself in the timeless sounds of jazz and blues at this outdoor music festival. Featuring legendary musicians, up-and-coming artists, and special tribute performances. Enjoy food trucks, craft beer, and a vibrant atmosphere. Perfect for music lovers and families.",
    venue: "Riverside Amphitheater",
    location: "New Orleans, LA, USA",
    price: 0,
    capacity: 5000,
    isFree: true,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Music", "Jazz", "Blues", "Festival", "Live Performance"],
    socialLinks: {
      website: "https://jazzbluesfest.com",
      facebook: "https://facebook.com/jazzbluesfestival",
      instagram: "https://instagram.com/jazzbluesfest"
    },
    speakers: [],
    agenda: [
      {
        title: "Opening Act: Local Jazz Band",
        description: "Performance by local jazz ensemble",
        startTime: "17:00",
        endTime: "18:00",
        speakers: []
      },
      {
        title: "Headliner: Blues Legend Performance",
        description: "Main stage performance by renowned blues artist",
        startTime: "19:00",
        endTime: "21:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Local Brewery", level: "Gold" }
    ],
    exhibitors: [
      { name: "Music Instruments Store", description: "Guitars, drums, and accessories", booth: "D1" }
    ]
  },
  {
    title: "Women in Tech Leadership Summit",
    category: "Technology",
    description: "Empowering women in technology through leadership training and networking.",
    fullDescription: "This summit celebrates and supports women in the tech industry. Topics include leadership development, overcoming bias, negotiation skills, career advancement, and building inclusive workplaces. Hear inspiring stories from female tech leaders and connect with mentors and peers.",
    venue: "Women's Leadership Center",
    location: "San Francisco, CA, USA",
    price: 150.00,
    capacity: 400,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Women in Tech", "Leadership", "Technology", "Diversity", "Networking"],
    socialLinks: {
      website: "https://womenintech.summit",
      linkedin: "https://linkedin.com/company/women-tech-summit",
      twitter: "https://twitter.com/womenintechsum"
    },
    speakers: [
      {
        name: "Dr. Priya Sharma",
        title: "CTO at TechInnovate",
        bio: "Pioneering female tech leader and advocate for diversity in STEM.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Keynote: Breaking the Glass Ceiling",
        description: "Inspiring talk on women's leadership in tech",
        startTime: "09:00",
        endTime: "10:30",
        speakers: ["Dr. Priya Sharma"]
      },
      {
        title: "Panel: Negotiation and Career Growth",
        description: "Strategies for advancing your tech career",
        startTime: "11:00",
        endTime: "12:30",
        speakers: ["Dr. Priya Sharma"]
      }
    ],
    sponsors: [
      { name: "Microsoft", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Data Science & Analytics Bootcamp",
    category: "Technology",
    description: "Intensive bootcamp covering Python, machine learning, and data visualization.",
    fullDescription: "This 3-day bootcamp is designed for aspiring data scientists and analysts. Learn Python programming, statistical analysis, machine learning algorithms, and data visualization with tools like Pandas, NumPy, Scikit-Learn, and Matplotlib. Includes hands-on projects and real-world datasets.",
    venue: "Data Academy",
    location: "Boston, MA, USA",
    price: 599.00,
    capacity: 100,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Data Science", "Machine Learning", "Python", "Analytics", "Bootcamp"],
    socialLinks: {
      website: "https://datasciencebootcamp.io",
      linkedin: "https://linkedin.com/company/data-science-bootcamp"
    },
    speakers: [
      {
        name: "Dr. James Foster",
        title: "Data Science Lead at DataCorp",
        bio: "PhD in Statistics with 10+ years in data science and machine learning.",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Day 1: Python & Data Analysis",
        description: "Introduction to Python, Pandas, and NumPy",
        startTime: "09:00",
        endTime: "17:00",
        speakers: ["Dr. James Foster"]
      },
      {
        title: "Day 2: Machine Learning Fundamentals",
        description: "Supervised and unsupervised learning algorithms",
        startTime: "09:00",
        endTime: "17:00",
        speakers: ["Dr. James Foster"]
      },
      {
        title: "Day 3: Data Visualization & Projects",
        description: "Creating dashboards and presenting insights",
        startTime: "09:00",
        endTime: "17:00",
        speakers: ["Dr. James Foster"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "Yoga & Meditation Retreat",
    category: "Health & Wellness",
    description: "Rejuvenate your mind and body with daily yoga and meditation sessions.",
    fullDescription: "Spend a peaceful weekend in nature practicing yoga and meditation. This retreat is suitable for all levels, from beginners to advanced practitioners. Includes guided meditation, breathwork, and mindfulness exercises. Healthy vegetarian meals and comfortable accommodations provided.",
    venue: "Serenity Wellness Resort",
    location: "Sedona, AZ, USA",
    price: 350.00,
    capacity: 50,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Yoga", "Meditation", "Wellness", "Retreat", "Mindfulness"],
    socialLinks: {
      website: "https://yogaretreat.com",
      instagram: "https://instagram.com/yogaretreat"
    },
    speakers: [
      {
        name: "Maya Patel",
        title: "Certified Yoga Instructor",
        bio: "20 years of teaching yoga and meditation worldwide.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Morning Yoga Session",
        description: "Energizing yoga flow to start the day",
        startTime: "07:00",
        endTime: "08:30",
        speakers: ["Maya Patel"]
      },
      {
        title: "Guided Meditation",
        description: "Deep relaxation and mindfulness practice",
        startTime: "10:00",
        endTime: "11:30",
        speakers: ["Maya Patel"]
      },
      {
        title: "Evening Restorative Yoga",
        description: "Gentle stretches and relaxation",
        startTime: "18:00",
        endTime: "19:30",
        speakers: ["Maya Patel"]
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "Cybersecurity & Ethical Hacking Conference",
    category: "Technology",
    description: "Learn the latest cybersecurity techniques and ethical hacking strategies.",
    fullDescription: "This conference is essential for IT security professionals, ethical hackers, and anyone interested in cybersecurity. Topics include penetration testing, vulnerability assessment, network security, cryptography, and incident response. Hands-on labs and Capture The Flag (CTF) competitions included.",
    venue: "Cyber Defense Institute",
    location: "Washington, DC, USA",
    price: 450.00,
    capacity: 350,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Cybersecurity", "Ethical Hacking", "Security", "Technology", "Training"],
    socialLinks: {
      website: "https://cybersecurityconf.com",
      twitter: "https://twitter.com/cybersecconf",
      linkedin: "https://linkedin.com/company/cybersecurity-conference"
    },
    speakers: [
      {
        name: "Kevin Brown",
        title: "Chief Security Officer at SecureNet",
        bio: "Expert in penetration testing and network security.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Keynote: The Future of Cybersecurity",
        description: "Emerging threats and defense strategies",
        startTime: "09:00",
        endTime: "10:30",
        speakers: ["Kevin Brown"]
      },
      {
        title: "Workshop: Penetration Testing",
        description: "Hands-on ethical hacking exercises",
        startTime: "11:00",
        endTime: "14:00",
        speakers: ["Kevin Brown"]
      },
      {
        title: "CTF Competition",
        description: "Capture The Flag cybersecurity challenge",
        startTime: "15:00",
        endTime: "18:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Norton Security", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Fashion Week: Spring Collection 2026",
    category: "Fashion",
    description: "Witness the latest fashion trends from top designers in an exclusive runway show.",
    fullDescription: "This premier fashion event showcases the Spring 2026 collections from renowned designers and emerging talent. Experience glamorous runway shows, meet designers, and explore the latest trends in fashion. VIP tickets include after-party access and exclusive meet-and-greet opportunities.",
    venue: "Fashion District Arena",
    location: "Paris, France",
    price: 500.00,
    capacity: 800,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Fashion", "Runway", "Design", "Luxury", "Style"],
    socialLinks: {
      website: "https://fashionweek2026.com",
      instagram: "https://instagram.com/fashionweek2026",
      twitter: "https://twitter.com/fashionweek26"
    },
    speakers: [],
    agenda: [
      {
        title: "Opening Runway Show",
        description: "Collection by Designer A",
        startTime: "18:00",
        endTime: "19:00",
        speakers: []
      },
      {
        title: "Main Runway Show",
        description: "Featured collections from top designers",
        startTime: "19:30",
        endTime: "21:30",
        speakers: []
      },
      {
        title: "After-Party (VIP Only)",
        description: "Exclusive networking and celebration",
        startTime: "22:00",
        endTime: "01:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Luxury Brand X", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Charity Run for Education",
    category: "Sports & Fitness",
    description: "Join the 5K/10K charity run to support education initiatives for underprivileged children.",
    fullDescription: "Participate in this fun and meaningful charity run. All proceeds go towards building schools and providing educational resources for children in need. Runners of all levels are welcome. Includes race kit, t-shirt, finisher medal, and post-race refreshments.",
    venue: "City Park",
    location: "Chicago, IL, USA",
    price: 0,
    capacity: 1000,
    isFree: true,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Charity", "Running", "Fitness", "Education", "Community"],
    socialLinks: {
      website: "https://charityrun.org",
      facebook: "https://facebook.com/charityrun",
      instagram: "https://instagram.com/charityrunforedu"
    },
    speakers: [],
    agenda: [
      {
        title: "Registration & Warm-Up",
        description: "Check-in and pre-race warm-up exercises",
        startTime: "07:00",
        endTime: "08:00",
        speakers: []
      },
      {
        title: "5K Run Start",
        description: "5K race begins",
        startTime: "08:00",
        endTime: "09:00",
        speakers: []
      },
      {
        title: "10K Run Start",
        description: "10K race begins",
        startTime: "08:30",
        endTime: "10:00",
        speakers: []
      },
      {
        title: "Awards Ceremony",
        description: "Recognition of top finishers and fundraisers",
        startTime: "10:30",
        endTime: "11:30",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Sports Brand Y", level: "Gold" }
    ],
    exhibitors: []
  },
  {
    title: "Real Estate Investment Forum",
    category: "Finance",
    description: "Discover profitable real estate investment opportunities and strategies.",
    fullDescription: "This forum is designed for real estate investors, developers, and finance professionals. Learn about market trends, property valuation, financing options, tax strategies, and risk management. Network with industry leaders and explore investment opportunities in residential, commercial, and industrial real estate.",
    venue: "Financial Plaza",
    location: "Dubai, UAE",
    price: 400.00,
    capacity: 500,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Real Estate", "Investment", "Finance", "Property", "Business"],
    socialLinks: {
      website: "https://realestateforum.com",
      linkedin: "https://linkedin.com/company/real-estate-forum"
    },
    speakers: [
      {
        name: "Omar Hassan",
        title: "Real Estate Developer & Investor",
        bio: "30+ years of experience in international real estate markets.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Keynote: Global Real Estate Trends",
        description: "Market analysis and future outlook",
        startTime: "09:00",
        endTime: "10:30",
        speakers: ["Omar Hassan"]
      },
      {
        title: "Panel: Investment Strategies",
        description: "Maximizing ROI in real estate",
        startTime: "11:00",
        endTime: "13:00",
        speakers: ["Omar Hassan"]
      }
    ],
    sponsors: [
      { name: "Real Estate Corp", level: "Platinum" }
    ],
    exhibitors: []
  },
  {
    title: "Kids Science & STEM Expo",
    category: "Education",
    description: "Interactive science experiments and activities for children aged 6-14.",
    fullDescription: "This family-friendly expo introduces kids to the wonders of science, technology, engineering, and math. Features hands-on experiments, robotics demonstrations, coding workshops, and interactive exhibits. Perfect for curious young minds and parents looking to inspire a love of learning.",
    venue: "Children's Science Museum",
    location: "Houston, TX, USA",
    price: 0,
    capacity: 800,
    isFree: true,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Science", "STEM", "Education", "Kids", "Family"],
    socialLinks: {
      website: "https://kidsscienceexpo.com",
      facebook: "https://facebook.com/kidsscienceexpo"
    },
    speakers: [],
    agenda: [
      {
        title: "Interactive Science Shows",
        description: "Fun and educational science demonstrations",
        startTime: "10:00",
        endTime: "12:00",
        speakers: []
      },
      {
        title: "Robotics Workshop",
        description: "Build and program simple robots",
        startTime: "13:00",
        endTime: "15:00",
        speakers: []
      },
      {
        title: "Coding for Kids",
        description: "Introduction to programming with fun games",
        startTime: "15:30",
        endTime: "17:00",
        speakers: []
      }
    ],
    sponsors: [
      { name: "Tech for Kids Foundation", level: "Gold" }
    ],
    exhibitors: [
      { name: "LEGO Education", description: "Building and coding kits", booth: "E1" }
    ]
  },
  {
    title: "Film Festival: Independent Cinema 2026",
    category: "Arts & Culture",
    description: "Celebrate independent filmmaking with screenings, Q&A sessions, and awards.",
    fullDescription: "This film festival showcases the best in independent cinema from around the world. Enjoy feature films, documentaries, and short films, followed by Q&A sessions with directors and actors. The festival concludes with an awards ceremony recognizing outstanding achievements in independent filmmaking.",
    venue: "Art House Cinema",
    location: "Toronto, Canada",
    price: 100.00,
    capacity: 300,
    isFree: false,
    isOnline: false,
    eventType: "PUBLIC",
    tags: ["Film", "Cinema", "Arts", "Independent", "Festival"],
    socialLinks: {
      website: "https://indiefilmfest.com",
      instagram: "https://instagram.com/indiefilmfest",
      twitter: "https://twitter.com/indiefilmfest26"
    },
    speakers: [],
    agenda: [
      {
        title: "Opening Film Screening",
        description: "Feature film premiere",
        startTime: "18:00",
        endTime: "20:00",
        speakers: []
      },
      {
        title: "Director Q&A",
        description: "Discussion with filmmakers",
        startTime: "20:15",
        endTime: "21:00",
        speakers: []
      },
      {
        title: "Awards Ceremony",
        description: "Recognition of best films and talent",
        startTime: "21:30",
        endTime: "23:00",
        speakers: []
      }
    ],
    sponsors: [],
    exhibitors: []
  },
  {
    title: "Leadership & Management Training",
    category: "Business",
    description: "Develop essential leadership skills for managers and executives.",
    fullDescription: "This training program is designed for current and aspiring leaders. Topics include effective communication, team building, conflict resolution, strategic thinking, and decision-making. Interactive workshops and real-world case studies help you apply what you learn immediately.",
    venue: "Executive Training Center",
    location: "Atlanta, GA, USA",
    price: 550.00,
    capacity: 120,
    isFree: false,
    isOnline: true,
    eventType: "PUBLIC",
    tags: ["Leadership", "Management", "Training", "Business", "Professional Development"],
    socialLinks: {
      website: "https://leadershiptraining.pro",
      linkedin: "https://linkedin.com/company/leadership-training"
    },
    speakers: [
      {
        name: "Amanda Brooks",
        title: "Executive Coach & Leadership Consultant",
        bio: "Certified leadership coach with experience training Fortune 500 executives.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80"
      }
    ],
    agenda: [
      {
        title: "Module 1: Effective Communication",
        description: "Master verbal and non-verbal communication skills",
        startTime: "09:00",
        endTime: "11:00",
        speakers: ["Amanda Brooks"]
      },
      {
        title: "Module 2: Team Building & Motivation",
        description: "Build high-performing teams",
        startTime: "11:30",
        endTime: "13:30",
        speakers: ["Amanda Brooks"]
      },
      {
        title: "Module 3: Strategic Decision Making",
        description: "Frameworks for making tough decisions",
        startTime: "14:30",
        endTime: "17:00",
        speakers: ["Amanda Brooks"]
      }
    ],
    sponsors: [],
    exhibitors: []
  }
];

async function main() {
  console.log('🌱 Seeding comprehensive events...\n');
  
  // Get all organizers (including existing scecil072@gmail.com)
  const organizers = await prisma.user.findMany({
    where: { role: UserRole.ORGANIZER },
  });

  if (organizers.length === 0) {
    console.error('❌ No organizers found. Please create organizers first.');
    process.exit(1);
  }

  console.log(`📋 Found ${organizers.length} organizer(s)\n`);

  const today = new Date();
  let createdCount = 0;
  let failedCount = 0;

  // Create events
  for (let i = 0; i < eventTemplates.length; i++) {
    const template = eventTemplates[i];
    
    // Calculate future date (between 7 to 60 days from now)
    const daysFromNow = 7 + Math.floor(Math.random() * 53);
    const eventDate = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
    
    // Assign to random organizer
    const organizerIndex = i % organizers.length;
    const organizer = organizers[organizerIndex];

    const eventData = {
      title: template.title,
      description: template.description,
      fullDescription: template.fullDescription,
      category: template.category,
      tags: template.tags,
      image: getImageUrl(i),
      price: template.price > 0 ? new Decimal(template.price) : new Decimal(0),
      currency: "USD",
      venue: template.venue,
      location: template.location,
      capacity: template.capacity,
      isFree: template.isFree,
      isOnline: template.isOnline,
      eventType: template.eventType,
      status: EventStatus.PENDING, // All events need admin approval
      organizerId: organizer.id,
      startDate: eventDate,
      endDate: eventDate,
      startTime: "09:00",
      endTime: "17:00",
      socialLinks: template.socialLinks,
      speakers: template.speakers,
      agenda: template.agenda,
      sponsors: template.sponsors.length > 0 ? template.sponsors : undefined,
      exhibitors: template.exhibitors.length > 0 ? template.exhibitors : undefined,
      requirements: ["Valid ID required for check-in"],
      ageRestriction: "18+",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const event = await prisma.event.create({
        data: eventData,
      });
      
      createdCount++;
      console.log(`✅ Created: ${event.title}`);
      console.log(`   Organizer: ${organizer.email}`);
      console.log(`   Date: ${eventDate.toLocaleDateString()}`);
      console.log(`   Price: ${template.isFree ? 'FREE' : `$${template.price}`}`);
      console.log(`   Status: PENDING (awaits admin approval)`);
      console.log(`   Agenda items: ${template.agenda.length}`);
      console.log(`   Speakers: ${template.speakers.length}`);
      console.log(`   Social links: ${Object.keys(template.socialLinks).length}\n`);
    } catch (error) {
      failedCount++;
      console.error(`❌ Failed to create ${template.title}:`, error.message);
    }
  }

  console.log('\n✨ Seeding complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} events`);
  console.log(`   ❌ Failed: ${failedCount} events`);
  console.log(`   📋 All events are PENDING and require admin approval`);
  console.log(`   🎨 All events use Unsplash image URLs`);
  console.log(`   💰 Mix of free and paid events`);
  console.log(`   🌐 Mix of in-person, online, and hybrid events\n`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
