// Global variables
let currentData = [];
let analysisResults = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('csvFile');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Sample data buttons
    document.getElementById('loadSampleData').addEventListener('click', loadSampleData);
    document.getElementById('loadConcordiaData').addEventListener('click', loadConcordiaData);
    document.getElementById('loadKingData').addEventListener('click', loadKingData);
    
    // AI analysis button
    document.getElementById('generateAIAnalysis').addEventListener('click', generateAIAnalysis);
}

// File handling
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
        processFile(file);
    }
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                currentData = results.data;
                analyzeData();
                showAnalysisSection();
            }
        });
    };
    reader.readAsText(file);
}

async function loadSampleData() {
    try {
        const response = await fetch('Assessor-Search-Results.csv');
        const csv = await response.text();
        
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                currentData = results.data.filter(row => 
                    row.ADDRESS && row.OWNER && row.ADDRESS.trim() !== ''
                );
                analyzeData();
                showAnalysisSection();
            }
        });
    } catch (error) {
        console.error('Error loading sample data:', error);
        alert('Could not load sample data. Please upload your own CSV file.');
    }
}

async function loadConcordiaData() {
    console.log('Loading Concordia data...');
    try {
        const response = await fetch('Assessor-Search-Results_Concordia.csv');
        console.log('Fetch response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csv = await response.text();
        console.log('CSV data loaded, length:', csv.length);
        
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                console.log('Papa parse complete, rows:', results.data.length);
                console.log('First few rows:', results.data.slice(0, 3));
                
                currentData = results.data.filter(row => 
                    row.ADDRESS && row.OWNER && row.ADDRESS.trim() !== ''
                );
                console.log('Filtered data count:', currentData.length);
                
                if (currentData.length === 0) {
                    console.error('No valid data found after filtering');
                    alert('No valid property data found in Concordia dataset');
                    return;
                }
                
                analyzeData();
                showAnalysisSection();
            },
            error: function(error) {
                console.error('Papa parse error:', error);
                alert('Error parsing Concordia CSV data');
            }
        });
    } catch (error) {
        console.error('Error loading Concordia sample data:', error);
        alert(`Could not load Concordia sample data: ${error.message}`);
    }
}

async function loadKingData() {
    console.log('Loading King data...');
    try {
        const response = await fetch('Assessor-Search-Results_King.csv');
        console.log('Fetch response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csv = await response.text();
        console.log('CSV data loaded, length:', csv.length);
        
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                console.log('Papa parse complete, rows:', results.data.length);
                console.log('First few rows:', results.data.slice(0, 3));
                
                currentData = results.data.filter(row => 
                    row.ADDRESS && row.OWNER && row.ADDRESS.trim() !== ''
                );
                console.log('Filtered data count:', currentData.length);
                
                if (currentData.length === 0) {
                    console.error('No valid data found after filtering');
                    alert('No valid property data found in King dataset');
                    return;
                }
                
                analyzeData();
                showAnalysisSection();
            },
            error: function(error) {
                console.error('Papa parse error:', error);
                alert('Error parsing King CSV data');
            }
        });
    } catch (error) {
        console.error('Error loading King sample data:', error);
        alert(`Could not load King sample data: ${error.message}`);
    }
}

// Data analysis functions
function analyzeData() {
    analysisResults = {
        totalProperties: currentData.length,
        ownershipAnalysis: analyzeOwnership(),
        pricingAnalysis: analyzePricing(),
        temporalAnalysis: analyzeTemporal(),
        flagsAnalysis: analyzeFlags()
    };
    
    updateStatistics();
    renderCharts();
    renderTables();
}

// Normalize owner names to combine similar entities
function normalizeOwnerName(owner) {
    if (!owner) return '';
    
    // Convert to uppercase for comparison
    let normalized = owner.trim().toUpperCase();
    
    // Known mappings for specific entities
    const knownMappings = {
        'PORTLAND COMMUNITY REINVEST INITIAT': 'PORTLAND COMMUNITY REINVESTMENT INITIATIVES',
        'PORTLAND COMMUNITY REINVESTMENT INI': 'PORTLAND COMMUNITY REINVESTMENT INITIATIVES'
    };
    
    // Check exact matches first
    if (knownMappings[normalized]) {
        return knownMappings[normalized];
    }
    
    // Check for partial matches (truncated names)
    for (const [partial, full] of Object.entries(knownMappings)) {
        if (normalized.includes(partial) || partial.includes(normalized)) {
            return full;
        }
    }
    
    // General normalization rules
    normalized = normalized
        .replace(/\bLLC\b/g, 'LLC')
        .replace(/\bINC\b/g, 'INC')
        .replace(/\bCORP\b/g, 'CORP')
        .replace(/\bLTD\b/g, 'LTD')
        .replace(/\s+/g, ' ')
        .trim();
    
    return normalized;
}

