import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, ShoppingCart, MoreHorizontal, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItemModal } from '@/components/inventory/InventoryItemModal';
import { PurchaseOrderModal } from '@/components/inventory/PurchaseOrderModal';
import { ReorderEmailModal } from '@/components/inventory/ReorderEmailModal';
import { InventoryItem, inventoryService } from '@/services/inventoryService';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

export default function Inventory() {
  const { currentWorkspace, currentUserRole } = useWorkspace();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);
  const [emailItem, setEmailItem] = useState<InventoryItem | null>(null);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (currentWorkspace) {
      loadItems();
    }
  }, [currentWorkspace]);

  const loadItems = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const data = await inventoryService.getInventoryItems(currentWorkspace.id);
      setItems(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleReorder = (item: InventoryItem) => {
    setReorderItem(item);
    setIsPurchaseModalOpen(true);
  };

  const handleGenerateEmail = (item: InventoryItem) => {
    setEmailItem(item);
    setIsEmailModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await inventoryService.deleteInventoryItem(deletingItem.id);
      toast.success('Item deleted successfully');
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeletingItem(null);
    }
  };

  const handleItemModalClose = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handlePurchaseModalClose = () => {
    setIsPurchaseModalOpen(false);
    setReorderItem(null);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = showLowStock ? item.quantity <= item.min_quantity : true;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = items.filter((item) => item.quantity <= item.min_quantity).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and stock levels
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setIsItemModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock
          {lowStockCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {lowStockCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Products Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>A list of all products in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground mb-4">
                {items.length === 0
                  ? 'No products yet. Add your first product to get started.'
                  : 'No products match your filters.'}
              </p>
              {items.length === 0 && isAdmin && (
                <Button onClick={() => setIsItemModalOpen(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.min_quantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.sku || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.supplier?.company_name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                          {item.quantity}
                        </span>
                        <span className="text-muted-foreground text-sm"> / {item.min_quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {isLowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReorder(item)}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Create PO
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateEmail(item)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                AI Reorder Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingItem(item)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Item Modal */}
      {currentWorkspace && (
        <InventoryItemModal
          open={isItemModalOpen}
          onOpenChange={handleItemModalClose}
          workspaceId={currentWorkspace.id}
          item={editingItem}
          onSuccess={loadItems}
        />
      )}

      {/* Purchase Order Modal */}
      {currentWorkspace && (
        <PurchaseOrderModal
          open={isPurchaseModalOpen}
          onOpenChange={handlePurchaseModalClose}
          workspaceId={currentWorkspace.id}
          preselectedItem={reorderItem}
          onSuccess={loadItems}
        />
      )}

      {/* AI Email Modal */}
      <ReorderEmailModal
        open={isEmailModalOpen}
        onOpenChange={(open) => {
          setIsEmailModalOpen(open);
          if (!open) setEmailItem(null);
        }}
        item={emailItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
