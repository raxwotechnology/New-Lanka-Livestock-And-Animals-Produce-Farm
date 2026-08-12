import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createManager = async () => {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node createManager.js <email> <password>');
    console.log('Example: node createManager.js manager@example.com Manager123!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database');

    // Import the User model
    const User = (await import('./src/models/User.js')).default;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`Error: User with email ${email} already exists!`);
      process.exit(1);
    }

    // Create the manager user
    const newManager = await User.create({
      firstName: 'Farm',
      lastName: 'Manager',
      email: email,
      phone: '+94770000002',
      password: password,
      role: 'manager'
    });

    console.log(`\n======================================`);
    console.log(`✓ Manager User Successfully Created!`);
    console.log(`  Email: ${newManager.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${newManager.role}`);
    console.log(`======================================\n`);

  } catch (error) {
    console.error('Failed to create manager:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createManager();