function analyzeOwnership() {
    const ownerCounts = {};
    const originalNames = {}; // Track original names for display
    const combinedNames = {}; // Track what names were combined
    
    currentData.forEach(property => {
        const originalOwner = property.OWNER?.trim();
        if (originalOwner) {
            const normalizedOwner = normalizeOwnerName(originalOwner);
            ownerCounts[normalizedOwner] = (ownerCounts[normalizedOwner] || 0) + 1;
            
            // Keep track of original names for this normalized name
            if (!originalNames[normalizedOwner]) {
                originalNames[normalizedOwner] = new Set();
            }
            originalNames[normalizedOwner].add(originalOwner);
        }
    });
    
    // Identify combined names (those with multiple original versions)
    Object.entries(originalNames).forEach(([normalized, originals]) => {
        if (originals.size > 1) {
            combinedNames[normalized] = Array.from(originals);
        }
    });
    
    const sortedOwners = Object.entries(ownerCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([owner, count]) => ({ 
            owner, 
            count,
            isCombined: combinedNames[owner] ? true : false,
            originalNames: combinedNames[owner] || []
        }));
    
    const multiPropertyOwners = sortedOwners.filter(item => item.count > 1);
    
    return {
        ownerCounts,
        sortedOwners,
        multiPropertyOwners,
        totalUniqueOwners: sortedOwners.length,
        combinedNames
    };
}

function analyzePricing() {
    const validSales = currentData.filter(property => {
        const price = parseFloat(property.SALE_PRICE);
        const date = new Date(property.SALE_DATE);
        return price > 0 && date.getFullYear() > 1900;
    });
    
    const prices = validSales.map(p => parseFloat(p.SALE_PRICE));
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    
    const threshold = medianPrice * 0.7;
    const belowMarketSales = validSales.filter(p => parseFloat(p.SALE_PRICE) < threshold);
    
    return {
        validSales,
        avgPrice,
        medianPrice,
        threshold,
        belowMarketSales: belowMarketSales.sort((a, b) => parseFloat(a.SALE_PRICE) - parseFloat(b.SALE_PRICE))
    };
}

function analyzeTemporal() {
    const recentSales = currentData.filter(property => {
        const date = new Date(property.SALE_DATE);
        return date.getFullYear() >= 2015 && date.getFullYear() <= 2024;
    });
    
    const yearlyPurchases = {};
    
    recentSales.forEach(property => {
        const owner = property.OWNER?.trim();
        const year = new Date(property.SALE_DATE).getFullYear();
        
        if (owner && year) {
            const key = `${owner}_${year}`;
            yearlyPurchases[key] = (yearlyPurchases[key] || 0) + 1;
        }
    });
    
    const bulkPurchases = Object.entries(yearlyPurchases)
        .filter(([, count]) => count >= 2)
        .map(([key, count]) => {
            const [owner, year] = key.split('_');
            return { owner, year: parseInt(year), count };
        })
        .sort((a, b) => b.count - a.count);
    
    return {
        recentSales,
        bulkPurchases
    };
}

function analyzeFlags() {
    const year9999 = currentData.filter(p => parseInt(p.YEAR_BUILT) === 9999);
    const oldSales = currentData.filter(p => {
        const date = new Date(p.SALE_DATE);
        return date.getFullYear() === 1900;
    });
    
    const suspiciousYears = currentData.filter(p => {
        const year = parseInt(p.YEAR_BUILT);
        return year > 2024 || year === 0;
    });
    
    return {
        year9999,
        oldSales,
        suspiciousYears
    };
}

