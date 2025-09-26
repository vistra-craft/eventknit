import { useState } from "react";
import { Search, Filter, Calendar, MapPin, Users, Eye, X, MoreHorizontal, AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import AdminLayout from "../AdminLayout";

interface Event {
  id: string;
  title: string;
  organizer: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: "declined";
  category: string;
  type: "public" | "private";
  price: "free" | "paid";
  declinedDate: string;
  reason: string;
  declinedBy: string;
}

const mockDeclinedEvents: Event[] = [
  {
    id: "1",
    title: "Tech Conference 2024",
    organizer: "TechCorp Inc.",
    date: "2024-03-15",
    time: "09:00",
    location: "San Francisco, CA",
    attendees: 250,
    status: "declined",
    category: "Technology",
    type: "public",
    price: "paid",
    declinedDate: "2024-01-15",
    reason: "Inappropriate content description",
    declinedBy: "Admin User"
  },
  {
    id: "2",
    title: "Music Festival",
    organizer: "Music Events LLC",
    date: "2024-04-20",
    time: "18:00",
    location: "Austin, TX",
    attendees: 5000,
    status: "declined",
    category: "Music",
    type: "public",
    price: "paid",
    declinedDate: "2024-01-20",
    reason: "Missing required documentation",
    declinedBy: "Admin User"
  },
  {
    id: "3",
    title: "Business Workshop",
    organizer: "Business Academy",
    date: "2024-03-10",
    time: "14:00",
    location: "New York, NY",
    attendees: 45,
    status: "declined",
    category: "Business",
    type: "private",
    price: "free",
    declinedDate: "2024-01-18",
    reason: "Venue not approved for events",
    declinedBy: "Admin User"
  },
  {
    id: "4",
    title: "Art Exhibition",
    organizer: "Modern Art Gallery",
    date: "2024-02-28",
    time: "10:00",
    location: "Los Angeles, CA",
    attendees: 120,
    status: "declined",
    category: "Art",
    type: "public",
    price: "free",
    declinedDate: "2024-01-22",
    reason: "Organizer account suspended",
    declinedBy: "Admin User"
  },
  {
    id: "5",
    title: "Sports Tournament",
    organizer: "Sports Club",
    date: "2024-05-15",
    time: "08:00",
    location: "Chicago, IL",
    attendees: 300,
    status: "declined",
    category: "Sports",
    type: "public",
    price: "paid",
    declinedDate: "2024-01-25",
    reason: "Duplicate event submission",
    declinedBy: "Admin User"
  }
];

const DeclinedEventsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

  const filteredEvents = mockDeclinedEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPrice = priceFilter === "all" || event.price === priceFilter;
    const matchesReason = reasonFilter === "all" || event.reason.toLowerCase().includes(reasonFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesType && matchesPrice && matchesReason;
  });

  const getTypeBadge = (type: string) => {
    return type === "public" 
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getPriceBadge = (price: string) => {
    return price === "free" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
  };

  const handleReapprove = (eventId: string) => {
    console.log("Re-approving event:", eventId);
    // TODO: Implement re-approval logic
  };

  const getDaysSinceDeclined = (declinedDate: string) => {
    const declined = new Date(declinedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - declined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Declined Events</h1>
            <p className="text-gray-600">Review events that were declined and their reasons</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {mockDeclinedEvents.length} declined events
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events or organizers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Comedy">Comedy</SelectItem>
                  <SelectItem value="Theatre">Theatre</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="content">Content Issues</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="venue">Venue Issues</SelectItem>
                  <SelectItem value="organizer">Organizer Issues</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        Declined
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.price)}`}>
                        {event.price}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <X className="h-4 w-4" />
                        <span>Declined {getDaysSinceDeclined(event.declinedDate)} days ago</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Reason: {event.reason}</p>
                          <p className="text-xs text-red-600">Declined by {event.declinedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleReapprove(event.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Re-approve
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <X className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No declined events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default DeclinedEventsPage;
