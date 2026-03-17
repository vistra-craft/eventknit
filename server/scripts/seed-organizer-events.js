/**
 * Seed Events Script
 * Seeds 14 free events for organizer bkelvin138@gmail.com
 * 
 * Usage: node seed-events.js
 */

const API_URL = 'http://178.18.249.49/api/v1';
const ORGANIZER_EMAIL = 'bkelvin138@gmail.com';
const ORGANIZER_PASSWORD = 'Somesuperhardpassword2guess!'; // REPLACE WITH ACTUAL PASSWORD

// Unsplash images for different event types
const eventImages = {
  tech: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
  music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
  food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200',
  art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200',
  business: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200',
  workshop: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
  networking: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=1200',
  conference: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200',
  gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
  charity: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200',
  community: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200',
};

// Helper to get future dates
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Event data templates
const events = [
  {
    title: 'AI & Machine Learning Workshop 2026',
    description: 'Join us for an intensive hands-on workshop exploring the latest in AI and machine learning. Perfect for developers and data scientists looking to level up their skills.',
    category: 'Technology',
    tags: ['AI', 'Machine Learning', 'Workshop', 'Tech', 'Python'],
    startDate: getFutureDate(15),
    startTime: '09:00',
    endTime: '17:00',
    venue: 'Tech Hub Innovation Center',
    location: 'San Francisco, CA',
    address: '123 Market Street, San Francisco, CA 94103',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    isOnline: false,
    isFree: true,
    capacity: 100,
    image: eventImages.tech,
    requirements: ['Laptop with Python installed', 'Basic programming knowledge'],
    ageRestriction: '18+',
    duration: '8 hours',
    speakers: [
      { name: 'Dr. Sarah Chen', title: 'AI Research Lead', bio: 'Leading AI researcher with 15+ years experience', image: 'https://i.pravatar.cc/300?img=5' },
      { name: 'Mark Johnson', title: 'ML Engineer', bio: 'Senior ML engineer at top tech company', image: 'https://i.pravatar.cc/300?img=12' }
    ],
    agenda: [
      { title: 'Introduction to AI', startTime: '09:00', endTime: '10:30' },
      { title: 'Neural Networks Deep Dive', startTime: '11:00', endTime: '13:00' },
      { title: 'Hands-on Projects', startTime: '14:00', endTime: '17:00' }
    ],
    faqs: [
      { question: 'Do I need prior AI experience?', answer: 'Basic programming knowledge is sufficient. We will cover fundamentals.' },
      { question: 'Will materials be provided?', answer: 'Yes, all workshop materials and code samples will be provided.' }
    ],
    timezone: 'America/Los_Angeles'
  },
  {
    title: 'Summer Jazz Festival 2026',
    description: 'Experience an unforgettable evening of smooth jazz featuring local and international artists. Bring your friends and enjoy great music under the stars!',
    category: 'Music',
    tags: ['Jazz', 'Music', 'Festival', 'Live Performance', 'Entertainment'],
    startDate: getFutureDate(30),
    startTime: '18:00',
    endTime: '23:00',
    venue: 'Riverside Amphitheater',
    location: 'Austin, TX',
    address: '456 Riverside Drive, Austin, TX 78701',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    isOnline: false,
    isFree: true,
    capacity: 500,
    image: eventImages.music,
    duration: '5 hours',
    speakers: [
      { name: 'The Austin Jazz Ensemble', title: 'Headliner', bio: 'Award-winning jazz band with 20+ years of performances', image: 'https://i.pravatar.cc/300?img=33' }
    ],
    agenda: [
      { title: 'Opening Act - Local Talent', startTime: '18:00', endTime: '19:00' },
      { title: 'Main Performance', startTime: '19:30', endTime: '21:30' },
      { title: 'Jam Session', startTime: '22:00', endTime: '23:00' }
    ],
    timezone: 'America/Chicago'
  },
  {
    title: 'Gourmet Food & Wine Tasting',
    description: 'Discover exquisite flavors from around the world. Sample premium wines, artisan cheeses, and gourmet dishes prepared by renowned chefs.',
    category: 'Food & Drink',
    tags: ['Food', 'Wine', 'Tasting', 'Culinary', 'Gourmet'],
    startDate: getFutureDate(20),
    startTime: '19:00',
    endTime: '22:00',
    venue: 'Grand Ballroom Hotel Luxe',
    location: 'New York, NY',
    address: '789 Fifth Avenue, New York, NY 10022',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    isOnline: false,
    isFree: true,
    capacity: 150,
    image: eventImages.food,
    ageRestriction: '21+',
    duration: '3 hours',
    requirements: ['Valid ID for age verification'],
    speakers: [
      { name: 'Chef Michael Romano', title: 'Executive Chef', bio: 'Michelin-starred chef with expertise in fusion cuisine', image: 'https://i.pravatar.cc/300?img=13' }
    ],
    faqs: [
      { question: 'Are there vegetarian options?', answer: 'Yes, we offer vegetarian and vegan tasting options.' },
      { question: 'What should I wear?', answer: 'Smart casual attire is recommended.' }
    ],
    timezone: 'America/New_York'
  },
  {
    title: 'Community Marathon 2026',
    description: 'Run for a cause! Join hundreds of runners in our annual community marathon. All fitness levels welcome. Proceeds support local charities.',
    category: 'Sports',
    tags: ['Marathon', 'Running', 'Fitness', 'Community', 'Charity'],
    startDate: getFutureDate(45),
    startTime: '06:00',
    endTime: '12:00',
    venue: 'City Park',
    location: 'Seattle, WA',
    address: 'Green Lake Park, Seattle, WA 98103',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    isOnline: false,
    isFree: true,
    capacity: 1000,
    image: eventImages.sports,
    duration: '6 hours',
    requirements: ['Running shoes', 'Water bottle', 'Physical fitness'],
    ageRestriction: 'All ages (under 16 with guardian)',
    agenda: [
      { title: 'Registration & Warm-up', startTime: '06:00', endTime: '07:00' },
      { title: 'Marathon Start', startTime: '07:00', endTime: '07:15' },
      { title: 'Awards Ceremony', startTime: '11:00', endTime: '12:00' }
    ],
    timezone: 'America/Los_Angeles'
  },
  {
    title: 'Digital Art Exhibition: Future Visions',
    description: 'Explore the intersection of technology and art. This immersive exhibition features works from emerging digital artists using AI, VR, and interactive installations.',
    category: 'Arts',
    tags: ['Art', 'Digital Art', 'Exhibition', 'Technology', 'Creative'],
    startDate: getFutureDate(10),
    endDate: getFutureDate(17),
    startTime: '10:00',
    endTime: '18:00',
    venue: 'Modern Art Museum',
    location: 'Chicago, IL',
    address: '220 E Chicago Avenue, Chicago, IL 60611',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    isOnline: false,
    isFree: true,
    capacity: 200,
    image: eventImages.art,
    duration: '8 hours daily',
    speakers: [
      { name: 'Alexandra Torres', title: 'Curator', bio: 'Contemporary art curator specializing in digital media', image: 'https://i.pravatar.cc/300?img=23' }
    ],
    timezone: 'America/Chicago'
  },
  {
    title: 'Startup Pitch Competition 2026',
    description: 'Watch innovative startups pitch their ideas to top investors. Network with entrepreneurs, investors, and tech enthusiasts. Winner receives $50K in funding!',
    category: 'Business',
    tags: ['Startup', 'Entrepreneurship', 'Pitch', 'Business', 'Networking'],
    startDate: getFutureDate(25),
    startTime: '14:00',
    endTime: '18:00',
    venue: 'Innovation Hub',
    location: 'Boston, MA',
    address: '100 Northern Avenue, Boston, MA 02210',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    isOnline: true,
    onlineLink: 'https://zoom.us/j/startup-pitch-2026',
    isFree: true,
    capacity: 300,
    image: eventImages.business,
    duration: '4 hours',
    speakers: [
      { name: 'David Park', title: 'VC Partner', bio: 'Venture capitalist with portfolio of 50+ startups', image: 'https://i.pravatar.cc/300?img=15' },
      { name: 'Lisa Chen', title: 'Serial Entrepreneur', bio: 'Founded and exited 3 successful tech companies', image: 'https://i.pravatar.cc/300?img=29' }
    ],
    agenda: [
      { title: 'Opening & Keynote', startTime: '14:00', endTime: '14:30' },
      { title: 'Startup Pitches', startTime: '14:30', endTime: '17:00' },
      { title: 'Judging & Awards', startTime: '17:00', endTime: '18:00' }
    ],
    timezone: 'America/New_York'
  },
  {
    title: 'Web Development Bootcamp: React & Next.js',
    description: 'Master modern web development! Build production-ready applications with React and Next.js. Includes hands-on projects and career guidance.',
    category: 'Technology',
    tags: ['Web Development', 'React', 'Next.js', 'Coding', 'Workshop'],
    startDate: getFutureDate(18),
    endDate: getFutureDate(20),
    startTime: '10:00',
    endTime: '18:00',
    venue: 'Code Academy Center',
    location: 'Denver, CO',
    address: '1650 Larimer Street, Denver, CO 80202',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    isOnline: false,
    isFree: true,
    capacity: 80,
    image: eventImages.workshop,
    requirements: ['Laptop', 'Basic HTML/CSS/JavaScript knowledge', 'Node.js installed'],
    duration: '3 days, 8 hours each',
    speakers: [
      { name: 'Tom Williams', title: 'Senior Developer', bio: '10+ years building web applications at FAANG companies', image: 'https://i.pravatar.cc/300?img=17' }
    ],
    timezone: 'America/Denver'
  },
  {
    title: 'Tech Networking Mixer: Connect & Collaborate',
    description: 'Meet fellow tech professionals, share ideas, and build valuable connections. Whether you\'re looking for cofounders, employees, or just tech friends!',
    category: 'Networking',
    tags: ['Networking', 'Tech', 'Professionals', 'Career', 'Social'],
    startDate: getFutureDate(12),
    startTime: '18:30',
    endTime: '21:00',
    venue: 'Rooftop Lounge @ Tech Tower',
    location: 'Miami, FL',
    address: '1101 Brickell Avenue, Miami, FL 33131',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    isOnline: false,
    isFree: true,
    capacity: 120,
    image: eventImages.networking,
    duration: '2.5 hours',
    ageRestriction: '18+',
    timezone: 'America/New_York'
  },
  {
    title: 'Global Marketing Summit 2026',
    description: 'Learn cutting-edge marketing strategies from industry leaders. Topics include social media, content marketing, SEO, and growth hacking.',
    category: 'Business',
    tags: ['Marketing', 'Conference', 'Business', 'Digital Marketing', 'Strategy'],
    startDate: getFutureDate(35),
    startTime: '09:00',
    endTime: '17:00',
    venue: 'Convention Center Hall A',
    location: 'Las Vegas, NV',
    address: '3150 Paradise Road, Las Vegas, NV 89109',
    coordinates: { lat: 36.1699, lng: -115.1398 },
    isOnline: true,
    onlineLink: 'https://zoom.us/j/marketing-summit-2026',
    isFree: true,
    capacity: 500,
    image: eventImages.conference,
    duration: '8 hours',
    speakers: [
      { name: 'Emily Rodriguez', title: 'CMO', bio: 'Chief Marketing Officer at Fortune 500 company', image: 'https://i.pravatar.cc/300?img=9' },
      { name: 'James Lee', title: 'Growth Hacker', bio: 'Helped 100+ startups achieve 10x growth', image: 'https://i.pravatar.cc/300?img=32' }
    ],
    agenda: [
      { title: 'Keynote: Future of Marketing', startTime: '09:00', endTime: '10:00' },
      { title: 'Breakout Sessions', startTime: '10:30', endTime: '12:30' },
      { title: 'Networking Lunch', startTime: '12:30', endTime: '14:00' },
      { title: 'Panel Discussion', startTime: '14:00', endTime: '16:00' },
      { title: 'Q&A & Closing', startTime: '16:00', endTime: '17:00' }
    ],
    timezone: 'America/Los_Angeles'
  },
  {
    title: 'Morning Yoga in the Park',
    description: 'Start your day with mindfulness and movement. All levels welcome! Bring your mat and enjoy a peaceful practice surrounded by nature.',
    category: 'Health & Wellness',
    tags: ['Yoga', 'Wellness', 'Fitness', 'Meditation', 'Outdoor'],
    startDate: getFutureDate(8),
    startTime: '07:00',
    endTime: '08:30',
    venue: 'Central Park Great Lawn',
    location: 'New York, NY',
    address: 'Central Park, New York, NY 10024',
    coordinates: { lat: 40.7829, lng: -73.9654 },
    isOnline: false,
    isFree: true,
    capacity: 50,
    image: eventImages.yoga,
    requirements: ['Yoga mat', 'Comfortable clothing', 'Water bottle'],
    duration: '1.5 hours',
    ageRestriction: 'All ages',
    speakers: [
      { name: 'Maya Patel', title: 'Yoga Instructor', bio: 'Certified yoga instructor with 8 years experience', image: 'https://i.pravatar.cc/300?img=27' }
    ],
    timezone: 'America/New_York'
  },
  {
    title: 'Esports Tournament: League of Champions',
    description: 'Watch top gamers compete for glory! Multiple game titles including League of Legends, CS:GO, and Valorant. Food trucks and merch available.',
    category: 'Gaming',
    tags: ['Esports', 'Gaming', 'Tournament', 'Competition', 'Entertainment'],
    startDate: getFutureDate(28),
    startTime: '12:00',
    endTime: '20:00',
    venue: 'Arena Gaming Center',
    location: 'Los Angeles, CA',
    address: '1111 S Figueroa Street, Los Angeles, CA 90015',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    isOnline: true,
    onlineLink: 'https://twitch.tv/league-of-champions-2026',
    isFree: true,
    capacity: 300,
    image: eventImages.gaming,
    duration: '8 hours',
    ageRestriction: '13+',
    timezone: 'America/Los_Angeles'
  },
  {
    title: 'Charity Fundraiser Gala: Kids Education',
    description: 'An elegant evening supporting education for underprivileged children. Features silent auction, live music, and inspiring stories from scholarship recipients.',
    category: 'Charity',
    tags: ['Charity', 'Fundraiser', 'Education', 'Community', 'Gala'],
    startDate: getFutureDate(40),
    startTime: '19:00',
    endTime: '23:00',
    venue: 'The Grand Hotel Ballroom',
    location: 'Philadelphia, PA',
    address: '200 S Broad Street, Philadelphia, PA 19102',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    isOnline: false,
    isFree: true,
    capacity: 250,
    image: eventImages.charity,
    duration: '4 hours',
    ageRestriction: '18+',
    requirements: ['Formal attire'],
    sponsors: [
      { name: 'Tech Corp Foundation', level: 'Platinum', logo: 'https://via.placeholder.com/150' },
      { name: 'Community Bank', level: 'Gold', logo: 'https://via.placeholder.com/150' }
    ],
    timezone: 'America/New_York'
  },
  {
    title: 'Climate Action Workshop: Building Sustainable Communities',
    description: 'Learn practical ways to reduce your carbon footprint and create sustainable communities. Experts share insights on renewable energy, waste reduction, and eco-friendly living.',
    category: 'Education',
    tags: ['Environment', 'Sustainability', 'Climate', 'Education', 'Workshop'],
    startDate: getFutureDate(22),
    startTime: '13:00',
    endTime: '17:00',
    venue: 'Eco Center',
    location: 'Portland, OR',
    address: '1234 Green Street, Portland, OR 97209',
    coordinates: { lat: 45.5152, lng: -122.6784 },
    isOnline: true,
    onlineLink: 'https://meet.google.com/climate-action-workshop',
    isFree: true,
    capacity: 150,
    image: eventImages.education,
    duration: '4 hours',
    speakers: [
      { name: 'Dr. Green Anderson', title: 'Environmental Scientist', bio: 'Leading researcher in sustainable development', image: 'https://i.pravatar.cc/300?img=8' },
      { name: 'Rachel Kim', title: 'Sustainability Consultant', bio: 'Helps organizations achieve carbon neutrality', image: 'https://i.pravatar.cc/300?img=20' }
    ],
    faqs: [
      { question: 'Will there be actionable takeaways?', answer: 'Yes! You will receive a comprehensive guide with steps you can implement immediately.' },
      { question: 'Is this suitable for businesses?', answer: 'Absolutely. We cover both individual and organizational sustainability.' }
    ],
    timezone: 'America/Los_Angeles'
  },
  {
    title: 'Local Book Club Meetup: Modern Classics',
    description: 'Join fellow book lovers for a lively discussion of contemporary literature. This month: "The Night Circus" by Erin Morgenstern. Coffee and snacks provided!',
    category: 'Community',
    tags: ['Books', 'Reading', 'Community', 'Literature', 'Social'],
    startDate: getFutureDate(14),
    startTime: '18:00',
    endTime: '20:00',
    venue: 'Cozy Corner Bookshop',
    location: 'Nashville, TN',
    address: '567 Main Street, Nashville, TN 37203',
    coordinates: { lat: 36.1627, lng: -86.7816 },
    isOnline: false,
    isFree: true,
    capacity: 25,
    image: eventImages.community,
    duration: '2 hours',
    requirements: ['Have read the selected book (optional for first-timers)'],
    ageRestriction: 'All ages',
    faqs: [
      { question: 'Do I need to finish the book?', answer: 'Not required, but recommended to fully participate in discussions.' },
      { question: 'Can I bring a friend?', answer: 'Yes! New members are always welcome.' }
    ],
    timezone: 'America/Chicago'
  }
];

// Helper functions
async function loginOrganizer() {
  console.log('🔐 Logging in as organizer...');
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ORGANIZER_EMAIL,
      password: ORGANIZER_PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  const data = await response.json();
  console.log('✅ Login successful!');
  return data.data.accessToken;
}

async function createEvent(token, eventData) {
  console.log(`📝 Creating event: ${eventData.title}...`);
  
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Failed to create "${eventData.title}": ${error}`);
    return null;
  }

  const data = await response.json();
  console.log(`✅ Created: ${eventData.title}`);
  return data.data.event;
}

async function main() {
  console.log('🚀 Starting event seeding process...\n');
  
  try {
    // Login
    const token = await loginOrganizer();
    console.log('');

    // Create events
    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
      const created = await createEvent(token, event);
      if (created) {
        successCount++;
      } else {
        failCount++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log(`✅ Successfully created: ${successCount} events`);
    console.log(`❌ Failed: ${failCount} events`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
