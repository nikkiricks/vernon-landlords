// Global variables for organizing page
let powerData = [];
let powerAnalysis = {};

// Initialize the organizing page
document.addEventListener('DOMContentLoaded', function() {
    initializePowerMapping();
});

function initializePowerMapping() {
    // File upload for power mapping
    const uploadArea = document.getElementById('powerUploadArea');
    const fileInput = document.getElementById('powerCsvFile');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Neighborhood selector for power mapping
    const neighborhoodSelect = document.getElementById('powerNeighborhoodSelect');
    const loadButton = document.getElementById('loadPowerData');
    
    neighborhoodSelect.addEventListener('change', function() {
        loadButton.disabled = !this.value;
    });
    
    loadButton.addEventListener('click', loadPowerNeighborhood);
}

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
        processPowerFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
        processPowerFile(file);
    }
}

function processPowerFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                powerData = results.data.filter(row => 
                    row.ADDRESS && row.OWNER && row.ADDRESS.trim() !== ''
                );
                generatePowerMap();
                showPowerResults();
            }
        });
    };
    reader.readAsText(file);
}

async function loadPowerNeighborhood() {
    const select = document.getElementById('powerNeighborhoodSelect');
    const selectedOption = select.options[select.selectedIndex];
    const filename = selectedOption.getAttribute('data-file');
    const neighborhood = selectedOption.textContent;
    
    if (!filename) {
        alert('Please select a neighborhood to analyze.');
        return;
    }
    
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csv = await response.text();
        
        Papa.parse(csv, {
            header: true,
            complete: function(results) {
                powerData = results.data.filter(row => 
                    row.ADDRESS && row.OWNER && row.ADDRESS.trim() !== ''
                );
                
                if (powerData.length === 0) {
                    alert(`No valid property data found in ${neighborhood} dataset`);
                    return;
                }
                
                generatePowerMap();
                showPowerResults();
            },
            error: function(error) {
                console.error('Papa parse error:', error);
                alert(`Error parsing ${neighborhood} CSV data`);
            }
        });
    } catch (error) {
        console.error(`Error loading ${neighborhood} data:`, error);
        alert(`Could not load ${neighborhood} data: ${error.message}`);
    }
}

function generatePowerMap() {
    // First analyze ownership concentration
    const ownershipConcentration = analyzePowerConcentration();
    
    // Then analyze corporate control using the ownership data
    const corporateControl = analyzeCorporateControl(ownershipConcentration);
    
    // Build complete analysis object
    powerAnalysis = {
        totalProperties: powerData.length,
        ownershipConcentration: ownershipConcentration,
        corporateControl: corporateControl,
        economicPower: analyzeEconomicPower(),
        geographicControl: analyzeGeographicControl()
    };
    
    // Generate recommendations after all analysis is complete
    powerAnalysis.targetRecommendations = generateTargetRecommendations();
    
    renderPowerVisualization();
    renderPowerAnalysis();
}

function analyzePowerConcentration() {
    const ownerCounts = {};
    
    powerData.forEach(property => {
        const owner = normalizeOwnerName(property.OWNER);
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    });
    
    const sortedOwners = Object.entries(ownerCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([owner, count]) => ({ owner, count }));
    
    // Power concentration metrics
    const topOwners = sortedOwners.slice(0, 10);
    const top10Control = topOwners.reduce((sum, item) => sum + item.count, 0);
    const concentrationRatio = (top10Control / powerData.length) * 100;
    
    // Identify major power holders (5+ properties)
    const majorPowerHolders = sortedOwners.filter(item => item.count >= 5);
    
    return {
        sortedOwners,
        topOwners,
        concentrationRatio,
        majorPowerHolders,
        totalUniqueOwners: sortedOwners.length
    };
}

function analyzeCorporateControl(ownershipConcentration) {
    const corporatePatterns = [
        /LLC$/i,
        /INC$/i,
        /CORP$/i,
        /LTD$/i,
        /LIMITED$/i,
        /COMPANY$/i,
        /PROPERTIES$/i,
        /INVESTMENTS$/i,
        /HOLDINGS$/i,
        /GROUP$/i,
        /TRUST$/i,
        /PARTNERSHIP$/i
    ];
    
    const corporateOwners = [];
    const individualOwners = [];
    
    ownershipConcentration.sortedOwners.forEach(item => {
        const isCorporate = corporatePatterns.some(pattern => 
            pattern.test(item.owner)
        );
        
        if (isCorporate) {
            corporateOwners.push(item);
        } else {
            individualOwners.push(item);
        }
    });
    
    const corporateProperties = corporateOwners.reduce((sum, item) => sum + item.count, 0);
    const corporateControlPercentage = (corporateProperties / powerData.length) * 100;
    
    return {
        corporateOwners: corporateOwners.slice(0, 15),
        individualOwners: individualOwners.slice(0, 15),
        corporateControlPercentage,
        totalCorporateProperties: corporateProperties
    };
}

