/**
 * PharmaBid AI - Core Business & Mathematical Decision Engine
 * Provides reactive calculations for:
 * 1. Win Probability (Logistic/Sigmoid regression adjusted for price, MEAT weights, and competitor aggressiveness)
 * 2. Revenue, Unit Margin, Total Gross Profit, and Expected Value E[P]
 * 3. Break-even Price & Optimal Pricing Frontier
 * 4. Multi-Vector Risk Composite Scoring & Radar Metrics
 * 5. Automated Executive Go / No-Go Decision Logic with human-readable rationale
 * 6. Scenario Analysis (Aggressive, Balanced, Premium, Custom)
 * 7. ROI & Commercial Value Metrics
 * 8. Give-Get Negotiation Engine
 */

window.PharmaBidEngine = {
  state: null,

  init(initialState) {
    this.state = JSON.parse(JSON.stringify(initialState));
    return this.recalculateAll();
  },

  updateState(partialState) {
    if (!this.state) return null;
    this.state = { ...this.state, ...partialState };
    return this.recalculateAll();
  },

  getState() {
    return this.state;
  },

  recalculateAll() {
    if (!this.state) return null;
    const s = this.state;

    // 1. Total Unit Cost
    const totalUnitCost = (Number(s.cogs) || 0) + (Number(s.logisticsCost) || 0) + (Number(s.distributionCost) || 0);
    const proposedBidPrice = Number(s.proposedBidPrice) || (totalUnitCost * 1.25);
    const volume = Number(s.volume) || 1;

    // 2. Unit Margin & Margin Pct
    const unitMargin = proposedBidPrice - totalUnitCost;
    const marginPct = proposedBidPrice > 0 ? (unitMargin / proposedBidPrice) * 100 : 0;
    const totalRevenueIfWon = proposedBidPrice * volume;
    const totalProfitIfWon = unitMargin * volume;
    const breakEvenPrice = totalUnitCost;

    // 3. Competitor Benchmarking
    const competitors = s.competitors || [];
    let avgCompBid = 0;
    let minCompBid = Infinity;
    let maxCompBid = 0;
    let avgAggressiveness = 50;

    if (competitors.length > 0) {
      let sumBid = 0;
      let sumAgg = 0;
      competitors.forEach(c => {
        const bid = Number(c.estimatedBid) || proposedBidPrice;
        sumBid += bid;
        sumAgg += (Number(c.aggressiveness) || 50);
        if (bid < minCompBid) minCompBid = bid;
        if (bid > maxCompBid) maxCompBid = bid;
      });
      avgCompBid = sumBid / competitors.length;
      avgAggressiveness = sumAgg / competitors.length;
    } else {
      avgCompBid = proposedBidPrice;
      minCompBid = proposedBidPrice * 0.9;
      maxCompBid = proposedBidPrice * 1.15;
    }

    // 4. Win Probability Model (Configurable Multi-Factor Logistic Curve)
    const evalWeights = s.evaluationWeights || { price: 70, quality: 15, supply: 10, esg: 5 };
    const priceWeight = (evalWeights.price || 70) / 100;
    const nonPriceAdvantage = ((evalWeights.quality || 15) * 0.4 + (evalWeights.supply || 10) * 0.5 + (evalWeights.esg || 5) * 0.3) / 100;
    
    const priceRatio = avgCompBid > 0 ? proposedBidPrice / avgCompBid : 1.0;
    const elasticity = Number(s.priceElasticity) || 3.5;

    const centerShift = nonPriceAdvantage - ((avgAggressiveness - 50) * 0.005);
    const exponent = elasticity * (priceRatio - 1.0 - centerShift);
    let winProbRaw = 1 / (1 + Math.exp(exponent));

    if (s.historicalWinRate) {
      const histWeight = 0.25;
      winProbRaw = (winProbRaw * (1 - histWeight)) + ((s.historicalWinRate / 100) * histWeight);
    }

    const winProbability = Math.max(2.0, Math.min(98.0, winProbRaw * 100));

    // 5. Expected Financials (E[V] = P_win * Gross Profit)
    const expectedProfit = (winProbability / 100) * totalProfitIfWon;
    const expectedRevenue = (winProbability / 100) * totalRevenueIfWon;

    // 6. Optimal Price Range Detection (Simulate 25 Price points)
    const priceSimulationCurve = [];
    let optimalPrice = proposedBidPrice;
    let maxExpectedProfit = -Infinity;

    const minScan = Math.max(totalUnitCost * 1.02, minCompBid * 0.75);
    const maxScan = maxCompBid * 1.35;
    const step = (maxScan - minScan) / 24;

    for (let i = 0; i < 25; i++) {
      const p = minScan + (i * step);
      const pRatio = avgCompBid > 0 ? p / avgCompBid : 1.0;
      const exp = elasticity * (pRatio - 1.0 - centerShift);
      let pw = 1 / (1 + Math.exp(exp));
      if (s.historicalWinRate) {
        pw = (pw * 0.75) + ((s.historicalWinRate / 100) * 0.25);
      }
      const pwPct = Math.max(2.0, Math.min(98.0, pw * 100));
      const uMarg = p - totalUnitCost;
      const expProf = (pwPct / 100) * (uMarg * volume);
      const margP = p > 0 ? (uMarg / p) * 100 : 0;

      priceSimulationCurve.push({
        price: p,
        winProb: pwPct,
        unitMargin: uMarg,
        marginPct: margP,
        expectedProfit: expProf
      });

      if (expProf > maxExpectedProfit && margP >= (s.targetMarginPct || 25)) {
        maxExpectedProfit = expProf;
        optimalPrice = p;
      }
    }

    // 7. Risk Intelligence Scoring
    const risks = s.risks || [];
    let totalRiskScore = 0;
    const riskCategories = {
      'Tender Structure': 0,
      'Competitor Risk': 0,
      'Pricing & Margin Risk': 0,
      'Supply Chain Risk': 0,
      'Regulatory / Legal': 0,
      'Contractual / Legal': 0,
      'Reference Pricing Risk': 0,
      'Demand / Volume Risk': 0
    };
    const categoryCounts = {};

    risks.forEach(r => {
      const sc = Number(r.score) || 0;
      totalRiskScore += sc;
      const cat = r.category || 'General Risk';
      riskCategories[cat] = (riskCategories[cat] || 0) + sc;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const avgRiskScore = risks.length > 0 ? Math.round(totalRiskScore / risks.length) : 35;
    
    const normalizedCategoryScores = {};
    Object.keys(riskCategories).forEach(k => {
      const count = categoryCounts[k] || 1;
      normalizedCategoryScores[k] = Math.round(riskCategories[k] / count);
    });

    // 8. Go / No-Go Transparent Decision Framework
    let decision = 'GO';
    let decisionBadgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    const decisionFactors = [];
    const keyConditions = [];

    if (marginPct < (s.targetMarginPct || 30) - 10) {
      decision = 'NO-GO';
      decisionBadgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      decisionFactors.push('Gross Margin (' + marginPct.toFixed(1) + '%) is severely below company hurdle rate (' + (s.targetMarginPct || 30) + '%).');
    } else if (unitMargin <= 0) {
      decision = 'NO-GO';
      decisionBadgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      decisionFactors.push('Proposed bid (' + (s.currencySymbol || '') + proposedBidPrice.toFixed(2) + ') is below total unit cost (' + (s.currencySymbol || '') + totalUnitCost.toFixed(2) + '), creating negative gross margin.');
    } else if (avgRiskScore > 70) {
      decision = 'NO-GO';
      decisionBadgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      decisionFactors.push('Composite Tender Risk Score (' + avgRiskScore + '/100) exceeds maximum corporate risk ceiling.');
    } else if (marginPct < (s.targetMarginPct || 30) || avgRiskScore > 50 || winProbability < 40) {
      decision = 'GO WITH CONDITIONS';
      decisionBadgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      
      if (marginPct < (s.targetMarginPct || 30)) {
        decisionFactors.push('Margin (' + marginPct.toFixed(1) + '%) is slightly under target (' + (s.targetMarginPct || 30) + '%).');
        keyConditions.push('Require C-Suite pricing approval for margin concession.');
      }
      if (avgRiskScore > 50) {
        decisionFactors.push('Elevated supply/penalty risk detected in tender clauses (' + avgRiskScore + '/100).');
        keyConditions.push('Establish dedicated 60-day safety stock buffer before contract execution.');
      }
      if (winProbability < 40) {
        decisionFactors.push('Win probability is moderate (' + winProbability.toFixed(1) + '%) due to aggressive competitor positioning.');
        keyConditions.push('Leverage non-price MEAT technical advantages to avoid excessive discounting.');
      }
    } else if (winProbability >= 65 && marginPct >= (s.targetMarginPct || 30) && avgRiskScore <= 50) {
      decision = 'GO';
      decisionBadgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      decisionFactors.push('Robust win probability (' + winProbability.toFixed(1) + '%) aligned with healthy gross margin (' + marginPct.toFixed(1) + '%).');
      decisionFactors.push('Manageable overall risk profile (' + avgRiskScore + '/100) with clear mitigation controls in place.');
      keyConditions.push('Maintain recommended bid price of ' + (s.currencySymbol || '') + optimalPrice.toFixed(2) + ' to protect profitability.');
    } else {
      decision = 'REVIEW';
      decisionBadgeClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      decisionFactors.push('Tender profile requires cross-functional commercial access & finance committee review.');
      keyConditions.push('Re-verify competitor price assumptions and local state reference price clauses.');
    }

    // 9. Standard Scenario Comparison Table
    const aggressivePrice = Math.max(totalUnitCost * 1.08, minCompBid * 0.95);
    const aggRatio = avgCompBid > 0 ? aggressivePrice / avgCompBid : 1.0;
    let aggWinProb = 1 / (1 + Math.exp(elasticity * (aggRatio - 1.0 - centerShift)));
    if (s.historicalWinRate) aggWinProb = (aggWinProb * 0.75) + ((s.historicalWinRate / 100) * 0.25);
    const aggWinPct = Math.max(2, Math.min(98, aggWinProb * 100));
    const aggMargin = aggressivePrice - totalUnitCost;

    const balancedPrice = optimalPrice;
    const balRatio = avgCompBid > 0 ? balancedPrice / avgCompBid : 1.0;
    let balWinProb = 1 / (1 + Math.exp(elasticity * (balRatio - 1.0 - centerShift)));
    if (s.historicalWinRate) balWinProb = (balWinProb * 0.75) + ((s.historicalWinRate / 100) * 0.25);
    const balWinPct = Math.max(2, Math.min(98, balWinProb * 100));
    const balMargin = balancedPrice - totalUnitCost;

    const premiumPrice = Math.max(balancedPrice * 1.15, maxCompBid * 0.98);
    const premRatio = avgCompBid > 0 ? premiumPrice / avgCompBid : 1.0;
    let premWinProb = 1 / (1 + Math.exp(elasticity * (premRatio - 1.0 - centerShift)));
    if (s.historicalWinRate) premWinProb = (premWinProb * 0.75) + ((s.historicalWinRate / 100) * 0.25);
    const premWinPct = Math.max(2, Math.min(98, premWinProb * 100));
    const premMargin = premiumPrice - totalUnitCost;

    const scenarios = [
      {
        name: 'Scenario A: Aggressive Bid',
        type: 'Aggressive',
        desc: 'Low price / Maximum win probability capture',
        bidPrice: aggressivePrice,
        winProb: aggWinPct,
        revenue: aggressivePrice * volume,
        unitMargin: aggMargin,
        marginPct: (aggMargin / aggressivePrice) * 100,
        expectedProfit: (aggWinPct / 100) * (aggMargin * volume),
        riskLevel: 'Elevated Margin Leakage Risk'
      },
      {
        name: 'Scenario B: Balanced Optimal Bid',
        type: 'Balanced (Recommended)',
        desc: 'Optimized profit-maximizing efficient frontier',
        bidPrice: balancedPrice,
        winProb: balWinPct,
        revenue: balancedPrice * volume,
        unitMargin: balMargin,
        marginPct: (balMargin / balancedPrice) * 100,
        expectedProfit: (balWinPct / 100) * (balMargin * volume),
        riskLevel: 'Balanced Risk & Reward'
      },
      {
        name: 'Scenario C: Premium Bid',
        type: 'Premium',
        desc: 'High unit margin / Lower volume probability',
        bidPrice: premiumPrice,
        winProb: premWinPct,
        revenue: premiumPrice * volume,
        unitMargin: premMargin,
        marginPct: (premMargin / premiumPrice) * 100,
        expectedProfit: (premWinPct / 100) * (premMargin * volume),
        riskLevel: 'High Volume Loss Risk'
      }
    ];

    return {
      totalUnitCost,
      proposedBidPrice,
      volume,
      unitMargin,
      marginPct,
      totalRevenueIfWon,
      totalProfitIfWon,
      breakEvenPrice,
      avgCompBid,
      minCompBid,
      maxCompBid,
      avgAggressiveness,
      winProbability,
      expectedRevenue,
      expectedProfit,
      optimalPrice,
      maxExpectedProfit,
      priceSimulationCurve,
      avgRiskScore,
      normalizedCategoryScores,
      decision,
      decisionBadgeClass,
      decisionFactors,
      keyConditions,
      scenarios
    };
  }
};
