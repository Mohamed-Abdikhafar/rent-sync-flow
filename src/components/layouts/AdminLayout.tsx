
import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  Building,
  Users,
  CreditCard,
  Wrench,
  DoorOpen,
  FileText,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Separator } from "../ui/separator";
import Logo from "../Logo";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { useMobile } from "@/hooks/use-mobile";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = "Dashboard"
}) => {
  const { isMobile, isMenuOpen, toggleMenu } = useMobile();
  const { user, profile, logout, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  
  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (!loading && (!user || !profile || profile.role !== 'admin')) {
      toast.error('You must be logged in as an admin to access this page');
      navigate('/login');
    }
  }, [user, profile, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rentalsync-primary"></div>
      </div>
    );
  }

  // Sidebar navigation items
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD },
    { icon: Building, label: "Properties", href: ROUTES.ADMIN.PROPERTIES },
    { icon: Users, label: "Tenants", href: ROUTES.ADMIN.TENANTS },
    { icon: CreditCard, label: "Payments", href: ROUTES.ADMIN.PAYMENTS },
    { icon: Wrench, label: "Maintenance", href: ROUTES.ADMIN.MAINTENANCE },
    { icon: DoorOpen, label: "Move-Out", href: ROUTES.ADMIN.MOVE_OUT },
    { icon: FileText, label: "Documents", href: ROUTES.ADMIN.DOCUMENTS },
    { icon: MessageSquare, label: "Messages", href: ROUTES.ADMIN.MESSAGES },
    { icon: BarChart, label: "Analytics", href: ROUTES.ADMIN.ANALYTICS },
  ];
  
  // Prevent rendering the layout if not authenticated
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 bg-white shadow-xl' : 'relative'}
          ${isMobile && !isMenuOpen ? '-translate-x-full' : 'translate-x-0'}
          transition-transform duration-300 ease-in-out
          w-64 border-r border-gray-200 flex flex-col
        `}
      >
        {/* Logo area */}
        <div className="p-4 flex items-center justify-between">
          <Logo />
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Separator />
        
        {/* Navigation area */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-gray-100"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-500" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <Separator />
        
        {/* User profile */}
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-rentalsync-primary text-white flex items-center justify-center">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.firstName} {profile.lastName}</p>
              <p className="text-xs text-gray-600">Property Manager</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4">
          <div className="flex justify-between items-center w-full">
            {/* Mobile menu button and page title */}
            <div className="flex items-center space-x-3">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={toggleMenu}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-gray-900"
                onClick={() => navigate("/admin/settings")}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      
      {/* Overlay for mobile when menu is open */}
      {isMobile && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={toggleMenu}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
