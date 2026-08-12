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
    
    if (settings && settings.companyPhone === '0701126663') {
      await settingsColl.updateOne({}, { $set: { companyPhone: '0760348159' } });
      console.log('Fixed companyPhone in Settings.');
      changed = true;
    }
    
    const customersColl = db.collection('customers');
    const result = await customersColl.updateMany(
      { phone: '0701126663' },
      { $set: { phone: '0760348159' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Fixed ${result.modifiedCount} customers (phone).`);
      changed = true;
    }

    const resultMobile = await customersColl.updateMany(
      { "primaryContact.mobile": '0701126663' },
      { $set: { "primaryContact.mobile": '0760348159' } }
    );
    if (resultMobile.modifiedCount > 0) {
      console.log(`Fixed ${resultMobile.modifiedCount} customers (primaryContact.mobile).`);
      changed = true;
    }

    if (!changed) console.log('Phone number not found in DB.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
