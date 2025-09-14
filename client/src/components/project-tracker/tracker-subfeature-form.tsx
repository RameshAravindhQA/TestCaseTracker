
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

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
  assignedToId: z.number().optional(),
  estimatedHours: z.number().optional(),
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

const workTypes = ['Development', 'QA', 'DevOps', 'Designing', 'Analysis', 'Documentation'];
const departments = ['Frontend', 'Backend', 'Mobile', 'Quality Assurance', 'DevOps', 'UI/UX', 'Business Analysis'];

export function TrackerSubFeatureForm({ 
  subFeature, 
  featureId,
  projectId,
  availableSubFeatures = [],
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TrackerSubFeatureFormProps) {
  const form = useForm<SubFeatureFormData>({
    resolver: zodResolver(subFeatureSchema),
    defaultValues: {
      name: subFeature?.name || '',
      description: subFeature?.description || '',
      featureId: featureId,
      projectId: projectId,
      parentSubFeatureId: subFeature?.parentSubFeatureId || undefined,
      status: subFeature?.status || 'Planning',
      priority: subFeature?.priority || 'Medium',
      workType: subFeature?.workType || 'Development',
      department: subFeature?.department || '',
      startDate: subFeature?.startDate || '',
      endDate: subFeature?.endDate || '',
      assignedToId: subFeature?.assignedToId || undefined,
      estimatedHours: subFeature?.estimatedHours || undefined,
    },
  });

  const handleSubmit = (data: SubFeatureFormData) => {
    onSubmit(data);
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent sub-feature" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
