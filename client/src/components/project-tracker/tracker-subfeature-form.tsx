import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ColorPicker } from '@/components/ui/color-picker';

const subFeatureSchema = z.object({
  name: z.string().min(1, 'Sub-feature name is required'),
  description: z.string().optional(),
  featureId: z.number(),
  projectId: z.number(),
  parentSubFeatureId: z.number().optional(),
  status: z.enum(['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed', 'Blocked', 'On Hold']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  workType: z.string(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assignedEmployeeIds: z.array(z.number()).optional(),
  estimatedHours: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

type SubFeatureFormData = z.infer<typeof subFeatureSchema>;

interface TrackerSubFeatureFormProps {
  subFeature?: any;
  featureId: number;
  projectId: number;
  availableSubFeatures?: any[];
  onSubmit: (data: SubFeatureFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultWorkTypes = [
  { name: 'Development', color: '#3b82f6' },
  { name: 'QA', color: '#10b981' },
  { name: 'DevOps', color: '#8b5cf6' },
  { name: 'Designing', color: '#f59e0b' },
  { name: 'Analysis', color: '#ef4444' },
  { name: 'Documentation', color: '#6b7280' },
  { name: 'User Story', color: '#06b6d4' },
  { name: 'Change Request', color: '#ec4899' },
  { name: 'Bug Fix', color: '#dc2626' },
  { name: 'Feature Request', color: '#059669' }
];

const departments = ['Frontend', 'Backend', 'Mobile', 'Quality Assurance', 'DevOps', 'UI/UX', 'Business Analysis', 'Testing'];

export function TrackerSubFeatureForm({ 
  subFeature, 
  featureId,
  projectId,
  availableSubFeatures = [],
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TrackerSubFeatureFormProps) {
  const [customWorkTypes, setCustomWorkTypes] = React.useState(defaultWorkTypes);
  const [showAddWorkType, setShowAddWorkType] = React.useState(false);
  const [newWorkType, setNewWorkType] = React.useState({ name: '', color: '#3b82f6' });
  const [tags, setTags] = useState<string[]>(subFeature?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>(subFeature?.assignedEmployeeIds || []);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all');

  // Fetch employees data
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((employee: any) => {
    const matchesSearch = employeeSearchQuery === '' || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(employeeSearchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartmentFilter === 'all' || 
      employee.department === selectedDepartmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments from employees
  const availableDepartments = [...new Set(employees.map((emp: any) => emp.department).filter(Boolean))];

  const form = useForm<SubFeatureFormData>({
    resolver: zodResolver(subFeatureSchema),
    defaultValues: {
      name: '',
      description: '',
      featureId: featureId,
      projectId: projectId,
      parentSubFeatureId: undefined,
      status: 'Planning',
      priority: 'Medium',
      workType: 'Development',
      department: '',
      startDate: '',
      endDate: '',
      assignedEmployeeIds: [],
      estimatedHours: undefined,
      tags: [],
    },
  });

  // Reset form when subFeature prop changes
  React.useEffect(() => {
    if (subFeature) {
      // Editing existing sub-feature
      const assignedIds = Array.isArray(subFeature.assignedEmployeeIds) ? subFeature.assignedEmployeeIds : [];
      
      console.log('Editing sub-feature, assigned employee IDs:', assignedIds);
      
      const formData = {
        name: subFeature.name || '',
        description: subFeature.description || '',
        featureId: featureId,
        projectId: projectId,
        parentSubFeatureId: subFeature.parentSubFeatureId || undefined,
        status: subFeature.status || 'Planning',
        priority: subFeature.priority || 'Medium',
        workType: subFeature.workType || 'Development',
        department: subFeature.department || '',
        startDate: subFeature.startDate || '',
        endDate: subFeature.endDate || '',
        assignedEmployeeIds: assignedIds,
        estimatedHours: subFeature.estimatedHours || undefined,
        tags: subFeature.tags || [],
      };
      
      // Set selected employees first
      setSelectedEmployees(assignedIds);
      setTags(subFeature.tags || []);
      
      // Reset form with data
      form.reset(formData);

      // Force set individual field values to ensure they're displayed
      setTimeout(() => {
        form.setValue('status', subFeature.status || 'Planning');
        form.setValue('department', subFeature.department || '');
        form.setValue('priority', subFeature.priority || 'Medium');
        form.setValue('workType', subFeature.workType || 'Development');
        form.setValue('assignedEmployeeIds', assignedIds);
      }, 100);
    } else {
      // Creating new sub-feature - clear everything
      console.log('Creating new sub-feature, clearing form');
      
      const defaultFormData = {
        name: '',
        description: '',
        featureId: featureId,
        projectId: projectId,
        parentSubFeatureId: undefined,
        status: 'Planning',
        priority: 'Medium',
        workType: 'Development',
        department: '',
        startDate: '',
        endDate: '',
        assignedEmployeeIds: [],
        estimatedHours: undefined,
        tags: [],
      };
      
      form.reset(defaultFormData);
      setSelectedEmployees([]);
      setTags([]);
      
      // Ensure form field is synchronized
      setTimeout(() => {
        form.setValue('assignedEmployeeIds', []);
      }, 50);
    }
  }, [subFeature, featureId, projectId, form, employees]);

  const handleSubmit = (data: any) => {
    // Ensure selectedEmployees is properly included
    const formData = {
      ...data,
      tags,
      assignedEmployeeIds: selectedEmployees.length > 0 ? selectedEmployees : [],
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      parentSubFeatureId: data.parentSubFeatureId ? Number(data.parentSubFeatureId) : undefined,
    };
    
    console.log('Submitting sub-feature with assigned employees:', selectedEmployees);
    console.log('Complete form data being submitted:', formData);
    onSubmit(formData);
  };

  const handleEmployeeToggle = (employeeId: number) => {
    const newSelectedEmployees = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter(id => id !== employeeId)
      : [...selectedEmployees, employeeId];
    
    console.log('Employee toggle - Previous:', selectedEmployees, 'New:', newSelectedEmployees);
    
    setSelectedEmployees(newSelectedEmployees);
    form.setValue('assignedEmployeeIds', newSelectedEmployees);
    
    // Force form to register the change
    form.trigger('assignedEmployeeIds');
  };

  const getSelectedEmployeeNames = () => {
    return employees
      .filter((emp: any) => selectedEmployees.includes(emp.id))
      .map((emp: any) => `${emp.firstName} ${emp.lastName}`)
      .join(', ');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub-Feature Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter sub-feature name" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Deployment">Deployment</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Work</FormLabel>
                <div className="space-y-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customWorkTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t pt-2">
                        <button
                          type="button"
                          className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          onClick={() => setShowAddWorkType(true)}
                        >
                          + Add Custom Work Type
                        </button>
                      </div>
                    </SelectContent>
                  </Select>

                  {showAddWorkType && (
                    <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Work type name"
                          value={newWorkType.name}
                          onChange={(e) => setNewWorkType({ ...newWorkType, name: e.target.value })}
                        />
                        <ColorPicker
                          value={newWorkType.color}
                          onChange={(color) => setNewWorkType({ ...newWorkType, color })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newWorkType.name) {
                              setCustomWorkTypes([...customWorkTypes, newWorkType]);
                              field.onChange(newWorkType.name);
                              setNewWorkType({ name: '', color: '#3b82f6' });
                              setShowAddWorkType(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddWorkType(false);
                            setNewWorkType({ name: '', color: '#3b82f6' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentSubFeatureId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Sub-Feature (Dependency)</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))} value={field.value?.toString() || 'none'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent sub-feature" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableSubFeatures.filter(sf => sf.id !== subFeature?.id).map((sf) => (
                      <SelectItem key={sf.id} value={sf.id.toString()}>{sf.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Hours</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter estimated hours"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

        {/* Assigned Employees */}
        <div className="space-y-3">
          <FormLabel className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigned Employees ({selectedEmployees.length})
          </FormLabel>

          {selectedEmployees.length > 0 && (
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
              <strong>Selected:</strong> {getSelectedEmployeeNames()}
            </div>
          )}

          {/* Employee Search and Filter */}
          <div className="space-y-2">
            <Input
              placeholder="Search employees by name or email..."
              value={employeeSearchQuery}
              onChange={(e) => setEmployeeSearchQuery(e.target.value)}
              className="text-sm"
            />
            <Select value={selectedDepartmentFilter} onValueChange={setSelectedDepartmentFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
            {filteredEmployees.map((employee: any) => (
              <div key={employee.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`employee-${employee.id}`}
                  checked={selectedEmployees.includes(employee.id)}
                  onCheckedChange={() => handleEmployeeToggle(employee.id)}
                />
                <label 
                  htmlFor={`employee-${employee.id}`} 
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {employee.firstName} {employee.lastName}
                  {employee.department && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({employee.department})
                    </span>
                  )}
                </label>
                {employee.profilePicture && (
                  <img
                    src={employee.profilePicture}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
              </div>
            ))}
            {filteredEmployees.length === 0 && employeeSearchQuery && (
              <p className="text-sm text-gray-500 text-center py-4">
                No employees found matching "{employeeSearchQuery}"
              </p>
            )}
            {employees.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No employees available. Add employees in the Employee Management module.
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 text-red-500 hover:text-red-700">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" onClick={handleAddTag}>Add</Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter sub-feature description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden field to sync selectedEmployees with form */}
        <FormField
          control={form.control}
          name="assignedEmployeeIds"
          render={({ field }) => (
            <FormItem style={{ display: 'none' }}>
              <FormControl>
                <Input {...field} value={selectedEmployees.join(',')} readOnly />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : subFeature ? 'Update Sub-Feature' : 'Create Sub-Feature'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}