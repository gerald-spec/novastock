import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SupplierModal } from '@/components/suppliers/SupplierModal';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { Supplier, supplierService } from '@/services/supplierService';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { toast } from 'sonner';

export default function Suppliers() {
  const { currentWorkspace, currentUserRole } = useWorkspace();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (currentWorkspace) {
      loadSuppliers();
    }
  }, [currentWorkspace]);

  const loadSuppliers = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const data = await supplierService.getSuppliers(currentWorkspace.id);
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await supplierService.deleteSupplier(deletingSupplier.id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier. It may have linked inventory items or purchase orders.');
    } finally {
      setDeletingSupplier(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your supplier relationships
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              {suppliers.length === 0 ? 'No Suppliers Yet' : 'No Results'}
            </CardTitle>
            <CardDescription>
              {suppliers.length === 0
                ? 'Get started by adding your first supplier.'
                : 'Try adjusting your search query.'}
            </CardDescription>
          </CardHeader>
          {suppliers.length === 0 && isAdmin && (
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Supplier
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={setDeletingSupplier}
            />
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      {currentWorkspace && (
        <SupplierModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          workspaceId={currentWorkspace.id}
          supplier={editingSupplier}
          onSuccess={loadSuppliers}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSupplier?.company_name}"? This action
              cannot be undone. Any linked inventory items will have their supplier removed.
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
