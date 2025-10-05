import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Handle reset password logic here
    console.log('Reset password with token:', token, 'New password:', formData.password);
    setIsSubmitted(true);
  };

  const handleBackToSignIn = () => {
    navigate('/auth/signin');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-muted/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-eventknit/10 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-accent-electric/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-eventknit rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-eventknit-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-eventknit">EventKnit</h1>
              <span className="text-sm text-muted-foreground">2.0.0 Beta</span>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">
              Set new password
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You're almost there! Create a new password for your EventKnit account and you'll be back to managing amazing events.
            </p>
          </div>

          {/* Footer Links */}
          <div className="space-y-4">
            <nav className="flex gap-6 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            </nav>
            <p className="text-xs text-muted-foreground">
              ©2025 <span className="text-eventknit">EventKnit</span> Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reset password</h1>
            <p className="text-muted-foreground">
              {isSubmitted 
                ? "Your password has been successfully reset" 
                : "Enter your new password below"
              }
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full h-12 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground">
                  Reset Password
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/auth/signin" className="text-eventknit hover:text-eventknit/80 transition-colors font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Password reset successful!</h3>
                  <p className="text-muted-foreground">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>

                <Button
                  onClick={handleBackToSignIn}
                  className="w-full h-12 bg-eventknit hover:bg-eventknit/90 text-eventknit-foreground"
                >
                  Continue to sign in
                </Button>
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our{' '}
              <Link to="/support" className="text-eventknit hover:text-eventknit/80 transition-colors">
                support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
