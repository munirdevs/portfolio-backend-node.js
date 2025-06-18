/* ================================================================================
NOTE: This is a single-file representation of a multi-file Node.js/Express API project.
In a real project, each part (models, routes, controllers, etc.) would be in its own file
within a proper folder structure (e.g., /models, /routes, /controllers).
================================================================================
*/

// --- DEPENDENCIES REQUIRED ---
// In your terminal, run: npm install express mongoose jsonwebtoken bcryptjs cors dotenv
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 2. DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portfolioDB';
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected...');
        seedDatabase(); // Seed database with initial data if it's empty
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- 3. MONGOOSE SCHEMAS & MODELS ---

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Administrator', 'Editor'], default: 'Editor', required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true }
});
const User = mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: String,
    tech: [String],
    published: { type: Boolean, default: false },
    problem: String,
    process: String,
    outcome: String,
    architectureDiagram: String
}, { timestamps: true });
const Project = mongoose.model('Project', projectSchema);

const experienceSchema = new mongoose.Schema({
    role: { type: String, required: true },
    company: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    published: { type: Boolean, default: false }
}, { timestamps: true });
const Experience = mongoose.model('Experience', experienceSchema);

const expertiseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: String, 
    published: { type: Boolean, default: false }
}, { timestamps: true });
const Expertise = mongoose.model('Expertise', expertiseSchema);

const engineeringLogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, default: ''},
    published: { type: Boolean, default: false }
}, { timestamps: true });
const EngineeringLog = mongoose.model('EngineeringLog', engineeringLogSchema);

const personalInfoSchema = new mongoose.Schema({
    singleton: { type: String, default: 'main', unique: true }, 
    name: String, title: String, subtitle: String, summary: String,
    linkedin: String, github: String, email: String, cvPath: String
});
const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);

const skillsSchema = new mongoose.Schema({
    singleton: { type: String, default: 'main', unique: true },
    skills: [String]
});
const Skills = mongoose.model('Skills', skillsSchema);

const singleSectionSchema = new mongoose.Schema({
    sectionId: { type: String, required: true, unique: true },
    title: { type: String },
    description: { type: String }
});
const SingleSection = mongoose.model('SingleSection', singleSectionSchema);


// --- 4. SERVICES & MIDDLEWARE ---
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};
const verifyPassword = async (providedPassword, storedHash) => {
    return await bcrypt.compare(providedPassword, storedHash);
};

const authMiddleware = (requiredRole = 'Editor') => (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'a_very_secure_default_secret');
        req.user = decoded;
        
        if (requiredRole === 'Administrator' && req.user.role !== 'Administrator') {
            return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
        }
        
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// --- 5. GENERIC CRUD CONTROLLER FACTORY ---
const createCrudController = (Model) => ({
    getPublic: async (req, res) => {
        try {
            const items = await Model.find({ published: true }).sort({ createdAt: -1 });
            res.json(items);
        } catch (err) { res.status(500).json({ message: err.message }); }
    },
    getAllAdmin: async (req, res) => {
        try {
            const items = await Model.find({}).sort({ createdAt: -1 });
            res.json(items);
        } catch (err) { res.status(500).json({ message: err.message }); }
    },
    create: async (req, res) => {
        const item = new Model(req.body);
        try {
            const newItem = await item.save();
            res.status(201).json(newItem);
        } catch (err) { res.status(400).json({ message: err.message }); }
    },
    update: async (req, res) => {
        try {
            const updatedItem = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedItem) return res.status(404).json({ message: "Item not found" });
            res.json(updatedItem);
        } catch (err) { res.status(400).json({ message: err.message }); }
    },
    delete: async (req, res) => {
        try {
            const item = await Model.findByIdAndDelete(req.params.id);
            if (!item) return res.status(404).json({ message: "Item not found" });
            res.json({ message: "Item deleted successfully" });
        } catch (err) { res.status(500).json({ message: err.message }); }
    },
    getSingleton: async (req, res) => {
        try {
            const item = await Model.findOne({ singleton: 'main' });
            res.json(item || {});
        } catch (err) { res.status(500).json({ message: err.message }); }
    },
    updateSingleton: async (req, res) => {
        try {
            const updatedItem = await Model.findOneAndUpdate(
                { singleton: 'main' },
                req.body,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            res.json(updatedItem);
        } catch (err) { res.status(400).json({ message: err.message }); }
    }
});

