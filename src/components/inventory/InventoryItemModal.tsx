import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryItem, inventoryService } from '@/services/inventoryService';
import { Supplier, supplierService } from '@/services/supplierService';
import { toast } from 'sonner';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or more'),
  min_quantity: z.coerce.number().min(0, 'Minimum quantity must be 0 or more'),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or more').optional(),
  supplier_id: z.string().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

interface InventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  item?: InventoryItem | null;
  onSuccess: () => void;
}

export function InventoryItemModal({
  open,
  onOpenChange,
  workspaceId,
  item,
  onSuccess,
}: InventoryItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const isEditing = !!item;

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      min_quantity: 0,
      unit_price: undefined,
      supplier_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku || '',
        description: item.description || '',
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        unit_price: item.unit_price || undefined,
        supplier_id: item.supplier_id || '',
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        description: '',
        quantity: 0,
        min_quantity: 0,
        unit_price: undefined,
        supplier_id: '',
      });
    }
  }, [item, form]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers(workspaceId);
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const onSubmit = async (data: InventoryItemFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && item) {
        await inventoryService.updateInventoryItem(item.id, {
          name: data.name,
          sku: data.sku || undefined,
          description: data.description || undefined,
          quantity: data.quantity,
          min_quantity: data.min_quantity,
          unit_price: data.unit_price,
          supplier_id: data.supplier_id || null,
        });
        toast.success('Item updated successfully');
      } else {
        await inventoryService.createInventoryItem({
          workspace_id: workspaceId,
          name: data.name,
          sku: data.sku || undefined,
          description: data.description || undefined,
          quantity: data.quantity,
          min_quantity: data.min_quantity,
          unit_price: data.unit_price,
          supplier_id: data.supplier_id || undefined,
        });
        toast.success('Item created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the product information below.'
              : 'Enter the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Widget Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="WGT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No supplier</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
