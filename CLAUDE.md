# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python data analysis project that analyzes property ownership patterns in the Vernon neighborhood of Portland, Oregon to identify potential predatory landlords. The analysis uses assessor data to detect ownership concentration, corporate entities, bulk purchasing patterns, and geographic clustering.

## Commands

### Running the Analysis
```bash
python landlords.py
```

### Installing Dependencies
The script requires these Python packages:
- pandas
- matplotlib
- seaborn
- plotly

Install with:
```bash
pip install pandas matplotlib seaborn plotly
```

## Code Architecture

### Main Script Structure (`landlords.py`)
The analysis is organized into distinct functions:

1. **`analyze_ownership_patterns(df)`** - Identifies multi-property owners, LLC/corporate entities, and potential shell companies
2. **`analyze_temporal_patterns(df)`** - Detects bulk purchase patterns and acquisition timing
3. **`create_visualizations(df, owner_counts)`** - Generates ownership distribution charts and geographic scatter plots
4. **`generate_risk_report(df, owner_counts)`** - Produces risk scores for potential predatory landlords based on portfolio size and entity type

### Data Processing
- Input: `Assessor-Search-Results.csv` (note: script references both this file and `AssessorSearchResults.csv`)
- The script expects standard assessor data with columns for OWNER, SALE_DATE, LATITUDE, LONGITUDE
- Temporal analysis converts sale dates and groups by month to identify bulk purchasing
- Risk scoring algorithm weights portfolio size (20+ properties) and corporate entity indicators

### Output Files
- `ownership_distribution.png` - Bar chart of property ownership distribution
- `geographic_concentration.png` - Scatter plot showing geographic clustering of top owners

## Data Requirements

The CSV file should contain these key columns:
- `OWNER` - Property owner name
- `SALE_DATE` - Date of sale transaction
- `LATITUDE`/`LONGITUDE` - Geographic coordinates for mapping
- Standard assessor fields like ADDRESS, MARKET_VALUE, etc.

## Analysis Focus

This is defensive security research aimed at identifying patterns that may indicate predatory landlord behavior:
- Ownership concentration analysis
- Corporate shell company detection
- Bulk purchasing pattern identification
- Geographic clustering analysis
- Risk assessment scoring