// --- 6. API ROUTE DEFINITIONS ---

// Auth Routes
const authRouter = express.Router();
authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.status !== 'Active') return res.status(401).json({ message: "Invalid credentials or inactive user." });
        
        const isMatch = await verifyPassword(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });
        
        const payload = { id: user._id, name: user.name, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'a_very_secure_default_secret', { expiresIn: '8h' });

        res.json({ token, name: user.name, role: user.role });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});
app.use('/api/auth', authRouter);

// Generic CRUD Routes
const defineCrudRoutes = (router, model, endpointName) => {
    const controller = createCrudController(model);
    router.get('/', controller.getPublic);
    router.get('/all', authMiddleware(), controller.getAllAdmin);
    router.post('/', authMiddleware(), controller.create);
    router.put('/:id', authMiddleware(), controller.update);
    router.delete('/:id', authMiddleware('Administrator'), controller.delete);
    app.use(`/api/${endpointName}`, router);
};

defineCrudRoutes(express.Router(), Project, 'projects');
defineCrudRoutes(express.Router(), Experience, 'experience');
defineCrudRoutes(express.Router(), Expertise, 'expertise');
defineCrudRoutes(express.Router(), EngineeringLog, 'logs');

// User Management Routes
const userRouter = express.Router();
const userController = createCrudController(User);
userRouter.get('/', authMiddleware('Administrator'), userController.getAllAdmin);
userRouter.post('/', authMiddleware('Administrator'), async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;
        if (!name || !email || !password || !role || !status) return res.status(400).json({ message: "All fields are required" });
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });
        const passwordHash = await hashPassword(password);
        const newUser = new User({ name, email, passwordHash, role, status });
        await newUser.save();
        res.status(201).json({ id: newUser._id, name, email, role, status });
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// CORRECTED USER UPDATE ROUTE
userRouter.put('/:id', authMiddleware('Administrator'), async (req, res) => {
    try {
        const { name, email, role, status, password } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (password && password.length > 0) {
            updateData.passwordHash = await hashPassword(password);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.json(updatedUser);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
userRouter.delete('/:id', authMiddleware('Administrator'), userController.delete);
app.use('/api/users', userRouter);


// Singleton Content Routes
const personalInfoRouter = express.Router();
const personalInfoController = createCrudController(PersonalInfo);
personalInfoRouter.get('/', personalInfoController.getSingleton);
personalInfoRouter.put('/', authMiddleware(), personalInfoController.updateSingleton);
app.use('/api/personal-info', personalInfoRouter);

const skillsRouter = express.Router();
const skillsController = createCrudController(Skills);
skillsRouter.get('/', skillsController.getSingleton);
skillsRouter.put('/', authMiddleware(), skillsController.updateSingleton);
app.use('/api/skills', skillsRouter);

const singleSectionRouter = express.Router();
singleSectionRouter.get('/:sectionId', async (req, res) => {
    try {
        const item = await SingleSection.findOne({ sectionId: req.params.sectionId });
        res.json(item || {});
    } catch (err) { res.status(500).json({ message: err.message }); }
});
singleSectionRouter.put('/:sectionId', authMiddleware(), async (req, res) => {
    try {
        const { title, description } = req.body;
        const updatedSection = await SingleSection.findOneAndUpdate(
            { sectionId: req.params.sectionId },
            { title, description },
            { new: true, upsert: true }
        );
        res.json(updatedSection);
    } catch (err) { res.status(400).json({ message: err.message }); }
});
app.use('/api/sections', singleSectionRouter);


// --- 7. START SERVER ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// --- 8. Database Seeding Logic ---
async function seedDatabase() {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) return;

        console.log('Seeding database with professional data...');
        const adminPassword = await hashPassword('admin');
        await User.create([
            { name: "Munir Ahmad", email: "munirdevs@gmail.com", passwordHash: adminPassword, role: "Administrator", status: "Active" },
        ]);

        await PersonalInfo.create({
            name: "MUNIR AHMAD",
            title: "Software Engineer | Full Stack Developer (.NET, React)",
            subtitle: "London, UK | +44 7424 109470 | munirdevs@gmail.com | LinkedIn | Right to work in the UK",
            summary: "Highly skilled Full Stack Software Engineer with over 6+ years of experience building scalable, high-performance web applications using .NET Core, React, SQL, and Microsoft Azure. Proven track record of delivering enterprise solutions in agile teams across the UK, UAE, and Pakistan. Strong academic background with an MSc in Artificial Intelligence from the University of East London and practical experience integrating ML models into production environments.",
            linkedin: "https://linkedin.com/in/munir-ahmad-dev",
            github: "https://github.com/munirahmad-dev",
            email: "munirdevs@gmail.com",
            cvPath: "/munir-ahmad-cv.pdf"
        });

         await Skills.create({
            skills: [".NET 8", "ASP.NET Core", "OOP", "React 18", "Next.js", "Azure DevOps", "SQL Server", "REST APIs", "CI/CD", "Entity Framework Core", "Microservices", "Docker", "Agile/Scrum", "Python", "Al Integration"]
        });

        await Experience.create([
            { role: "Software Engineer (Full Stack)", company: "Obsession Content, London, UK", duration: "Oct 2024 - May 2025", description: "Designed and developed high-performance web applications using .NET Core MVC, creating intuitive user interfaces with jQuery and Bootstrap for seamless user experience across desktop and mobile devices.", published: true },
            { role: "Senior Software Engineer", company: "Delicate Software Solutions, Dubai", duration: "2020 - 2023", description: "Led a team of 4 engineers in developing an enterprise HR platform, improving delivery velocity by 40%.", published: true },
            { role: "Software Engineer", company: "Kemat Consulting, London", duration: "2024", description: "Architected a multi-tenant SaaS platform, reducing infrastructure costs by 40% while ensuring GDPR compliance.", published: true },
        ]);

        await Project.create([
             { 
                title: "Enterprise HR Management System",
                tech: [".NET Core", "Entity Framework Core", "React", "SQL Server", "SignalR", "CSS3"],
                description: "A full-featured HR and payroll platform featuring real-time notifications, employee lifecycle management, interactive dashboards, and automated workflow interfaces.",
                published: true,
                problem: "A multinational corporation with 15,000+ employees required a unified platform to replace disparate, manual HR processes, facing challenges in payroll accuracy and regulatory compliance.",
                process: "Led the architectural design, opting for a .NET Core microservices backend for scalability and a React SPA for a responsive, real-time user experience. We integrated SignalR for live notifications and built a custom analytics module with role-based access control.",
                outcome: "Developed a responsive employee self-service portal with performance tracking, leave management, and real-time notifications serving 15,000+ employees. Hosted APIs on Azure with secure RBAC and monitoring dashboards."
            },
        ]);

        await Expertise.create([
            { title: "Machine Learning Integration", description: "Integrating ML models into production environments to enhance application intelligence and functionality.", published: true, icon: "Cpu" },
            { title: "Microservices Architecture", description: "Designing and building scalable, distributed systems using a microservices-based approach on platforms like Azure.", published: true, icon: "Cloud" },
            { title: "RESTful API Development", description: "Building secure and scalable RESTful web APIs serving multiple client applications with JSON-based data exchange.", published: true, icon: "BrainCircuit" },
        ]);

        await EngineeringLog.create([
            { title: "System Design & Software Architecture", excerpt: "A deep-dive into designing scalable and maintainable software systems, focusing on modern architectural patterns.", published: true, content: "Full content for System Design post..." },
            { title: "Advanced SQL Database Management", excerpt: "Exploring complex query optimization, indexing strategies, and database management techniques for high-performance applications.", published: true, content: "Full content for Advanced SQL post..." },
        ]);

        await SingleSection.create([
            { sectionId: "resume", title: "My Resume", description: "For a detailed look at my qualifications and experience, please download my CV." },
            { sectionId: "contact", title: "Let's Connect", description: "I'm currently open to senior roles and challenging projects. If you're building something innovative, let's talk." },
            { sectionId: "recruiter-toolkit", title: "Recruiter Toolkit", description: "Paste a job description below to see how my skills align. This feature uses AI to provide an instant match analysis." }
        ]);
        console.log('Database seeded successfully!');
    } catch (error) {
        if(error.code !== 11000) { // Ignore duplicate key errors which can happen on hot-reloads
             console.error('Error seeding database:', error);
        }
    }
}