function analyzeEconomicPower() {
    const validSales = powerData.filter(property => {
        const price = parseFloat(property.SALE_PRICE);
        const date = new Date(property.SALE_DATE);
        return price > 0 && date.getFullYear() > 1900;
    });
    
    const ownerInvestments = {};
    
    validSales.forEach(property => {
        const owner = normalizeOwnerName(property.OWNER);
        const price = parseFloat(property.SALE_PRICE);
        
        if (!ownerInvestments[owner]) {
            ownerInvestments[owner] = {
                owner,
                totalInvestment: 0,
                properties: 0,
                avgPrice: 0
            };
        }
        
        ownerInvestments[owner].totalInvestment += price;
        ownerInvestments[owner].properties += 1;
    });
    
    // Calculate average prices
    Object.values(ownerInvestments).forEach(owner => {
        owner.avgPrice = owner.totalInvestment / owner.properties;
    });
    
    const topInvestors = Object.values(ownerInvestments)
        .sort((a, b) => b.totalInvestment - a.totalInvestment)
        .slice(0, 10);
    
    const totalMarketValue = validSales.reduce((sum, prop) => sum + parseFloat(prop.SALE_PRICE), 0);
    
    return {
        topInvestors,
        totalMarketValue,
        averageInvestment: totalMarketValue / validSales.length
    };
}

function analyzeGeographicControl() {
    // Group properties by owner and count geographic spread
    const ownerGeography = {};
    
    powerData.forEach(property => {
        const owner = normalizeOwnerName(property.OWNER);
        if (!ownerGeography[owner]) {
            ownerGeography[owner] = {
                owner,
                addresses: new Set(),
                properties: 0
            };
        }
        
        ownerGeography[owner].addresses.add(property.ADDRESS);
        ownerGeography[owner].properties += 1;
    });
    
    // Convert sets to arrays and calculate geographic dominance
    const geographicPower = Object.values(ownerGeography)
        .map(item => ({
            ...item,
            addresses: Array.from(item.addresses),
            addressCount: item.addresses.size
        }))
        .filter(item => item.properties >= 3) // Focus on owners with multiple properties
        .sort((a, b) => b.properties - a.properties);
    
    return {
        geographicPower: geographicPower.slice(0, 15)
    };
}

function generateTargetRecommendations() {
    const recommendations = [];
    
    // High-concentration landlords
    const topLandlords = powerAnalysis.ownershipConcentration.majorPowerHolders.slice(0, 5);
    topLandlords.forEach(landlord => {
        recommendations.push({
            type: 'primary_target',
            entity: landlord.owner,
            properties: landlord.count,
            rationale: `Controls ${landlord.count} properties - organize tenant association across portfolio`,
            tactics: [
                'Door-knock all properties to build tenant list',
                'Document code violations and habitability issues',
                'Research corporate structure and identify decision makers',
                'Launch coordinated tenant demands across all properties'
            ]
        });
    });
    
    // Major corporate entities
    const topCorporate = powerAnalysis.corporateControl.corporateOwners.slice(0, 3);
    topCorporate.forEach(corp => {
        if (!topLandlords.find(l => l.owner === corp.owner)) {
            recommendations.push({
                type: 'corporate_target',
                entity: corp.owner,
                properties: corp.count,
                rationale: `Corporate entity with ${corp.count} properties - research ownership structure`,
                tactics: [
                    'Research Secretary of State filings for ownership details',
                    'Investigate management company and agent of service',
                    'Track political donations and lobbying activity',
                    'Coordinate with other neighborhoods targeting same entity'
                ]
            });
        }
    });
    
    // Policy targets based on concentration
    if (powerAnalysis.ownershipConcentration.concentrationRatio > 25) {
        recommendations.push({
            type: 'policy_target',
            entity: 'City Council',
            properties: null,
            rationale: `High ownership concentration (${Math.round(powerAnalysis.ownershipConcentration.concentrationRatio)}%) suggests need for policy intervention`,
            tactics: [
                'Present data analysis to city council showing concentration',
                'Demand corporate ownership limits and speculation controls',
                'Push for tenant opportunity to purchase policies',
                'Advocate for vacancy taxes and anti-warehousing measures'
            ]
        });
    }
    
    return recommendations;
}

