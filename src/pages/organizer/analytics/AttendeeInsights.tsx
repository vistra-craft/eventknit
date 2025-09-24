import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrganizerLayout from "../OrganizerLayout";
import {
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  UserCheck,
  UserX,
  Globe,
  Heart,
} from "lucide-react";

const AttendeeInsights = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Mock data - in a real app, this would come from your API
  const attendeeStats = [
    {
      title: "Total Attendees",
      value: "4,247",
      change: "+18%",
      changeType: "positive",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Registered attendees",
    },
    {
      title: "New Attendees",
      value: "1,892",
      change: "+24%",
      changeType: "positive",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "First-time attendees",
    },
    {
      title: "Returning Attendees",
      value: "2,355",
      change: "+12%",
      changeType: "positive",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Repeat attendees",
    },
    {
      title: "No-Shows",
      value: "127",
      change: "-8%",
      changeType: "positive",
      icon: UserX,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Registered but didn't attend",
    },
    {
      title: "Avg. Satisfaction",
      value: "4.6",
      change: "+0.3",
      changeType: "positive",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Average rating",
    },
    {
      title: "Engagement Score",
      value: "87%",
      change: "+5%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Overall engagement",
    },
  ];

  const demographicData = {
    ageGroups: [
      { range: "18-24", count: 892, percentage: 21 },
      { range: "25-34", count: 1456, percentage: 34 },
      { range: "35-44", count: 1203, percentage: 28 },
      { range: "45-54", count: 512, percentage: 12 },
      { range: "55+", count: 184, percentage: 5 },
    ],
    locations: [
      { city: "San Francisco", count: 1245, percentage: 29 },
      { city: "New York", count: 892, percentage: 21 },
      { city: "Los Angeles", count: 678, percentage: 16 },
      { city: "Chicago", count: 456, percentage: 11 },
      { city: "Austin", count: 234, percentage: 6 },
      { city: "Other", count: 742, percentage: 17 },
    ],
    industries: [
      { industry: "Technology", count: 1456, percentage: 34 },
      { industry: "Marketing", count: 892, percentage: 21 },
      { industry: "Finance", count: 678, percentage: 16 },
      { industry: "Healthcare", count: 456, percentage: 11 },
      { industry: "Education", count: 234, percentage: 6 },
      { industry: "Other", count: 531, percentage: 12 },
    ],
    experience: [
      { level: "Entry Level", count: 1245, percentage: 29 },
      { level: "Mid-Level", count: 1789, percentage: 42 },
      { level: "Senior Level", count: 892, percentage: 21 },
      { level: "Executive", count: 321, percentage: 8 },
    ],
  };

  const behaviorInsights = [
    {
      id: 1,
      title: "Peak Registration Times",
      description: "Most registrations occur between 2-4 PM on weekdays",
      insight: "Consider scheduling important announcements during peak hours",
      icon: Clock,
      type: "timing",
    },
    {
      id: 2,
      title: "Mobile vs Desktop Usage",
      description: "68% of attendees register via mobile devices",
      insight: "Ensure mobile-optimized registration experience",
      icon: Globe,
      type: "device",
    },
    {
      id: 3,
      title: "Early Bird Preference",
      description: "Early bird registrations have 23% higher satisfaction scores",
      insight: "Consider extending early bird pricing periods",
      icon: Calendar,
      type: "pricing",
    },
    {
      id: 4,
      title: "Social Media Influence",
      description: "Attendees who found events via social media have 15% higher engagement",
      insight: "Increase social media marketing investment",
      icon: TrendingUp,
      type: "marketing",
    },
    {
      id: 5,
      title: "Networking Preferences",
      description: "Tech professionals prefer structured networking sessions",
      insight: "Add more structured networking opportunities",
      icon: Users,
      type: "networking",
    },
    {
      id: 6,
      title: "Content Consumption",
      description: "Video content has 40% higher engagement than text",
      insight: "Increase video content in event materials",
      icon: Star,
      type: "content",
    },
  ];

  const attendeeSegments = [
    {
      name: "Tech Enthusiasts",
      count: 1456,
      percentage: 34,
      characteristics: ["High engagement", "Prefers technical content", "Active in Q&A"],
      satisfaction: 4.8,
      retention: 78,
    },
    {
      name: "Business Professionals",
      count: 1203,
      percentage: 28,
      characteristics: ["Networking focused", "Values ROI", "Prefers case studies"],
      satisfaction: 4.5,
      retention: 72,
    },
    {
      name: "Students & Newcomers",
      count: 892,
      percentage: 21,
      characteristics: ["Learning focused", "Budget conscious", "Seeks mentorship"],
      satisfaction: 4.7,
      retention: 65,
    },
    {
      name: "Industry Veterans",
      count: 696,
      percentage: 17,
      characteristics: ["Experience sharing", "Mentorship role", "High-value content"],
      satisfaction: 4.6,
      retention: 85,
    },
  ];

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "timing":
        return "text-blue-600 bg-blue-100 border-blue-200";
      case "device":
        return "text-green-600 bg-green-100 border-green-200";
      case "pricing":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "marketing":
        return "text-purple-600 bg-purple-100 border-purple-200";
      case "networking":
        return "text-red-600 bg-red-100 border-red-200";
      case "content":
        return "text-orange-600 bg-orange-100 border-orange-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendee Insights</h1>
            <p className="text-muted-foreground mt-1">
              Understand your audience demographics, behavior, and preferences
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Events</option>
              <option value="tech">Tech Events</option>
              <option value="business">Business Events</option>
              <option value="marketing">Marketing Events</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Attendee Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {attendeeStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-foreground mb-1">
                      {stat.value}
                    </p>
                    <div className="flex items-center">
                      {stat.changeType === "positive" ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="demographics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demographicData.ageGroups.map((group, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">{group.range}</span>
                          <span className="text-sm text-muted-foreground">{group.count} ({group.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demographicData.locations.map((location, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">{location.city}</span>
                          <span className="text-sm text-muted-foreground">{location.count} ({location.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${location.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Industry Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Industry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demographicData.industries.map((industry, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">{industry.industry}</span>
                          <span className="text-sm text-muted-foreground">{industry.count} ({industry.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${industry.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Experience Level */}
              <Card>
                <CardHeader>
                  <CardTitle>Experience Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demographicData.experience.map((level, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">{level.level}</span>
                          <span className="text-sm text-muted-foreground">{level.count} ({level.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${level.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {behaviorInsights.map((insight) => (
                <Card key={insight.id} className={`border ${getInsightTypeColor(insight.type).split(' ')[2]}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getInsightTypeColor(insight.type).split(' ')[1]} flex items-center justify-center`}>
                        <insight.icon className={`h-4 w-4 ${getInsightTypeColor(insight.type).split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-foreground">Recommendation:</p>
                          <p className="text-sm text-muted-foreground">{insight.insight}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attendeeSegments.map((segment, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {segment.count} attendees ({segment.percentage}% of total)
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Satisfaction</p>
                        <p className="text-lg font-bold text-foreground">{segment.satisfaction} ⭐</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Retention Rate</p>
                        <p className="text-lg font-bold text-foreground">{segment.retention}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Key Characteristics:</p>
                      <div className="flex flex-wrap gap-2">
                        {segment.characteristics.map((char, charIndex) => (
                          <Badge key={charIndex} variant="secondary" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Engagement trend chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Session Duration</p>
                      <p className="text-xs text-muted-foreground">Average time spent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">4.2h</p>
                      <p className="text-xs text-muted-foreground">+12% vs last event</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Q&A Participation</p>
                      <p className="text-xs text-muted-foreground">Questions asked</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">67%</p>
                      <p className="text-xs text-muted-foreground">of attendees</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Networking Activity</p>
                      <p className="text-xs text-muted-foreground">Connections made</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">3.4</p>
                      <p className="text-xs text-muted-foreground">avg per attendee</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Social Sharing</p>
                      <p className="text-xs text-muted-foreground">Social media posts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">23%</p>
                      <p className="text-xs text-muted-foreground">of attendees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

export default AttendeeInsights;
