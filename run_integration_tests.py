import requests

BASE = 'http://localhost:8000'

def run_tests():
    # 1. Login
    print('--- 1. Login & RBAC Authentication ---')
    login_res = requests.post(f'{BASE}/api/auth/login', json={
        'email': 'manager@sunguardpharma.in',
        'password': 'PharmaBid2026!'
    })
    assert login_res.status_code == 200, f'Login failed: {login_res.text}'
    user_data = login_res.json()
    token = user_data['access_token']
    user = user_data['user']
    print(f"Logged in as: {user['name']} (Role: {user['role']}, Org: {user['organization_id']})")

    headers = {'Authorization': f'Bearer {token}'}

    # 2. List tenders
    print('\n--- 2. Tenders Pipeline & Discovery ---')
    tenders_res = requests.get(f'{BASE}/api/tenders', headers=headers)
    assert tenders_res.status_code == 200
    tenders = tenders_res.json()['tenders']
    print(f"Total verified tenders in database: {len(tenders)}")
    for t in tenders:
        sym = 'INR ' if t.get('currency_symbol') == '\u20b9' else t.get('currency_symbol', '')
        print(f" - [{t['portal_source']}] {t['tender_id']}: {t['molecule']} (Est: {sym}{t['estimated_value']:,.0f})")

    # 3. Document AI Extraction
    print('\n--- 3. Document AI Analysis & Provenance ---')
    cmss_id = tenders[0]['id']
    with open('storage/tenders/test_cmss_sample.pdf', 'rb') as f:
        upload_res = requests.post(
            f'{BASE}/api/tenders/{cmss_id}/upload-document',
            headers=headers,
            data={'doc_type': 'NIT'},
            files={'file': ('test_cmss_sample.pdf', f, 'application/pdf')}
        )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    print(f"Document parsed: {upload_data['file_name']}, Pages: {upload_data['page_count']}, SHA-256: {upload_data['sha256'][:16]}...")
    print(f"Clauses extracted: {upload_data['clauses_extracted']}")

    # 4. Bid Economics Evaluation
    print('\n--- 4. Calibrated Bid Economics & Decision ---')
    eval_res = requests.post(
        f'{BASE}/api/bids/evaluate',
        headers=headers,
        json={
            'tender_id': cmss_id,
            'proposed_bid_price': 4.40,
            'volume': 2500000,
            'direct_cogs': 2.10,
            'qc_packaging_cost': 0.25,
            'logistics_cost': 0.40,
            'distribution_fee': 0.15,
            'financing_rate_pct': 8.5,
            'target_margin_pct': 34.0
        }
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    econ = eval_data['bid_economics']
    print(f"Decision: {econ['decision']}")
    print(f"Rationale: {econ['decision_rationale']}")
    print(f"Calibrated P(Win): {econ['win_probability']}% (95% CI: [{econ['win_prob_lower']}% - {econ['win_prob_upper']}])")
    print(f"Unit Margin: {econ['margin_pct']}% | Expected Profit: INR {econ['expected_profit']:,.0f}")

    # 5. Sign-Off Approval
    print('\n--- 5. Executive Governance Sign-Off ---')
    appr_res = requests.post(
        f'{BASE}/api/bids/approve',
        headers=headers,
        json={
            'tender_id': cmss_id,
            'decision_verdict': 'APPROVED',
            'notes': 'Production readiness verified against CMSS delivery and shelf-life constraints.'
        }
    )
    assert appr_res.status_code == 200
    print(f"Sign-off recorded: {appr_res.json()['verdict']} by {appr_res.json()['approved_by']}")

    # 6. Audit Trail
    print('\n--- 6. Audit Trail & Working History ---')
    audit_res = requests.get(f'{BASE}/api/audit-logs?limit=5', headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()['logs']
    print(f"Audit trail records returned: {len(logs)}")
    for l in logs:
        print(f" - [{l['action']}] on {l['entity_type']} ({l['entity_id'][:16]}...) by {l['user_email']}")

    # 7. Frontend UI check
    print('\n--- 7. Frontend Web Interface HTML Check ---')
    ui_res = requests.get(f'{BASE}/')
    assert ui_res.status_code == 200
    assert 'PharmaBid AI' in ui_res.text
    assert 'Executive Cockpit' in ui_res.text
    print("Web interface successfully served from FastAPI static mount (Status: 200 OK)")

    print('\n>>> ALL 7 CORE CAPABILITIES TESTED AND FULLY OPERATIONAL! <<<')

if __name__ == '__main__':
    run_tests()
