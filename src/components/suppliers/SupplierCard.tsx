import { Building2, Mail, Phone, Globe, MapPin, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Supplier } from '@/services/supplierService';

interface SupplierCardProps {
  supplier: Supplier;
  isAdmin: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SupplierCard({ supplier, isAdmin, onEdit, onDelete }: SupplierCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{supplier.company_name}</h3>
            </div>
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(supplier)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(supplier)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {supplier.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${supplier.email}`} className="hover:text-foreground">
              {supplier.email}
            </a>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <a href={`tel:${supplier.phone}`} className="hover:text-foreground">
              {supplier.phone}
            </a>
          </div>
        )}
        {supplier.website && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground truncate"
            >
              {supplier.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {supplier.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="whitespace-pre-line">{supplier.address}</span>
          </div>
        )}
        {!supplier.email && !supplier.phone && !supplier.website && !supplier.address && (
          <p className="text-muted-foreground italic">No contact information</p>
        )}
      </CardContent>
    </Card>
  );
}
