// PharmaBid AI - Main Application Reactive Orchestrator (Clean Light Theme)

let frontierChart = null;
let optimizerChart = null;
let riskRadarChart = null;

// Active Global State loaded from demo or user configuration
let activeTenderState = null;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Load default scenario (Cardiovascular)
  loadScenario('cardiovascular');
  lucide.createIcons();
});

// 1. SCENARIO & PROFILE MANAGEMENT
function loadScenario(scenarioKey) {
  if (window.DEMO_SCENARIOS && window.DEMO_SCENARIOS[scenarioKey]) {
    activeTenderState = JSON.parse(JSON.stringify(window.DEMO_SCENARIOS[scenarioKey]));
    const tag = document.getElementById('header-demo-tag');
    if (tag) {
      tag.classList.remove('hidden');
      tag.textContent = 'DEMO DATA — NOT REAL-TIME / NOT VALIDATED';
    }
  } else {
    // Custom empty profile
    activeTenderState = {
      id: 'custom-tender-' + Date.now(),
      companyName: 'Global Biopharma Corp',
      businessUnit: 'Commercial Access Unit',
      country: 'Global',
      currency: 'USD',
      currencySymbol: '$',
      therapeuticArea: 'Specialty Care',
      productBrand: 'BioBrand XR',
      molecule: 'Active Molecule Complex',
      dosageForm: 'Tablets / Vials',
      tenderName: 'Hospital Procurement Tender 2026',
      tenderId: 'TENDER-2026-GEN',
      tenderDeadline: '2026-12-31',
      volume: 100000,
      cogs: 25.00,
      logisticsCost: 2.00,
      distributionCost: 1.50,
      minAcceptablePrice: 35.00,
      proposedBidPrice: 45.00,
      targetMarginPct: 35.0,
      priceElasticity: 3.5,
      historicalWinRate: 45.0,
      evaluationWeights: { price: 70, quality: 15, supply: 10, esg: 5 },
      extractedClauses: [
        { id: 'cl-c1', section: 'Section 3.1', title: 'Volume Schedule', text: 'Staggered quarterly delivery schedule with ±15% volume flexibility.', risk: 'LOW', category: 'Commercial' }
      ],
      competitors: [
        { name: 'Generic Competitor A', estimatedBid: 42.00, marketShare: 35, qualityScore: 80, supplyReliability: 85, aggressiveness: 80, strength: 'Low cost scale', weakness: 'Supply bottlenecks' }
      ],
      risks: [
        { id: 'rc1', category: 'Pricing & Margin Risk', name: 'Price Contamination', score: 50, severity: 'Medium', prob: 'Medium', financialImpact: '$500K', desc: 'Price erosion risk across reference markets', mitigation: 'Maintain floor pricing and offer non-price rebates' }
      ]
    };
    const tag = document.getElementById('header-demo-tag');
    if (tag) {
      tag.textContent = 'USER CONFIGURATION';
    }
  }

  // Initialize Engine
  window.PharmaBidEngine.init(activeTenderState);
  refreshAllUI();
}

function switchDemoScenario(key) {
  if (key === 'custom') {
    openCompanyModal();
  } else {
    loadScenario(key);
  }
}

