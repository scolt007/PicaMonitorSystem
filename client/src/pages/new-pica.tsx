import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import { insertPicaSchema } from "@shared/schema";
import { Plus, Trash2 } from "lucide-react";

// Create a single PICA line item schema
const picaLineItemSchema = z.object({
  sequence: z.number(),
  issue: z.string().min(1, "Issue is required"),
  problemIdentification: z.string().min(1, "Problem identification is required"),
  correctiveAction: z.string().min(1, "Corrective action is required"),
  personInChargeId: z.number().min(1, "Person in charge is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

// Extend the schema with form-specific validation
const formSchema = z.object({
  projectSiteId: z.number().min(1, "Project site is required"),
  masterPicaId: z.string().min(1, "Master PICA ID is required"),
  date: z.string().min(1, "Date is required"),
  picaItems: z.array(picaLineItemSchema).min(1, "At least one PICA item is required"),
});

type FormValues = z.infer<typeof formSchema>;

const NewPica: React.FC = () => {
  const { toast } = useToast();
  
  // Define types for project sites and people
  type ProjectSite = {
    id: number;
    code: string;
    name: string;
    location?: string;
  };

  type Person = {
    id: number;
    name: string;
    email?: string;
  };

  // Fetch project sites for dropdown
  const { data: projectSites, isLoading: sitesLoading } = useQuery<ProjectSite[]>({
    queryKey: ["/api/project-sites"],
  });

  // Fetch people for dropdown
  const { data: people, isLoading: peopleLoading } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const [selectedProjectSite, setSelectedProjectSite] = useState<string>("");
  const [masterPicaId, setMasterPicaId] = useState<string>("");

  // Fetch existing PICAs to check latest sequence numbers
  const { data: existingPicas } = useQuery<any[]>({
    queryKey: ["/api/picas"],
  });

  // Generate Master PICA ID based on selected project site
  const generateMasterPicaId = (siteCode: string) => {
    // Generate a date-based ID: MMYY + SiteCode
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    
    return `${month}${year}${siteCode}`;
  };

  // Generate PICA ID for a specific item
  const generatePicaId = (masterPicaId: string, sequence: number) => {
    return `${masterPicaId}${String(sequence).padStart(2, "0")}`;
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectSiteId: 0,
      masterPicaId: "",
      date: new Date().toISOString().slice(0, 10),
      picaItems: [
        {
          sequence: 1,
          issue: "",
          problemIdentification: "",
          correctiveAction: "",
          personInChargeId: 0,
          dueDate: new Date().toISOString().slice(0, 10),
        },
      ],
    },
  });

  // Create field array for PICA items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "picaItems",
  });

  // Handle project site selection
  const handleProjectSiteChange = (value: string) => {
    setSelectedProjectSite(value);
    
    if (projectSites && projectSites.length > 0) {
      const site = projectSites.find((site) => site.id.toString() === value);
      if (site) {
        // Generate base master PICA ID
        const baseMasterPicaId = generateMasterPicaId(site.code);
        
        // Check for existing PICAs with the same base ID
        let highestSequence = 0;
        let suffixCounter = 0;
        
        if (existingPicas && existingPicas.length > 0) {
          // Extract PICAs with the same base ID format (MMYY + site.code)
          const now = new Date();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const year = String(now.getFullYear()).slice(-2);
          const baseIdPattern = `${month}${year}${site.code}`;
          
          // Find existing PICAs that match the pattern
          const relatedPicas = existingPicas.filter(pica => 
            pica.picaId.startsWith(baseIdPattern) || 
            pica.picaId.startsWith(`${baseIdPattern}-`)
          );
          
          // Check if we need to add a suffix
          if (relatedPicas.length > 0) {
            // Get all used suffixes like -1, -2, etc.
            const usedSuffixes = relatedPicas
              .map(pica => {
                const match = pica.picaId.match(new RegExp(`^${baseIdPattern}(?:-([0-9]+))?`));
                return match && match[1] ? parseInt(match[1]) : 0;
              })
              .filter(suffix => suffix !== null);
            
            // If we have any base IDs without a suffix (suffix === 0), increment the counter
            if (usedSuffixes.includes(0)) {
              suffixCounter = Math.max(...usedSuffixes) + 1;
            }
            
            // Get the highest sequence number used across all related PICAs
            highestSequence = relatedPicas.reduce((max, pica) => {
              const seq = parseInt(pica.picaId.slice(-2));
              return isNaN(seq) ? max : Math.max(max, seq);
            }, 0);
          }
        }
        
        // Add suffix if needed
        const newMasterPicaId = suffixCounter > 0 
          ? `${baseMasterPicaId}-${suffixCounter}` 
          : baseMasterPicaId;
        
        setMasterPicaId(newMasterPicaId);
        form.setValue("masterPicaId", newMasterPicaId);
        form.setValue("projectSiteId", parseInt(value));
        
        // Update the sequence numbers for existing fields
        if (highestSequence > 0) {
          const updatedFields = fields.map((field, index) => ({
            ...field,
            sequence: highestSequence + index + 1
          }));
          
          // Update each field's sequence in the form
          updatedFields.forEach((field, index) => {
            form.setValue(`picaItems.${index}.sequence`, field.sequence);
          });
        }
      }
    }
  };

  // Add a new PICA item row
  const handleAddPicaItem = () => {
    // Get the last sequence number from existing fields
    const lastSequence = fields.length > 0 
      ? form.getValues(`picaItems.${fields.length - 1}.sequence`) 
      : 0;
    
    append({
      sequence: lastSequence + 1,
      issue: "",
      problemIdentification: "",
      correctiveAction: "",
      personInChargeId: 0,
      dueDate: new Date().toISOString().slice(0, 10),
    });
  };

  // Create PICA mutation
  const createPica = useMutation({
    mutationFn: async (data: any) => {
      // We'll create multiple PICA entries, one for each item
      const promises = data.picaItems.map((item: any, index: number) => {
        const picaId = generatePicaId(data.masterPicaId, item.sequence);
        
        const picaData = {
          picaId,
          projectSiteId: data.projectSiteId,
          date: data.date,
          issue: item.issue,
          problemIdentification: item.problemIdentification,
          correctiveAction: item.correctiveAction,
          personInChargeId: item.personInChargeId,
          dueDate: item.dueDate,
          status: "progress",
        };
        
        return apiRequest("POST", "/api/picas", picaData);
      });
      
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/picas/stats"] });
      toast({
        title: "Success",
        description: "PICA(s) created successfully",
      });
      form.reset({
        projectSiteId: 0,
        masterPicaId: "",
        date: new Date().toISOString().slice(0, 10),
        picaItems: [
          {
            sequence: 1,
            issue: "",
            problemIdentification: "",
            correctiveAction: "",
            personInChargeId: 0,
            dueDate: new Date().toISOString().slice(0, 10),
          },
        ],
      });
      setSelectedProjectSite("");
      setMasterPicaId("");
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
                        <FormItem>
                          <FormControl>
                            <select
                              className="w-full bg-transparent focus:outline-none border-0 p-0 shadow-none"
                              disabled={sitesLoading}
                              value={selectedProjectSite}
                              onChange={(e) => handleProjectSiteChange(e.target.value)}
                            >
                              <option value="">Select project site</option>
                              {projectSites && projectSites.length > 0 && projectSites.map((site) => (
                                <option key={site.id} value={site.id.toString()}>
                                  {site.code}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <div className="bg-primary text-white px-4 py-2 font-medium">MASTER ID</div>
                  <div className="border border-gray-300 px-4 py-2">
                    <FormField
                      control={form.control}
                      name="masterPicaId"
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
                <div>
                  <div className="bg-primary text-white px-4 py-2 font-medium">DATE</div>
                  <div className="border border-gray-300 px-4 py-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="date"
                          className="w-full focus:outline-none border-0 p-0 shadow-none"
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
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Issue</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Problem Identification</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Corrective Action (Task)</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">PIC</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Due Date</th>
                      <th className="py-2 px-4 bg-primary text-white text-left text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                        <td className="py-2 px-4 border-b border-gray-300 text-sm">
                          {masterPicaId && (
                            <div className="font-medium">{generatePicaId(masterPicaId, field.sequence)}</div>
                          )}
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300 text-sm">
                          <FormField
                            control={form.control}
                            name={`picaItems.${index}.issue`}
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
                            name={`picaItems.${index}.problemIdentification`}
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
                            name={`picaItems.${index}.correctiveAction`}
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
                            name={`picaItems.${index}.personInChargeId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <select
                                    className="w-full bg-transparent border-0 p-0 shadow-none"
                                    disabled={peopleLoading}
                                    value={field.value === 0 ? "" : field.value.toString()}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(value ? parseInt(value) : 0);
                                    }}
                                  >
                                    <option value="">Select PIC</option>
                                    {people && people.length > 0 && people.map((person) => (
                                      <option key={person.id} value={person.id.toString()}>
                                        {person.name}
                                      </option>
                                    ))}
                                  </select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="py-2 px-4 border-b border-gray-300 text-sm">
                          <FormField
                            control={form.control}
                            name={`picaItems.${index}.dueDate`}
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
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-800 p-0"
                            >
                              <Trash2 size={18} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPicaItem}
                  className="flex items-center"
                  disabled={!selectedProjectSite}
                >
                  <Plus size={18} className="mr-2" />
                  Add Another PICA Item
                </Button>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-8 rounded"
                  disabled={createPica.isPending || !selectedProjectSite}
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
