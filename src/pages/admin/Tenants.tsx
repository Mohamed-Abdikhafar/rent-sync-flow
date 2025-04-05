
import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { mockUsers, mockProperties, mockUnits } from '@/lib/mockData';
import { User, Property, Unit } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Plus, Search, User as UserIcon, Trash2 } from 'lucide-react';
import CreateTenantForm, { TenantFormData } from '@/components/forms/CreateTenantForm';
import { generateInvitationCode, generateTemporaryPassword } from '@/lib/utils/tenantUtils';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Tenants = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // In a real app, we would fetch tenants, properties, and units from Supabase
  const tenants = mockUsers.filter(user => user.role === 'tenant');
  const properties = mockProperties;
  
  // Get all units or filter by selected property
  const availableUnits = mockUnits.filter(unit => 
    unit.status === 'vacant' && 
    (selectedProperty === 'all' || unit.propertyId === selectedProperty)
  );
  
  const handleCreateTenant = async (data: TenantFormData) => {
    setIsSubmitting(true);
    
    try {
      const invitationCode = generateInvitationCode();
      const temporaryPassword = generateTemporaryPassword();
      
      // Get the unit to be assigned
      const unit = mockUnits.find(u => u.id === data.unitId);
      
      if (!unit) {
        throw new Error('Selected unit not found');
      }
      
      // In a real app, we would create the tenant in Supabase and send an invitation email
      // For now, we'll simulate the API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success message including the generated credentials (in a real app, this would be sent via email)
      toast.success(
        <div>
          <p>Tenant created successfully!</p>
          <p className="text-xs mt-1">Invitation email sent to {data.email}</p>
        </div>
      );
      
      console.log('Created tenant with:', {
        ...data,
        invitationCode,
        temporaryPassword
      });
      
      // Close the dialog
      setIsCreateTenantOpen(false);
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Failed to create tenant');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveTenant = async () => {
    if (!selectedTenantId) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we would:
      // 1. Update the tenant's isActive status to false
      // 2. Update the unit's status to vacant and remove the tenantId
      // 3. Send a notification to the tenant
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Tenant removed successfully');
      setIsRemoveDialogOpen(false);
      setSelectedTenantId(null);
    } catch (error) {
      console.error('Error removing tenant:', error);
      toast.error('Failed to remove tenant');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getUnitInfo = (tenantId: string): string => {
    const unit = mockUnits.find(u => u.tenantId === tenantId);
    if (!unit) return 'No unit assigned';
    
    const property = mockProperties.find(p => p.id === unit.propertyId);
    return `${property?.name} - Unit ${unit.unitNumber}`;
  };
  
  const handleViewTenant = (tenantId: string) => {
    // In a real app, this would navigate to the tenant details page
    toast.info(`Viewing tenant ${tenantId}`);
  };
  
  const openRemoveDialog = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsRemoveDialogOpen(true);
  };

  // Filter tenants based on search query
  const filteredTenants = tenants.filter(tenant => {
    const fullName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.toLowerCase();
    const email = tenant.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <AdminLayout title="Tenants">
      <div className="space-y-6">
        {/* Header with Search and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Tenants</h1>
            <p className="text-gray-500">
              Manage your tenants and their unit assignments
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search tenants..." 
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setIsCreateTenantOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Tenant
            </Button>
          </div>
        </div>
        
        {/* Tenants Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>All Tenants</CardTitle>
              
              <Select 
                value={selectedProperty} 
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map(tenant => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.firstName} {tenant.lastName}
                    </TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.phoneNumber}</TableCell>
                    <TableCell>{getUnitInfo(tenant.id)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {tenant.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTenant(tenant.id)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => openRemoveDialog(tenant.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserIcon className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 mb-2">No tenants found</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsCreateTenantOpen(true)}
                        >
                          Create Tenant
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Tenant Form */}
      <CreateTenantForm 
        availableUnits={availableUnits}
        onSubmit={handleCreateTenant}
        isOpen={isCreateTenantOpen}
        onClose={() => setIsCreateTenantOpen(false)}
      />
      
      {/* Remove Tenant Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this tenant? This will deactivate their account 
              and mark their unit as vacant.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The tenant will receive an email notification
              and will no longer be able to log in.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveTenant}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Removing...' : 'Remove Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Tenants;
