import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, X, Check, GripVertical, ChevronDown,
  Type, Mail, Phone, AlignLeft, List, CheckSquare, Calendar, Hash, Eye, Users,
} from 'lucide-react';
import type { StepComponentProps, RegistrationField } from './types';

// ─────────────────────────────────────────────
// Field meta
// ─────────────────────────────────────────────

type RegistrationFieldType = RegistrationField['type'];

const FIELD_ICONS: Record<RegistrationFieldType, React.ReactNode> = {
  text:     <Type className="h-3 w-3" />,
  email:    <Mail className="h-3 w-3" />,
  phone:    <Phone className="h-3 w-3" />,
  // removed 'tel', use 'phone' only
  textarea: <AlignLeft className="h-3 w-3" />,
  select:   <List className="h-3 w-3" />,
  checkbox: <CheckSquare className="h-3 w-3" />,
  date:     <Calendar className="h-3 w-3" />,
  number:   <Hash className="h-3 w-3" />,
  radio:    <CheckSquare className="h-3 w-3" />,
};

const FIELD_TYPE_LABELS: Record<RegistrationFieldType, string> = {
  text:     'Short text',
  email:    'Email',
  phone:    'Phone',
  // removed 'tel', use 'phone' only
  textarea: 'Long text',
  select:   'Dropdown',
  checkbox: 'Checkbox',
  date:     'Date',
  number:   'Number',
  radio:    'Multiple choice',
};

// ─────────────────────────────────────────────
// Suggestion chips grouped by category
// ─────────────────────────────────────────────

type SuggestionField = RegistrationField & { chipLabel: string };

