import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertPicaSchema,
  insertPersonSchema,
  insertDepartmentSchema,
  insertProjectSiteSchema,
  insertUserSchema,
  insertOrganizationSchema
} from "@shared/schema";
import { setupAuth, canEdit, canDelete, hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // API prefix
  const apiPrefix = '/api';
  
  // --- PICA Routes ---
  // Get all PICAs with relations (public can view)
  app.get(`${apiPrefix}/picas`, async (req, res) => {
    try {
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const picas = await storage.getPicasWithRelationsByOrganization(req.user.organizationId);
        return res.json(picas);
      }
      
      // If not authenticated or no organization ID, return empty array
      // This ensures organizations only see their own data
      const picas: any[] = [];
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
      
      // Filter by organization ID if user is authenticated
      let picas: any[];
      if (req.isAuthenticated() && req.user.organizationId) {
        // We need to filter the result by organization
        const allPicas = await storage.getPicasByStatus(status);
        picas = allPicas.filter(pica => pica.organizationId === req.user.organizationId);
      } else {
        // If not authenticated or no organization ID, return empty array for data isolation
        picas = [] as any[];
      }
      
      res.json(picas);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICAs by status" });
    }
  });

  // Get PICA statistics
  app.get(`${apiPrefix}/picas/stats`, async (req, res) => {
    try {
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const stats = await storage.countPicasByStatus(req.user.organizationId);
        return res.json(stats);
      }
      
      // If not authenticated or no organization ID, return empty stats
      const stats = await storage.countPicasByStatus();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA statistics" });
    }
  });

  // Get PICA statistics by department
  app.get(`${apiPrefix}/picas/stats/department`, async (req, res) => {
    try {
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const stats = await storage.countPicasByDepartment(req.user.organizationId);
        return res.json(stats);
      }
      
      // If not authenticated or no organization ID, return all stats
      const stats = await storage.countPicasByDepartment();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA department statistics" });
    }
  });

  // Get PICA statistics by project site
  app.get(`${apiPrefix}/picas/stats/site`, async (req, res) => {
    try {
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const stats = await storage.countPicasByProjectSite(req.user.organizationId);
        return res.json(stats);
      }
      
      // If not authenticated or no organization ID, return all stats
      const stats = await storage.countPicasByProjectSite();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA project site statistics" });
    }
  });
  
  // Get PICA statistics by job
  app.get(`${apiPrefix}/picas/stats/job`, async (req, res) => {
    try {
      // Fetch all PICAs and group them by project site with status counts
      if (req.isAuthenticated() && req.user.organizationId) {
        // Get the PICAs for this organization
        const picas = await storage.getPicasByOrganization(req.user.organizationId);
        // Get all project sites for this organization
        const projectSites = await storage.getProjectSitesByOrganization(req.user.organizationId);
        
        // Create a map to store job stats
        const jobStatsMap: Record<string, { job: string, progress: number, complete: number, overdue: number }> = {};
        
        // Initialize the map with all project sites
        projectSites.forEach(site => {
          jobStatsMap[site.code] = {
            job: site.code,
            progress: 0,
            complete: 0,
            overdue: 0
          };
        });
        
        // Count PICAs by site and status
        picas.forEach(pica => {
          // Find the site for this PICA
          const site = projectSites.find(site => site.id === pica.projectSiteId);
          if (site) {
            // Increment the appropriate status counter
            switch(pica.status) {
              case 'progress':
                jobStatsMap[site.code].progress += 1;
                break;
              case 'complete':
                jobStatsMap[site.code].complete += 1;
                break;
              case 'overdue':
                jobStatsMap[site.code].overdue += 1;
                break;
            }
          }
        });
        
        // Convert the map to an array
        const jobStats = Object.values(jobStatsMap);
        
        return res.json(jobStats);
      }
      
      // If not authenticated or no organization ID, return empty array
      res.json([]);
    } catch (error) {
      console.error("Error fetching job stats:", error);
      res.status(500).json({ message: "Failed to retrieve PICA job statistics" });
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
      
      // Check if user has access to this PICA (belongs to the same organization)
      if (req.isAuthenticated() && req.user.organizationId && 
          pica.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "You don't have access to this PICA" });
      }
      
      res.json(pica);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve PICA" });
    }
  });

  // Create a new PICA (requires edit permission)
  app.post(`${apiPrefix}/picas`, canEdit, async (req, res) => {
    try {
      // Parse the PICA data
      const picaData = insertPicaSchema.parse(req.body);
      
      // Make sure organizationId is set to the current user's organization
      if (req.isAuthenticated() && req.user.organizationId) {
        picaData.organizationId = req.user.organizationId;
      }
      
      // Create the PICA
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
      
      // First get the existing PICA to ensure we have the correct organizationId
      const existingPica = await storage.getPica(id);
      if (!existingPica) {
        return res.status(404).json({ message: "PICA not found" });
      }
      
      // Check if user has access to this PICA (belongs to the same organization)
      if (req.isAuthenticated() && req.user.organizationId && 
          existingPica.organizationId && existingPica.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "You don't have access to this PICA" });
      }
      
      // Extract comment and updateDate from the request if present
      const { comment, updateDate, ...restData } = req.body;
      
      // Create a copy of the data to be updated with type assertion
      let picaData: any = { ...insertPicaSchema.partial().parse(restData) };
      
      // Ensure organizationId is preserved
      if (req.isAuthenticated() && req.user.organizationId) {
        picaData.organizationId = req.user.organizationId;
      }
      
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
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const people = await storage.getPeopleByOrganization(req.user.organizationId);
        
        // Make sure position field is always included in the response
        const peopleWithPosition = people.map(person => ({
          ...person,
          position: person.position || ""
        }));
        
        return res.json(peopleWithPosition);
      }
      
      // If not authenticated or no organization ID, return empty array for data isolation
      const people: any[] = [];
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
      
      // Check if user has access to this person (belongs to the same organization)
      if (req.isAuthenticated() && req.user.organizationId && 
          person.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "You don't have access to this person" });
      }
      
      // Make sure position field is always included
      const responseData = {
        ...person,
        position: person.position || ""
      };
      
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve person" });
    }
  });

  // Create a new person (requires edit permission)
  app.post(`${apiPrefix}/people`, canEdit, async (req, res) => {
    try {
      // Extract position from the request body if present
      const { position, ...restData } = req.body;
      
      // Add user's organization ID to ensure proper data isolation
      if (!req.user || !req.user.organizationId) {
        return res.status(400).json({ message: "Organization ID is required to create a person" });
      }
      
      const personData = {
        ...insertPersonSchema.parse(restData),
        position: position || "",
        organizationId: req.user.organizationId
      };
      
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
      
      // Extract position from the request body if present
      const { position, ...restData } = req.body;
      
      // Include position in the person data for update
      const personData = {
        ...insertPersonSchema.partial().parse(restData),
        position: position || undefined
      };
      
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
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const departments = await storage.getDepartmentsByOrganization(req.user.organizationId);
        
        // Add position field to each department
        const departmentsWithPosition = departments.map(dept => ({
          ...dept,
          position: dept.position || ""
        }));
        
        return res.json(departmentsWithPosition);
      }
      
      // If not authenticated or no organization ID, return empty array for data isolation
      const departments: any[] = [];
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
      
      // Check if user has access to this department (belongs to the same organization)
      if (req.isAuthenticated() && req.user.organizationId && 
          department.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "You don't have access to this department" });
      }
      
      // Add position field
      const responseData = {
        ...department,
        position: department.position || "",
      };
      
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve department" });
    }
  });

  // Create a new department (requires edit permission)
  app.post(`${apiPrefix}/departments`, canEdit, async (req, res) => {
    try {
      // Extract position field from the request body if present
      const { position, ...restData } = req.body;
      
      // Parse the incoming data
      const rawData = insertDepartmentSchema.parse(restData);
      
      // Add the user's organizationId to ensure proper data isolation
      if (!req.user || !req.user.organizationId) {
        return res.status(400).json({ message: "Organization ID is required to create a department" });
      }

      const departmentData = {
        ...rawData,
        position: position || "",  // Include position field in the data to save
        organizationId: req.user.organizationId,
      };
      
      const department = await storage.createDepartment(departmentData);
      
      // Add the position to the response
      const responseData = {
        ...department,
        position: position || "",
      };
      
      res.status(201).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid department data", errors: error.errors });
      }
      console.error("Department creation error:", error);
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
      
      // Extract position from the request body if present
      const { position, ...restData } = req.body;
      
      // Include the position in the department data for update
      const departmentData = {
        ...insertDepartmentSchema.partial().parse(restData),
        position: position || ""
      };
      const updatedDepartment = await storage.updateDepartment(id, departmentData);
      
      if (!updatedDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      // Add the position to the response
      const responseData = {
        ...updatedDepartment,
        position: position || "",
      };
      
      res.json(responseData);
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
      // Filter by organization ID if user is authenticated
      if (req.isAuthenticated() && req.user.organizationId) {
        const projectSites = await storage.getProjectSitesByOrganization(req.user.organizationId);
        return res.json(projectSites);
      }
      
      // If not authenticated or no organization ID, return empty array for data isolation
      const projectSites: any[] = [];
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
      
      // Check if user has access to this project site (belongs to the same organization)
      if (req.isAuthenticated() && req.user.organizationId && 
          projectSite.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "You don't have access to this project site" });
      }
      
      res.json(projectSite);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve project site" });
    }
  });

  // Create a new project site (requires edit permission)
  app.post(`${apiPrefix}/project-sites`, canEdit, async (req, res) => {
    try {
      // Parse the incoming data
      const rawData = insertProjectSiteSchema.parse(req.body);
      
      // Add the user's organizationId to ensure proper data isolation
      if (!req.user || !req.user.organizationId) {
        return res.status(400).json({ message: "Organization ID is required to create a project site" });
      }
      
      const projectSiteData = {
        ...rawData,
        organizationId: req.user.organizationId,
      };
      
      const projectSite = await storage.createProjectSite(projectSiteData);
      res.status(201).json(projectSite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project site data", errors: error.errors });
      }
      console.error("Project site creation error:", error);
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
      // Filter by organization ID if user is authenticated
      let users;
      if (req.isAuthenticated() && req.user.organizationId) {
        users = await storage.getUsersByOrganization(req.user.organizationId);
      } else {
        users = await storage.getAllUsers();
      }
      
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
      
      // Check if user has access to this user (belongs to the same organization or is admin)
      if (req.isAuthenticated() && req.user.organizationId !== user.organizationId) {
        // Only allow super admins to view users from other organizations
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "You don't have access to this user" });
        }
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
      const userData = insertUserSchema.parse(req.body);
      
      // Hash the password before storing it
      userData.password = await hashPassword(userData.password);
      
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
  app.patch(`${apiPrefix}/users/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      
      // If password is provided, we need to hash it before storage
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
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

  // --- Organization Routes ---
  // Get all organizations (admin only)
  app.get(`${apiPrefix}/organizations`, canDelete, async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve organizations" });
    }
  });

  // Get a single organization
  app.get(`${apiPrefix}/organizations/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user is allowed to access this organization
      if (req.isAuthenticated() && req.user.organizationId !== organization.id) {
        // Only allow users to access their own organization unless they are super admin
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: "You don't have access to this organization" });
        }
      }
      
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve organization" });
    }
  });
  
  // Create a new organization (public route for registration)
  app.post(`${apiPrefix}/organizations`, async (req, res) => {
    try {
      const { promoCode, ...organizationData } = insertOrganizationSchema.parse(req.body);
      
      // Set initial values for registration
      const newOrgData = {
        ...organizationData,
        hasPaid: false,
        subscriptionActive: false,
        promoCode: promoCode || null
      };
      
      // Validate the promo code if provided
      if (promoCode) {
        const isValidPromo = await storage.validatePromoCode(promoCode);
        if (isValidPromo) {
          // If promo code is valid, set hasPaid to true
          // Our updateOrganization method will automatically set the payment date
          newOrgData.hasPaid = true; 
          newOrgData.subscriptionActive = true;
        }
      }
      
      const organization = await storage.createOrganization(newOrgData);
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid organization data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Update an organization (admin only)
  app.put(`${apiPrefix}/organizations/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const organizationData = insertOrganizationSchema.partial().parse(req.body);
      const updatedOrganization = await storage.updateOrganization(id, organizationData);
      
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrganization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid organization data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // Delete an organization (admin only)
  app.delete(`${apiPrefix}/organizations/:id`, canDelete, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteOrganization(id);
      if (!success) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // --- Payment Routes (Promo Code Only) ---
  // Validate promo code
  app.post(`${apiPrefix}/validate-promo-code`, async (req, res) => {
    try {
      const { promoCode } = req.body;

      if (!promoCode) {
        return res.status(400).json({
          valid: false,
          message: "No promo code provided"
        });
      }

      // Check if promo code is valid
      const isValid = await storage.validatePromoCode(promoCode);

      if (isValid) {
        return res.json({
          valid: true,
          discount: 100, // 100% discount
          message: "Promo code applied successfully!"
        });
      } else {
        return res.json({
          valid: false,
          message: "Invalid promo code"
        });
      }
    } catch (error: any) {
      res.status(500).json({
        valid: false,
        message: `Error validating promo code: ${error.message}`
      });
    }
  });

  // Confirm organization payment (Promo code only - Stripe removed)
  app.post(`${apiPrefix}/confirm-payment/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Only promo code registrations are supported
      const { promoCode } = req.body;

      if (!promoCode) {
        return res.status(400).json({
          success: false,
          message: "Promo code is required for registration"
        });
      }

      // Validate promo code
      const isValid = await storage.validatePromoCode(promoCode);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid promo code"
        });
      }

      // Update the organization payment status
      const updatedOrganization = await storage.updateOrganization(id, {
        hasPaid: true,
        subscriptionActive: true,
        promoCode: promoCode || null
      });

      res.json({
        success: true,
        organization: updatedOrganization
      });
    } catch (error: any) {
      res.status(500).json({
        message: `Payment confirmation error: ${error.message}`
      });
    }
  });



  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
