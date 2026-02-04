import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, AlertTriangle, Layers, ArrowRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { inventoryService, InventoryItem } from '@/services/inventoryService';
import { supplierService, Supplier } from '@/services/supplierService';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  supplierCount: number;
  totalValue: number;
  categories: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadDashboardData();
    }
  }, [currentWorkspace]);

  const loadDashboardData = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const [items, suppliers] = await Promise.all([
        inventoryService.getInventoryItems(currentWorkspace.id),
        supplierService.getSuppliers(currentWorkspace.id),
      ]);

      const lowStock = items.filter((item) => item.quantity <= item.min_quantity);
      const totalValue = items.reduce(
        (sum, item) => sum + (item.unit_price || 0) * item.quantity,
        0
      );

      // Get unique supplier IDs as categories approximation
      const uniqueSuppliers = new Set(items.map((item) => item.supplier_id).filter(Boolean));

      setStats({
        totalItems: items.length,
        lowStockCount: lowStock.length,
        supplierCount: suppliers.length,
        totalValue,
        categories: uniqueSuppliers.size,
      });

      setLowStockItems(lowStock.slice(0, 5));
      setRecentItems(
        [...items].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalItems ?? 0,
      icon: Package,
      description: 'Items in inventory',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      description: 'Items need reorder',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      urgent: (stats?.lowStockCount ?? 0) > 0,
    },
    {
      title: 'Suppliers',
      value: stats?.supplierCount ?? 0,
      icon: Building2,
      description: 'Active suppliers',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Inventory Value',
      value: `$${(stats?.totalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      description: 'Total stock value',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your inventory performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`border-border hover:shadow-md transition-shadow ${
                stat.urgent ? 'ring-2 ring-destructive/20' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  {stat.urgent && (
                    <Badge variant="destructive" className="text-xs">
                      Action needed
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Items that need restocking</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">All stocked up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No items are below minimum quantity
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => {
                  const stockPercentage = Math.max(
                    0,
                    Math.min(100, (item.quantity / item.min_quantity) * 100)
                  );
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.supplier?.company_name || 'No supplier'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <span className="text-sm font-medium text-destructive">
                            {item.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            / {item.min_quantity}
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={stockPercentage}
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Items */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Recent Products
              </CardTitle>
              <CardDescription>Latest additions to inventory</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No products yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first product to get started
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/inventory')}
                >
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku || 'No SKU'} • {item.quantity} in stock
                      </p>
                    </div>
                    {item.unit_price && (
                      <Badge variant="secondary" className="ml-2">
                        ${item.unit_price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate('/inventory')}
            >
              <Package className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Add Product</p>
                <p className="text-xs text-muted-foreground">Create new inventory item</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate('/suppliers')}
            >
              <Building2 className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Add Supplier</p>
                <p className="text-xs text-muted-foreground">Register new supplier</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate('/inventory')}
            >
              <AlertTriangle className="mr-3 h-5 w-5 text-destructive" />
              <div className="text-left">
                <p className="font-medium">Low Stock</p>
                <p className="text-xs text-muted-foreground">View items needing reorder</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate('/team')}
            >
              <Layers className="mr-3 h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Team</p>
                <p className="text-xs text-muted-foreground">Manage workspace members</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
