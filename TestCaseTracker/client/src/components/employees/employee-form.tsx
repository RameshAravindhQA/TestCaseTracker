import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { DialogFooter } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const employeeSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
  locality: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  department: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  joiningDate: z.string().optional(),
  overallExperience: z.string().optional(),
  experienceYears: z.number().optional(),
  experienceMonths: z.number().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: any;
  onSuccess?: () => void;
}

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const { toast } = useToast();
  const isEditing = !!employee;
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(employee?.technologies || []);
  const [newTechnology, setNewTechnology] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(employee?.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [calculatedExperience, setCalculatedExperience] = useState("");

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: employee?.employeeId || "",
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      phoneNumber: employee?.phoneNumber || "",
      profilePicture: employee?.profilePicture || "",
      locality: employee?.locality || "",
      technologies: employee?.technologies || [],
      department: employee?.department || "",
      status: employee?.status || "Active",
      joiningDate: employee?.joiningDate || "",
      overallExperience: employee?.overallExperience || "",
      experienceYears: employee?.experienceYears || 0,
      experienceMonths: employee?.experienceMonths || 0,
    },
  });

  const { data: technologyOptions = [] } = useQuery({
    queryKey: ["/api/technology-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/technology-options");
      return res.json();
    },
  });

  const { data: departmentOptions = [] } = useQuery({
    queryKey: ["/api/department-options"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/department-options");
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

  const createDepartmentMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/department-options", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/department-options"] });
      setNewDepartment("");
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const res = await apiRequest("POST", "/api/employees", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Employee created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to create employee", variant: "destructive" });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const res = await apiRequest("PUT", `/api/employees/${employee?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Employee updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update employee", variant: "destructive" });
    },
  });

  const onSubmit = (data: EmployeeFormValues) => {
    const formData = {
      ...data,
      technologies: selectedTechnologies,
    };

    if (isEditing) {
      updateEmployeeMutation.mutate(formData);
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim()) {
      createTechnologyMutation.mutate(newTechnology.trim());
    }
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim()) {
      createDepartmentMutation.mutate(newDepartment.trim());
    }
  };

  const toggleTechnology = (techName: string) => {
    setSelectedTechnologies(prev => 
      prev.includes(techName) 
        ? prev.filter(t => t !== techName)
        : [...prev, techName]
    );
  };

  // Calculate experience from joining date
  useEffect(() => {
    const joiningDate = form.watch("joiningDate");
    if (joiningDate) {
      const joinDate = new Date(joiningDate);
      const currentDate = new Date();
      
      let years = currentDate.getFullYear() - joinDate.getFullYear();
      let months = currentDate.getMonth() - joinDate.getMonth();
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      form.setValue("experienceYears", years);
      form.setValue("experienceMonths", months);
      
      const experienceStr = `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
      form.setValue("overallExperience", experienceStr);
      setCalculatedExperience(experienceStr);
    }
  }, [form.watch("joiningDate")]);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, WebP, etc.)",
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
      formData.append('profilePicture', file, file.name);

      const response = await fetch('/api/user/upload-profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.profilePicture) {
        const newUrl = `${data.profilePicture}?t=${Date.now()}`;
        setProfilePictureUrl(newUrl);
        form.setValue("profilePicture", data.profilePicture);
        
        toast({
          title: "Profile picture uploaded",
          description: "Profile picture has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group cursor-pointer" onClick={handleProfilePictureClick}>
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={profilePictureUrl || undefined} 
                alt={`${form.watch("firstName")} ${form.watch("lastName")}`}
                className="object-cover"
              />
              <AvatarFallback className="text-lg bg-primary/10">
                {form.watch("firstName")?.charAt(0)?.toUpperCase() || 'E'}
                {form.watch("lastName")?.charAt(0)?.toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="h-6 w-6 text-white" />
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
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

          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleProfilePictureClick}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Upload a profile picture (Max 10MB)
            <br />
            Supported formats: JPEG, PNG, GIF, WebP
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input placeholder="EMP-0001 (auto-generated if empty)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Locality</FormLabel>
                <FormControl>
                  <Input placeholder="New York, NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="joiningDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joining Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="experienceYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience (Years)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="Years"
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    readOnly
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience (Months)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    max="11"
                    placeholder="Months"
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    readOnly
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="overallExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Experience (Auto-calculated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Will be calculated from joining date" 
                  {...field}
                  readOnly
                  className="bg-muted"
                />
              </FormControl>
              <FormMessage />
              {calculatedExperience && (
                <p className="text-sm text-muted-foreground">
                  Auto-calculated: {calculatedExperience}
                </p>
              )}
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Department</FormLabel>
          <div className="flex space-x-2 mt-1">
            <Select
              value={form.watch("department")}
              onValueChange={(value) => form.setValue("department", value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2 mt-2">
            <Input
              placeholder="Add new department"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddDepartment}
              disabled={!newDepartment.trim()}
            >
              Add
            </Button>
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
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="submit"
            disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
          >
            {isEditing
              ? updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"
              : createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}