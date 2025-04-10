
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AuthLayout from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import { ROUTES, USER_ROLES } from '@/lib/constants';
import { UserRole } from '@/lib/types';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, user, profile } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.TENANT.DASHBOARD);
      }
    }
  }, [user, profile, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(email, password, role, firstName, lastName, phoneNumber);
      
      // The redirect will happen in the auth context when profile is loaded
    } catch (error) {
      // Error is already handled in the AuthContext
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Sign up to manage your properties"
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number (for M-Pesa)</Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+254712345678"
            required
          />
          <p className="text-xs text-gray-500">Include country code (e.g., +254 for Kenya)</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
        
        <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md">
          <p className="font-medium text-blue-700">Note:</p>
          <p>Only property managers can register directly. Tenants must be invited by their property manager.</p>
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-rentalsync-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
