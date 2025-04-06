import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { insertPersonSchema } from "@shared/schema";

const formSchema = insertPersonSchema.extend({
  departmentId: z.number().nullable(),
  position: z.string().optional(), // Add position field
});

type FormValues = z.infer<typeof formSchema>;
type Person = {
  id: number;
  name: string;
  email: string;
  departmentId: number | null;
  position?: string;
};

type Department = {
  id: number;
  name: string;
  position?: string;
};

const PersonInCharge: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Fetch people
  const { data: people, isLoading } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  // Fetch departments for the select input
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Update selected department when department ID changes
  useEffect(() => {
    if (selectedDepartmentId && departments) {
      const department = departments.find(d => d.id === selectedDepartmentId);
      setSelectedDepartment(department || null);
    } else {
      setSelectedDepartment(null);
    }
  }, [selectedDepartmentId, departments]);

  // Form for creating/editing people
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      departmentId: null,
      position: "",
    },
  });
  
  // Watch departmentId field to update selectedDepartmentId
  const watchedDepartmentId = form.watch("departmentId");
  
  useEffect(() => {
    setSelectedDepartmentId(watchedDepartmentId);
  }, [watchedDepartmentId]);

  // Create person mutation
  const createPerson = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/people", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({
        title: "Success",
        description: "Person created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create person",
        variant: "destructive",
      });
    },
  });

  // Update person mutation
  const updatePerson = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!selectedPerson) throw new Error("No person selected");
      return apiRequest("PUT", `/api/people/${selectedPerson.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update person",
        variant: "destructive",
      });
    },
  });

  // Delete person mutation
  const deletePerson = useMutation({
    mutationFn: async () => {
      if (!selectedPerson) throw new Error("No person selected");
      return apiRequest("DELETE", `/api/people/${selectedPerson.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      toast({
        title: "Success",
        description: "Person deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive",
      });
    },
  });

  // Handle add button click
  const handleAdd = () => {
    form.reset({
      name: "",
      email: "",
      departmentId: null,
      position: "",
    });
    setIsAddDialogOpen(true);
  };

  // Handle edit button click
  const handleEdit = (person: Person) => {
    setSelectedPerson(person);
    form.reset({
      name: person.name,
      email: person.email,
      departmentId: person.departmentId,
      position: person.position || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (person: Person) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission for creating
  const onSubmitCreate = (data: FormValues) => {
    createPerson.mutate(data);
  };

  // Handle form submission for editing
  const onSubmitEdit = (data: FormValues) => {
    updatePerson.mutate(data);
  };

  // Find department name by ID
  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "-";
    const department = departments?.find((d) => d.id === departmentId);
    return department ? department.name : "-";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Person In Charge</h1>
      </div>

      <Card className="shadow">
        <CardContent className="p-6">
          <div className="mb-4">
            <Button
              className="bg-primary hover:bg-blue-700 text-white font-medium"
              onClick={handleAdd}
            >
              Add New PIC
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">ID</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Name</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Department</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Email</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Show skeleton while loading
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-48" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                    </tr>
                  ))
                ) : people && people.length > 0 ? (
                  // Show people data
                  people.map((person, index) => (
                    <tr key={person.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm">PIC{String(person.id).padStart(3, '0')}</td>
                      <td className="py-2 px-4 border-b text-sm">{person.name}</td>
                      <td className="py-2 px-4 border-b text-sm">{getDepartmentName(person.departmentId)}</td>
                      <td className="py-2 px-4 border-b text-sm">{person.email}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(person)}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(person)}
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
                      No person in charge found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Person Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Person In Charge</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter name" />
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
                      <Input {...field} placeholder="Enter email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {departments?.map((department) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedDepartmentId && (
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter position in department" 
                          defaultValue={selectedDepartment?.position || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPerson.isPending}>
                  {createPerson.isPending ? "Adding..." : "Add Person"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Person In Charge</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter name" />
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
                      <Input {...field} placeholder="Enter email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">None</SelectItem>
                        {departments?.map((department) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedDepartmentId && (
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter position in department" 
                          defaultValue={selectedDepartment?.position || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePerson.isPending}>
                  {updatePerson.isPending ? "Saving..." : "Save Changes"}
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
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete <strong>{selectedPerson?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePerson.mutate()}
              disabled={deletePerson.isPending}
            >
              {deletePerson.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonInCharge;
