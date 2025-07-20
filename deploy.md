# Deployment Guide

## Quick Deploy Options

### Option 1: Netlify Drag & Drop
1. Go to https://app.netlify.com/drop
2. Drag the `vernon-landlords.zip` file to deploy instantly
3. Change site name to `vernon-landlords` in settings

### Option 2: GitHub Integration
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import from Git"
3. Select this repository
4. Deploy with default settings

### Option 3: Local Development
```bash
# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## Deployment Package
The `vernon-landlords.zip` file contains a production-ready build including:
- All HTML, CSS, and JavaScript files
- Sample Vernon neighborhood data
- Netlify configuration
- Complete documentation

## Live Site
Once deployed, the site will be available at:
- Custom domain: `https://vernon-landlords.netlify.app`