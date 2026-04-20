import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lock, User, Phone, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import {
  validateStaffInvitation,
  acceptStaffInvitation,
  type StaffInvitationInfo,
} from '@/lib/auth-api';
import { setAccessToken } from '@/lib/api';
import { useAuthContext } from '@/hooks/useAuthContext';
import { ROLE_LABELS } from '@/constants/roleLabels';
import Logo from '@/components/layout/Logo';

const AcceptStaffInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useAuthContext();

  const token = searchParams.get('token');

  const [invitationInfo, setInvitationInfo] = useState<StaffInvitationInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setIsVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await validateStaffInvitation(token);
        if (response.success && response.data) {
          setInvitationInfo(response.data);
        } else {
          setError('Invalid or expired invitation.');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'This invitation is invalid or has expired.';
        setError(message);
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [token]);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (pw.length > 128) return 'Password must be no more than 128 characters';
    if (!/[a-zA-Z]/.test(pw)) return 'Password must contain at least one letter';
    if (!/\d/.test(pw)) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await acceptStaffInvitation({
        token,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      });

      if (response.success && response.data) {
        // Store access token
        setAccessToken(response.data.accessToken);

        // Update auth context
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user as import('@/types/auth').User });

        setSuccess(true);

        // Redirect based on role
        const role = response.data.user.role;
        setTimeout(() => {
          if (
            role === 'SUPERADMIN' ||
            role === 'ADMIN' ||
            role === 'SUPPORT' ||
            role === 'TELLER'
          ) {
            navigate('/admin/dashboard');
          } else if (
            role === 'ORGANIZER_ADMIN' ||
            role === 'ORGANIZER_TELLER'
          ) {
            navigate('/organizer/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to create account. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel =
    invitationInfo?.role
      ? ROLE_LABELS[invitationInfo.role as keyof typeof ROLE_LABELS] || invitationInfo.role
      : '';

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/40 bg-card">
          <CardHeader className="text-center">
            <Logo to="/" className="mx-auto mb-4" />
            <CardTitle>Invitation Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Please contact the person who invited you to request a new invitation.
            </p>
            <div className="text-center">
              <Link to="/auth/sign-in" className="text-sm text-primary hover:underline">
                Go to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/40 bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle>Welcome to EventKnit!</CardTitle>
            <CardDescription>
              Your account has been created as <strong>{roleLabel}</strong>. Redirecting to your
              dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/40 bg-card">
        <CardHeader className="text-center">
          <Logo to="/" className="mx-auto mb-4" />
          <CardTitle>Set Up Your Account</CardTitle>
          <CardDescription>
            <strong>{invitationInfo?.inviterName}</strong> invited you to join
            {invitationInfo?.organizationName
              ? ` ${invitationInfo.organizationName}`
              : ' EventKnit'}
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {roleLabel}
            </Badge>
          </div>
          {invitationInfo?.message && (
            <p className="mt-3 text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 text-left">
              &quot;{invitationInfo.message}&quot;
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{invitationInfo?.email}</p>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254..."
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                8+ characters with at least one letter and one number
              </p>
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">Already have an account? </span>
            <Link to="/auth/sign-in" className="text-sm text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptStaffInvite;
