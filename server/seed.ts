import { storage } from './storage';

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Create departments
    const scmDept = await storage.createDepartment({ name: "SCM", headId: null });
    const hcgsDept = await storage.createDepartment({ name: "HCGS", headId: null });
    const financeDept = await storage.createDepartment({ name: "Finance", headId: null });

    // Create people
    const andy = await storage.createPerson({ name: "Andy", email: "andy@example.com", departmentId: scmDept.id });
    const arie = await storage.createPerson({ name: "Arie", email: "arie@example.com", departmentId: hcgsDept.id });
    const boy = await storage.createPerson({ name: "Boy", email: "boy@example.com", departmentId: hcgsDept.id });
    const susi = await storage.createPerson({ name: "Susi", email: "susi@example.com", departmentId: financeDept.id });
    
    // Update department heads
    await storage.updateDepartment(scmDept.id, { headId: andy.id });
    await storage.updateDepartment(hcgsDept.id, { headId: arie.id });
    await storage.updateDepartment(financeDept.id, { headId: susi.id });

    // Create project sites
    const npmSite = await storage.createProjectSite({ code: "KMP-NPR", name: "Kamp Nampurior", location: "West Papua", managerId: andy.id });
    const bekbSite = await storage.createProjectSite({ code: "KMP-BEKB", name: "Kamp Bekubai", location: "East Kalimantan", managerId: arie.id });
    const tbsSite = await storage.createProjectSite({ code: "KMP-TBS", name: "Kamp Tabas", location: "South Sumatra", managerId: boy.id });
    const ibpSite = await storage.createProjectSite({ code: "KMP-IBP", name: "Kamp Ibupura", location: "Papua", managerId: susi.id });

    // Create PICA entries
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
      status: "progress"
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
      status: "complete"
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
      status: "overdue"
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
      status: "progress"
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