const express = require('express');
const multer = require('multer');
const cors = require('cors');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.csv', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only .xlsx, .csv, and .pdf files are allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Simple in-memory user storage (in production, use a database)
const users = [
    {
        id: 1,
        email: 'admin@fraudscan.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        name: 'Admin User'
    }
];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Enhanced fraud detection algorithm
function detectFraud(transaction) {
    let fraudScore = 0;
    let reasons = [];

    // Rule 1: Amount-based analysis
    if (transaction.amount > 100000) {
        fraudScore += 50;
        reasons.push('Extremely high amount (>₹1,00,000)');
    } else if (transaction.amount > 50000) {
        fraudScore += 35;
        reasons.push('High amount transaction (>₹50,000)');
    } else if (transaction.amount > 25000) {
        fraudScore += 20;
        reasons.push('Moderate high amount (>₹25,000)');
    }

    // Rule 2: Suspicious merchant patterns
    const suspiciousMerchants = ['Unknown Merchant', 'Test Merchant', 'Suspicious Store', 'Fake', 'Scam'];
    const merchantLower = transaction.merchant.toLowerCase();
    
    if (suspiciousMerchants.some(pattern => merchantLower.includes(pattern.toLowerCase()))) {
        fraudScore += 45;
        reasons.push('Suspicious merchant detected');
    }

    // Rule 3: Round number amounts (often fraudulent)
    if (transaction.amount % 1000 === 0 && transaction.amount > 10000) {
        fraudScore += 15;
        reasons.push('Round number amount (suspicious pattern)');
    }

    // Rule 4: International/Unknown merchants with high amounts
    const trustedMerchants = ['amazon', 'flipkart', 'zomato', 'swiggy', 'uber', 'ola', 'paytm', 'big bazaar', 'reliance', 'tata'];
    const isTrustedMerchant = trustedMerchants.some(merchant => merchantLower.includes(merchant));
    
    if (!isTrustedMerchant && transaction.amount > 15000) {
        fraudScore += 25;
        reasons.push('Unknown merchant with high amount');
    }

    // Rule 5: High-value online transactions
    if (transaction.type === 'Online' && transaction.amount > 75000) {
        fraudScore += 30;
        reasons.push('Very high-value online transaction');
    }

    // Rule 6: Weekend high-value transactions
    const date = new Date(transaction.date);
    const dayOfWeek = date.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && transaction.amount > 30000) {
        fraudScore += 20;
        reasons.push('High-value weekend transaction');
    }

    // Rule 7: Multiple of 5000 amounts (common in fraud)
    if (transaction.amount % 5000 === 0 && transaction.amount > 20000) {
        fraudScore += 10;
        reasons.push('Amount in multiples of 5000');
    }

    return {
        isFraud: fraudScore >= 50,
        score: Math.min(fraudScore, 100),
        reasons: reasons,
        riskLevel: fraudScore >= 75 ? 'High' : fraudScore >= 50 ? 'Medium' : 'Low'
    };
}

// Parse different file formats
async function parseFile(filePath, fileType) {
    const transactions = [];

    try {
        if (fileType === '.xlsx') {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

            data.forEach(rawRow => {
                const row = normalizeRowKeys(rawRow);
                const parsed = buildTransaction(row);
                if (parsed) transactions.push(parsed);
            });
        } else if (fileType === '.csv') {
            return new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv({ mapHeaders: ({ header }) => sanitizeHeader(header) }))
                    .on('data', (data) => {
                        const parsed = buildTransaction(data);
                        if (parsed) results.push(parsed);
                    })
                    .on('end', () => {
                        resolve(results);
                    })
                    .on('error', reject);
            });
        }
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file');
    }

    return transactions;
}

