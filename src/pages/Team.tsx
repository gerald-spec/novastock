import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Mail, Shield, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { workspaceService, WorkspaceRole } from '@/services/workspaceService';
import { useToast } from '@/hooks/use-toast';

export default function Team() {
  const { members, currentWorkspace, isAdmin, refreshMembers } = useWorkspace();
  const { toast } = useToast();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    if (!currentWorkspace) return;

    const { error } = await workspaceService.updateMemberRole(currentWorkspace.id, userId, newRole);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Role updated',
      description: 'Member role has been updated successfully',
    });
    
    refreshMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace) return;

    const { error } = await workspaceService.removeMember(currentWorkspace.id, userId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Member removed',
      description: 'Member has been removed from the workspace',
    });
    
    refreshMembers();
  };

  const filteredMembers = members.filter((member) => {
    const name = member.profile?.full_name || '';
    const email = member.profile?.email || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and permissions
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setIsInviteModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Team Members */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'member' : 'members'} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No members found matching your search' : 'No team members yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(member.profile?.full_name || member.profile?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.profile?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={member.role === 'admin' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {member.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {member.role === 'member' && <User className="w-3 h-3 mr-1" />}
                      {member.role}
                    </Badge>
                    
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.user_id, member.role === 'admin' ? 'member' : 'admin')}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove from Workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </div>
  );
}
