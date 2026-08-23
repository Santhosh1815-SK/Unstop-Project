from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(String, default="1.0")
    description = Column(String)
    system_prompt = Column(Text, nullable=True)
    policies = Column(JSON, nullable=True)
    
    # External API Support
    agent_type = Column(String, default="DEMO") # DEMO or EXTERNAL_API
    endpoint = Column(String, nullable=True)
    method = Column(String, default="POST")
    auth_type = Column(String, default="None")
    api_key = Column(String, nullable=True)
    request_template = Column(String, nullable=True)
    response_format = Column(String, nullable=True)
    headers = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tools = relationship("Tool", back_populates="agent", cascade="all, delete-orphan")
    test_scenarios = relationship("TestScenario", back_populates="agent", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="agent", cascade="all, delete-orphan")

class Tool(Base):
    __tablename__ = "tools"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    name = Column(String)
    description = Column(Text)
    schema_json = Column(JSON)

    agent = relationship("Agent", back_populates="tools")

class TestScenario(Base):
    __tablename__ = "test_scenarios"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    category = Column(String)
    severity = Column(String)
    user_input = Column(Text)
    expected_behavior = Column(Text)
    forbidden_behavior = Column(Text)
    evaluation_criteria = Column(Text)

    agent = relationship("Agent", back_populates="test_scenarios")

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    overall_score = Column(Float, nullable=True)
    score_safety = Column(Float, nullable=True)
    score_security = Column(Float, nullable=True)
    score_tool_reliability = Column(Float, nullable=True)
    score_policy = Column(Float, nullable=True)
    score_goal = Column(Float, nullable=True)
    score_robustness = Column(Float, nullable=True)
    score_recovery = Column(Float, nullable=True)
    score_explanation = Column(Text, nullable=True)
    status = Column(String)
    build_status = Column(String, default="BUILD_PASSED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="evaluations")
    executions = relationship("ExecutionTrace", back_populates="evaluation", cascade="all, delete-orphan")

class ExecutionTrace(Base):
    __tablename__ = "execution_traces"
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    test_scenario_id = Column(Integer, ForeignKey("test_scenarios.id"))
    status = Column(String)
    trace_data = Column(JSON)

    evaluation = relationship("Evaluation", back_populates="executions")
    failures = relationship("Failure", back_populates="execution", cascade="all, delete-orphan")

class Failure(Base):
    __tablename__ = "failures"
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("execution_traces.id"))
    category = Column(String)
    severity = Column(String)
    description = Column(Text)
    evidence = Column(Text)
    expected_behavior = Column(Text)
    actual_behavior = Column(Text)
    recommendation = Column(Text)
    evaluation_method = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    execution = relationship("ExecutionTrace", back_populates="failures")