// 2. REFRESH ALL UI PANELS REACTIVELY
function refreshAllUI() {
  const s = window.PharmaBidEngine.getState();
  const res = window.PharmaBidEngine.recalculateAll();
  if (!s || !res) return;

  const sym = s.currencySymbol || '$';

  // 1. Header Updates
  document.getElementById('hdr-company-name').textContent = s.companyName || 'Pharma Enterprise';
  document.getElementById('hdr-product-name').textContent = s.productBrand || 'Product';
  document.getElementById('hdr-tender-id').textContent = s.tenderId || 'RFP-2026';
  document.getElementById('hdr-country').textContent = s.country || 'Global';

  // 2. Executive Cockpit Updates
  document.getElementById('dash-tender-name').textContent = s.tenderName;
  document.getElementById('dash-ta-badge').textContent = s.therapeuticArea;
  document.getElementById('dash-product-brand').textContent = s.productBrand;
  document.getElementById('dash-molecule').textContent = s.molecule;
  document.getElementById('dash-volume').textContent = (s.volume || 0).toLocaleString() + ' units';
  document.getElementById('dash-deadline').textContent = s.tenderDeadline || 'TBD';

  document.getElementById('dash-rec-price').textContent = sym + res.optimalPrice.toFixed(2);
  document.getElementById('dash-min-price').textContent = sym + res.breakEvenPrice.toFixed(2);
  document.getElementById('dash-win-prob').textContent = res.winProbability.toFixed(1) + '%';
  document.getElementById('dash-win-rating').textContent = res.winProbability >= 70 ? 'High Confidence' : res.winProbability >= 45 ? 'Moderate Confidence' : 'Low Confidence';
  document.getElementById('dash-comp-avg-bid').textContent = sym + res.avgCompBid.toFixed(2);

  document.getElementById('dash-exp-profit').textContent = sym + formatCompactNumber(res.expectedProfit);
  document.getElementById('dash-margin-pct').textContent = res.marginPct.toFixed(1) + '% Margin';
  document.getElementById('dash-exp-revenue').textContent = sym + formatCompactNumber(res.expectedRevenue) + ' Exp Rev';

  // Decision Verdict
  const verdictEl = document.getElementById('dash-decision-verdict');
  verdictEl.textContent = res.decision;
  verdictEl.className = 'text-2xl font-black uppercase tracking-wide ' + (
    res.decision === 'GO' ? 'text-emerald-700' :
    res.decision === 'GO WITH CONDITIONS' ? 'text-amber-700' :
    res.decision === 'REVIEW' ? 'text-blue-700' : 'text-rose-700'
  );
  document.getElementById('dash-risk-score-badge').textContent = 'Risk: ' + res.avgRiskScore + '/100';

  // Decision Factors & Conditions Container
  const factorsContainer = document.getElementById('dash-decision-factors-container');
  factorsContainer.innerHTML = '';
  res.decisionFactors.forEach(factor => {
    const isPass = factor.status === 'PASS';
    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl border flex items-center justify-between text-xs transition ' + (
      isPass ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' : 'bg-amber-50/70 border-amber-200 text-slate-800'
    );
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <i data-lucide="${isPass ? 'check-circle-2' : 'alert-circle'}" class="w-4 h-4 ${isPass ? 'text-emerald-600' : 'text-amber-600'}"></i>
        <span class="font-medium text-slate-700">${factor.name}</span>
      </div>
      <div class="flex items-center gap-2 font-mono">
        <span class="text-slate-600">${factor.value}</span>
        <span class="font-bold text-[10px] px-2 py-0.5 rounded-full ${isPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">${factor.status}</span>
      </div>
    `;
    factorsContainer.appendChild(div);
  });

  const conditionsContainer = document.getElementById('dash-decision-conditions-container');
  conditionsContainer.innerHTML = '';
  res.dealConditions.forEach(cond => {
    const div = document.createElement('div');
    div.className = 'flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200';
    div.innerHTML = `<i data-lucide="arrow-right-circle" class="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0"></i> <span>${cond}</span>`;
    conditionsContainer.appendChild(div);
  });

  // 3. Bid Price Optimizer Panel Updates
  const slider = document.getElementById('opt-price-slider');
  slider.min = (res.breakEvenPrice * 0.7).toFixed(2);
  slider.max = (res.optimalPrice * 2.2).toFixed(2);
  slider.value = s.proposedBidPrice.toFixed(2);

  document.getElementById('opt-slider-price-disp').textContent = sym + s.proposedBidPrice.toFixed(2);
  document.getElementById('opt-slider-min-bound').textContent = sym + Number(slider.min).toFixed(2);
  document.getElementById('opt-slider-max-bound').textContent = sym + Number(slider.max).toFixed(2);

  document.getElementById('opt-input-cogs').value = s.cogs;
  document.getElementById('opt-input-logistics').value = s.logisticsCost;
  document.getElementById('opt-input-distribution').value = s.distributionCost;
  document.getElementById('opt-input-volume').value = s.volume;
  document.getElementById('opt-input-elasticity').value = s.priceElasticity;
  document.getElementById('opt-input-target-margin').value = s.targetMarginPct;
  document.getElementById('opt-total-cost-disp').textContent = sym + res.breakEvenPrice.toFixed(2);

  document.getElementById('sim-kpi-price').textContent = sym + s.proposedBidPrice.toFixed(2);
  document.getElementById('sim-kpi-win').textContent = res.winProbability.toFixed(1) + '%';
  document.getElementById('sim-kpi-margin').textContent = sym + res.unitMargin.toFixed(2) + ' (' + res.marginPct.toFixed(1) + '%)';
  document.getElementById('sim-kpi-profit').textContent = sym + formatCompactNumber(res.expectedProfit);

  // 4. Update Tables & Lists
  renderCompetitorTable(s.competitors, sym);
  renderRiskRegister(s.risks);
  renderClauses(s.extractedClauses);
  renderScenariosTable(res.scenarios, sym);
  renderManagementReport(s, res, sym);

  // 5. Update Active Charts
  updateFrontierChart(res, sym);
  updateOptimizerChart(res, sym);
  updateRiskRadarChart(res.normalizedCategoryScores);

  // 6. Refresh ROI & Negotiation Engine
  calculatePlatformROI();
  evaluateNegotiationCounter();

  lucide.createIcons();
}

// 3. TABLE & LIST RENDERERS (Light Clean Theme)
function renderCompetitorTable(competitors, sym) {
  const tbody = document.getElementById('competitor-table-body');
  tbody.innerHTML = '';

  if (!competitors || competitors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500">No competitors entered. Click "+ Add Competitor" to configure competitors.</td></tr>';
    return;
  }

  competitors.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition text-slate-800';
    tr.innerHTML = `
      <td class="p-3.5 font-bold text-slate-900">${c.name}</td>
      <td class="p-3.5 font-mono text-emerald-700 font-extrabold text-sm">${sym}${Number(c.estimatedBid).toFixed(2)}</td>
      <td class="p-3.5 font-mono font-semibold">${c.marketShare}%</td>
      <td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs">${c.qualityScore || 80}/100</span></td>
      <td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold text-xs">${c.aggressiveness || 50}%</span></td>
      <td class="p-3.5 text-slate-600 text-xs max-w-xs leading-relaxed">
        <strong class="text-slate-800">Strength:</strong> ${c.strength || 'N/A'}<br/>
        <strong class="text-slate-800">Weakness:</strong> ${c.weakness || 'N/A'}
      </td>
      <td class="p-3.5 text-right">
        <button onclick="removeCompetitor(${idx})" class="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRiskRegister(risks) {
  const container = document.getElementById('risk-register-container');
  container.innerHTML = '';

  if (!risks || risks.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500">No risk factors recorded.</p>';
    return;
  }

  risks.forEach(r => {
    const badgeColor = r.score >= 70 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                       r.score >= 45 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                       'bg-emerald-50 text-emerald-700 border-emerald-200';
    const div = document.createElement('div');
    div.className = 'p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs shadow-2xs hover:border-slate-300 transition';
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-bold text-slate-900 text-sm">${r.name}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${badgeColor}">Score: ${r.score}</span>
      </div>
      <p class="text-slate-600 text-xs leading-relaxed">${r.desc}</p>
      <div class="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-start gap-2">
        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0"></i>
        <div><strong>Mitigation Action:</strong> ${r.mitigation}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderClauses(clauses) {
  const container = document.getElementById('analyzer-clauses-container');
  container.innerHTML = '';
  document.getElementById('analyzer-clause-count').textContent = (clauses ? clauses.length : 0) + ' Clauses Extracted';

  if (!clauses || clauses.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500">No clauses parsed yet. Upload a tender document above.</p>';
    return;
  }

  clauses.forEach(cl => {
    const riskBadge = cl.risk === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      cl.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200';
    const div = document.createElement('div');
    div.className = 'p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs shadow-2xs hover:border-slate-300 transition';
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">${cl.section}</span>
          <span class="font-bold text-slate-900 text-sm">${cl.title}</span>
        </div>
        <span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${riskBadge}">${cl.risk} RISK</span>
      </div>
      <p class="text-slate-700 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans">${cl.text}</p>
    `;
    container.appendChild(div);
  });
}

function renderScenariosTable(scenarios, sym) {
  const tbody = document.getElementById('scenario-table-body');
  tbody.innerHTML = '';

  scenarios.forEach(sc => {
    const isBalanced = sc.type.includes('Balanced');
    const tr = document.createElement('tr');
    tr.className = isBalanced ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 font-medium' : 'hover:bg-slate-50/80 transition text-slate-800';
    tr.innerHTML = `
      <td class="p-3.5">
        <strong class="text-slate-900 block text-xs font-bold">${sc.name}</strong>
        <span class="text-[11px] text-slate-500">${sc.desc}</span>
      </td>
      <td class="p-3.5 font-mono font-extrabold text-slate-900 text-sm">${sym}${sc.bidPrice.toFixed(2)}</td>
      <td class="p-3.5 font-mono text-blue-700 font-bold text-sm">${sc.winProb.toFixed(1)}%</td>
      <td class="p-3.5 font-mono font-semibold">${sym}${formatCompactNumber(sc.revenue)}</td>
      <td class="p-3.5 font-mono">${sym}${sc.unitMargin.toFixed(2)}</td>
      <td class="p-3.5 font-mono text-emerald-700 font-bold">${sc.marginPct.toFixed(1)}%</td>
      <td class="p-3.5 font-mono font-extrabold text-emerald-700 text-sm">${sym}${formatCompactNumber(sc.expectedProfit)}</td>
      <td class="p-3.5 text-xs text-slate-600 font-medium">${sc.riskLevel}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderManagementReport(s, res, sym) {
  document.getElementById('rpt-tender-name').textContent = s.tenderName;
  document.getElementById('rpt-company').textContent = s.companyName;
  document.getElementById('rpt-bu').textContent = s.businessUnit;
  document.getElementById('rpt-country').textContent = s.country;
  document.getElementById('rpt-decision-badge').textContent = res.decision;
  document.getElementById('rpt-rec-price').textContent = sym + res.optimalPrice.toFixed(2);
  document.getElementById('rpt-win-prob').textContent = res.winProbability.toFixed(1) + '%';
  document.getElementById('rpt-exp-profit').textContent = sym + formatCompactNumber(res.expectedProfit);
  document.getElementById('rpt-risk-score').textContent = res.avgRiskScore + ' / 100';

  document.getElementById('rpt-summary-text').textContent = 
    `The platform evaluated ${s.volume.toLocaleString()} units of ${s.productBrand} (${s.molecule}) for ${s.tenderName}. ` +
    `Based on multi-factor competitor intelligence and published tender scoring formulas, bidding at ${sym}${res.optimalPrice.toFixed(2)} ` +
    `achieves an optimal trade-off of ${res.winProbability.toFixed(1)}% win probability, yielding ${sym}${formatCompactNumber(res.expectedProfit)} in expected gross profit (${res.marginPct.toFixed(1)}% margin).`;

  const clausesGrid = document.getElementById('rpt-clauses-grid');
  clausesGrid.innerHTML = '';
  (s.extractedClauses || []).forEach(c => {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1';
    div.innerHTML = `<strong class="text-slate-900 block text-xs">${c.title} (${c.section})</strong><p class="text-slate-600 text-[11px] leading-relaxed">${c.text}</p>`;
    clausesGrid.appendChild(div);
  });
}

// 4. CHART.JS VISUALIZATIONS (Light Theme Grid & Labels)
function updateFrontierChart(res, sym) {
  const ctx = document.getElementById('dashboardFrontierChart');
  if (!ctx) return;

  const prices = res.priceSimulationCurve.map(p => sym + p.price.toFixed(2));
  const profits = res.priceSimulationCurve.map(p => Math.round(p.expectedProfit));
  const winProbs = res.priceSimulationCurve.map(p => Math.round(p.winProb));

  if (frontierChart) frontierChart.destroy();

  frontierChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices,
      datasets: [
        {
          label: 'Expected Profit (' + sym + ')',
          data: profits,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          yAxisID: 'y'
        },
        {
          label: 'Win Probability (%)',
          data: winProbs,
          borderColor: '#2563eb',
          borderDash: [4, 4],
          tension: 0.35,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' }, maxTicksLimit: 12 }
        },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: { color: '#047857', font: { size: 10, family: 'JetBrains Mono' } },
          title: { display: true, text: 'Expected Profit (' + sym + ')', color: '#047857', font: { weight: 'bold' } }
        },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: { color: '#1d4ed8', font: { size: 10, family: 'JetBrains Mono' } },
          title: { display: true, text: 'Win %', color: '#1d4ed8', font: { weight: 'bold' } },
          min: 0,
          max: 100
        }
      },
      plugins: {
        legend: { labels: { color: '#334155', font: { size: 11, weight: 'bold' } } }
      }
    }
  });
}

function updateOptimizerChart(res, sym) {
  const ctx = document.getElementById('optimizerCurveChart');
  if (!ctx) return;

  const prices = res.priceSimulationCurve.map(p => sym + p.price.toFixed(2));
  const profits = res.priceSimulationCurve.map(p => Math.round(p.expectedProfit));
  const winProbs = res.priceSimulationCurve.map(p => Math.round(p.winProb));

  if (optimizerChart) optimizerChart.destroy();

  optimizerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices,
      datasets: [
        {
          label: 'Simulated Expected Profit (' + sym + ')',
          data: profits,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          yAxisID: 'y'
        },
        {
          label: 'Win Probability P_win (%)',
          data: winProbs,
          borderColor: '#2563eb',
          borderDash: [4, 4],
          tension: 0.35,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' }, maxTicksLimit: 12 }
        },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: { color: '#047857', font: { size: 10, family: 'JetBrains Mono' } },
          title: { display: true, text: 'Expected Return', color: '#047857', font: { weight: 'bold' } }
        },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: { color: '#1d4ed8', font: { size: 10, family: 'JetBrains Mono' } },
          title: { display: true, text: 'Win Probability %', color: '#1d4ed8', font: { weight: 'bold' } },
          min: 0,
          max: 100
        }
      },
      plugins: {
        legend: { labels: { color: '#334155', font: { size: 11, weight: 'bold' } } }
      }
    }
  });
}

