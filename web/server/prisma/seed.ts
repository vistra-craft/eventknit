import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient, UserRole, UserStatus, EventStatus, EventType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '../src/utils/logger';

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envPath });
dotenv.config(); // Also load .env for fallback

// Log database connection info (without exposing password)
const databaseUrl = process.env.DATABASE_URL || 'NOT SET';
const dbInfo = databaseUrl.replace(/:[^:@]+@/, ':****@'); // Mask password
logger.info(`📊 Environment: ${env}`);
logger.info(`📊 Database: ${dbInfo}`);

const SUPERVISOR_CREDENTIALS = {
  email: 'vistracraft@gmail.com',
  password: 'Somepass123!',
  firstName: 'Vistra',
  lastName: 'Craft',
  role: UserRole.SUPERADMIN,
};

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const prisma = new PrismaClient();

/**
 * Create or update the superuser
 */
const createSuperuser = async (): Promise<void> => {
  try {
    logger.info('Checking for existing superuser...');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (existingUser) {
      logger.info(`User with email ${SUPERVISOR_CREDENTIALS.email} already exists`);

      // Update to SUPERADMIN if not already
      if (existingUser.role !== UserRole.SUPERADMIN) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        logger.info('Updated existing user to SUPERADMIN role');
      } else {
        logger.info('User is already a SUPERADMIN');
      }

      // Update password if needed (for security, you might want to skip this)
      // const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);
      // await prisma.user.update({
      //   where: { id: existingUser.id },
      //   data: { password: hashedPassword },
      // });
      logger.info('Skipping password update for existing user');
    } else {
      // Create new superuser
      logger.info('Creating new superuser...');
      const hashedPassword = await hashPassword(SUPERVISOR_CREDENTIALS.password);

      const superuser = await prisma.user.create({
        data: {
          email: SUPERVISOR_CREDENTIALS.email,
          password: hashedPassword,
          firstName: SUPERVISOR_CREDENTIALS.firstName,
          lastName: SUPERVISOR_CREDENTIALS.lastName,
          role: SUPERVISOR_CREDENTIALS.role,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      logger.info(`Superuser created successfully with email: ${SUPERVISOR_CREDENTIALS.email}`);
      logger.info('📧 Email:', SUPERVISOR_CREDENTIALS.email);
      logger.info('🔑 Password:', SUPERVISOR_CREDENTIALS.password);
    }
  } catch (error) {
    logger.error('Failed to create superuser:', error);
    throw error;
  }
};

/**
 * Create test users (organizer and attendee)
 */
const createTestUsers = async (): Promise<void> => {
  try {
    logger.info('Creating test users...');
    
    const testUsers = [
      {
        email: 'test@organizer.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'Organizer',
        role: UserRole.ORGANIZER,
        organizationName: 'Test Organization',
        businessEmail: 'test@organizer.com',
      },
      {
        email: 'test@user.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ATTENDEE,
      },
    ];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        logger.info(`Test user ${userData.email} already exists`);
        // Update password if needed (for testing purposes)
        const hashedPassword = await hashPassword(userData.password);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
          },
        });
        logger.info(`Updated test user: ${userData.email}`);
      } else {
        const hashedPassword = await hashPassword(userData.password);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            ...(userData.organizationName && { organizationName: userData.organizationName }),
            ...(userData.businessEmail && { businessEmail: userData.businessEmail }),
          },
        });
        logger.info(`Created test user: ${userData.email} (${userData.role})`);
      }
    }

    logger.info('✅ Test users created/updated successfully');
  } catch (error) {
    logger.error('Failed to create test users:', error);
    throw error;
  }
};

/**
 * Create organizer users for events
 */
const createOrganizers = async (): Promise<string[]> => {
  try {
    logger.info('Creating organizer users...');
    const organizers = [
      {
        email: 'techconference@example.com',
        password: 'Organizer123!',
        firstName: 'Tech',
        lastName: 'Events',
        organizationName: 'Tech Conference Organizers',
      },
      {
        email: 'musicfest@example.com',
        password: 'Organizer123!',
        firstName: 'Music',
        lastName: 'Festivals',
        organizationName: 'Music Festivals Inc',
      },
      {
        email: 'workshops@example.com',
        password: 'Organizer123!',
        firstName: 'Skill',
        lastName: 'Workshops',
        organizationName: 'Professional Development Hub',
      },
    ];

    const organizerIds: string[] = [];

    for (const orgData of organizers) {
      const existing = await prisma.user.findUnique({
        where: { email: orgData.email },
      });

      if (existing) {
        logger.info(`Organizer ${orgData.email} already exists`);
        organizerIds.push(existing.id);
      } else {
        const hashedPassword = await hashPassword(orgData.password);
        const organizer = await prisma.user.create({
          data: {
            email: orgData.email,
            password: hashedPassword,
            firstName: orgData.firstName,
            lastName: orgData.lastName,
            organizationName: orgData.organizationName,
            role: UserRole.ORGANIZER,
            status: UserStatus.ACTIVE,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            isIdentityVerified: true,
            identityVerifiedAt: new Date(),
            verificationLevel: 2,
          },
        });
        organizerIds.push(organizer.id);
        logger.info(`Created organizer: ${orgData.email}`);
      }
    }

    return organizerIds;
  } catch (error) {
    logger.error('Failed to create organizers:', error);
    throw error;
  }
};

