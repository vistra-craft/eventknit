import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Camera, X, Crosshair } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import {
  getFeaturedEventById,
  updateFeaturedEvent,
  type UpdateFeaturedEventData,
  type FeaturedEventData,
} from "@/lib/featured-event-api";
import { HeroPreview } from "@/components/admin/HeroPreview";
import { FocalPointPicker } from "@/components/event-wizard/FocalPointPicker";
import { showErrorToast } from "@/lib/utils/error";

const EditFeaturedEventPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [originalData, setOriginalData] = useState<FeaturedEventData | null>(null);
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [showFocalPicker, setShowFocalPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      if (!id) {
        showErrorToast(toast, new Error("Featured event ID is missing"), "Missing ID", "Featured event ID is missing");
        navigate("/admin/events/featured");
        return;
      }

      try {
        setFetching(true);
        const featuredEvent = await getFeaturedEventById(id);
        setOriginalData(featuredEvent);
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
        const imageForPreview = featuredEvent.type === "IMAGE"
          ? featuredEvent.imageUrl
          : featuredEvent.customImage;
        if (imageForPreview) setImagePreview(imageForPreview);
        if (featuredEvent.type === "IMAGE") {
          setFocalX(featuredEvent.imageFocalX ?? 50);
          setFocalY(featuredEvent.imageFocalY ?? 50);
        }
      } catch (error: unknown) {
        showErrorToast(toast, error, "Load failed", "Failed to fetch featured event");
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
      showErrorToast(toast, new Error("Please upload an image file"), "Invalid file type", "Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast(toast, new Error("Image size must be less than 5MB"), "File too large", "Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      // Store the actual file for FormData submission
      setUploadedFile(file);
      // Generate preview only
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        showErrorToast(toast, new Error("Failed to read image file"), "Read failed", "Failed to read image file");
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showErrorToast(toast, error, "Upload failed", "Failed to upload image");
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      showErrorToast(toast, new Error("Featured event ID is missing"), "Missing ID", "Featured event ID is missing");
      return;
    }

    try {
      setLoading(true);

      let payload: typeof formData | FormData = formData;

      if (uploadedFile) {
        // Send as multipart/form-data so the server receives req.file
        const fd = new FormData();
        fd.append('image', uploadedFile);
        if (formData.customTitle) fd.append('customTitle', formData.customTitle);
        if (formData.customCategory) fd.append('customCategory', formData.customCategory);
        if (formData.displayStartDate) fd.append('displayStartDate', formData.displayStartDate);
        if (formData.displayEndDate) fd.append('displayEndDate', formData.displayEndDate);
        fd.append('displayOrder', String(formData.displayOrder));
        fd.append('isActive', String(formData.isActive));
        if (originalData?.type === "IMAGE") {
          fd.append('imageFocalX', focalX.toString());
          fd.append('imageFocalY', focalY.toString());
        }
        payload = fd;
      } else if (originalData?.type === "IMAGE") {
        payload = { ...formData, imageFocalX: focalX, imageFocalY: focalY };
      }

      await updateFeaturedEvent(id, payload);
      toast({
        title: "Success",
        description: "Featured event updated successfully",
      });
      navigate("/admin/events/featured");
    } catch (error: unknown) {
      showErrorToast(toast, error, "Update failed", "Failed to update featured event");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </div>
    );
  }

  // Get preview data
  const getPreviewData = () => {
    if (!originalData) {
      return {
        type: "EVENT" as const,
        title: formData.customTitle || "Loading...",
        image: imagePreview || formData.customImage || "",
        category: formData.customCategory,
      };
    }

    const isEventType = originalData.type === "EVENT";
    if (isEventType) {
      return {
        type: "EVENT" as const,
        title: formData.customTitle || originalData.event?.title || "",
        image: imagePreview || formData.customImage || originalData.event?.image || "",
        category: formData.customCategory || originalData.event?.category || undefined,
        date: originalData.event?.startDate,
        venue: originalData.event?.venue || undefined,
        location: originalData.event?.location,
      };
    }
    return {
      type: "IMAGE" as const,
      title: originalData.title || "",
      image: imagePreview || formData.customImage || originalData.imageUrl || "",
      description: originalData.description || undefined,
      linkText: originalData.linkText || undefined,
    };
  };

  const previewData = getPreviewData();

  return (
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
            <h1 className="text-base font-semibold text-foreground">Edit Featured Event</h1>
            <p className="text-sm text-muted-foreground">
              Update the featured event settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
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
                <div className="space-y-3">
                  {originalData?.type === "IMAGE" && showFocalPicker ? (
                    <FocalPointPicker
                      imageUrl={(imagePreview || formData.customImage)!}
                      focalX={focalX}
                      focalY={focalY}
                      onFocalPointChange={(x, y) => { setFocalX(x); setFocalY(y); }}
                      onReplace={() => fileInputRef.current?.click()}
                      onRemove={() => {
                        setImagePreview(null);
                        setUploadedFile(null);
                        setFormData((prev) => ({ ...prev, customImage: "" }));
                        setShowFocalPicker(false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                  ) : (
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
                          setUploadedFile(null);
                          setFormData((prev) => ({ ...prev, customImage: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {/* Focal point toggle — only for standalone IMAGE type */}
                  {originalData?.type === "IMAGE" && (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Crosshair className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Adjust focal point</p>
                          <p className="text-xs text-muted-foreground">Control which part of the image shows in the hero</p>
                        </div>
                      </div>
                      <Switch
                        checked={showFocalPicker}
                        onCheckedChange={setShowFocalPicker}
                      />
                    </div>
                  )}
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
                onChange={(e) => {
                  const newStart = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    displayStartDate: newStart,
                    displayEndDate: prev.displayEndDate && newStart > prev.displayEndDate ? "" : prev.displayEndDate,
                  }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="displayEndDate">Display End Date (optional)</Label>
              <Input
                id="displayEndDate"
                type="date"
                min={formData.displayStartDate || undefined}
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
                  <Loader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
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
  );
};

export default EditFeaturedEventPage;