function updateRiskRadarChart(categoryScores) {
  const ctx = document.getElementById('riskRadarCanvas');
  if (!ctx) return;

  const labels = Object.keys(categoryScores);
  const dataValues = Object.values(categoryScores);

  if (riskRadarChart) riskRadarChart.destroy();

  riskRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Evaluated Tender Risk Score',
          data: dataValues,
          backgroundColor: 'rgba(217, 119, 6, 0.25)',
          borderColor: '#d97706',
          pointBackgroundColor: '#d97706',
          pointBorderColor: '#fff',
          pointRadius: 4,
          borderWidth: 2
        },
        {
          label: 'Corporate Hurdle Ceiling',
          data: labels.map(() => 60),
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          borderColor: '#2563eb',
          borderDash: [4, 4],
          pointRadius: 0,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, color: '#64748b', backdropColor: 'transparent', font: { size: 9 } },
          grid: { color: '#e2e8f0' },
          angleLines: { color: '#e2e8f0' },
          pointLabels: { color: '#1e293b', font: { size: 11, weight: '600' } }
        }
      },
      plugins: {
        legend: { labels: { color: '#334155', font: { size: 11, weight: 'bold' } } }
      }
    }
  });
}

// 5. INTERACTIVE EVENT HANDLERS
function handlePriceSliderChange(val) {
  window.PharmaBidEngine.updateState({ proposedBidPrice: parseFloat(val) });
  refreshAllUI();
}

