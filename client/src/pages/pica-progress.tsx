import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PicaWithRelations } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PicaFilterButtons from "@/components/PicaFilterButtons";
import StatusBadge from "@/components/StatusBadge";

const PicaProgress: React.FC = () => {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPica, setSelectedPica] = useState<PicaWithRelations | null>(null);
  const itemsPerPage = 10;

  // Fetch PICAs
  const { data: allPicas, isLoading } = useQuery<PicaWithRelations[]>({
    queryKey: ["/api/picas"],
  });

  // Fetch people for edit form
  const { data: people } = useQuery({
    queryKey: ["/api/people"],
  });

  // Filter PICAs based on the active filter
  const filteredPicas = React.useMemo(() => {
    if (!allPicas) return [];
    if (activeFilter === "all") return allPicas;
    return allPicas.filter((pica) => pica.status === activeFilter);
  }, [allPicas, activeFilter]);

  // Paginate PICAs
  const paginatedPicas = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPicas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPicas, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredPicas.length / itemsPerPage);

  // Edit PICA schema
  const editPicaSchema = z.object({
    correctiveAction: z.string().min(1, "Required"),
    personInChargeId: z.number().min(1, "Required"),
    dueDate: z.string().min(1, "Required"),
    status: z.string().min(1, "Required"),
  });

  type EditPicaFormValues = z.infer<typeof editPicaSchema>;

  // Edit PICA form
  const form = useForm<EditPicaFormValues>({
    resolver: zodResolver(editPicaSchema),
    defaultValues: {
      correctiveAction: "",
      personInChargeId: 0,
      dueDate: "",
      status: "",
    },
  });

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Update PICA mutation
  const updatePica = useMutation({
    mutationFn: async (data: EditPicaFormValues) => {
      if (!selectedPica) throw new Error("No PICA selected");
      return apiRequest("PUT", `/api/picas/${selectedPica.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/picas/stats"] });
      toast({
        title: "Success",
        description: "PICA updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update PICA",
        variant: "destructive",
      });
    },
  });

  // Delete PICA mutation
  const deletePica = useMutation({
    mutationFn: async () => {
      if (!selectedPica) throw new Error("No PICA selected");
      return apiRequest("DELETE", `/api/picas/${selectedPica.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/picas/stats"] });
      toast({
        title: "Success",
        description: "PICA deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete PICA",
        variant: "destructive",
      });
    },
  });

  // Handle edit button click
  const handleEdit = (pica: PicaWithRelations) => {
    setSelectedPica(pica);
    form.reset({
      correctiveAction: pica.correctiveAction,
      personInChargeId: pica.personInChargeId,
      dueDate: pica.dueDate.split('T')[0], // Format date to YYYY-MM-DD
      status: pica.status,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (pica: PicaWithRelations) => {
    setSelectedPica(pica);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: EditPicaFormValues) => {
    updatePica.mutate(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">PICA Progress</h1>
      </div>

      <Card className="shadow">
        <CardContent className="p-6">
          <div className="mb-6">
            <PicaFilterButtons
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">ID</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Date</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Site</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Issue</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Corrective Action</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">PIC</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Due Date</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Status</th>
                  <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Show skeleton while loading
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-20" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-48" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-2 px-4 border-b text-sm"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))
                ) : paginatedPicas.length > 0 ? (
                  // Show PICA data
                  paginatedPicas.map((pica, index) => (
                    <tr key={pica.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="py-2 px-4 border-b text-sm">{pica.picaId}</td>
                      <td className="py-2 px-4 border-b text-sm">{formatDate(pica.date)}</td>
                      <td className="py-2 px-4 border-b text-sm">{pica.projectSite.code}</td>
                      <td className="py-2 px-4 border-b text-sm">{pica.issue}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        {pica.correctiveAction.length > 50
                          ? `${pica.correctiveAction.substring(0, 50)}...`
                          : pica.correctiveAction}
                      </td>
                      <td className="py-2 px-4 border-b text-sm">{pica.personInCharge.name}</td>
                      <td className="py-2 px-4 border-b text-sm">{formatDate(pica.dueDate)}</td>
                      <td className="py-2 px-4 border-b text-sm">
                        <StatusBadge status={pica.status} />
                      </td>
                      <td className="py-2 px-4 border-b text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(pica)}
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(pica)}
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
                    <td colSpan={9} className="py-4 text-center text-sm text-gray-500">
                      No PICA records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  className="px-2 py-1 text-gray-500 disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                  return (
                    <button
                      key={pageNumber}
                      className={`px-2 py-1 ${
                        pageNumber === currentPage
                          ? "bg-primary text-white rounded"
                          : "text-gray-700 hover:bg-gray-100 rounded"
                      }`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  className="px-2 py-1 text-gray-500 disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit PICA Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit PICA</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="correctiveAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corrective Action</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personInChargeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person In Charge</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {people?.map((person: any) => (
                          <SelectItem key={person.id} value={person.id.toString()}>
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="progress">Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
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
                <Button type="submit" disabled={updatePica.isPending}>
                  {updatePica.isPending ? "Saving..." : "Save Changes"}
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
            Are you sure you want to delete PICA <strong>{selectedPica?.picaId}</strong>? This action cannot be undone.
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
              onClick={() => deletePica.mutate()}
              disabled={deletePica.isPending}
            >
              {deletePica.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PicaProgress;