/**
 * Create mock events
 */
const createEvents = async (organizerIds: string[], superuserId: string): Promise<string[]> => {
  try {
    logger.info('Creating mock events...');

    // Get or create superuser for approval
    const superuser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });

    if (!superuser) {
      throw new Error('Superuser not found');
    }

    const now = new Date();
    const events = [
      {
        title: 'Tech Innovation Summit 2024',
        description: 'Join us for the biggest tech conference of the year featuring AI, blockchain, and cloud computing.',
        fullDescription: 'A comprehensive 3-day conference bringing together industry leaders, innovators, and tech enthusiasts. Features keynote speeches, workshops, networking sessions, and product demonstrations.',
        category: 'Technology',
        tags: ['technology', 'AI', 'innovation', 'conference'],
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        registrationDeadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        address: '123 Tech Street, San Francisco, CA 94102',
        isOnline: false,
        coordinates: { lat: 37.7749, lng: -122.4194 },
        isFree: false,
        price: new Decimal('299.99'),
        ticketTypes: [
          { name: 'Early Bird', price: 249.99, quantity: 100, features: ['Access to all sessions', 'Networking dinner'] },
          { name: 'Regular', price: 299.99, quantity: 200, features: ['Access to all sessions'] },
          { name: 'VIP', price: 499.99, quantity: 50, features: ['Access to all sessions', 'VIP networking', 'Premium seating'] },
        ],
        capacity: 350,
        availableSlots: 350,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        images: [
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
        ],
        type: EventType.PUBLIC,
        status: EventStatus.APPROVED,
        requirements: ['Laptop recommended', 'Business casual attire'],
        ageRestriction: '18+',
        duration: '3 days',
        speakers: [
          { name: 'Dr. Jane Smith', title: 'Chief AI Officer', company: 'Tech Corp' },
          { name: 'John Doe', title: 'Blockchain Expert', company: 'Crypto Labs' },
        ],
        sponsors: [
          { name: 'Tech Corp', logo: 'https://example.com/logo1.png' },
          { name: 'Cloud Services Inc', logo: 'https://example.com/logo2.png' },
        ],
        faqs: [
          { question: 'Will recordings be available?', answer: 'Yes, recordings will be available for all attendees after the event.' },
          { question: 'Is parking available?', answer: 'Yes, parking is available at the venue for $20 per day.' },
        ],
        organizerId: organizerIds[0],
        approvedBy: superuser.id,
        approvedAt: new Date(),
      },
      {
        title: 'Summer Music Festival',
        description: 'The ultimate summer music experience with top artists and amazing vibes.',
        fullDescription: 'A weekend music festival featuring multiple stages, food vendors, and camping options. Experience live performances from top artists across various genres.',
        category: 'Music',
        tags: ['music', 'festival', 'summer', 'entertainment'],
        startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 47 * 24 * 60 * 60 * 1000),
        startTime: '12:00 PM',
        endTime: '11:00 PM',
        registrationDeadline: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
        venue: 'Riverside Park',
        location: 'Austin, TX',
        address: '456 Music Avenue, Austin, TX 78701',
        isOnline: false,
        coordinates: { lat: 30.2672, lng: -97.7431 },
        isFree: false,
        price: new Decimal('149.99'),
        ticketTypes: [
          { name: 'Single Day', price: 79.99, quantity: 500, features: ['Access to all stages for one day'] },
          { name: 'Weekend Pass', price: 149.99, quantity: 1000, features: ['Access to all stages for both days'] },
          { name: 'VIP Weekend', price: 299.99, quantity: 100, features: ['VIP area access', 'Free drinks', 'Meet & greet'] },
        ],
        capacity: 1600,
        availableSlots: 1600,
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        images: [
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        ],
        type: EventType.PUBLIC,
        status: EventStatus.APPROVED,
        requirements: ['Valid ID required', 'No outside food or drinks'],
        ageRestriction: 'All Ages',
        duration: '2 days',
        speakers: [],
        sponsors: [
          { name: 'Music Records', logo: 'https://example.com/music-logo.png' },
        ],
        faqs: [
          { question: 'Can I bring my own food?', answer: 'Outside food is not allowed, but we have many food vendors on site.' },
          { question: 'Is camping available?', answer: 'Yes, camping passes are available for an additional $50.' },
        ],
        organizerId: organizerIds[1],
        approvedBy: superuser.id,
        approvedAt: new Date(),
      },
      {
        title: 'Web Development Bootcamp',
        description: 'Intensive 5-day bootcamp covering modern web development technologies.',
        fullDescription: 'Learn React, Node.js, TypeScript, and more in this hands-on bootcamp. Perfect for beginners and intermediate developers looking to level up their skills.',
        category: 'Education',
        tags: ['education', 'programming', 'web development', 'bootcamp'],
        startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000),
        startTime: '10:00 AM',
        endTime: '05:00 PM',
        registrationDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        venue: 'Tech Hub',
        location: 'Seattle, WA',
        address: '789 Code Street, Seattle, WA 98101',
        isOnline: true,
        onlineLink: 'https://zoom.us/j/123456789',
        isFree: false,
        price: new Decimal('499.99'),
        capacity: 50,
        availableSlots: 50,
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        images: [
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        ],
        type: EventType.PUBLIC,
        status: EventStatus.APPROVED,
        requirements: ['Laptop required', 'Basic programming knowledge recommended'],
        ageRestriction: '18+',
        duration: '5 days',
        speakers: [
          { name: 'Sarah Johnson', title: 'Senior Developer', company: 'WebTech Solutions' },
        ],
        faqs: [
          { question: 'Will I get a certificate?', answer: 'Yes, all participants will receive a certificate of completion.' },
          { question: 'Are recordings available?', answer: 'Yes, all sessions will be recorded and shared with participants.' },
        ],
        organizerId: organizerIds[2],
        approvedBy: superuser.id,
        approvedAt: new Date(),
      },
      {
        title: 'Art & Design Exhibition',
        description: 'Contemporary art exhibition featuring works from emerging and established artists.',
        fullDescription: 'Explore stunning contemporary artworks across various mediums. Meet the artists, attend workshops, and purchase unique pieces.',
        category: 'Arts',
        tags: ['art', 'design', 'exhibition', 'culture'],
        startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        startTime: '10:00 AM',
        endTime: '08:00 PM',
        registrationDeadline: null,
        venue: 'Modern Art Gallery',
        location: 'New York, NY',
        address: '321 Art Boulevard, New York, NY 10001',
        isOnline: false,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        isFree: true,
        price: null,
        capacity: null,
        availableSlots: null,
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
        images: [
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
        ],
        type: EventType.PUBLIC,
        status: EventStatus.APPROVED,
        requirements: [],
        ageRestriction: 'All Ages',
        duration: 'Ongoing',
        speakers: [],
        faqs: [
          { question: 'Is photography allowed?', answer: 'Photography is allowed but flash photography is prohibited.' },
          { question: 'Can I purchase artwork?', answer: 'Yes, many pieces are available for purchase. Contact gallery staff for details.' },
        ],
        organizerId: organizerIds[0],
        approvedBy: superuser.id,
        approvedAt: new Date(),
      },
      {
        title: 'Business Networking Mixer',
        description: 'Connect with entrepreneurs, investors, and business leaders in an informal setting.',
        fullDescription: 'An evening of networking, drinks, and meaningful conversations. Perfect for entrepreneurs looking to expand their network.',
        category: 'Business',
        tags: ['networking', 'business', 'entrepreneurship'],
        startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endDate: null,
        startTime: '06:00 PM',
        endTime: '09:00 PM',
        registrationDeadline: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        venue: 'Downtown Lounge',
        location: 'Chicago, IL',
        address: '555 Business Street, Chicago, IL 60601',
        isOnline: false,
        coordinates: { lat: 41.8781, lng: -87.6298 },
        isFree: false,
        price: new Decimal('49.99'),
        capacity: 100,
        availableSlots: 100,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800',
        images: [],
        type: EventType.PUBLIC,
        status: EventStatus.PENDING,
        requirements: ['Business casual attire'],
        ageRestriction: '21+',
        duration: '3 hours',
        speakers: [],
        faqs: [
          { question: 'What should I bring?', answer: 'Just bring business cards and a positive attitude!' },
        ],
        organizerId: organizerIds[2],
        approvedBy: null,
        approvedAt: null,
      },
      {
        title: 'Yoga & Wellness Retreat',
        description: 'A weekend retreat focused on yoga, meditation, and holistic wellness.',
        fullDescription: 'Escape the city and reconnect with yourself. Daily yoga sessions, meditation workshops, healthy meals, and nature walks.',
        category: 'Wellness',
        tags: ['yoga', 'wellness', 'retreat', 'meditation'],
        startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 61 * 24 * 60 * 60 * 1000),
        startTime: '08:00 AM',
        endTime: '06:00 PM',
        registrationDeadline: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000),
        venue: 'Mountain Retreat Center',
        location: 'Denver, CO',
        address: '999 Mountain View Road, Denver, CO 80201',
        isOnline: false,
        coordinates: { lat: 39.7392, lng: -104.9903 },
        isFree: false,
        price: new Decimal('199.99'),
        capacity: 30,
        availableSlots: 30,
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        images: [],
        type: EventType.PUBLIC,
        status: EventStatus.PENDING,
        requirements: ['Yoga mat', 'Comfortable clothing'],
        ageRestriction: '18+',
        duration: '2 days',
        speakers: [],
        faqs: [
          { question: 'Do I need yoga experience?', answer: 'No, all levels are welcome!' },
          { question: 'Are meals included?', answer: 'Yes, all meals are included in the price.' },
        ],
        organizerId: organizerIds[1],
        approvedBy: null,
        approvedAt: null,
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Watch innovative startups pitch their ideas to a panel of investors.',
        fullDescription: 'Join us for an exciting evening where 10 startups will pitch their ideas. The winner receives funding and mentorship opportunities.',
        category: 'Business',
        tags: ['startup', 'pitch', 'competition', 'investors'],
        startDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        endDate: null,
        startTime: '05:00 PM',
        endTime: '09:00 PM',
        registrationDeadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        venue: 'Innovation Hub',
        location: 'Boston, MA',
        address: '777 Startup Lane, Boston, MA 02101',
        isOnline: false,
        coordinates: { lat: 42.3601, lng: -71.0589 },
        isFree: true,
        price: null,
        capacity: 200,
        availableSlots: 200,
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
        images: [],
        type: EventType.PUBLIC,
        status: EventStatus.PENDING,
        requirements: [],
        ageRestriction: 'All Ages',
        duration: '4 hours',
        speakers: [],
        faqs: [
          { question: 'Can I participate as a startup?', answer: 'Applications are closed, but you can attend as an audience member.' },
        ],
        organizerId: organizerIds[0],
        approvedBy: null,
        approvedAt: null,
      },
      {
        title: 'Cooking Masterclass: Italian Cuisine',
        description: 'Learn to cook authentic Italian dishes from a professional chef.',
        fullDescription: 'Hands-on cooking class where you\'ll learn to prepare classic Italian dishes. Includes ingredients, recipes, and a delicious meal at the end.',
        category: 'Food & Drink',
        tags: ['cooking', 'food', 'italian', 'masterclass'],
        startDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
        endDate: null,
        startTime: '06:00 PM',
        endTime: '09:00 PM',
        registrationDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        venue: 'Culinary Studio',
        location: 'Portland, OR',
        address: '888 Food Street, Portland, OR 97201',
        isOnline: false,
        coordinates: { lat: 45.5152, lng: -122.6784 },
        isFree: false,
        price: new Decimal('89.99'),
        capacity: 20,
        availableSlots: 20,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
        images: [],
        type: EventType.PUBLIC,
        status: EventStatus.PENDING,
        requirements: ['Apron provided', 'All ingredients included'],
        ageRestriction: '18+',
        duration: '3 hours',
        speakers: [],
        faqs: [
          { question: 'Do I need cooking experience?', answer: 'No, this class is suitable for all skill levels.' },
          { question: 'Can I take food home?', answer: 'Yes, you can take home what you cook!' },
        ],
        organizerId: organizerIds[2],
        approvedBy: null,
        approvedAt: null,
      },
    ];

    const eventIds: string[] = [];

    for (const eventData of events) {
      const event = await prisma.event.create({
        data: {
          title: eventData.title,
          description: eventData.description,
          fullDescription: eventData.fullDescription,
          category: eventData.category,
          tags: eventData.tags,
          startDate: eventData.startDate,
          endDate: eventData.endDate || null,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          registrationDeadline: eventData.registrationDeadline,
          venue: eventData.venue,
          location: eventData.location,
          address: eventData.address,
          isOnline: eventData.isOnline,
          onlineLink: eventData.onlineLink,
          coordinates: eventData.coordinates,
          isFree: eventData.isFree,
          price: eventData.price,
          ticketTypes: eventData.ticketTypes,
          capacity: eventData.capacity,
          availableSlots: eventData.availableSlots,
          image: eventData.image,
          images: eventData.images,
          type: eventData.type,
          status: eventData.status,
          requirements: eventData.requirements,
          ageRestriction: eventData.ageRestriction,
          duration: eventData.duration,
          speakers: eventData.speakers,
          sponsors: eventData.sponsors,
          faqs: eventData.faqs,
          organizerId: eventData.organizerId,
          createdBy: eventData.organizerId,
          approvedBy: eventData.approvedBy,
          approvedAt: eventData.approvedAt,
        },
      });
      eventIds.push(event.id);
      logger.info(`Created event: ${eventData.title} (${eventData.status})`);
    }

    return eventIds;
  } catch (error) {
    logger.error('Failed to create events:', error);
    throw error;
  }
};

