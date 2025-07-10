import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DocumentFolder, InsertDocumentFolder } from "@/shared/schema";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  description: z.string().optional(),
  projectId: z.number(),
  parentFolderId: z.number().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentFolderFormProps {
  projectId: number;
  parentFolderId: number | null;
  existingFolder?: DocumentFolder | null;
  folders: DocumentFolder[];
  onSubmit: (data: Partial<InsertDocumentFolder>) => void;
  isSubmitting: boolean;
}

export function DocumentFolderForm({
  projectId,
  parentFolderId,
  existingFolder,
  folders,
  onSubmit,
  isSubmitting,
}: DocumentFolderFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingFolder?.name || "",
      description: existingFolder?.description || "",
      projectId: existingFolder?.projectId || projectId,
      parentFolderId: existingFolder?.parentFolderId || parentFolderId,
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  // Get all potential parent folders (excluding the current folder and its descendants)
  const getPotentialParentFolders = () => {
    if (!existingFolder) return folders;

    // Helper function to get all descendant folder IDs
    const getDescendantIds = (folderId: number): number[] => {
      const directDescendants = folders.filter(
        (f) => f.parentFolderId === folderId
      );
      const descendantIds = directDescendants.map((f) => f.id);

      // Recursively get descendants of descendants
      for (const descendant of directDescendants) {
        descendantIds.push(...getDescendantIds(descendant.id));
      }

      return descendantIds;
    };

    const descendantIds = existingFolder ? getDescendantIds(existingFolder.id) : [];
    
    // Filter out the current folder and all its descendants
    return folders.filter(
      (folder) =>
        folder.id !== existingFolder.id && !descendantIds.includes(folder.id)
    );
  };

  const potentialParentFolders = getPotentialParentFolders();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter folder name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentFolderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Folder (Optional)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : parseInt(value))
                }
                value={field.value === null ? "null" : field.value?.toString() || "null"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="None (Root folder)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem key="none" value="null">None (Root folder)</SelectItem>
                  {potentialParentFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingFolder ? "Update Folder" : "Create Folder"}
          </Button>
        </div>
      </form>
    </Form>
  );
}