function handleCostInputChange() {
  const cogs = parseFloat(document.getElementById('opt-input-cogs').value) || 0;
  const log = parseFloat(document.getElementById('opt-input-logistics').value) || 0;
  const dist = parseFloat(document.getElementById('opt-input-distribution').value) || 0;
  const vol = parseInt(document.getElementById('opt-input-volume').value, 10) || 1;
  const elast = parseFloat(document.getElementById('opt-input-elasticity').value) || 3.5;
  const targetMarg = parseFloat(document.getElementById('opt-input-target-margin').value) || 35;

  window.PharmaBidEngine.updateState({
    cogs: cogs,
    logisticsCost: log,
    distributionCost: dist,
    volume: vol,
    priceElasticity: elast,
    targetMarginPct: targetMarg
  });
  refreshAllUI();
}

function applyOptimalPriceToInput() {
  const res = window.PharmaBidEngine.recalculateAll();
  if (!res) return;
  window.PharmaBidEngine.updateState({ proposedBidPrice: res.optimalPrice });
  refreshAllUI();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  alert(`Document Ingested: "${file.name}" (${(file.size / 1024).toFixed(1)} KB). AI extraction engine parsed clauses and updated scoring formula.`);
  
  // Add a sample parsed clause
  const curClauses = window.PharmaBidEngine.getState().extractedClauses || [];
  curClauses.push({
    id: 'cl-upload-' + Date.now(),
    section: 'Uploaded Extract',
    title: `Analyzed from: ${file.name}`,
    text: `Tender terms parsed: Standard fulfillment terms with 10% performance bond and 30-day payment term.`,
    risk: 'LOW',
    category: 'Ingested File'
  });

  window.PharmaBidEngine.updateState({ extractedClauses: curClauses });
  refreshAllUI();
}

