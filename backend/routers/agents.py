from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from logger import logger
import models
import schemas
import requests
from urllib.parse import urlparse
import json
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.post("", response_model=schemas.Agent)
@router.post("/", response_model=schemas.Agent)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating agent: {agent.name}")
    db_agent = models.Agent(
        name=agent.name,
        description=agent.description,
        system_prompt=agent.system_prompt,
        policies=agent.policies,
        agent_type=agent.agent_type,
        endpoint=agent.endpoint,
        method=agent.method,
        auth_type=agent.auth_type,
        api_key=agent.api_key,
        request_template=agent.request_template,
        response_format=agent.response_format,
        headers=agent.headers
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)

    for tool in agent.tools:
        db_tool = models.Tool(
            agent_id=db_agent.id,
            name=tool.name,
            description=tool.description,
            schema_json=tool.schema_json
        )
        db.add(db_tool)
    
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("", response_model=list[schemas.Agent])
@router.get("/", response_model=list[schemas.Agent])
def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info("Fetching all agents")
    agents = db.query(models.Agent).offset(skip).limit(limit).all()
    return agents

@router.get("/{agent_id}", response_model=schemas.Agent)
def read_agent(agent_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching agent {agent_id}")
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if agent is None:
        logger.warning(f"Agent {agent_id} not found")
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

def extract_nested_key(data, path):
    if not path:
        return data
    parts = path.split(".")
    curr = data
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        elif isinstance(curr, list) and p.isdigit() and int(p) < len(curr):
            curr = curr[int(p)]
        else:
            return None
    return curr

class ConnectionTestRequest(BaseModel):
    endpoint: str
    method: str = "POST"
    auth_type: str = "None"
    api_key: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    request_template: Optional[str] = None
    response_format: Optional[str] = None
    test_input: str = "Hello, how can you help me?"

@router.post("/test-connection")
def test_connection(req: ConnectionTestRequest):
    parsed = urlparse(req.endpoint)
    if parsed.scheme not in ["http", "https"]:
        return {"status": "FAILED", "reason": "Invalid scheme. Must be http or https"}
    
    headers = req.headers or {}
    if req.auth_type == "Bearer" and req.api_key:
        headers["Authorization"] = f"Bearer {req.api_key}"
    elif req.auth_type == "ApiKey" and req.api_key:
        headers["X-API-Key"] = req.api_key

    payload = None
    if req.request_template:
        try:
            payload_str = req.request_template.replace("{{user_input}}", req.test_input)
            payload = json.loads(payload_str)
        except Exception as e:
            return {"status": "FAILED", "reason": f"Invalid request template: {str(e)}"}
            
    try:
        if req.method.upper() == "POST":
            res = requests.post(req.endpoint, json=payload, headers=headers, timeout=5.0)
        else:
            res = requests.get(req.endpoint, headers=headers, timeout=5.0)
            
        if res.status_code in [401, 403]:
            return {"status": "UNAUTHORIZED", "status_code": res.status_code, "response": res.text[:200]}
            
        if res.status_code >= 400:
            return {"status": "INVALID_RESPONSE", "status_code": res.status_code, "response": res.text[:200]}

        # Extract response using the configured key
        response_preview = res.text[:200]
        if req.response_format:
            try:
                response_json = res.json()
                extracted = extract_nested_key(response_json, req.response_format)
                if extracted is None and isinstance(response_json, dict) and req.response_format in response_json:
                    extracted = response_json[req.response_format]
                if extracted is not None:
                    response_preview = json.dumps(extracted) if not isinstance(extracted, str) else extracted
                    response_preview = response_preview[:200]
            except Exception:
                pass  # Fall back to raw text if JSON parsing or extraction fails

        return {"status": "CONNECTED", "status_code": res.status_code, "response": response_preview}
        
    except requests.exceptions.Timeout:
        return {"status": "TIMEOUT", "reason": "Connection timed out after 5 seconds"}
    except Exception as e:
        return {"status": "FAILED", "reason": str(e)}

@router.post("/{agent_id}/test-connection")
def test_agent_connection(agent_id: int, req: Optional[ConnectionTestRequest] = None, db: Session = Depends(get_db)):
    if req and req.endpoint:
        return test_connection(req)
    
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    if agent.agent_type != "EXTERNAL_API" or not agent.endpoint:
        return {"status": "CONNECTED", "status_code": 200, "response": "Internal Demo Agent ready."}

    req_obj = ConnectionTestRequest(
        endpoint=agent.endpoint,
        method=agent.method or "POST",
        auth_type=agent.auth_type or "None",
        api_key=agent.api_key,
        headers=agent.headers,
        request_template=agent.request_template,
        response_format=agent.response_format,
        test_input="Hello, how can you help me?"
    )
    return test_connection(req_obj)
