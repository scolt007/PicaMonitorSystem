import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { insertPicaSchema } from "@shared/schema";

// Extend the schema with form-specific validation
const formSchema = insertPicaSchema.extend({
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type FormValues = z.infer<typeof formSchema>;

const NewPica: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch project sites for dropdown
  const { data: projectSites, isLoading: sitesLoading } = useQuery({
    queryKey: ["/api/project-sites"],
  });

  // Fetch people for dropdown
  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["/api/people"],
  });

  const [selectedProjectSite, setSelectedProjectSite] = useState<string>("");

  // Generate PICA ID based on selected project site
  const generatePicaId = (siteCode: string) => {
    // Generate a date-based ID: MMYY + SiteCode + Sequential Number
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    
    // For demo purposes, use a random number between 1-99 
    // In a real app, you'd query existing IDs to find the next available number
    const sequentialNumber = Math.floor(Math.random() * 99) + 1;
    
    return `${month}${year}${siteCode}${String(sequentialNumber).padStart(2, "0")}`;
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      picaId: "",
      projectSiteId: 0,
      date: new Date().toISOString().slice(0, 10),
      issue: "",
      problemIdentification: "",
      correctiveAction: "",
      personInChargeId: 0,
      dueDate: "",
      status: "progress",
    },
  });

  // Handle project site selection
  const handleProjectSiteChange = (value: string) => {
    setSelectedProjectSite(value);
    
    const site = projectSites?.find((site: any) => site.id.toString() === value);
    if (site) {
      const picaId = generatePicaId(site.code);
      form.setValue("picaId", picaId);
      form.setValue("projectSiteId", parseInt(value));
    }
  };

  // Create PICA mutation
  const createPica = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/picas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/picas/stats"] });
      toast({
        title: "Success",
        description: "PICA created successfully",
      });
      form.reset();
      setSelectedProjectSite("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create PICA",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createPica.mutate(data);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">NEW PICA</h1>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="bg-primary text-white px-4 py-2 font-medium">PROJECT</div>
                  <div className="border border-gray-300 px-4 py-2">
                    <FormField
                      control={form.control}
                      name="projectSiteId"
                      render={({ field }) => (
                        <Select
                          disabled={sitesLoading}
                          value={selectedProjectSite}
                          onValueChange={handleProjectSiteChange}
                        >
                          <SelectTrigger className="w-full bg-transparent focus:outline-none border-0 p-0 shadow-none">
                            <SelectValue placeholder="Select project site" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectSites?.map((site: any) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <div className="bg-primary text-white px-4 py-2 font-medium">ID</div>
                  <div className="border border-gray-300 px-4 py-2">
                    <FormField
                      control={form.control}
                      name="picaId"
                      render={({ field }) => (
                        <Input
                          {...field}
                          className="w-full focus:outline-none border-0 p-0 shadow-none"
                          readOnly
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Pica ID</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Date</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Issue</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Problem Identification</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Corrective Action (Task)</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">PIC</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-100">
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="picaId"
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="w-full bg-transparent border-0 p-0 shadow-none"
                              readOnly
                            />
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="date"
                              className="w-full bg-transparent border-0 p-0 shadow-none"
                            />
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="issue"
                          render={({ field }) => (
                            <Input
                              {...field}
                              className="w-full bg-transparent border-0 p-0 shadow-none"
                              placeholder="Enter issue"
                            />
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="problemIdentification"
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              className="w-full bg-transparent border-0 p-0 shadow-none resize-none"
                              placeholder="Enter problem"
                              rows={1}
                            />
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="correctiveAction"
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              className="w-full bg-transparent border-0 p-0 shadow-none resize-none"
                              placeholder="Enter corrective action"
                              rows={1}
                            />
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="personInChargeId"
                          render={({ field }) => (
                            <Select
                              disabled={peopleLoading}
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <SelectTrigger className="w-full bg-transparent border-0 p-0 shadow-none">
                                <SelectValue placeholder="Select PIC" />
                              </SelectTrigger>
                              <SelectContent>
                                {people?.map((person: any) => (
                                  <SelectItem key={person.id} value={person.id.toString()}>
                                    {person.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-gray-300 text-sm">
                        <FormField
                          control={form.control}
                          name="dueDate"
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="date"
                              className="w-full bg-transparent border-0 p-0 shadow-none"
                            />
                          )}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-8 rounded"
                  disabled={createPica.isPending}
                >
                  {createPica.isPending ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewPica;
