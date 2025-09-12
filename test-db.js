const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Create a simple test
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    const testDoc = new Test({ name: 'SwapShelf Connection Test' });
    await testDoc.save();
    
    console.log('✅ Test document created:', testDoc);
    
    // Clean up
    await Test.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document removed');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
}

testConnection();
