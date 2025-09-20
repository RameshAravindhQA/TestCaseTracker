import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Calendar, CalendarDays, Clock, FileText, Users, Settings, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const requestFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  requestType: z.string().min(1, { message: "Request type is required" }),
  department: z.string().min(1, { message: "Department is required" }),
  projectId: z.number().min(1, { message: "Project is required" }),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Open", "Closed", "Hold"]).default("Open"),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  estimatedHours: z.number().min(1, { message: "Estimated hours must be at least 1" }),
  resourceType: z.string().optional(),
  testingType: z.string().optional(),
  developmentType: z.string().optional(),
  devopsType: z.string().optional(),
  skillsRequired: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  deliverables: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  additionalNotes: z.string().optional(),
  leadId: z.number().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestFormFormProps {
  request?: any;
  projects: any[];
  requestTypes: any[];
  employees: any[];
  onSubmit: (data: RequestFormValues) => void;
  onCancel: () => void;
}

export function RequestFormForm({ request, projects, requestTypes, employees = [], onSubmit, onCancel }: RequestFormFormProps) {
  const isEditing = !!request;
  const [editingReopenId, setEditingReopenId] = useState<number | null>(null);
  const [editingReopenData, setEditingReopenData] = useState<any>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: request?.title || "",
      description: request?.description || "",
      requestType: request?.requestType || "",
      department: request?.department || "",
      projectId: request?.projectId || 0,
      priority: request?.priority || "Medium",
      status: request?.status || "Open",
      startDate: request?.startDate || "",
      endDate: request?.endDate || "",
      estimatedHours: request?.estimatedHours || 1,
      resourceType: request?.resourceType || "",
      testingType: request?.testingType || "",
      developmentType: request?.developmentType || "",
      devopsType: request?.devopsType || "",
      skillsRequired: request?.skillsRequired || [],
      technologies: request?.technologies || [],
      deliverables: request?.deliverables || "",
      acceptanceCriteria: request?.acceptanceCriteria || "",
      additionalNotes: request?.additionalNotes || "",
      leadId: request?.leadId || 0,
    },
  });

  const watchedRequestType = form.watch("requestType");
  const watchedDepartment = form.watch("department");

  // Predefined options for different fields
  const departmentOptions = [
    { value: "Development", label: "Development" },
    { value: "QA", label: "Quality Assurance" },
    { value: "DevOps", label: "DevOps" },
    { value: "Design", label: "Design" },
    { value: "Product", label: "Product Management" },
    { value: "Other", label: "Other" },
  ];

  const requestTypeOptions = [
    { value: "QA Resource Request", label: "QA Resource Request" },
    { value: "Developer Resource Request", label: "Developer Resource Request" },
    { value: "DevOps Resource Request", label: "DevOps Resource Request" },
    { value: "Design Resource Request", label: "Design Resource Request" },
    { value: "Product Resource Request", label: "Product Resource Request" },
    { value: "Other", label: "Other" },
  ];

  const resourceTypeOptions = {
    "Developer Resource Request": [
      { value: "Frontend Developer", label: "Frontend Developer" },
      { value: "Backend Developer", label: "Backend Developer" },
      { value: "Full Stack Developer", label: "Full Stack Developer" },
      { value: "Mobile Developer", label: "Mobile Developer" },
      { value: "Senior Developer", label: "Senior Developer" },
      { value: "Tech Lead", label: "Tech Lead" },
    ],
    "QA Resource Request": [
      { value: "Manual Tester", label: "Manual Tester" },
      { value: "Automation Tester", label: "Automation Tester" },
      { value: "Performance Tester", label: "Performance Tester" },
      { value: "Security Tester", label: "Security Tester" },
      { value: "QA Lead", label: "QA Lead" },
      { value: "Test Analyst", label: "Test Analyst" },
    ],
    "DevOps Resource Request": [
      { value: "DevOps Engineer", label: "DevOps Engineer" },
      { value: "Cloud Engineer", label: "Cloud Engineer" },
      { value: "Infrastructure Engineer", label: "Infrastructure Engineer" },
      { value: "Site Reliability Engineer", label: "Site Reliability Engineer" },
      { value: "Platform Engineer", label: "Platform Engineer" },
    ],
  };

  const testingTypeOptions = [
    { value: "Unit Testing", label: "Unit Testing" },
    { value: "Integration Testing", label: "Integration Testing" },
    { value: "System Testing", label: "System Testing" },
    { value: "Acceptance Testing", label: "Acceptance Testing" },
    { value: "Performance Testing", label: "Performance Testing" },
    { value: "Security Testing", label: "Security Testing" },
    { value: "Automation Testing", label: "Automation Testing" },
    { value: "Manual Testing", label: "Manual Testing" },
    { value: "API Testing", label: "API Testing" },
    { value: "Mobile Testing", label: "Mobile Testing" },
  ];

  const developmentTypeOptions = [
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile Development", label: "Mobile Development" },
    { value: "API Development", label: "API Development" },
    { value: "Database Development", label: "Database Development" },
    { value: "Frontend Development", label: "Frontend Development" },
    { value: "Backend Development", label: "Backend Development" },
    { value: "Full Stack Development", label: "Full Stack Development" },
    { value: "Microservices Development", label: "Microservices Development" },
  ];

  const devopsTypeOptions = [
    { value: "CI/CD Setup", label: "CI/CD Setup" },
    { value: "Infrastructure Setup", label: "Infrastructure Setup" },
    { value: "Cloud Migration", label: "Cloud Migration" },
    { value: "Monitoring Setup", label: "Monitoring Setup" },
    { value: "Security Hardening", label: "Security Hardening" },
    { value: "Container Setup", label: "Container Setup" },
    { value: "Deployment Automation", label: "Deployment Automation" },
  ];

  const skillsOptions = [
    { value: "React", label: "React" },
    { value: "Vue.js", label: "Vue.js" },
    { value: "Angular", label: "Angular" },
    { value: "Node.js", label: "Node.js" },
    { value: "Python", label: "Python" },
    { value: "Java", label: "Java" },
    { value: "C#", label: "C#" },
    { value: "PHP", label: "PHP" },
    { value: "Go", label: "Go" },
    { value: "Rust", label: "Rust" },
    { value: "PostgreSQL", label: "PostgreSQL" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "Redis", label: "Redis" },
    { value: "Docker", label: "Docker" },
    { value: "Kubernetes", label: "Kubernetes" },
    { value: "AWS", label: "AWS" },
    { value: "Azure", label: "Azure" },
    { value: "GCP", label: "GCP" },
    { value: "Terraform", label: "Terraform" },
    { value: "Jenkins", label: "Jenkins" },
    { value: "GitHub Actions", label: "GitHub Actions" },
    { value: "Selenium", label: "Selenium" },
    { value: "Cypress", label: "Cypress" },
    { value: "Jest", label: "Jest" },
    { value: "Playwright", label: "Playwright" },
  ];

  const technologyOptions = skillsOptions; // Same as skills for now

  const getCurrentResourceTypeOptions = () => {
    return resourceTypeOptions[watchedRequestType as keyof typeof resourceTypeOptions] || [];
  };

  const handleEditReopen = (reopen: any) => {
    setEditingReopenId(reopen.id);
    setEditingReopenData({
      reason: reopen.reason,
      newStartDate: reopen.newStartDate ? format(new Date(reopen.newStartDate), 'yyyy-MM-dd') : '',
      newEndDate: reopen.newEndDate ? format(new Date(reopen.newEndDate), 'yyyy-MM-dd') : '',
      reassignedEmployeeId: reopen.reassignedEmployeeId || ''
    });
  };

  const handleSaveReopen = async (reopenId: number) => {
    // TODO: Implement save reopen API call
    console.log('Save reopen:', reopenId, editingReopenData);
    setEditingReopenId(null);
    setEditingReopenData(null);
  };

  const handleCancelEditReopen = () => {
    setEditingReopenId(null);
    setEditingReopenData(null);
  };

  const handleDeleteReopen = async (reopenId: number) => {
    if (confirm('Are you sure you want to delete this reopen record?')) {
      // TODO: Implement delete reopen API call
      console.log('Delete reopen:', reopenId);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter request title..." {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the request..." 
                        rows={4}
                        {...field} 
                      />
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
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requestTypeOptions.map((option) => (
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="Medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="High">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="Critical">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Critical
                          </div>
                        </SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            Open
                          </div>
                        </SelectItem>
                        <SelectItem value="Hold">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Hold
                          </div>
                        </SelectItem>
                        <SelectItem value="Closed">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            Closed
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Employee</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value) || 0)} value={field.value?.toString() || "0"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No Employee Assigned</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            <div className="flex items-center gap-2">
                              {employee.profilePicture ? (
                                <img
                                  src={employee.profilePicture}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                                  {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                </div>
                              )}
                              {employee.firstName} {employee.lastName} - {employee.department || 'No Dept'}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Project & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.projectName || project.name}
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

              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Resource & Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resource & Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getCurrentResourceTypeOptions().length > 0 && (
                <FormField
                  control={form.control}
                  name="resourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getCurrentResourceTypeOptions().map((option) => (
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
              )}

              {watchedRequestType === "QA Resource Request" && (
                <FormField
                  control={form.control}
                  name="testingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testing Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select testing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {testingTypeOptions.map((option) => (
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
              )}

              {watchedRequestType === "Developer Resource Request" && (
                <FormField
                  control={form.control}
                  name="developmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Development Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select development type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {developmentTypeOptions.map((option) => (
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
              )}

              {watchedRequestType === "DevOps Resource Request" && (
                <FormField
                  control={form.control}
                  name="devopsType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DevOps Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select DevOps type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {devopsTypeOptions.map((option) => (
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
              )}

              <FormField
                control={form.control}
                name="skillsRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills Required</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={skillsOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select required skills..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technologies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technologies</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={technologyOptions}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select technologies..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="deliverables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deliverables</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List expected deliverables..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acceptanceCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acceptance Criteria</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Define acceptance criteria..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes or requirements..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Extensions and Reopen History */}
              {request?.extensions && request.extensions.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Extension History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {request.extensions.map((ext: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <span>Extended by {ext.extensionDays} days</span>
                          <span className="text-muted-foreground">{format(new Date(ext.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reopen History */}
              {request?.reopenHistory && request.reopenHistory.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Reopen History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {request.reopenHistory.map((reopen: any, index: number) => (
                        <div key={index} className="text-sm p-3 bg-gray-50 rounded border">
                          {editingReopenId === reopen.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-medium">Reason</Label>
                                <Textarea
                                  value={editingReopenData?.reason || ''}
                                  onChange={(e) => setEditingReopenData(prev => ({ ...prev, reason: e.target.value }))}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs font-medium">New Start Date</Label>
                                  <Input
                                    type="date"
                                    value={editingReopenData?.newStartDate || ''}
                                    onChange={(e) => setEditingReopenData(prev => ({ ...prev, newStartDate: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium">New End Date</Label>
                                  <Input
                                    type="date"
                                    value={editingReopenData?.newEndDate || ''}
                                    onChange={(e) => setEditingReopenData(prev => ({ ...prev, newEndDate: e.target.value }))}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-medium">Reassigned Employee</Label>
                                <Select 
                                  value={editingReopenData?.reassignedEmployeeId?.toString() || ''} 
                                  onValueChange={(value) => setEditingReopenData(prev => ({ ...prev, reassignedEmployeeId: parseInt(value) || null }))}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">No Employee Assigned</SelectItem>
                                    {employees.map((employee) => (
                                      <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.firstName} {employee.lastName} - {employee.department || 'No Dept'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" onClick={() => handleSaveReopen(reopen.id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEditReopen}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Reopened</span>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditReopen(reopen)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteReopen(reopen.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <span className="text-muted-foreground text-xs">{format(new Date(reopen.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                              <p className="text-muted-foreground mt-1">{reopen.reason}</p>
                              {reopen.newStartDate && (
                                <p className="text-xs text-muted-foreground">
                                  New dates: {format(new Date(reopen.newStartDate), 'MMM dd')} - {format(new Date(reopen.newEndDate), 'MMM dd')}
                                </p>
                              )}
                              {reopen.reassignedEmployeeId && (
                                <p className="text-xs text-muted-foreground">
                                  Reassigned to: {employees.find(emp => emp.id === reopen.reassignedEmployeeId)?.firstName} {employees.find(emp => emp.id === reopen.reassignedEmployeeId)?.lastName}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Request" : "Create Request"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}