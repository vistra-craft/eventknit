import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Eye, MoreHorizontal } from "lucide-react";
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
  status: "active" | "pending" | "cancelled" | "completed";
  category: string;
  type: "public" | "private";
  price: "free" | "paid";
}

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Tech Conference 2024",
    organizer: "TechCorp Inc.",
    date: "2024-03-15",
    time: "09:00",
    location: "San Francisco, CA",
    attendees: 250,
    status: "active",
    category: "Technology",
    type: "public",
    price: "paid"
  },
  {
    id: "2",
    title: "Music Festival",
    organizer: "Music Events LLC",
    date: "2024-04-20",
    time: "18:00",
    location: "Austin, TX",
    attendees: 5000,
    status: "pending",
    category: "Music",
    type: "public",
    price: "paid"
  },
  {
    id: "3",
    title: "Business Workshop",
    organizer: "Business Academy",
    date: "2024-03-10",
    time: "14:00",
    location: "New York, NY",
    attendees: 45,
    status: "active",
    category: "Business",
    type: "private",
    price: "free"
  },
  {
    id: "4",
    title: "Art Exhibition",
    organizer: "Modern Art Gallery",
    date: "2024-02-28",
    time: "10:00",
    location: "Los Angeles, CA",
    attendees: 120,
    status: "completed",
    category: "Art",
    type: "public",
    price: "free"
  },
  {
    id: "5",
    title: "Sports Tournament",
    organizer: "Sports Club",
    date: "2024-05-15",
    time: "08:00",
    location: "Chicago, IL",
    attendees: 300,
    status: "active",
    category: "Sports",
    type: "public",
    price: "paid"
  }
];

const AllEventsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPrice = priceFilter === "all" || event.price === priceFilter;
    const matchesLocation = locationFilter === "all" || event.location.includes(locationFilter);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesType && matchesPrice && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Events</h1>
            <p className="text-gray-600">Manage and monitor all platform events</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {mockEvents.length} events
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="San Francisco">San Francisco</SelectItem>
                  <SelectItem value="Austin">Austin</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                  <SelectItem value="Chicago">Chicago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className="border-border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/events/${event.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <Badge className={`text-xs ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.price)}`}>
                        {event.price}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                      <span className="text-gray-500">by {event.organizer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/events/${event.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add dropdown menu for more actions
                      }}
                    >
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
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AllEventsPage;
