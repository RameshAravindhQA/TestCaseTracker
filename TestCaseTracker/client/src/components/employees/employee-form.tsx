
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
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const employeeSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  profilePicture: z.string().optional(),
  locality: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  department: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
