import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, GripVertical, Type, List, CheckSquare, Mail, Phone, Plus } from 'lucide-react';
import type { RegistrationField } from '@/types/event';

interface DragAndDropFormBuilderProps {
  fields: RegistrationField[];
  onChange: (fields: RegistrationField[]) => void;
}

export const DragAndDropFormBuilder: React.FC<DragAndDropFormBuilderProps> = ({
  fields,
  onChange,
}) => {
  const addField = (type: RegistrationField['type']) => {
    const newField: RegistrationField = {
      id: crypto.randomUUID(),
      name: `field_${Date.now()}`,
      label: 'New Question',
      type,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };
    onChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    onChange(newFields);
  };

  const updateField = (index: number, updates: Partial<RegistrationField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'select': return <List className="h-4 w-4" />;
      case 'radio': return <CheckSquare className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[600px] border border-border/60 rounded-xl overflow-hidden bg-background">
      {/* Sidebar - Tools */}
      <div className="w-56 border-r border-border/60 bg-muted/20 p-4 space-y-4 shrink-0">
        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Add Field</h3>
        <div className="space-y-1.5">
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('text')}>
            <Type className="h-3.5 w-3.5" /> Short Answer
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('textarea')}>
            <Type className="h-3.5 w-3.5" /> Long Answer
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('select')}>
            <List className="h-3.5 w-3.5" /> Dropdown
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('radio')}>
            <CheckSquare className="h-3.5 w-3.5" /> Multiple Choice
          </Button>
          <div className="border-t border-border/60 my-1" />
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('email')}>
            <Mail className="h-3.5 w-3.5" /> Email
          </Button>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => addField('phone')}>
            <Phone className="h-3.5 w-3.5" /> Phone
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-6 bg-muted/10 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-3">
          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
              <p className="font-medium">No fields yet</p>
              <p className="text-sm mt-1">Click a field type from the sidebar to add it</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id} className="border border-border/60 bg-card group hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Drag handle */}
                    <div className="mt-2 text-muted-foreground/40 cursor-grab active:cursor-grabbing shrink-0">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Row 1: label + type badge + remove */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="e.g., Full Name"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <div className="flex items-center gap-2 h-9 px-3 border border-border/60 rounded-md text-xs text-muted-foreground bg-muted/50">
                            {getIconForType(field.type)}
                            <span className="capitalize">{field.type}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 mt-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Row 2: placeholder */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Placeholder</Label>
                        <Input
                          value={field.placeholder ?? ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Hint text shown inside the field"
                          className="h-9 text-sm"
                        />
                      </div>

                      {/* Options editor for select/radio */}
                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                          <Label className="text-xs text-muted-foreground">Options</Label>
                          {field.options?.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions[optIndex] = e.target.value;
                                  updateField(index, { options: newOptions });
                                }}
                                className="h-8 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-destructive shrink-0"
                                onClick={() => {
                                  const newOptions = [...(field.options || [])];
                                  newOptions.splice(optIndex, 1);
                                  updateField(index, { options: newOptions });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary h-7 px-2"
                            onClick={() => updateField(index, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>
                      )}

                      {/* Row 3: required toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          id={`req-${field.id}`}
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: checked })}
                        />
                        <Label htmlFor={`req-${field.id}`} className="text-sm font-normal cursor-pointer">
                          Required
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
