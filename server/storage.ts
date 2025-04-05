import { 
  departments, 
  people, 
  projectSites, 
  picas, 
  users,
  type Department,
  type InsertDepartment,
  type Person,
  type InsertPerson,
  type ProjectSite,
  type InsertProjectSite,
  type Pica,
  type InsertPica,
  type User,
  type InsertUser,
  type PicaWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { PicaHistory, PicaHistoryWithRelations, InsertPicaHistory, picaHistory } from "@shared/schema";

// Storage interface
export interface IStorage {
  // People
  getAllPeople(): Promise<Person[]>;
  getPerson(id: number): Promise<Person | undefined>;
  createPerson(person: InsertPerson): Promise<Person>;
  updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined>;
  deletePerson(id: number): Promise<boolean>;

  // Departments
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Project Sites
  getAllProjectSites(): Promise<ProjectSite[]>;
  getProjectSite(id: number): Promise<ProjectSite | undefined>;
  getProjectSiteByCode(code: string): Promise<ProjectSite | undefined>;
  createProjectSite(projectSite: InsertProjectSite): Promise<ProjectSite>;
  updateProjectSite(id: number, projectSite: Partial<InsertProjectSite>): Promise<ProjectSite | undefined>;
  deleteProjectSite(id: number): Promise<boolean>;

  // PICAs
  getAllPicas(): Promise<Pica[]>;
  getPicasWithRelations(): Promise<PicaWithRelations[]>;
  getPica(id: number): Promise<Pica | undefined>;
  getPicaByPicaId(picaId: string): Promise<Pica | undefined>;
  createPica(pica: InsertPica): Promise<Pica>;
  updatePica(id: number, pica: Partial<InsertPica>, historyComment?: string): Promise<Pica | undefined>;
  deletePica(id: number): Promise<boolean>;
  getPicasByStatus(status: string): Promise<Pica[]>;
  countPicasByStatus(): Promise<{ progress: number; complete: number; overdue: number; total: number }>;
  countPicasByDepartment(): Promise<any[]>;
  countPicasByProjectSite(): Promise<any[]>;
  
  // PICA History
  getPicaHistory(picaId: number): Promise<PicaHistoryWithRelations[]>;
  addPicaHistory(history: InsertPicaHistory): Promise<PicaHistory>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // People methods
  async getAllPeople(): Promise<Person[]> {
    return await db.select().from(people);
  }

  async getPerson(id: number): Promise<Person | undefined> {
    const [person] = await db.select().from(people).where(eq(people.id, id));
    return person || undefined;
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const [newPerson] = await db
      .insert(people)
      .values(person)
      .returning();
    return newPerson;
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const [updatedPerson] = await db
      .update(people)
      .set(person)
      .where(eq(people.id, id))
      .returning();
    return updatedPerson || undefined;
  }

  async deletePerson(id: number): Promise<boolean> {
    const result = await db
      .delete(people)
      .where(eq(people.id, id))
      .returning({ id: people.id });
    return result.length > 0;
  }

  // Department methods
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db
      .insert(departments)
      .values(department)
      .returning();
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updatedDepartment] = await db
      .update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment || undefined;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return result.length > 0;
  }

  // Project site methods
  async getAllProjectSites(): Promise<ProjectSite[]> {
    return await db.select().from(projectSites);
  }

  async getProjectSite(id: number): Promise<ProjectSite | undefined> {
    const [projectSite] = await db.select().from(projectSites).where(eq(projectSites.id, id));
    return projectSite || undefined;
  }

  async getProjectSiteByCode(code: string): Promise<ProjectSite | undefined> {
    const [projectSite] = await db
      .select()
      .from(projectSites)
      .where(eq(projectSites.code, code));
    return projectSite || undefined;
  }

  async createProjectSite(projectSite: InsertProjectSite): Promise<ProjectSite> {
    const [newProjectSite] = await db
      .insert(projectSites)
      .values(projectSite)
      .returning();
    return newProjectSite;
  }

  async updateProjectSite(id: number, projectSite: Partial<InsertProjectSite>): Promise<ProjectSite | undefined> {
    const [updatedProjectSite] = await db
      .update(projectSites)
      .set(projectSite)
      .where(eq(projectSites.id, id))
      .returning();
    return updatedProjectSite || undefined;
  }

  async deleteProjectSite(id: number): Promise<boolean> {
    const result = await db
      .delete(projectSites)
      .where(eq(projectSites.id, id))
      .returning({ id: projectSites.id });
    return result.length > 0;
  }

  // PICA methods
  async getAllPicas(): Promise<Pica[]> {
    return await db
      .select()
      .from(picas)
      .orderBy(desc(picas.createdAt));
  }

  async getPicasWithRelations(): Promise<PicaWithRelations[]> {
    const result: PicaWithRelations[] = [];
    
    const allPicas = await this.getAllPicas();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    
    // Check for overdue PICAs and update their status
    const picasToUpdate: { id: number, status: string }[] = [];
    
    for (const pica of allPicas) {
      const projectSite = await this.getProjectSite(pica.projectSiteId);
      const personInCharge = await this.getPerson(pica.personInChargeId);
      
      if (projectSite && personInCharge) {
        // Check if the PICA is overdue (dueDate < today and status is not complete)
        const dueDate = new Date(pica.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
        
        let currentStatus = pica.status;
        
        // Only update status to overdue if it's in progress and the due date has passed
        if (dueDate < today && pica.status === "progress") {
          currentStatus = "overdue";
          picasToUpdate.push({ id: pica.id, status: "overdue" });
        }
        
        result.push({
          ...pica,
          status: currentStatus, // Use the updated status
          projectSite,
          personInCharge
        });
      }
    }
    
    // Batch update the status of overdue PICAs in the database
    for (const picaUpdate of picasToUpdate) {
      await this.updatePica(picaUpdate.id, { status: picaUpdate.status });
    }
    
    return result;
  }

  async getPica(id: number): Promise<Pica | undefined> {
    const [pica] = await db.select().from(picas).where(eq(picas.id, id));
    return pica || undefined;
  }

  async getPicaByPicaId(picaId: string): Promise<Pica | undefined> {
    const [pica] = await db
      .select()
      .from(picas)
      .where(eq(picas.picaId, picaId));
    return pica || undefined;
  }

  async createPica(pica: InsertPica): Promise<Pica> {
    const [newPica] = await db
      .insert(picas)
      .values(pica)
      .returning();
    return newPica;
  }

  async updatePica(id: number, pica: Partial<InsertPica>, historyComment?: string): Promise<Pica | undefined> {
    // If status is changing, record history
    if (pica.status) {
      const currentPica = await this.getPica(id);
      if (currentPica && currentPica.status !== pica.status) {
        // Create history entry for the status change
        await this.addPicaHistory({
          picaId: id,
          userId: 1, // Default to first user for now, in a real app this would come from auth
          oldStatus: currentPica.status,
          newStatus: pica.status,
          comment: historyComment || `Status changed from ${currentPica.status} to ${pica.status}`
        });
      }
    }
    
    // Always update the updatedAt timestamp when updating a PICA
    const updateData = {
      ...pica,
      updatedAt: new Date()
    };
    
    const [updatedPica] = await db
      .update(picas)
      .set(updateData)
      .where(eq(picas.id, id))
      .returning();
    return updatedPica || undefined;
  }

  async deletePica(id: number): Promise<boolean> {
    const result = await db
      .delete(picas)
      .where(eq(picas.id, id))
      .returning({ id: picas.id });
    return result.length > 0;
  }

  async getPicasByStatus(status: string): Promise<Pica[]> {
    return await db
      .select()
      .from(picas)
      .where(eq(picas.status, status))
      .orderBy(desc(picas.createdAt));
  }

  async countPicasByStatus(): Promise<{ progress: number; complete: number; overdue: number; total: number }> {
    const progressCount = await db
      .select({ count: count() })
      .from(picas)
      .where(eq(picas.status, "progress"));
    
    const completeCount = await db
      .select({ count: count() })
      .from(picas)
      .where(eq(picas.status, "complete"));
    
    const overdueCount = await db
      .select({ count: count() })
      .from(picas)
      .where(eq(picas.status, "overdue"));
    
    const totalCount = await db
      .select({ count: count() })
      .from(picas);
    
    return {
      progress: progressCount[0].count,
      complete: completeCount[0].count,
      overdue: overdueCount[0].count,
      total: totalCount[0].count
    };
  }

  async countPicasByDepartment(): Promise<any[]> {
    const result = [];
    const allDepartments = await this.getAllDepartments();
    
    for (const department of allDepartments) {
      const departmentPeople = await db
        .select()
        .from(people)
        .where(eq(people.departmentId, department.id));
      
      const peopleIds = departmentPeople.map(person => person.id);
      
      const progressCount = peopleIds.length > 0 
        ? await db
            .select({ count: count() })
            .from(picas)
            .where(
              and(
                eq(picas.status, "progress"),
                sql`${picas.personInChargeId} IN (${peopleIds.join(',')})`
              )
            )
        : [{ count: 0 }];
      
      const completeCount = peopleIds.length > 0
        ? await db
            .select({ count: count() })
            .from(picas)
            .where(
              and(
                eq(picas.status, "complete"),
                sql`${picas.personInChargeId} IN (${peopleIds.join(',')})`
              )
            )
        : [{ count: 0 }];
      
      const overdueCount = peopleIds.length > 0
        ? await db
            .select({ count: count() })
            .from(picas)
            .where(
              and(
                eq(picas.status, "overdue"),
                sql`${picas.personInChargeId} IN (${peopleIds.join(',')})`
              )
            )
        : [{ count: 0 }];
      
      result.push({
        department: department.name,
        progress: progressCount[0].count,
        complete: completeCount[0].count,
        overdue: overdueCount[0].count
      });
    }
    
    return result;
  }

  async countPicasByProjectSite(): Promise<any[]> {
    const result = [];
    const allProjectSites = await this.getAllProjectSites();
    
    for (const site of allProjectSites) {
      const progressCount = await db
        .select({ count: count() })
        .from(picas)
        .where(
          and(
            eq(picas.status, "progress"),
            eq(picas.projectSiteId, site.id)
          )
        );
      
      const completeCount = await db
        .select({ count: count() })
        .from(picas)
        .where(
          and(
            eq(picas.status, "complete"),
            eq(picas.projectSiteId, site.id)
          )
        );
      
      const overdueCount = await db
        .select({ count: count() })
        .from(picas)
        .where(
          and(
            eq(picas.status, "overdue"),
            eq(picas.projectSiteId, site.id)
          )
        );
      
      result.push({
        site: site.code,
        progress: progressCount[0].count,
        complete: completeCount[0].count,
        overdue: overdueCount[0].count
      });
    }
    
    return result;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  // PICA History methods
  async getPicaHistory(picaId: number): Promise<PicaHistoryWithRelations[]> {
    const history = await db
      .select()
      .from(picaHistory)
      .where(eq(picaHistory.picaId, picaId))
      .orderBy(desc(picaHistory.timestamp));
      
    const result: PicaHistoryWithRelations[] = [];
    
    for (const entry of history) {
      const user = entry.userId ? await this.getUser(entry.userId) : undefined;
      result.push({
        ...entry,
        user
      });
    }
    
    return result;
  }
  
  async addPicaHistory(history: InsertPicaHistory): Promise<PicaHistory> {
    const [newHistory] = await db
      .insert(picaHistory)
      .values(history)
      .returning();
    return newHistory;
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
