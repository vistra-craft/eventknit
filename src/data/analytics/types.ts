// Analytics Data Types and Interfaces

export interface AnalyticsMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface EventPerformanceData {
  id: number;
  title: string;
  date: string;
  status: 'completed' | 'upcoming' | 'active';
  metrics: {
    attendees: number;
    capacity: number;
    revenue: number;
    views: number;
    conversion: number;
    rating: number;
    speakers: number;
    exhibitors: number;
    sponsors: number;
    duration: string;
    location: string;
  };
  performance: {
    attendanceRate: number;
    revenuePerAttendee: number;
    conversionRate: number;
    satisfactionScore: number;
    engagementScore: number;
  };
  trends: {
    registrationGrowth: number;
    revenueGrowth: number;
    attendanceGrowth: number;
    satisfactionGrowth: number;
  };
}

export interface AttendeeDemographics {
  ageGroups: {
    range: string;
    count: number;
    percentage: number;
  }[];
  locations: {
    city: string;
    count: number;
    percentage: number;
  }[];
  industries: {
    industry: string;
    count: number;
    percentage: number;
  }[];
  experience: {
    level: string;
    count: number;
    percentage: number;
  }[];
}

export interface BehaviorInsight {
  id: number;
  title: string;
  description: string;
  insight: string;
  icon: string;
  type: 'timing' | 'device' | 'pricing' | 'marketing' | 'networking' | 'content';
}

export interface AttendeeSegment {
  name: string;
  count: number;
  percentage: number;
  characteristics: string[];
  satisfaction: number;
  retention: number;
}

export interface RevenueData {
  event: string;
  date: string;
  status: 'completed' | 'upcoming' | 'active';
  revenue: number;
  attendees: number;
  ticketPrice: number;
  revenuePerAttendee: number;
  refunds: number;
  netRevenue: number;
  growth: number;
}

export interface PaymentMethod {
  method: string;
  percentage: number;
  amount: number;
  count: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  events: number;
}

export interface FinancialInsight {
  id: number;
  title: string;
  description: string;
  insight: string;
  icon: string;
  type: 'growth' | 'strategy' | 'payment' | 'policy' | 'timing' | 'pricing';
}

export interface TopPerformingEvent {
  id: number;
  title: string;
  attendees: number;
  revenue: number;
  conversion: number;
  views: number;
  rating: number;
  status: 'completed' | 'upcoming' | 'active';
}

export interface RecentInsight {
  id: number;
  type: 'trend' | 'alert' | 'insight' | 'recommendation';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export interface RecentActivity {
  id: number;
  type: 'registration' | 'payment' | 'speaker' | 'exhibitor' | 'sponsor' | 'completion' | 'view';
  message: string;
  time: string;
  icon: string;
  color: string;
  eventId: number;
}

