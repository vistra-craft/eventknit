import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Plus, CheckCircle, ImageIcon } from 'lucide-react';
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {imagePreview || eventData.image ? (
          /* Unified preview + focal point picker */
          <FocalPointPicker
            imageUrl={imagePreview || eventData.image}
            focalX={eventData.imageFocalX}
            focalY={eventData.imageFocalY}
            onFocalPointChange={(x, y) => {
              onInputChange('imageFocalX', x);
              onInputChange('imageFocalY', y);
            }}
            onReplace={() => fileInputRef.current?.click()}
            onRemove={() => {
              setImagePreview(null);
              onInputChange('image', '');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
        ) : (
          /* Empty state — upload prompt */
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Add a cover image for your event
              </p>
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

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm">Or provide image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={eventData.image}
                className="h-12"
                onChange={(e) => onInputChange("image", e.target.value)}
              />
            </div>
          </div>
        )}
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
            className="h-12"
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
            className="h-12"
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
        <p className="text-xs text-muted-foreground -mt-2">
          Help attendees by answering common questions. Empty entries are automatically removed.
        </p>
        {faqs.map((faq, index) => {
          const hasQuestion = faq.question.trim().length > 0;
          const hasAnswer = faq.answer.trim().length > 0;
          const needsAnswer = hasQuestion && !hasAnswer;
          const needsQuestion = !hasQuestion && hasAnswer;

          return (
            <div key={index} className="relative rounded-xl border border-gray-200 dark:border-zinc-800 bg-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">FAQ {index + 1}</span>
                {faqs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFaq(index)}
                    className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="e.g. What should I bring to the event?"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                  className={`h-11 ${needsQuestion ? 'border-destructive' : ''}`}
                />
                {needsQuestion && (
                  <p className="text-xs text-destructive">Please provide a question for this answer.</p>
                )}
              </div>
              <div className="space-y-1">
                <Textarea
                  placeholder="Write your answer here..."
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                  rows={2}
                  className={needsAnswer ? 'border-destructive' : ''}
                />
                {needsAnswer && (
                  <p className="text-xs text-destructive">Please provide an answer to this question.</p>
                )}
              </div>
            </div>
          );
        })}
        {/* "Add another" only when the last FAQ is fully complete (both fields) */}
        {faqs.length > 0 && faqs[faqs.length - 1].question.trim() && faqs[faqs.length - 1].answer.trim() && (
          <button
            type="button"
            onClick={addFaq}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add another FAQ
          </button>
        )}
      </div>
    </div>
  );
}
