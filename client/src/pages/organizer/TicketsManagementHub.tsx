/**
 * Consolidated Tickets Management Hub
 * 
 * Consolidates all ticket-related features:
 * - Dynamic Pricing rules
 * - Advanced Ticket Types (Packages, Bundles)
 * - Promo Codes (moved from marketing)
 * - Invitations management
 * - Dashboard with cross-feature analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ticket,
  Plus,
  Trash2,
  TrendingUp,
  Gift,
  Tag,
  AlertCircle,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { useNavigate, useParams } from 'react-router-dom';

// API imports
import { getEvents, EventStatus } from '@/lib/event-api';
import {
  createPricingRule,
  getEventPricingRules,
  deletePricingRule,
} from '@/lib/organizer-dashboard-api';
import {
  createTicketPackage,
  getEventTicketPackages,
  deleteTicketPackage,
} from '@/lib/organizer-dashboard-api';
import {
  getPromoCodes,
  createPromoCode,
  deletePromoCode,
  type PromoCode,
} from '@/lib/promo-code-api';

// Types
interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
  image?: string;
  category?: string;
}

interface PricingRule {
  id: string;
  name: string;
  type: 'time_based' | 'demand_based' | 'group_discount' | 'loyalty';
  startDate?: string;
  endDate?: string;
  demandThreshold?: number;
  priceMultiplier?: number;
  minGroupSize?: number;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  priority: number;
  isActive: boolean;
}

interface TicketPackage {
  id: string;
  name: string;
  description?: string;
  type: 'group' | 'bundle' | 'donation';
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  isDonation: boolean;
  minDonation?: number;
  maxDonation?: number;
  hasReservedSeating: boolean;
  quantity?: number;
  soldQuantity: number;
  isActive: boolean;
}

interface HubStats {
  totalTicketTypes: number;
  activePricingRules: number;
  activePromoCodes: number;
  totalPackages: number;
  estimatedRevenue?: number;
}

const TicketsManagementHub = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { toast } = useToast();

  // Core state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pricing' | 'packages' | 'promo-codes'>('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '');
  const [loading, setLoading] = useState(true);

  // Pricing state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [isCreatePricingDialogOpen, setIsCreatePricingDialogOpen] = useState(false);

  // Packages state
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);

  // Promo codes state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isCreatePromoDialogOpen, setIsCreatePromoDialogOpen] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<HubStats>({
    totalTicketTypes: 0,
    activePricingRules: 0,
    activePromoCodes: 0,
    totalPackages: 0,
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'pricing' | 'package' | 'promo' | null;
    id: string | null;
    name: string | null;
  }>({
    open: false,
    type: null,
    id: null,
    name: null,
  });

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch data when event is selected
  useEffect(() => {
    if (selectedEventId) {
      setSelectedEventId(selectedEventId);
      fetchAllData();
    }
  }, [selectedEventId]);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await getEvents({ limit: 50, status: EventStatus.APPROVED });
      if (response.success && response.data?.events) {
        setEvents(response.data.events as Event[]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchAllData = useCallback(async () => {
    if (!selectedEventId) return;

    try {
      setLoading(true);
      await Promise.all([fetchPricingRules(), fetchPackages(), fetchPromoCodes()]);
      updateStats();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket management data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  const fetchPricingRules = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const response = await getEventPricingRules(selectedEventId);
      if (response.success && response.data) {
        setPricingRules(response.data.rules || []);
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    }
  }, [selectedEventId]);

  const fetchPackages = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const response = await getEventTicketPackages(selectedEventId);
      if (response.success && response.data) {
        setPackages(response.data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  }, [selectedEventId]);

  const fetchPromoCodes = useCallback(async () => {
    try {
      const response = await getPromoCodes(selectedEventId);
      if (response.success && response.data?.promoCodes) {
        setPromoCodes(response.data.promoCodes);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  }, [selectedEventId]);

  const updateStats = () => {
    setStats({
      totalTicketTypes: 0,
      activePricingRules: pricingRules.filter((r) => r.isActive).length,
      activePromoCodes: promoCodes.filter((p) => p.isActive).length,
      totalPackages: packages.length,
    });
  };

  // ============================================================================
  // Pricing Rules Handlers
  // ============================================================================

  const handleCreatePricingRule = async (data: Partial<PricingRule>) => {
    if (!selectedEventId || !data.name || !data.type) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await createPricingRule({
        eventId: selectedEventId,
        name: data.name,
        type: data.type,
        priority: data.priority || 0,
        startDate: data.startDate,
        endDate: data.endDate,
        demandThreshold: data.demandThreshold,
        priceMultiplier: data.priceMultiplier,
        minGroupSize: data.minGroupSize,
        discountType: data.discountType,
        discountValue: data.discountValue,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Pricing rule created successfully',
        });
        setIsCreatePricingDialogOpen(false);
        await fetchPricingRules();
      } else {
        throw new Error(response.message || 'Failed to create pricing rule');
      }
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create pricing rule',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePricingRule = async (ruleId: string) => {
    try {
      const response = await deletePricingRule(ruleId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Pricing rule deleted successfully',
        });
        await fetchPricingRules();
      } else {
        throw new Error(response.message || 'Failed to delete pricing rule');
      }
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete pricing rule',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm({ open: false, type: null, id: null, name: null });
    }
  };

  // ============================================================================
  // Package Handlers
  // ============================================================================

  const handleCreatePackage = async (data: Partial<TicketPackage>) => {
    if (!selectedEventId || !data.name) {
      toast({
        title: 'Name is required',
        description: 'Please provide a package name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await createTicketPackage({
        eventId: selectedEventId,
        name: data.name,
        description: data.description,
        type: (data.type || 'group') as 'group' | 'bundle' | 'donation',
        price: data.price,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        isDonation: data.isDonation || false,
        minDonation: data.minDonation,
        maxDonation: data.maxDonation,
        hasReservedSeating: data.hasReservedSeating || false,
        quantity: data.quantity,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Ticket package created successfully',
        });
        setIsCreatePackageDialogOpen(false);
        await fetchPackages();
      } else {
        throw new Error(response.message || 'Failed to create package');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create package',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await deleteTicketPackage(packageId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Package deleted successfully',
        });
        await fetchPackages();
      } else {
        throw new Error(response.message || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete package',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm({ open: false, type: null, id: null, name: null });
    }
  };

  // ============================================================================
  // Promo Code Handlers
  // ============================================================================

  const handleCreatePromoCode = async (data: Partial<PromoCode> & {
    validFrom?: string;
    validUntil?: string;
    usageLimit?: number;
  }) => {
    if (!selectedEventId || !data.code) {
      toast({
        title: 'Code is required',
        description: 'Please provide a promo code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await createPromoCode({
        code: data.code.toUpperCase(),
        eventId: selectedEventId,
        discountType: (data.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT') || 'PERCENTAGE',
        discountValue: data.discountValue || 0,
        validFrom: data.validFrom || new Date().toISOString(),
        validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: data.usageLimit,
        maxUsesPerUser: data.maxUsesPerUser || 1,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code created successfully',
        });
        setIsCreatePromoDialogOpen(false);
        await fetchPromoCodes();
      } else {
        throw new Error(response.message || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create promo code',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePromoCode = async (promoId: string) => {
    try {
      const response = await deletePromoCode(promoId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code deleted successfully',
        });
        await fetchPromoCodes();
      } else {
        throw new Error(response.message || 'Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete promo code',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm({ open: false, type: null, id: null, name: null });
    }
  };

  // ============================================================================
  // Render Sections
  // ============================================================================

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Pricing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activePricingRules}</div>
            <p className="text-xs text-gray-500 mt-1">of {pricingRules.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activePromoCodes}</div>
            <p className="text-xs text-gray-500 mt-1">of {promoCodes.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-gray-500 mt-1">active packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs text-gray-500 mt-1">from event creation</p>
          </CardContent>
        </Card>
      </div>

      {!selectedEventId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Select an Event
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-800">
            <p>Choose an event from the dropdown above to manage its ticket strategy.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPricingRules = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dynamic Pricing Rules</h3>
        <Dialog open={isCreatePricingDialogOpen} onOpenChange={setIsCreatePricingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pricing Rule</DialogTitle>
            </DialogHeader>
            <PricingRuleForm
              onSubmit={handleCreatePricingRule}
              onClose={() => setIsCreatePricingDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : pricingRules.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">No pricing rules yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pricingRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <Badge variant="outline">{rule.type.replace('_', ' ')}</Badge>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          type: 'pricing',
                          id: rule.id,
                          name: rule.name,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPackages = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ticket Packages & Bundles</h3>
        <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ticket Package</DialogTitle>
            </DialogHeader>
            <PackageForm
              onSubmit={handleCreatePackage}
              onClose={() => setIsCreatePackageDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : packages.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">No packages yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{pkg.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <Badge variant="outline">{pkg.type}</Badge>
                      {pkg.price && <span className="ml-2 font-semibold">${pkg.price}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          type: 'package',
                          id: pkg.id,
                          name: pkg.name,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPromoCodes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Promo Codes</h3>
        <Dialog open={isCreatePromoDialogOpen} onOpenChange={setIsCreatePromoDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Promo Code</DialogTitle>
            </DialogHeader>
            <PromoCodeForm
              onSubmit={handleCreatePromoCode}
              onClose={() => setIsCreatePromoDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : promoCodes.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">No promo codes yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {promoCodes.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-lg">{promo.code}</code>
                      <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `$${promo.discountValue}`} discount
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          type: 'promo',
                          id: promo.id,
                          name: promo.code,
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/organizer/dashboard')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="w-6 h-6" />
                Tickets Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage pricing, packages, and promo codes</p>
            </div>
          </div>

          {/* Event Selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="event-select" className="font-semibold">
              Select Event:
            </Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Gift className="w-4 h-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="promo-codes" className="gap-2">
              <Tag className="w-4 h-4" />
              Promo Codes
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
            <TabsContent value="pricing">{renderPricingRules()}</TabsContent>
            <TabsContent value="packages">{renderPackages()}</TabsContent>
            <TabsContent value="promo-codes">{renderPromoCodes()}</TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteConfirm({ open: false, type: null, id: null, name: null });
          }
        }}
        title={`Delete ${deleteConfirm.type === 'pricing' ? 'Pricing Rule' : deleteConfirm.type === 'package' ? 'Package' : 'Promo Code'}`}
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (!deleteConfirm.id || !deleteConfirm.type) return;
          if (deleteConfirm.type === 'pricing') {
            await handleDeletePricingRule(deleteConfirm.id);
          } else if (deleteConfirm.type === 'package') {
            await handleDeletePackage(deleteConfirm.id);
          } else if (deleteConfirm.type === 'promo') {
            await handleDeletePromoCode(deleteConfirm.id);
          }
        }}
        onCancel={() => setDeleteConfirm({ open: false, type: null, id: null, name: null })}
      />
    </div>
  );
};

// ============================================================================
// Form Components
// ============================================================================

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

const PricingRuleForm = ({ onSubmit, onClose }: FormProps) => {
  const [data, setData] = useState({
    name: '',
    type: 'time_based' as const,
    priority: 0,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="e.g., Early Bird Discount"
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Rule Type</Label>
        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time_based">Time-Based</SelectItem>
            <SelectItem value="demand_based">Demand-Based</SelectItem>
            <SelectItem value="group_discount">Group Discount</SelectItem>
            <SelectItem value="loyalty">Loyalty</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Rule</Button>
      </div>
    </form>
  );
};

const PackageForm = ({ onSubmit, onClose }: FormProps) => {
  const [data, setData] = useState({
    name: '',
    type: 'group' as const,
    price: 0,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="pkg-name">Package Name</Label>
        <Input
          id="pkg-name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="e.g., VIP Bundle"
          required
        />
      </div>
      <div>
        <Label htmlFor="pkg-type">Package Type</Label>
        <Select value={data.type} onValueChange={(v) => setData({ ...data, type: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="group">Group</SelectItem>
            <SelectItem value="bundle">Bundle</SelectItem>
            <SelectItem value="donation">Donation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Package</Button>
      </div>
    </form>
  );
};

const PromoCodeForm = ({ onSubmit, onClose }: FormProps) => {
  const [data, setData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as const,
    discountValue: 10,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="code">Promo Code</Label>
        <Input
          id="code"
          value={data.code}
          onChange={(e) => setData({ ...data, code: e.target.value.toUpperCase() })}
          placeholder="e.g., SAVE20"
          required
        />
      </div>
      <div>
        <Label htmlFor="discount-type">Discount Type</Label>
        <Select
          value={data.discountType}
          onValueChange={(v) => setData({ ...data, discountType: v as any })}
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
      <div>
        <Label htmlFor="discount-value">Discount Value</Label>
        <Input
          id="discount-value"
          type="number"
          value={data.discountValue}
          onChange={(e) => setData({ ...data, discountValue: Number(e.target.value) })}
          placeholder="10"
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Code</Button>
      </div>
    </form>
  );
};

export default TicketsManagementHub;
