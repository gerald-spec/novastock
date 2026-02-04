import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { workspaceService, Workspace, WorkspaceMember, WorkspaceRole } from '@/services/workspaceService';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentUserRole: WorkspaceRole | null;
  members: WorkspaceMember[];
  loading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createWorkspace: (name: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = 'novastock_current_workspace';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { workspaces: fetchedWorkspaces } = await workspaceService.getUserWorkspaces();
    
    if (fetchedWorkspaces && fetchedWorkspaces.length > 0) {
      setWorkspaces(fetchedWorkspaces);

      // Try to restore last selected workspace
      const savedWorkspaceId = localStorage.getItem(STORAGE_KEY);
      const savedWorkspace = fetchedWorkspaces.find((w) => w.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        setCurrentWorkspaceState(savedWorkspace);
      } else {
        setCurrentWorkspaceState(fetchedWorkspaces[0]);
      }
    } else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
    }
    
    setLoading(false);
  }, [user]);

  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace) {
      setMembers([]);
      return;
    }

    const { members: fetchedMembers } = await workspaceService.getWorkspaceMembers(currentWorkspace.id);
    setMembers(fetchedMembers || []);
  }, [currentWorkspace]);

  const fetchUserRole = useCallback(async () => {
    if (!currentWorkspace || !user) {
      setCurrentUserRole(null);
      return;
    }

    const { role } = await workspaceService.getUserRole(currentWorkspace.id, user.id);
    setCurrentUserRole(role);
  }, [currentWorkspace, user]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      refreshMembers();
      fetchUserRole();
      localStorage.setItem(STORAGE_KEY, currentWorkspace.id);
    }
  }, [currentWorkspace, refreshMembers, fetchUserRole]);

  const setCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
  };

  const createWorkspace = async (name: string) => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const { workspace, error } = await workspaceService.createWorkspace(name, user.id);
    
    if (error) {
      return { error: error as Error };
    }

    if (workspace) {
      await refreshWorkspaces();
      setCurrentWorkspaceState(workspace);
    }

    return { error: null };
  };

  const isAdmin = currentUserRole === 'admin';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentUserRole,
        members,
        loading,
        setCurrentWorkspace,
        refreshWorkspaces,
        refreshMembers,
        createWorkspace,
        isAdmin,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
