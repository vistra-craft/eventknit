import { PrismaClient, StaffDepartment, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface StaffProfileData {
  employeeId?: string;
  department?: StaffDepartment;
  location?: string;
  hireDate?: Date;
  salary?: number;
  hourlyRate?: number;
  permissions?: Record<string, boolean>;
  totalHours?: number;
  rating?: number;
}

export interface OrganizerProfileData {
  website?: string;
  description?: string;
  businessLicense?: string;
  taxId?: string;
  bankAccountLast4?: string;
  location?: string;
  totalEvents?: number;
  totalRevenue?: number;
  rating?: number;
}

export interface EmergencyContactData {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export class ExtendedProfileService {
  /**
   * Get staff profile by user ID
   */
  static async getStaffProfile(userId: string) {
    const profile = await prisma.staffProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            status: true,
            role: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!profile) {
      // Return user data with null profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          status: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { user, staffProfile: null };
    }

    return { user: profile.user, staffProfile: profile };
  }

  /**
   * Create or update staff profile
   */
  static async upsertStaffProfile(userId: string, data: StaffProfileData) {
    const profile = await prisma.staffProfile.upsert({
      where: { userId },
      create: {
        userId,
        employeeId: data.employeeId,
        department: data.department || 'OPERATIONS',
        location: data.location,
        hireDate: data.hireDate || new Date(),
        salary: data.salary ? new Prisma.Decimal(data.salary) : null,
        hourlyRate: data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null,
        permissions: data.permissions || {},
        totalHours: data.totalHours ? new Prisma.Decimal(data.totalHours) : new Prisma.Decimal(0),
        rating: data.rating ? new Prisma.Decimal(data.rating) : null,
      },
      update: {
        employeeId: data.employeeId,
        department: data.department,
        location: data.location,
        hireDate: data.hireDate,
        salary: data.salary !== undefined ? (data.salary ? new Prisma.Decimal(data.salary) : null) : undefined,
        hourlyRate: data.hourlyRate !== undefined ? (data.hourlyRate ? new Prisma.Decimal(data.hourlyRate) : null) : undefined,
        permissions: data.permissions,
        totalHours: data.totalHours !== undefined ? new Prisma.Decimal(data.totalHours) : undefined,
        rating: data.rating !== undefined ? (data.rating ? new Prisma.Decimal(data.rating) : null) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            status: true,
            role: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Get organizer profile by user ID
   */
  static async getOrganizerProfile(userId: string) {
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            organizationName: true,
            businessEmail: true,
            status: true,
            role: true,
            avatar: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!profile) {
      // Return user data with null profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          organizationName: true,
          businessEmail: true,
          status: true,
          role: true,
          avatar: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { user, organizerProfile: null };
    }

    return { user: profile.user, organizerProfile: profile };
  }

  /**
   * Create or update organizer profile
   */
  static async upsertOrganizerProfile(userId: string, data: OrganizerProfileData) {
    const profile = await prisma.organizerProfile.upsert({
      where: { userId },
      create: {
        userId,
        website: data.website,
        description: data.description,
        businessLicense: data.businessLicense,
        taxId: data.taxId,
        bankAccountLast4: data.bankAccountLast4,
        location: data.location,
        totalEvents: data.totalEvents || 0,
        totalRevenue: data.totalRevenue ? new Prisma.Decimal(data.totalRevenue) : new Prisma.Decimal(0),
        rating: data.rating ? new Prisma.Decimal(data.rating) : null,
      },
      update: {
        website: data.website,
        description: data.description,
        businessLicense: data.businessLicense,
        taxId: data.taxId,
        bankAccountLast4: data.bankAccountLast4,
        location: data.location,
        totalEvents: data.totalEvents,
        totalRevenue: data.totalRevenue !== undefined ? new Prisma.Decimal(data.totalRevenue) : undefined,
        rating: data.rating !== undefined ? (data.rating ? new Prisma.Decimal(data.rating) : null) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            organizationName: true,
            status: true,
            role: true,
          },
        },
      },
    });

    return profile;
  }

  /**
   * Get emergency contact by user ID
   */
  static async getEmergencyContact(userId: string) {
    const contact = await prisma.emergencyContact.findUnique({
      where: { userId },
    });

    return contact;
  }

  /**
   * Create or update emergency contact
   */
  static async upsertEmergencyContact(userId: string, data: EmergencyContactData) {
    const contact = await prisma.emergencyContact.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name,
        phone: data.phone,
        relationship: data.relationship,
        email: data.email,
      },
      update: {
        name: data.name,
        phone: data.phone,
        relationship: data.relationship,
        email: data.email,
      },
    });

    return contact;
  }

  /**
   * Delete emergency contact
   */
  static async deleteEmergencyContact(userId: string) {
    await prisma.emergencyContact.delete({
      where: { userId },
    });
  }

  /**
   * Get full user profile with all extended data
   */
  static async getFullUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        otherName: true,
        phoneNumber: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        organizationName: true,
        businessEmail: true,
        status: true,
        role: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        staffProfile: true,
        organizerProfile: true,
        emergencyContact: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
