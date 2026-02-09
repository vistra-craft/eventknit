import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, Plus, CheckCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import type { StepComponentProps } from './types';
import { FocalPointPicker } from './FocalPointPicker';

interface FAQ {
  question: string;
  answer: string;
}

interface MediaStepProps extends StepComponentProps {
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  isUploadingImage: boolean;
  setIsUploadingImage: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  tags: string[];
  newTag: string;
  setNewTag: (tag: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  requirements: string[];
  newRequirement: string;
  setNewRequirement: (req: string) => void;
  addRequirement: () => void;
  removeRequirement: (req: string) => void;
  faqs: FAQ[];
  addFaq: () => void;
  removeFaq: (index: number) => void;
  handleFaqChange: (index: number, field: 'question' | 'answer', value: string) => void;
}

export function MediaStep({
  eventData,
  onInputChange,
  imagePreview,
  setImagePreview,
  isUploadingImage,
  fileInputRef,
  handleImageUpload,
  tags,
  newTag,
  setNewTag,
  addTag,
  removeTag,
  requirements,
  newRequirement,
  setNewRequirement,
  addRequirement,
  removeRequirement,
  faqs,
  addFaq,
  removeFaq,
  handleFaqChange,
}: MediaStepProps) {
  return (
    <div className="space-y-6">
      {/* Event Image */}
      <div className="space-y-4">
        <Label>Event Image</Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreview || eventData.image ? (
            <div className="relative">
              <img
                src={imagePreview || eventData.image}
                alt="Event preview"
                className="w-full h-64 object-cover rounded-lg border"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    onInputChange('image', '');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload an event image</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                {isUploadingImage ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Max 5MB. JPG, PNG, or GIF</p>
            </div>
          )}
          {!imagePreview && !eventData.image && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm">Or provide image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={eventData.image}
                className="h-12 border-border focus-visible:border-primary/30"
                onChange={(e) => onInputChange("image", e.target.value)}
              />
            </div>
          )}

          {/* Focal Point Picker - shown when image is uploaded */}
          {(imagePreview || eventData.image) && (
            <FocalPointPicker
              imageUrl={imagePreview || eventData.image}
              focalX={eventData.imageFocalX}
              focalY={eventData.imageFocalY}
              onFocalPointChange={(x, y) => {
                onInputChange('imageFocalX', x);
                onInputChange('imageFocalY', y);
              }}
            />
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <Label>Tags (Optional)</Label>
        <p className="text-xs text-muted-foreground -mt-2">
          Help attendees discover your event through search and recommendations
        </p>
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
            placeholder="e.g., Technology, Music, Networking"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="h-12 border-border focus-visible:border-primary/30"
          />
          <Button onClick={addTag} disabled={!newTag.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <Label>Event Requirements (Optional)</Label>
        {requirements.length > 0 && (
          <div className="space-y-2">
            {requirements.map((req) => (
              <div key={req} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm flex-1">{req}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRequirement(req)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Valid ID required"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            className="h-12 border-border focus-visible:border-primary/30"
          />
          <Button onClick={addRequirement} disabled={!newRequirement.trim()}>
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Add requirements attendees need to meet (e.g., Valid ID, Dress code, Special equipment)
        </p>
      </div>

      {/* Age Restriction */}
      <div className="space-y-2">
        <Label htmlFor="ageRestriction">Age Restriction (Optional)</Label>
        <Select
          value={eventData.ageRestriction || "none"}
          onValueChange={(value) => {
            // If "none" is selected, set to empty string, otherwise set the value
            onInputChange("ageRestriction", value === "none" ? "" : value);
          }}
        >
          <SelectTrigger id="ageRestriction">
            <SelectValue placeholder="Select age restriction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No restriction</SelectItem>
            <SelectItem value="All ages">All ages</SelectItem>
            <SelectItem value="13+">13+</SelectItem>
            <SelectItem value="16+">16+</SelectItem>
            <SelectItem value="18+">18+</SelectItem>
            <SelectItem value="21+">21+</SelectItem>
            <SelectItem value="25+">25+</SelectItem>
            <SelectItem value="Adults only">Adults only</SelectItem>
            <SelectItem value="Seniors (65+)">Seniors (65+)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Specify any age restrictions for this event
        </p>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <Label>Frequently Asked Questions</Label>
        {faqs.map((faq, index) => (
          <Card key={index} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
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
                  className="h-12 border-border focus-visible:border-primary/30"
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
          className="w-full border-dashed border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FAQ
        </Button>
      </div>
    </div>
  );
}
