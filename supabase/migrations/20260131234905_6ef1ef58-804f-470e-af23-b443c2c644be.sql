-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Members can view workspace suppliers"
  ON public.suppliers FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can create suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can update suppliers"
  ON public.suppliers FOR UPDATE
  USING (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete suppliers"
  ON public.suppliers FOR DELETE
  USING (is_workspace_admin(workspace_id, auth.uid()));

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_items
CREATE POLICY "Members can view workspace inventory"
  ON public.inventory_items FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can create inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can update inventory items"
  ON public.inventory_items FOR UPDATE
  USING (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete inventory items"
  ON public.inventory_items FOR DELETE
  USING (is_workspace_admin(workspace_id, auth.uid()));

-- Create purchase_orders table
CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled');

CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  expected_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_orders
CREATE POLICY "Members can view workspace purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Admins can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Admins can delete purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (is_workspace_admin(workspace_id, auth.uid()));

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_order_items
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_order_items (inherit from purchase_orders)
CREATE POLICY "Members can view purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND is_workspace_member(po.workspace_id, auth.uid())
  ));

CREATE POLICY "Admins can create purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND is_workspace_admin(po.workspace_id, auth.uid())
  ));

CREATE POLICY "Admins can update purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND is_workspace_admin(po.workspace_id, auth.uid())
  ));

CREATE POLICY "Admins can delete purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
    AND is_workspace_admin(po.workspace_id, auth.uid())
  ));

-- Create triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();