
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/types';

// Interface for creating a new property
export interface CreatePropertyData {
  name: string;
  address: string;
}

// Interface for creating a new unit/room
export interface CreateUnitData {
  unitNumber: string;
  rentAmount: number;
}

// Create a new property
export const createProperty = async (
  data: CreatePropertyData, 
  adminId: string
): Promise<Property> => {
  // Insert the property into the properties table
  const { data: insertedProperty, error } = await supabase
    .from('properties')
    .insert({
      name: data.name,
      address: data.address,
      admin_id: adminId,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  if (!insertedProperty) {
    throw new Error('Failed to create property');
  }
  
  // Map the snake_case fields from DB to camelCase for our frontend
  return {
    id: insertedProperty.id,
    adminId: insertedProperty.admin_id,
    name: insertedProperty.name,
    address: insertedProperty.address,
    createdAt: insertedProperty.created_at,
  };
};

// Add units/rooms to a property
export const addUnitsToProperty = async (
  propertyId: string, 
  units: CreateUnitData[]
): Promise<void> => {
  // Format the units for insertion
  const formattedUnits = units.map(unit => ({
    property_id: propertyId,
    unit_number: unit.unitNumber,
    rent_amount: unit.rentAmount,
    status: 'vacant',
    created_at: new Date().toISOString(),
  }));
  
  // Insert the units into the units table
  const { error } = await supabase
    .from('units')
    .insert(formattedUnits);
  
  if (error) {
    throw error;
  }
};

// Get all properties for an admin
export const getPropertiesByAdmin = async (adminId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('admin_id', adminId);
  
  if (error) {
    throw error;
  }
  
  // Map the snake_case fields from DB to camelCase for our frontend
  return data.map(property => ({
    id: property.id,
    adminId: property.admin_id,
    name: property.name,
    address: property.address,
    createdAt: property.created_at,
  }));
};

// Get a single property by ID
export const getPropertyById = async (propertyId: string): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();
  
  if (error) {
    throw error;
  }
  
  // Map the snake_case fields from DB to camelCase for our frontend
  return {
    id: data.id,
    adminId: data.admin_id,
    name: data.name,
    address: data.address,
    createdAt: data.created_at,
  };
};
