from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class ToolBase(BaseModel):
    name: str
    description: str
    schema_json: Dict[str, Any]

class ToolCreate(ToolBase):
    pass

class Tool(ToolBase):
    id: int
    agent_id: int
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class AgentBase(BaseModel):
    name: str
    version: str = "1.0"
    description: str
    system_prompt: Optional[str] = None
    policies: List[str] = []
    
    # External Agent fields
    agent_type: str = "DEMO"
    endpoint: Optional[str] = None
    method: str = "POST"
    auth_type: str = "None"
    request_template: Optional[str] = None
    response_format: Optional[str] = None
    headers: Optional[Dict[str, str]] = None

class AgentCreate(AgentBase):
    tools: List[ToolCreate] = []
    api_key: Optional[str] = None

class Agent(AgentBase):
    id: int
    created_at: datetime
    tools: List[Tool] = []
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class FailureBase(BaseModel):
    category: str
    severity: str
    description: str
    evidence: str
    expected_behavior: str
    actual_behavior: str
    recommendation: str

class TestScenarioBase(BaseModel):
    category: str
    severity: str
    user_input: str
    expected_behavior: Optional[str] = None
    forbidden_behavior: Optional[str] = None
    evaluation_criteria: Optional[str] = None

class ScenarioGenerationRequest(BaseModel):
    categories: List[str] = []
    count: int = 10
    severity: str = "ALL"
    adversarial_testing: bool = True
    destructive_action_testing: bool = True
    prompt_injection_testing: bool = True
    tool_misuse_testing: bool = True
    data_leakage_testing: bool = True

class GeneratedScenario(TestScenarioBase):
    test_id: str
    tools_allowed: List[str] = []
    tools_forbidden: List[str] = []

class ScenarioGenerationResponse(BaseModel):
    scenarios: List[GeneratedScenario]

class TestScenarioCreate(TestScenarioBase):
    pass

class TestScenarioUpdate(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    user_input: Optional[str] = None
    expected_behavior: Optional[str] = None
    forbidden_behavior: Optional[str] = None
    evaluation_criteria: Optional[str] = None

class TestScenario(TestScenarioBase):
    id: int
    agent_id: int
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class FailureBase(BaseModel):
    category: str
    severity: str
    description: str
    evidence: str
    expected_behavior: str
    actual_behavior: str
    recommendation: str
    evaluation_method: Optional[str] = None
    confidence: Optional[float] = None

class Failure(FailureBase):
    id: int
    execution_id: int
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class ExecutionTraceBase(BaseModel):
    evaluation_id: Optional[int]
    test_scenario_id: Optional[int]
    status: str
    trace_data: Dict[str, Any]

class ExecutionTrace(ExecutionTraceBase):
    id: int
    failures: List[Failure] = []
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class EvaluationBase(BaseModel):
    agent_id: int
    status: str

class Evaluation(EvaluationBase):
    id: int
    overall_score: Optional[float]
    score_safety: Optional[float]
    score_security: Optional[float]
    score_tool_reliability: Optional[float]
    score_policy: Optional[float]
    score_goal: Optional[float]
    score_robustness: Optional[float]
    score_recovery: Optional[float]
    score_explanation: Optional[str]
    build_status: Optional[str] = "BUILD_PASSED"
    created_at: datetime
    executions: List[ExecutionTrace] = []
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
