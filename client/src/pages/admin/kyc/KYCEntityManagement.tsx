import React, { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Shield, Building2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import type { EntityRequirement } from '@/lib/entity-management-api';
import {
  getEntityRequirements,
  addEntityRequirement,
  updateEntityRequirement,
  deleteEntityRequirement,
} from '@/lib/entity-management-api';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Entity types based on kyc_document.md
const ENTITY_TYPES = [
  { 
    value: 'INDIVIDUAL', 
    label: 'Individual', 
    description: 'Individual person (not in schema, needs implementation)',
    icon: Shield
  },
  { 
    value: 'SOLE_PROPRIETOR', 
    label: 'Sole Proprietor', 
    description: 'Individual business owner',
    icon: Shield
  },
  { 
    value: 'PARTNERSHIP', 
    label: 'Partnership', 
    description: 'Partnership business',
    icon: Building2
  },
  { 
    value: 'LIMITED_LIABILITY_COMPANY', 
    label: 'Limited Liability Company', 
    description: 'LLC business structure',
    icon: Building2
  },
  { 
    value: 'LIMITED_LIABILITY_PARTNERSHIP', 
    label: 'Limited Liability Partnership', 
    description: 'LLP business structure',
    icon: Building2
  },
  { 
    value: 'EMPLOYMENT_AGENCY_LLC', 
    label: 'Employment Agency (LLC)', 
    description: 'Employment agency with LLC structure',
    icon: Building2
  },
  { 
    value: 'FOREIGN_COMPANY_COMPLIANCE', 
    label: 'Foreign Company with Compliance', 
    description: 'Foreign companies with certificate of compliance',
    icon: Building2
  },
  { 
    value: 'PRIVATE_HOSPITAL_SOLE_PROPRIETOR', 
    label: 'Private Hospital (Sole Proprietor)', 
    description: 'Private hospital - sole proprietor',
    icon: Shield
  },
  { 
    value: 'PRIVATE_HOSPITAL_LLC', 
    label: 'Private Hospital (LLC)', 
    description: 'Private hospital - limited liability',
    icon: Building2
  },
  { 
    value: 'PUBLIC_HOSPITAL', 
    label: 'Public Hospital', 
    description: 'Government/public hospital',
    icon: Building2
  },
  { 
    value: 'PRIVATE_EDUCATION_SOLE_PROPRIETOR', 
    label: 'Private Education (Sole Proprietor)', 
    description: 'Schools, universities, colleges - sole proprietor',
    icon: Shield
  },
  { 
    value: 'PRIVATE_EDUCATION_LLC', 
    label: 'Private Education (LLC)', 
    description: 'Schools, universities, colleges - LLC',
    icon: Building2
  },
  { 
    value: 'INTERNATIONAL_EDUCATION_LLC', 
    label: 'International Education (LLC)', 
    description: 'International schools, universities, colleges',
    icon: Building2
  },
  { 
    value: 'PUBLIC_EDUCATION', 
    label: 'Public Education', 
    description: 'Government schools, universities, colleges',
    icon: Building2
  },
  { 
    value: 'COOPERATIVE_SOCIETY', 
    label: 'Co-operative Society', 
    description: 'Co-operative business structure',
    icon: Building2
  },
  { 
    value: 'INSURANCE_REINSURANCE', 
    label: 'Insurance / Reinsurance', 
    description: 'Insurance companies and brokers',
    icon: Building2
  },
  { 
    value: 'NGO', 
    label: 'Non-Governmental Organization', 
    description: 'Charities, foundations, advocacy groups',
    icon: Building2
  },
  { 
    value: 'EMBASSY_UN_WORLD_BANK', 
    label: 'Embassy / UN / World Bank', 
    description: 'International diplomatic entities',
    icon: Building2
  },
  { 
    value: 'DENOMINATIONAL_CHURCH', 
    label: 'Denominational Church', 
    description: 'Religious organizations',
    icon: Building2
  },
  { 
    value: 'PARTNERSHIP_PROFESSIONAL', 
    label: 'Partnership (Professional)', 
    description: 'Professional partnerships (accountants, advocates)',
    icon: Building2
  },
  {
    value: 'TRUST',
    label: 'Trust',
    description: 'Registered or unregistered trusts',
    icon: Building2
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other entity types not listed above',
    icon: Building2
  },
];

const KYCEntityManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [requirements, setRequirements] = useState<EntityRequirement[]>([]);
  const [editingRequirement, setEditingRequirement] = useState<EntityRequirement | null>(null);
  const [documentForm, setDocumentForm] = useState({ 
    documentType: '', 
    description: '', 
    isRequired: true 
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredEntities = ENTITY_TYPES.filter(entity =>
    entity.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load requirements when entity is selected
  const handleSelectEntity = async (entityType: string) => {
    setSelectedEntity(entityType);
    setLoading(true);
    try {
      const data = await getEntityRequirements(entityType);
      setRequirements(data);
    } catch (error) {
      console.error('Failed to load requirements:', error);
      showErrorToast(toast, error, 'Failed to load document requirements');
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = () => {
    setEditingRequirement(null);
    setDocumentForm({ documentType: '', description: '', isRequired: true });
    setShowDocumentDialog(true);
  };

  const handleEditDocument = (requirement: EntityRequirement) => {
    setEditingRequirement(requirement);
    setDocumentForm({ 
      documentType: requirement.documentType, 
      description: requirement.description || '', 
      isRequired: requirement.isRequired 
    });
    setShowDocumentDialog(true);
  };

  const handleSaveDocument = async () => {
    if (!documentForm.documentType.trim()) {
      toast({
        title: 'Document type is required',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEntity) return;

    setSaving(true);
    try {
      if (editingRequirement) {
        // Update existing requirement
        const updated = await updateEntityRequirement(
          selectedEntity,
          editingRequirement.id,
          {
            description: documentForm.description,
            isRequired: documentForm.isRequired,
          }
        );
        setRequirements(prev =>
          prev.map(req => (req.id === updated.id ? updated : req))
        );
        toast({
          title: 'Success',
          description: 'Document requirement updated',
        });
      } else {
        // Add new requirement
        const newRequirement = await addEntityRequirement(selectedEntity, {
          documentType: documentForm.documentType,
          description: documentForm.description,
          isRequired: documentForm.isRequired,
        });
        setRequirements(prev => [...prev, newRequirement]);
        toast({
          title: 'Success',
          description: 'Document requirement added',
        });
      }

      setShowDocumentDialog(false);
      setDocumentForm({ documentType: '', description: '', isRequired: true });
    } catch (err) {
      showErrorToast(toast, err, 'Failed to save requirement');
    } finally {
      setSaving(false);
    }
  };

  const [deleteDocConfirm, setDeleteDocConfirm] = useState<string | null>(null);

  const handleDeleteDocument = async (requirementId: string) => {
    if (!selectedEntity) return;

    try {
      await deleteEntityRequirement(selectedEntity, requirementId);
      setRequirements(prev => prev.filter(req => req.id !== requirementId));
      toast({
        title: 'Success',
        description: 'Document requirement removed',
      });
    } catch (err) {
      showErrorToast(toast, err, "Failed to delete requirement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-page-title">KYC Entity Type Management</h1>
        <p className="text-page-subtitle mt-2">
          Manage entity types and their required documentation for KYC verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Entity Types List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Entity Types</CardTitle>
            <CardDescription>Select an entity type to manage its requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entity types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Entity List */}
            <div className="space-y-2 max-h-[50vh] md:max-h-[600px] overflow-y-auto">
              {filteredEntities.map((entity) => {
                const Icon = entity.icon;
                return (
                  <button
                    key={entity.value}
                    onClick={() => handleSelectEntity(entity.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedEntity === entity.value
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-label">{entity.label}</div>
                        <div className="text-metadata line-clamp-2">
                          {entity.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedEntity
                    ? ENTITY_TYPES.find(e => e.value === selectedEntity)?.label
                    : 'Document Requirements'}
                </CardTitle>
                <CardDescription>
                  {selectedEntity
                    ? 'Manage required documents for this entity type'
                    : 'Select an entity type to view and manage its requirements'}
                </CardDescription>
              </div>
              {selectedEntity && (
                <Button onClick={handleAddDocument} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedEntity ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-card-description">Select an entity type from the list to manage its document requirements</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-12">
                <Loader size="lg" />
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-card-description mb-4">No document requirements defined yet</p>
                <Button onClick={handleAddDocument}>Add First Document</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="text-label">{req.documentType}</div>
                          {req.description && (
                            <div className="text-card-description mt-1">
                              {req.description}
                            </div>
                          )}
                        </div>
                        <Badge variant={req.isRequired ? 'default' : 'secondary'}>
                          {req.isRequired ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDocument(req)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDocConfirm(req.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRequirement ? 'Edit Document Requirement' : 'Add Document Requirement'}
            </DialogTitle>
            <DialogDescription>
              Define a document requirement for {ENTITY_TYPES.find(e => e.value === selectedEntity)?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="doc-type">Document Type *</Label>
              <Input
                id="doc-type"
                value={documentForm.documentType}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, documentType: e.target.value }))}
                placeholder="e.g., CERTIFICATE_OF_INCORPORATION"
                disabled={!!editingRequirement}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the document type code (e.g., PP_NEW_CONTRACT, NATIONAL_ID)
              </p>
            </div>
            <div>
              <Label htmlFor="doc-description">Description (Optional)</Label>
              <Textarea
                id="doc-description"
                value={documentForm.description}
                onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this document..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="doc-required"
                checked={documentForm.isRequired}
                onCheckedChange={(checked) => 
                  setDocumentForm(prev => ({ ...prev, isRequired: checked as boolean }))
                }
              />
              <Label htmlFor="doc-required" className="cursor-pointer">
                This document is required
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDocumentDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDocument} disabled={saving}>
              {saving ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>{editingRequirement ? 'Update' : 'Add'} Document</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDocConfirm} onOpenChange={() => setDeleteDocConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete requirement?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteDocConfirm) handleDeleteDocument(deleteDocConfirm); setDeleteDocConfirm(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KYCEntityManagement;
