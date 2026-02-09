import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { DragAndDropFormBuilder } from './DragAndDropFormBuilder';
import type { StepComponentProps, RegistrationField, FormFieldType } from './types';

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
  const addRegistrationField = () => {
    const newField: RegistrationField = {
      id: `field_${Date.now()}`,
      name: `field_${Date.now()}`,
      type: "text",
      label: "",
      required: false,
      placeholder: "",
    };
    setRegistrationFields((prev) => [...prev, newField]);
  };

  const updateRegistrationField = (index: number, updates: Partial<RegistrationField>) => {
    setRegistrationFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const removeRegistrationField = (index: number) => {
    if (registrationFields.length > 3) {
      setRegistrationFields((prev) => prev.filter((_, i) => i !== index));
    }
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
          {/* Display standard fields (Name, Email, Phone) as read-only or informational if needed,
              but usually they are implicit. The original code only mapped 'registrationFields'.
              Assuming standard fields like 'First Name', 'Last Name', 'Email' are fixed or handled elsewhere?
              The original code rendered all fields in 'registrationFields'. */}

          {registrationFields.map((field, index) => (
            <Card key={field.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Field {index + 1}</CardTitle>
                  {registrationFields.length > 3 && (
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
                      className="h-12 border-border focus-visible:border-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select value={field.type} onValueChange={(value) => updateRegistrationField(index, { type: value as RegistrationField['type'] })}>
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
                    className="h-12 border-border focus-visible:border-primary/30"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => updateRegistrationField(index, { required: checked })}
                  />
                  <Label>Required field</Label>
                </div>
              </CardContent>
            </Card>
          ))}

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
