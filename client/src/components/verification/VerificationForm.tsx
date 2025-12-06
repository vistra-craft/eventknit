import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, XCircle, Clock, Shield, Building2, User, AlertCircle, Loader2 } from 'lucide-react';
import { 
  getVerificationStatus, 
  submitIdentityVerification, 
  submitBusinessVerification,
  type VerificationStatus,
  type IdentityVerificationData,
  type BusinessVerificationData
} from '@/lib/verification-api';
import { useToast } from '@/hooks/use-toast';
// File uploads use base64 encoding

interface VerificationFormProps {
  redirectAfterBusinessVerification?: string; // Optional redirect path after business verification
}

const VerificationForm = ({ redirectAfterBusinessVerification }: VerificationFormProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [, setActiveStep] = useState<'identity' | 'business'>('identity');
  
  // Identity verification form state
  const [identityData, setIdentityData] = useState<Partial<IdentityVerificationData>>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    idType: 'passport',
    idNumber: '',
    idDocumentFrontUrl: '',
    idDocumentBackUrl: '',
  });
  const [, setIdDocumentFrontFile] = useState<File | null>(null);
  const [idDocumentFrontPreview, setIdDocumentFrontPreview] = useState<string | null>(null);
  const [, setIdDocumentBackFile] = useState<File | null>(null);
  const [idDocumentBackPreview, setIdDocumentBackPreview] = useState<string | null>(null);
  
  // Business verification form state
  const [businessData, setBusinessData] = useState<Partial<BusinessVerificationData>>({
    businessName: '',
    businessType: 'sole-proprietorship',
    taxId: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZipCode: '',
    businessCountry: '',
    businessLicenseUrl: '',
    taxDocumentUrl: '',
  });
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [taxDocumentFile, setTaxDocumentFile] = useState<File | null>(null);
  
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getVerificationStatus();
      if (response.success && response.data) {
        setStatus(response.data);
        // Pre-fill identity data if already verified
        if (response.data.identityVerified) {
          setActiveStep('business');
        }
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load verification status
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  
  const handleIdDocumentFrontUpload = async (file: File) => {
    try {
      // Validate file
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image or PDF file',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setIdDocumentFrontFile(file);
      // Create preview and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setIdDocumentFrontPreview(base64String);
        setIdentityData(prev => ({ ...prev, idDocumentFrontUrl: base64String }));
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Error',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive',
        });
        setIdDocumentFrontFile(null);
        setIdDocumentFrontPreview(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading ID document front:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload ID document. Please try again.',
        variant: 'destructive',
      });
      setIdDocumentFrontFile(null);
      setIdDocumentFrontPreview(null);
    }
  };

  const handleIdDocumentBackUpload = async (file: File) => {
    try {
      // Validate file
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image or PDF file',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setIdDocumentBackFile(file);
      // Create preview and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setIdDocumentBackPreview(base64String);
        setIdentityData(prev => ({ ...prev, idDocumentBackUrl: base64String }));
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Error',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive',
        });
        setIdDocumentBackFile(null);
        setIdDocumentBackPreview(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading ID document back:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload ID document. Please try again.',
        variant: 'destructive',
      });
      setIdDocumentBackFile(null);
      setIdDocumentBackPreview(null);
    }
  };
  
  const handleBusinessLicenseUpload = async (file: File) => {
    try {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image or PDF file',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setBusinessLicenseFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBusinessData(prev => ({ ...prev, businessLicenseUrl: base64String }));
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Error',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive',
        });
        setBusinessLicenseFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading business license:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload business license. Please try again.',
        variant: 'destructive',
      });
      setBusinessLicenseFile(null);
    }
  };
  
  const handleTaxDocumentUpload = async (file: File) => {
    try {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image or PDF file',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setTaxDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBusinessData(prev => ({ ...prev, taxDocumentUrl: base64String }));
      };
      reader.onerror = () => {
        toast({
          title: 'Upload Error',
          description: 'Failed to read file. Please try again.',
          variant: 'destructive',
        });
        setTaxDocumentFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading tax document:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload tax document. Please try again.',
        variant: 'destructive',
      });
      setTaxDocumentFile(null);
    }
  };
  
  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identityData.firstName || !identityData.lastName || 
        !identityData.address || !identityData.city || !identityData.state || 
        !identityData.zipCode || !identityData.country || !identityData.idNumber || 
        !identityData.idDocumentFrontUrl || !identityData.idDocumentBackUrl) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await submitIdentityVerification(identityData as IdentityVerificationData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Identity verification submitted successfully. You can now create paid events.',
        });
        await loadStatus();
        setActiveStep('business');
        // Trigger a custom event to notify other components (like CreateEventStepwise) to refresh verification status
        window.dispatchEvent(new CustomEvent('verificationStatusUpdated'));
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error: unknown) {
      console.error('Error submitting identity verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit identity verification. Please try again.';
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessData.businessName || !businessData.businessType || !businessData.taxId ||
        !businessData.businessAddress || !businessData.businessCity || !businessData.businessState ||
        !businessData.businessZipCode || !businessData.businessCountry) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await submitBusinessVerification(businessData as BusinessVerificationData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Business verification submitted successfully. Your documents are under review.',
        });
        await loadStatus();
        // Redirect only if redirectAfterBusinessVerification prop is provided
        if (redirectAfterBusinessVerification) {
          setTimeout(() => {
            navigate(redirectAfterBusinessVerification);
          }, 1500);
        }
      } else {
        throw new Error(response.message || 'Submission failed');
      }
    } catch (error: unknown) {
      console.error('Error submitting business verification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit business verification. Please try again.';
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading verification status...</span>
      </div>
    );
  }
  
  const getStatusBadge = (verified: boolean, status: string | null) => {
    if (verified) {
      return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    if (status === 'PENDING') {
      return <Badge className="bg-accent-coral/10 text-accent-coral border-accent-coral/20"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    }
    if (status === 'REJECTED') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="outline">Not Verified</Badge>;
  };
  
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="border-0 bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Complete verification to create paid events and receive payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Identity Verification</span>
                {getStatusBadge(status?.identityVerified || false, null)}
              </div>
              <p className="text-xs text-muted-foreground">
                Required for paid events
              </p>
              {status?.identityVerifiedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Verified: {new Date(status.identityVerifiedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Business KYC</span>
                {getStatusBadge(status?.verificationLevel === 3, status?.kycStatus || null)}
              </div>
              <p className="text-xs text-muted-foreground">
                Required for payouts
              </p>
              {status?.kycApprovedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Approved: {new Date(status.kycApprovedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Verification Level</span>
                <Badge variant="outline">Level {status?.verificationLevel || 1}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {status?.payoutLimit ? `Payout limit: $${status.payoutLimit.toLocaleString()}/month` : 'Unlimited'}
              </p>
            </div>
          </div>
          
          {status?.verificationLevel === 2 && status.payoutLimit && (
            <Alert className="border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                You can create paid events up to ${status.payoutLimit.toLocaleString()} per month. 
                Complete business verification for unlimited events and payouts.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Verification Steps */}
      <div className="space-y-4">
        {/* Step 1: Identity Verification */}
        <Card className="border-0 bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Step 1: Identity Verification
                </CardTitle>
                <CardDescription>
                  Verify your identity to create paid events
                </CardDescription>
              </div>
              {status?.identityVerified && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          {!status?.identityVerified && (
            <CardContent>
              <form onSubmit={handleIdentitySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={identityData.firstName}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={identityData.lastName}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={identityData.address}
                    onChange={(e) => setIdentityData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={identityData.city}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={identityData.state}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                    <Input
                      id="zipCode"
                      value={identityData.zipCode}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, zipCode: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={identityData.country}
                    onChange={(e) => setIdentityData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="idType">ID Type *</Label>
                    <Select
                      value={identityData.idType}
                      onValueChange={(value: 'passport' | 'drivers_license' | 'national_id') => 
                        setIdentityData(prev => ({ ...prev, idType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="idNumber">ID Number *</Label>
                    <Input
                      id="idNumber"
                      value={identityData.idNumber}
                      onChange={(e) => setIdentityData(prev => ({ ...prev, idNumber: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ID Document - Front *</Label>
                    <div className="mt-2">
                      {idDocumentFrontPreview ? (
                        <div className="relative">
                          <img src={idDocumentFrontPreview} alt="ID Document Front" className="w-full h-48 object-contain border border-border rounded-lg" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setIdDocumentFrontPreview(null);
                              setIdDocumentFrontFile(null);
                              setIdentityData(prev => ({ ...prev, idDocumentFrontUrl: '' }));
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload front of ID</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleIdDocumentFrontUpload(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>ID Document - Back *</Label>
                    <div className="mt-2">
                      {idDocumentBackPreview ? (
                        <div className="relative">
                          <img src={idDocumentBackPreview} alt="ID Document Back" className="w-full h-48 object-contain border border-border rounded-lg" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setIdDocumentBackPreview(null);
                              setIdDocumentBackFile(null);
                              setIdentityData(prev => ({ ...prev, idDocumentBackUrl: '' }));
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload back of ID</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleIdDocumentBackUpload(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload clear photos of both sides of your government-issued ID (passport, driver's license, or national ID)
                </p>
                
                <Button
                  type="submit"
                  disabled={submitting || !identityData.idDocumentFrontUrl || !identityData.idDocumentBackUrl}
                  className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Identity Verification'
                  )}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
        
        {/* Step 2: Business Verification */}
        {status?.identityVerified && (
          <Card className="border-0 bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Step 2: Business Verification (Optional)
                  </CardTitle>
                  <CardDescription>
                    Complete business verification for unlimited events and payouts
                  </CardDescription>
                </div>
                {status?.verificationLevel === 3 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />Completed
                  </Badge>
                )}
              </div>
            </CardHeader>
            {status?.verificationLevel !== 3 && (
              <CardContent>
                <form onSubmit={handleBusinessSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessData.businessName}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select
                        value={businessData.businessType}
                        onValueChange={(value: 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship' | 'non-profit' | 'other') => setBusinessData(prev => ({ ...prev, businessType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="non-profit">Non-Profit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID / EIN *</Label>
                      <Input
                        id="taxId"
                        value={businessData.taxId}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, taxId: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="businessAddress">Business Address *</Label>
                    <Input
                      id="businessAddress"
                      value={businessData.businessAddress}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="businessCity">City *</Label>
                      <Input
                        id="businessCity"
                        value={businessData.businessCity}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessCity: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessState">State/Province *</Label>
                      <Input
                        id="businessState"
                        value={businessData.businessState}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessState: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessZipCode">ZIP/Postal Code *</Label>
                      <Input
                        id="businessZipCode"
                        value={businessData.businessZipCode}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, businessZipCode: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="businessCountry">Country *</Label>
                    <Input
                      id="businessCountry"
                      value={businessData.businessCountry}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, businessCountry: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Business License (Optional)</Label>
                      {businessLicenseFile ? (
                        <div className="mt-2 p-3 border border-border rounded-lg flex items-center justify-between">
                          <span className="text-sm text-foreground">{businessLicenseFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBusinessLicenseFile(null);
                              setBusinessData(prev => ({ ...prev, businessLicenseUrl: '' }));
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload business license</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleBusinessLicenseUpload(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    
                    <div>
                      <Label>Tax Document (Optional)</Label>
                      {taxDocumentFile ? (
                        <div className="mt-2 p-3 border border-border rounded-lg flex items-center justify-between">
                          <span className="text-sm text-foreground">{taxDocumentFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTaxDocumentFile(null);
                              setBusinessData(prev => ({ ...prev, taxDocumentUrl: '' }));
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload tax document</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleTaxDocumentUpload(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent-coral hover:bg-accent-coral/90 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Business Verification'
                    )}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default VerificationForm;
