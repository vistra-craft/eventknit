import { useState } from "react";
import { Search, Calendar, MapPin, Users, Eye, History, MoreHorizontal, TrendingUp } from "lucide-react";
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
  status: "completed";
  category: string;
  type: "public" | "private";
  price: "free" | "paid";
  actualAttendees: number;
  revenue: number;
  rating: number;
}

const mockPastEvents: Event[] = [
  {
    id: "1",
    title: "Tech Conference 2023",
    organizer: "TechCorp Inc.",
    date: "2023-12-15",
    time: "09:00",
    location: "San Francisco, CA",
    attendees: 250,
    status: "completed",
    category: "Technology",
    type: "public",
    price: "paid",
    actualAttendees: 245,
    revenue: 24500,
    rating: 4.8
  },
  {
    id: "2",
    title: "Music Festival",
    organizer: "Music Events LLC",
    date: "2023-11-20",
    time: "18:00",
    location: "Austin, TX",
    attendees: 5000,
    status: "completed",
    category: "Music",
    type: "public",
    price: "paid",
    actualAttendees: 4850,
    revenue: 97000,
    rating: 4.6
  },
  {
    id: "3",
    title: "Art Exhibition",
    organizer: "Modern Art Gallery",
    date: "2023-10-28",
    time: "10:00",
    location: "Los Angeles, CA",
    attendees: 120,
    status: "completed",
    category: "Art",
    type: "public",
    price: "free",
    actualAttendees: 115,
    revenue: 0,
    rating: 4.9
  },
  {
    id: "4",
    title: "Business Workshop",
    organizer: "Business Academy",
    date: "2023-09-10",
    time: "14:00",
    location: "New York, NY",
    attendees: 45,
    status: "completed",
    category: "Business",
    type: "private",
    price: "free",
    actualAttendees: 42,
    revenue: 0,
    rating: 4.7
  },
  {
    id: "5",
    title: "Sports Tournament",
    organizer: "Sports Club",
    date: "2023-08-15",
    time: "08:00",
    location: "Chicago, IL",
    attendees: 300,
    status: "completed",
    category: "Sports",
    type: "public",
    price: "paid",
    actualAttendees: 285,
    revenue: 14250,
    rating: 4.5
  }
];

const PastEventsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const filteredEvents = mockPastEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPrice = priceFilter === "all" || event.price === priceFilter;
    const matchesMonth = monthFilter === "all" || new Date(event.date).getMonth() === parseInt(monthFilter);
    
    return matchesSearch && matchesCategory && matchesType && matchesPrice && matchesMonth;
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

  const getAttendanceRate = (expected: number, actual: number) => {
    return Math.round((actual / expected) * 100);
  };

  const months = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Past Events</h1>
            <p className="text-gray-600">View completed events and their performance metrics</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {mockPastEvents.length} past events
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
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
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
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
                        Completed
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
                        <span>{event.actualAttendees} / {event.attendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{getAttendanceRate(event.attendees, event.actualAttendees)}% attendance</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Rating: {event.rating}/5.0</span>
                      {event.revenue > 0 && (
                        <span className="text-gray-600">Revenue: ${event.revenue.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
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
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No past events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default PastEventsPage;
