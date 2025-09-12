// SwapShelf Application JavaScript
class SwapShelfApp {
    constructor() {
        this.currentPage = 'home';
        this.currentListingId = null;
        this.itemsPerPage = 9;
        this.currentPageNumber = 1;
        this.isAdmin = false;

        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            this.initialize();
        }
    }

    async initialize() {
        this.initializeData();
        this.bindEvents();
        this.updateStats();

        // Check admin status first
        await this.checkAdminStatus();
        // Update navigation based on admin status
        this.updateNavigation();

        // Check if we should go to admin page after login
        const shouldGoToAdmin = sessionStorage.getItem('redirectToAdmin');
        if (shouldGoToAdmin === 'true' && this.isAdmin) {
            sessionStorage.removeItem('redirectToAdmin');
            console.log('Redirecting to admin dashboard...');
            this.loadPage('admin');
        } else {
            this.loadPage('home');
        }
    }

    // Check if user is admin
    async checkAdminStatus() {
        try {
            const response = await fetch('/api/admin/status');
            if (response.ok) {
                const data = await response.json();
                this.isAdmin = data.isAdmin;
                console.log('Admin status:', this.isAdmin);
            }
        } catch (error) {
            console.log('Error checking admin status:', error);
            this.isAdmin = false;
        }
    }

    // Update navigation based on admin status
    updateNavigation() {
        const navbarMenu = document.querySelector('.navbar-menu');
        if (!navbarMenu) return;

        // Find existing admin/logout buttons
        const existingAdminBtn = navbarMenu.querySelector('.admin-link');
        const existingLogoutBtn = navbarMenu.querySelector('button[onclick="app.logout()"]');

        // Remove existing buttons
        if (existingAdminBtn) existingAdminBtn.remove();
        if (existingLogoutBtn) existingLogoutBtn.remove();

        if (this.isAdmin) {
            // Add Admin link and Logout button
            const adminLink = document.createElement('a');
            adminLink.href = '#';
            adminLink.className = 'nav-link admin-link';
            adminLink.setAttribute('data-page', 'admin');
            adminLink.textContent = 'Admin';
            navbarMenu.appendChild(adminLink);

            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'nav-link btn btn--outline';
            logoutBtn.setAttribute('onclick', 'app.logout()');
            logoutBtn.textContent = 'Logout';
            navbarMenu.appendChild(logoutBtn);
        } else {
            // Add Admin login button
            const adminBtn = document.createElement('button');
            adminBtn.className = 'nav-link admin-link';
            adminBtn.setAttribute('onclick', 'app.showAdminLogin()');
            adminBtn.textContent = 'Admin';
            navbarMenu.appendChild(adminBtn);
        }

        console.log('Navigation updated for admin status:', this.isAdmin);
    }

    // Initialize sample data
    initializeData() {
        if (!localStorage.getItem('swapshelf_listings')) {
            const sampleListings = [
                {
                    id: this.generateId(),
                    type: "BOOK",
                    title: "Introduction to Algorithms",
                    author_subject: "Thomas H. Cormen",
                    description: "Comprehensive textbook covering fundamental algorithms and data structures. Great condition, minimal highlighting.",
                    condition: "Good",
                    location: "Boston, MA",
                    owner_email: "student@example.edu",
                    tags: ["Computer Science", "Algorithms", "Textbook"],
                    status: "PENDING",
                    featured: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    type: "NOTES",
                    title: "Calculus II Study Notes",
                    author_subject: "Mathematics",
                    description: "Detailed handwritten notes covering integration, sequences, and series. Perfect for exam preparation.",
                    condition: "Excellent",
                    location: "New York, NY",
                    owner_email: "mathstudent@university.edu",
                    tags: ["Mathematics", "Calculus", "Study Notes"],
                    status: "PENDING",
                    featured: false,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    type: "BOOK",
                    title: "Organic Chemistry",
                    author_subject: "Paula Yurkanis Bruice",
                    description: "Essential chemistry textbook with practice problems. Some wear but all pages intact.",
                    condition: "Fair",
                    location: "Chicago, IL",
                    owner_email: "chemstudent@college.edu",
                    tags: ["Chemistry", "Organic", "Textbook"],
                    status: "PUBLISHED",
                    featured: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    type: "BOOK",
                    title: "Data Structures and Algorithms",
                    author_subject: "Michael T. Goodrich",
                    description: "Essential computer science textbook with comprehensive examples. Excellent condition with minimal wear.",
                    condition: "Excellent",
                    location: "Seattle, WA",
                    owner_email: "csStudent@university.edu",
                    tags: ["Computer Science", "Programming", "Textbook"],
                    status: "PUBLISHED",
                    featured: true,
                    created_at: new Date().toISOString()
                }
            ];

            localStorage.setItem('swapshelf_listings', JSON.stringify(sampleListings));
        }

        if (!localStorage.getItem('swapshelf_locations')) {
            const locations = ["Boston, MA", "New York, NY", "Chicago, IL", "Austin, TX", "Los Angeles, CA", "Seattle, WA", "Miami, FL"];
            localStorage.setItem('swapshelf_locations', JSON.stringify(locations));
        }
    }

    // Event bindings
    bindEvents() {
        // Navigation - handle both nav links and buttons
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-page') || e.target.closest('[data-page]')) {
                e.preventDefault();
                const element = e.target.hasAttribute('data-page') ? e.target : e.target.closest('[data-page]');
                const page = element.dataset.page;
                this.loadPage(page);
            }
        });

        // Collapsible navbar toggle for mobile view
        const navbarToggle = document.querySelector('.navbar-toggle');
        const navbarMenu = document.querySelector('.navbar-menu');
        if (navbarToggle && navbarMenu) {
            navbarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navbarMenu.classList.toggle('active');
                const expanded = navbarMenu.classList.contains('active');
                navbarToggle.setAttribute('aria-expanded', expanded);
            });

            document.addEventListener('click', (e) => {
                if (!navbarMenu.contains(e.target) && !navbarToggle.contains(e.target)) {
                    navbarMenu.classList.remove('active');
                    navbarToggle.setAttribute('aria-expanded', false);
                }
            });
        }

        // Search and filters
        const searchInput = document.getElementById('search-input');
        const typeFilter = document.getElementById('type-filter');
        const conditionFilter = document.getElementById('condition-filter');
        const locationFilter = document.getElementById('location-filter');
        const adminStatusFilter = document.getElementById('admin-status-filter');

        if (searchInput) searchInput.addEventListener('input', () => this.filterListings());
        if (typeFilter) typeFilter.addEventListener('change', () => this.filterListings());
        if (conditionFilter) conditionFilter.addEventListener('change', () => this.filterListings());
        if (locationFilter) locationFilter.addEventListener('change', () => this.filterListings());
        if (adminStatusFilter) adminStatusFilter.addEventListener('change', () => this.loadAdminListings());

        // Forms
        const listingForm = document.getElementById('listing-form');
        const requestForm = document.getElementById('request-form');
        const adminLoginForm = document.getElementById('admin-login-form');

        if (listingForm) listingForm.addEventListener('submit', (e) => this.handleListingSubmit(e));
        if (requestForm) requestForm.addEventListener('submit', (e) => this.handleRequestSubmit(e));
        if (adminLoginForm) adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));

        // ISBN lookup functionality - NEW
        const isbnInput = document.getElementById('isbn');
        const lookupBtn = document.getElementById('isbn-lookup-btn');
        if (isbnInput && lookupBtn) {
            lookupBtn.addEventListener('click', () => this.lookupISBN());
            isbnInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.lookupISBN();
                }
            });
        }

        // Modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-backdrop')) {
                this.closeModal();
            }
        });

        // Notification
        const notificationClose = document.getElementById('notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }

        // Populate location filter
        this.populateLocationFilter();

        // Make global functions available
        window.app = this;
    }

    // NEW: ISBN Lookup functionality
    async lookupISBN() {
        const isbnInput = document.getElementById('isbn');
        const isbn = isbnInput.value.trim();
        
        if (!isbn) {
            this.showNotification('Please enter an ISBN', 'error');
            return;
        }

        // Show loading state
        const lookupBtn = document.getElementById('isbn-lookup-btn');
        const originalText = lookupBtn.textContent;
        lookupBtn.textContent = 'Looking up...';
        lookupBtn.disabled = true;

        try {
            const response = await fetch(`/api/isbn/${isbn}`);
            const data = await response.json();

            if (data.success && data.book) {
                // Fill form fields with book data
                const book = data.book;
                
                // Set type to BOOK automatically when using ISBN
                const typeSelect = document.getElementById('type');
                if (typeSelect) typeSelect.value = 'BOOK';

                // Fill title
                const titleInput = document.getElementById('title');
                if (titleInput && book.title) titleInput.value = book.title;

                // Fill author
                const authorInput = document.getElementById('author_subject');
                if (authorInput && book.authors) {
                    authorInput.value = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
                }

                // Fill description
                const descInput = document.getElementById('description');
                if (descInput && book.description) {
                    descInput.value = book.description;
                }

                // Auto-fill tags based on categories
                const tagsInput = document.getElementById('tags');
                if (tagsInput && book.categories) {
                    const categories = Array.isArray(book.categories) ? book.categories : [book.categories];
                    tagsInput.value = categories.join(', ');
                }

                this.showNotification('📚 Book information loaded successfully!', 'success');
            } else {
                this.showNotification('Book not found. Please fill in the details manually.', 'warning');
            }
        } catch (error) {
            console.error('ISBN lookup error:', error);
            this.showNotification('Error looking up book. Please try again.', 'error');
        } finally {
            // Reset button state
            lookupBtn.textContent = originalText;
            lookupBtn.disabled = false;
        }
    }

    // Admin login functionality
    showAdminLogin() {
        // If already admin, go to admin page directly
        if (this.isAdmin) {
            console.log('Already logged in as admin, going to admin page');
            this.loadPage('admin');
            return;
        }

        // Otherwise show login modal
        const modal = document.getElementById('admin-login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('admin-username').focus();
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                // Update admin status immediately
                this.isAdmin = true;
                // Update navigation to show logout button
                this.updateNavigation();
                this.closeModal();
                // Clear the login form
                document.getElementById('admin-login-form').reset();
                this.showNotification('Login successful! Going to admin dashboard...', 'success');

                // Direct redirect to admin without page reload
                setTimeout(() => {
                    this.loadPage('admin');
                }, 800);
            } else {
                this.showNotification('Invalid credentials. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    // Admin logout functionality
    async logout() {
        // Show custom confirmation dialog
        const userConfirmed = confirm('🔓 Admin Logout Confirmation\n\nAre you sure you want to logout from the admin panel?\n\nYou will be redirected to the homepage.');
        if (!userConfirmed) {
            return; // User cancelled logout
        }

        try {
            const response = await fetch('/admin/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                // Update admin status
                this.isAdmin = false;
                // Update navigation to show login button
                this.updateNavigation();
                this.showNotification('Logging out... Redirecting to homepage', 'success');
                // Clear any admin-related session storage
                sessionStorage.clear();
                // Redirect to homepage after brief delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showNotification('Logout failed. Please try again.', 'error');
            }
        } catch (error) {
            this.showNotification('Logout failed. Please try again.', 'error');
            console.error('Logout error:', error);
        }
    }

    // Utility functions
    generateId() {
        return 'listing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    // Data management
    getListings() {
        return JSON.parse(localStorage.getItem('swapshelf_listings') || '[]');
    }

    saveListings(listings) {
        localStorage.setItem('swapshelf_listings', JSON.stringify(listings));
        this.updateStats();
    }

    getListing(id) {
        const listings = this.getListings();
        return listings.find(listing => listing.id === id);
    }

    getLocations() {
        return JSON.parse(localStorage.getItem('swapshelf_locations') || '[]');
    }

    // Page management
    loadPage(page) {
        console.log('Loading page:', page, 'Admin status:', this.isAdmin);

        // Check admin access
        if (page === 'admin' && !this.isAdmin) {
            console.log('Access denied to admin, showing login');
            this.showAdminLogin();
            return;
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Show target page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('Showing page:', page);
        } else {
            console.error('Page not found:', page);
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeNavLink = document.querySelector(`.nav-link[data-page="${page}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        this.currentPage = page;

        // Load page-specific content
        switch(page) {
            case 'home':
                this.loadFeaturedListings();
                break;
            case 'browse':
                this.loadBrowseListings();
                break;
            case 'create':
                this.resetCreateForm();
                break;
            case 'admin':
                this.loadAdminListings();
                break;
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    // Statistics
    updateStats() {
        const listings = this.getListings();
        const publishedListings = listings.filter(l => l.status === 'PUBLISHED');
        const books = publishedListings.filter(l => l.type === 'BOOK');
        const notes = publishedListings.filter(l => l.type === 'NOTES');
        const locations = [...new Set(publishedListings.map(l => l.location))];

        console.log('Stats - Published:', publishedListings.length, 'Books:', books.length, 'Notes:', notes.length);

        const totalListingsEl = document.getElementById('total-listings');
        const totalBooksEl = document.getElementById('total-books');
        const totalNotesEl = document.getElementById('total-notes');
        const totalLocationsEl = document.getElementById('total-locations');

        if (totalListingsEl) totalListingsEl.textContent = publishedListings.length;
        if (totalBooksEl) totalBooksEl.textContent = books.length;
        if (totalNotesEl) totalNotesEl.textContent = notes.length;
        if (totalLocationsEl) totalLocationsEl.textContent = locations.length;

        // Admin stats
        const adminTotalEl = document.getElementById('admin-total-listings');
        const adminPublishedEl = document.getElementById('admin-published-listings');
        const adminPendingEl = document.getElementById('admin-pending-listings');
        const adminReportedEl = document.getElementById('admin-reported-listings');

        if (adminTotalEl) {
            const pendingListings = listings.filter(l => l.status === 'PENDING');
            const reportedListings = listings.filter(l => l.status === 'REPORTED');

            adminTotalEl.textContent = listings.length;
            if (adminPublishedEl) adminPublishedEl.textContent = publishedListings.length;
            if (adminPendingEl) adminPendingEl.textContent = pendingListings.length;
            if (adminReportedEl) adminReportedEl.textContent = reportedListings.length;
        }
    }

    // Featured listings (only show published)
    loadFeaturedListings() {
        const listings = this.getListings();
        const featured = listings.filter(l => l.featured && l.status === 'PUBLISHED');
        const container = document.getElementById('featured-listings');

        console.log('Loading featured listings:', featured.length, 'found');

        if (!container) {
            console.error('Featured listings container not found');
            return;
        }

        if (featured.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No featured resources yet</h3>
                    <p>Check back soon for featured resources!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = featured.map(listing => this.renderListingCard(listing)).join('');
    }

    // Browse listings (only show published)
    loadBrowseListings() {
        this.filterListings();
    }

    filterListings() {
        const listings = this.getListings();
        // Only show published listings to regular users
        const publishedListings = listings.filter(l => l.status === 'PUBLISHED');

        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';
        const conditionFilter = document.getElementById('condition-filter')?.value || '';
        const locationFilter = document.getElementById('location-filter')?.value || '';

        let filtered = publishedListings.filter(listing => {
            const matchesSearch = !searchTerm || 
                listing.title.toLowerCase().includes(searchTerm) ||
                listing.author_subject.toLowerCase().includes(searchTerm) ||
                listing.description.toLowerCase().includes(searchTerm) ||
                (listing.tags && listing.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

            const matchesType = !typeFilter || listing.type === typeFilter;
            const matchesCondition = !conditionFilter || listing.condition === conditionFilter;
            const matchesLocation = !locationFilter || listing.location === locationFilter;

            return matchesSearch && matchesType && matchesCondition && matchesLocation;
        });

        this.renderFilteredListings(filtered);
    }

    renderFilteredListings(listings) {
        const container = document.getElementById('browse-listings');
        if (!container) return;

        if (listings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No listings found</h3>
                    <p>Try adjusting your search criteria or create a new listing.</p>
                </div>
            `;
            return;
        }

        // Pagination logic
        const startIndex = (this.currentPageNumber - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedListings = listings.slice(startIndex, endIndex);

        container.innerHTML = paginatedListings.map(listing => this.renderListingCard(listing)).join('');
        this.renderPagination(listings.length);
    }

    // Admin listings (show all)
    async loadAdminListings() {
        if (!this.isAdmin) {
            console.log('Not admin, cannot load admin listings');
            return;
        }

        console.log('Loading admin listings...');
        const listings = this.getListings();
        const statusFilter = document.getElementById('admin-status-filter')?.value || '';

        let filtered = listings;
        if (statusFilter) {
            filtered = listings.filter(l => l.status === statusFilter);
        }

        const container = document.getElementById('admin-listings-container');
        if (!container) {
            console.error('Admin listings container not found');
            return;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No listings found</h3>
                    <p>No listings match the current filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(listing => this.renderAdminListingItem(listing)).join('');
    }

    renderAdminListingItem(listing) {
        const statusClass = listing.status.toLowerCase();
        
        return `
            <div class="admin-listing-item">
                <div class="admin-listing-info">
                    <h3 class="admin-listing-title">${listing.title}</h3>
                    <div class="admin-listing-meta">
                        <span class="listing-type">${listing.type}</span>
                        <span class="status status--${statusClass === 'published' ? 'success' : (statusClass === 'pending' ? 'warning' : 'error')}">${listing.status}</span>
                        <span>By: ${listing.owner_email}</span>
                        <span>Created: ${this.formatDate(listing.created_at)}</span>
                    </div>
                </div>
                <div class="admin-listing-actions">
                    <button class="btn btn--sm btn--outline" onclick="app.viewListing('${listing.id}')">View</button>
                    ${listing.status === 'PENDING' ? `
                        <button class="btn btn--sm btn--success" onclick="app.approveListing('${listing.id}')">Approve</button>
                        <button class="btn btn--sm btn--error" onclick="app.rejectListing('${listing.id}')">Reject</button>
                    ` : ''}
                    ${listing.status === 'PUBLISHED' ? `
                        <button class="btn btn--sm btn--warning" onclick="app.unpublishListing('${listing.id}')">Unpublish</button>
                    ` : ''}
                    <button class="btn btn--sm btn--error" onclick="app.deleteListing('${listing.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    // Admin actions
    approveListing(id) {
        const listings = this.getListings();
        const listingIndex = listings.findIndex(l => l.id === id);
        
        if (listingIndex !== -1) {
            listings[listingIndex].status = 'PUBLISHED';
            this.saveListings(listings);
            this.loadAdminListings();
            this.showNotification('Listing approved and published', 'success');
        }
    }

    rejectListing(id) {
        if (confirm('Are you sure you want to reject this listing?')) {
            const listings = this.getListings();
            const filteredListings = listings.filter(l => l.id !== id);
            this.saveListings(filteredListings);
            this.loadAdminListings();
            this.showNotification('Listing rejected and deleted', 'success');
        }
    }

    unpublishListing(id) {
        if (confirm('Are you sure you want to unpublish this listing?')) {
            const listings = this.getListings();
            const listingIndex = listings.findIndex(l => l.id === id);
            
            if (listingIndex !== -1) {
                listings[listingIndex].status = 'PENDING';
                this.saveListings(listings);
                this.loadAdminListings();
                this.showNotification('Listing unpublished', 'success');
            }
        }
    }

    deleteListing(id) {
        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            const listings = this.getListings();
            const filteredListings = listings.filter(l => l.id !== id);
            this.saveListings(filteredListings);
            this.loadAdminListings();
            this.showNotification('Listing deleted', 'success');
        }
    }

    renderListingCard(listing) {
        const featuredClass = listing.featured ? 'featured' : '';
        
        return `
            <div class="listing-card ${featuredClass}" onclick="app.viewListing('${listing.id}')">
                <div class="listing-type">${listing.type}</div>
                <h3 class="listing-title">${listing.title}</h3>
                <p class="listing-author">${listing.author_subject}</p>
                <p class="listing-description">${listing.description}</p>
                <div class="listing-meta">
                    <span class="listing-condition condition-${listing.condition.toLowerCase()}">${listing.condition}</span>
                    <span class="listing-location">${listing.location}</span>
                </div>
                ${listing.tags ? `
                    <div class="listing-tags">
                        ${listing.tags.map(tag => `<span class="listing-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Form handling
    resetCreateForm() {
        const form = document.getElementById('listing-form');
        if (form) form.reset();
    }

    handleListingSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const newListing = {
            id: this.generateId(),
            type: formData.get('type'),
            title: formData.get('title'),
            author_subject: formData.get('author_subject'),
            description: formData.get('description'),
            condition: formData.get('condition'),
            location: formData.get('location'),
            owner_email: formData.get('owner_email'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            status: 'PENDING', // All new listings start as pending
            featured: false,
            created_at: new Date().toISOString()
        };

        const listings = this.getListings();
        listings.push(newListing);
        this.saveListings(listings);

        this.showNotification('Listing submitted for review! It will appear after admin approval.', 'success');
        this.resetCreateForm();
        this.loadPage('browse');
    }

    handleRequestSubmit(e) {
        e.preventDefault();
        // In a real app, this would send an email or notification
        this.showNotification('Request sent successfully!', 'success');
        this.closeModal();
    }

    // Modal management
    viewListing(id) {
        const listing = this.getListing(id);
        if (!listing) return;

        const modal = document.getElementById('listing-modal');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');

        title.textContent = listing.title;
        content.innerHTML = `
            <div class="listing-detail">
                <div class="listing-detail-header">
                    <h1 class="listing-detail-title">${listing.title}</h1>
                    <p class="listing-detail-author">by ${listing.author_subject}</p>
                </div>
                <div class="listing-detail-meta">
                    <div class="meta-item">
                        <div class="meta-label">Type</div>
                        <div class="meta-value">${listing.type}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Condition</div>
                        <div class="meta-value">${listing.condition}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Location</div>
                        <div class="meta-value">${listing.location}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">Status</div>
                        <div class="meta-value status status--${listing.status.toLowerCase() === 'published' ? 'success' : 'warning'}">${listing.status}</div>
                    </div>
                </div>
                <div class="listing-detail-description">
                    <h3>Description</h3>
                    <p>${listing.description}</p>
                </div>
                ${listing.tags ? `
                    <div class="listing-tags">
                        ${listing.tags.map(tag => `<span class="listing-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                ${listing.status === 'PUBLISHED' ? `
                    <div class="listing-detail-actions">
                        <button class="btn btn--primary" onclick="app.contactOwner('${listing.id}')">Contact Owner</button>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    contactOwner(listingId) {
        const listing = this.getListing(listingId);
        if (!listing) return;

        this.closeModal();
        const modal = document.getElementById('contact-modal');
        const listingIdField = document.getElementById('contact-listing-id');
        const messageField = document.getElementById('request-message');

        listingIdField.value = listingId;
        messageField.value = `Hi! I'm interested in your ${listing.type.toLowerCase()}: "${listing.title}".`;

        modal.classList.remove('hidden');
        document.getElementById('requester-name').focus();
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
    }

    // Location filter population
    populateLocationFilter() {
        const locationFilter = document.getElementById('location-filter');
        if (!locationFilter) return;

        const locations = this.getLocations();
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    // Pagination
    renderPagination(totalItems) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (this.currentPageNumber > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="app.goToPage(${this.currentPageNumber - 1})">Previous</button>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === this.currentPageNumber ? 'active' : '';
            paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="app.goToPage(${i})">${i}</button>`;
        }

        // Next button
        if (this.currentPageNumber < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="app.goToPage(${this.currentPageNumber + 1})">Next</button>`;
        }

        container.innerHTML = paginationHTML;
    }

    goToPage(pageNumber) {
        this.currentPageNumber = pageNumber;
        this.filterListings();
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');

        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideNotification(), 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('hidden');
    }
}

// Initialize the application
new SwapShelfApp();