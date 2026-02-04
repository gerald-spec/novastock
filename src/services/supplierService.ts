import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  workspace_id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  workspace_id: string;
  company_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export interface UpdateSupplierData {
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

export const supplierService = {
  async getSuppliers(workspaceId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("company_name");

    if (error) throw error;
    return data || [];
  },

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .single();

    if (error) throw error;
    return data;
  },

  async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSupplier(supplierId: string, updates: UpdateSupplierData): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .update(updates)
      .eq("id", supplierId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierId);

    if (error) throw error;
  },
};
