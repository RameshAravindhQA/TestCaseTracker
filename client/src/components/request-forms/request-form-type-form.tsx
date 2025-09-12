
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formTypeSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  department: z.string().min(1, { message: "Department is required" }),
});

type FormTypeValues = z.infer<typeof formTypeSchema>;

interface RequestFormTypeFormProps {
  formType?: any;
  onSubmit: () => void;
  onCancel: () => void;
}

export function RequestFormTypeForm({ formType, onSubmit, onCancel }: RequestFormTypeFormProps) {
  const { toast } = useToast();
  const isEditing = !!formType;

  const form = useForm<FormTypeValues>({
    resolver: zodResolver(formTypeSchema),
    defaultValues: {
      name: formType?.name || "",
      description: formType?.description || "",
      department: formType?.department || "",
    },
  });

  const createFormTypeMutation = useMutation({
    mutationFn: async (data: FormTypeValues) => {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/request-forms/types/${formType.id}` : "/api/request-forms/types";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Form type updated" : "Form type created",
        description: `Form type has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/request-forms/types"] });
      onSubmit();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} form type`,
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const departmentOptions = [
    { value: "Development", label: "Development" },
    { value: "QA", label: "Quality Assurance" },
    { value: "DevOps", label: "DevOps" },
    { value: "Design", label: "Design" },
    { value: "Product", label: "Product Management" },
    { value: "Other", label: "Other" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createFormTypeMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form Type Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Senior Frontend Developer Request" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of this form type..." 
                  rows={3}
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createFormTypeMutation.isPending}
          >
            {createFormTypeMutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update" : "Create")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