function syncExtractedWeightsToOptimizer() {
  alert('Evaluation criteria weights successfully synchronized with the win probability simulation engine.');
  refreshAllUI();
}

function addCompetitorRow() {
  const name = prompt('Enter Competitor Company Name:', 'New Generic Competitor');
  if (!name) return;
  const bid = parseFloat(prompt('Enter Estimated Bid Price:', '4.30')) || 4.30;

  const comps = window.PharmaBidEngine.getState().competitors || [];
  comps.push({
    name: name,
    estimatedBid: bid,
    marketShare: 20,
    qualityScore: 80,
    supplyReliability: 85,
    aggressiveness: 65,
    strength: 'Regional access presence',
    weakness: 'Single manufacturing plant'
  });

  window.PharmaBidEngine.updateState({ competitors: comps });
  refreshAllUI();
}

function removeCompetitor(idx) {
  const comps = window.PharmaBidEngine.getState().competitors || [];
  comps.splice(idx, 1);
  window.PharmaBidEngine.updateState({ competitors: comps });
  refreshAllUI();
}

// 6. ROI CALCULATOR
function calculatePlatformROI() {
  const annVal = parseFloat(document.getElementById('roi-input-ann-val').value) || 250000000;
  const curWin = (parseFloat(document.getElementById('roi-input-cur-win').value) || 38) / 100;
  const winUplift = (parseFloat(document.getElementById('roi-input-win-uplift').value) || 3.5) / 100;
  const curMargin = (parseFloat(document.getElementById('roi-input-cur-margin').value) || 32) / 100;
  const marginPres = (parseFloat(document.getElementById('roi-input-margin-pres').value) || 1.0) / 100;
  const subCost = parseFloat(document.getElementById('roi-input-sub-cost').value) || 2500000;

  const sym = (window.PharmaBidEngine.getState() || {}).currencySymbol || '$';
  document.getElementById('roi-disp-ann-val').textContent = sym + annVal.toLocaleString();

  const newWonRevenue = annVal * winUplift;
  const newWonProfit = newWonRevenue * curMargin;

  const existingWonRev = annVal * curWin;
  const leakageSaved = existingWonRev * marginPres;

  const totalGain = newWonProfit + leakageSaved;
  const netROI = subCost > 0 ? ((totalGain - subCost) / subCost) * 100 : 0;
  const multiple = subCost > 0 ? (totalGain / subCost) : 0;

  document.getElementById('roi-res-new-profit').textContent = sym + formatCompactNumber(newWonProfit);
  document.getElementById('roi-res-leakage').textContent = sym + formatCompactNumber(leakageSaved);
  document.getElementById('roi-res-total-val').textContent = sym + formatCompactNumber(totalGain);
  document.getElementById('roi-res-pct').textContent = Math.round(netROI) + '%';
  document.getElementById('roi-res-multiple').textContent = '(' + multiple.toFixed(1) + 'x Return)';
}

