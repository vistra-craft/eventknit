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
      case 'tel': return <Phone className="h-4 w-4" />;
      case 'select': return <List className="h-4 w-4" />;
      case 'radio': return <CheckSquare className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Sidebar - Tools */}
      <div className="w-64 border-r bg-muted/20 p-4 space-y-6">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Form Elements</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('text')}>
              <Type className="h-4 w-4" /> Short Answer
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('textarea')}>
              <Type className="h-4 w-4" /> Long Answer
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('select')}>
              <List className="h-4 w-4" /> Dropdown
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('radio')}>
              <CheckSquare className="h-4 w-4" /> Choice
            </Button>
             <div className="my-2 border-t pt-2" />
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('email')}>
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addField('tel')}>
              <Phone className="h-4 w-4" /> Phone
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas - Form Preview & Editor */}
      <div className="flex-1 p-8 bg-muted/10 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Registration Form</h2>
            <p className="text-muted-foreground">Customize the questions attendees must answer.</p>
          </div>

          {fields.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground">
              <p>Your form is empty.</p>
              <p className="text-sm">Click an element from the sidebar to add it.</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id} className="relative group border border-transparent hover:border-primary/50 transition-colors">
                 <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeField(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="mt-3 text-muted-foreground cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1 block">Question Label</Label>
                          <Input 
                            value={field.label} 
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="font-medium text-lg border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-foreground" 
                          />
                        </div>
                         <div className="w-32">
                           <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                           <div className="flex items-center gap-2 h-10 px-3 border rounded text-sm text-muted-foreground bg-muted/50">
                             {getIconForType(field.type)}
                             <span className="capitalize">{field.type}</span>
                           </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: checked })}
                          id={`req-${field.id}`}
                        />
                        <Label htmlFor={`req-${field.id}`} className="text-sm font-normal">Required field</Label>
                      </div>

                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
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
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-destructive"
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
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-primary"
                            onClick={() => updateField(index, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>
                      )}
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
