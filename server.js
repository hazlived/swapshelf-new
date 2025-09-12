const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { adminAuth, verifyAdminCredentials } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'swapshelf-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('pages/home', { isAdmin: req.session?.isAdmin || false });
});

// Admin login route
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (verifyAdminCredentials(username, password)) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Admin logout route
app.post('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Admin status check route
app.get('/api/admin/status', (req, res) => {
    res.json({ isAdmin: req.session?.isAdmin || false });
});

// Protected admin route
app.get('/admin', adminAuth, (req, res) => {
    res.render('pages/admin', { isAdmin: true });
});

// NEW: ISBN Lookup API endpoint
app.get('/api/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn.trim();
    
    if (!isbn) {
        return res.status(400).json({ success: false, message: 'ISBN is required' });
    }

    try {
        // Use node-fetch for making HTTP requests (install with: npm install node-fetch@2)
        const fetch = (await import('node-fetch')).default || require('node-fetch');
        
        const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
        console.log(`📚 Looking up ISBN: ${isbn}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.totalItems > 0 && data.items && data.items[0]) {
            const book = data.items[0].volumeInfo;
            
            // Format the book data for our application
            const bookData = {
                title: book.title || '',
                authors: book.authors || [],
                description: book.description || '',
                categories: book.categories || [],
                pageCount: book.pageCount || '',
                publishedDate: book.publishedDate || '',
                publisher: book.publisher || '',
                imageLinks: book.imageLinks || {}
            };
            
            console.log(`✅ Found book: ${bookData.title}`);
            res.json({ 
                success: true, 
                book: bookData,
                message: 'Book found successfully'
            });
        } else {
            console.log(`❌ No book found for ISBN: ${isbn}`);
            res.json({ 
                success: false, 
                message: 'No book found for this ISBN' 
            });
        }
    } catch (error) {
        console.error('📚 ISBN lookup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error looking up ISBN',
            error: error.message 
        });
    }
});

// API route to get pending listings (admin only)
app.get('/api/admin/pending-listings', adminAuth, async (req, res) => {
    try {
        // This would fetch from your database
        // const pendingListings = await Listing.find({ status: 'PENDING_REVIEW' });
        res.json({ listings: [] }); // Placeholder
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
});

// API route for stats (public)
app.get('/api/stats', (req, res) => {
    // Placeholder stats - replace with real database queries
    res.json({
        totalResources: 0,
        booksAvailable: 0,
        notesAvailable: 0,
        citiesCount: 0
    });
});

// API route for featured listings (public)
app.get('/api/featured-listings', (req, res) => {
    // Placeholder - replace with real database query
    res.json([]);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SwapShelf Server Started`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📚 ISBN lookup endpoint: /api/isbn/:isbn`);
    console.log(`👤 Admin panel: http://localhost:${PORT}/admin`);
});