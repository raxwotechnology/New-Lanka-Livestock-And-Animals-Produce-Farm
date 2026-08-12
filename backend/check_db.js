import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const settingsColl = db.collection('settings');
    const settings = await settingsColl.findOne({});
    let changed = false;
    
    if (settings && settings.companyEmail === 'dinuperera020@gmail.com') {
      await settingsColl.updateOne({}, { $set: { companyEmail: 'janstephan06@gmail.com' } });
      console.log('Fixed companyEmail in Settings.');
      changed = true;
    }
    
    const customersColl = db.collection('customers');
    const result = await customersColl.updateMany(
      { email: 'dinuperera020@gmail.com' },
      { $set: { email: 'janstephan06@gmail.com' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Fixed ${result.modifiedCount} customers.`);
      changed = true;
    }

    if (!changed) console.log('Email not found in DB.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
