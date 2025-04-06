
import React, { useState, useEffect } from 'react';
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
import { User, Property, Unit } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Plus, Search, User as UserIcon, Trash2 } from 'lucide-react';
import CreateTenantForm, { TenantFormData } from '@/components/forms/CreateTenantForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { createTenant, removeTenant, getTenantsByProperty, getAvailableUnits } from '@/services/tenantService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Tenants = () => {
  const { user } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();
  
  // Properties query - in a real app with multiple properties per admin
  // We'd fetch these from Supabase
  const properties = user?.propertyId ? [{ id: user.propertyId, name: 'Your Property' }] : [];
  
  useEffect(() => {
    // Set default property if there's only one
    if (properties.length === 1 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, selectedProperty]);
  
  // Fetch units query
  const unitsQuery = useQuery({
    queryKey: ['availableUnits', selectedProperty],
    queryFn: () => selectedProperty ? getAvailableUnits(selectedProperty) : Promise.resolve([]),
    enabled: !!selectedProperty
  });
  
  // Fetch tenants query
  const tenantsQuery = useQuery({
    queryKey: ['tenants', selectedProperty],
    queryFn: () => selectedProperty ? getTenantsByProperty(selectedProperty) : Promise.resolve([]),
    enabled: !!selectedProperty
  });
  
  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: (data: TenantFormData) => {
      if (!user?.id) throw new Error('Admin ID not available');
      return createTenant(data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['availableUnits'] });
      setIsCreateTenantOpen(false);
      toast.success('Tenant created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tenant: ${error.message}`);
    }
  });
  
  // Remove tenant mutation
  const removeTenantMutation = useMutation({
    mutationFn: (tenantId: string) => removeTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['availableUnits'] });
      setIsRemoveDialogOpen(false);
      setSelectedTenantId(null);
      toast.success('Tenant removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove tenant: ${error.message}`);
    }
  });
  
  const handleCreateTenant = async (data: TenantFormData) => {
    createTenantMutation.mutate(data);
  };
  
  const handleRemoveTenant = async () => {
    if (!selectedTenantId) return;
    removeTenantMutation.mutate(selectedTenantId);
  };
  
  // Filter tenants based on search query
  const filteredTenants = tenantsQuery.data ? tenantsQuery.data.filter(tenant => {
    const fullName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.toLowerCase();
    const email = tenant.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  }) : [];

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
              disabled={unitsQuery.data?.length === 0}
            >
              <Plus size={16} />
              Create Tenant
            </Button>
          </div>
        </div>
        
        {/* Tenants Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {tenantsQuery.isLoading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading tenants...</p>
              </div>
            ) : tenantsQuery.error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load tenants: {(tenantsQuery.error as Error).message}
                </AlertDescription>
              </Alert>
            ) : (
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
                  {filteredTenants.length > 0 ? filteredTenants.map(tenant => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {tenant.firstName} {tenant.lastName}
                      </TableCell>
                      <TableCell>{tenant.email}</TableCell>
                      <TableCell>{tenant.phoneNumber}</TableCell>
                      <TableCell>
                        {tenant.units ? `Unit ${tenant.units.unitNumber}` : 'No unit assigned'}
                      </TableCell>
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
                            onClick={() => toast.info(`Viewing tenant ${tenant.id}`)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setSelectedTenantId(tenant.id);
                              setIsRemoveDialogOpen(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <UserIcon className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-gray-500 mb-2">No tenants found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsCreateTenantOpen(true)}
                            disabled={unitsQuery.data?.length === 0}
                          >
                            Create Tenant
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Create Tenant Form */}
      <CreateTenantForm 
        availableUnits={unitsQuery.data || []}
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
              disabled={removeTenantMutation.isPending}
            >
              {removeTenantMutation.isPending ? 'Removing...' : 'Remove Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Tenants;
