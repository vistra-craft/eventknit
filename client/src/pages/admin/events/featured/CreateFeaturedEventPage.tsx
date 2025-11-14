import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "../../AdminLayout";
import {
  createFeaturedEvent,
  type CreateFeaturedEventData,
} from "@/lib/featured-event-api";
import { getEvents, EventStatus } from "@/lib/event-api";

const CreateFeaturedEventPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; title: string; startDate?: string; image?: string; category?: string }>>([]);
  const [formData, setFormData] = useState<CreateFeaturedEventData>({
    eventId: "",
    customTitle: "",
    customImage: "",
    customCategory: "",
    displayStartDate: "",
    displayEndDate: "",
    displayOrder: 0,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, customImage: base64String }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventId) {
      toast({
        title: "Validation Error",
        description: "Please select an event",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await createFeaturedEvent(formData);
      toast({
        title: "Success",
        description: "Featured event created successfully",
      });
      navigate("/admin/events/featured");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create featured event";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-lg font-semibold text-gray-900">Add Featured Event</h1>
            <p className="text-sm text-gray-600">
              Select an approved event to feature on the homepage hero section
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Featured Event"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateFeaturedEventPage;

