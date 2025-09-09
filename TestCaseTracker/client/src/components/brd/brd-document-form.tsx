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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, Target, AlertCircle, CheckSquare } from "lucide-react";

const brdSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  projectId: z.number(),
  overview: z.string().optional(),
  problemStatement: z.string().optional(),
  objectives: z.string().optional(),
  scope: z.string().optional(),
  userStories: z.string().optional(),
  functionalRequirements: z.string().optional(),
  nonFunctionalRequirements: z.string().optional(),
  designNotes: z.string().optional(),
  dependencies: z.string().optional(),
  assumptions: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  risks: z.string().optional(),
  supportingDocuments: z.string().optional()
});

type BrdFormData = z.infer<typeof brdSchema>;

interface BrdDocumentFormProps {
  projects: Array<{ id: number; name: string }>;
  initialData?: Partial<BrdFormData>;
  onSubmit: (data: BrdFormData) => void;
  isSubmitting?: boolean;
}

export function BrdDocumentForm({
  projects,
  initialData,
  onSubmit,
  isSubmitting = false
}: BrdDocumentFormProps) {
  const form = useForm<BrdFormData>({
    resolver: zodResolver(brdSchema),
    defaultValues: {
      title: initialData?.title || "",
      author: initialData?.author || "",
      projectId: initialData?.projectId || projects[0]?.id || 0,
      overview: initialData?.overview || "",
      problemStatement: initialData?.problemStatement || "",
      objectives: initialData?.objectives || "",
      scope: initialData?.scope || "",
      userStories: initialData?.userStories || "",
      functionalRequirements: initialData?.functionalRequirements || "",
      nonFunctionalRequirements: initialData?.nonFunctionalRequirements || "",
      designNotes: initialData?.designNotes || "",
      dependencies: initialData?.dependencies || "",
      assumptions: initialData?.assumptions || "",
      acceptanceCriteria: initialData?.acceptanceCriteria || "",
      risks: initialData?.risks || "",
      supportingDocuments: initialData?.supportingDocuments || "",
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormLabel>Document Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter BRD document title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
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

        {/* Requirements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Requirements & Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="overview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overview</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a high-level overview of the project"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problemStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Statement</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the problem this project aims to solve"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectives & Goals</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the main objectives and goals"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define what is included and excluded from the project scope"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Requirements Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Requirements Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="userStories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Stories</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write user stories in the format: As a [user], I want [goal] so that [benefit]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="functionalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Functional Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List all functional requirements"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nonFunctionalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Non-Functional Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List performance, security, usability requirements etc."
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
                      placeholder="Define criteria for acceptance testing"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="designNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Design Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any design considerations or notes"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependencies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dependencies</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List any dependencies on other systems or projects"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assumptions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assumptions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List any assumptions made during requirement analysis"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risks & Mitigations</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Identify risks and mitigation strategies"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportingDocuments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supporting Documents</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Links to wireframes, designs, etc."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save BRD Document"}
          </Button>
        </div>
      </form>
    </Form>
  );
}