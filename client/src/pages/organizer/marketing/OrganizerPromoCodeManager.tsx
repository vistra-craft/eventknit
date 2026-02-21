import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
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
  Send,
  MessageSquare,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { ConfirmDialog, SuccessDialog } from '@/components/ui/confirm-dialog';
import { getPromoCodes, updatePromoCode, deletePromoCode, type PromoCode } from '@/lib/promo-code-api';
import { createPromoCodeRequest, getMyPromoCodeRequests, type PromoCodeRequest } from '@/lib/promo-code-request-api';
import { getOrganizerEvents, getDashboardAccess } from '@/lib/organizer-api';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');

  // Edit modal state
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [editFormData, setEditFormData] = useState({
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    minOrderAmount: undefined as number | undefined,
    maxDiscount: undefined as number | undefined,
    usageLimit: undefined as number | undefined,
    maxUsesPerUser: 1,
    validFrom: '',
    validUntil: '',
  });

  // Request flow state
  const [showRequestConfirm, setShowRequestConfirm] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [hasApprovedEvent, setHasApprovedEvent] = useState(false);
  const [hasAnyEvents, setHasAnyEvents] = useState(false);
  const [myRequests, setMyRequests] = useState<PromoCodeRequest[]>([]);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestEventId, setRequestEventId] = useState<string>('');

  useEffect(() => {
    fetchData();
    checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkEligibility = async () => {
    try {
      const response = await getDashboardAccess();
      if (response.success && response.data) {
        setHasApprovedEvent(response.data.hasApprovedEvent);
      }
    } catch {
      // Silently fail - button will remain disabled
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const eventsResponse = await getOrganizerEvents();
      if (eventsResponse.success && eventsResponse.data?.events) {
        const eventsList = eventsResponse.data.events as OrganizerEvent[];
        setEvents(eventsList);
        setHasAnyEvents(eventsList.length > 0);
      }

      const codesResponse = await getPromoCodes();
      if (codesResponse.success && codesResponse.data) {
        setPromoCodes(codesResponse.data.promoCodes);
      }

      const requestsResponse = await getMyPromoCodeRequests();
      if (requestsResponse.success && requestsResponse.data) {
        setMyRequests(requestsResponse.data.requests);
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

  const handleRequestSubmit = async () => {
    setRequestLoading(true);
    try {
      const response = await createPromoCodeRequest({
        eventId: requestEventId && requestEventId !== 'none' ? requestEventId : undefined,
        message: requestMessage || undefined,
      });

      if (response.success) {
        setShowRequestConfirm(false);
        setShowRequestSuccess(true);
        setRequestMessage('');
        setRequestEventId('');
        // Refresh requests list
        const requestsResponse = await getMyPromoCodeRequests();
        if (requestsResponse.success && requestsResponse.data) {
          setMyRequests(requestsResponse.data.requests);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to submit request',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCode) return;

    try {
      const response = await updatePromoCode(editingCode.id, {
        ...editFormData,
        validFrom: new Date(editFormData.validFrom).toISOString(),
        validUntil: new Date(editFormData.validUntil).toISOString(),
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Promo code updated successfully',
        });
        setEditingCode(null);
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

  const openEditModal = (code: PromoCode) => {
    setEditingCode(code);
    setEditFormData({
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount,
      maxDiscount: code.maxDiscount,
      usageLimit: code.usageLimit,
      maxUsesPerUser: code.maxUsesPerUser,
      validFrom: new Date(code.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(code.validUntil).toISOString().slice(0, 16),
    });
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

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
          <p className="text-muted-foreground">
            Manage discount codes for your events
          </p>
        </div>
        <Button
          onClick={() => setShowRequestConfirm(true)}
          disabled={!hasApprovedEvent}
          title={!hasApprovedEvent ? 'You need at least one approved event to request promo codes' : undefined}
        >
          <Send className="w-4 h-4 mr-2" />
          Request Promo Code
        </Button>
      </div>

      {/* Eligibility Notice */}
      {!hasApprovedEvent && hasAnyEvents && !loading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Your events are pending admin approval
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              You need at least one approved event to request promo codes. Once an admin reviews and approves your event, the "Request Promo Code" button will become available.
            </p>
          </div>
        </div>
      )}

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

      {/* Main content: codes + requests side by side on large screens */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Filters + Promo Codes */}
        <div className="flex-1 min-w-0 space-y-6">
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
                  Request a promo code from the EventKnit team to offer discounts on your events
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
                        <div className="flex-1 min-w-0">
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

                          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-4 text-sm">
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
                                {code.usedCount} / {code.usageLimit || '\u221E'}
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

                        <div className="flex gap-2 shrink-0">
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
        </div>

        {/* Right: My Requests sidebar */}
        {myRequests.length > 0 && (
          <div className="w-full xl:w-[360px] 2xl:w-[400px] shrink-0">
            <div className="xl:sticky xl:top-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                My Requests
                <Badge variant="outline" className="ml-auto text-xs font-normal">
                  {myRequests.length}
                </Badge>
              </h2>
              <div className="grid gap-3">
                {myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        {getRequestStatusBadge(request.status)}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {request.event && (
                        <p className="text-sm text-foreground truncate">
                          <span className="text-muted-foreground">Event:</span>{' '}
                          <span className="font-medium">{request.event.title}</span>
                        </p>
                      )}
                      {request.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {request.message}
                        </p>
                      )}
                      {request.status === 'APPROVED' && request.promoCode && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono font-semibold">
                            {request.promoCode.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(request.promoCode!.code)}
                            className="h-5 w-5 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {request.status === 'REJECTED' && request.rejectionReason && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                          <p className="text-muted-foreground line-clamp-2">
                            {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Promo Code Dialog */}
      <ConfirmDialog
        open={showRequestConfirm}
        onOpenChange={setShowRequestConfirm}
        title="Request a Promo Code"
        description="Your request will be sent to the EventKnit team for review. Once approved, the promo code will appear in your list."
        variant="info"
        confirmText="Send Request"
        cancelText="Cancel"
        loading={requestLoading}
        onConfirm={handleRequestSubmit}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Event (optional)</Label>
            <Select
              value={requestEventId}
              onValueChange={setRequestEventId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific event</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Message (optional)</Label>
            <textarea
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Tell us what kind of promo code you need..."
              rows={3}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{requestMessage.length}/500</p>
          </div>
        </div>
      </ConfirmDialog>

      {/* Request Success Dialog */}
      <SuccessDialog
        open={showRequestSuccess}
        onOpenChange={setShowRequestSuccess}
        title="Request Sent!"
        description="Your promo code request has been submitted. You'll receive an email once it's been reviewed."
        confirmText="Got it"
      />

      {/* Edit Modal */}
      <Dialog open={!!editingCode} onOpenChange={(open) => { if (!open) setEditingCode(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
            <DialogDescription>
              Update settings for <code className="font-mono">{editingCode?.code}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={editFormData.discountType}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') =>
                    setEditFormData({ ...editFormData, discountType: value })
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
                  Discount Value ({editFormData.discountType === 'PERCENTAGE' ? '%' : '$'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.discountValue}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      discountValue: parseFloat(e.target.value) || 0,
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
                  value={editFormData.usageLimit || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      usageLimit: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max Uses Per User</Label>
                <Input
                  type="number"
                  value={editFormData.maxUsesPerUser || 1}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      maxUsesPerUser: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="datetime-local"
                  value={editFormData.validFrom}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, validFrom: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="datetime-local"
                  value={editFormData.validUntil}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, validUntil: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingCode(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="flex-1"
              >
                Update Promo Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerPromoCodeManager;
