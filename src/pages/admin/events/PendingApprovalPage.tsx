import { useState } from "react";
import { Search, Filter, Calendar, MapPin, Users, Eye, Check, X, Clock, MoreHorizontal } from "lucide-react";
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
  status: "pending";
  category: string;
  type: "public" | "private";
  price: "free" | "paid";
  submittedDate: string;
  description: string;
}

const mockPendingEvents: Event[] = [
  {
    id: "1",
    title: "Tech Conference 2024",
    organizer: "TechCorp Inc.",
    date: "2024-03-15",
    time: "09:00",
    location: "San Francisco, CA",
    attendees: 250,
    status: "pending",
    category: "Technology",
    type: "public",
    price: "paid",
    submittedDate: "2024-01-15",
    description: "Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing."
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
    price: "paid",
    submittedDate: "2024-01-20",
    description: "Three-day music festival featuring indie and mainstream artists."
  },
  {
    id: "3",
    title: "Business Workshop",
    organizer: "Business Academy",
    date: "2024-03-10",
    time: "14:00",
    location: "New York, NY",
    attendees: 45,
    status: "pending",
    category: "Business",
    type: "private",
    price: "free",
    submittedDate: "2024-01-18",
    description: "Interactive workshop on modern business strategies and leadership."
  },
  {
    id: "4",
    title: "Art Exhibition",
    organizer: "Modern Art Gallery",
    date: "2024-02-28",
    time: "10:00",
    location: "Los Angeles, CA",
    attendees: 120,
    status: "pending",
    category: "Art",
    type: "public",
    price: "free",
    submittedDate: "2024-01-22",
    description: "Contemporary art exhibition showcasing emerging artists."
  },
  {
    id: "5",
    title: "Sports Tournament",
    organizer: "Sports Club",
    date: "2024-05-15",
    time: "08:00",
    location: "Chicago, IL",
    attendees: 300,
    status: "pending",
    category: "Sports",
    type: "public",
    price: "paid",
    submittedDate: "2024-01-25",
    description: "Annual basketball tournament for amateur teams."
  }
];

const PendingApprovalPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const filteredEvents = mockPendingEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPrice = priceFilter === "all" || event.price === priceFilter;
    const matchesLocation = locationFilter === "all" || event.location.includes(locationFilter);
    
    return matchesSearch && matchesCategory && matchesType && matchesPrice && matchesLocation;
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

  const handleApprove = (eventId: string) => {
    console.log("Approving event:", eventId);
    // TODO: Implement approval logic
  };

  const handleDecline = (eventId: string) => {
    console.log("Declining event:", eventId);
    // TODO: Implement decline logic
  };

  const getDaysSinceSubmission = (submittedDate: string) => {
    const submitted = new Date(submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approval</h1>
            <p className="text-gray-600">Review and approve events waiting for platform approval</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {mockPendingEvents.length} events pending
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
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                        Pending
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
                        <Clock className="h-4 w-4" />
                        <span>Submitted {getDaysSinceSubmission(event.submittedDate)} days ago</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApprove(event.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDecline(event.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
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
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No pending events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingApprovalPage;
