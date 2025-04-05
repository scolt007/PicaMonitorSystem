import { pgTable, text, serial, integer, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Person In Charge
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  departmentId: integer("department_id"),
});

// Department
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  headId: integer("head_id"),
});

// Project Site
export const projectSites = pgTable("project_sites", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  managerId: integer("manager_id"),
});

// PICA Status enum
export const picaStatusEnum = z.enum(["progress", "complete", "overdue"]);
export type PicaStatus = z.infer<typeof picaStatusEnum>;

// PICA record
export const picas = pgTable("picas", {
  id: serial("id").primaryKey(),
  picaId: text("pica_id").notNull().unique(), // e.g., 2504NPR01
  projectSiteId: integer("project_site_id").notNull(),
  date: date("date").notNull(),
  issue: text("issue").notNull(),
  problemIdentification: text("problem_identification").notNull(),
  correctiveAction: text("corrective_action").notNull(),
  personInChargeId: integer("person_in_charge_id").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("progress"), // progress, complete, overdue
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users (optional, for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// PICA history table to track changes
export const picaHistory = pgTable("pica_history", {
  id: serial("id").primaryKey(),
  picaId: integer("pica_id").references(() => picas.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  comment: text("comment"),
});

// Relations
export const peopleRelations = relations(people, ({ one, many }) => ({
  department: one(departments, {
    fields: [people.departmentId],
    references: [departments.id],
  }),
  managedProjectSites: many(projectSites),
  picasInCharge: many(picas, { relationName: "pica_person" }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(people, {
    fields: [departments.headId],
    references: [people.id],
  }),
  members: many(people),
}));

export const projectSitesRelations = relations(projectSites, ({ one, many }) => ({
  manager: one(people, {
    fields: [projectSites.managerId],
    references: [people.id],
  }),
  picas: many(picas),
}));

export const picasRelations = relations(picas, ({ one, many }) => ({
  projectSite: one(projectSites, {
    fields: [picas.projectSiteId],
    references: [projectSites.id],
  }),
  personInCharge: one(people, {
    fields: [picas.personInChargeId],
    references: [people.id],
    relationName: "pica_person",
  }),
  history: many(picaHistory),
}));

export const picaHistoryRelations = relations(picaHistory, ({ one }) => ({
  pica: one(picas, {
    fields: [picaHistory.picaId],
    references: [picas.id],
  }),
  user: one(users, {
    fields: [picaHistory.userId],
    references: [users.id],
  }),
}));

// Insert schemas and types
export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export const insertProjectSiteSchema = createInsertSchema(projectSites).omit({
  id: true,
});

export type InsertProjectSite = z.infer<typeof insertProjectSiteSchema>;
export type ProjectSite = typeof projectSites.$inferSelect;

export const insertPicaSchema = createInsertSchema(picas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPica = z.infer<typeof insertPicaSchema>;
export type Pica = typeof picas.$inferSelect;

// Expanded PICA type with relations
export type PicaWithRelations = Pica & {
  projectSite: ProjectSite;
  personInCharge: Person;
  history?: PicaHistoryWithRelations[];
};

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// PICA History schema and types
export const insertPicaHistorySchema = createInsertSchema(picaHistory).omit({
  id: true,
  timestamp: true,
});

export type InsertPicaHistory = z.infer<typeof insertPicaHistorySchema>;
export type PicaHistory = typeof picaHistory.$inferSelect;

// Expanded PicaHistory type with relations
export type PicaHistoryWithRelations = PicaHistory & {
  user?: User;
};