/**
 * Create featured events (4 featured events)
 */
const createFeaturedEvents = async (eventIds: string[], superuserId: string): Promise<void> => {
  try {
    logger.info('Creating featured events...');

    // Get approved events (first 4 approved events)
    const approvedEvents = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        status: EventStatus.APPROVED,
      },
      orderBy: { createdAt: 'asc' },
      take: 4,
    });

    if (approvedEvents.length < 4) {
      logger.warn(`Only ${approvedEvents.length} approved events found. Need 4 for featured events.`);
    }

    const featuredEventsData = [
      {
        eventId: approvedEvents[0]?.id,
        customTitle: 'Featured: Tech Innovation Summit',
        displayOrder: 1,
        isActive: true,
      },
      {
        eventId: approvedEvents[1]?.id,
        customTitle: 'Featured: Summer Music Festival',
        displayOrder: 2,
        isActive: true,
      },
      {
        eventId: approvedEvents[2]?.id,
        customTitle: 'Featured: Web Development Bootcamp',
        displayOrder: 3,
        isActive: true,
      },
      {
        eventId: approvedEvents[3]?.id,
        customTitle: 'Featured: Art & Design Exhibition',
        displayOrder: 4,
        isActive: true,
      },
    ];

    for (const featuredData of featuredEventsData) {
      if (!featuredData.eventId) {
        logger.warn('Skipping featured event - no event ID available');
        continue;
      }

      // Check if featured event already exists
      const existing = await prisma.featuredEvent.findFirst({
        where: { eventId: featuredData.eventId },
      });

      if (existing) {
        logger.info(`Featured event for event ${featuredData.eventId} already exists`);
        continue;
      }

      await prisma.featuredEvent.create({
        data: {
          eventId: featuredData.eventId,
          customTitle: featuredData.customTitle,
          displayOrder: featuredData.displayOrder,
          isActive: featuredData.isActive,
          createdBy: superuserId,
        },
      });
      logger.info(`Created featured event: ${featuredData.customTitle}`);
    }

    logger.info(`✅ Created ${featuredEventsData.filter(f => f.eventId).length} featured events`);
  } catch (error) {
    logger.error('Failed to create featured events:', error);
    throw error;
  }
};

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    logger.info('🌱 Seeding database...');
    
    // Verify database connection before proceeding
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database connection verified');
    } catch (error) {
      logger.error('❌ Failed to connect to database. Please check your DATABASE_URL.');
      logger.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
    
    // Create superuser
    await createSuperuser();
    
    // Get superuser ID
    const superuser = await prisma.user.findUnique({
      where: { email: SUPERVISOR_CREDENTIALS.email },
    });
    
    if (!superuser) {
      throw new Error('Superuser not found after creation');
    }

    // Create test users (organizer and attendee)
    await createTestUsers();

    // Create organizers
    const organizerIds = await createOrganizers();

    // Create events
    const eventIds = await createEvents(organizerIds, superuser.id);

    // Create featured events
    await createFeaturedEvents(eventIds, superuser.id);

    logger.info('✅ Script completed successfully');
    logger.info(`📊 Summary:`);
    logger.info(`   - Organizers: ${organizerIds.length}`);
    logger.info(`   - Events: ${eventIds.length}`);
    logger.info(`   - Featured Events: 4`);
  } catch (error) {
    logger.error('❌ Script failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
