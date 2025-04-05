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
  updatePica(id: number, pica: Partial<InsertPica>): Promise<Pica | undefined>;
  deletePica(id: number): Promise<boolean>;
  getPicasByStatus(status: string): Promise<Pica[]>;
  countPicasByStatus(): Promise<{ progress: number; complete: number; overdue: number; total: number }>;
  countPicasByDepartment(): Promise<any[]>;
  countPicasByProjectSite(): Promise<any[]>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private people: Map<number, Person>;
  private departments: Map<number, Department>;
  private projectSites: Map<number, ProjectSite>;
  private picas: Map<number, Pica>;
  private users: Map<number, User>;
  
  private personId: number;
  private departmentId: number;
  private projectSiteId: number;
  private picaId: number;
  private userId: number;

  constructor() {
    this.people = new Map();
    this.departments = new Map();
    this.projectSites = new Map();
    this.picas = new Map();
    this.users = new Map();
    
    this.personId = 1;
    this.departmentId = 1;
    this.projectSiteId = 1;
    this.picaId = 1;
    this.userId = 1;

    // Initialize with some data
    this.seedData();
  }

  // Seed some initial data
  private seedData() {
    // Create departments
    const scmDept = this.createDepartment({ name: "SCM", headId: null });
    const hcgsDept = this.createDepartment({ name: "HCGS", headId: null });
    const financeDept = this.createDepartment({ name: "Finance", headId: null });

    // Create people
    const andy = this.createPerson({ name: "Andy", email: "andy@example.com", departmentId: scmDept.id });
    const arie = this.createPerson({ name: "Arie", email: "arie@example.com", departmentId: hcgsDept.id });
    const boy = this.createPerson({ name: "Boy", email: "boy@example.com", departmentId: hcgsDept.id });
    const susi = this.createPerson({ name: "Susi", email: "susi@example.com", departmentId: financeDept.id });
    
    // Update department heads
    this.updateDepartment(scmDept.id, { headId: andy.id });
    this.updateDepartment(hcgsDept.id, { headId: arie.id });
    this.updateDepartment(financeDept.id, { headId: susi.id });

    // Create project sites
    const npmSite = this.createProjectSite({ code: "KMP-NPR", name: "Kamp Nampurior", location: "West Papua", managerId: andy.id });
    const bekbSite = this.createProjectSite({ code: "KMP-BEKB", name: "Kamp Bekubai", location: "East Kalimantan", managerId: arie.id });
    const tbsSite = this.createProjectSite({ code: "KMP-TBS", name: "Kamp Tabas", location: "South Sumatra", managerId: boy.id });
    const ibpSite = this.createProjectSite({ code: "KMP-IBP", name: "Kamp Ibupura", location: "Papua", managerId: susi.id });

    // Create PICA entries
    const baseDate = new Date('2025-04-05');
    
    this.createPica({
      picaId: "2504NPR01",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KZ-51 Breakdown",
      problemIdentification: "Kerusakan Pada Cross Joint",
      correctiveAction: "Ordering DZ-51 Sparepart to PT. Mitsubishi Motor Indonesia",
      personInChargeId: andy.id,
      dueDate: new Date('2025-04-07'),
      status: "progress"
    });

    this.createPica({
      picaId: "2504NPR02",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KX-72",
      problemIdentification: "Kerusakan Pada Pedal Gas",
      correctiveAction: "Delivering KX-72 Sparepart",
      personInChargeId: arie.id,
      dueDate: new Date('2025-04-06'),
      status: "complete"
    });

    this.createPica({
      picaId: "2504NPR03",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "NO Operator",
      problemIdentification: "Operator tidak tersedia",
      correctiveAction: "Send New Hire Operator to site KMP-NPR",
      personInChargeId: boy.id,
      dueDate: new Date('2025-04-08'),
      status: "overdue"
    });

    this.createPica({
      picaId: "2504NPR04",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KX-74 Payment",
      problemIdentification: "Pending Payment",
      correctiveAction: "Processing Payment to spare part order KX-74",
      personInChargeId: susi.id,
      dueDate: new Date('2025-04-09'),
      status: "progress"
    });
  }

  // People methods
  async getAllPeople(): Promise<Person[]> {
    return Array.from(this.people.values());
  }

  async getPerson(id: number): Promise<Person | undefined> {
    return this.people.get(id);
  }

  async createPerson(person: InsertPerson): Promise<Person> {
    const id = this.personId++;
    const newPerson: Person = { ...person, id };
    this.people.set(id, newPerson);
    return newPerson;
  }

  async updatePerson(id: number, person: Partial<InsertPerson>): Promise<Person | undefined> {
    const existingPerson = this.people.get(id);
    if (!existingPerson) return undefined;
    
    const updatedPerson: Person = { ...existingPerson, ...person };
    this.people.set(id, updatedPerson);
    return updatedPerson;
  }

  async deletePerson(id: number): Promise<boolean> {
    return this.people.delete(id);
  }

  // Department methods
  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.departmentId++;
    const newDepartment: Department = { ...department, id };
    this.departments.set(id, newDepartment);
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const existingDepartment = this.departments.get(id);
    if (!existingDepartment) return undefined;
    
    const updatedDepartment: Department = { ...existingDepartment, ...department };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  // Project site methods
  async getAllProjectSites(): Promise<ProjectSite[]> {
    return Array.from(this.projectSites.values());
  }

  async getProjectSite(id: number): Promise<ProjectSite | undefined> {
    return this.projectSites.get(id);
  }

  async getProjectSiteByCode(code: string): Promise<ProjectSite | undefined> {
    return Array.from(this.projectSites.values()).find(site => site.code === code);
  }

  async createProjectSite(projectSite: InsertProjectSite): Promise<ProjectSite> {
    const id = this.projectSiteId++;
    const newProjectSite: ProjectSite = { ...projectSite, id };
    this.projectSites.set(id, newProjectSite);
    return newProjectSite;
  }

  async updateProjectSite(id: number, projectSite: Partial<InsertProjectSite>): Promise<ProjectSite | undefined> {
    const existingProjectSite = this.projectSites.get(id);
    if (!existingProjectSite) return undefined;
    
    const updatedProjectSite: ProjectSite = { ...existingProjectSite, ...projectSite };
    this.projectSites.set(id, updatedProjectSite);
    return updatedProjectSite;
  }

  async deleteProjectSite(id: number): Promise<boolean> {
    return this.projectSites.delete(id);
  }

  // PICA methods
  async getAllPicas(): Promise<Pica[]> {
    return Array.from(this.picas.values());
  }

  async getPicasWithRelations(): Promise<PicaWithRelations[]> {
    const picas = await this.getAllPicas();
    const result: PicaWithRelations[] = [];
    
    for (const pica of picas) {
      const projectSite = await this.getProjectSite(pica.projectSiteId);
      const personInCharge = await this.getPerson(pica.personInChargeId);
      
      if (projectSite && personInCharge) {
        result.push({
          ...pica,
          projectSite,
          personInCharge
        });
      }
    }
    
    return result;
  }

  async getPica(id: number): Promise<Pica | undefined> {
    return this.picas.get(id);
  }

  async getPicaByPicaId(picaId: string): Promise<Pica | undefined> {
    return Array.from(this.picas.values()).find(pica => pica.picaId === picaId);
  }

  async createPica(pica: InsertPica): Promise<Pica> {
    const id = this.picaId++;
    const now = new Date();
    const newPica: Pica = { ...pica, id, createdAt: now };
    this.picas.set(id, newPica);
    return newPica;
  }

  async updatePica(id: number, pica: Partial<InsertPica>): Promise<Pica | undefined> {
    const existingPica = this.picas.get(id);
    if (!existingPica) return undefined;
    
    const updatedPica: Pica = { ...existingPica, ...pica };
    this.picas.set(id, updatedPica);
    return updatedPica;
  }

  async deletePica(id: number): Promise<boolean> {
    return this.picas.delete(id);
  }

  async getPicasByStatus(status: string): Promise<Pica[]> {
    return Array.from(this.picas.values()).filter(pica => pica.status === status);
  }

  async countPicasByStatus(): Promise<{ progress: number; complete: number; overdue: number; total: number }> {
    const allPicas = await this.getAllPicas();
    const progressCount = allPicas.filter(pica => pica.status === "progress").length;
    const completeCount = allPicas.filter(pica => pica.status === "complete").length;
    const overdueCount = allPicas.filter(pica => pica.status === "overdue").length;
    
    return {
      progress: progressCount,
      complete: completeCount,
      overdue: overdueCount,
      total: allPicas.length
    };
  }

  async countPicasByDepartment(): Promise<any[]> {
    const allPicas = await this.getPicasWithRelations();
    const departments = await this.getAllDepartments();
    const result = [];

    for (const department of departments) {
      const departmentPics = allPicas.filter(pica => 
        pica.personInCharge.departmentId === department.id
      );
      
      result.push({
        department: department.name,
        progress: departmentPics.filter(pica => pica.status === "progress").length,
        complete: departmentPics.filter(pica => pica.status === "complete").length,
        overdue: departmentPics.filter(pica => pica.status === "overdue").length
      });
    }

    return result;
  }

  async countPicasByProjectSite(): Promise<any[]> {
    const allPicas = await this.getPicasWithRelations();
    const sites = await this.getAllProjectSites();
    const result = [];

    for (const site of sites) {
      const sitePicas = allPicas.filter(pica => pica.projectSiteId === site.id);
      
      result.push({
        site: site.code,
        progress: sitePicas.filter(pica => pica.status === "progress").length,
        complete: sitePicas.filter(pica => pica.status === "complete").length,
        overdue: sitePicas.filter(pica => pica.status === "overdue").length
      });
    }

    return result;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
