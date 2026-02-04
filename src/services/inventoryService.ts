import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  workspace_id: string;
  supplier_id: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  min_quantity: number;
  unit_price: number | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    company_name: string;
  } | null;
}

export interface CreateInventoryItemData {
  workspace_id: string;
  name: string;
  supplier_id?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  min_quantity?: number;
  unit_price?: number;
}

export interface UpdateInventoryItemData {
  name?: string;
  supplier_id?: string | null;
  sku?: string;
  description?: string;
  quantity?: number;
  min_quantity?: number;
  unit_price?: number;
}

export const inventoryService = {
  async getInventoryItems(workspaceId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        supplier:suppliers(id, company_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  async getInventoryItem(itemId: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        supplier:suppliers(id, company_name)
      `)
      .eq("id", itemId)
      .single();

    if (error) throw error;
    return data;
  },

  async createInventoryItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert(itemData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInventoryItem(itemId: string, updates: UpdateInventoryItemData): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteInventoryItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
  },

  async getLowStockItems(workspaceId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        supplier:suppliers(id, company_name)
      `)
      .eq("workspace_id", workspaceId)
      .filter("quantity", "lte", supabase.rpc as unknown as number) // Compare quantity <= min_quantity
      .order("name");

    // Fallback: filter client-side since we can't easily compare columns
    if (error) throw error;
    return (data || []).filter(item => item.quantity <= item.min_quantity);
  },
};
