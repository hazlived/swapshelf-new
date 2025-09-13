require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const multer = require('multer');

const { adminAuth, verifyAdminCredentials } = require('./middleware/auth');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

dotenv.config();
console.log('Loaded SendGrid API key:', process.env.SENDGRID_API_KEY);
const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        console.log('📁 Processing file:', file.originalname, file.mimetype);
        cb(file.mimetype.startsWith('image/') ? null : new Error('Only image files are allowed!'), file.mimetype.startsWith('image/'));
    }
});

// Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'swapshelf-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Routes
app.get('/', (req, res) => res.render('pages/home', { isAdmin: req.session?.isAdmin || false }));

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (verifyAdminCredentials(username, password)) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: 'Logout failed' });
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/admin/status', (req, res) => res.json({ isAdmin: req.session?.isAdmin || false }));
app.get('/admin', adminAuth, (req, res) => res.render('pages/admin', { isAdmin: true }));

// Resource submission with image upload
app.post('/api/resources', upload.array('images', 5), (req, res) => {
    console.log('🚀 === RESOURCE SUBMISSION DEBUG ===');
    console.log('📝 Body:', req.body);
    console.log('📁 Files:', req.files.length);

    const { type, title, author_subject, description, condition, location, owner_email, tags } = req.body;
    const missing = [];
    ['type','title','author_subject','description','condition','location','owner_email']
        .forEach(field => !req.body[field] && missing.push(field));
    if (missing.length) {
        console.log('❌ Missing:', missing);
        return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}`, missing });
    }

    const imagePaths = req.files.map(f => `/uploads/${f.filename}`);
    console.log('🖼️ Images:', imagePaths);

    const newResource = {
        id: 'listing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type, title, author_subject, description, condition, location, owner_email,
        tags: tags ? tags.split(',').map(t=>t.trim()) : [],
        images: imagePaths, status: 'PENDING', featured: false, created_at: new Date().toISOString()
    };
    console.log('✅ Created resource:', newResource.title);
    res.json({ success: true, message: 'Resource submitted!', resource: newResource });
});

// ISBN Lookup
app.get('/api/isbn/:isbn', async (req, res) => {
    const isbn = req.params.isbn.trim();
    if (!isbn) return res.status(400).json({ success: false, message: 'ISBN required' });

    try {
        const fetch = require('node-fetch');
        const data = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)).json();
        if (data.totalItems && data.items[0]) {
            const book = data.items[0].volumeInfo;
            res.json({ success: true, book: {
                title: book.title||'', authors: book.authors||[], description: book.description||'', categories: book.categories||[]
            }});
        } else {
            res.json({ success: false, message: 'No book found' });
        }
    } catch (err) {
        console.error('ISBN error:', err);
        res.status(500).json({ success: false, message: 'ISBN lookup failed' });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('💥 ERROR:', err);
    if (err instanceof multer.MulterError) {
        if (err.code==='LIMIT_FILE_SIZE') return res.status(400).json({ success:false, message:'File too large' });
        if (err.code==='LIMIT_FILE_COUNT') return res.status(400).json({ success:false, message:'Too many files' });
    } else if (err.message==='Only image files are allowed!') {
        return res.status(400).json({ success:false, message: err.message });
    }
    res.status(500).json({ success:false, message:'Server error' });
});
    app.post('/api/send-request-email', async (req, res) => {
          console.log('Received send-request-email:', req.body);

const { owner_email, requester_name, requester_email, message, resource_title } = req.body;
  if (!owner_email || !requester_name || !requester_email || !message || !resource_title) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const email = {
    to: owner_email,
    from: 'namkeenbiskoot@gmail.com', // Verified SendGrid sender
    replyTo: requester_email,
    subject: `SwapShelf Request for "${resourceTitle}"`,
    text: `
Hello,

You have a new request for your resource "${resourceTitle}".
Requester: ${requester_name} <${requester_email}>
Message:
${message}

Please reply directly to the requester.

Regards,
SwapShelf Team
    `,
  };

  // === Insert logging block here ===
  try {
    console.log('Sending email via SendGrid...');
    await sgMail.send(email);
    console.log('SendGrid email sent successfully');
    return res.json({ success: true, message: 'Request email sent successfully' });
  } catch (error) {
    console.error('SendGrid sending error:', error);
    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
    }
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Debug Server listening on http://localhost:${PORT}`);
});
