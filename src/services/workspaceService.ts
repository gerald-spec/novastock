import { supabase } from '@/integrations/supabase/client';

export type WorkspaceRole = 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
}

export const workspaceService = {
  /**
   * Get all workspaces for the current user
   */
  async getUserWorkspaces() {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });

    return { workspaces: data as Workspace[] | null, error };
  },

  /**
   * Get a single workspace by ID
   */
  async getWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    return { workspace: data as Workspace | null, error };
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(name: string, userId: string) {
    // Create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({ name, created_by: userId })
      .select()
      .single();

    if (workspaceError || !workspace) {
      return { workspace: null, error: workspaceError };
    }

    // Add the creator as admin
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'admin' as WorkspaceRole,
      });

    if (memberError) {
      // Rollback workspace creation
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      return { workspace: null, error: memberError };
    }

    return { workspace: workspace as Workspace, error: null };
  },

  /**
   * Update workspace details
   */
  async updateWorkspace(workspaceId: string, updates: { name?: string }) {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    return { workspace: data as Workspace | null, error };
  },

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string) {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    return { error };
  },

  /**
   * Get all members of a workspace with their profiles
   */
  async getWorkspaceMembers(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        joined_at,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    // Transform the data to flatten profiles
    const members = data?.map((member: any) => ({
      ...member,
      profile: member.profiles,
    })) as WorkspaceMember[] | null;

    return { members, error };
  },

  /**
   * Get the current user's role in a workspace
   */
  async getUserRole(workspaceId: string, userId: string) {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    return { role: data?.role as WorkspaceRole | null, error };
  },

  /**
   * Update a member's role
   */
  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const { data, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single();

    return { member: data, error };
  },

  /**
   * Remove a member from workspace
   */
  async removeMember(workspaceId: string, userId: string) {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    return { error };
  },

  /**
   * Create an invitation
   */
  async createInvitation(workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string) {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        invited_by: invitedBy,
      })
      .select()
      .single();

    return { invitation: data as WorkspaceInvitation | null, error };
  },

  /**
   * Get all invitations for a workspace
   */
  async getWorkspaceInvitations(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    return { invitations: data as WorkspaceInvitation[] | null, error };
  },

  /**
   * Delete an invitation
   */
  async deleteInvitation(invitationId: string) {
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invitationId);

    return { error };
  },

  /**
   * Accept an invitation (for invited user)
   */
  async acceptInvitation(invitationId: string, userId: string) {
    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return { error: fetchError || new Error('Invitation not found') };
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: userId,
        role: invitation.role as WorkspaceRole,
      });

    if (memberError) {
      return { error: memberError };
    }

    // Delete the invitation
    await supabase.from('workspace_invitations').delete().eq('id', invitationId);

    return { error: null };
  },
};