// UI update functions
function updateStatistics() {
    document.getElementById('totalProperties').textContent = analysisResults.totalProperties.toLocaleString();
    document.getElementById('multiPropertyOwners').textContent = analysisResults.ownershipAnalysis.multiPropertyOwners.length.toLocaleString();
    
    // Calculate suspicious owners (5+ properties or bulk purchases)
    const suspiciousOwners = new Set();
    analysisResults.ownershipAnalysis.sortedOwners
        .filter(item => item.count >= 5)
        .forEach(item => suspiciousOwners.add(item.owner));
    
    analysisResults.temporalAnalysis.bulkPurchases
        .forEach(item => suspiciousOwners.add(item.owner));
    
    document.getElementById('suspiciousOwners').textContent = suspiciousOwners.size.toLocaleString();
    document.getElementById('belowMarketSales').textContent = analysisResults.pricingAnalysis.belowMarketSales.length.toLocaleString();
}

function renderCharts() {
    renderOwnershipChart();
    renderPricingChart();
    renderTemporalChart();
}

function renderOwnershipChart() {
    const topOwners = analysisResults.ownershipAnalysis.sortedOwners.slice(0, 15);
    // Reverse the order so highest values appear at the top
    const reversedOwners = topOwners.reverse();
    
    const trace = {
        x: reversedOwners.map(item => item.count),
        y: reversedOwners.map(item => {
            // Add indicator for combined names
            return item.isCombined ? `${item.owner} ℹ️` : item.owner;
        }),
        type: 'bar',
        orientation: 'h',
        text: reversedOwners.map(item => {
            if (item.isCombined) {
                return `Combined from: ${item.originalNames.join(', ')}`;
            }
            return '';
        }),
        customdata: reversedOwners.map(item => 
            item.isCombined ? `Combined from: ${item.originalNames.join(', ')}` : ''
        ),
        hovertemplate: '<b>%{y}</b><br>Properties: %{x}<br>%{customdata}<extra></extra>',
        marker: {
            color: reversedOwners.map(item => 
                item.isCombined ? 'rgba(52, 152, 219, 0.8)' : 'rgba(102, 126, 234, 0.8)'
            ),
            line: {
                color: reversedOwners.map(item => 
                    item.isCombined ? 'rgba(52, 152, 219, 1.0)' : 'rgba(102, 126, 234, 1.0)'
                ),
                width: 1
            }
        }
    };
    
    const layout = {
        title: 'Top 15 Property Owners',
        xaxis: { title: 'Number of Properties' },
        yaxis: { 
            title: 'Owner',
            automargin: true,
            tickmode: 'linear'
        },
        height: 600,
        margin: { l: 320, r: 50, t: 50, b: 50 }
    };
    
    Plotly.newPlot('ownershipChart', [trace], layout);
}

function renderPricingChart() {
    const prices = analysisResults.pricingAnalysis.validSales.map(p => parseFloat(p.SALE_PRICE));
    const maxPrice = Math.max(...prices);
    
    const trace = {
        x: prices,
        type: 'histogram',
        nbinsx: 30,
        marker: {
            color: 'rgba(118, 75, 162, 0.8)',
            line: {
                color: 'rgba(118, 75, 162, 1.0)',
                width: 1
            }
        }
    };
    
    const layout = {
        title: 'Distribution of Sale Prices',
        xaxis: { 
            title: 'Sale Price ($)',
            range: [0, maxPrice]
        },
        yaxis: { title: 'Frequency' },
        height: 400
    };
    
    Plotly.newPlot('pricingChart', [trace], layout);
}

function renderTemporalChart() {
    const salesByYear = {};
    
    analysisResults.temporalAnalysis.recentSales.forEach(property => {
        const year = new Date(property.SALE_DATE).getFullYear();
        salesByYear[year] = (salesByYear[year] || 0) + 1;
    });
    
    const years = Object.keys(salesByYear).sort();
    const counts = years.map(year => salesByYear[year]);
    
    const trace = {
        x: years,
        y: counts,
        type: 'bar',
        marker: {
            color: 'rgba(52, 152, 219, 0.8)',
            line: {
                color: 'rgba(52, 152, 219, 1.0)',
                width: 1
            }
        }
    };
    
    const layout = {
        title: 'Property Sales by Year (2015-2024)',
        xaxis: { title: 'Year' },
        yaxis: { title: 'Number of Sales' },
        height: 400
    };
    
    Plotly.newPlot('temporalChart', [trace], layout);
}