function renderPowerVisualization() {
    const container = document.getElementById('powerVisualization');
    
    // Create multiple visualizations
    container.innerHTML = `
        <div class="power-viz-grid">
            <div class="viz-card">
                <h4>📊 Ownership Concentration</h4>
                <div id="concentrationChart"></div>
                <div class="power-metric">
                    <strong>Top 10 Control:</strong> ${Math.round(powerAnalysis.ownershipConcentration.concentrationRatio)}% of all properties
                </div>
            </div>
            
            <div class="viz-card">
                <h4>🏢 Corporate vs Individual Control</h4>
                <div id="corporateChart"></div>
                <div class="power-metric">
                    <strong>Corporate Control:</strong> ${Math.round(powerAnalysis.corporateControl.corporateControlPercentage)}% of all properties
                </div>
            </div>
            
            <div class="viz-card">
                <h4>💰 Economic Power Distribution</h4>
                <div id="economicChart"></div>
                <div class="power-metric">
                    <strong>Total Market Value:</strong> $${(powerAnalysis.economicPower.totalMarketValue / 1000000).toFixed(1)}M
                </div>
            </div>
        </div>
    `;
    
    // Render individual charts
    renderConcentrationChart();
    renderCorporateChart();
    renderEconomicChart();
}

function renderConcentrationChart() {
    const topOwners = powerAnalysis.ownershipConcentration.topOwners.slice(0, 10).reverse();
    
    const trace = {
        x: topOwners.map(item => item.count),
        y: topOwners.map(item => item.owner.length > 30 ? 
            item.owner.substring(0, 30) + '...' : item.owner),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: 'rgba(231, 76, 60, 0.8)',
            line: { color: 'rgba(231, 76, 60, 1.0)', width: 1 }
        }
    };
    
    const layout = {
        title: 'Top 10 Property Owners',
        xaxis: { title: 'Number of Properties' },
        yaxis: { title: '', automargin: true },
        height: 400,
        margin: { l: 200, r: 50, t: 50, b: 50 }
    };
    
    Plotly.newPlot('concentrationChart', [trace], layout, {responsive: true});
}

function renderCorporateChart() {
    const corporateCount = powerAnalysis.corporateControl.totalCorporateProperties;
    const individualCount = powerAnalysis.totalProperties - corporateCount;
    
    const trace = {
        values: [corporateCount, individualCount],
        labels: ['Corporate/LLC Owned', 'Individual Owned'],
        type: 'pie',
        marker: {
            colors: ['rgba(231, 76, 60, 0.8)', 'rgba(52, 152, 219, 0.8)']
        }
    };
    
    const layout = {
        title: 'Property Ownership by Entity Type',
        height: 400
    };
    
    Plotly.newPlot('corporateChart', [trace], layout, {responsive: true});
}

function renderEconomicChart() {
    const topInvestors = powerAnalysis.economicPower.topInvestors.slice(0, 8).reverse();
    
    const trace = {
        x: topInvestors.map(item => item.totalInvestment / 1000000), // Convert to millions
        y: topInvestors.map(item => item.owner.length > 25 ? 
            item.owner.substring(0, 25) + '...' : item.owner),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: 'rgba(39, 174, 96, 0.8)',
            line: { color: 'rgba(39, 174, 96, 1.0)', width: 1 }
        }
    };
    
    const layout = {
        title: 'Top Investors by Total Investment',
        xaxis: { title: 'Total Investment (Millions $)' },
        yaxis: { title: '', automargin: true },
        height: 400,
        margin: { l: 200, r: 50, t: 50, b: 50 }
    };
    
    Plotly.newPlot('economicChart', [trace], layout, {responsive: true});
}

