import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrganizerLayout from "./OrganizerLayout";
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  Settings,
  Calendar,
  FileText,
  Plus
} from "lucide-react";

// Analytics Pages
export const AnalyticsOverview = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">Track your event performance and insights</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground mb-4">Comprehensive analytics and reporting coming soon</p>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const EventPerformance = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Performance</h1>
        <p className="text-muted-foreground mt-1">Detailed performance metrics for your events</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Event Performance Analytics</h3>
          <p className="text-muted-foreground mb-4">Detailed event performance metrics coming soon</p>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Performance Data
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const AttendeeInsights = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendee Insights</h1>
        <p className="text-muted-foreground mt-1">Understand your audience better</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Attendee Analytics</h3>
          <p className="text-muted-foreground mb-4">Detailed attendee insights and demographics coming soon</p>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View Insights
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const RevenueReports = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Reports</h1>
        <p className="text-muted-foreground mt-1">Track your financial performance</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Revenue Analytics</h3>
          <p className="text-muted-foreground mb-4">Comprehensive revenue reporting coming soon</p>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Revenue Data
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Communications Page
export const CommunicationsPage = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Communications</h1>
        <p className="text-muted-foreground mt-1">Manage your communications and messaging</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Communications Center</h3>
          <p className="text-muted-foreground mb-4">Communication tools and messaging features coming soon</p>
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Manage Communications
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Team Pages
export const StaffManagement = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground mt-1">Manage your team and staff members</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Team Management</h3>
          <p className="text-muted-foreground mb-4">Staff management tools coming soon</p>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Staff
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const RolesPermissions = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">Configure user roles and permissions</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Role Management</h3>
          <p className="text-muted-foreground mb-4">Role and permission management coming soon</p>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Roles
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const TeamCalendar = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Calendar</h1>
        <p className="text-muted-foreground mt-1">Manage team schedules and availability</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Team Scheduling</h3>
          <p className="text-muted-foreground mb-4">Team calendar and scheduling tools coming soon</p>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const TeamPerformance = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Performance</h1>
        <p className="text-muted-foreground mt-1">Track team performance and productivity</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Performance Analytics</h3>
          <p className="text-muted-foreground mb-4">Team performance tracking coming soon</p>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Performance
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Settings Page
export const SettingsPage = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your account and preferences</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Account Settings</h3>
          <p className="text-muted-foreground mb-4">Account configuration and preferences coming soon</p>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

// Event Templates and Drafts
export const EventTemplates = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Templates</h1>
        <p className="text-muted-foreground mt-1">Create and manage event templates</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Template Library</h3>
          <p className="text-muted-foreground mb-4">Event templates and reusable designs coming soon</p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);

export const EventDrafts = () => (
  <OrganizerLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Event Drafts</h1>
        <p className="text-muted-foreground mt-1">Manage your draft events</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Draft Events</h3>
          <p className="text-muted-foreground mb-4">Event drafts and work-in-progress events coming soon</p>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Draft
          </Button>
        </CardContent>
      </Card>
    </div>
  </OrganizerLayout>
);