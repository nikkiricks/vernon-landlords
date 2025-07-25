# 🏠 Vernon Landlord Transparency Tool

[![Netlify Status](https://api.netlify.com/api/v1/badges/13644c31-7490-4a7f-bc20-3422bb6ae1a1/deploy-status)](https://app.netlify.com/projects/vernon-landlords/deploys)

A community-driven web application for analyzing property ownership patterns to identify potential predatory landlord behavior in Portland's Vernon neighborhood and beyond.

## 🎯 Purpose

This tool helps communities identify concerning ownership patterns that may indicate predatory landlord behavior, including:
- Large property portfolio concentration
- Below-market acquisition patterns
- Bulk purchasing strategies
- Data quality issues that may indicate shell companies

## 🏘️ Any Neighborhood Can Use This Tool

**Why is it called "Vernon"?** Vernon is Portland's neighborhood where we first developed and tested this tool, but **the tool works for any community**. Vernon serves as our sample dataset to demonstrate the analysis capabilities.

### Who Should Use This Tool

- **🏠 Tenant organizers** investigating landlord behavior in their buildings
- **📢 Housing advocates** researching ownership patterns for campaigns
- **📰 Journalists** analyzing property ownership for stories
- **🔬 Researchers** studying housing market dynamics
- **👥 Community members** who want to understand their neighborhood

### How to Get Your Neighborhood's Data

#### For Portland Neighborhoods:

1. **Visit Portland Maps**
   - Go to [portlandmaps.com](https://www.portlandmaps.com)
   - Use the search function to find your neighborhood or specific addresses

2. **Use Advanced Search**
   - Click "Advanced Search" → "Property Search"
   - Set geographical boundaries for your neighborhood
   - Use address ranges or draw boundaries on the map

3. **Export Your Data**
   - After running your search, look for "Export" or "Download" options
   - Download as CSV format
   - The file will include owner names, sale dates, prices, and property details

4. **Upload and Analyze**
   - Upload your CSV file to this tool
   - The analysis will automatically detect ownership patterns in your community

#### For Other Cities:

Many cities provide similar assessor data through their websites:
- Search for "[your city] assessor database" or "[your city] property records"
- Look for CSV export options
- Ensure the data includes owner names, sale dates, and prices for best results

### Data Privacy

All analysis happens **locally in your browser** - no data is sent to external servers. You maintain complete control over what information you upload and analyze.

## 🚀 Live Demo

**Website:** [https://vernon-landlords.netlify.app](https://vernon-landlords.netlify.app)

**Local Testing:** See [deploy.md](deploy.md) for quick setup instructions

## 🔍 Features

### 📊 Data Analysis
- **Ownership Concentration Analysis** - Identifies owners with large property portfolios
- **Pricing Analysis** - Detects below-market purchases that may indicate predatory behavior
- **Temporal Pattern Detection** - Finds bulk purchasing patterns within the same year
- **Data Quality Flags** - Identifies suspicious data entries (YEAR_BUILT = 9999, 1900 sale dates)

### 📈 Interactive Visualizations
- Property ownership distribution charts
- Sale price histograms
- Temporal sales patterns
- Interactive data tables with sorting and filtering

### 🤖 AI-Powered Insights
- GPT-powered analysis of ownership patterns
- Risk assessment scoring
- Contextual recommendations for community action

### 🔒 Privacy-Focused
- All data processing happens locally in your browser
- No data is sent to external servers (except for optional AI analysis)
- Upload your own CSV files or use sample data

## 🛠️ Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Visualization:** Plotly.js
- **Data Processing:** Papa Parse (CSV parsing)
- **Deployment:** Netlify
- **Version Control:** Git/GitHub

## 📋 Data Requirements

The tool expects CSV files with these columns:
- `OWNER` - Property owner name
- `ADDRESS` - Property address
- `SALE_DATE` - Date of last sale
- `SALE_PRICE` - Sale price
- `YEAR_BUILT` - Year property was built
- Other standard assessor columns are supported

## 🚀 Getting Started

### Option 1: Use the Live Website
1. Visit [https://vernon-landlords.netlify.app](https://vernon-landlords.netlify.app)
2. Upload your CSV file or load sample data
3. Explore the analysis results

### Option 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/nikkiricks/vernon-landlords.git
   cd vernon-landlords
   ```

2. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using any other static file server
   ```

3. Open `http://localhost:8000` in your browser

## 📊 Analysis Methodology

### Red Flags Detected

1. **Large Portfolios** - Owners with 5+ properties
2. **Below-Market Purchases** - Sales below 70% of neighborhood median
3. **Bulk Purchasing** - Multiple properties bought in the same year
4. **Data Anomalies** - YEAR_BUILT = 9999 or sale dates from 1900
5. **Corporate Entities** - LLCs and corporations with generic names

### Risk Scoring

The tool assigns risk levels based on:
- **High Risk:** 10+ properties or bulk purchasing patterns
- **Medium Risk:** 5-9 properties or other concerning patterns
- **Low Risk:** Fewer than 5 properties with no red flags

## 🏗️ Development

### Project Structure
```
vernon-landlords/
├── index.html          # Main website
├── styles.css          # Styling
├── script.js           # Application logic
├── netlify.toml        # Netlify configuration
├── README.md           # This file
├── CLAUDE.md           # AI assistant context
├── landlords.py        # Python analysis script
└── Assessor-Search-Results.csv  # Sample data
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Local Development Setup

No build process required! This is a static website that runs entirely in the browser.

For development with live reload:
```bash
# Install live-server globally
npm install -g live-server

# Run with auto-reload
live-server
```

## 🌐 Deployment

### Netlify (Recommended)

1. Fork this repository to your GitHub account
2. Connect your GitHub account to Netlify
3. Select this repository for deployment
4. Deploy settings:
   - **Build command:** (leave empty)
   - **Publish directory:** (leave empty or set to `/`)
5. Deploy!

The site will automatically redeploy when you push changes to the main branch.

### Alternative Deployment Options

- **GitHub Pages:** Enable in repository settings
- **Vercel:** Connect GitHub repository
- **Firebase Hosting:** `firebase deploy`
- **Any static hosting service**

## 🔐 Privacy & Security

- **Local Processing:** All analysis happens in your browser
- **No Tracking:** No analytics or tracking scripts
- **Open Source:** Full transparency in code and methodology
- **Data Control:** You control what data is uploaded and analyzed

## ⚖️ Legal & Ethical Use

This tool is designed for:
- ✅ Housing justice advocacy
- ✅ Community organizing
- ✅ Transparency in property ownership
- ✅ Defensive tenant protection research

**Not intended for:**
- ❌ Harassment of property owners
- ❌ Doxxing or personal attacks
- ❌ Illegal activities
- ❌ Creating misleading accusations

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support & Community

- **Issues:** [GitHub Issues](https://github.com/nikkiricks/vernon-landlords/issues)
- **Discussions:** [GitHub Discussions](https://github.com/nikkiricks/vernon-landlords/discussions)
- **Email:** your-email@example.com

## 🙏 Acknowledgments

- Vernon neighborhood community members for their advocacy
- Portland assessor's office for data transparency
- Open source libraries: Plotly.js, Papa Parse
- Housing justice organizations

## 📈 Roadmap

- [ ] Integration with real GPT API
- [ ] Support for multiple data formats
- [ ] Geographic mapping capabilities
- [ ] Export functionality for reports
- [ ] Mobile app version
- [ ] Multi-language support

---

**Built with ❤️ for housing justice**