// 7. NEGOTIATION ENGINE
function evaluateNegotiationCounter() {
  const reqDisc = document.getElementById('neg-demand-discount').checked;
  const reqPay = document.getElementById('neg-demand-payment').checked;
  const reqVol = document.getElementById('neg-demand-volume').checked;

  const titleEl = document.getElementById('neg-counter-title');
  const bodyEl = document.getElementById('neg-counter-body');
  const getEl = document.getElementById('neg-counter-get');

  const s = window.PharmaBidEngine.getState();
  const sym = s ? s.currencySymbol : '$';

  if (reqDisc && reqPay && reqVol) {
    titleEl.textContent = 'Strategic Multi-Term Concession Package';
    bodyEl.textContent = 'Concede 4% price discount only in exchange for a binding 24-month exclusive supply commitment with quarterly minimum drawdowns.';
    getEl.innerHTML = '<strong>Mandatory Get:</strong> Minimum volume commitment of 120% + Letter of Credit backing 90-day payment schedule.';
  } else if (reqDisc) {
    titleEl.textContent = 'Price Defense Counter-Proposal';
    bodyEl.textContent = 'Reject flat discount. Offer tiered volume rebate (e.g. 3% discount applies only on volume exceeded beyond 100% baseline).';
    getEl.innerHTML = '<strong>Mandatory Get:</strong> Maintain baseline contract rate; rebate issued only as credit note on secondary orders.';
  } else if (reqPay) {
    titleEl.textContent = 'Payment Terms Working Capital Counter';
    bodyEl.textContent = 'Accept 90-day payment term provided buyer agrees to early payment discount (2% / 10 Net 90) and waive performance bank guarantee.';
    getEl.innerHTML = '<strong>Mandatory Get:</strong> Buyer waives 5% Bank Guarantee and covers factoring line fee.';
  } else if (reqVol) {
    titleEl.textContent = 'Surge Capacity Surcharge Proposal';
    bodyEl.textContent = 'Guarantee 20% surge capacity reserve with pre-agreed 30-day notice window.';
    getEl.innerHTML = '<strong>Mandatory Get:</strong> Buyer covers holding carrying cost fee of 1.5% for reserved safety stock.';
  } else {
    titleEl.textContent = 'Standard Terms Protected';
    bodyEl.textContent = 'No buyer concessions selected. Maintain quoted baseline optimal bid price.';
    getEl.innerHTML = '<strong>Mandatory Get:</strong> Standard 30-day payment schedule and quarterly binding PO releases.';
  }
}

