import { storage } from './storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Create demo organization first
    let demoOrg;
    try {
      demoOrg = await storage.createOrganization({
        name: 'Demo Organization',
        hasPaid: true,
        subscriptionActive: true,
        promoCode: 'PICAFREE'
      });
      console.log('Demo organization created:', demoOrg.id);
    } catch (error) {
      console.log('Demo organization might already exist, trying to fetch...');
      // If organization exists, get it by name (you might need to add this method)
      // For now, we'll assume it was created
    }

    // Create users with different roles
    const adminHash = await hashPassword('admin123');
    const userHash = await hashPassword('user123');
    const publicHash = await hashPassword('public123');

    try {
      // Create demo admin user
      const demoAdminExists = await storage.getUserByUsername('admin_demo');
      if (!demoAdminExists && demoOrg) {
        await storage.createUser({
          username: 'admin_demo',
          password: adminHash,
          name: 'Demo Administrator',
          email: 'admin@demo.com',
          role: 'admin',
          isOrganizationAdmin: true,
          organizationId: demoOrg.id
        });
        console.log('Demo admin user created (admin@demo.com / admin123)');
      }

      // Check if users already exist before creating them
      const adminExists = await storage.getUserByUsername('admin');
      if (!adminExists) {
        await storage.createUser({
          username: 'admin',
          password: adminHash,
          name: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
        });
        console.log('Admin user created');
      }
      
      const regularExists = await storage.getUserByUsername('user');
      if (!regularExists) {
        await storage.createUser({
          username: 'user',
          password: userHash,
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
        });
        console.log('Regular user created');
      }
      
      const publicExists = await storage.getUserByUsername('viewer');
      if (!publicExists) {
        await storage.createUser({
          username: 'viewer',
          password: publicHash,
          name: 'Public Viewer',
          email: 'viewer@example.com',
          role: 'public',
        });
        console.log('Public viewer created');
      }
    } catch (error) {
      console.error('Error creating users:', error);
    }

    // Only create demo data if we have a demo organization
    if (!demoOrg) {
      console.log('Skipping demo data creation - no demo organization');
      return;
    }

    // Create departments for demo org
    const scmDept = await storage.createDepartment({
      name: "SCM",
      headId: null,
      organizationId: demoOrg.id
    });
    const hcgsDept = await storage.createDepartment({
      name: "HCGS",
      headId: null,
      organizationId: demoOrg.id
    });
    const financeDept = await storage.createDepartment({
      name: "Finance",
      headId: null,
      organizationId: demoOrg.id
    });

    // Create people for demo org
    const andy = await storage.createPerson({
      name: "Andy",
      email: "andy@example.com",
      departmentId: scmDept.id,
      organizationId: demoOrg.id
    });
    const arie = await storage.createPerson({
      name: "Arie",
      email: "arie@example.com",
      departmentId: hcgsDept.id,
      organizationId: demoOrg.id
    });
    const boy = await storage.createPerson({
      name: "Boy",
      email: "boy@example.com",
      departmentId: hcgsDept.id,
      organizationId: demoOrg.id
    });
    const susi = await storage.createPerson({
      name: "Susi",
      email: "susi@example.com",
      departmentId: financeDept.id,
      organizationId: demoOrg.id
    });
    
    // Update department heads
    await storage.updateDepartment(scmDept.id, { headId: andy.id });
    await storage.updateDepartment(hcgsDept.id, { headId: arie.id });
    await storage.updateDepartment(financeDept.id, { headId: susi.id });

    // Create project sites for demo org
    const npmSite = await storage.createProjectSite({
      code: "KMP-NPR",
      name: "Kamp Nampurior",
      location: "West Papua",
      managerId: andy.id,
      organizationId: demoOrg.id
    });
    const bekbSite = await storage.createProjectSite({
      code: "KMP-BEKB",
      name: "Kamp Bekubai",
      location: "East Kalimantan",
      managerId: arie.id,
      organizationId: demoOrg.id
    });
    const tbsSite = await storage.createProjectSite({
      code: "KMP-TBS",
      name: "Kamp Tabas",
      location: "South Sumatra",
      managerId: boy.id,
      organizationId: demoOrg.id
    });
    const ibpSite = await storage.createProjectSite({
      code: "KMP-IBP",
      name: "Kamp Ibupura",
      location: "Papua",
      managerId: susi.id,
      organizationId: demoOrg.id
    });

    // Create PICA entries for demo org
    const baseDate = '2025-04-05';

    await storage.createPica({
      picaId: "2504NPR01",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KZ-51 Breakdown",
      problemIdentification: "Kerusakan Pada Cross Joint",
      correctiveAction: "Ordering DZ-51 Sparepart to PT. Mitsubishi Motor Indonesia",
      personInChargeId: andy.id,
      dueDate: '2025-04-07',
      status: "progress",
      organizationId: demoOrg.id
    });

    await storage.createPica({
      picaId: "2504NPR02",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KX-72",
      problemIdentification: "Kerusakan Pada Pedal Gas",
      correctiveAction: "Delivering KX-72 Sparepart",
      personInChargeId: arie.id,
      dueDate: '2025-04-06',
      status: "complete",
      organizationId: demoOrg.id
    });

    await storage.createPica({
      picaId: "2504NPR03",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "NO Operator",
      problemIdentification: "Operator tidak tersedia",
      correctiveAction: "Send New Hire Operator to site KMP-NPR",
      personInChargeId: boy.id,
      dueDate: '2025-04-08',
      status: "overdue",
      organizationId: demoOrg.id
    });

    await storage.createPica({
      picaId: "2504NPR04",
      projectSiteId: npmSite.id,
      date: baseDate,
      issue: "KX-74 Payment",
      problemIdentification: "Pending Payment",
      correctiveAction: "Processing Payment to spare part order KX-74",
      personInChargeId: susi.id,
      dueDate: '2025-04-09',
      status: "progress",
      organizationId: demoOrg.id
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Export the seed function
export { seedDatabase };

// Run the seed function
seedDatabase();