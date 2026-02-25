import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Lock, Check } from 'lucide-react';
import { DragAndDropFormBuilder } from './DragAndDropFormBuilder';
import type { StepComponentProps, RegistrationField, FormFieldType } from './types';

// IDs of the 3 locked default fields
const LOCKED_FIELD_IDS = new Set(['firstName', 'lastName', 'email']);

// Pre-configured field suggestions
const FIELD_SUGGESTIONS: (RegistrationField & { chipLabel: string })[] = [
  { id: 'phone', name: 'phone', chipLabel: 'Phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+254 700 000 000' },
  { id: 'company', name: 'company', chipLabel: 'Company', label: 'Company / Organization', type: 'text', required: false, placeholder: 'Your company name' },
  { id: 'jobTitle', name: 'jobTitle', chipLabel: 'Job Title', label: 'Job Title / Role', type: 'text', required: false, placeholder: 'e.g., Software Engineer' },
  { id: 'country', name: 'country', chipLabel: 'Country', label: 'Country', type: 'select', required: false, placeholder: '', options: ['Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'South Africa', 'United States', 'United Kingdom', 'Other'] },
  { id: 'city', name: 'city', chipLabel: 'City', label: 'City', type: 'text', required: false, placeholder: 'e.g., Nairobi' },
  { id: 'dietary', name: 'dietary', chipLabel: 'Dietary Needs', label: 'Dietary Requirements', type: 'select', required: false, placeholder: '', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Other'] },
  { id: 'tshirtSize', name: 'tshirtSize', chipLabel: 'T-Shirt Size', label: 'T-Shirt Size', type: 'select', required: false, placeholder: '', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'gender', name: 'gender', chipLabel: 'Gender', label: 'Gender', type: 'select', required: false, placeholder: '', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
  { id: 'dob', name: 'dob', chipLabel: 'Date of Birth', label: 'Date of Birth', type: 'date', required: false, placeholder: '' },
  { id: 'emergencyContact', name: 'emergencyContact', chipLabel: 'Emergency Contact', label: 'Emergency Contact Name', type: 'text', required: false, placeholder: 'Full name' },
  { id: 'emergencyPhone', name: 'emergencyPhone', chipLabel: 'Emergency Phone', label: 'Emergency Contact Phone', type: 'phone', required: false, placeholder: '+254 700 000 000' },
  { id: 'accessibility', name: 'accessibility', chipLabel: 'Accessibility', label: 'Accessibility / Special Needs', type: 'textarea', required: false, placeholder: 'Describe any accessibility requirements' },
  { id: 'referral', name: 'referral', chipLabel: 'Referral', label: 'How did you hear about us?', type: 'select', required: false, placeholder: '', options: ['Social Media', 'Friend/Colleague', 'Email', 'Search Engine', 'Advertisement', 'Other'] },
  { id: 'linkedin', name: 'linkedin', chipLabel: 'LinkedIn', label: 'LinkedIn Profile', type: 'text', required: false, placeholder: 'https://linkedin.com/in/...' },
];

interface RegistrationDetailsStepProps extends StepComponentProps {
  registrationFields: RegistrationField[];
  setRegistrationFields: React.Dispatch<React.SetStateAction<RegistrationField[]>>;
  useDragAndDrop: boolean;
  setUseDragAndDrop: (v: boolean) => void;
}

export function RegistrationDetailsStep({
  registrationFields,
  setRegistrationFields,
  useDragAndDrop,
  setUseDragAndDrop,
}: RegistrationDetailsStepProps) {
  const existingFieldNames = new Set(registrationFields.map(f => f.name));

  const addSuggestedField = (suggestion: typeof FIELD_SUGGESTIONS[number]) => {
    if (existingFieldNames.has(suggestion.name)) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chipLabel, ...field } = suggestion;
    setRegistrationFields((prev) => [...prev, field]);
  };

  const addRegistrationField = () => {
    const newField: RegistrationField = {
      id: `field_${Date.now()}`,
      name: `field_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      placeholder: '',
    };
    setRegistrationFields((prev) => [...prev, newField]);
  };

  const updateRegistrationField = (index: number, updates: Partial<RegistrationField>) => {
    setRegistrationFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const removeRegistrationField = (index: number) => {
    const field = registrationFields[index];
    if (LOCKED_FIELD_IDS.has(field.id)) return;
    setRegistrationFields((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center space-x-2 mb-4">
        <Label htmlFor="builder-mode" className="text-sm font-medium">
          {useDragAndDrop ? 'Drag & Drop Builder' : 'Simple Builder'}
        </Label>
        <Switch
          id="builder-mode"
          checked={useDragAndDrop}
          onCheckedChange={setUseDragAndDrop}
        />
      </div>

      {/* Suggested fields */}
      {!useDragAndDrop && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Suggested fields — click to add</Label>
          <div className="flex flex-wrap gap-2">
            {FIELD_SUGGESTIONS.map((suggestion) => {
              const isAdded = existingFieldNames.has(suggestion.name);
              return (
                <Button
                  key={suggestion.id}
                  type="button"
                  variant={isAdded ? 'secondary' : 'outline'}
                  size="sm"
                  className={`h-7 text-xs gap-1.5 ${isAdded ? 'opacity-50 cursor-default' : ''}`}
                  onClick={() => addSuggestedField(suggestion)}
                  disabled={isAdded}
                >
                  {isAdded && <Check className="h-3 w-3" />}
                  {suggestion.chipLabel}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {useDragAndDrop ? (
        <DragAndDropFormBuilder
          fields={registrationFields.map((field: RegistrationField) => ({
            id: field.id,
            name: field.id,
            type: field.type as FormFieldType,
            label: field.label,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options
          }))}
          onChange={(newFields: RegistrationField[]) => {
            const mappedFields = newFields.map((field: RegistrationField) => ({
              id: field.id,
              name: field.id,
              type: field.type,
              label: field.label,
              required: field.required || false,
              placeholder: field.placeholder || '',
              options: field.options
            }));
            setRegistrationFields(mappedFields);
          }}
        />
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
          {registrationFields.map((field, index) => {
            const isLocked = LOCKED_FIELD_IDS.has(field.id);

            return (
              <Card key={field.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Field {index + 1}</CardTitle>
                      {isLocked && (
                        <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                          <Lock className="h-2.5 w-2.5" /> Required
                        </Badge>
                      )}
                    </div>
                    {!isLocked && (
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
                        className="h-12"
                        readOnly={isLocked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateRegistrationField(index, { type: value as RegistrationField['type'] })}
                        disabled={isLocked}
                      >
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
                      className="h-12"
                    />
                  </div>

                  {/* Options editor for select/radio fields */}
                  {(field.type === 'select' || field.type === 'radio') && field.options && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {field.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[optIndex] = e.target.value;
                                updateRegistrationField(index, { options: newOptions });
                              }}
                              className="h-9 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 hover:text-destructive"
                              onClick={() => {
                                const newOptions = [...(field.options || [])];
                                newOptions.splice(optIndex, 1);
                                updateRegistrationField(index, { options: newOptions });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary"
                          onClick={() => updateRegistrationField(index, {
                            options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
                          })}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isLocked && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateRegistrationField(index, { required: checked })}
                      />
                      <Label>Required field</Label>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={addRegistrationField}
            className="w-full border-dashed border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      )}
    </div>
  );
}
