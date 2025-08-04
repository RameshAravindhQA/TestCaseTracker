
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelect } from "@/components/ui/multi-select";

const navadhitiProjectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  projectType: z.string().min(1, "Project type is required"),
  status: z.enum(["Active", "Completed", "On Hold", "Cancelled"]).default("Active"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  assignedEmployees: z.array(z.number()).optional(),
  technologies: z.array(z.string()).optional(),
  projectImage: z.string().optional(),
});

type NavadhitiProjectFormValues = z.infer<typeof navadhitiProjectSchema>;

interface NavadhitiProjectFormProps {
  project?: any;
  onSuccess?: () => void;
}

export function NavadhitiProjectForm({ project, onSuccess }: NavadhitiProjectFormProps) {
  const { toast } = useToast();
  const isEditing = !!project;
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>(project?.assignedEmployees || []);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(project?.technologies || []);
  const [newTechnology, setNewTechnology] = useState("");
  const [uploading, setUploading] = useState(false);
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(project?.projectImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<NavadhitiProjectFormValues>({
    resolver: zodResolver(navadhitiProjectSchema),
    defaultValues: {
      projectName: project?.projectName || "",
      clientName: project?.clientName || "",
      projectType: project?.projectType || "",
      status: project?.status || "Active",
      startDate: project?.startDate || "",
      endDate: project?.endDate || "",
      description: project?.description || "",
      assignedEmployees: project?.assignedEmployees || [],
      technologies: project?.technologies || [],
      projectImage: project?.projectImage || "",
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/employees");
      return res.json();
    },
  });

  const { data: technologyOptions = [] } = useQuery({
    queryKey: ["/api/technology-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technology-options");
      return res.json();
    },
  });

  const createTechnologyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/technology-options", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-options"] });
      setNewTechnology("");
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: NavadhitiProjectFormValues) => {
      const res = await apiRequest("POST", "/api/navadhiti-projects", {
        ...data,
        assignedEmployees: selectedEmployees,
        technologies: selectedTechnologies,
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      form.reset();
      setSelectedEmployees([]);
      setSelectedTechnologies([]);
      setProjectImageUrl(null);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Project creation error:', error);
      toast({
        title: "Failed to create project",
        description: error.message || "An error occurred while creating the project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: NavadhitiProjectFormValues) => {
      const res = await apiRequest("PUT", `/api/navadhiti-projects/${project?.id}`, {
        ...data,
        assignedEmployees: selectedEmployees,
        technologies: selectedTechnologies,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Project updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/navadhiti-projects"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Project update error:', error);
      toast({
        title: "Failed to update project",
        description: error.message || "An error occurred while updating the project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NavadhitiProjectFormValues) => {
    const formData = {
      ...data,
      assignedEmployees: selectedEmployees,
      technologies: selectedTechnologies,
    };

    if (isEditing) {
      updateProjectMutation.mutate(formData);
    } else {
      createProjectMutation.mutate(formData);
    }
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim()) {
      createTechnologyMutation.mutate(newTechnology.trim());
    }
  };

  const toggleTechnology = (techName: string) => {
    setSelectedTechnologies(prev => 
      prev.includes(techName) 
        ? prev.filter(t => t !== techName)
        : [...prev, techName]
    );
  };

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleProjectImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Project image must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    handleImageUpload(file);
    event.target.value = '';
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch('/api/uploads/bug-attachment', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.fileUrl) {
        const newUrl = `${data.fileUrl}?t=${Date.now()}`;
        setProjectImageUrl(newUrl);
        form.setValue("projectImage", data.fileUrl);
        
        toast({
          title: "Project image uploaded",
          description: "Project image has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Project image upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload project image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Project Image Section */}
          <div className="flex flex-col items-center space-y-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Logo/Image</h3>
            <div className="relative group cursor-pointer" onClick={handleProjectImageClick}>
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={projectImageUrl || undefined} 
                  alt={`${form.watch("projectName")} project`}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  {form.watch("projectName")?.charAt(0)?.toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-8 w-8 text-white" />
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleProjectImageClick}
                disabled={uploading}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Logo"}
              </Button>
              {projectImageUrl && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setProjectImageUrl(null);
                    form.setValue("projectImage", "");
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Upload a project logo or image to easily identify your project.<br/>
              Recommended: Square image, max 10MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E-Commerce Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile App">Mobile App</SelectItem>
                    <SelectItem value="Desktop Application">Desktop Application</SelectItem>
                    <SelectItem value="API Development">API Development</SelectItem>
                    <SelectItem value="Testing & QA">Testing & QA</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Project description..." 
                    rows={3}
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Project Leads</FormLabel>
            <div className="space-y-2 mt-1">
              <div className="flex flex-wrap gap-2">
                {selectedEmployees.map((employeeId) => {
                  const employee = employees.find((emp: any) => emp.id === employeeId);
                  return employee ? (
                    <Badge key={employeeId} variant="secondary" className="cursor-pointer">
                      {employee.firstName} {employee.lastName}
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={() => toggleEmployee(employeeId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
              <Select onValueChange={(value) => toggleEmployee(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project leads..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee: any) => (
                    <SelectItem 
                      key={employee.id} 
                      value={employee.id.toString()}
                      disabled={selectedEmployees.includes(employee.id)}
                    >
                      {employee.firstName} {employee.lastName} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <FormLabel>Technologies</FormLabel>
            <div className="space-y-2 mt-1">
              <div className="flex flex-wrap gap-2">
                {selectedTechnologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="cursor-pointer">
                    {tech}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => toggleTechnology(tech)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {technologyOptions.map((tech: any) => (
                  <Button
                    key={tech.id}
                    type="button"
                    variant={selectedTechnologies.includes(tech.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTechnology(tech.name)}
                    className="text-xs"
                  >
                    {tech.name}
                  </Button>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add new technology"
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTechnology}
                  disabled={!newTechnology.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {isEditing
                ? updateProjectMutation.isPending ? "Updating..." : "Update Project"
                : createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