function renderTables() {
    renderOwnershipTable();
    renderBelowMarketTable();
    renderBulkPurchaseTable();
    renderFlagsTable();
}

function renderOwnershipTable() {
    const topOwners = analysisResults.ownershipAnalysis.sortedOwners.slice(0, 20);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Owner</th>
                    <th>Properties</th>
                    <th>Risk Level</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    topOwners.forEach((item, index) => {
        const riskLevel = item.count >= 10 ? 'High' : item.count >= 5 ? 'Medium' : 'Low';
        const riskColor = riskLevel === 'High' ? '#e74c3c' : riskLevel === 'Medium' ? '#f39c12' : '#27ae60';
        
        // Create tooltip for combined names
        let ownerDisplay = item.owner;
        if (item.isCombined && item.originalNames && item.originalNames.length > 0) {
            const tooltip = `Combined from: ${item.originalNames.join(', ')}`;
            ownerDisplay = `${item.owner} <span class="combined-indicator" title="${tooltip}" data-tooltip="${tooltip}">ℹ️</span>`;
        }
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${ownerDisplay}</td>
                <td>${item.count}</td>
                <td style="color: ${riskColor}; font-weight: bold;">${riskLevel}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    document.getElementById('ownershipTable').innerHTML = html;
}

function renderBelowMarketTable(sortBy = 'price', sortOrder = 'asc') {
    let belowMarket = [...analysisResults.pricingAnalysis.belowMarketSales];
    
    // Sort based on user preference
    if (sortBy === 'date') {
        belowMarket.sort((a, b) => {
            const dateA = new Date(a.SALE_DATE);
            const dateB = new Date(b.SALE_DATE);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    } else if (sortBy === 'price') {
        belowMarket.sort((a, b) => {
            const priceA = parseFloat(a.SALE_PRICE);
            const priceB = parseFloat(b.SALE_PRICE);
            return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
        });
    }
    
    // Take top 15 after sorting
    belowMarket = belowMarket.slice(0, 15);
    
    let html = `
        <h4>Properties Sold Below Market (< $${analysisResults.pricingAnalysis.threshold.toLocaleString()})</h4>
        <table>
            <thead>
                <tr>
                    <th class="sortable-header">
                        Sale Price
                        <div class="sort-arrows">
                            <span class="sort-arrow ${sortBy === 'price' && sortOrder === 'asc' ? 'active' : ''}" onclick="sortBelowMarketTable('price', 'asc')">▲</span>
                            <span class="sort-arrow ${sortBy === 'price' && sortOrder === 'desc' ? 'active' : ''}" onclick="sortBelowMarketTable('price', 'desc')">▼</span>
                        </div>
                    </th>
                    <th class="sortable-header">
                        Sale Date
                        <div class="sort-arrows">
                            <span class="sort-arrow ${sortBy === 'date' && sortOrder === 'asc' ? 'active' : ''}" onclick="sortBelowMarketTable('date', 'asc')">▲</span>
                            <span class="sort-arrow ${sortBy === 'date' && sortOrder === 'desc' ? 'active' : ''}" onclick="sortBelowMarketTable('date', 'desc')">▼</span>
                        </div>
                    </th>
                    <th>Owner</th>
                    <th>Address</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    belowMarket.forEach(property => {
        html += `
            <tr>
                <td>$${parseFloat(property.SALE_PRICE).toLocaleString()}</td>
                <td>${new Date(property.SALE_DATE).toLocaleDateString()}</td>
                <td>${property.OWNER}</td>
                <td>${property.ADDRESS}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    document.getElementById('belowMarketTable').innerHTML = html;
}

// Handle column header sorting
function sortBelowMarketTable(column, order) {
    renderBelowMarketTable(column, order);
}

function renderBulkPurchaseTable() {
    const bulkPurchases = analysisResults.temporalAnalysis.bulkPurchases.slice(0, 15);
    
    let html = `
        <h4>Bulk Purchase Patterns (Multiple Properties in Same Year)</h4>
        <table>
            <thead>
                <tr>
                    <th>Properties</th>
                    <th>Year</th>
                    <th>Owner</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    bulkPurchases.forEach(item => {
        html += `
            <tr>
                <td>${item.count}</td>
                <td>${item.year}</td>
                <td>${item.owner}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    document.getElementById('bulkPurchaseTable').innerHTML = html;
}

function renderFlagsTable() {
    let html = '<h4>Data Quality Issues</h4>';
    
    // Year 9999 properties
    if (analysisResults.flagsAnalysis.year9999.length > 0) {
        html += `
            <h5>Properties with YEAR_BUILT = 9999</h5>
            <table>
                <thead>
                    <tr><th>Owner</th><th>Address</th></tr>
                </thead>
                <tbody>
        `;
        
        analysisResults.flagsAnalysis.year9999.forEach(property => {
            html += `<tr><td>${property.OWNER}</td><td>${property.ADDRESS}</td></tr>`;
        });
        
        html += '</tbody></table>';
    }
    
    // Properties not sold since 1900
    const oldSalesCount = analysisResults.flagsAnalysis.oldSales.length;
    if (oldSalesCount > 0) {
        html += `<h5>Properties Not Sold Since 1900 (${oldSalesCount} total)</h5>`;
        html += `<p>These properties have sale dates of 1900-01-01, indicating no recent sales or missing data.</p>`;
    }
    
    document.getElementById('flagsTable').innerHTML = html;
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab button
    event.target.classList.add('active');
}

function showAnalysisSection() {
    document.getElementById('analysisSection').style.display = 'block';
    document.getElementById('analysisSection').scrollIntoView({ behavior: 'smooth' });
}

// AI Analysis
async function generateAIAnalysis() {
    const button = document.getElementById('generateAIAnalysis');
    const resultsDiv = document.getElementById('aiResults');
    const contentDiv = document.getElementById('aiContent');
    
    button.textContent = 'Generating Analysis...';
    button.disabled = true;
    
    // Prepare data summary for AI
    const summary = {
        totalProperties: analysisResults.totalProperties,
        topOwners: analysisResults.ownershipAnalysis.sortedOwners.slice(0, 10),
        belowMarketCount: analysisResults.pricingAnalysis.belowMarketSales.length,
        bulkPurchasers: analysisResults.temporalAnalysis.bulkPurchases.slice(0, 5),
        avgPrice: analysisResults.pricingAnalysis.avgPrice,
        medianPrice: analysisResults.pricingAnalysis.medianPrice
    };
    
    // Simulate AI analysis (in a real implementation, this would call OpenAI API)
    setTimeout(() => {
        const analysis = generateMockAIAnalysis(summary);
        contentDiv.textContent = analysis;
        resultsDiv.style.display = 'block';
        
        button.textContent = 'Generate AI Analysis';
        button.disabled = false;
    }, 2000);
}

function generateMockAIAnalysis(summary) {
    return `PREDATORY LANDLORD RISK ASSESSMENT

Based on analysis of ${summary.totalProperties} properties, I've identified several concerning patterns:

HIGH-RISK ENTITIES:
${summary.topOwners.slice(0, 5).map((owner, i) => 
    `${i + 1}. ${owner.owner} (${owner.count} properties) - ${owner.count >= 10 ? 'HIGH RISK' : 'MEDIUM RISK'}`
).join('\n')}

KEY FINDINGS:
• ${summary.bulkPurchasers.length} entities engaged in bulk purchasing behavior
• ${summary.belowMarketCount} properties sold significantly below market rate
• Average sale price: $${Math.round(summary.avgPrice).toLocaleString()}
• Median sale price: $${Math.round(summary.medianPrice).toLocaleString()}

RISK INDICATORS:
- Large portfolio concentration suggests potential market manipulation
- Below-market purchases may indicate targeting of distressed properties
- Bulk purchasing patterns could represent predatory acquisition strategies
- Corporate entities with generic names warrant additional scrutiny

RECOMMENDATIONS:
1. Investigate entities with 10+ properties for compliance with tenant protection laws
2. Monitor recent bulk purchasers for rapid rent increases or eviction patterns
3. Cross-reference with code violation databases
4. Engage community organizations for tenant experience reports

This analysis is for informational purposes and should be verified with additional data sources.`;
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}