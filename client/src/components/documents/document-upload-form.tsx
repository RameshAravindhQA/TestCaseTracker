import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { DocumentFolder, InsertDocument } from "@/shared/schema";
import { useQuery } from "@tanstack/react-query";
import { playSoundEffect } from "@/utils/sound-effects";

// File size in MB
const MAX_FILE_SIZE = 50;
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
  projectId: z.number(),
  folderId: z.number().nullable(),
  uploadedById: z.number(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE * 1024 * 1024, {
      message: `File size should be less than ${MAX_FILE_SIZE}MB`,
    })
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type) || file.type === "", // Allow empty file type for some browsers
      {
        message: `File type not supported. Accepted types: PDF, images, Excel, Word, and text files.`,
      }
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface DocumentUploadFormProps {
  projectId: number;
  folders?: DocumentFolder[];
  selectedFolderId?: number | null;
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
}

export function DocumentUploadForm({
  projectId,
  folders = [],
  selectedFolderId = null,
  onSubmit,
  isSubmitting,
}: DocumentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/current"],
    queryFn: async () => {
      try {
        // Try the main user endpoint first
        const response = await fetch('/api/user/current', { 
          credentials: 'include' 
        });

        if (response.ok) {
          return response.json();
        }

        // Fall back to auth user endpoint if needed
        const authResponse = await fetch('/api/auth/user', { 
          credentials: 'include' 
        });

        if (authResponse.ok) {
          return authResponse.json();
        }

        throw new Error('Failed to fetch user data');
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    // Clean up preview URL when component unmounts
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId,
      folderId: selectedFolderId,
      uploadedById: currentUser?.id || 0,
      file: undefined,
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (currentUser?.id) {
      form.setValue("uploadedById", currentUser.id);
    }
  }, [currentUser, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent default browser behavior

    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("file", file);

      // Generate preview URL for images
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
      } else {
        setFilePreview(null);
      }

      // Set document name to file name if not already filled
      if (!form.getValues("name")) {
        // Remove file extension from name
        const fileName = file.name.split(".").slice(0, -1).join(".");
        form.setValue("name", fileName || file.name);
      }
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!selectedFile) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('projectId', values.projectId.toString());
      formData.append('folderId', values.folderId?.toString() || '');
      formData.append('uploadedById', values.uploadedById.toString());

      onSubmit({
        ...values,
        file: selectedFile,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="file">File</Label>
          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
            <input
              id="file"
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            {filePreview ? (
              <div className="relative flex items-center justify-center">
                <img 
                  src={filePreview} 
                  alt="File preview" 
                  className="max-h-28 max-w-full object-contain" 
                />
              </div>
            ) : selectedFile ? (
              <div className="flex flex-col items-center justify-center py-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  type="button" 
                  className="mt-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                    form.resetField("file");
                  }}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center h-full w-full cursor-pointer"
              >
                <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, Image, Word, Excel or Text (max. {MAX_FILE_SIZE}MB)
                </p>
              </label>
            )}
          </div>
          {form.formState.errors.file && (
            <p className="text-sm font-medium text-red-500">
              {form.formState.errors.file.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter document name" {...field} />
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
                  placeholder="Enter a brief description of the document"
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
          name="folderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder (Optional)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "null" ? null : parseInt(value))
                }
                value={field.value?.toString() || "null"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="None (Root level)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem key="none" value="null">None (Root level)</SelectItem>
                  {folders.map((folder) => (
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
          <Button type="submit" disabled={isSubmitting || !selectedFile}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload Document
          </Button>
        </div>
      </form>
    </Form>
  );
}