import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Person In Charge
export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  departmentId: integer("department_id"),
});

export const insertPersonSchema = createInsertSchema(people).omit({
  id: true,
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof people.$inferSelect;

// Department
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  headId: integer("head_id"),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// Project Site
export const projectSites = pgTable("project_sites", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  managerId: integer("manager_id"),
});

export const insertProjectSiteSchema = createInsertSchema(projectSites).omit({
  id: true,
});

export type InsertProjectSite = z.infer<typeof insertProjectSiteSchema>;
export type ProjectSite = typeof projectSites.$inferSelect;

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
});

export const insertPicaSchema = createInsertSchema(picas).omit({
  id: true,
  createdAt: true,
});

export type InsertPica = z.infer<typeof insertPicaSchema>;
export type Pica = typeof picas.$inferSelect;

// Expanded PICA type with relations
export type PicaWithRelations = Pica & {
  projectSite: ProjectSite;
  personInCharge: Person;
};

// Users (optional, for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
