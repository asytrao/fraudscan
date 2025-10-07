# FraudScan - Credit Card Fraud Detection System

## 🎯 Overview
FraudScan is an advanced AI-powered fraud detection system for credit card transactions. It analyzes transaction data and identifies potentially fraudulent activities using sophisticated algorithms.

## ✨ Features
- **Real-time Fraud Detection**: Advanced algorithms to detect suspicious transactions
- **Interactive Dashboard**: Beautiful charts and visualizations
- **File Upload Support**: Supports CSV, XLSX, and PDF files
- **Risk Scoring**: Each transaction gets a risk score (0-100)
- **Multiple Chart Types**: Pie charts, line charts, bar charts, and polar area charts
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation
1. Navigate to the project directory:
   ```bash
   cd c:\atharv\fraudscan
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## 🔐 Login Credentials
- **Email**: admin@fraudscan.com
- **Password**: password

## 📊 Testing the System

### Method 1: Use Demo Data
1. Login to the dashboard
2. The system automatically loads demo data
3. View the fraud detection results and charts

### Method 2: Upload CSV File
1. Login to the dashboard
2. Use the provided `transactions_template.csv` file
3. Upload the file using the drag-and-drop interface
4. View the analysis results

## 📁 CSV File Format
Your CSV file should have the following columns:
```csv
date,merchant,amount,type
2024-10-01,Amazon India,2500,Online
2024-10-02,Unknown Merchant,75000,Online
```

**Required Columns:**
- `date`: Transaction date (YYYY-MM-DD format)
- `merchant`: Merchant name
- `amount`: Transaction amount (numeric)
- `type`: Transaction type (Online, POS, etc.)

## 🧠 Fraud Detection Algorithm

The system uses multiple rules to detect fraud:

### High-Risk Indicators (Score: 35-50 points)
- Extremely high amounts (>₹1,00,000)
- High amounts (>₹50,000)
- Suspicious merchant names
- Unknown merchants with high amounts

### Medium-Risk Indicators (Score: 15-30 points)
- Very high-value online transactions
- Weekend high-value transactions
- Round number amounts
- International transactions

### Risk Levels
- **Low Risk**: Score 0-49 (Green)
- **Medium Risk**: Score 50-74 (Yellow)
- **High Risk**: Score 75-100 (Red)

## 📈 Dashboard Features

### Summary Cards
- Total transactions count
- Legitimate transactions count
- Fraudulent transactions count
- Fraud rate percentage

### Interactive Charts
1. **Fraud vs Legitimate**: Doughnut chart showing the distribution
2. **Transaction Amounts**: Line chart showing fraud vs legitimate amounts
3. **Top Merchants**: Stacked bar chart showing merchant-wise breakdown
4. **Risk Level Distribution**: Polar area chart showing risk levels

### Transaction Table
- Complete transaction details
- Risk scores for each transaction
- Color-coded rows (red for fraud, green for legitimate)
- Hover effects for better UX

## 🎨 Visual Improvements Made

### Enhanced Charts
- **Doughnut Chart**: Replaced pie chart with more modern doughnut design
- **Gradient Colors**: Beautiful color schemes with transparency
- **Hover Effects**: Interactive hover animations
- **Better Tooltips**: Custom styled tooltips with better information
- **Responsive Design**: Charts adapt to different screen sizes

### Improved UI/UX
- **Summary Cards**: Added animated summary cards with key metrics
- **Risk Badges**: Color-coded risk level indicators
- **Hover Animations**: Smooth transitions and hover effects
- **Better Typography**: Improved fonts and spacing
- **Card Shadows**: Modern card design with shadows and borders

## 🔧 Technical Details

### Backend (Node.js/Express)
- RESTful API endpoints
- JWT authentication
- File upload handling (Multer)
- CSV/XLSX parsing
- Fraud detection algorithms

### Frontend (HTML/CSS/JavaScript)
- Chart.js for visualizations
- Responsive CSS Grid/Flexbox
- Modern JavaScript (ES6+)
- Drag-and-drop file upload
- Real-time progress indicators

### Security Features
- JWT token-based authentication
- File type validation
- File size limits (10MB)
- Input sanitization
- CORS protection

## 📝 API Endpoints

- `POST /api/login` - User authentication
- `POST /api/upload` - File upload and analysis
- `GET /api/demo-data` - Get demo transaction data
- `GET /api/health` - Health check endpoint

## 🐛 Troubleshooting

### Common Issues
1. **Port 3000 already in use**: Change the PORT in server.js or kill the existing process
2. **File upload fails**: Check file format (CSV, XLSX, PDF) and size (<10MB)
3. **Charts not displaying**: Ensure Chart.js is loaded properly

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum 4GB RAM for large CSV files

## 🔮 Future Enhancements
- Machine learning integration
- Real-time transaction monitoring
- Email alerts for fraud detection
- Advanced reporting features
- Multi-user support
- Database integration

## 📞 Support
For issues or questions, check the console logs in your browser's developer tools for detailed error messages.

---
**FraudScan** - Protecting your transactions with advanced AI technology! 🛡️