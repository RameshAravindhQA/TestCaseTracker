import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavadhitiProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onSuccess: () => void;
}

export function NavadhitiProjectForm({ open, onOpenChange, project, onSuccess }: NavadhitiProjectFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    projectType: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    budget: '',
    description: '',
    assignedEmployees: [] as number[],
    technologies: [] as string[],
    customTechnology: '',
    projectImage: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, GIF, WebP, BMP, SVG)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, projectImage: '' }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'navadhiti-project');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let projectImagePath = formData.projectImage;

      // Upload image if a new one is selected
      if (imageFile) {
        projectImagePath = await uploadImage(imageFile);
      }

      const payload = {
        ...formData,
        projectImage: projectImagePath,
        assignedEmployees: formData.assignedEmployees,
        technologies: formData.technologies
      };

      const url = project ? `/api/navadhiti-projects/${project.id}` : '/api/navadhiti-projects';
      const method = project ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      toast({
        title: "Success",
        description: `Project ${project ? 'updated' : 'created'} successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (project && open) {
      setFormData({
        projectName: project.projectName || '',
        clientName: project.clientName || '',
        projectType: project.projectType || '',
        status: project.status || 'Active',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        budget: project.budget?.toString() || '',
        description: project.description || '',
        assignedEmployees: project.assignedEmployees || [],
        technologies: project.technologies || [],
        customTechnology: '',
        projectImage: project.projectImage || ''
      });
      setImagePreview(project.projectImage || null);
    } else if (!project && open) {
      setFormData({
        projectName: '',
        clientName: '',
        projectType: '',
        status: 'Active',
        startDate: '',
        endDate: '',
        budget: '',
        description: '',
        assignedEmployees: [],
        technologies: [],
        customTechnology: '',
        projectImage: ''
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [project, open]);
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="projectType">Project Type</Label>
            <Input
              id="projectType"
              value={formData.projectType}
              onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Project Image Upload */}
            <div>
              <Label htmlFor="projectImage">Project Image</Label>
              <div className="mt-2">
                {imagePreview || (project?.projectImage && formData.projectImage) ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || formData.projectImage}
                      alt="Project preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-dashed border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <Label htmlFor="imageInput" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload project image
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, GIF, WebP, BMP, SVG up to 5MB
                        </span>
                      </Label>
                      <Input
                        id="imageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
                {!imagePreview && !(project?.projectImage && formData.projectImage) && (
                  <div className="mt-2">
                    <Label htmlFor="imageInput">
                      <Button type="button" variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                    </Label>
                    <Input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label>Assigned Employees</Label>
            {employees.map(employee => (
              <div key={employee.id} className="flex items-center space-x-2">
                <Input
                  type="checkbox"
                  id={`employee-${employee.id}`}
                  checked={formData.assignedEmployees.includes(employee.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => {
                      let updatedEmployees = [...prev.assignedEmployees];
                      if (checked) {
                        updatedEmployees.push(employee.id);
                      } else {
                        updatedEmployees = updatedEmployees.filter(id => id !== employee.id);
                      }
                      return { ...prev, assignedEmployees: updatedEmployees };
                    });
                  }}
                />
                <Label htmlFor={`employee-${employee.id}`}>{employee.name}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label>Technologies</Label>
            {technologies.map(tech => (
              <div key={tech.id} className="flex items-center space-x-2">
                <Input
                  type="checkbox"
                  id={`tech-${tech.id}`}
                  checked={formData.technologies.includes(tech.name)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => {
                      let updatedTech = [...prev.technologies];
                      if (checked) {
                        updatedTech.push(tech.name);
                      } else {
                        updatedTech = updatedTech.filter(name => name !== tech.name);
                      }
                      return { ...prev, technologies: updatedTech };
                    });
                  }}
                />
                <Label htmlFor={`tech-${tech.id}`}>{tech.name}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="text"
                placeholder="Custom Technology"
                value={formData.customTechnology}
                onChange={(e) => setFormData(prev => ({ ...prev, customTechnology: e.target.value }))}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (formData.customTechnology.trim() !== '') {
                    setFormData(prev => ({
                      ...prev,
                      technologies: [...prev.technologies, formData.customTechnology.trim()],
                      customTechnology: ''
                    }));
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap mt-2">
                {formData.technologies.map(tech => (
                  <Badge key={tech} className="mr-2 mb-2">
                    {tech}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          technologies: prev.technologies.filter(t => t !== tech)
                        }));
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              Saving...
            </>
          ) : (
            project ? "Update Project" : "Create Project"
          )}
        </Button>
      </form>
    </DialogContent>
  );
}