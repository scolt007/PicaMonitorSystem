import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPicaSchema, insertPersonSchema, insertDepartmentSchema, insertProjectSiteSchema, insertUserSchema } from "@shared/schema";
import { setupAuth, canEdit, canDelete } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // API prefix
  const apiPrefix = '/api';
  
  // --- PICA Routes ---
  // Get all PICAs with relations (public can view)
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

  // Create a new PICA (requires edit permission)
  app.post(`${apiPrefix}/picas`, canEdit, async (req, res) => {
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

  // Update a PICA (requires edit permission)
  app.put(`${apiPrefix}/picas/:id`, canEdit, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Extract comment and updateDate from the request if present
      const { comment, updateDate, ...restData } = req.body;
      
      // Create a copy of the data to be updated with type assertion
      let picaData: any = { ...insertPicaSchema.partial().parse(restData) };
      
      // If updateDate is provided, use it to set the updatedAt field
      if (updateDate) {
        picaData.updatedAt = new Date(updateDate);
      } else {
        // Otherwise use current date (this is already handled by the storage layer)
        picaData.updatedAt = new Date();
      }
      
      // Pass the history comment if provided
      const updatedPica = await storage.updatePica(id, picaData, comment);
      
      if (!updatedPica) {
        return res.status(404).json({ message: "PICA not found" });
      }
      
      res.json(updatedPica);
    } catch (error) {
      console.error("Error updating PICA:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid PICA data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update PICA" });
    }
  });
  
  // Get PICA history
  app.get(`${apiPrefix}/picas/:id/history`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const history = await storage.getPicaHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA history" });
    }
  });

  // Delete a PICA (requires delete permission)
  app.delete(`${apiPrefix}/picas/:id`, canDelete, async (req, res) => {
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

  // Create a new person (requires edit permission)
  app.post(`${apiPrefix}/people`, canEdit, async (req, res) => {
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

  // Update a person (requires edit permission)
  app.put(`${apiPrefix}/people/:id`, canEdit, async (req, res) => {
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

  // Delete a person (requires delete permission)
  app.delete(`${apiPrefix}/people/:id`, canDelete, async (req, res) => {
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

  // Create a new department (requires edit permission)
  app.post(`${apiPrefix}/departments`, canEdit, async (req, res) => {
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

  // Update a department (requires edit permission)
  app.put(`${apiPrefix}/departments/:id`, canEdit, async (req, res) => {
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

  // Delete a department (requires delete permission)
  app.delete(`${apiPrefix}/departments/:id`, canDelete, async (req, res) => {
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

  // Create a new project site (requires edit permission)
  app.post(`${apiPrefix}/project-sites`, canEdit, async (req, res) => {
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

  // Update a project site (requires edit permission)
  app.put(`${apiPrefix}/project-sites/:id`, canEdit, async (req, res) => {
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

  // Delete a project site (requires delete permission)
  app.delete(`${apiPrefix}/project-sites/:id`, canDelete, async (req, res) => {
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

  // --- User Management Routes ---
  // Get all users (admin only)
  app.get(`${apiPrefix}/users`, canDelete, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords to client
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });

  // Get a single user by ID (admin only)
  app.get(`${apiPrefix}/users/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user" });
    }
  });

  // Create a new user (admin only)
  app.post(`${apiPrefix}/users`, canDelete, async (req, res) => {
    try {
      // Create hash of password in auth.ts during registration, not here
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update a user (admin only)
  app.put(`${apiPrefix}/users/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      
      // Handle password update specially
      if (userData.password) {
        // Password should be hashed by auth handler before storage
        // This route should not allow password changes, use a separate endpoint
        delete userData.password;
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to client
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete a user (admin only)
  app.delete(`${apiPrefix}/users/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Prevent deleting self
      if (req.user && (req.user as Express.User).id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
