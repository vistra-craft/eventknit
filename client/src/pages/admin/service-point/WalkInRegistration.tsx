/**
 * Walk-In Registration
 * On-site attendee registration for MICE events.
 * Three-step flow: Phone number → OTP verification → Attendee details
 */

import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Phone,
  ShieldCheck,
  CheckCircle,
  ChevronLeft,
  QrCode,
  Copy,
  Printer,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/useToast";
import {
  initiateWalkInRegistration,
  verifyWalkInOTP,
  completeWalkInRegistration,
  cancelRegistrationSession,
  type CompleteRegistrationResponse,
} from "@/lib/service-point-registration-api";

// ─── Step types ───────────────────────────────────────────────────────────────

type Step = "phone" | "otp" | "details" | "success";

interface CompletedRegistration {
  registrationId: string;
  attendeeName: string;
  email: string;
  ticketType: string | null;
  qrCode: string;
  backupCode: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "phone", label: "Phone" },
  { id: "otp", label: "Verify" },
  { id: "details", label: "Details" },
  { id: "success", label: "Done" },
];

const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => {
        const isPast = i < currentIndex;
        const isActive = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isPast
                    ? "bg-success text-success-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${isPast ? "bg-success" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const WalkInRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Phone
  const [phoneNumber, setPhoneNumber] = useState("");

  // Step 2: OTP
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [existingUser, setExistingUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  // Step 3: Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Step 4: Result
  const [completed, setCompleted] = useState<CompletedRegistration | null>(null);

  // ── Step 1: Initiate ────────────────────────────────────────────────────────

  const handleInitiate = useCallback(async () => {
    if (!eventId) return;
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setError("Please enter a phone number");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await initiateWalkInRegistration(eventId, trimmed);
      if (res.success) {
        setSessionId(res.data.sessionId);
        setStep("otp");
        toast({ title: "OTP Sent", description: "A verification code has been sent to the attendee's phone" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP. Please try again.";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, phoneNumber, toast]);

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────

  const handleVerifyOTP = useCallback(async () => {
    if (!eventId) return;
    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError("Please enter the full OTP code");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await verifyWalkInOTP(eventId, sessionId, trimmedOtp);
      if (res.success && res.data.verified) {
        // Pre-fill form from existing user if available
        if (res.data.existingUser) {
          setExistingUser(res.data.existingUser);
          setFirstName(res.data.existingUser.firstName);
          setLastName(res.data.existingUser.lastName);
          setEmail(res.data.existingUser.email);
        }
        setStep("details");
        toast({ title: "Phone Verified", description: "Identity confirmed. Please complete the registration." });
      } else {
        setError("Invalid OTP. Please check the code and try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      setError(msg);
      toast({ title: "Verification Failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, sessionId, otp, toast]);

  // ── Step 3: Complete registration ───────────────────────────────────────────

  const handleComplete = useCallback(async () => {
    if (!eventId) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name and email are required");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res: CompleteRegistrationResponse = await completeWalkInRegistration(eventId, {
        sessionId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      });
      if (res.success) {
        setCompleted({
          registrationId: res.data.registrationId,
          attendeeName: res.data.attendeeName,
          email: res.data.email,
          ticketType: res.data.ticketType,
          qrCode: res.data.qrCode,
          backupCode: res.data.backupCode,
        });
        setStep("success");
        toast({ title: "Registration Complete", description: `${res.data.attendeeName} has been registered` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [eventId, sessionId, firstName, lastName, email, company, jobTitle, toast]);

  // ── Cancel session and reset ────────────────────────────────────────────────

  const handleCancel = useCallback(async () => {
    if (sessionId && eventId) {
      cancelRegistrationSession(eventId, sessionId).catch(() => {});
    }
    setStep("phone");
    setPhoneNumber("");
    setSessionId("");
    setOtp("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompany("");
    setJobTitle("");
    setExistingUser(null);
    setError(null);
  }, [eventId, sessionId]);

  const handleRegisterAnother = () => {
    setStep("phone");
    setPhoneNumber("");
    setSessionId("");
    setOtp("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompany("");
    setJobTitle("");
    setExistingUser(null);
    setError(null);
    setCompleted(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied", description: "Copied to clipboard" });
    });
  };

  if (!eventId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No event selected</p>
        <Button className="mt-4" onClick={() => navigate("/admin/service-point")}>
          Go to Service Point
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton to={`/admin/service-point/event/${eventId}`} label="Back to Dashboard" />
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Walk-In Registration
          </h1>
          <p className="text-sm text-muted-foreground">Register an on-site attendee</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <StepIndicator current={step} />

          {/* ── Step 1: Phone ─────────────────────────────────────────────── */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <Phone className="w-10 h-10 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-semibold">Enter Phone Number</h2>
                <p className="text-sm text-muted-foreground">
                  We'll send a verification code to the attendee's phone
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInitiate()}
                  className="mt-1"
                  autoFocus
                />
              </div>

              <Button onClick={handleInitiate} disabled={isLoading} className="w-full">
                {isLoading ? <Loader size="sm" className="mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                Send Verification Code
              </Button>
            </div>
          )}

          {/* ── Step 2: OTP ───────────────────────────────────────────────── */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-semibold">Enter Verification Code</h2>
                <p className="text-sm text-muted-foreground">
                  Code sent to <strong>{phoneNumber}</strong>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                  className="mt-1 text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>

              <Button onClick={handleVerifyOTP} disabled={isLoading} className="w-full">
                {isLoading ? <Loader size="sm" className="mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Verify Code
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Number
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOtp("");
                    handleInitiate();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Resend Code
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Details ───────────────────────────────────────────── */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <UserPlus className="w-10 h-10 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-semibold">Attendee Details</h2>
                {existingUser ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Returning attendee — details pre-filled
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete the registration form</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="company">Company / Organization</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Product Manager"
                  className="mt-1"
                />
              </div>

              <Button onClick={handleComplete} disabled={isLoading} className="w-full">
                {isLoading ? <Loader size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Complete Registration
              </Button>

              <Button variant="ghost" size="sm" className="w-full" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}

          {/* ── Step 4: Success ───────────────────────────────────────────── */}
          {step === "success" && completed && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Registration Complete</h2>
                <p className="text-sm text-muted-foreground mt-1">{completed.attendeeName} is now registered</p>
              </div>

              {/* Attendee card */}
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{completed.attendeeName}</p>
                    <p className="text-sm text-muted-foreground">{completed.email}</p>
                    {completed.ticketType && (
                      <Badge variant="secondary" className="mt-1 text-xs">{completed.ticketType}</Badge>
                    )}
                  </div>
                  <QrCode className="w-10 h-10 text-muted-foreground/50 flex-shrink-0" />
                </div>

                {/* QR / backup code */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-muted p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">QR Code</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground truncate flex-1">
                        {completed.qrCode.slice(0, 20)}…
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(completed.qrCode)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Backup Code</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold text-foreground">{completed.backupCode}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(completed.backupCode)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/admin/service-point/print?event=${eventId}&attendee=${completed.registrationId}`,
                    )
                  }
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Badge
                </Button>
                <Button onClick={handleRegisterAnother}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Another
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate(`/admin/service-point/event/${eventId}`)}
              >
                Back to Event Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalkInRegistration;
