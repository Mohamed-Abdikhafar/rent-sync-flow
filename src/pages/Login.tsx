
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AuthLayout from '@/components/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants';
import { AlertCircle, Key, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type UserType = 'admin' | 'tenant';

const Login = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const codeParam = searchParams.get('code');
  
  const [userType, setUserType] = useState<UserType>('admin');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState(codeParam || '');
  const [showInvitationField, setShowInvitationField] = useState(!!codeParam);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Clear any errors when form fields change
  useEffect(() => {
    if (loginError) setLoginError(null);
  }, [email, password, userType, invitationCode]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else if (user.role === 'tenant') {
        navigate(ROUTES.TENANT.DASHBOARD);
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoginError(null);
    
    if (!email || !password) {
      setLoginError('Please enter your email and password');
      return;
    }
    
    // For tenant first login, we require the invitation code
    if (userType === 'tenant' && showInvitationField && !invitationCode) {
      setLoginError('Please enter your invitation code');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Attempting login: ${userType} - ${email}`);
      
      await login(
        email, 
        password, 
        userType === 'tenant' && showInvitationField ? invitationCode : undefined
      );
      
      console.log('Login function completed successfully');
      // Navigation is handled in the useEffect above when user state updates
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if the error indicates a tenant requiring an invitation code
      if ((error as Error).message?.includes('invitation code')) {
        setShowInvitationField(true);
        setLoginError('This account requires an invitation code for first login');
      } else {
        // Set the error message
        setLoginError((error as Error).message || 'Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userType">I am a</Label>
          <Select 
            defaultValue={userType} 
            onValueChange={(value) => {
              setUserType(value as UserType);
              // Reset invitation field when switching user types
              setShowInvitationField(userType === 'tenant' && !!codeParam);
              setLoginError(null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Property Manager</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {(showInvitationField && userType === 'tenant') && (
          <div className="space-y-2">
            <Label htmlFor="invitationCode">Invitation Code</Label>
            <Input
              id="invitationCode"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Enter your invitation code"
              required
            />
            <p className="text-xs text-gray-500">
              New tenants must enter the invitation code sent to their email
            </p>
          </div>
        )}
        
        <div className="flex items-center">
          <Checkbox id="remember" />
          <label
            htmlFor="remember"
            className="text-sm font-medium ml-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
        </div>
        
        {loginError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      
      {userType === 'admin' ? (
        <div className="mt-6 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-rentalsync-primary hover:underline font-medium">
            Register as a property manager
          </Link>
        </div>
      ) : (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tenants don't register directly. You should receive an invitation from your property manager with a code to log in.
          </AlertDescription>
        </Alert>
      )}
    </AuthLayout>
  );
};

export default Login;
