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
import { Supplier, supplierService } from '@/services/supplierService';
import { InventoryItem } from '@/services/inventoryService';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  notes: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface OrderItem {
  inventory_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price?: number;
}

interface PurchaseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  preselectedItem?: InventoryItem | null;
  onSuccess: () => void;
}

export function PurchaseOrderModal({
  open,
  onOpenChange,
  workspaceId,
  preselectedItem,
  onSuccess,
}: PurchaseOrderModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState<number | undefined>();

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      loadSuppliers();
      if (preselectedItem) {
        setOrderItems([
          {
            inventory_item_id: preselectedItem.id,
            item_name: preselectedItem.name,
            quantity: Math.max(1, preselectedItem.min_quantity - preselectedItem.quantity),
            unit_price: preselectedItem.unit_price || undefined,
          },
        ]);
        if (preselectedItem.supplier_id) {
          form.setValue('supplier_id', preselectedItem.supplier_id);
        }
      } else {
        setOrderItems([]);
        form.reset();
      }
    }
  }, [open, preselectedItem, form]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers(workspaceId);
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    setOrderItems([
      ...orderItems,
      {
        item_name: newItemName,
        quantity: newItemQty,
        unit_price: newItemPrice,
      },
    ]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(undefined);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, qty);
    setOrderItems(updated);
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);
    try {
      await purchaseOrderService.createReorderPurchaseOrder(
        workspaceId,
        data.supplier_id,
        orderItems.map((item) => ({
          inventory_item_id: item.inventory_item_id || '',
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        user?.id
      );
      toast.success('Purchase order created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + (item.unit_price || 0) * item.quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a new purchase order to restock inventory items.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            {/* Order Items */}
            <div className="space-y-3">
              <FormLabel>Order Items</FormLabel>
              {orderItems.length > 0 && (
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.item_name}</p>
                        {item.unit_price && (
                          <p className="text-xs text-muted-foreground">
                            ${item.unit_price.toFixed(2)} each
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new item */}
              <div className="flex items-end gap-2 p-3 border border-dashed rounded-lg">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Item Name</label>
                  <Input
                    placeholder="New item"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-muted-foreground">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted-foreground">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemPrice || ''}
                    onChange={(e) =>
                      setNewItemPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addItem}>
                  Add
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {totalAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-t">
                <span className="font-medium">Estimated Total:</span>
                <span className="text-lg font-semibold">${totalAmount.toFixed(2)}</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