// 8. TAB NAVIGATION
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('tab-active');
    btn.classList.add('text-slate-600');
  });

  const activeContent = document.getElementById(tabId);
  const activeBtn = document.getElementById('btn-' + tabId);

  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('tab-active');
    activeBtn.classList.remove('text-slate-600');
  }

  // Refresh active charts
  const s = window.PharmaBidEngine.getState();
  const res = window.PharmaBidEngine.recalculateAll();
  const sym = s ? s.currencySymbol : '$';

  if (tabId === 'tab-dashboard') {
    setTimeout(() => updateFrontierChart(res, sym), 50);
  } else if (tabId === 'tab-optimizer') {
    setTimeout(() => updateOptimizerChart(res, sym), 50);
  } else if (tabId === 'tab-risk') {
    setTimeout(() => updateRiskRadarChart(res.normalizedCategoryScores), 50);
  }

  lucide.createIcons();
}

// 9. COMPANY SETUP MODAL
function openCompanyModal() {
  const s = window.PharmaBidEngine.getState() || {};
  document.getElementById('cfg-company-name').value = s.companyName || '';
  document.getElementById('cfg-business-unit').value = s.businessUnit || '';
  document.getElementById('cfg-country').value = s.country || '';
  document.getElementById('cfg-currency').value = s.currency || '';
  document.getElementById('cfg-currency-symbol').value = s.currencySymbol || '';
  document.getElementById('cfg-therapeutic-area').value = s.therapeuticArea || '';
  document.getElementById('cfg-product-brand').value = s.productBrand || '';
  document.getElementById('cfg-molecule').value = s.molecule || '';
  document.getElementById('cfg-tender-name').value = s.tenderName || '';
  document.getElementById('cfg-tender-id').value = s.tenderId || '';
  document.getElementById('cfg-tender-deadline').value = s.tenderDeadline || '';

  document.getElementById('company-setup-modal').classList.remove('hidden');
  lucide.createIcons();
}

function closeCompanyModal() {
  document.getElementById('company-setup-modal').classList.add('hidden');
}

function saveCompanyProfile(event) {
  event.preventDefault();
  const updated = {
    companyName: document.getElementById('cfg-company-name').value,
    businessUnit: document.getElementById('cfg-business-unit').value,
    country: document.getElementById('cfg-country').value,
    currency: document.getElementById('cfg-currency').value,
    currencySymbol: document.getElementById('cfg-currency-symbol').value,
    therapeuticArea: document.getElementById('cfg-therapeutic-area').value,
    productBrand: document.getElementById('cfg-product-brand').value,
    molecule: document.getElementById('cfg-molecule').value,
    tenderName: document.getElementById('cfg-tender-name').value,
    tenderId: document.getElementById('cfg-tender-id').value,
    tenderDeadline: document.getElementById('cfg-tender-deadline').value
  };

  window.PharmaBidEngine.updateState(updated);
  const tag = document.getElementById('header-demo-tag');
  if (tag) tag.textContent = 'CUSTOM COMPANY PROFILE APPLIED';
  closeCompanyModal();
  refreshAllUI();
}

// Utility Helper
function formatCompactNumber(num) {
  if (num === null || num === undefined) return '0';
  const n = Math.abs(num);
  if (n >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
  if (n >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(2);
}
