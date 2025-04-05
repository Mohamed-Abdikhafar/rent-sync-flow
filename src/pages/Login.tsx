
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AuthLayout from '@/components/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<'standard' | 'invitation'>('standard');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    if (loginMode === 'invitation' && !invitationCode) {
      toast.error('Please enter your invitation code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we would check if this is a first-time login with invitation code
      // For now, we'll simulate this with a check for "tenant@example.com" and "INVITE"
      const isInvitationLogin = loginMode === 'invitation' && 
        email === 'tenant@example.com' && 
        invitationCode === 'INVITE';
      
      if (isInvitationLogin) {
        // For demo purposes, we'll treat this as a first-time login
        setIsFirstLogin(true);
        toast.success('First time login successful. Please set a new password.');
        // In a real app, we'd navigate to a password setup page
        // For the demo, we'll just log them in
        await login(email, password);
      } else {
        await login(email, password);
        
        // Navigate based on user role - for now using mockData
        if (email === 'admin@example.com') {
          navigate(ROUTES.ADMIN.DASHBOARD);
        } else {
          navigate(ROUTES.TENANT.DASHBOARD);
        }
      }
    } catch (error) {
      // Error is already handled in the AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Pre-fill fields for demo purposes
  const handleDemoLogin = (role: 'admin' | 'tenant') => {
    if (role === 'admin') {
      setEmail('admin@example.com');
      setPassword('password');
      setLoginMode('standard');
    } else {
      setEmail('tenant@example.com');
      setPassword('password');
      // For demo purposes, set the invitation code for tenant to "INVITE"
      setInvitationCode('INVITE');
      setLoginMode('invitation');
    }
  };

  return (
    <AuthLayout
      title="Welcome to RentalSync"
      subtitle="Sign in to access your portal"
    >
      <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as 'standard' | 'invitation')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="standard">Standard Login</TabsTrigger>
          <TabsTrigger value="invitation">First Time Login</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard">
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
        </TabsContent>
        
        <TabsContent value="invitation">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're a new tenant, use this form with the invitation code sent to your email.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitation-email">Email</Label>
              <Input
                id="invitation-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temp-password">Temporary Password</Label>
              <Input
                id="temp-password"
                type="password"
                placeholder="Temporary password from your invitation email"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invitation-code">Invitation Code</Label>
              <Input
                id="invitation-code"
                placeholder="e.g., ABCD12"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      
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
        Don't have an account?{' '}
        <p className="text-rentalsync-primary font-medium">
          Contact your property manager for an invitation
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
