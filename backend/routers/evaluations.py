from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from database import get_db
from logger import logger
import models
import schemas
from core.sandbox import SandboxRunner
from core.evaluator import EvaluationEngine
from core.scoring import ScoringEngine

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])

@router.post("/run", response_model=schemas.Evaluation)
def run_evaluation(agent_id: int, db: Session = Depends(get_db)):
    logger.info(f"Triggering evaluation for agent {agent_id}")
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(404, "Agent not found")
        
    scenarios = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id).all()
    if not scenarios:
        raise HTTPException(400, "No scenarios generated for this agent. Please generate them first.")
        
    eval_run = models.Evaluation(agent_id=agent_id, status="RUNNING")
    db.add(eval_run)
    db.commit()
    db.refresh(eval_run)
    
    runner = SandboxRunner()
    eval_engine = EvaluationEngine()
    
    for sc in scenarios:
        trace_data = runner.run(agent, sc.user_input)
        exec_trace = models.ExecutionTrace(
            evaluation_id=eval_run.id,
            test_scenario_id=sc.id,
            status="ERROR" if trace_data.get("error") else "PASS",
            trace_data=trace_data
        )
        db.add(exec_trace)
        db.commit()
        db.refresh(exec_trace)
        
        failures = eval_engine.evaluate_trace(sc, trace_data, agent)
        if failures:
            exec_trace.status = "ERROR" if trace_data.get("error") else "FAIL"
            for f in failures:
                db_fail = models.Failure(
                    execution_id=exec_trace.id,
                    category=f["category"],
                    severity=f["severity"],
                    description=f.get("description", ""),
                    evidence=f.get("evidence", ""),
                    expected_behavior=f.get("expected_behavior", ""),
                    actual_behavior=f.get("actual_behavior", ""),
                    recommendation=f.get("recommendation", ""),
                    evaluation_method=f.get("evaluation_method", None),
                    confidence=f.get("confidence", None)
                )
                db.add(db_fail)
            db.commit()
            
    scoring_engine = ScoringEngine()
    scoring_engine.calculate_scores(db, eval_run.id)
    
    db.refresh(eval_run)
    return eval_run

@router.get("", response_model=List[schemas.Evaluation])
@router.get("/", response_model=List[schemas.Evaluation])
def get_all_evaluations(db: Session = Depends(get_db)):
    evals = db.query(models.Evaluation).order_by(models.Evaluation.id.desc()).all()
    return evals

@router.get("/{eval_id}", response_model=schemas.Evaluation)
def get_evaluation(eval_id: int, db: Session = Depends(get_db)):
    eval_run = db.query(models.Evaluation).filter(models.Evaluation.id == eval_id).first()
    if not eval_run:
        raise HTTPException(404, "Evaluation not found")
    return eval_run

@router.get("/agent/{agent_id}", response_model=List[schemas.Evaluation])
def get_evaluations_for_agent(agent_id: int, db: Session = Depends(get_db)):
    evals = db.query(models.Evaluation).filter(models.Evaluation.agent_id == agent_id).order_by(models.Evaluation.id.desc()).all()
    return evals

# Singular router alias for /api/evaluation/*
evaluation_singular_router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])

@evaluation_singular_router.post("/run", response_model=schemas.Evaluation)
def run_evaluation_singular(agent_id: int, db: Session = Depends(get_db)):
    return run_evaluation(agent_id=agent_id, db=db)

@evaluation_singular_router.get("/{eval_id}", response_model=schemas.Evaluation)
def get_evaluation_singular(eval_id: int, db: Session = Depends(get_db)):
    return get_evaluation(eval_id=eval_id, db=db)

# Traces router for /api/traces
traces_router = APIRouter(prefix="/api/traces", tags=["traces"])

@traces_router.get("", response_model=List[schemas.ExecutionTrace])
@traces_router.get("/", response_model=List[schemas.ExecutionTrace])
def get_all_traces(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    traces = db.query(models.ExecutionTrace).order_by(models.ExecutionTrace.id.desc()).offset(skip).limit(limit).all()
    return traces

@traces_router.get("/{trace_id}", response_model=schemas.ExecutionTrace)
def get_trace(trace_id: int, db: Session = Depends(get_db)):
    trace = db.query(models.ExecutionTrace).filter(models.ExecutionTrace.id == trace_id).first()
    if not trace:
        raise HTTPException(404, "Trace not found")
    return trace

# Reports router for /api/reports
reports_router = APIRouter(prefix="/api/reports", tags=["reports"])

@reports_router.get("/reliability")
@reports_router.get("")
@reports_router.get("/")
def get_reliability_report(eval_id: Optional[int] = None, db: Session = Depends(get_db)):
    if eval_id:
        eval_record = db.query(models.Evaluation).filter(models.Evaluation.id == eval_id).first()
    else:
        eval_record = db.query(models.Evaluation).order_by(models.Evaluation.id.desc()).first()
        
    if not eval_record:
        return {"status": "EMPTY", "message": "No evaluations completed yet."}
        
    failures = []
    for ex in eval_record.executions:
        for f in ex.failures:
            failures.append({
                "id": f.id,
                "execution_id": ex.id,
                "category": f.category,
                "severity": f.severity,
                "description": f.description,
                "evidence": f.evidence,
                "expected_behavior": f.expected_behavior,
                "actual_behavior": f.actual_behavior,
                "recommendation": f.recommendation,
                "evaluation_method": f.evaluation_method,
                "confidence": f.confidence
            })
            
    return {
        "evaluation_id": eval_record.id,
        "agent_id": eval_record.agent_id,
        "overall_score": eval_record.overall_score,
        "build_status": eval_record.build_status,
        "created_at": eval_record.created_at,
        "score_safety": eval_record.score_safety,
        "score_security": eval_record.score_security,
        "score_tool_reliability": eval_record.score_tool_reliability,
        "score_policy": eval_record.score_policy,
        "score_goal": eval_record.score_goal,
        "score_robustness": eval_record.score_robustness,
        "score_recovery": eval_record.score_recovery,
        "score_explanation": eval_record.score_explanation,
        "failures_count": len(failures),
        "failures": failures
    }
