const mongoose = require('mongoose');
require('dotenv').config();

// Import your models (we'll create these later)
const Listing = require('../models/Listing');

const sampleListings = [
  {
    type: 'BOOK',
    title: 'Introduction to Algorithms',
    author_subject: 'Thomas H. Cormen',
    description: 'Comprehensive textbook covering fundamental algorithms and data structures.',
    condition: 'Good',
    location: 'Boston, MA',
    owner_email: 'student@example.edu',
    tags: ['Computer Science', 'Algorithms', 'Textbook'],
    status: 'PUBLISHED',
    featured: true
  },
  // Add more sample data...
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌱 Connected to MongoDB for seeding...');
    
    // Clear existing data
    await Listing.deleteMany({});
    console.log('🗑️  Cleared existing listings');
    
    // Insert sample data
    await Listing.insertMany(sampleListings);
    console.log('✅ Sample listings inserted');
    
    await mongoose.connection.close();
    console.log('🌱 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
