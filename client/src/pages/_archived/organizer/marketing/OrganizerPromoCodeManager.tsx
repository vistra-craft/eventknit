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
  Tag,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, type PromoCode, type CreatePromoCodeData } from '@/lib/promo-code-api';
import { getOrganizerEvents } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';
import OrganizerLayout from '../OrganizerLayout';

interface OrganizerEvent {
  id: string;
  title: string;
  status: string;
}

const OrganizerPromoCodeManager = () => {
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');

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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events first
      const eventsResponse = await getOrganizerEvents();
      if (eventsResponse.success && eventsResponse.data?.events) {
        setEvents(eventsResponse.data.events);
      }

      // Fetch promo codes
      const codesResponse = await getPromoCodes();
      if (codesResponse.success && codesResponse.data) {
        setPromoCodes(codesResponse.data.promoCodes);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.eventId) {
      toast({
        title: 'Error',
        description: 'Please select an event for this promo code',
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
        fetchData();
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
        fetchData();
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
        fetchData();
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

  const resetForm = () => {
    setFormData({
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
    const matchesEvent = filterEvent === 'all' || code.eventId === filterEvent;
    return matchesSearch && matchesFilter && matchesEvent;
  });

  // Stats
  const activeCount = promoCodes.filter(c => getStatus(c) === 'active').length;
  const totalUsed = promoCodes.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
            <p className="text-muted-foreground">
              Create and manage discount codes for your events
            </p>
          </div>
          <Button onClick={() => {
            resetForm();
            setEditingCode(null);
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Codes</p>
                  <p className="text-2xl font-bold text-foreground">{promoCodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-success dark:text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Codes</p>
                  <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 dark:bg-blue-900/30 rounded-lg">
                  <Percent className="w-5 h-5 text-primary dark:text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Redemptions</p>
                  <p className="text-2xl font-bold text-foreground">{totalUsed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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
          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive' | 'expired') => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
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
              <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No promo codes found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first promo code to offer discounts on your events
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCodes.map((code) => {
              const status = getStatus(code);
              return (
                <Card key={code.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
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
                            <p className="font-semibold text-foreground">
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
                            <p className="font-semibold text-foreground">
                              {code.usedCount} / {code.usageLimit || '∞'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valid Until</p>
                            <p className="font-semibold text-foreground">
                              {new Date(code.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Event</p>
                            <p className="font-semibold text-foreground truncate">
                              {code.event?.title || 'All Events'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
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
                          className="text-destructive hover:text-destructive"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    placeholder="SUMMER2024"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    disabled={!!editingCode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Code cannot be changed after creation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Event *</Label>
                  <Select
                    value={formData.eventId || ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, eventId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Promo code will only work for this event
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                >
                  {editingCode ? 'Update' : 'Create'} Promo Code
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerPromoCodeManager;
