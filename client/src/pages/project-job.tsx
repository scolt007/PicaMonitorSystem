import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, invalidateRelatedQueries } from "@/lib/queryClient";
import { z } from "zod";
import { insertProjectSiteSchema } from "@shared/schema";

// Modify schema to ensure location is always a string (not null)
const formSchema = insertProjectSiteSchema.extend({
  managerId: z.number().nullable(),
  location: z.string().optional(),  // Ensure location is a string or undefined (not null)
});

type FormValues = z.infer<typeof formSchema>;
type ProjectSite = {
  id: number;
  code: string;
  name: string;
  location: string | null;
  managerId: number | null;
};

type Person = {
  id: number;
  name: string;
};

const ProjectJob: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProjectSite | null>(null);

  // Fetch project jobs
  const { data: projectSites, isLoading } = useQuery<ProjectSite[]>({
    queryKey: ["/api/project-sites"],
  });

  // Fetch people for manager selection
  const { data: people } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  // Form for creating/editing project jobs
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      location: "",
      managerId: null,
    },
    mode: "onChange", // Validate on change
  });

  // Create project job mutation
  const createProjectSite = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/project-sites", data);
    },
    onSuccess: () => {
      // Invalidate project jobs and related PICA data
      invalidateRelatedQueries('project-sites');
      toast({
        title: "Success",
        description: "Project job created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project job",
        variant: "destructive",
      });
    },
  });

  // Update project job mutation
  const updateProjectSite = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!selectedJob) throw new Error("No project job selected");
      return apiRequest("PUT", `/api/project-sites/${selectedJob.id}`, data);
    },
    onSuccess: () => {
      // Invalidate project jobs and related PICA data
      invalidateRelatedQueries('project-sites', selectedJob?.id);
      toast({
        title: "Success",
        description: "Project job updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project job",
        variant: "destructive",
      });
    },
  });

  // Delete project job mutation
  const deleteProjectSite = useMutation({
    mutationFn: async () => {
      if (!selectedJob) throw new Error("No project job selected");
      return apiRequest("DELETE", `/api/project-sites/${selectedJob.id}`, undefined);
    },
    onSuccess: () => {
      // Invalidate project jobs and related PICA data
      invalidateRelatedQueries('project-sites');
      toast({
        title: "Success",
        description: "Project job deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project job",
        variant: "destructive",
      });
    },
  });

  // Handle add button click
  const handleAdd = () => {
    form.reset({
      code: "",
      name: "",
      location: "",
      managerId: null,
    });
    setIsAddDialogOpen(true);
  };

  // Handle edit button click
  const handleEdit = (site: ProjectSite) => {
    setSelectedJob(site);
    form.reset({
      code: site.code,
      name: site.name,
      location: site.location || "",
      managerId: site.managerId,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (site: ProjectSite) => {
    setSelectedJob(site);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission for creating
  const onSubmitCreate = (data: FormValues) => {
    createProjectSite.mutate(data);
  };

  // Handle form submission for editing
  const onSubmitEdit = (data: FormValues) => {
    updateProjectSite.mutate(data);
  };

  // Find manager name by ID
  const getManagerName = (managerId: number | null) => {
    if (!managerId) return "-";
    const person = people?.find((p) => p.id === managerId);
    return person ? person.name : "-";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Project Job</h1>
      </div>

      <Card className="shadow">
        <CardContent className="p-6">
          <div className="mb-4">
            <Button
              className="bg-primary hover:bg-blue-700 text-white font-medium"
              onClick={handleAdd}
            >
              Add New Project Job
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">ID</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Job Name</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Location</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Job Manager</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Show skeleton while loading
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                    </tr>
                  ))
                ) : projectSites && projectSites.length > 0 ? (
                  // Show project jobs data
                  projectSites.map((site, index) => (
                    <tr key={site.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm">{site.code}</td>
                      <td className="py-2 px-4 border-b text-sm">{site.name}</td>
                      <td className="py-2 px-4 border-b text-sm">{site.location || "-"}</td>
                      <td className="py-2 px-4 border-b text-sm">{getManagerName(site.managerId)}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(site)}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(site)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Show no data message
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                      No project jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Project Job Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project Job</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter job code (e.g., KMP-NPR)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter job name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Manager</FormLabel>
                    <FormControl>
                      <select 
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value === null ? "null" : field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "null" ? null : parseInt(value));
                        }}
                      >
                        <option value="null">None</option>
                        {people && people.map((person) => (
                          <option key={person.id} value={person.id.toString()}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectSite.isPending}>
                  {createProjectSite.isPending ? "Adding..." : "Add Project Job"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project Job</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter job code (e.g., KMP-NPR)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter job name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Manager</FormLabel>
                    <FormControl>
                      <select 
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value === null ? "null" : field.value?.toString() || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "null" ? null : parseInt(value));
                        }}
                      >
                        <option value="null">None</option>
                        {people && people.map((person) => (
                          <option key={person.id} value={person.id.toString()}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProjectSite.isPending}>
                  {updateProjectSite.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this project job?</p>
            <p className="text-gray-500 text-sm mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              onClick={() => deleteProjectSite.mutate()}
              disabled={deleteProjectSite.isPending}
            >
              {deleteProjectSite.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectJob;
