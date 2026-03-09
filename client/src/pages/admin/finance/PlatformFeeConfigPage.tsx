import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";
import { getSetting, setSetting } from "@/lib/system-settings-api";
import { Percent, Calculator, Save, Loader2, History, AlertTriangle } from "lucide-react";
import { showErrorToast } from "@/lib/utils/error";


interface FeeConfig {
  feePercentage: number;
  minimumFee: number;
  maximumFee: number;
}

const SETTING_KEYS = {
  feePercentage: "finance.platformFeePercentage",
  minimumFee: "finance.minimumFee",
  maximumFee: "finance.maximumFee",
} as const;

const DEFAULTS: FeeConfig = {
  feePercentage: 7.5,
  minimumFee: 0,
  maximumFee: 0,
};

const PlatformFeeConfigPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FeeConfig>(DEFAULTS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Preview calculator state
  const [previewAmount, setPreviewAmount] = useState<string>("10000");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [feeRes, minRes, maxRes] = await Promise.all([
        getSetting(SETTING_KEYS.feePercentage).catch(() => null),
        getSetting(SETTING_KEYS.minimumFee).catch(() => null),
        getSetting(SETTING_KEYS.maximumFee).catch(() => null),
      ]);

      const loaded: FeeConfig = { ...DEFAULTS };

      if (feeRes?.success && feeRes.data?.setting) {
        loaded.feePercentage = Number(feeRes.data.setting.value) || DEFAULTS.feePercentage;
        setLastUpdated(feeRes.data.setting.updatedAt);
      }
      if (minRes?.success && minRes.data?.setting) {
        loaded.minimumFee = Number(minRes.data.setting.value) || DEFAULTS.minimumFee;
      }
      if (maxRes?.success && maxRes.data?.setting) {
        loaded.maximumFee = Number(maxRes.data.setting.value) || DEFAULTS.maximumFee;
      }

      setConfig(loaded);
    } catch (error) {
      console.error("Failed to load fee config:", error);
      showErrorToast(toast, error, "Failed to load fee configuration. Using defaults.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    // Validation
    if (config.feePercentage < 0 || config.feePercentage > 100) {
      toast({ title: "Validation Error", description: "Fee percentage must be between 0 and 100.", variant: "destructive" });
      return;
    }
    if (config.minimumFee < 0) {
      toast({ title: "Validation Error", description: "Minimum fee cannot be negative.", variant: "destructive" });
      return;
    }
    if (config.maximumFee < 0) {
      toast({ title: "Validation Error", description: "Maximum fee cannot be negative.", variant: "destructive" });
      return;
    }
    if (config.maximumFee > 0 && config.minimumFee > config.maximumFee) {
      toast({ title: "Validation Error", description: "Minimum fee cannot exceed maximum fee.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        setSetting(
          SETTING_KEYS.feePercentage,
          config.feePercentage,
          "number",
          "general",
          { description: "Global platform fee percentage applied to ticket sales", changeReason: "Updated via Platform Fee Config page" }
        ),
        setSetting(
          SETTING_KEYS.minimumFee,
          config.minimumFee,
          "number",
          "general",
          { description: "Minimum platform fee per transaction (0 = no minimum)", changeReason: "Updated via Platform Fee Config page" }
        ),
        setSetting(
          SETTING_KEYS.maximumFee,
          config.maximumFee,
          "number",
          "general",
          { description: "Maximum platform fee cap per transaction (0 = unlimited)", changeReason: "Updated via Platform Fee Config page" }
        ),
      ]);

      setLastUpdated(new Date().toISOString());
      toast({ title: "Success", description: "Platform fee configuration saved." });
    } catch (error) {
      console.error("Failed to save fee config:", error);
      showErrorToast(toast, error, "Failed to save fee configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Calculate preview
  const calculatePreview = () => {
    const amount = Number(previewAmount) || 0;
    let fee = (amount * config.feePercentage) / 100;

    if (config.minimumFee > 0 && fee < config.minimumFee) {
      fee = config.minimumFee;
    }
    if (config.maximumFee > 0 && fee > config.maximumFee) {
      fee = config.maximumFee;
    }
    fee = Math.min(fee, amount);

    return {
      grossAmount: amount,
      feeAmount: Number(fee.toFixed(2)),
      organizerAmount: Number((amount - fee).toFixed(2)),
    };
  };

  const preview = calculatePreview();

  if (loading) {
    return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Fee Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Configure the global platform fee percentage applied to all paid event ticket sales.
            </p>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="h-4 w-4" />
              Last updated: {new Date(lastUpdated).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Fee Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Fee Settings
              </CardTitle>
              <CardDescription>
                Set the platform fee that is deducted from organizer payouts. Changes apply to all future transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fee Percentage */}
              <div className="space-y-2">
                <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                <div className="relative">
                  <Input
                    id="feePercentage"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={config.feePercentage}
                    onChange={(e) => setConfig(prev => ({ ...prev, feePercentage: Number(e.target.value) }))}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of each transaction taken as platform fee. Default: 7.5%
                </p>
              </div>

              <Separator />

              {/* Minimum Fee */}
              <div className="space-y-2">
                <Label htmlFor="minimumFee">Minimum Fee (per transaction)</Label>
                <Input
                  id="minimumFee"
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.minimumFee}
                  onChange={(e) => setConfig(prev => ({ ...prev, minimumFee: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for no minimum. If set, the fee will never be less than this amount.
                </p>
              </div>

              {/* Maximum Fee */}
              <div className="space-y-2">
                <Label htmlFor="maximumFee">Maximum Fee Cap (per transaction)</Label>
                <Input
                  id="maximumFee"
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.maximumFee}
                  onChange={(e) => setConfig(prev => ({ ...prev, maximumFee: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for unlimited. If set, the fee will never exceed this amount.
                </p>
              </div>

              <Separator />

              {/* Warning for high fees */}
              {config.feePercentage > 20 && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-600">High fee percentage</p>
                    <p className="text-muted-foreground">
                      A fee of {config.feePercentage}% is above the industry standard (5–15%). This may discourage organizers from using the platform.
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Configuration</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Fee Preview Calculator
              </CardTitle>
              <CardDescription>
                See how the current fee settings affect a sample transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="previewAmount">Sample Ticket Sale Amount</Label>
                <Input
                  id="previewAmount"
                  type="number"
                  min={0}
                  step={100}
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Amount</span>
                  <span className="text-sm font-medium">
                    {preview.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fee Percentage</span>
                  <Badge variant="secondary">{config.feePercentage}%</Badge>
                </div>

                <div className="flex items-center justify-between text-red-600">
                  <span className="text-sm font-medium">Platform Fee</span>
                  <span className="text-sm font-bold">
                    - {preview.feeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {config.minimumFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Min fee applied?</span>
                    <Badge variant={preview.feeAmount === config.minimumFee ? "default" : "outline"} className="text-xs">
                      {preview.feeAmount === config.minimumFee ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}

                {config.maximumFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Max fee cap applied?</span>
                    <Badge variant={preview.feeAmount === config.maximumFee ? "default" : "outline"} className="text-xs">
                      {preview.feeAmount === config.maximumFee ? "Yes" : "No"}
                    </Badge>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm font-medium">Organizer Receives</span>
                  <span className="text-lg font-bold">
                    {preview.organizerAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick amounts</Label>
                <div className="flex flex-wrap gap-2">
                  {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewAmount(String(amt))}
                      className="text-xs"
                    >
                      {amt.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Configuration Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Fee Rate</p>
                <p className="text-3xl font-bold text-primary">{config.feePercentage}%</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Minimum Fee</p>
                <p className="text-3xl font-bold">
                  {config.minimumFee === 0 ? "None" : config.minimumFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Maximum Fee Cap</p>
                <p className="text-3xl font-bold">
                  {config.maximumFee === 0 ? "Unlimited" : config.maximumFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default PlatformFeeConfigPage;
