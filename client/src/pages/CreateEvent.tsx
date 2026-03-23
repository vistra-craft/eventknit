import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CategorySelect } from '@/components/events/CategorySelect';
import {
  createEventSchema,
  type CreateEventData,
} from "@/lib/validations/event";
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

interface CreateEventProps {
  showLayout?: boolean; // Whether to show navbar and footer
}

export default function CreateEvent({ showLayout = true }: CreateEventProps) {
  const [customCategory, setCustomCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const form = useForm<CreateEventData>({
    resolver: zodResolver(createEventSchema) as unknown as Resolver<CreateEventData, unknown>,
    defaultValues: {
      // Basic Info
      title: "",
      organizer: "",
      description: "",
      organizerDescription: "",
      category: "",
      date: "",
      time: "",
      endDate: "",
      endTime: "",

      // Location
      isOnline: false,
      location: "",
      venue: "",
      address: "",
      onlineLink: "",

      // Event Details
      capacity: "",
      totalSlots: 0,
      price: "",
      image: "",
      requirements: "",

      // Settings
      isPrivate: false,
      isRecurring: false,

      // Dynamic Arrays
      ticketTypes: [
        { id: 1, name: "General Admission", type: "paid", price: "50", quantity: "100" }
      ],
      speakers: [{ name: "", title: "", bio: "" }],
      sponsors: [{ name: "", level: "gold", logo: "" }],
      faqs: [{ question: "", answer: "" }],
      tags: [],
      registrationFields: [
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
      ],
    },
    mode: "onChange",
  });

  // Field arrays for dynamic sections
  const { fields: ticketFields, append: appendTicket, remove: removeTicket } = useFieldArray({
    control: form.control,
    name: "ticketTypes",
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  const { fields: speakerFields, append: appendSpeaker, remove: removeSpeaker } = useFieldArray({
    control: form.control,
    name: "speakers",
  });

  const { fields: sponsorFields, append: appendSponsor, remove: removeSponsor } = useFieldArray({
    control: form.control,
    name: "sponsors",
  });

  const { fields: registrationFieldsArray, append: appendRegistrationField, remove: removeRegistrationField, update: updateRegistrationField } = useFieldArray({
    control: form.control,
    name: "registrationFields",
  });

  // Watch values for conditional rendering
  const watchIsOnline = form.watch("isOnline");
  const watchIsRecurring = form.watch("isRecurring");
  const watchTags = form.watch("tags");

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

  const addTag = () => {
    const trimmedTag = newTag.trim();
    const currentTags = form.getValues("tags");
    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      form.setValue("tags", [...currentTags, trimmedTag], { shouldValidate: true });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  const addSelectOption = (fieldIndex: number) => {
    const field = registrationFieldsArray[fieldIndex];
    const newOptions = [...(field.options || []), ""];
    updateRegistrationField(fieldIndex, { ...field, options: newOptions });
  };

  const updateSelectOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = registrationFieldsArray[fieldIndex];
    const newOptions = [...(field.options || [])];
    newOptions[optionIndex] = value;
    updateRegistrationField(fieldIndex, { ...field, options: newOptions });
  };

  const removeSelectOption = (fieldIndex: number, optionIndex: number) => {
    const field = registrationFieldsArray[fieldIndex];
    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
    updateRegistrationField(fieldIndex, { ...field, options: newOptions });
  };

  const calculateProgress = () => {
    const formData = form.getValues();
    const requiredFields = [
      formData.title,
      formData.organizer,
      formData.description,
      formData.date,
      formData.time,
      formData.location || formData.onlineLink,
      formData.price,
      formData.category,
    ];
    const filledFields = requiredFields.filter(
      (field) => field && field.toString().trim() !== ""
    ).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const onSubmit = async (data: CreateEventData) => {
    console.log("Event data:", data);
    // TODO: Implement actual event creation API call
    // This would call your backend API to create the event
    // await createEvent(data);
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-muted">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="registration">Registration</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>

                {/* BASIC INFO TAB */}
                <TabsContent value="basic" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Essential Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="Give your event a catchy title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="organizer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organizer Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your organization name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what your event is about..."
                                rows={4}
                                maxLength={5000}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizerDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About the Organizer</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell attendees about yourself or your organization. This will be displayed on the event details page."
                                rows={4}
                                maxLength={1000}
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Optional: Share information about yourself or your organization to help attendees learn more about the event host.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isOnline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type *</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value ? "online" : "in-person"}
                                  onValueChange={(value) => field.onChange(value === "online")}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="in-person">In-Person</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <CategorySelect
                                label="Primary Category"
                                required
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Select category..."
                                customValue={customCategory}
                                onCustomValueChange={setCustomCategory}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time *</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-6">
                        <FormField
                          control={form.control}
                          name="isRecurring"
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="recurring"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="recurring">This is a recurring event</Label>
                            </div>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isOnline"
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="isOnline"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <label
                                htmlFor="isOnline"
                                className="text-sm text-muted-foreground"
                              >
                                This is an online event
                              </label>
                            </div>
                          )}
                        />
                      </div>

                      {watchIsRecurring && (
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

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Location & Venue
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!watchIsOnline && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="venue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Venue Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter venue name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City/Location *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="City, State/Country" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Address *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter complete address including postal code"
                                    rows={3}
                                    maxLength={500}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Map Preview (Integration Ready)</p>
                            <div className="w-full h-32 bg-muted-foreground/10 rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                              <MapPin className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                          </div>
                        </>
                      )}

                      {watchIsOnline && (
                        <FormField
                          control={form.control}
                          name="onlineLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Online Event Link *</FormLabel>
                              <FormControl>
                                <Input placeholder="https://zoom.us/j/..." {...field} />
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                This link will be shared with registered attendees
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Capacity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Maximum attendees"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ticket Price (USD) *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-10"
                                    min="0"
                                    step="0.01"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DETAILS TAB */}
                <TabsContent value="details" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                            <Button variant="outline" size="sm" className="mt-2" type="button">Choose File</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Organizer Logo</Label>
                          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                            <p className="text-sm text-muted-foreground">Upload logo (square format preferred)</p>
                            <Button variant="outline" size="sm" className="mt-2" type="button">Choose File</Button>
                          </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Or provide image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Event Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add tags to help attendees discover your event (e.g., networking, beginner-friendly, free-food)
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {watchTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="pr-1">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <Button
                              type="button"
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
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        />
                        <Button onClick={addTag} variant="outline" type="button">Add Tag</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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

                      <FormField
                        control={form.control}
                        name="requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prerequisites & Requirements</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="List any requirements, prerequisites, or things attendees should bring..."
                                rows={3}
                                maxLength={1000}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label>Accessibility Features</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Wheelchair Accessible", "Sign Language Interpretation", "Audio Description", "Large Print Materials", "Quiet Space Available", "Service Animals Welcome"].map((feature) => (
                            <div key={feature} className="flex items-center space-x-2">
                              <Switch id={feature.toLowerCase().replace(/\s+/g, "-")} />
                              <Label htmlFor={feature.toLowerCase().replace(/\s+/g, "-")} className="text-sm">{feature}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {faqFields.map((faq, index) => (
                        <div key={faq.id} className="space-y-4 p-4 border rounded-lg relative">
                          {faqFields.length > 1 && (
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
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.question`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter question" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`faqs.${index}.answer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Answer</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter answer" rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => appendFaq({ question: "", answer: "" })}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add FAQ
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TICKETS TAB */}
                <TabsContent value="tickets" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ticket className="w-5 h-5" />
                        Ticket Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {ticketFields.map((ticket, index) => (
                        <div key={ticket.id} className="p-4 border rounded space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Ticket Type {index + 1}</h4>
                            {ticketFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTicket(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`ticketTypes.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ticket Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., General Admission" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`ticketTypes.${index}.type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="free">Free</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`ticketTypes.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        className="pl-10"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`ticketTypes.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="Available tickets"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          appendTicket({
                            id: Date.now(),
                            name: "",
                            type: "paid",
                            price: "",
                            quantity: "",
                          })
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Ticket Type
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* REGISTRATION TAB */}
                <TabsContent value="registration" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Registration Form Builder
                      </CardTitle>
                      <p className="text-muted-foreground">Customize the registration form for your event attendees</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-primary/5 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-primary mr-2" />
                          <p className="text-sm text-primary">
                            The first three fields (First Name, Last Name, Email) are required and cannot be removed.
                          </p>
                        </div>
                      </div>

                      {registrationFieldsArray.map((field, index) => (
                        <div
                          key={field.id}
                          className="border border-muted rounded-lg p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Field {index + 1}</h4>
                            {index >= 3 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRegistrationField(index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`registrationFields.${index}.label`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>Field Label</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Field label"
                                      disabled={index < 3}
                                      {...formField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`registrationFields.${index}.type`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>Field Type</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={formField.value}
                                      onValueChange={formField.onChange}
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
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`registrationFields.${index}.placeholder`}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>Placeholder</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Placeholder text" {...formField} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`registrationFields.${index}.required`}
                              render={({ field: formField }) => (
                                <div className="flex items-end space-x-4">
                                  <label className="flex items-center">
                                    <Switch
                                      checked={formField.value}
                                      onCheckedChange={formField.onChange}
                                      disabled={index < 3}
                                    />
                                    <span className="ml-2 text-sm">Required</span>
                                  </label>
                                </div>
                              )}
                            />
                          </div>

                          {/* Select/Radio Options */}
                          {field.type === "select" && (
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
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeSelectOption(index, optionIndex)
                                      }
                                      className="text-destructive hover:text-destructive/80"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
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
                        type="button"
                        onClick={() =>
                          appendRegistrationField({
                            id: `field_${Date.now()}`,
                            name: `field_${Date.now()}`,
                            type: "text",
                            label: "New Field",
                            required: false,
                            placeholder: "Enter placeholder text",
                          })
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Registration Field
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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

                {/* MARKETING TAB */}
                <TabsContent value="marketing" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                              <Button variant="outline" size="sm" className="mt-2" type="button">Choose File</Button>
                            </div>
                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
                              <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
                              <p className="text-sm text-muted-foreground">Upload promotional video</p>
                              <Button variant="outline" size="sm" className="mt-2" type="button">Choose File</Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                          <Button variant="outline" type="button">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Event
                          </Button>
                          <Button variant="outline" type="button">Save as Draft</Button>
                        </div>
                        <div className="space-x-2">
                          <Button variant="outline" type="button">
                            <Settings className="w-4 h-4 mr-2" />
                            Advanced Settings
                          </Button>
                          <Button type="submit">
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
                            <CheckCircle className="w-4 h-4 text-success mr-2" />
                            <span>Basic information completed</span>
                          </div>
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-warning mr-2" />
                            <span>Event details in progress</span>
                          </div>
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-warning mr-2" />
                            <span>Ticket configuration pending</span>
                          </div>
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-warning mr-2" />
                            <span>Registration form ready</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ADDITIONAL TAB */}
                <TabsContent value="additional" className="space-y-6">
                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Speakers & Agenda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {speakerFields.map((speaker, index) => (
                        <div key={speaker.id} className="p-4 border rounded space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Speaker {index + 1}</h4>
                            {speakerFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSpeaker(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Speaker Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Full name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`speakers.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title/Position</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Job title or position" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`speakers.${index}.bio`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Speaker biography and credentials..."
                                    rows={2}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => appendSpeaker({ name: "", title: "", bio: "" })}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Speaker
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle>Sponsors & Partners</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sponsorFields.map((sponsor, index) => (
                        <div key={sponsor.id} className="p-4 border rounded space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Sponsor {index + 1}</h4>
                            {sponsorFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSponsor(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`sponsors.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sponsor Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Company/Organization name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`sponsors.${index}.level`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sponsorship Level</FormLabel>
                                  <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="gold">Gold</SelectItem>
                                        <SelectItem value="silver">Silver</SelectItem>
                                        <SelectItem value="bronze">Bronze</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`sponsors.${index}.logo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => appendSponsor({ name: "", level: "gold", logo: "" })}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Sponsor
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Privacy & Legal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="isPrivate"
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="private-event"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="private-event">Private Event (invitation only)</Label>
                          </div>
                        )}
                      />

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
            </form>
          </Form>
        </div>
      </div>
      {showLayout && <Footer />}
    </div>
  );
}
