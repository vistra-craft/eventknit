import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  DollarSign,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, type PromoCode, type CreatePromoCodeData } from '@/lib/promo-code-api';
import { useToast } from '@/hooks/useToast';

const PromoCodeManager = () => {
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

  // Form state
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    code: '',
    eventId: undefined,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    applicableTicketTypes: [],
    usageLimit: undefined,
    maxUsesPerUser: 1,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    fetchPromoCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Log when modal opens
  useEffect(() => {
    if (showCreateModal) {
      console.log('🎯 Create Promo Code Modal Mounted!');
      console.log('📝 Current form data:', formData);
      console.log('✅ Code validation:', codeValidation);
      console.log('✏️ Editing mode:', !!editingCode);
    }
  }, [showCreateModal, formData, codeValidation, editingCode]);

  // Generate meaningful promo code based on discount context
  const generatePromoCode = (): string => {
    const timestamp = Date.now().toString().slice(-4);
    const { discountValue, discountType } = formData;

    // Strategy 1: Context-aware based on discount
    if (discountValue > 0) {
      if (discountType === 'PERCENTAGE') {
        if (discountValue >= 50) return `MEGA${discountValue}-${timestamp}`;
        if (discountValue >= 25) return `SAVE${discountValue}-${timestamp}`;
        return `OFF${discountValue}-${timestamp}`;
      } else {
        // Fixed amount
        return `CASH${Math.round(discountValue)}-${timestamp}`;
      }
    }

    // Strategy 2: Seasonal/Purpose-based for new codes
    const seasonalPrefixes = [
      'WELCOME',
      'LAUNCH',
      'VIP',
      'EARLYBIRD',
      'SPECIAL',
      'EXCLUSIVE',
      'FLASH',
      'LIMITED',
    ];
    const prefix = seasonalPrefixes[Math.floor(Math.random() * seasonalPrefixes.length)];
    const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `${prefix}${suffix}`;
  };

  // Validate promo code
  const validatePromoCode = (code: string): { valid: boolean; error?: string } => {
    if (!code) {
      return { valid: false, error: 'Code is required' };
    }

    if (code.length < 4) {
      return { valid: false, error: 'Code must be at least 4 characters' };
    }

    if (code.length > 20) {
      return { valid: false, error: 'Code must be 20 characters or less' };
    }

    // Only allow uppercase letters, numbers, hyphens, and underscores
    if (!/^[A-Z0-9-_]+$/.test(code)) {
      return { valid: false, error: 'Only letters, numbers, hyphens (-), and underscores (_) allowed' };
    }

    // Check for duplicate in existing codes (case-insensitive)
    const isDuplicate = promoCodes.some(
      (existing) => existing.code.toUpperCase() === code.toUpperCase() && existing.id !== editingCode?.id
    );
    if (isDuplicate) {
      return { valid: false, error: 'This code already exists' };
    }

    return { valid: true };
  };

  // Handle code input change with validation
  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, code: upperValue });

    // Validate on change
    const validation = validatePromoCode(upperValue);
    setCodeValidation(validation);
  };

  // Generate and set a new code
  const handleGenerateCode = () => {
    const generated = generatePromoCode();
    setFormData({ ...formData, code: generated });
    const validation = validatePromoCode(generated);
    setCodeValidation(validation);
  };

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const response = await getPromoCodes();
      if (response.success && response.data) {
        setPromoCodes(response.data.promoCodes);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    // Validate code before submission
    const validation = validatePromoCode(formData.code);
    if (!validation.valid) {
      toast({
        title: 'Invalid Code',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await createPromoCode({
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code created successfully',
        });
        setShowCreateModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create promo code',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create promo code',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingCode) return;

    try {
      const response = await updatePromoCode(editingCode.id, {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code updated successfully',
        });
        setEditingCode(null);
        resetForm();
        fetchPromoCodes();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update promo code',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update promo code',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const response = await deletePromoCode(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code deleted successfully',
        });
        fetchPromoCodes();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete promo code',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete promo code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Promo code copied to clipboard',
    });
  };

  const resetForm = (initialCode?: string) => {
    const code = initialCode || '';
    setFormData({
      code,
      eventId: undefined,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minOrderAmount: undefined,
      maxDiscount: undefined,
      applicableTicketTypes: [],
      usageLimit: undefined,
      maxUsesPerUser: 1,
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    if (code) {
      setCodeValidation(validatePromoCode(code));
    } else {
      setCodeValidation({ valid: true });
    }
  };

  const openEditModal = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      eventId: code.eventId,
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount,
      maxDiscount: code.maxDiscount,
      applicableTicketTypes: code.applicableTicketTypes,
      usageLimit: code.usageLimit,
      maxUsesPerUser: code.maxUsesPerUser,
      validFrom: new Date(code.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(code.validUntil).toISOString().slice(0, 16),
    });
    setShowCreateModal(true);
  };

  const getStatus = (code: PromoCode): 'active' | 'inactive' | 'expired' => {
    if (!code.isActive) return 'inactive';
    const now = new Date();
    if (now > new Date(code.validUntil)) return 'expired';
    if (now < new Date(code.validFrom)) return 'inactive';
    return 'active';
  };

  const filteredCodes = promoCodes.filter((code) => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.event?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(code);
    const matchesFilter = filterStatus === 'all' || filterStatus === status;
    return matchesSearch && matchesFilter;
  });

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Promo Codes</h1>
            <p className="text-muted-foreground">
              Create and manage discount codes for your events
            </p>
          </div>
          <Button onClick={() => {
            setEditingCode(null);
            // Generate a code first
            const seasonalPrefixes = ['WELCOME', 'LAUNCH', 'VIP', 'EARLYBIRD', 'SPECIAL', 'EXCLUSIVE', 'FLASH', 'LIMITED'];
            const prefix = seasonalPrefixes[Math.floor(Math.random() * seasonalPrefixes.length)];
            const suffix = Math.floor(1000 + Math.random() * 9000);
            const generated = `${prefix}${suffix}`;
            // Reset form with the generated code
            resetForm(generated);
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by code or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive' | 'expired') => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promo Codes List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No promo codes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCodes.map((code) => {
              const status = getStatus(code);
              return (
                <Card key={code.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <code className="px-3 py-1 bg-muted rounded text-lg font-mono font-semibold">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code.code)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <Badge
                            variant={
                              status === 'active'
                                ? 'default'
                                : status === 'expired'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                            {status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Discount</p>
                            <p className="font-semibold">
                              {code.discountType === 'PERCENTAGE' ? (
                                <span className="flex items-center gap-1">
                                  <Percent className="w-4 h-4" />
                                  {code.discountValue}%
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {code.discountValue}
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Usage</p>
                            <p className="font-semibold">
                              {code.usedCount} / {code.usageLimit || '∞'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valid Until</p>
                            <p className="font-semibold">
                              {new Date(code.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Event</p>
                            <p className="font-semibold">
                              {code.event?.title || 'All Events'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(code)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
              </DialogTitle>
              <DialogDescription>
                {editingCode
                  ? 'Update your promo code settings'
                  : 'Create a new discount code for your events'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="e.g., SUMMER2024, WELCOME10"
                          value={formData.code}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          disabled={!!editingCode}
                          className={!codeValidation.valid && formData.code ? 'border-destructive' : ''}
                        />
                        {!editingCode && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {formData.code.length}/20
                          </div>
                        )}
                      </div>
                      {!editingCode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateCode}
                          title="Generate code"
                          className="flex-shrink-0"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {!codeValidation.valid && formData.code && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{codeValidation.error}</span>
                      </div>
                    )}

                    {codeValidation.valid && formData.code && (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        <span>Code is available</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {editingCode
                        ? 'Code cannot be changed after creation'
                        : 'Click the sparkle button to auto-generate or enter your own'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Discount Type *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Discount Value * ({formData.discountType === 'PERCENTAGE' ? '%' : '$'})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '50'}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Discount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.maxDiscount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Cap on discount amount (optional)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Order ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.usageLimit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses Per User</Label>
                  <Input
                    type="number"
                    value={formData.maxUsesPerUser || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsesPerUser: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valid Until *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                    setEditingCode(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingCode ? handleUpdate : handleCreate}
                  className="flex-1"
                  disabled={!codeValidation.valid || !formData.code}
                >
                  {editingCode ? 'Update' : 'Create'} Promo Code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default PromoCodeManager;

