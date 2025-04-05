import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, UserRole } from "@shared/schema";
import { log } from "./vite";

// Use TypeScript to enhance Express Request object
declare global {
  namespace Express {
    // Extend Express.User with our User type
    interface User {
      id: number;
      name: string;
      username: string;
      email: string;
      role: string;
      password: string;
      createdAt: Date;
      lastLogin: Date | null;
    }
  }
}

// Helper for async password hashing
const scryptAsync = promisify(scrypt);

// Hash a password
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Verify a password against a stored hash
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Check if user has required role
export function checkRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}

// Check if user can edit (admin or regular user)
export function canEdit(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (req.user.role !== "user" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  
  next();
}

// Check if user can delete (admin only)
export function canDelete(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  
  next();
}

// Setup authentication
export function setupAuth(app: Express) {
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "PICA_MONITOR_DEV_SECRET",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password auth
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Update last login timestamp
        await storage.updateUserLastLogin(user.id);
        
        return done(null, user);
      } catch (error) {
        log(`Authentication error: ${error}`, "auth");
        return done(error);
      }
    })
  );

  // Tell passport how to serialize the user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Tell passport how to deserialize the user
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message?: string }) => {
      if (err) {
        log(`Login error: ${err}`, "auth");
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info.message || "Invalid credentials" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          log(`Login error: ${loginErr}`, "auth");
          return next(loginErr);
        }
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        log(`Logout error: ${err}`, "auth");
        return res.status(500).json({ error: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Check for the special code pattern 12345ABC + current date
      const { signupCode, organizationName, ...userData } = req.body;
      const today = new Date();
      // Format: MMDDYYYY - ensure month and day are padded with zeros if needed
      const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}${today.getFullYear()}`;
      const expectedCode = `12345ABC${formattedDate}`;
      
      // For debugging
      console.log(`Expected code: ${expectedCode}, Received code: ${signupCode}`);
      
      let organizationId = null;
      
      // Special case for development/testing
      const fixedTestCode = "12345ABC04052025";
      
      // Validate the signup code if provided
      if (signupCode) {
        if (signupCode !== expectedCode && signupCode !== fixedTestCode) {
          return res.status(400).json({ error: "Invalid signup code" });
        }
        
        // If code is valid, set role to admin
        userData.role = "admin";
        userData.isOrganizationAdmin = true;
        
        // Create a new organization if a name is provided
        if (organizationName) {
          const newOrg = await storage.createOrganization({
            name: organizationName,
            hasPaid: false,
            subscriptionActive: false
          });
          
          organizationId = newOrg.id;
        }
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user
      const userToCreate = {
        ...userData,
        password: hashedPassword,
        organizationId
      };
      
      const newUser = await storage.createUser(userToCreate);
      
      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          log(`Registration login error: ${err}`, "auth");
          return next(err);
        }
        
        // Don't send the password hash to the client
        const { password, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      log(`Registration error: ${error}`, "auth");
      next(error);
    }
  });

  // Current user info route
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Don't send the password hash to the client
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Public user route to check if session exists (no auth required)
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ isAuthenticated: true, role: req.user.role });
    } else {
      res.json({ isAuthenticated: false, role: "public" });
    }
  });
}