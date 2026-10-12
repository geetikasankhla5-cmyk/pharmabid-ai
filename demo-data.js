window.DEMO_SCENARIOS = {
  "cardiovascular": {
    "id": "tender-cvd-01",
    "companyName": "Apex Healthcare Therapeutics",
    "businessUnit": "Hospital & Institutional Access",
    "country": "India",
    "currency": "INR",
    "currencySymbol": "₹",
    "therapeuticArea": "Cardiovascular",
    "productBrand": "Rosuvacare Gold",
    "molecule": "Rosuvastatin + Clopidogrel (20mg/75mg)",
    "dosageForm": "Hard Gelatin Capsules (Pack of 100)",
    "tenderName": "All India State Healthcare Procurement - CVD Formulary 2026",
    "tenderId": "AISHPC-MED-2026-9812",
    "tenderDeadline": "2026-11-15",
    "volume": 500000,
    "cogs": 28.5,
    "logisticsCost": 2.2,
    "distributionCost": 1.8,
    "minAcceptablePrice": 38,
    "proposedBidPrice": 48.5,
    "targetMarginPct": 35,
    "priceElasticity": 3.8,
    "historicalWinRate": 42,
    "evaluationWeights": {
      "price": 70,
      "quality": 15,
      "supply": 10,
      "esg": 5
    },
    "extractedClauses": [
      {
        "id": "cl-1",
        "section": "Section 4.2 - Quantity",
        "title": "Annual Requirement Commitment",
        "text": "Estimated annual quantity is 500,000 packs with quarterly staggered supply call-offs within 14 days of PO.",
        "risk": "LOW",
        "category": "Commercial"
      },
      {
        "id": "cl-2",
        "section": "Section 11.4 - Penalties",
        "title": "Late Delivery Liquidated Damages",
        "text": "In case of default in delivery schedule, penalty of 2% per week subject to a maximum of 15% contract value will be deducted.",
        "risk": "HIGH",
        "category": "Penalties"
      },
      {
        "id": "cl-3",
        "section": "Section 8.1 - Quality Evaluation",
        "title": "WHO-GMP & USFDA/EU-GMP Preference",
        "text": "5 bonus marks awarded for manufacturers with WHO-GMP certification and zero regulatory warning letters in last 24 months.",
        "risk": "LOW",
        "category": "Evaluation"
      },
      {
        "id": "cl-4",
        "section": "Section 14.3 - Reference Pricing",
        "title": "National Lowest Reference Price Clause",
        "text": "Supplier warrants that the offered rate is not higher than any rate quoted to any other state or central government hospital institution in India.",
        "risk": "MEDIUM",
        "category": "Pricing & Legal"
      }
    ],
    "competitors": [
      {
        "name": "SunBio Generic Labs",
        "estimatedBid": 43,
        "marketShare": 32,
        "qualityScore": 78,
        "supplyReliability": 82,
        "aggressiveness": 85,
        "capacity": "High",
        "strength": "Aggressive volume discounting & broad distributor footprint",
        "weakness": "Historical batch recall in 2024"
      },
      {
        "name": "MedZest LifeSciences",
        "estimatedBid": 47.5,
        "marketShare": 24,
        "qualityScore": 88,
        "supplyReliability": 90,
        "aggressiveness": 65,
        "capacity": "High",
        "strength": "USFDA approved facility with superior shelf-life stability",
        "weakness": "High COGS floor (~₹36)"
      },
      {
        "name": "Vanguard Biopharma",
        "estimatedBid": 51,
        "marketShare": 15,
        "qualityScore": 82,
        "supplyReliability": 75,
        "aggressiveness": 45,
        "capacity": "Medium",
        "strength": "Strong localized government relations",
        "weakness": "Limited reserve inventory capacity"
      }
    ],
    "risks": [
      {
        "id": "r1",
        "category": "Tender Structure",
        "name": "Fixed Price Term (24 Mo)",
        "score": 45,
        "severity": "Medium",
        "prob": "High",
        "financialImpact": "₹1.8M",
        "desc": "No inflation or raw material API price escalation clause for 24 months.",
        "mitigation": "Lock in 12-month API supply contracts with chemical suppliers."
      },
      {
        "id": "r2",
        "category": "Competitor Risk",
        "name": "SunBio Predatory Pricing",
        "score": 72,
        "severity": "High",
        "prob": "High",
        "financialImpact": "₹4.5M",
        "desc": "SunBio likely to submit low-ball bids below ₹44 to capture 60%+ allocation.",
        "mitigation": "Maximize quality & WHO-GMP non-price scoring advantage (+15 pts)."
      },
      {
        "id": "r3",
        "category": "Pricing & Margin Risk",
        "name": "Reference Price Spillover",
        "score": 55,
        "severity": "Medium",
        "prob": "Medium",
        "financialImpact": "₹2.1M",
        "desc": "Low bid might trigger mandatory price cuts across neighboring state rate contracts.",
        "mitigation": "Offer bundled institutional packaging specific to this tender."
      },
      {
        "id": "r4",
        "category": "Supply Chain Risk",
        "name": "14-Day Delivery Call-offs",
        "score": 50,
        "severity": "Medium",
        "prob": "Medium",
        "financialImpact": "₹1.2M",
        "desc": "15% late delivery penalty could trigger if localized buffer stock is depleted.",
        "mitigation": "Maintain 60-day safety stock buffer at regional depot in Hyderabad."
      },
      {
        "id": "r5",
        "category": "Regulatory / Legal",
        "name": "Shelf-Life Expiry Guarantees",
        "score": 30,
        "severity": "Low",
        "prob": "Low",
        "financialImpact": "₹400K",
        "desc": "Mandatory 75% residual shelf life on arrival at central medical store.",
        "mitigation": "Dedicated freshly manufactured batch runs prior to each quarter."
      },
      {
        "id": "r6",
        "category": "Contractual / Legal",
        "name": "Performance Bank Guarantee (PBG)",
        "score": 38,
        "severity": "Low",
        "prob": "Medium",
        "financialImpact": "₹800K",
        "desc": "5% PBG required within 15 days of Letter of Intent.",
        "mitigation": "Pre-arrange bank line of credit."
      },
      {
        "id": "r7",
        "category": "Demand / Volume Risk",
        "name": "Quarterly Volume Fluctuation",
        "score": 40,
        "severity": "Medium",
        "prob": "Medium",
        "financialImpact": "₹1.5M",
        "desc": "Tender volume is non-binding and dependent on state budgetary releases.",
        "mitigation": "Stagger production batches aligned with PO issuance."
      },
      {
        "id": "r8",
        "category": "ESG & Compliance",
        "name": "Eco-Friendly Blister Packaging",
        "score": 25,
        "severity": "Low",
        "prob": "Low",
        "financialImpact": "₹250K",
        "desc": "Preference points for PVC-free recyclable packaging.",
        "mitigation": "Submit recyclable carton test certifications."
      }
    ]
  },
  "oncology": {
    "id": "tender-onc-02",
    "companyName": "Nordic BioPharma Europe",
    "businessUnit": "Hospital Specialty Care",
    "country": "United Kingdom (NHS)",
    "currency": "GBP",
    "currencySymbol": "£",
    "therapeuticArea": "Oncology",
    "productBrand": "OncoTaxel Infusion",
    "molecule": "Paclitaxel Albumin-bound (100mg Vial)",
    "dosageForm": "Lyophilized Powder for Injectable Suspension",
    "tenderName": "NHS CMU Injectable Chemotherapy Framework Agreement 2026-2028",
    "tenderId": "NHS-CMU-ONC-2026-44",
    "tenderDeadline": "2026-10-30",
    "volume": 65000,
    "cogs": 95,
    "logisticsCost": 8.5,
    "distributionCost": 4.5,
    "minAcceptablePrice": 130,
    "proposedBidPrice": 168,
    "targetMarginPct": 36,
    "priceElasticity": 2.9,
    "historicalWinRate": 52,
    "evaluationWeights": {
      "price": 60,
      "quality": 20,
      "supply": 15,
      "esg": 5
    },
    "extractedClauses": [
      {
        "id": "cl-o1",
        "section": "Schedule 2 - Cold Chain",
        "title": "Strict Cold-Chain 2°C–8°C Monitoring",
        "text": "Continuous IoT temperature data loggers mandatory for every hospital delivery. Breach triggers instant consignment rejection.",
        "risk": "MEDIUM",
        "category": "Supply Chain"
      },
      {
        "id": "cl-o2",
        "section": "Schedule 6 - Spot Purchase Clause",
        "title": "Third-Party Spot Surcharge Liability",
        "text": "Failure to supply within 24h authorizes NHS Trust to procure from open market with price differential billed to prime contractor.",
        "risk": "HIGH",
        "category": "Penalties"
      },
      {
        "id": "cl-o3",
        "section": "Schedule 10 - MEAT Scoring",
        "title": "Supply Reliability Track Record (15%)",
        "text": "Tenderers with zero OTIF (On-Time In-Full) breaches over preceding 36 months score maximum 15 marks.",
        "risk": "LOW",
        "category": "Evaluation"
      }
    ],
    "competitors": [
      {
        "name": "Sandoz / Novartis Generics",
        "estimatedBid": 155,
        "marketShare": 40,
        "qualityScore": 92,
        "supplyReliability": 94,
        "aggressiveness": 75,
        "capacity": "High",
        "strength": "Global biosimilar scale & dedicated NHS logistics",
        "weakness": "Reluctant to offer extended payment credit"
      },
      {
        "name": "Accord Healthcare",
        "estimatedBid": 148,
        "marketShare": 30,
        "qualityScore": 85,
        "supplyReliability": 88,
        "aggressiveness": 85,
        "capacity": "High",
        "strength": "UK-based manufacturing & packaging facility",
        "weakness": "Lower technical differentiation"
      },
      {
        "name": "Fresenius Kabi",
        "estimatedBid": 172,
        "marketShare": 18,
        "qualityScore": 90,
        "supplyReliability": 91,
        "aggressiveness": 50,
        "capacity": "Medium",
        "strength": "Pre-filled smart reconstitution delivery system",
        "weakness": "Highest cost structure"
      }
    ],
    "risks": [
      {
        "id": "ro1",
        "category": "Supply Chain Risk",
        "name": "Cold-Chain Failure Liability",
        "score": 62,
        "severity": "High",
        "prob": "Medium",
        "financialImpact": "£420K",
        "desc": "IoT log breach could trigger whole-batch rejection and spot purchase penalty.",
        "mitigation": "Partner with validated pharma cold-chain courier (World Courier)."
      },
      {
        "id": "ro2",
        "category": "Competitor Risk",
        "name": "Accord Price Squeeze",
        "score": 68,
        "severity": "High",
        "prob": "High",
        "financialImpact": "£650K",
        "desc": "Accord likely to bid aggressively near £148/vial to defend market leadership.",
        "mitigation": "Compete on clinical reconstitution safety kits and 15/15 supply reliability points."
      },
      {
        "id": "ro3",
        "category": "Pricing & Margin Risk",
        "name": "MEAT Floor Compression",
        "score": 48,
        "severity": "Medium",
        "prob": "Medium",
        "financialImpact": "£310K",
        "desc": "Bidding below £150 erodes target gross margin below 30%.",
        "mitigation": "Hold price at £168 supported by superior technical service package."
      },
      {
        "id": "ro4",
        "category": "Regulatory / Legal",
        "name": "EU MDR & UKCA Compliant Vials",
        "score": 20,
        "severity": "Low",
        "prob": "Low",
        "financialImpact": "£50K",
        "desc": "Verify device-drug combination labeling complies with MHRA.",
        "mitigation": "Documentation already audited and certified."
      }
    ]
  },
  "diabetes": {
    "id": "tender-diab-03",
    "companyName": "LatAm BioPharma Alliance",
    "businessUnit": "Endocrinology & Chronic Care",
    "country": "Brazil (SUS / Ministry of Health)",
    "currency": "BRL",
    "currencySymbol": "R$",
    "therapeuticArea": "Diabetes / Endocrinology",
    "productBrand": "Glucotrend XR",
    "molecule": "Metformin HCl + Empagliflozin (1000mg/25mg)",
    "dosageForm": "Extended Release Tablets (Box of 60)",
    "tenderName": "Ministério da Saúde - Centralized Chronic Disease Tender 2026",
    "tenderId": "MS-BRP-2026-1102",
    "tenderDeadline": "2026-12-05",
    "volume": 1200000,
    "cogs": 14.2,
    "logisticsCost": 1.8,
    "distributionCost": 1.4,
    "minAcceptablePrice": 21,
    "proposedBidPrice": 28.9,
    "targetMarginPct": 38,
    "priceElasticity": 4.5,
    "historicalWinRate": 35,
    "evaluationWeights": {
      "price": 80,
      "quality": 10,
      "supply": 10,
      "esg": 0
    },
    "extractedClauses": [
      {
        "id": "cl-d1",
        "section": "Artigo 3 - Reverse Auction",
        "title": "Electronic Reverse Auction Dynamic (Pregão)",
        "text": "Tender will be decided via real-time electronic reverse bidding where price is 80% determinant.",
        "risk": "HIGH",
        "category": "Pricing & Auction"
      },
      {
        "id": "cl-d2",
        "section": "Artigo 7 - Payment Delays",
        "title": "Public Health Payment Window (90–120 Days)",
        "text": "Government payment terms Net 90 days with potential administrative delays up to 120 days.",
        "risk": "HIGH",
        "category": "Commercial"
      },
      {
        "id": "cl-d3",
        "section": "Artigo 12 - ANVISA Registration",
        "title": "Valid ANVISA Sanitary Permit Requirement",
        "text": "Bidders must possess active valid registration with at least 24 months validity remaining.",
        "risk": "LOW",
        "category": "Regulatory"
      }
    ],
    "competitors": [
      {
        "name": "EMS S/A",
        "estimatedBid": 24.5,
        "marketShare": 45,
        "qualityScore": 80,
        "supplyReliability": 85,
        "aggressiveness": 95,
        "capacity": "Very High",
        "strength": "Dominant local manufacturing capacity in Hortolândia",
        "weakness": "Susceptible to API raw material shortages"
      },
      {
        "name": "Eurofarma Laboratórios",
        "estimatedBid": 26,
        "marketShare": 30,
        "qualityScore": 86,
        "supplyReliability": 90,
        "aggressiveness": 80,
        "capacity": "High",
        "strength": "Extensive regional warehouse network across all Brazilian states",
        "weakness": "Higher fixed overheads"
      },
      {
        "name": "Aché Laboratórios",
        "estimatedBid": 29.5,
        "marketShare": 15,
        "qualityScore": 84,
        "supplyReliability": 80,
        "aggressiveness": 55,
        "capacity": "Medium",
        "strength": "Strong brand equity among endocrinologists",
        "weakness": "Less competitive on pure reverse price auctions"
      }
    ],
    "risks": [
      {
        "id": "rd1",
        "category": "Pricing & Margin Risk",
        "name": "Reverse Auction Price Spiraling",
        "score": 85,
        "severity": "Critical",
        "prob": "High",
        "financialImpact": "R$ 4.2M",
        "desc": "EMS and Eurofarma often drive Pregão prices down to near-cost levels.",
        "mitigation": "Establish hard automated walk-away price floor at R$ 22.50 in the auction portal."
      },
      {
        "id": "rd2",
        "category": "Tender Structure",
        "name": "Cash Flow Drain (120-Day Terms)",
        "score": 75,
        "severity": "High",
        "prob": "High",
        "financialImpact": "R$ 2.8M",
        "desc": "Extended public payment delays require working capital factoring.",
        "mitigation": "Build 4.5% financing cost into the floor COGS baseline."
      },
      {
        "id": "rd3",
        "category": "Regulatory / Legal",
        "name": "ANVISA Batch Release Clearance",
        "score": 35,
        "severity": "Medium",
        "prob": "Low",
        "financialImpact": "R$ 600K",
        "desc": "Customs port delays on imported active API batches.",
        "mitigation": "Pre-clear import licenses 60 days in advance."
      },
      {
        "id": "rd4",
        "category": "Competitor Risk",
        "name": "Local Manufacturing Preference Tax (ICMS)",
        "score": 60,
        "severity": "High",
        "prob": "Medium",
        "financialImpact": "R$ 1.9M",
        "desc": "Local Sao Paulo plants receive state ICMS tax incentives.",
        "mitigation": "Route deliveries through Manaus / Espirito Santo tax benefit hubs."
      }
    ]
  }
};
