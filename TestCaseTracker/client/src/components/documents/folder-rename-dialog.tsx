import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DocumentFolder } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface FolderRenameDialogProps {
  folder: DocumentFolder;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedFolder: DocumentFolder) => void;
}

export function FolderRenameDialog({ folder, open, onClose, onSuccess }: FolderRenameDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: folder?.name || '',
    description: folder?.description || ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Reset form data when folder changes
  React.useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name || '',
        description: folder.description || ''
      });
      setValidationError(null);
      setSaveNotice(null);
    }
  }, [folder]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      // Validate folder name
      if (!data.name.trim()) {
        throw new Error('Folder name cannot be empty');
      }

      // Check if name is unchanged - no need to make API call
      if (data.name === folder.name && data.description === folder.description) {
        throw new Error('No changes to save');
      }

      // Build update payload
      const updatePayload: { name: string; description?: string } = {
        name: data.name
      };
      
      // Only include description if it's different from current value
      if (data.description !== folder.description) {
        updatePayload.description = data.description;
      }
      
      const res = await apiRequest("PUT", `/api/document-folders/${folder.id}`, updatePayload);

      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || `Failed with status: ${res.status}`;
        } catch (e) {
          const errorText = await res.text();
          errorMessage = errorText || `Failed with status: ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'Folder updated',
        description: 'Folder has been renamed successfully.',
        variant: 'success',
      });
      
      // Invalidate queries to refresh the folder list
      queryClient.invalidateQueries({ queryKey: ['/api/document-folders'] });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      onClose();
    },
    onError: (error: Error) => {
      // Handle specific validation errors differently
      if (error.message === 'No changes to save') {
        setSaveNotice(error.message);
        setValidationError(null);
        return;
      }
      
      // Handle other validation errors
      if (error.message === 'Folder name cannot be empty') {
        setValidationError(error.message);
        return;
      }
      
      // Server or network errors
      toast({
        title: 'Error',
        description: `Failed to update folder: ${error.message}`,
        variant: 'destructive',
      });
      
      setValidationError(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(null);
    setValidationError(null);
    
    updateMutation.mutate({
      name: formData.name.trim(),
      description: formData.description?.trim()
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter folder name"
                className={validationError && validationError.includes('name') ? 'border-red-500' : ''}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="folderDescription">Description (Optional)</Label>
              <Textarea
                id="folderDescription"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description (optional)"
                rows={3}
              />
            </div>
            
            {validationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  {validationError}
                </AlertDescription>
              </Alert>
            )}
            
            {saveNotice && (
              <Alert className="mt-2">
                <AlertDescription>{saveNotice}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}