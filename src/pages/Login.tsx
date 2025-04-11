
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AuthLayout from '@/components/layouts/AuthLayout';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, profile } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"admin" | "tenant">("admin");

  // Redirect if already logged in
  useEffect(() => {
    console.log('Login effect: Checking if user is logged in', user);
    if (user && profile) {
      console.log('User is logged in, redirecting to dashboard');
      if (profile.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.TENANT.DASHBOARD);
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    // For tenants, verify invitation code
    if (activeTab === 'tenant' && !invitationCode) {
      toast.error('Please enter your invitation code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Attempting login: ${activeTab} - ${email}`);
      await login(
        email, 
        password, 
        activeTab === 'tenant' ? invitationCode : undefined
      );
      
      // Show a loading toast
      toast.loading('Signing you in...', { id: 'login' });
      
      // Add a timeout to allow for profile creation
      setTimeout(() => {
        toast.dismiss('login');
        if (activeTab === 'admin') {
          navigate(ROUTES.ADMIN.DASHBOARD);
        } else {
          navigate(ROUTES.TENANT.DASHBOARD);
        }
      }, 3000);
      
    } catch (error: any) {
      // Error is already handled in the AuthContext
      toast.dismiss('login');
      toast.error(error.message || 'Login failed');
      setIsSubmitting(false);
    }
  };
  
  // Pre-fill fields for demo purposes
  const handleDemoLogin = (role: 'admin' | 'tenant') => {
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('password123');
      setActiveTab('admin');
    } else {
      setEmail('tenant@example.com');
      setPassword('password123');
      setInvitationCode('ABC123');
      setActiveTab('tenant');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "admin" | "tenant")}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="admin">Property Manager</TabsTrigger>
          <TabsTrigger value="tenant">Tenant</TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-rentalsync-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        
        {activeTab === 'tenant' && (
          <div className="space-y-2">
            <Label htmlFor="invitationCode">Invitation Code</Label>
            <Input
              id="invitationCode"
              type="text"
              placeholder="Enter the code from your invitation email"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              You need an invitation code sent by your property manager
            </p>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember" 
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => handleDemoLogin('tenant')}
          >
            Demo as Tenant
          </Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => handleDemoLogin('admin')}
          >
            Demo as Admin
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm">
        {activeTab === 'admin' ? (
          <>
            Don't have an account?{' '}
            <Link to="/register" className="text-rentalsync-primary hover:underline font-medium">
              Sign up now
            </Link>
          </>
        ) : (
          <p className="text-gray-600">
            Tenants must be invited by a property manager
          </p>
        )}
      </div>
    </AuthLayout>
  );
};

export default Login;
