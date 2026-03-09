/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Link as LinkIcon,
  Plus,
  BarChart3,
  Copy,
} from "lucide-react";
import {
  createAffiliateProgram,
  getAffiliatePrograms,
  applyAsAffiliate,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from '@/lib/utils/error';

interface AffiliateProgram {
  id: string;
  name: string;
  description?: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: number;
  isActive: boolean;
  affiliates?: { id: string; name?: string }[];
  _count?: { affiliates: number };
}

type CreateProgramFormFields = {
  name: string;
  description?: string;
  commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionValue: string;
  minCommission?: string;
  maxCommission?: string;
  cookieDuration?: string;
  eventId?: string;
};

const AffiliateProgram = () => {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<AffiliateProgram | null>(null);
  // Dashboard/conversions would be populated with real API data when available
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("programs");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAffiliatePrograms();
      if (response.success && response.data) {
        setPrograms(response.data.programs || []);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      showErrorToast(toast, error, 'Failed to load affiliate programs');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const loadAffiliateDashboard = useCallback(async () => {
    // Placeholder for future dashboard data fetch
    return;
  }, []);

  useEffect(() => {
    if (selectedProgram && activeTab === "dashboard") {
      loadAffiliateDashboard();
    }
  }, [selectedProgram, activeTab, loadAffiliateDashboard]);

  const handleCreateProgram = async (data: {
    eventId?: string;
    name: string;
    description?: string;
    commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
    commissionValue: string;
    minCommission?: string;
    maxCommission?: string;
    cookieDuration?: string;
  }) => {
    try {
      const response = await createAffiliateProgram({
        ...data,
        commissionValue: Number(data.commissionValue),
        minCommission: data.minCommission ? Number(data.minCommission) : undefined,
        maxCommission: data.maxCommission ? Number(data.maxCommission) : undefined,
        cookieDuration: data.cookieDuration ? Number(data.cookieDuration) : undefined,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Affiliate program created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchPrograms();
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to create program');
    }
  };

  const handleApplyAsAffiliate = async (programId: string) => {
    try {
      const response = await applyAsAffiliate(programId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Application submitted successfully",
        });
        fetchPrograms();
      }
    } catch (error) {
      showErrorToast(toast, error, 'Failed to apply as affiliate');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Affiliate Program</h1>
            <p className="text-muted-foreground mt-1">
              Create affiliate programs and track performance
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Affiliate Program</DialogTitle>
              </DialogHeader>
              <CreateProgramForm
                onSubmit={handleCreateProgram}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="dashboard">My Affiliate Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading programs...</div>
            ) : programs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No affiliate programs yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((program) => (
                  <Card key={program.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{program.name}</CardTitle>
                          {program.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {program.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={program.isActive ? "default" : "outline"}>
                          {program.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Commission:</span>
                          <span className="font-semibold">
                            {program.commissionType === "PERCENTAGE"
                              ? `${program.commissionValue}%`
                              : `$${program.commissionValue}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Affiliates:</span>
                          <span className="font-semibold">
                            {program._count?.affiliates || program.affiliates?.length || 0}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProgram(program);
                              setActiveTab("dashboard");
                            }}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyAsAffiliate(program.id)}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            {selectedProgram ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Program: {selectedProgram.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {selectedProgram.description || "No description"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Commission Type</p>
                        <p className="text-lg font-semibold">
                          {selectedProgram.commissionType === "PERCENTAGE"
                            ? "Percentage"
                            : "Fixed Amount"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Commission Value</p>
                        <p className="text-lg font-semibold">
                          {selectedProgram.commissionType === "PERCENTAGE"
                            ? `${selectedProgram.commissionValue}%`
                            : `$${selectedProgram.commissionValue}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Affiliate Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${window.location.origin}/events?ref=YOUR_CODE`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}/events?ref=YOUR_CODE`)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link to earn commissions
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a program to view dashboard</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

const CreateProgramForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    eventId?: string;
    name: string;
    description?: string;
    commissionType: "PERCENTAGE" | "FIXED_AMOUNT";
    commissionValue: string;
    minCommission?: string;
    maxCommission?: string;
    cookieDuration?: string;
  }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<CreateProgramFormFields>({
    name: "",
    description: "",
    commissionType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    commissionValue: "",
    minCommission: "",
    maxCommission: "",
    cookieDuration: "30",
    eventId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      commissionValue: formData.commissionValue,
      minCommission: formData.minCommission || undefined,
      maxCommission: formData.maxCommission || undefined,
      cookieDuration: formData.cookieDuration,
      eventId: formData.eventId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Program Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Summer Event Affiliates"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="commissionType">Commission Type *</Label>
          <Select
            value={formData.commissionType}
            onValueChange={(value: CreateProgramFormFields["commissionType"]) =>
              setFormData({ ...formData, commissionType: value })
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
        <div>
          <Label htmlFor="commissionValue">Commission Value *</Label>
          <Input
            id="commissionValue"
            type="number"
            step="0.01"
            value={formData.commissionValue}
            onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
            required
            placeholder={formData.commissionType === "PERCENTAGE" ? "e.g., 10" : "e.g., 5.00"}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minCommission">Min Commission</Label>
          <Input
            id="minCommission"
            type="number"
            step="0.01"
            value={formData.minCommission}
            onChange={(e) => setFormData({ ...formData, minCommission: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="maxCommission">Max Commission</Label>
          <Input
            id="maxCommission"
            type="number"
            step="0.01"
            value={formData.maxCommission}
            onChange={(e) => setFormData({ ...formData, maxCommission: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="cookieDuration">Cookie Duration (days)</Label>
        <Input
          id="cookieDuration"
          type="number"
          min="1"
          max="365"
          value={formData.cookieDuration}
          onChange={(e) => setFormData({ ...formData, cookieDuration: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="eventId">Event ID (Optional)</Label>
        <Input
          id="eventId"
          value={formData.eventId}
          onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
          placeholder="Link to specific event"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Program</Button>
      </div>
    </form>
  );
};

export default AffiliateProgram;

