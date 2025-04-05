import { storage } from './storage';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    // Create users with different roles
    const adminHash = await hashPassword('admin123');
    const userHash = await hashPassword('user123');
    const publicHash = await hashPassword('public123');
    
    try {
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
      } else {
        console.log('Admin user already exists');
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
      } else {
        console.log('Regular user already exists');
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
      } else {
        console.log('Public viewer already exists');
      }
      
      console.log('User seeding complete!');
    } catch (error) {
      console.error('Error creating users:', error);
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

// Run the seed function
seedUsers();