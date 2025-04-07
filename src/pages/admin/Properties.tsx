
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PropertyCard from '@/components/cards/PropertyCard';
import { Building, Plus, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Property } from '@/lib/types';
import { createProperty, getPropertiesByAdmin } from '@/services/propertyService';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AddUnitsForm from '@/components/forms/AddUnitsForm';

const Properties = () => {
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isAddUnitsModalOpen, setIsAddUnitsModalOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyAddress, setNewPropertyAddress] = useState('');
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get properties query
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      return getPropertiesByAdmin(user.id);
    },
    enabled: !!user?.id
  });
  
  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User ID not available');
      return createProperty({
        name: newPropertyName,
        address: newPropertyAddress,
      }, user.id);
    },
    onSuccess: (newProperty) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Property "${newPropertyName}" added successfully`);
      setNewPropertyId(newProperty.id);
      setIsAddPropertyModalOpen(false);
      setIsAddUnitsModalOpen(true);
      
      // Reset property form
      setNewPropertyName('');
      setNewPropertyAddress('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add property: ${error.message}`);
    }
  });
  
  const handleAddProperty = async () => {
    if (!newPropertyName || !newPropertyAddress) {
      toast.error('Please fill in all fields');
      return;
    }
    
    createPropertyMutation.mutate();
  };
  
  const handleAddUnitsSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['availableUnits'] });
  };
  
  // Filter properties based on search query
  const filteredProperties = propertiesQuery.data ? propertiesQuery.data.filter(property => {
    const name = property.name.toLowerCase();
    const address = property.address.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || address.includes(query);
  }) : [];

  return (
    <AdminLayout title="Properties">
      <div className="space-y-6">
        {/* Header with Search and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Properties</h1>
            <p className="text-gray-500">
              Manage your rental properties
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search properties..." 
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setIsAddPropertyModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Property
            </Button>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {propertiesQuery.isLoading && (
          <div className="text-center py-12">
            <p>Loading properties...</p>
          </div>
        )}
        
        {propertiesQuery.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load properties: {(propertiesQuery.error as Error).message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Properties Grid */}
        {!propertiesQuery.isLoading && !propertiesQuery.error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.length > 0 ? filteredProperties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                unitCount={0} // This will be updated later
                tenantCount={0} // This will be updated later
                onViewDetails={() => toast.info(`Viewing details for ${property.name}`)}
              />
            )) : (
              <div className="col-span-full text-center py-12">
                <Building className="mx-auto mb-3 text-gray-400" size={36} />
                <p className="text-gray-500 mb-4">No properties added yet</p>
                <Button onClick={() => setIsAddPropertyModalOpen(true)}>
                  Add Your First Property
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Property Modal */}
      <Dialog open={isAddPropertyModalOpen} onOpenChange={setIsAddPropertyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Enter the details of the new property
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property-name">Property Name</Label>
              <Input
                id="property-name"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder="E.g., Sunset Apartments"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="property-address">Address</Label>
              <Input
                id="property-address"
                value={newPropertyAddress}
                onChange={(e) => setNewPropertyAddress(e.target.value)}
                placeholder="E.g., 123 Main St, Nairobi"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddPropertyModalOpen(false)}
              disabled={createPropertyMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProperty} 
              disabled={createPropertyMutation.isPending}
            >
              {createPropertyMutation.isPending ? 'Adding...' : 'Add Property'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Units Form */}
      <AddUnitsForm
        propertyId={newPropertyId}
        isOpen={isAddUnitsModalOpen}
        onClose={() => setIsAddUnitsModalOpen(false)}
        onSuccess={handleAddUnitsSuccess}
      />
    </AdminLayout>
  );
};

export default Properties;
