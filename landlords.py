import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
from datetime import datetime
import plotly.express as px

# Load the data
df = pd.read_csv('Assessor-Search-Results.csv')

print(f"Dataset loaded: {len(df)} properties")
print(f"Columns: {list(df.columns)}")

# ========================================
# ANALYSIS 1: OWNER NAME ANALYSIS
# ========================================

def analyze_ownership_patterns(df):
    print("\n" + "="*50)
    print("OWNERSHIP CONCENTRATION ANALYSIS")
    print("="*50)
    
    # Count properties per owner
    owner_counts = df['OWNER'].value_counts()
    
    # Find multi-property owners
    multi_property_owners = owner_counts[owner_counts > 1]
    
    print(f"\nTotal unique owners: {len(owner_counts)}")
    print(f"Owners with multiple properties: {len(multi_property_owners)}")
    print(f"Properties owned by multi-property owners: {multi_property_owners.sum()}")
    
    # Top 20 largest landlords
    print(f"\nTop 20 Largest Property Owners:")
    for i, (owner, count) in enumerate(owner_counts.head(20).items(), 1):
        print(f"{i:2d}. {count:3d} properties: {owner}")
    
    # Analyze suspicious ownership patterns
    print(f"\n" + "-"*40)
    print("SUSPICIOUS OWNERSHIP PATTERNS")
    print("-"*40)
    
    # Look for LLC patterns
    llc_owners = owner_counts[owner_counts.index.str.contains('LLC|L.L.C', case=False, na=False)]
    corp_owners = owner_counts[owner_counts.index.str.contains('CORP|INC|CORPORATION', case=False, na=False)]
    
    print(f"LLC entities: {len(llc_owners)} (owning {llc_owners.sum()} properties)")
    print(f"Corporate entities: {len(corp_owners)} (owning {corp_owners.sum()} properties)")
    
    # Flag potential shell companies (generic names)
    generic_patterns = ['PROPERTIES', 'HOLDINGS', 'INVESTMENTS', 'REAL ESTATE', 'VENTURES']
    generic_owners = []
    for pattern in generic_patterns:
        matches = owner_counts[owner_counts.index.str.contains(pattern, case=False, na=False)]
        if len(matches) > 0:
            generic_owners.extend(matches.index.tolist())
    
    if generic_owners:
        print(f"\nPotential shell companies (generic names): {len(set(generic_owners))}")
        for owner in set(generic_owners)[:10]:
            print(f"  - {owner_counts[owner]} properties: {owner}")
    
    return owner_counts, multi_property_owners

# ========================================
# ANALYSIS 4: TEMPORAL PATTERNS
# ========================================

def analyze_temporal_patterns(df):
    print("\n" + "="*50)
    print("TEMPORAL ACQUISITION ANALYSIS")
    print("="*50)
    
    # Convert sale dates
    df['SALE_DATE'] = pd.to_datetime(df['SALE_DATE'], errors='coerce')
    df['SALE_YEAR'] = df['SALE_DATE'].dt.year
    df['SALE_MONTH'] = df['SALE_DATE'].dt.to_period('M')
    
    # Remove records without valid sale dates
    df_with_dates = df.dropna(subset=['SALE_DATE'])
    
    print(f"Properties with sale dates: {len(df_with_dates)}")
    
    if len(df_with_dates) == 0:
        print("No valid sale dates found for temporal analysis")
        return
    
    # Find bulk purchase patterns
    print(f"\n" + "-"*40)
    print("BULK PURCHASE PATTERNS")
    print("-"*40)
    
    # Group by owner and month to find bulk purchases
    monthly_purchases = df_with_dates.groupby(['OWNER', 'SALE_MONTH']).size().reset_index(name='purchases')
    bulk_purchases = monthly_purchases[monthly_purchases['purchases'] >= 3]  # 3+ in same month
    
    if len(bulk_purchases) > 0:
        print(f"Found {len(bulk_purchases)} instances of bulk purchasing (3+ properties in same month)")
        print("\nTop bulk purchase patterns:")
        for _, row in bulk_purchases.sort_values('purchases', ascending=False).head(10).iterrows():
            print(f"  {row['purchases']} properties in {row['SALE_MONTH']}: {row['OWNER']}")
    
    # Analyze acquisition timing by major owners
    major_owners = df['OWNER'].value_counts().head(10).index
    
    print(f"\n" + "-"*40)
    print("ACQUISITION TIMING - TOP 10 OWNERS")
    print("-"*40)
    
    for owner in major_owners:
        owner_sales = df_with_dates[df_with_dates['OWNER'] == owner]['SALE_DATE'].sort_values()
        if len(owner_sales) > 1:
            date_range = f"{owner_sales.min().strftime('%Y-%m')} to {owner_sales.max().strftime('%Y-%m')}"
            print(f"{len(owner_sales):2d} properties ({date_range}): {owner}")

