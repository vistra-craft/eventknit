import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Ticket, 
  Plus, 
  X, 
  CheckCircle,
  Calendar,
  Camera,
  FileText
} from 'lucide-react';

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

interface TicketType {
  id: number;
  name: string;
  type: 'free' | 'paid';
  price: string;
  quantity: string;
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

export default function CreateEventStepwise() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState("in-person");
  
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: 1, name: "General Admission", type: "paid", price: "50", quantity: "100" }
  ]);
  const [categories, setCategories] = useState(["Music", "Concert"]);
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [speakers] = useState<Speaker[]>([{ name: "", title: "", bio: "" }]);
  const [sponsors] = useState<Sponsor[]>([{ name: "", level: "gold", logo: "" }]);
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

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
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

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mock event creation completion
      console.log('Event created:', { eventData, ticketTypes, categories, tags, faqs, speakers, sponsors, registrationFields });
      navigate('/organizer/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/organizer/dashboard');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Basic Event Information
        </h2>
        <p className="text-muted-foreground">
          Let's start with the essential details about your event.
        </p>
      </div>

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
        <p className="text-sm text-muted-foreground">
          {eventData.description.length}/5000 characters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type *</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In-Person Event</SelectItem>
              <SelectItem value="online">Online Event</SelectItem>
              <SelectItem value="hybrid">Hybrid Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={eventData.category || ""} onValueChange={(value) => handleInputChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Date, Time & Location
        </h2>
        <p className="text-muted-foreground">
          When and where will your event take place?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Event Date *</Label>
          <Input 
            id="date" 
            type="date"
            value={eventData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Start Time *</Label>
          <Input 
            id="time" 
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

      {eventType === "in-person" && (
        <div className="space-y-4">
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
            <Label htmlFor="address">Address *</Label>
            <Textarea 
              id="address" 
              placeholder="Enter full address"
              rows={2}
              value={eventData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>
        </div>
      )}

      {eventType === "online" && (
        <div className="space-y-2">
          <Label htmlFor="onlineLink">Online Event Link *</Label>
          <Input 
            id="onlineLink" 
            placeholder="https://zoom.us/j/..."
            value={eventData.onlineLink}
            onChange={(e) => handleInputChange("onlineLink", e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="capacity">Event Capacity</Label>
        <Input 
          id="capacity" 
          type="number"
          placeholder="Maximum number of attendees"
          value={eventData.capacity}
          onChange={(e) => handleInputChange("capacity", e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Ticket Setup
        </h2>
        <p className="text-muted-foreground">
          Configure your ticket types and pricing.
        </p>
      </div>

      <div className="space-y-4">
        {ticketTypes.map((ticket, index) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ticket Type {index + 1}</CardTitle>
                {ticketTypes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTicketType(ticket.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticket Name</Label>
                  <Input 
                    placeholder="e.g., General Admission, VIP"
                    value={ticket.name}
                    onChange={(e) => {
                      const updatedTickets = [...ticketTypes];
                      updatedTickets[index] = { ...ticket, name: e.target.value };
                      setTicketTypes(updatedTickets);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticket Type</Label>
                  <Select value={ticket.type} onValueChange={(value: 'free' | 'paid') => {
                    const updatedTickets = [...ticketTypes];
                    updatedTickets[index] = { ...ticket, type: value };
                    setTicketTypes(updatedTickets);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={ticket.price}
                    onChange={(e) => {
                      const updatedTickets = [...ticketTypes];
                      updatedTickets[index] = { ...ticket, price: e.target.value };
                      setTicketTypes(updatedTickets);
                    }}
                    disabled={ticket.type === 'free'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity Available</Label>
                  <Input 
                    type="number"
                    placeholder="100"
                    value={ticket.quantity}
                    onChange={(e) => {
                      const updatedTickets = [...ticketTypes];
                      updatedTickets[index] = { ...ticket, quantity: e.target.value };
                      setTicketTypes(updatedTickets);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addTicketType}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Ticket Type
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Registration Form
        </h2>
        <p className="text-muted-foreground">
          Customize what information you collect from attendees.
        </p>
      </div>

      <div className="space-y-4">
        {registrationFields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Field {index + 1}</CardTitle>
                {registrationFields.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRegistrationField(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Label</Label>
                  <Input 
                    value={field.label}
                    onChange={(e) => updateRegistrationField(index, { label: e.target.value })}
                    placeholder="Field label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field.type} onValueChange={(value) => updateRegistrationField(index, { type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder Text</Label>
                <Input 
                  value={field.placeholder}
                  onChange={(e) => updateRegistrationField(index, { placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => updateRegistrationField(index, { required: checked })}
                />
                <Label>Required field</Label>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addRegistrationField}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Media & Additional Details
        </h2>
        <p className="text-muted-foreground">
          Add images, FAQs, and other details to make your event stand out.
        </p>
      </div>

      {/* Event Image */}
      <div className="space-y-4">
        <Label>Event Image</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Upload an event image</p>
          <Button variant="outline" size="sm">
            Choose File
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1">
              {category}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeCategory(category)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
          />
          <Button onClick={addCategory} disabled={!newCategory.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              {tag}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button onClick={addTag} disabled={!newTag.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <Label>Frequently Asked Questions</Label>
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">FAQ {index + 1}</span>
                  {faqs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFaq(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Input 
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                />
                <Textarea 
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          onClick={addFaq}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Review & Publish
        </h2>
        <p className="text-muted-foreground">
          Review your event details and publish when ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Event Title</Label>
              <p className="text-lg font-semibold">{eventData.title || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Organizer</Label>
              <p className="text-lg font-semibold">{eventData.organizer || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
              <p className="text-lg font-semibold">
                {eventData.date && eventData.time 
                  ? `${eventData.date} at ${eventData.time}` 
                  : 'Not set'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Location</Label>
              <p className="text-lg font-semibold">
                {eventData.venue || eventData.onlineLink || 'Not set'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <p className="text-base">{eventData.description || 'Not set'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Ticket Types</Label>
            <div className="space-y-2">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>{ticket.name || `Ticket ${index + 1}`}</span>
                  <span className="font-medium">
                    {ticket.type === 'free' ? 'Free' : `$${ticket.price}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label>Make this event private</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Private events are only visible to people with the direct link.
        </p>
      </div>
    </div>
  );

  const steps = [
    { title: "Basic Info", icon: FileText },
    { title: "Date & Location", icon: Calendar },
    { title: "Tickets", icon: Ticket },
    { title: "Registration", icon: Users },
    { title: "Media & Details", icon: Camera },
    { title: "Review", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Event</h1>
          <p className="text-muted-foreground">Set up your event with all the details attendees need to know</p>
          
          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{calculateProgress()}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-eventknit h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index + 1 <= currentStep
                      ? 'bg-eventknit text-eventknit-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 transition-colors ${
                      index + 1 < currentStep ? 'bg-eventknit' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="px-6 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground"
              >
                {currentStep === 6 ? 'Publish Event' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
