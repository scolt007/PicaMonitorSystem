import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPicaSchema, insertPersonSchema, insertDepartmentSchema, insertProjectSiteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = '/api';
  
  // --- PICA Routes ---
  // Get all PICAs with relations
  app.get(`${apiPrefix}/picas`, async (req, res) => {
    try {
      const picas = await storage.getPicasWithRelations();
      res.json(picas);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICAs" });
    }
  });

  // Get PICAs by status
  app.get(`${apiPrefix}/picas/status/:status`, async (req, res) => {
    try {
      const { status } = req.params;
      const validStatuses = ["progress", "complete", "overdue"];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const picas = await storage.getPicasByStatus(status);
      res.json(picas);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICAs by status" });
    }
  });

  // Get PICA statistics
  app.get(`${apiPrefix}/picas/stats`, async (req, res) => {
    try {
      const stats = await storage.countPicasByStatus();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA statistics" });
    }
  });

  // Get PICA statistics by department
  app.get(`${apiPrefix}/picas/stats/department`, async (req, res) => {
    try {
      const stats = await storage.countPicasByDepartment();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA department statistics" });
    }
  });

  // Get PICA statistics by project site
  app.get(`${apiPrefix}/picas/stats/site`, async (req, res) => {
    try {
      const stats = await storage.countPicasByProjectSite();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA project site statistics" });
    }
  });

  // Get a single PICA by ID
  app.get(`${apiPrefix}/picas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const pica = await storage.getPica(id);
      if (!pica) {
        return res.status(404).json({ message: "PICA not found" });
      }
      
      res.json(pica);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA" });
    }
  });

  // Create a new PICA
  app.post(`${apiPrefix}/picas`, async (req, res) => {
    try {
      const picaData = insertPicaSchema.parse(req.body);
      const pica = await storage.createPica(picaData);
      res.status(201).json(pica);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid PICA data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create PICA" });
    }
  });

  // Update a PICA
  app.put(`${apiPrefix}/picas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const picaData = insertPicaSchema.partial().parse(req.body);
      const updatedPica = await storage.updatePica(id, picaData);
      
      if (!updatedPica) {
        return res.status(404).json({ message: "PICA not found" });
      }
      
      res.json(updatedPica);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid PICA data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update PICA" });
    }
  });

  // Delete a PICA
  app.delete(`${apiPrefix}/picas/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deletePica(id);
      if (!success) {
        return res.status(404).json({ message: "PICA not found" });
      }
      
      res.json({ message: "PICA deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete PICA" });
    }
  });

  // --- People (PIC) Routes ---
  // Get all people
  app.get(`${apiPrefix}/people`, async (req, res) => {
    try {
      const people = await storage.getAllPeople();
      res.json(people);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve people" });
    }
  });

  // Get a single person
  app.get(`${apiPrefix}/people/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const person = await storage.getPerson(id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(person);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve person" });
    }
  });

  // Create a new person
  app.post(`${apiPrefix}/people`, async (req, res) => {
    try {
      const personData = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson(personData);
      res.status(201).json(person);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create person" });
    }
  });

  // Update a person
  app.put(`${apiPrefix}/people/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const personData = insertPersonSchema.partial().parse(req.body);
      const updatedPerson = await storage.updatePerson(id, personData);
      
      if (!updatedPerson) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json(updatedPerson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid person data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update person" });
    }
  });

  // Delete a person
  app.delete(`${apiPrefix}/people/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deletePerson(id);
      if (!success) {
        return res.status(404).json({ message: "Person not found" });
      }
      
      res.json({ message: "Person deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // --- Department Routes ---
  // Get all departments
  app.get(`${apiPrefix}/departments`, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve departments" });
    }
  });

  // Get a single department
  app.get(`${apiPrefix}/departments/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve department" });
    }
  });

  // Create a new department
  app.post(`${apiPrefix}/departments`, async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Update a department
  app.put(`${apiPrefix}/departments/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const updatedDepartment = await storage.updateDepartment(id, departmentData);
      
      if (!updatedDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(updatedDepartment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  // Delete a department
  app.delete(`${apiPrefix}/departments/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteDepartment(id);
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // --- Project Site Routes ---
  // Get all project sites
  app.get(`${apiPrefix}/project-sites`, async (req, res) => {
    try {
      const projectSites = await storage.getAllProjectSites();
      res.json(projectSites);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve project sites" });
    }
  });

  // Get a single project site
  app.get(`${apiPrefix}/project-sites/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const projectSite = await storage.getProjectSite(id);
      if (!projectSite) {
        return res.status(404).json({ message: "Project site not found" });
      }
      
      res.json(projectSite);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve project site" });
    }
  });

  // Create a new project site
  app.post(`${apiPrefix}/project-sites`, async (req, res) => {
    try {
      const projectSiteData = insertProjectSiteSchema.parse(req.body);
      const projectSite = await storage.createProjectSite(projectSiteData);
      res.status(201).json(projectSite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project site data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project site" });
    }
  });

  // Update a project site
  app.put(`${apiPrefix}/project-sites/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const projectSiteData = insertProjectSiteSchema.partial().parse(req.body);
      const updatedProjectSite = await storage.updateProjectSite(id, projectSiteData);
      
      if (!updatedProjectSite) {
        return res.status(404).json({ message: "Project site not found" });
      }
      
      res.json(updatedProjectSite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project site data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project site" });
    }
  });

  // Delete a project site
  app.delete(`${apiPrefix}/project-sites/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteProjectSite(id);
      if (!success) {
        return res.status(404).json({ message: "Project site not found" });
      }
      
      res.json({ message: "Project site deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project site" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
