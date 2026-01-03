import React, { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { type OrganizerDirector, type CreateDirectorData } from '@/lib/organizer-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DirectorsFormProps {
  directors: OrganizerDirector[];
  minDirectors?: number;
  maxDirectorsToCollect?: number;
  onAdd: (data: CreateDirectorData) => Promise<void>;
  onDelete: (directorId: string) => Promise<void>;
  disabled?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'ALIEN_ID', label: 'Alien ID' },
  { value: 'MILITARY_ID', label: 'Military ID' },
];

export const DirectorsForm: React.FC<DirectorsFormProps> = ({
  directors,
  minDirectors = 1,
  maxDirectorsToCollect,
  onAdd,
  onDelete,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState<CreateDirectorData>({
    fullName: '',
    nationality: '',
    dateOfBirth: '',
    documentType: 'NATIONAL_ID',
    documentNumber: '',
    kraPin: '',
    sharePercentage: undefined,
    position: '',
  });

  const canAddMore = !maxDirectorsToCollect || directors.length < maxDirectorsToCollect;
  const topFiveDirectors = directors.filter((d) => d.isTopFive);
  const otherDirectors = directors.filter((d) => !d.isTopFive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.nationality || !formData.dateOfBirth || !formData.documentNumber) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setAdding(true);
    try {
      await onAdd(formData);
      setFormData({
        fullName: '',
        nationality: '',
        dateOfBirth: '',
        documentType: 'NATIONAL_ID',
        documentNumber: '',
        kraPin: '',
        sharePercentage: undefined,
        position: '',
      });
      setShowAddForm(false);
      toast({
        title: 'Director added',
        description: 'Director/shareholder has been added successfully',
      });
    } catch (error: unknown) {
      toast({
        title: 'Failed to add director',
        description: error instanceof Error ? error.message : 'An error occurred while adding the director',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (directorId: string) => {
    if (!confirm('Are you sure you want to remove this director/shareholder?')) {
      return;
    }

    try {
      await onDelete(directorId);
      toast({
        title: 'Director removed',
        description: 'Director/shareholder has been removed successfully',
      });
    } catch (error: unknown) {
      toast({
        title: 'Failed to remove director',
        description: error instanceof Error ? error.message : 'An error occurred while removing the director',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Directors & Shareholders</h2>
        <p className="text-muted-foreground">
          {minDirectors > 1
            ? `Add at least ${minDirectors} directors/shareholders`
            : 'Add directors and shareholders for your entity'}
          {maxDirectorsToCollect &&
            `. Only the top ${maxDirectorsToCollect} by share percentage will be fully verified.`}
        </p>
      </div>

      {/* Current directors */}
      {directors.length > 0 && (
        <div className="space-y-4">
          {topFiveDirectors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Primary Directors/Shareholders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topFiveDirectors.map((director) => (
                  <Card key={director.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{director.fullName}</span>
                            {director.isTopFive && (
                              <Badge variant="default">Top {maxDirectorsToCollect || 5}</Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Nationality: {director.nationality}</div>
                            <div>Document: {director.documentType} - {director.documentNumber}</div>
                            {director.kraPin && <div>KRA PIN: {director.kraPin}</div>}
                            {director.sharePercentage !== null && (
                              <div>Share: {director.sharePercentage}%</div>
                            )}
                            {director.position && <div>Position: {director.position}</div>}
                            <div>DOB: {new Date(director.dateOfBirth).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {!disabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(director.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {otherDirectors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Additional Directors/Shareholders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherDirectors.map((director) => (
                  <Card key={director.id} variant="minimal">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{director.fullName}</span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Nationality: {director.nationality}</div>
                            <div>Document: {director.documentType} - {director.documentNumber}</div>
                            {director.kraPin && <div>KRA PIN: {director.kraPin}</div>}
                          </div>
                        </div>
                        {!disabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(director.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {canAddMore && (
        <div>
          {!showAddForm ? (
            <Button onClick={() => setShowAddForm(true)} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" />
              Add Director/Shareholder
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Add Director/Shareholder</CardTitle>
                <CardDescription>Fill in the details for the director or shareholder</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="nationality">Nationality *</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        required
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="documentType">Document Type *</Label>
                      <Select
                        value={formData.documentType}
                        onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                        disabled={disabled || adding}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="documentNumber">Document Number *</Label>
                      <Input
                        id="documentNumber"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        required
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="kraPin">KRA PIN (Optional)</Label>
                      <Input
                        id="kraPin"
                        value={formData.kraPin || ''}
                        onChange={(e) => setFormData({ ...formData, kraPin: e.target.value })}
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sharePercentage">Share Percentage % (Optional)</Label>
                      <Input
                        id="sharePercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.sharePercentage || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sharePercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        disabled={disabled || adding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="position">Position (Optional)</Label>
                      <Input
                        id="position"
                        placeholder="e.g., Director, Shareholder, Trustee"
                        value={formData.position || ''}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        disabled={disabled || adding}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={disabled || adding}>
                      {adding ? 'Adding...' : 'Add Director'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({
                          fullName: '',
                          nationality: '',
                          dateOfBirth: '',
                          documentType: 'NATIONAL_ID',
                          documentNumber: '',
                          kraPin: '',
                          sharePercentage: undefined,
                          position: '',
                        });
                      }}
                      disabled={disabled || adding}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!canAddMore && directors.length >= (maxDirectorsToCollect || 0) && (
        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          Maximum number of directors ({maxDirectorsToCollect}) reached. Additional directors can be listed in a separate document.
        </div>
      )}
    </div>
  );
};
