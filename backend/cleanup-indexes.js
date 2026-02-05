require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Drop indexes
    try {
      await User.collection.dropIndexes();
      console.log('✅ Dropped User indexes');
    } catch (err) {
      console.log('User indexes already clean');
    }
    
    try {
      await Client.collection.dropIndexes();
      console.log('✅ Dropped Client indexes');
    } catch (err) {
      console.log('Client indexes already clean');
    }
    
    console.log('\n✅ Index cleanup complete!');
    console.log('Restart your server with: npm run dev');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