function renderPowerAnalysis() {
    const container = document.getElementById('powerAnalysis');
    
    container.innerHTML = `
        <div class="power-analysis-content">
            <div class="analysis-section">
                <h4>🎯 Primary Organizing Targets</h4>
                <div class="targets-list">
                    ${powerAnalysis.targetRecommendations
                        .filter(rec => rec.type === 'primary_target')
                        .map(rec => `
                            <div class="target-card primary">
                                <div class="target-header">
                                    <h5>${rec.entity}</h5>
                                    <span class="property-count">${rec.properties} properties</span>
                                </div>
                                <p class="rationale">${rec.rationale}</p>
                                <div class="tactics">
                                    <strong>Organizing Tactics:</strong>
                                    <ul>
                                        ${rec.tactics.map(tactic => `<li>${tactic}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="analysis-section">
                <h4>🏢 Corporate Investigation Targets</h4>
                <div class="targets-list">
                    ${powerAnalysis.targetRecommendations
                        .filter(rec => rec.type === 'corporate_target')
                        .map(rec => `
                            <div class="target-card corporate">
                                <div class="target-header">
                                    <h5>${rec.entity}</h5>
                                    <span class="property-count">${rec.properties} properties</span>
                                </div>
                                <p class="rationale">${rec.rationale}</p>
                                <div class="tactics">
                                    <strong>Research Tactics:</strong>
                                    <ul>
                                        ${rec.tactics.map(tactic => `<li>${tactic}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="analysis-section">
                <h4>⚖️ Policy Advocacy Targets</h4>
                <div class="targets-list">
                    ${powerAnalysis.targetRecommendations
                        .filter(rec => rec.type === 'policy_target')
                        .map(rec => `
                            <div class="target-card policy">
                                <div class="target-header">
                                    <h5>${rec.entity}</h5>
                                    <span class="property-count">Policy Target</span>
                                </div>
                                <p class="rationale">${rec.rationale}</p>
                                <div class="tactics">
                                    <strong>Policy Tactics:</strong>
                                    <ul>
                                        ${rec.tactics.map(tactic => `<li>${tactic}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="analysis-section">
                <h4>📈 Power Analysis Summary</h4>
                <div class="power-summary">
                    <div class="summary-grid">
                        <div class="summary-stat">
                            <div class="stat-number">${powerAnalysis.totalProperties}</div>
                            <div class="stat-label">Total Properties Analyzed</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">${powerAnalysis.ownershipConcentration.totalUniqueOwners}</div>
                            <div class="stat-label">Unique Property Owners</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">${powerAnalysis.ownershipConcentration.majorPowerHolders.length}</div>
                            <div class="stat-label">Major Power Holders (5+ properties)</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">${Math.round(powerAnalysis.ownershipConcentration.concentrationRatio)}%</div>
                            <div class="stat-label">Top 10 Ownership Share</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">${Math.round(powerAnalysis.corporateControl.corporateControlPercentage)}%</div>
                            <div class="stat-label">Corporate/LLC Controlled</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">$${(powerAnalysis.economicPower.totalMarketValue / 1000000).toFixed(1)}M</div>
                            <div class="stat-label">Total Market Value</div>
                        </div>
                    </div>
                    
                    <div class="organizing-recommendations">
                        <h5>🚀 Next Steps for Your Organizing Campaign:</h5>
                        <ol>
                            <li><strong>Start with the biggest targets:</strong> Focus organizing energy on the top 3-5 property owners who control the most units</li>
                            <li><strong>Research corporate structures:</strong> Investigate LLCs and corporations to identify actual decision makers and beneficial owners</li>
                            <li><strong>Build tenant networks:</strong> Connect tenants across properties owned by the same entities to coordinate demands</li>
                            <li><strong>Document problems:</strong> Systematically gather evidence of code violations, rent gouging, and poor management</li>
                            <li><strong>Engage policy makers:</strong> Present this data to city council to demonstrate need for stronger tenant protections</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showPowerResults() {
    document.getElementById('powerResults').style.display = 'block';
    document.getElementById('powerResults').scrollIntoView({ behavior: 'smooth' });
}

// Utility function - reuse from main script
function normalizeOwnerName(owner) {
    if (!owner) return '';
    
    let normalized = owner.trim().toUpperCase();
    
    const knownMappings = {
        'PORTLAND COMMUNITY REINVEST INITIAT': 'PORTLAND COMMUNITY REINVESTMENT INITIATIVES',
        'PORTLAND COMMUNITY REINVESTMENT INI': 'PORTLAND COMMUNITY REINVESTMENT INITIATIVES'
    };
    
    if (knownMappings[normalized]) {
        return knownMappings[normalized];
    }
    
    for (const [partial, full] of Object.entries(knownMappings)) {
        if (normalized.includes(partial) || partial.includes(normalized)) {
            return full;
        }
    }
    
    normalized = normalized
        .replace(/\bLLC\b/g, 'LLC')
        .replace(/\bINC\b/g, 'INC')
        .replace(/\bCORP\b/g, 'CORP')
        .replace(/\bLTD\b/g, 'LTD')
        .replace(/\s+/g, ' ')
        .trim();
    
    return normalized;
}