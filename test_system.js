// Test script for FraudScan system
const fs = require('fs');
const path = require('path');

// Import the server module (without starting the server)
const app = require('./server.js');

console.log('🔍 Testing FraudScan System...\n');

// Test 1: Check if required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
    'index.html',
    'login.html', 
    'dashboard.html',
    'server.js',
    'package.json',
    'transactions_template.csv'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file} - Found`);
    } else {
        console.log(`❌ ${file} - Missing`);
    }
});

// Test 2: Check uploads directory
console.log('\n📂 Checking uploads directory...');
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
    console.log('✅ uploads directory exists');
    const uploadFiles = fs.readdirSync(path.join(__dirname, 'uploads'));
    console.log(`📊 Found ${uploadFiles.length} uploaded files`);
} else {
    console.log('❌ uploads directory missing');
}

// Test 3: Validate package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
        'express', 'multer', 'cors', 'xlsx', 
        'csv-parser', 'jsonwebtoken', 'bcryptjs'
    ];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`❌ ${dep} - Missing`);
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json');
}

// Test 4: Check template CSV format
console.log('\n📋 Validating template CSV...');
try {
    const csvContent = fs.readFileSync('transactions_template.csv', 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log(`✅ Template has ${lines.length - 1} sample transactions`);
    console.log(`✅ Headers: ${headers.join(', ')}`);
    
    // Check required headers
    const requiredHeaders = ['date', 'merchant', 'amount', 'type'];
    const hasAllHeaders = requiredHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header))
    );
    
    if (hasAllHeaders) {
        console.log('✅ All required headers present');
    } else {
        console.log('❌ Missing required headers');
    }
} catch (error) {
    console.log('❌ Error reading template CSV');
}

console.log('\n🎯 System Check Complete!');
console.log('\n📝 To test the system:');
console.log('1. Run: npm start');
console.log('2. Open: http://localhost:3000');
console.log('3. Login with: admin@fraudscan.com / password');
console.log('4. Upload the transactions_template.csv file');
console.log('5. View the fraud detection results and charts');