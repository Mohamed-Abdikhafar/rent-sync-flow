
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { addUnitsToProperty } from '@/services/propertyService';
import { CreateUnitData } from '@/services/propertyService';

interface AddUnitsFormProps {
  propertyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUnitsForm: React.FC<AddUnitsFormProps> = ({
  propertyId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<Array<{ unitNumber: string; rentAmount: string }>>([
    { unitNumber: '', rentAmount: '' }
  ]);

  const addUnitRow = () => {
    setUnits([...units, { unitNumber: '', rentAmount: '' }]);
  };

  const removeUnitRow = (index: number) => {
    if (units.length === 1) {
      toast.error('You must have at least one unit');
      return;
    }
    
    const newUnits = [...units];
    newUnits.splice(index, 1);
    setUnits(newUnits);
  };

  const updateUnitField = (index: number, field: 'unitNumber' | 'rentAmount', value: string) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleSubmit = async () => {
    if (!propertyId) {
      toast.error('Property ID is missing');
      return;
    }

    // Validate all fields are filled
    const hasEmptyFields = units.some(unit => !unit.unitNumber || !unit.rentAmount);
    if (hasEmptyFields) {
      toast.error('Please fill in all fields for each unit');
      return;
    }
    
    // Validate rent amounts are numbers
    const hasInvalidAmounts = units.some(unit => isNaN(parseFloat(unit.rentAmount)));
    if (hasInvalidAmounts) {
      toast.error('Rent amounts must be valid numbers');
      return;
    }
    
    // Check for duplicate unit numbers
    const unitNumbers = units.map(unit => unit.unitNumber);
    if (new Set(unitNumbers).size !== unitNumbers.length) {
      toast.error('Unit numbers must be unique');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format units for the API
      const formattedUnits: CreateUnitData[] = units.map(unit => ({
        unitNumber: unit.unitNumber,
        rentAmount: parseFloat(unit.rentAmount)
      }));
      
      await addUnitsToProperty(propertyId, formattedUnits);
      toast.success('Units added successfully');
      setUnits([{ unitNumber: '', rentAmount: '' }]);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Failed to add units: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Units to Property</DialogTitle>
          <DialogDescription>
            Define the units or rooms for your property. Each unit should have a unique number.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center font-medium">
            <div>Unit Number</div>
            <div>Rent Amount (KES)</div>
            <div></div>
          </div>
          
          {units.map((unit, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
              <div>
                <Input
                  value={unit.unitNumber}
                  onChange={(e) => updateUnitField(index, 'unitNumber', e.target.value)}
                  placeholder="e.g., A1, 101"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={unit.rentAmount}
                  onChange={(e) => updateUnitField(index, 'rentAmount', e.target.value)}
                  placeholder="e.g., 15000"
                />
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUnitRow(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addUnitRow}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Another Unit
          </Button>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Units'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUnitsForm;
