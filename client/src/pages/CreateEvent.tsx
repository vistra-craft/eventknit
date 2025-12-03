import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  MapPin, 
  Users, 
  Ticket, 
  Mail, 
  Plus, 
  X, 
  Upload,
  Eye,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Tag,
  Minus,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface Speaker {
  name: string;
  title: string;
  bio: string;
}

interface Sponsor {
  name: string;
  level: 'gold' | 'silver' | 'bronze';
  logo: string;
}

interface RegistrationField {
  id: string;
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
  options?: string[];
}

interface EventData {
  title: string;
  organizer: string;
  description: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  location: string;
  venue: string;
  address: string;
  onlineLink: string;
  price: string;
  totalSlots: number;
  image: string;
  requirements: string;
  isOnline: boolean;
  capacity: string;
  category?: string;
}

type Tag = string;

interface CreateEventProps {
  showLayout?: boolean; // Whether to show navbar and footer
}

export default function CreateEvent({ showLayout = true }: CreateEventProps) {
  const [eventType, setEventType] = useState("in-person");
  const [isRecurring, setIsRecurring] = useState(false);
  interface TicketType {
    id: number;
    name: string;
    type: 'free' | 'paid';
    price: string;
    quantity: string;
  }

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 1, name: "General Admission", type: "paid", price: "50", quantity: "100" }
  ]);
  const [categories, setCategories] = useState(["Music", "Concert"]);
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [speakers, setSpeakers] = useState<Speaker[]>([{ name: "", title: "", bio: "" }]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([{ name: "", level: "gold", logo: "" }]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [eventData, setEventData] = useState<EventData>({
    title: "",
    organizer: "",
    description: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    location: "",
    venue: "",
    address: "",
    onlineLink: "",
    price: "",
    totalSlots: 0,
    image: "",
    requirements: "",
    isOnline: false,
    capacity: ""
  });

  // Registration form fields
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([
    {
      id: "firstName",
      name: "firstName",
      type: "text",
      label: "First Name",
      required: true,
      placeholder: "Enter your first name",
    },
    {
      id: "lastName",
      name: "lastName",
      type: "text",
      label: "Last Name",
      required: true,
      placeholder: "Enter your last name",
    },
    {
      id: "email",
      name: "email",
      type: "email",
      label: "Email Address",
      required: true,
      placeholder: "your.email@example.com",
    },
  ]);

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Select/Radio" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
  ];

  const eventCategories = [
    "Technology", "Business", "Arts", "Music", "Sports", "Education", 
    "Health", "Food", "Travel", "Networking", "Workshop", "Conference", 
    "Wellness", "Entertainment", "Community", "Charity"
  ];

  const handleInputChange = <K extends keyof EventData>(
    field: K,
    value: K extends 'totalSlots' ? number | string : EventData[K]
  ) => {
    const processedValue = field === 'totalSlots' 
      ? typeof value === 'string' 
        ? value === '' 
          ? 0 
          : Number(value) 
        : value
      : value;

    setEventData((prev) => ({ ...prev, [field]: processedValue }));
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { 
      id: Date.now(), 
      name: "", 
      type: "paid", 
      price: "", 
      quantity: "" 
    }]);
  };

  const removeTicketType = (id: number) => {
    setTicketTypes(ticketTypes.filter(ticket => ticket.id !== id));
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter(cat => cat !== category));
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: "", title: "", bio: "" }]);
  };

  const removeSpeaker = (index: number) => {
    if (speakers.length > 1) {
      setSpeakers(speakers.filter((_, i) => i !== index));
    }
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { name: "", level: "gold", logo: "" }]);
  };

  const removeSponsor = (index: number) => {
    if (sponsors.length > 1) {
      setSponsors(sponsors.filter((_, i) => i !== index));
    }
  };

  // Registration form functions
  const addRegistrationField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "Enter placeholder text",
    };
    setRegistrationFields((prev) => [...prev, newField]);
  };

  const updateRegistrationField = (index: number, updates: Partial<RegistrationField>) => {
    setRegistrationFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const removeRegistrationField = (index: number) => {
    if (registrationFields.length > 3) {
      setRegistrationFields((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addSelectOption = (fieldIndex: number) => {
    const field = registrationFields[fieldIndex];
    const newOptions = [...(field.options || []), ""];
    updateRegistrationField(fieldIndex, { options: newOptions });
  };

  const updateSelectOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = registrationFields[fieldIndex];
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    updateRegistrationField(fieldIndex, { options: newOptions });
  };

  const removeSelectOption = (fieldIndex: number, optionIndex: number) => {
    const field = registrationFields[fieldIndex];
    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
    updateRegistrationField(fieldIndex, { options: newOptions });
  };

  const calculateProgress = () => {
    const requiredFields = [
      eventData.title, eventData.organizer, eventData.description,
      eventData.date, eventData.time, eventData.location || eventData.onlineLink,
      eventData.price, categories.length > 0
    ];
    const filledFields = requiredFields.filter(field => field && field.toString().trim() !== "").length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  const handleSpeakerChange = (index: number, field: 'name' | 'title' | 'bio', value: string) => {
    const updatedSpeakers = [...speakers];
    updatedSpeakers[index] = { ...updatedSpeakers[index], [field]: value };
    setSpeakers(updatedSpeakers);
  };

  const handleSponsorChange = (index: number, field: 'name' | 'level' | 'logo', value: string) => {
    const updatedSponsors = [...sponsors];
    updatedSponsors[index] = { ...updatedSponsors[index], [field]: value } as Sponsor;
    setSponsors(updatedSponsors);
  };

  return (
    <div className="min-h-screen bg-background">
      {showLayout && <Navbar />}
      <div className={showLayout ? "pt-20 pb-12 bg-gradient-to-b from-primary/5 via-background to-muted/10" : "py-8 bg-gradient-to-b from-primary/5 via-background to-muted/10"}>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Event</h1>
            <p className="text-muted-foreground">Set up your event with all the details attendees need to know</p>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Completion Progress</span>
                <span>{calculateProgress()}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-muted">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Essential Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Title *</Label>
                      <Input 
                        id="eventName" 
                        placeholder="Give your event a catchy title" 
                        value={eventData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizer">Organizer Name *</Label>
                      <Input 
                        id="organizer" 
                        placeholder="Your organization name" 
                        value={eventData.organizer}
                        onChange={(e) => handleInputChange("organizer", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description *</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe what your event is about..." 
                      rows={4}
                      value={eventData.description}
                      maxLength={5000}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type *</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-person">In-Person</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Primary Category *</Label>
                      <Select value={eventData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Start Date *</Label>
                      <Input 
                        id="eventDate" 
                        type="date" 
                        value={eventData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventTime">Start Time *</Label>
                      <Input 
                        id="eventTime" 
                        type="time" 
                        value={eventData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        id="endDate" 
                        type="date" 
                        value={eventData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input 
                        id="endTime" 
                        type="time" 
                        value={eventData.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="recurring" 
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                      />
                      <Label htmlFor="recurring">This is a recurring event</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="isOnline"
                        type="checkbox"
                        checked={eventData.isOnline}
                        onChange={(e) =>
                          handleInputChange("isOnline", e.target.checked)
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isOnline"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        This is an online event
                      </label>
                    </div>
                  </div>

                  {isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="recurrence">Recurrence Pattern</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recurringEndDate">Recurring End Date</Label>
                        <Input id="recurringEndDate" type="date" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location & Venue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventType !== "online" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="venue">Venue Name *</Label>
                          <Input 
                            id="venue" 
                            placeholder="Enter venue name" 
                            value={eventData.venue}
                            onChange={(e) => handleInputChange("venue", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">City/Location *</Label>
                          <Input 
                            id="location" 
                            placeholder="City, State/Country" 
                            value={eventData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Full Address *</Label>
                        <Textarea 
                          id="address" 
                          placeholder="Enter complete address including postal code" 
                          rows={3} 
                          value={eventData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          maxLength={500}
                        />
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Map Preview (Integration Ready)</p>
                        <div className="w-full h-32 bg-muted-foreground/10 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {eventType !== "in-person" && (
                    <div className="space-y-2">
                      <Label htmlFor="onlineLink">Online Event Link *</Label>
                      <Input 
                        id="onlineLink" 
                        placeholder="https://zoom.us/j/..." 
                        value={eventData.onlineLink}
                        onChange={(e) => handleInputChange("onlineLink", e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        This link will be shared with registered attendees
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Event Capacity *</Label>
                      <Input 
                        id="capacity" 
                        type="number" 
                        placeholder="Maximum attendees" 
                        value={eventData.totalSlots}
                        onChange={(e) => handleInputChange("totalSlots", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Ticket Price (USD) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="price" 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-10"
                          min="0" 
                          step="0.01"
                          value={eventData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Branding & Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Cover Image</Label>
                      <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Upload cover image (1200x630 recommended)</p>
                        <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Organizer Logo</Label>
                      <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Upload logo (square format preferred)</p>
                        <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Or provide image URL</Label>
                    <Input 
                      id="imageUrl" 
                      placeholder="https://example.com/image.jpg" 
                      value={eventData.image}
                      onChange={(e) => handleInputChange("image", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categorization & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Additional Categories</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {categories.map((category) => (
                        <Badge key={category} variant="secondary" className="pr-1">
                          {category}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 ml-1"
                            onClick={() => removeCategory(category)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add category" 
                        value={newCategory}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                      />
                      <Button onClick={addCategory} variant="outline">Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Event Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="pr-1">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 ml-1"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add tags (e.g., networking, beginner-friendly)" 
                        value={newTag}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button onClick={addTag} variant="outline">Add Tag</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Requirements & Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ageRestriction">Age Restrictions</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age restriction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-ages">All Ages Welcome</SelectItem>
                          <SelectItem value="18+">18+ Only</SelectItem>
                          <SelectItem value="21+">21+ Only</SelectItem>
                          <SelectItem value="minor-supervision">Minors with Adult Supervision</SelectItem>
                          <SelectItem value="custom">Custom Age Restriction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dresscode">Dress Code</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dress code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="business-casual">Business Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="costume">Costume/Theme</SelectItem>
                          <SelectItem value="none">No Dress Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Prerequisites & Requirements</Label>
                    <Textarea 
                      id="requirements" 
                      placeholder="List any requirements, prerequisites, or things attendees should bring..." 
                      rows={3}
                      value={eventData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                      maxLength={1000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Accessibility Features</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Wheelchair Accessible", "Sign Language Interpretation", "Audio Description", "Large Print Materials", "Quiet Space Available", "Service Animals Welcome"].map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Switch id={feature.toLowerCase().replace(/\s+/g, '-')} />
                          <Label htmlFor={feature.toLowerCase().replace(/\s+/g, '-')} className="text-sm">{feature}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                      {faqs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 rounded-full"
                          onClick={() => removeFaq(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor={`question-${index}`}>Question</Label>
                        <Input 
                          id={`question-${index}`}
                          placeholder="Enter question" 
                          value={faq.question}
                          onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`answer-${index}`}>Answer</Label>
                        <Textarea 
                          id={`answer-${index}`}
                          placeholder="Enter answer" 
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <Button onClick={addFaq} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add FAQ
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Ticket Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticketTypes.map((ticket, index) => (
                    <div key={ticket.id} className="p-4 border rounded space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Ticket Type {index + 1}</h4>
                        {ticketTypes.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeTicketType(ticket.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Ticket Name</Label>
                          <Input 
                            placeholder="e.g., General Admission" 
                            value={ticket.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newTickets = [...ticketTypes];
                              newTickets[index] = { ...newTickets[index], name: e.target.value };
                              setTicketTypes(newTickets);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={ticket.type}
                            onValueChange={(value: 'free' | 'paid') => {
                              const newTickets = [...ticketTypes];
                              newTickets[index] = { ...newTickets[index], type: value };
                              setTicketTypes(newTickets);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              {/* Removed duplicate free option */}
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="pl-10"
                              min="0" 
                              step="0.01"
                              value={ticket.price}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newTickets = [...ticketTypes];
                                newTickets[index] = { ...newTickets[index], price: e.target.value };
                                setTicketTypes(newTickets);
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  const newTickets = [...ticketTypes];
                                  newTickets[index] = { ...newTickets[index], price: value.toFixed(2) };
                                  setTicketTypes(newTickets);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input 
                            type="number" 
                            placeholder="Available tickets" 
                            value={ticket.quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                const newTickets = [...ticketTypes];
                                newTickets[index] = { ...newTickets[index], quantity: value };
                                setTicketTypes(newTickets);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button onClick={addTicketType} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Ticket Type
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Registration Form Builder
                  </CardTitle>
                  <p className="text-muted-foreground">Customize the registration form for your event attendees</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                      <p className="text-sm text-blue-800">
                        The first three fields (First Name, Last Name, Email) are required and cannot be removed.
                      </p>
                    </div>
                  </div>

                  {registrationFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-muted rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        {index >= 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRegistrationField(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateRegistrationField(index, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Field label"
                            disabled={index < 3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select 
                            value={field.type}
                            onValueChange={(value) =>
                              updateRegistrationField(index, {
                                type: value,
                              })
                            }
                            disabled={index < 3}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) =>
                              updateRegistrationField(index, {
                                placeholder: e.target.value,
                              })
                            }
                            placeholder="Placeholder text"
                          />
                        </div>
                        <div className="flex items-end space-x-4">
                          <label className="flex items-center">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                updateRegistrationField(index, {
                                  required: checked,
                                })
                              }
                              disabled={index < 3}
                            />
                            <span className="ml-2 text-sm">Required</span>
                          </label>
                        </div>
                      </div>

                      {/* Select/Radio Options */}
                      {(field.type === "select" || field.type === "radio") && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="space-y-2">
                            {(field.options || []).map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex items-center space-x-2"
                              >
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    updateSelectOption(
                                      index,
                                      optionIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Option ${optionIndex + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeSelectOption(index, optionIndex)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSelectOption(index)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    onClick={addRegistrationField}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Registration Field
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registration Confirmation & Follow-up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmationMessage">Registration Confirmation Message</Label>
                    <Textarea 
                      id="confirmationMessage"
                      placeholder="Thank you for registering! You will receive a confirmation email shortly..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">Redirect URL (after registration)</Label>
                    <Input 
                      id="redirectUrl"
                      placeholder="https://yourdomain.com/thank-you"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="sendConfirmation" defaultChecked />
                      <Label htmlFor="sendConfirmation">Send confirmation email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sendReminder" defaultChecked />
                      <Label htmlFor="sendReminder">Send event reminder</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Marketing & Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Social Media Links</Label>
                      <div className="space-y-2">
                        <Input placeholder="Facebook event page URL" />
                        <Input placeholder="Twitter/X event URL" />
                        <Input placeholder="Instagram profile URL" />
                        <Input placeholder="LinkedIn event URL" />
                        <Input placeholder="Event website URL" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventHashtag">Official Event Hashtag</Label>
                      <Input 
                        id="eventHashtag" 
                        placeholder="#YourEventHashtag" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Promotional Materials</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
                          <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">Upload event flyer</p>
                          <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
                        </div>
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
                          <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">Upload promotional video</p>
                          <Button variant="outline" size="sm" className="mt-2">Choose File</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Email Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Tabs defaultValue="confirmation" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
                          <TabsTrigger value="reminder">Reminder</TabsTrigger>
                          <TabsTrigger value="followup">Follow-up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="confirmation" className="space-y-2">
                          <Label>Registration Confirmation Email</Label>
                          <Textarea 
                            placeholder="Dear [Name], Thank you for registering for [Event Name]. Your registration is confirmed for [Date] at [Time]..." 
                            rows={4}
                          />
                        </TabsContent>
                        <TabsContent value="reminder" className="space-y-2">
                          <Label>Event Reminder Email (sent 24 hours before)</Label>
                          <Textarea 
                            placeholder="Hi [Name], Just a friendly reminder about [Event Name] happening tomorrow at [Time]. Here's what you need to know..." 
                            rows={4}
                          />
                        </TabsContent>
                        <TabsContent value="followup" className="space-y-2">
                          <Label>Post-Event Follow-up Email</Label>
                          <Textarea 
                            placeholder="Thank you for attending [Event Name]! We hope you found it valuable. Please share your feedback and connect with other attendees..." 
                            rows={4}
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>SEO & Discoverability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input 
                          id="metaTitle" 
                          placeholder="Event title for search engines (60 characters max)" 
                          maxLength={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea 
                          id="metaDescription" 
                          placeholder="Brief description for search results (160 characters max)" 
                          rows={2} 
                          maxLength={160}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Input 
                          id="keywords" 
                          placeholder="workshop, networking, technology, professional development" 
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="searchVisible" defaultChecked />
                        <Label htmlFor="searchVisible">Make event discoverable in search engines</Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Event
                      </Button>
                      <Button variant="outline">Save as Draft</Button>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Advanced Settings
                      </Button>
                      <Button className="bg-primary hover:bg-primary/90">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish Event
                      </Button>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Event Creation Checklist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span>Basic information completed</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span>Event details in progress</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span>Ticket configuration pending</span>
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span>Registration form ready</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Speakers & Agenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {speakers.map((speaker, index) => (
                    <div key={index} className="p-4 border rounded space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Speaker {index + 1}</h4>
                        {speakers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpeaker(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Speaker Name</Label>
                          <Input 
                            placeholder="Full name" 
                            value={speaker.name}
                            onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Title/Position</Label>
                          <Input 
                            placeholder="Job title or position" 
                            value={speaker.title}
                            onChange={(e) => handleSpeakerChange(index, 'title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company/Organization</Label>
                          <Input 
                            placeholder="Organization name" 
                            value={speaker.bio}
                            onChange={(e) => handleSpeakerChange(index, 'bio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Session Topic</Label>
                          <Input 
                            placeholder="What will they speak about?" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea 
                          placeholder="Speaker biography and credentials..." 
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Speaker Photo URL</Label>
                        <Input 
                          placeholder="https://example.com/speaker-photo.jpg" 
                        />
                      </div>
                    </div>
                  ))}
                  <Button onClick={addSpeaker} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Speaker
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sponsors & Partners</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sponsors.map((sponsor, index) => (
                    <div key={index} className="p-4 border rounded space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Sponsor {index + 1}</h4>
                        {sponsors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSponsor(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sponsor Name</Label>
                          <Input 
                            placeholder="Company/Organization name" 
                            value={sponsor.name}
                            onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sponsorship Level</Label>
                          <Select 
                            value={sponsor.level}
                            onValueChange={(value) => handleSponsorChange(index, 'level', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="title">Title Sponsor</SelectItem>
                              <SelectItem value="presenting">Presenting Sponsor</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="bronze">Bronze</SelectItem>
                              <SelectItem value="partner">Community Partner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Logo URL</Label>
                          <Input 
                            placeholder="https://example.com/logo.png" 
                            value={sponsor.logo}
                            onChange={(e) => handleSponsorChange(index, 'logo', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Website URL</Label>
                          <Input placeholder="https://sponsor-website.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sponsor Description</Label>
                        <Textarea placeholder="Brief description of the sponsor..." rows={2} />
                      </div>
                    </div>
                  ))}
                  <Button onClick={addSponsor} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Sponsor
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Schedule & Agenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 border rounded">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input type="time" placeholder="09:00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input type="number" placeholder="60" />
                        </div>
                        <div className="space-y-2">
                          <Label>Session Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registration">Registration/Check-in</SelectItem>
                              <SelectItem value="opening">Opening Remarks</SelectItem>
                              <SelectItem value="keynote">Keynote</SelectItem>
                              <SelectItem value="presentation">Presentation</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="panel">Panel Discussion</SelectItem>
                              <SelectItem value="networking">Networking</SelectItem>
                              <SelectItem value="break">Break</SelectItem>
                              <SelectItem value="lunch">Lunch</SelectItem>
                              <SelectItem value="closing">Closing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Session Title</Label>
                          <Input placeholder="Session or activity name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Location/Room</Label>
                          <Input placeholder="Main hall, Room A, etc." />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Description</Label>
                        <Textarea placeholder="Brief description of this session..." rows={2} />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Schedule Item
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Privacy & Legal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="private-event" 
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="private-event">Private Event (invitation only)</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="photography" />
                      <Label htmlFor="photography">Photography/recording allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="social-sharing" defaultChecked />
                      <Label htmlFor="social-sharing">Allow social media sharing</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Terms and Conditions</Label>
                    <Textarea 
                      placeholder="Enter terms and conditions for attendees (e.g., cancellation policy, code of conduct, liability waivers)..." 
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Refund Policy</Label>
                    <Textarea 
                      placeholder="Describe your refund policy (e.g., full refund 48 hours before event, 50% refund 24 hours before, no refund day of event)..." 
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Privacy Policy</Label>
                    <Textarea 
                      placeholder="How will attendee data be used and protected?" 
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="contact-sharing" />
                      <Label htmlFor="contact-sharing">Share attendee list (opt-in)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="marketing-emails" />
                      <Label htmlFor="marketing-emails">Send marketing emails</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {showLayout && <Footer />}
    </div>
  );
}