import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

print("1. Testing Built-in Demo Agent (Run Hackathon Demo Flow)...")
res = requests.post(f"{BASE_URL}/demo/run")
if res.status_code == 200:
    print("Demo Flow PASSED")
else:
    print(f"Demo Flow FAILED: {res.text}")

print("2. Testing External Agent Registration...")
payload = {
    "name": "External QA Agent",
    "description": "Dummy external agent for QA",
    "system_prompt": "You are external.",
    "policies": [],
    "agent_type": "EXTERNAL_API",
    "endpoint": "http://localhost:8080",
    "method": "POST",
    "auth_type": "ApiKey",
    "api_key": "test_token_123",
    "request_template": '{"message": "{{user_input}}"}',
    "response_format": "response"
}
res = requests.post(f"{BASE_URL}/agents/", json=payload)
if res.status_code == 200:
    agent_id = res.json()["id"]
    print(f"Agent Registration PASSED (ID: {agent_id})")
else:
    print(f"Agent Registration FAILED: {res.text}")
    exit(1)

print("3. Testing Connection...")
conn_payload = {
    "endpoint": "http://localhost:8080",
    "method": "POST",
    "auth_type": "ApiKey",
    "api_key": "test_token_123",
    "request_template": '{"message": "{{user_input}}"}',
    "test_input": "Hello"
}
res = requests.post(f"{BASE_URL}/agents/test-connection", json=conn_payload)
if res.status_code == 200 and res.json().get("status") == "CONNECTED":
    print("Test Connection PASSED")
else:
    print(f"Test Connection FAILED: {res.text}")

print("4. Testing External Agent Evaluation...")
# We need at least one scenario for the external agent
res = requests.post(f"{BASE_URL}/agents/{agent_id}/scenarios/generate")
scen_id = res.json()[0]["id"]

res = requests.post(f"{BASE_URL}/evaluations/run?agent_id={agent_id}")
if res.status_code == 200:
    eval_id = res.json()["id"]
    print(f"External Agent Evaluation PASSED (Eval ID: {eval_id})")
    
    # Wait for completion (since it's synchronous here it should already be done)
    # Check failure classification
    execs = res.json()["executions"]
    if execs:
        trace = execs[0]
        final_res = trace["trace_data"].get("final_response")
        print(f"Final Response from External Agent: {final_res}")
else:
    print(f"External Agent Evaluation FAILED: {res.text}")

print("All tests passed.")
