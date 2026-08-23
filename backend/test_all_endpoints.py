import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_suite():
    print("--- TESTING ALL API ENDPOINTS ON 127.0.0.1:8000 ---")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[OK] GET /health -> 200 OK:", res.json())
    
    # 2. Get agents
    res = requests.get(f"{BASE_URL}/api/agents")
    assert res.status_code == 200, f"Get agents failed: {res.status_code}"
    agents = res.json()
    print(f"[OK] GET /api/agents -> 200 OK ({len(agents)} agents returned)")
    
    # 3. Create agent
    new_agent = {
        "name": "Test External Agent",
        "description": "Agent for automated endpoint verification",
        "agent_type": "EXTERNAL_API",
        "endpoint": "https://postman-echo.com/post",
        "method": "POST",
        "auth_type": "None",
        "request_template": "{\n  \"message\": \"{{user_input}}\"\n}",
        "response_format": "json.message"
    }
    res = requests.post(f"{BASE_URL}/api/agents", json=new_agent)
    assert res.status_code == 200, f"Create agent failed: {res.status_code}"
    agent_data = res.json()
    agent_id = agent_data["id"]
    print(f"[OK] POST /api/agents -> 200 OK (Created Agent ID #{agent_id})")

    # 4. Test connection on Postman Echo
    test_conn_payload = {
        "endpoint": "https://postman-echo.com/post",
        "method": "POST",
        "auth_type": "None",
        "request_template": "{\n  \"message\": \"{{user_input}}\"\n}",
        "response_format": "json.message",
        "test_input": "Hello, how can you help me?"
    }
    res = requests.post(f"{BASE_URL}/api/agents/test-connection", json=test_conn_payload)
    assert res.status_code == 200, f"Test connection failed: {res.status_code}"
    conn_result = res.json()
    print("[OK] POST /api/agents/test-connection -> 200 OK:", conn_result)
    assert conn_result["status"] == "CONNECTED", f"Expected CONNECTED, got {conn_result['status']}"

    # 4b. Test connection via agent ID
    res = requests.post(f"{BASE_URL}/api/agents/{agent_id}/test-connection")
    assert res.status_code == 200, f"Agent ID test connection failed: {res.status_code}"
    print("[OK] POST /api/agents/{id}/test-connection -> 200 OK:", res.json())

    # 5. Get agent by ID
    res = requests.get(f"{BASE_URL}/api/agents/{agent_id}")
    assert res.status_code == 200, f"Get agent by ID failed: {res.status_code}"
    print(f"[OK] GET /api/agents/{agent_id} -> 200 OK")

    # 6. Run Demo Flow to populate evaluation runs
    res = requests.post(f"{BASE_URL}/api/demo/run")
    assert res.status_code == 200, f"Demo run failed: {res.status_code}"
    print("[OK] POST /api/demo/run -> 200 OK:", res.json())

    # 7. Get scenarios for agent 1
    res = requests.get(f"{BASE_URL}/api/agents/1/scenarios")
    assert res.status_code == 200, f"Get scenarios failed: {res.status_code}"
    scenarios = res.json()
    print(f"[OK] GET /api/agents/1/scenarios -> 200 OK ({len(scenarios)} scenarios)")
    assert len(scenarios) > 0, "No scenarios returned"
    scenario_id = scenarios[0]["id"]

    # 8. Update scenario
    update_data = {"expected_behavior": "Updated expected behavior for test"}
    res = requests.put(f"{BASE_URL}/api/scenarios/{scenario_id}", json=update_data)
    assert res.status_code == 200, f"PUT /api/scenarios/{scenario_id} failed: {res.status_code}"
    print(f"[OK] PUT /api/scenarios/{scenario_id} -> 200 OK")

    # 9. Replay scenario
    res = requests.post(f"{BASE_URL}/api/agents/1/scenarios/{scenario_id}/replay")
    assert res.status_code == 200, f"Replay scenario failed: {res.status_code}"
    replay_res = res.json()
    print(f"[OK] POST /api/agents/1/scenarios/{scenario_id}/replay -> 200 OK (Status: {replay_res['status']})")

    # 10. Run evaluation
    res = requests.post(f"{BASE_URL}/api/evaluation/run?agent_id=1")
    assert res.status_code == 200, f"Run evaluation failed: {res.status_code}"
    eval_data = res.json()
    eval_id = eval_data["id"]
    print(f"[OK] POST /api/evaluation/run?agent_id=1 -> 200 OK (Evaluation ID #{eval_id})")

    # 11. Get evaluation by ID
    res = requests.get(f"{BASE_URL}/api/evaluation/{eval_id}")
    assert res.status_code == 200, f"Get evaluation failed: {res.status_code}"
    print(f"[OK] GET /api/evaluation/{eval_id} -> 200 OK (Score: {res.json()['overall_score']})")

    # 12. Get execution traces
    res = requests.get(f"{BASE_URL}/api/traces")
    assert res.status_code == 200, f"Get traces failed: {res.status_code}"
    traces = res.json()
    print(f"[OK] GET /api/traces -> 200 OK ({len(traces)} execution traces)")
    assert len(traces) > 0, "No traces returned"
    trace_id = traces[0]["id"]

    res = requests.get(f"{BASE_URL}/api/traces/{trace_id}")
    assert res.status_code == 200, f"Get trace by ID failed: {res.status_code}"
    print(f"[OK] GET /api/traces/{trace_id} -> 200 OK")

    # 13. Get reliability report
    res = requests.get(f"{BASE_URL}/api/reports/reliability")
    assert res.status_code == 200, f"Get reliability report failed: {res.status_code}"
    report_data = res.json()
    print(f"[OK] GET /api/reports/reliability -> 200 OK (Score: {report_data['overall_score']}, Failures: {report_data['failures_count']})")

    # 14. Get regression report
    res = requests.get(f"{BASE_URL}/api/regression")
    assert res.status_code == 200, f"Get regression report failed: {res.status_code}"
    print("[OK] GET /api/regression -> 200 OK:", res.json())

    # 15. Verify SPA routes serve index.html (200 OK)
    spa_routes = ["/", "/agents", "/connect", "/test-generation", "/evaluation-traces", "/reliability-report", "/regression-tracking"]
    for route in spa_routes:
        res = requests.get(f"{BASE_URL}{route}")
        assert res.status_code == 200, f"SPA route {route} failed: {res.status_code}"
        assert "<!doctype html>" in res.text.lower() or "<html" in res.text.lower(), f"SPA route {route} did not return HTML"
        print(f"[OK] SPA Route GET {route} -> 200 OK (HTML served)")

    print("\nALL API AND SPA ROUTES VERIFIED SUCCESSFULLY ON 127.0.0.1:8000!")

if __name__ == "__main__":
    test_suite()