const SUGGESTION_GROUPS: Record<string, SuggestionField[]> = {
  Basic: [
    { id: 'fullName',  name: 'fullName',  chipLabel: 'Full Name',     label: 'Full Name',     type: 'text',   required: true,  placeholder: 'Your full name' },
    { id: 'phone',     name: 'phone',     chipLabel: 'Phone',         label: 'Phone Number',  type: 'phone',  required: false, placeholder: '+254 700 000 000' },
    { id: 'country',   name: 'country',   chipLabel: 'Country',       label: 'Country',       type: 'select', required: false, placeholder: '', options: ['Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'South Africa', 'United States', 'United Kingdom', 'Other'] },
    { id: 'city',      name: 'city',      chipLabel: 'City',          label: 'City',          type: 'text',   required: false, placeholder: 'e.g., Nairobi' },
    { id: 'dob',       name: 'dob',       chipLabel: 'Date of Birth', label: 'Date of Birth', type: 'date',   required: false, placeholder: '' },
  ],
  Professional: [
    { id: 'company',  name: 'company',  chipLabel: 'Company',   label: 'Company / Organization', type: 'text', required: false, placeholder: 'Your company name' },
    { id: 'jobTitle', name: 'jobTitle', chipLabel: 'Job Title', label: 'Job Title / Role',        type: 'text', required: false, placeholder: 'e.g., Software Engineer' },
    { id: 'linkedin', name: 'linkedin', chipLabel: 'LinkedIn',  label: 'LinkedIn Profile',       type: 'text', required: false, placeholder: 'https://linkedin.com/in/...' },
  ],
  Personal: [
    { id: 'gender',           name: 'gender',           chipLabel: 'Gender',           label: 'Gender',                     type: 'select',   required: false, placeholder: '', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    { id: 'dietary',          name: 'dietary',          chipLabel: 'Dietary',          label: 'Dietary Requirements',        type: 'select',   required: false, placeholder: '', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Other'] },
    { id: 'tshirtSize',       name: 'tshirtSize',       chipLabel: 'T-Shirt Size',     label: 'T-Shirt Size',               type: 'select',   required: false, placeholder: '', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { id: 'accessibility',    name: 'accessibility',    chipLabel: 'Accessibility',    label: 'Accessibility / Special Needs', type: 'textarea', required: false, placeholder: 'Describe any accessibility requirements' },
    { id: 'emergencyContact', name: 'emergencyContact', chipLabel: 'Emergency Name',   label: 'Emergency Contact Name',      type: 'text',     required: false, placeholder: 'Full name' },
    { id: 'emergencyPhone',   name: 'emergencyPhone',   chipLabel: 'Emergency Phone',  label: 'Emergency Contact Phone',     type: 'phone',    required: false, placeholder: '+254 700 000 000' },
  ],
  Other: [
    { id: 'referral', name: 'referral', chipLabel: 'Referral Source', label: 'How did you hear about us?', type: 'select', required: false, placeholder: '', options: ['Social Media', 'Friend/Colleague', 'Email', 'Search Engine', 'Advertisement', 'Other'] },
  ],
};

// ─────────────────────────────────────────────
// Sidebar add-field types
// ─────────────────────────────────────────────

const SIDEBAR_TYPES: { type: RegistrationFieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text',     label: 'Short answer',    icon: <Type className="h-3.5 w-3.5" /> },
  { type: 'textarea', label: 'Long answer',     icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { type: 'select',   label: 'Dropdown',        icon: <List className="h-3.5 w-3.5" /> },
  { type: 'radio',    label: 'Multiple choice', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { type: 'email',    label: 'Email',           icon: <Mail className="h-3.5 w-3.5" /> },
  { type: 'phone',    label: 'Phone',           icon: <Phone className="h-3.5 w-3.5" /> },
  { type: 'date',     label: 'Date',            icon: <Calendar className="h-3.5 w-3.5" /> },
  { type: 'number',   label: 'Number',          icon: <Hash className="h-3.5 w-3.5" /> },
  { type: 'checkbox', label: 'Checkbox',        icon: <CheckSquare className="h-3.5 w-3.5" /> },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface RegistrationDetailsStepProps extends StepComponentProps {
  registrationFields: RegistrationField[];
  setRegistrationFields: React.Dispatch<React.SetStateAction<RegistrationField[]>>;
  useDragAndDrop?: boolean;
  setUseDragAndDrop?: (v: boolean) => void;
}

export function RegistrationDetailsStep({
  registrationFields,
  setRegistrationFields,
}: RegistrationDetailsStepProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeGroup, setActiveGroup] = useState<keyof typeof SUGGESTION_GROUPS>('Basic');

  const existingNames = new Set(registrationFields.map(f => f.name));
  const requiredCount = registrationFields.filter(f => f.required).length;

  const addSuggested = (s: SuggestionField) => {
    if (existingNames.has(s.name)) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { chipLabel, ...field } = s;
    setRegistrationFields(prev => [...prev, field]);
    setExpandedFieldId(field.id);
  };

  const addCustomField = (type: RegistrationFieldType = 'text') => {
    const id = `field_${Date.now()}`;
    const newField: RegistrationField = {
      id,
      name: id,
      type,
      label: '',
      required: false,
      placeholder: '',
      ...(type === 'select' || type === 'radio' || type === 'checkbox' ? { options: ['Option 1', 'Option 2'] } : {}),
    };
    setRegistrationFields(prev => [...prev, newField]);
    setExpandedFieldId(id);
  };

  const updateField = (index: number, updates: Partial<RegistrationField>) => {
    setRegistrationFields(prev =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeField = (index: number, fieldId: string) => {
    setRegistrationFields(prev => prev.filter((_, i) => i !== index));
    if (expandedFieldId === fieldId) setExpandedFieldId(null);
  };

  return (
    <div className="space-y-5">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {registrationFields.length > 0 && (
            <>
              <span>{registrationFields.length} field{registrationFields.length !== 1 ? 's' : ''}</span>
              {requiredCount > 0 && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{requiredCount} required</span>
                </>
              )}
            </>
          )}
        </div>
        {registrationFields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        )}
      </div>

      {/* ── Grouped suggestion chips ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick add</span>
          <div className="flex items-center gap-0.5 ml-auto">
            {(Object.keys(SUGGESTION_GROUPS) as Array<keyof typeof SUGGESTION_GROUPS>).map(group => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  activeGroup === group
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTION_GROUPS[activeGroup].map(suggestion => {
            const isAdded = existingNames.has(suggestion.name);
            return (
              <button
                key={suggestion.id}
                type="button"
                disabled={isAdded}
                onClick={() => addSuggested(suggestion)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isAdded
                    ? 'border-transparent bg-primary/10 text-primary cursor-default'
                    : 'border-border bg-transparent text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                }`}
              >
                {isAdded && <Check className="h-3 w-3" />}
                {suggestion.chipLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main area: field list + sidebar ── */}
      <div className="flex gap-4 items-start">

        {/* Field list */}
        <div className="flex-1 min-w-0 space-y-2">
          {registrationFields.length === 0 ? (
            <div className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No extra fields yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Without any fields, attendees register with just their name and email.
                  Quick-add common fields above or pick a type on the right.
                </p>
              </div>
            </div>
          ) : (
            registrationFields.map((field, index) => {
              const isExpanded = expandedFieldId === field.id;
              return (
                <div
                  key={field.id}
                  className={`rounded-xl border transition-colors ${
                    isExpanded
                      ? 'border-primary/30 bg-card shadow-sm'
                      : 'border-border/60 bg-card hover:border-border'
                  }`}
                >
                  {/* ── Collapsed header ── */}
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none"
                    onClick={() => setExpandedFieldId(isExpanded ? null : field.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/25 shrink-0" />

                    <span className="flex-1 text-sm font-medium truncate">
                      {field.label
                        ? field.label
                        : <span className="text-muted-foreground italic font-normal">Untitled field</span>
                      }
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                        {FIELD_ICONS[field.type]}
                        {FIELD_TYPE_LABELS[field.type] ?? field.type}
                      </span>
                      {field.required && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium leading-none">
                          Required
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="text-muted-foreground/30 hover:text-destructive transition-colors ml-0.5 shrink-0"
                      onClick={e => { e.stopPropagation(); removeField(index, field.id); }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* ── Expanded settings ── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-border/40 space-y-3">

                      {/* Label + Type */}
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Label</Label>
                          <Input
                            value={field.label}
                            onChange={e => updateField(index, { label: e.target.value })}
                            placeholder="e.g., Full Name"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="w-36 space-y-1">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={value => {
                              const newType = value as RegistrationField['type'];
                              const needsOptions = newType === 'select' || newType === 'radio' || newType === 'checkbox';
                              const hasOptions = field.options && field.options.length > 0;
                              updateField(index, {
                                type: newType,
                                ...(needsOptions && !hasOptions ? { options: ['Option 1', 'Option 2'] } : {}),
                              });
                            }}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short text</SelectItem>
                              <SelectItem value="textarea">Long text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="radio">Multiple choice</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Placeholder — hide for checkbox / date */}
                      {field.type !== 'checkbox' && field.type !== 'date' && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Placeholder</Label>
                          <Input
                            value={field.placeholder ?? ''}
                            onChange={e => updateField(index, { placeholder: e.target.value })}
                            placeholder="Hint text shown inside the field"
                            className="h-9 text-sm"
                          />
                        </div>
                      )}

                      {/* Options editor */}
                      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.options && (
                        <div className="space-y-1.5 bg-muted/30 rounded-lg p-3">
                          <Label className="text-xs text-muted-foreground">Options</Label>
                          <div className="space-y-1.5">
                            {field.options.map((option, optIdx) => (
                              <div key={optIdx} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={e => {
                                    const next = [...(field.options || [])];
                                    next[optIdx] = e.target.value;
                                    updateField(index, { options: next });
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 hover:text-destructive"
                                  onClick={() => {
                                    const next = [...(field.options || [])];
                                    next.splice(optIdx, 1);
                                    updateField(index, { options: next });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary h-7 px-2"
                              onClick={() =>
                                updateField(index, {
                                  options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`],
                                })
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add option
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Required toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <Label htmlFor={`req-${field.id}`} className="text-sm cursor-pointer">
                          Required field
                        </Label>
                        <Switch
                          id={`req-${field.id}`}
                          checked={field.required}
                          onCheckedChange={checked => updateField(index, { required: checked })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add custom field */}
          <button
            type="button"
            onClick={() => addCustomField('text')}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-xl py-2.5 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add custom field
          </button>
        </div>

        {/* ── Sidebar: field type picker ── */}
        <div className="w-40 shrink-0 space-y-2">
          <span className="text-xs text-muted-foreground block">Field types</span>
          <div className="space-y-1">
            {SIDEBAR_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addCustomField(type)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground border border-border/40 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all text-left"
              >
                <span className="opacity-60">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Preview dialog ── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Form preview
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-1 pr-1">
            <p className="text-xs text-muted-foreground">
              This is what attendees will see when registering for your event.
            </p>

            {/* Email is always collected */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Email address <span className="text-destructive">*</span>
              </Label>
              <div className="h-9 rounded-md border border-input bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                attendee@example.com
              </div>
            </div>

            {registrationFields.map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {field.label || <span className="italic text-muted-foreground">Untitled field</span>}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {field.type === 'textarea' && (
                  <div className="h-16 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {field.placeholder || ''}
                  </div>
                )}
                {field.type === 'select' && (
                  <div className="h-9 rounded-md border border-input bg-muted/30 px-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Select an option</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                )}
                {field.type === 'checkbox' && (
                  <div className="space-y-1.5">
                    {(field.options || []).length > 0 ? (
                      field.options!.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded border border-input bg-muted/30 shrink-0" />
                          <span className="text-sm text-muted-foreground">{opt}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-input bg-muted/30 shrink-0" />
                        <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
                      </div>
                    )}
                  </div>
                )}
                {field.type === 'radio' && (
                  <div className="space-y-1.5">
                    {(field.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border border-input bg-muted/30 shrink-0" />
                        <span className="text-sm text-muted-foreground">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!['textarea', 'select', 'checkbox', 'radio'].includes(field.type) && (
                  <div className="h-9 rounded-md border border-input bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                    {field.placeholder || ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
