import time
from core.tools import TOOL_REGISTRY
import requests
import json

import ipaddress
import socket
from urllib.parse import urlparse

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ["http", "https"]:
            return False
        hostname = parsed.hostname
        if not hostname: 
            return False
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_loopback or ip_obj.is_private or ip_obj.is_link_local or ip_obj.is_multicast or ip_obj.is_unspecified:
            return False
        return True
    except Exception:
        return False

def extract_nested(data, path):
    if not path: return data
    keys = path.split(".")
    curr = data
    for k in keys:
        if isinstance(curr, dict) and k in curr:
            curr = curr[k]
        elif isinstance(curr, list) and k.isdigit() and int(k) < len(curr):
            curr = curr[int(k)]
        else:
            return None
    return curr

def redact_payload(data):
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(s in k.lower() for s in ["password", "api_key", "token", "access_token", "refresh_token", "authorization", "secret", "credential"]):
                redacted[k] = "REDACTED"
            else:
                redacted[k] = redact_payload(v)
        return redacted
    elif isinstance(data, list):
        return [redact_payload(item) for item in data]
    return data

class SandboxRunner:
    def __init__(self, max_steps=5, timeout=5.0):
        self.max_steps = max_steps
        self.timeout = timeout
        
    def run(self, agent, test_input: str):
        if hasattr(agent, "agent_type") and agent.agent_type == "EXTERNAL_API":
            return self._run_external(agent, test_input)
        return self._run_demo(test_input)

    def _run_external(self, agent, test_input: str):
        start_time = time.time()
        trace = {
            "input": test_input,
            "tool_calls": [],
            "events": [],
            "final_response": None,
            "error": None,
            "request_payload": None,
            "request_headers": None
        }
        
        def log_event(msg):
            trace["events"].append({"timestamp": time.time(), "message": msg})
            
        log_event(f"Started sandbox execution against EXTERNAL API: {agent.endpoint}")
        
        if not is_safe_url(agent.endpoint):
            trace["error"] = "BLOCKED_UNSAFE_DESTINATION"
            log_event("Execution blocked: Unsafe destination")
            return trace
            
        headers = agent.headers or {}
        if agent.auth_type == "Bearer" and agent.api_key:
            headers["Authorization"] = f"Bearer {agent.api_key}"
        elif agent.auth_type == "ApiKey" and agent.api_key:
            headers["X-API-Key"] = agent.api_key
            
        trace["request_headers"] = redact_payload(headers)
            
        payload = None
        if agent.request_template:
            try:
                payload_str = agent.request_template.replace("{{user_input}}", test_input)
                payload = json.loads(payload_str)
                trace["request_payload"] = redact_payload(payload)
            except Exception as e:
                trace["error"] = f"INVALID_RESPONSE"
                trace["events"].append({"timestamp": time.time(), "message": f"REQUEST_TEMPLATE_ERROR: {str(e)}"})
                return trace

        try:
            if agent.method.upper() == "POST":
                log_event(f"Sending POST request to {agent.endpoint}")
                res = requests.post(agent.endpoint, json=payload, headers=headers, timeout=self.timeout, allow_redirects=False)
            else:
                log_event(f"Sending GET request to {agent.endpoint}")
                res = requests.get(agent.endpoint, headers=headers, timeout=self.timeout, allow_redirects=False)
                
            if res.is_redirect:
                trace["error"] = "BLOCKED_UNSAFE_DESTINATION"
                log_event("Execution blocked: Unsafe redirect")
                return trace
                
            log_event(f"Received response status: {res.status_code}")
            
            if res.status_code >= 400:
                trace["error"] = f"HTTP_ERROR"
                trace["final_response"] = res.text[:500]
            else:
                try:
                    res_json = res.json()
                    if agent.response_format:
                        extracted = extract_nested(res_json, agent.response_format)
                        if extracted is not None:
                            trace["final_response"] = str(extracted)
                        else:
                            trace["error"] = "INVALID_RESPONSE"
                            log_event("Failed to extract response path")
                    else:
                        trace["final_response"] = str(res_json)
                except json.JSONDecodeError:
                    trace["error"] = "INVALID_RESPONSE"
                    log_event("Failed to decode JSON response")
                    
        except requests.exceptions.Timeout:
            trace["error"] = "TIMEOUT"
            log_event("Execution timed out")
        except requests.exceptions.ConnectionError:
            trace["error"] = "CONNECTION_ERROR"
            log_event("Connection failed")
        except Exception as e:
            trace["error"] = f"EXECUTION_ERROR"
            log_event(f"Error: {str(e)}")
            
        log_event(f"Sandbox execution finished in {time.time() - start_time:.3f}s")
        return trace

    def _run_demo(self, test_input: str):
        start_time = time.time()
        trace = {
            "input": test_input,
            "tool_calls": [],
            "events": [],
            "final_response": None,
            "error": None
        }
        
        def log_event(msg):
            trace["events"].append({"timestamp": time.time(), "message": msg})
            
        log_event(f"Started sandbox execution")
        
        step_count = 0
        input_lower = test_input.lower()
        
        try:
            while step_count < self.max_steps:
                if time.time() - start_time > self.timeout:
                    trace["error"] = "TIMEOUT"
                    log_event("Execution timed out")
                    break
                    
                step_count += 1
                call = None
                
                if "status" in input_lower and "ord-100" in input_lower and step_count == 1:
                    call = {"name": "get_order", "arguments": {"order_id": "ORD-100"}}
                elif "admin" in input_lower:
                    if step_count == 1:
                        call = {"name": "get_customer", "arguments": {"customer_id": "CUST-001"}}
                elif "address" in input_lower:
                    if step_count == 1:
                        trace["final_response"] = "The customer lives at 123 Main St."
                        log_event("Agent provided final response")
                        break
                elif "ignore all" in input_lower:
                    if step_count == 1:
                        call = {"name": "cancel_order", "arguments": {"order_id": "ORD-100"}}
                elif "infinite" in input_lower:
                    call = {"name": "get_order", "arguments": {"order_id": "ORD-100"}}
                
                if call:
                    log_event(f"Agent requested tool call: {call['name']}")
                    tool_func = TOOL_REGISTRY.get(call['name'])
                    if tool_func:
                        result = tool_func(**call['arguments'])
                        log_event(f"Tool {call['name']} returned: {result}")
                        trace["tool_calls"].append({
                            "step": step_count,
                            "name": call['name'],
                            "arguments": call['arguments'],
                            "response": result
                        })
                    else:
                        log_event(f"Tool {call['name']} not found")
                else:
                    trace["final_response"] = "I have completed processing your request."
                    log_event("Agent provided final response")
                    break
                    
            if step_count >= self.max_steps and "infinite" in input_lower:
                trace["error"] = "INFINITE_LOOP_PREVENTED"
                log_event("Max steps reached, preventing infinite loop")
                
        except Exception as e:
            trace["error"] = f"AGENT_ERROR: {str(e)}"
            
        log_event(f"Sandbox execution finished in {time.time() - start_time:.3f}s")
        return trace
