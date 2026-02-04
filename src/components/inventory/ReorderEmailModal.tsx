import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem } from '@/services/inventoryService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReorderEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

export function ReorderEmailModal({ open, onOpenChange, item }: ReorderEmailModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [reorderQuantity, setReorderQuantity] = useState(10);
  const [companyName, setCompanyName] = useState('');
  const [senderName, setSenderName] = useState('');

  const handleGenerate = async () => {
    if (!item) return;

    setIsGenerating(true);
    setEmailContent('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-reorder-email', {
        body: {
          itemName: item.name,
          currentQuantity: item.quantity,
          reorderQuantity,
          supplierName: item.supplier?.company_name || 'Unknown Supplier',
          sku: item.sku,
          unitPrice: item.unit_price,
          companyName: companyName || 'Our Company',
          senderName: senderName || 'Procurement Team',
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to generate email. Please try again.');
        return;
      }

      setEmailContent(data.email);
      toast.success('Email generated successfully!');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent);
      setCopied(true);
      toast.success('Email copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy email');
    }
  };

  const handleClose = () => {
    setEmailContent('');
    setCopied(false);
    setReorderQuantity(10);
    onOpenChange(false);
  };

  const suggestedQty = item ? Math.max(1, item.min_quantity * 2 - item.quantity) : 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Reorder Email Generator
          </DialogTitle>
          <DialogDescription>
            Generate a professional reorder email for {item?.name || 'this item'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          {item && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.sku && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span>{item.sku}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock:</span>
                <span className={item.quantity <= item.min_quantity ? 'text-destructive font-medium' : ''}>
                  {item.quantity} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span>{item.supplier?.company_name || 'Not assigned'}</span>
              </div>
              {item.unit_price && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit Price:</span>
                  <span>${item.unit_price.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reorderQty">Quantity to Order</Label>
              <Input
                id="reorderQty"
                type="number"
                min={1}
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(parseInt(e.target.value) || 1)}
                placeholder={`Suggested: ${suggestedQty}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Your Company</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderName">Your Name / Team</Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Procurement Team"
            />
          </div>

          {/* Generate Button */}
          {!emailContent && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !item?.supplier}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Reorder Email
                </>
              )}
            </Button>
          )}

          {!item?.supplier && (
            <p className="text-sm text-muted-foreground text-center">
              Assign a supplier to this item to generate a reorder email.
            </p>
          )}

          {/* Generated Email */}
          {emailContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generated Email</Label>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Regenerate
                </Button>
                {item?.supplier && (
                  <Button
                    asChild
                    className="flex-1 gap-2"
                  >
                    <a
                      href={`mailto:${item.supplier.company_name}?subject=${encodeURIComponent(emailContent.match(/Subject: (.+)/)?.[1] || 'Reorder Request')}&body=${encodeURIComponent(emailContent.replace(/Subject: .+\n\n/, ''))}`}
                    >
                      <Mail className="h-4 w-4" />
                      Open in Email Client
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