// Utilities to normalize incoming data
function sanitizeHeader(header) {
    if (!header) return header;
    // Remove BOM, trim, collapse spaces, lowercase
    return header.replace(/^\uFEFF/, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeRowKeys(row) {
    const normalized = {};
    Object.keys(row).forEach((key) => {
        const clean = sanitizeHeader(String(key));
        normalized[clean] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    });
    return normalized;
}

function parseAmount(value) {
    if (value == null) return NaN;
    const str = String(value).trim();
    const isNegative = /^\(.*\)$/.test(str);
    const cleaned = str.replace(/[()₹$,]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return NaN;
    return isNegative ? -num : num;
}

function parseDateFlexible(value) {
    if (!value) return null;
    // Try native Date first
    const d1 = new Date(value);
    if (!isNaN(d1.getTime())) return d1.toISOString().slice(0, 10);
    // Try DD/MM/YYYY
    const m = String(value).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
        const [_, dd, mm, yyyy] = m;
        const y = yyyy.length === 2 ? `20${yyyy}` : yyyy;
        const date = new Date(`${y}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
    return null;
}

function buildTransaction(row) {
    // Add this line for debugging:
    console.log('Row received:', row);
    // Support multiple header variants
    const date = row.date || row.transactiondate || row['transaction date'] || row['posting date'];
    const merchant = row.merchant || row['merchant name'] || row.description || row['narration'];
    const amountRaw = row.amount || row['transaction amount'] || row['debit'] || row['credit'];
    const type = row.type || row['transaction type'] || row.mode || 'Unknown';

    const parsedDate = parseDateFlexible(date);
    const amount = parseAmount(amountRaw);

    if (!merchant || isNaN(amount)) {
        return null;
    }

    return {
        date: parsedDate || (date ? String(date) : ''),
        merchant: String(merchant).trim(),
        amount,
        type,
        status: 'Pending'
    };
}

// Routes

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('Registration attempt:', { name, email });

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword
        };

        users.push(newUser);
        console.log('User created successfully:', newUser.email);

        // Generate token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileType = path.extname(req.file.originalname).toLowerCase();

        // Parse the uploaded file
        const rawTransactions = await parseFile(filePath, fileType);

        if (rawTransactions.length === 0) {
            return res.status(400).json({ error: 'No valid transactions found in file' });
        }

        // Analyze transactions for fraud
        const analyzedTransactions = rawTransactions.map(transaction => {
            const fraudAnalysis = detectFraud(transaction);
            return {
                ...transaction,
                status: fraudAnalysis.isFraud ? 'Fraud' : 'Legit',
                fraudScore: fraudAnalysis.score,
                reasons: fraudAnalysis.reasons,
                riskLevel: fraudAnalysis.riskLevel
            };
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            transactions: analyzedTransactions,
            summary: {
                total: analyzedTransactions.length,
                fraud: analyzedTransactions.filter(t => t.status === 'Fraud').length,
                legitimate: analyzedTransactions.filter(t => t.status === 'Legit').length
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Demo data endpoint (for testing without file upload)
app.get('/api/demo-data', (req, res) => {
    const demoTransactions = [
        {
            date: '2024-01-15',
            merchant: 'Amazon India',
            amount: 2500,
            type: 'Online',
            status: 'Legit'
        },
        {
            date: '2024-01-16',
            merchant: 'Unknown Merchant',
            amount: 75000,
            type: 'Online',
            status: 'Fraud'
        },
        {
            date: '2024-01-17',
            merchant: 'Flipkart',
            amount: 1200,
            type: 'Online',
            status: 'Legit'
        },
        {
            date: '2024-01-18',
            merchant: 'Suspicious Store',
            amount: 45000,
            type: 'POS',
            status: 'Fraud'
        },
        {
            date: '2024-01-19',
            merchant: 'Zomato',
            amount: 800,
            type: 'Online',
            status: 'Legit'
        },
        {
            date: '2024-01-20',
            merchant: 'Test Merchant',
            amount: 95000,
            type: 'Online',
            status: 'Fraud'
        },
        {
            date: '2024-01-21',
            merchant: 'Swiggy',
            amount: 650,
            type: 'Online',
            status: 'Legit'
        },
        {
            date: '2024-01-22',
            merchant: 'Uber',
            amount: 350,
            type: 'Online',
            status: 'Legit'
        }
    ];

    res.json({
        success: true,
        transactions: demoTransactions,
        summary: {
            total: demoTransactions.length,
            fraud: demoTransactions.filter(t => t.status === 'Fraud').length,
            legitimate: demoTransactions.filter(t => t.status === 'Legit').length
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`FraudScan server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
    console.log('Available routes:');
    console.log('- GET / (Home page)');
    console.log('- GET /login (Login page)');
    console.log('- GET /register (Registration page)');
    console.log('- POST /api/register (User registration)');
    console.log('- POST /api/login (User login)');
});

module.exports = app;

