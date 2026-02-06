import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Camera, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import AdminLayout from "../../AdminLayout";
import {
  createFeaturedEvent,
  type CreateFeaturedEventData,
  type FeaturedItemType,
} from "@/lib/featured-event-api";
import { getEvents, EventStatus } from "@/lib/event-api";
import { HeroPreview } from "@/components/admin/HeroPreview";

const CreateFeaturedEventPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [itemType, setItemType] = useState<FeaturedItemType>("EVENT");
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; title: string; startDate?: string; image?: string; category?: string }>>([]);
  const [formData, setFormData] = useState<CreateFeaturedEventData>({
    type: "EVENT",
    eventId: "",
    customTitle: "",
    customImage: "",
    customCategory: "",
    imageUrl: "",
    title: "",
    description: "",
    linkUrl: "",
    linkText: "",
    displayStartDate: "",
    displayEndDate: "",
    displayOrder: 0,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Track actual file for IMAGE type FormData
  const [uploadedCustomImageFile, setUploadedCustomImageFile] = useState<File | null>(null); // Track file for EVENT customImage
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null); // For IMAGE type upload

  useEffect(() => {
    const fetchAvailableEvents = async () => {
      try {
        const response = await getEvents({ status: EventStatus.APPROVED, limit: 100 });
        if (response.data?.events) {
          setAvailableEvents(response.data.events.map(event => ({
            id: event.id,
            title: event.title,
            startDate: event.startDate,
            image: event.image || undefined,
            category: event.category || undefined,
          })));
        }
      } catch (error) {
        console.error("Failed to fetch available events:", error);
      }
    };
    fetchAvailableEvents();
  }, []);

  const selectedEvent = availableEvents.find(e => e.id === formData.eventId);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Store the file for FormData upload
      setUploadedCustomImageFile(file);
      
      // Create preview for display
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setIsUploadingImage(false);
        setUploadedCustomImageFile(null);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
      setUploadedCustomImageFile(null);
    }
  };

  const handleImageTypeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Store the file for FormData upload
      setUploadedFile(file);
      
      // Create preview for display
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setIsUploadingImage(false);
        setUploadedFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
      setUploadedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on type
    if (itemType === "EVENT") {
      if (!formData.eventId) {
        toast({
          title: "Validation Error",
          description: "Please select an event",
          variant: "destructive",
        });
        return;
      }
    } else if (itemType === "IMAGE") {
      // Check if imageUrl exists and is not empty (could be base64 from upload or URL)
      // Also check imagePreview as it might be set before formData is updated
      const hasImage = (formData.imageUrl && 
        typeof formData.imageUrl === 'string' && 
        formData.imageUrl.trim() !== '') ||
        (imagePreview && imagePreview.trim() !== '');
      
      if (!hasImage) {
        toast({
          title: "Validation Error",
          description: "Please upload an image or provide an image URL",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);
      
      // Use FormData if file is uploaded, otherwise use JSON
      const hasFile = uploadedFile !== null || uploadedCustomImageFile !== null;
      
      if (hasFile) {
        // Use FormData for file upload
        const formDataToSubmit = new FormData();
        formDataToSubmit.append('type', itemType);
        
        // Append the appropriate file
        if (itemType === "IMAGE" && uploadedFile) {
          formDataToSubmit.append('image', uploadedFile);
        } else if (itemType === "EVENT" && uploadedCustomImageFile) {
          formDataToSubmit.append('image', uploadedCustomImageFile);
        }
        
        if (formData.displayStartDate) {
          formDataToSubmit.append('displayStartDate', formData.displayStartDate);
        }
        if (formData.displayEndDate) {
          formDataToSubmit.append('displayEndDate', formData.displayEndDate);
        }
        formDataToSubmit.append('displayOrder', (formData.displayOrder ?? 0).toString());
        formDataToSubmit.append('isActive', (formData.isActive ?? true).toString());

        if (itemType === "EVENT") {
          if (formData.eventId) formDataToSubmit.append('eventId', formData.eventId);
          if (formData.customTitle) formDataToSubmit.append('customTitle', formData.customTitle);
          if (formData.customCategory) formDataToSubmit.append('customCategory', formData.customCategory);
        } else {
          // IMAGE type
          if (formData.title) formDataToSubmit.append('title', formData.title);
          if (formData.description) formDataToSubmit.append('description', formData.description);
          if (formData.linkUrl) formDataToSubmit.append('linkUrl', formData.linkUrl);
          if (formData.linkText) formDataToSubmit.append('linkText', formData.linkText);
        }

        await createFeaturedEvent(formDataToSubmit);
      } else {
        // Use JSON for URL-based images or EVENT type without file
        const submitData: CreateFeaturedEventData = {
          type: itemType,
          displayStartDate: formData.displayStartDate || undefined,
          displayEndDate: formData.displayEndDate || undefined,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };

        if (itemType === "EVENT") {
          submitData.eventId = formData.eventId;
          submitData.customTitle = formData.customTitle || undefined;
          // Only use customImage URL if no file was uploaded
          if (!uploadedCustomImageFile && formData.customImage) {
            submitData.customImage = formData.customImage;
          }
          submitData.customCategory = formData.customCategory || undefined;
        } else {
          // IMAGE type with URL
          if (formData.imageUrl && formData.imageUrl.trim() !== '') {
            submitData.imageUrl = formData.imageUrl;
          }
          if (formData.title && formData.title.trim() !== '') {
            submitData.title = formData.title;
          }
          if (formData.description && formData.description.trim() !== '') {
            submitData.description = formData.description;
          }
          if (formData.linkUrl && formData.linkUrl.trim() !== '') {
            submitData.linkUrl = formData.linkUrl;
          }
          if (formData.linkText && formData.linkText.trim() !== '') {
            submitData.linkText = formData.linkText;
          }
        }

        await createFeaturedEvent(submitData);
      }
      toast({
        title: "Success",
        description: `Featured ${itemType === "EVENT" ? "event" : "image"} created successfully`,
      });
      navigate("/admin/events/featured");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create featured item";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get preview data based on current form state
  const getPreviewData = () => {
    if (itemType === "EVENT" && selectedEvent) {
      return {
        type: "EVENT" as const,
        title: formData.customTitle || selectedEvent.title,
        image: imagePreview || formData.customImage || selectedEvent.image || "",
        category: formData.customCategory || selectedEvent.category,
        date: selectedEvent.startDate,
        time: undefined,
        venue: undefined,
        location: undefined,
        description: undefined,
        linkText: undefined,
      };
    }
    return {
      type: "IMAGE" as const,
      title: formData.title || "",
      image: imagePreview || formData.imageUrl || "",
      category: undefined,
      date: undefined,
      time: undefined,
      venue: undefined,
      location: undefined,
      description: formData.description,
      linkText: formData.linkText,
    };
  };

  const previewData = getPreviewData();

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/events/featured")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">Add Featured Item</h1>
            <p className="text-sm text-muted-foreground">
              Create a featured event or promotional image for the homepage hero section
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <div>
                <Label htmlFor="itemType">Type *</Label>
                <Select 
                  value={itemType} 
                  onValueChange={(value: FeaturedItemType) => {
                    setItemType(value);
                    setFormData(prev => ({ ...prev, type: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVENT">Event (from organizer-created events)</SelectItem>
                    <SelectItem value="IMAGE">Image (standalone promotional image)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose whether to feature an existing event or a standalone promotional image
                </p>
              </div>

              {itemType === "EVENT" && (
                <>
              <div>
                <Label htmlFor="eventId">Event *</Label>
                <Select 
                  value={formData.eventId} 
                  onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} - {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedEvent.image && (
                      <img src={selectedEvent.image} alt={selectedEvent.title} className="w-16 h-16 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-semibold">{selectedEvent.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.category || "No category"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="customTitle">Custom Title (optional)</Label>
                <Input
                  id="customTitle"
                  placeholder="Leave empty to use event title"
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, the event title will be used
                </p>
              </div>

              <div className="space-y-4">
                <Label>Custom Image (optional)</Label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {imagePreview || formData.customImage ? (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.customImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, customImage: '' }));
                          setUploadedCustomImageFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload an image or enter URL</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader size="sm" className="mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Max 5MB. JPG, PNG, or GIF</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="customImageUrl">Or enter image URL</Label>
                  <Input
                    id="customImageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.customImage && !imagePreview ? formData.customImage : ''}
                    onChange={(e) => {
                      setFormData({ ...formData, customImage: e.target.value });
                      setImagePreview(null);
                      setUploadedCustomImageFile(null); // Clear file when URL is entered
                    }}
                    disabled={!!imagePreview}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If empty, the event image will be used
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="customCategory">Custom Category (optional)</Label>
                <Input
                  id="customCategory"
                  placeholder="Leave empty to use event category"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                />
              </div>
              </>)}

              {itemType === "IMAGE" && (
                <>
              <div className="space-y-4">
                <Label>Image *</Label>
                <div className="space-y-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageTypeUpload}
                    className="hidden"
                  />
                  {imagePreview || formData.imageUrl ? (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                          setUploadedFile(null);
                          if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload an image or enter URL</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageFileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader size="sm" className="mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Max 5MB. JPG, PNG, or GIF</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="imageUrl">Or enter image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl && !imagePreview ? formData.imageUrl : ''}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      setImagePreview(null);
                      setUploadedFile(null); // Clear file when URL is entered
                    }}
                    disabled={!!imagePreview}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL of the image to display in the hero section
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="Promotional Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional title to display on the featured image
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Description text to display on the image"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="linkUrl">Link URL (optional)</Label>
                <Input
                  id="linkUrl"
                  placeholder="https://example.com/page or /internal-route"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL to navigate to when the image is clicked
                </p>
              </div>

              <div>
                <Label htmlFor="linkText">Link Button Text (optional)</Label>
                <Input
                  id="linkText"
                  placeholder="Learn More, Shop Now, etc."
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Text for the call-to-action button (only shown if Link URL is provided)
                </p>
              </div>
              </>)}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayStartDate">Display Start Date (optional)</Label>
                  <Input
                    id="displayStartDate"
                    type="date"
                    value={formData.displayStartDate}
                    onChange={(e) => setFormData({ ...formData, displayStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="displayEndDate">Display End Date (optional)</Label>
                  <Input
                    id="displayEndDate"
                    type="date"
                    value={formData.displayEndDate}
                    onChange={(e) => setFormData({ ...formData, displayEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first in the hero section
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/events/featured")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                `Add Featured ${itemType === "EVENT" ? "Event" : "Image"}`
              )}
            </Button>
          </div>
        </form>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <HeroPreview {...previewData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateFeaturedEventPage;