def create_visualizations(df, owner_counts):
    print("\n" + "="*50)
    print("CREATING VISUALIZATIONS")
    print("="*50)
    
    # 1. Property ownership distribution
    plt.figure(figsize=(12, 6))
    ownership_dist = owner_counts.value_counts().head(20)
    plt.bar(range(len(ownership_dist)), ownership_dist.values)
    plt.xlabel('Number of Properties Owned')
    plt.ylabel('Number of Owners')
    plt.title('Distribution of Property Ownership')
    plt.xticks(range(len(ownership_dist)), ownership_dist.index)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('ownership_distribution.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # 2. Geographic concentration by top owners
    if 'LATITUDE' in df.columns and 'LONGITUDE' in df.columns:
        top_owners = owner_counts.head(5).index
        
        plt.figure(figsize=(12, 8))
        colors = ['red', 'blue', 'green', 'orange', 'purple']
        
        for i, owner in enumerate(top_owners):
            owner_props = df[df['OWNER'] == owner]
            valid_coords = owner_props.dropna(subset=['LATITUDE', 'LONGITUDE'])
            if len(valid_coords) > 0:
                plt.scatter(valid_coords['LONGITUDE'], valid_coords['LATITUDE'], 
                          c=colors[i], label=f"{owner} ({len(valid_coords)} props)", alpha=0.7)
        
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.title('Geographic Distribution of Top 5 Property Owners')
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig('geographic_concentration.png', dpi=300, bbox_inches='tight')
        plt.show()

def generate_risk_report(df, owner_counts):
    print("\n" + "="*50)
    print("PREDATORY LANDLORD RISK ASSESSMENT")
    print("="*50)
    
    high_risk_owners = []
    
    # Criteria 1: Large portfolio (20+ properties)
    large_portfolios = owner_counts[owner_counts >= 20]
    
    # Criteria 2: Corporate entities with generic names
    generic_patterns = ['PROPERTIES', 'HOLDINGS', 'INVESTMENTS', 'REAL ESTATE']
    corporate_entities = owner_counts[owner_counts.index.str.contains('LLC|CORP|INC', case=False, na=False)]
    
    for owner, count in large_portfolios.items():
        risk_score = 0
        risk_factors = []
        
        if count >= 50:
            risk_score += 3
            risk_factors.append(f"Very large portfolio ({count} properties)")
        elif count >= 20:
            risk_score += 2
            risk_factors.append(f"Large portfolio ({count} properties)")
        
        if any(pattern in owner.upper() for pattern in generic_patterns):
            risk_score += 2
            risk_factors.append("Generic business name")
        
        if 'LLC' in owner.upper() or 'CORP' in owner.upper():
            risk_score += 1
            risk_factors.append("Corporate entity")
        
        if risk_score >= 3:
            high_risk_owners.append({
                'owner': owner,
                'properties': count,
                'risk_score': risk_score,
                'risk_factors': risk_factors
            })
    
    # Sort by risk score
    high_risk_owners.sort(key=lambda x: x['risk_score'], reverse=True)
    
    print(f"HIGH RISK OWNERS IDENTIFIED: {len(high_risk_owners)}")
    print("-" * 60)
    
    for i, owner_info in enumerate(high_risk_owners[:15], 1):
        print(f"{i:2d}. {owner_info['owner']}")
        print(f"    Properties: {owner_info['properties']}")
        print(f"    Risk Score: {owner_info['risk_score']}/5")
        print(f"    Risk Factors: {', '.join(owner_info['risk_factors'])}")
        print()

# ========================================
# MAIN EXECUTION
# ========================================

if __name__ == "__main__":
    # Load and analyze data
    df = pd.read_csv('AssessorSearchResults.csv')
    
    # Run analyses
    owner_counts, multi_property_owners = analyze_ownership_patterns(df)
    analyze_temporal_patterns(df)
    create_visualizations(df, owner_counts)
    generate_risk_report(df, owner_counts)
    
    print(f"\n" + "="*50)
    print("ANALYSIS COMPLETE")
    print("="*50)
    print("Files generated:")
    print("- ownership_distribution.png")
    print("- geographic_concentration.png")