import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "../AdminLayout";
import {
  Tag,
  Percent,
  DollarSign,
  Plus,
  Users,
  TrendingUp,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  XCircle,
  Globe,
  Building2,
  Calendar,
  Layers,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import {
  getAdminPromoCodes,
  getPromoCodeStats,
  deleteAdminPromoCode,
  toggleAdminPromoCode,
  bulkGeneratePromoCodes,
  getScopeLabel,
  getScopeBadgeClass,
  type AdminPromoCode,
  type PromoCodeStats,
  type PromoCodeScope,
  type DiscountType,
  type BulkGenerateData,
} from "@/lib/admin-promo-code-api";

const AdminPromotionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScope, setFilterScope] = useState<PromoCodeScope | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  // Dialog states
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCodeId, setDeletingCodeId] = useState<string | null>(null);

  // Bulk form state
  const [bulkData, setBulkData] = useState<BulkGenerateData>({
    count: 10,
    prefix: "",
    scope: "PLATFORM",
    discountType: "PERCENTAGE",
    discountValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [pagination.page, filterScope, filterStatus, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [codesRes, statsRes] = await Promise.all([
        getAdminPromoCodes({
          scope: filterScope !== "all" ? filterScope : undefined,
          isActive: filterStatus === "all" ? undefined : filterStatus === "active",
          search: searchTerm || undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        getPromoCodeStats(),
      ]);

      if (codesRes.success && codesRes.data) {
        setPromoCodes(codesRes.data.promoCodes);
        setPagination(codesRes.data.pagination);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCodeId) return;

    try {
      const response = await deleteAdminPromoCode(deletingCodeId);
      if (response.success) {
        toast({ title: "Success", description: "Promo code deleted successfully" });
        setDeleteDialogOpen(false);
        setDeletingCodeId(null);
        loadData();
      } else {
        toast({ title: "Error", description: response.message || "Failed to delete", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete promo code", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await toggleAdminPromoCode(id);
      if (response.success) {
        toast({ title: "Success", description: response.data?.isActive ? "Promo code activated" : "Promo code deactivated" });
        loadData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle status", variant: "destructive" });
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkData.prefix.trim()) {
      toast({ title: "Error", description: "Prefix is required", variant: "destructive" });
      return;
    }

    if (!bulkData.discountValue || bulkData.discountValue <= 0) {
      toast({ title: "Error", description: "Discount value must be greater than 0", variant: "destructive" });
      return;
    }

    if (bulkData.discountType === "PERCENTAGE" && bulkData.discountValue > 100) {
      toast({ title: "Error", description: "Percentage discount cannot exceed 100%", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await bulkGeneratePromoCodes(bulkData);
      if (response.success && response.data) {
        toast({ title: "Success", description: `Generated ${response.data.count} promo codes` });
        setBulkDialogOpen(false);
        loadData();
      } else {
        toast({ title: "Error", description: response.message || "Failed to generate", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate promo codes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  const getStatus = (code: AdminPromoCode): "active" | "inactive" | "expired" => {
    if (!code.isActive) return "inactive";
    const now = new Date();
    if (now > new Date(code.validUntil)) return "expired";
    return "active";
  };

  const getStatusBadge = (code: AdminPromoCode) => {
    const status = getStatus(code);
    switch (status) {
      case "active":
        return <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "inactive":
        return <Badge className="bg-muted text-foreground"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
      case "expired":
        return <Badge className="bg-destructive/10 text-destructive"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Promo Codes</h1>
            <p className="text-muted-foreground text-sm">Create and manage platform-wide promotional codes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
              <Layers className="h-4 w-4 mr-2" />
              Bulk Generate
            </Button>
            <Button onClick={() => navigate("/admin/marketing/promo-codes/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Codes</p>
                    <p className="text-2xl font-bold">{stats.totalCodes}</p>
                  </div>
                  <Tag className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-success">{stats.activeCodes}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success/70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Redemptions</p>
                    <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Discount</p>
                    <p className="text-2xl font-bold">${stats.totalDiscountGiven.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterScope} onValueChange={(v) => setFilterScope(v as PromoCodeScope | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="PLATFORM">Platform-wide</SelectItem>
              <SelectItem value="ORGANIZER">Organizer-wide</SelectItem>
              <SelectItem value="EVENT">Single Event</SelectItem>
              <SelectItem value="MULTI_EVENT">Multi-Event</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "active" | "inactive")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Promo Codes List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : promoCodes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No promo codes found</h3>
              <p className="text-muted-foreground mb-4">Create your first promo code to get started</p>
              <Button onClick={() => navigate("/admin/marketing/promo-codes/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {promoCodes.map((code) => (
              <Card key={code.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <code className="px-3 py-1 bg-muted rounded text-lg font-mono font-semibold">
                          {code.code}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyCode(code.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Badge className={getScopeBadgeClass(code.scope)}>
                          {code.scope === "PLATFORM" && <Globe className="h-3 w-3 mr-1" />}
                          {code.scope === "ORGANIZER" && <Building2 className="h-3 w-3 mr-1" />}
                          {code.scope === "EVENT" && <Calendar className="h-3 w-3 mr-1" />}
                          {getScopeLabel(code.scope)}
                        </Badge>
                        {getStatusBadge(code)}
                        {code.firstTimeOnly && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            First-time only
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="font-medium text-primary text-lg">
                          {code.discountType === "PERCENTAGE" ? (
                            <><Percent className="h-4 w-4 inline mr-1" />{code.discountValue}% off</>
                          ) : (
                            <><DollarSign className="h-4 w-4 inline" />{code.discountValue} off</>
                          )}
                        </span>
                        {code.minOrderAmount && (
                          <span className="text-muted-foreground">
                            Min order: ${code.minOrderAmount}
                          </span>
                        )}
                        {code.maxDiscount && (
                          <span className="text-muted-foreground">
                            Max: ${code.maxDiscount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(code.validFrom).toLocaleDateString()} - {new Date(code.validUntil).toLocaleDateString()}
                        </span>
                        <span>
                          Used: {code.usedCount}{code.usageLimit ? ` / ${code.usageLimit}` : ""}
                        </span>
                        {code.event && (
                          <span>Event: {code.event.title}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(code.id)}
                        title={code.isActive ? "Deactivate" : "Activate"}
                      >
                        {code.isActive ? (
                          <ToggleRight className="h-5 w-5 text-success" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/marketing/promo-codes/${code.id}/edit`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setDeletingCodeId(code.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Generate Promo Codes</DialogTitle>
            <DialogDescription>
              Generate multiple unique promo codes at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prefix *</Label>
                <Input
                  value={bulkData.prefix}
                  onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER, VIP, LAUNCH"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">Result: {bulkData.prefix || "PREFIX"}-XXXXXX</p>
              </div>
              <div className="space-y-2">
                <Label>Count (1-1000) *</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={bulkData.count}
                  onChange={(e) => setBulkData({ ...bulkData, count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={bulkData.discountType} onValueChange={(v) => setBulkData({ ...bulkData, discountType: v as DiscountType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkData.discountValue === 0 ? "" : bulkData.discountValue}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBulkData({ ...bulkData, discountValue: isNaN(val) || val < 0 ? 0 : val });
                  }}
                  placeholder={bulkData.discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 5.00"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From *</Label>
                <Input
                  type="datetime-local"
                  value={bulkData.validFrom}
                  onChange={(e) => setBulkData({ ...bulkData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <Input
                  type="datetime-local"
                  value={bulkData.validUntil}
                  onChange={(e) => setBulkData({ ...bulkData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usage Limit (per code)</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkData.usageLimit || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBulkData({ ...bulkData, usageLimit: isNaN(val) || val < 1 ? undefined : val });
                  }}
                  placeholder="1 (default)"
                />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={bulkData.scope} onValueChange={(v) => setBulkData({ ...bulkData, scope: v as PromoCodeScope })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Platform-wide</SelectItem>
                    <SelectItem value="EVENT">Single Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkGenerate} disabled={saving}>
              {saving && <Loader size="sm" className="mr-2" />}
              Generate {bulkData.count} Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCodeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPromotionsPage;
