import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import AdminLayout from "../../AdminLayout";
import {
  getFeaturedEventById,
  updateFeaturedEvent,
  type UpdateFeaturedEventData,
} from "@/lib/featured-event-api";

const EditFeaturedEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<UpdateFeaturedEventData>({
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
    const fetchFeaturedEvent = async () => {
      if (!id) {
        toast({
          title: "Error",
          description: "Featured event ID is missing",
          variant: "destructive",
        });
        navigate("/admin/events/featured");
        return;
      }

      try {
        setFetching(true);
        const featuredEvent = await getFeaturedEventById(id);
        setFormData({
          customTitle: featuredEvent.customTitle || "",
          customImage: featuredEvent.customImage || "",
          customCategory: featuredEvent.customCategory || "",
          displayStartDate: featuredEvent.displayStartDate
            ? new Date(featuredEvent.displayStartDate).toISOString().split("T")[0]
            : "",
          displayEndDate: featuredEvent.displayEndDate
            ? new Date(featuredEvent.displayEndDate).toISOString().split("T")[0]
            : "",
          displayOrder: featuredEvent.displayOrder,
          isActive: featuredEvent.isActive,
        });
        if (featuredEvent.customImage) {
          setImagePreview(featuredEvent.customImage);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch featured event";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        navigate("/admin/events/featured");
      } finally {
        setFetching(false);
      }
    };

    fetchFeaturedEvent();
  }, [id, navigate, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
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
        setFormData((prev) => ({ ...prev, customImage: base64String }));
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

    if (!id) {
      toast({
        title: "Error",
        description: "Featured event ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await updateFeaturedEvent(id, formData);
      toast({
        title: "Success",
        description: "Featured event updated successfully",
      });
      navigate("/admin/events/featured");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update featured event";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="text-base font-semibold text-foreground">Edit Featured Event</h1>
            <p className="text-sm text-gray-600">
              Update the featured event settings
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="customTitle">Custom Title (optional)</Label>
            <Input
              id="customTitle"
              placeholder="Leave empty to use event title"
              value={formData.customTitle}
              onChange={(e) =>
                setFormData({ ...formData, customTitle: e.target.value })
              }
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
                      setFormData((prev) => ({ ...prev, customImage: "" }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload an image or enter URL
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Max 5MB. JPG, PNG, or GIF
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="customImageUrl">Or enter image URL</Label>
              <Input
                id="customImageUrl"
                placeholder="https://example.com/image.jpg"
                value={
                  formData.customImage && !imagePreview
                    ? formData.customImage
                    : ""
                }
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
              onChange={(e) =>
                setFormData({ ...formData, customCategory: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayStartDate">Display Start Date (optional)</Label>
              <Input
                id="displayStartDate"
                type="date"
                value={formData.displayStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, displayStartDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="displayEndDate">Display End Date (optional)</Label>
              <Input
                id="displayEndDate"
                type="date"
                value={formData.displayEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, displayEndDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayOrder: parseInt(e.target.value) || 0,
                })
              }
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
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditFeaturedEventPage;


