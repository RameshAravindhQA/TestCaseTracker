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
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const workLogSchema = z.object({
  workDate: z.string().min(1, 'Work date is required'),
  hoursWorked: z.number().min(0.1, 'Hours worked must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  workType: z.string().min(1, 'Work type is required'),
  status: z.enum(['In Progress', 'Completed', 'Blocked']),
  assignedEmployeeId: z.number().optional(),
});

type WorkLogFormData = z.infer<typeof workLogSchema>;

interface TrackerWorkLogFormProps {
  workLog?: any;
  subFeature: any;
  projectId: number;
  onSubmit: (data: WorkLogFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function TrackerWorkLogForm({
  workLog,
  subFeature,
  projectId,
  onSubmit,
  onCancel,
  isLoading,
}: TrackerWorkLogFormProps) {
  // Fetch employees data
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const form = useForm<z.infer<typeof workLogSchema>>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      workDate: workLog?.workDate || new Date().toISOString().split('T')[0],
      hoursWorked: workLog?.hoursWorked || 1,
      description: workLog?.description || '',
      workType: workLog?.workType || '',
      status: workLog?.status || 'In Progress',
      assignedEmployeeId: workLog?.assignedEmployeeId || undefined,
    },
  });

  const handleSubmit = (data: WorkLogFormData) => {
    onSubmit(data);
  };

  // Get previous work logs and date range for this sub-feature
  const getDateInfo = () => {
    const startDate = subFeature.startDate || 'Not set';
    const endDate = subFeature.endDate || 'Not set';
    const lastWorkDate = workLog?.workDate || 'No previous logs'; // This would come from actual work logs

    return { startDate, endDate, lastWorkDate };
  };

  const { startDate, endDate, lastWorkDate } = getDateInfo();

  return (
    <div className="space-y-6">
      {/* Sub-feature Info */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Sub-Feature: {subFeature.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <span className="text-muted-foreground">Planned Start:</span>
              <p className="font-medium">{startDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-500" />
            <div>
              <span className="text-muted-foreground">Planned End:</span>
              <p className="font-medium">{endDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <div>
              <span className="text-muted-foreground">Last Work Log:</span>
              <p className="font-medium">{lastWorkDate}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="outline">{subFeature.status}</Badge>
          <Badge variant="outline">{subFeature.workType}</Badge>
          {subFeature.estimatedHours && (
            <Badge variant="outline">{subFeature.estimatedHours}h estimated</Badge>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hoursWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Worked *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      placeholder="Enter hours worked"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="QA">QA</SelectItem>
                      <SelectItem value="DevOps">DevOps</SelectItem>
                      <SelectItem value="Designing">Designing</SelectItem>
                      <SelectItem value="Analysis">Analysis</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="User Story">User Story</SelectItem>
                      <SelectItem value="Change Request">Change Request</SelectItem>
                      <SelectItem value="Bug Fix">Bug Fix</SelectItem>
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
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Employee</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          <div className="flex items-center gap-2">
                            {employee.profilePicture ? (
                              <img
                                src={employee.profilePicture}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                {employee.firstName?.[0]}{employee.lastName?.[0]}
                              </div>
                            )}
                            <span>{employee.firstName} {employee.lastName}</span>
                            {employee.department && (
                              <span className="text-xs text-gray-500">({employee.department})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <FormLabel>Work Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the work completed, issues encountered, next steps, etc."
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
              {isLoading ? 'Saving...' : (workLog ? 'Save Changes' : 'Add Work Log')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}