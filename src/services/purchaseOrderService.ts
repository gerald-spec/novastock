import { supabase } from "@/integrations/supabase/client";

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  workspace_id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  notes: string | null;
  order_date: string | null;
  expected_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    company_name: string;
  } | null;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderData {
  workspace_id: string;
  supplier_id: string;
  status?: PurchaseOrderStatus;
  notes?: string;
  order_date?: string;
  expected_date?: string;
  created_by?: string;
}

export interface CreatePurchaseOrderItemData {
  purchase_order_id: string;
  inventory_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price?: number;
}

export const purchaseOrderService = {
  async getPurchaseOrders(workspaceId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(id, company_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPurchaseOrder(orderId: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(id, company_name),
        items:purchase_order_items(*)
      `)
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return data;
  },

  async createPurchaseOrder(orderData: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePurchaseOrder(orderId: string, updates: Partial<CreatePurchaseOrderData>): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePurchaseOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", orderId);

    if (error) throw error;
  },

  async addPurchaseOrderItem(itemData: CreatePurchaseOrderItemData): Promise<PurchaseOrderItem> {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .insert(itemData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removePurchaseOrderItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from("purchase_order_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
  },

  async createReorderPurchaseOrder(
    workspaceId: string,
    supplierId: string,
    items: { inventory_item_id: string; item_name: string; quantity: number; unit_price?: number }[],
    userId?: string
  ): Promise<PurchaseOrder> {
    // Create the purchase order
    const order = await purchaseOrderService.createPurchaseOrder({
      workspace_id: workspaceId,
      supplier_id: supplierId,
      status: 'draft',
      created_by: userId,
    });

    // Add items to the order
    for (const item of items) {
      await purchaseOrderService.addPurchaseOrderItem({
        purchase_order_id: order.id,
        inventory_item_id: item.inventory_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
    }

    return order;
  },
};
