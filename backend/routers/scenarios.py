from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from logger import logger
import models
import schemas
from core.scenario_generator import ScenarioEngine

router = APIRouter(prefix="/api/agents/{agent_id}/scenarios", tags=["scenarios"])

@router.post("/generate", response_model=List[schemas.TestScenario])
def generate_scenarios(agent_id: int, request: schemas.ScenarioGenerationRequest = schemas.ScenarioGenerationRequest(), db: Session = Depends(get_db)):
    logger.info(f"Generating scenarios for agent {agent_id}")
    
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    agent_schema = schemas.Agent.model_validate(db_agent)
    
    engine = ScenarioEngine()
    try:
        generated = engine.generate_suite(agent_schema, request)
    except Exception as e:
        logger.error(f"Error generating scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate scenarios: {str(e)}")
    
    saved_scenarios = []
    for sc in generated:
        db_sc = models.TestScenario(
            agent_id=agent_id,
            category=sc.category,
            severity=sc.severity,
            user_input=sc.user_input,
            expected_behavior=sc.expected_behavior,
            forbidden_behavior=sc.forbidden_behavior,
            evaluation_criteria=sc.evaluation_criteria
        )
        db.add(db_sc)
        saved_scenarios.append(db_sc)
        
    db.commit()
    for sc in saved_scenarios:
        db.refresh(sc)
    logger.info(f"Generated and saved {len(saved_scenarios)} scenarios.")
    
    return saved_scenarios

@router.get("", response_model=List[schemas.TestScenario])
@router.get("/", response_model=List[schemas.TestScenario])
def get_scenarios(agent_id: int, db: Session = Depends(get_db)):
    scenarios = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id).all()
    return scenarios

@router.put("/{scenario_id}", response_model=schemas.TestScenario)
def update_scenario(agent_id: int, scenario_id: int, scenario_in: schemas.TestScenarioUpdate, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id, models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    update_data = scenario_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sc, key, value)
        
    db.commit()
    db.refresh(db_sc)
    return db_sc

@router.delete("/{scenario_id}")
def delete_scenario(agent_id: int, scenario_id: int, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id, models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    db.delete(db_sc)
    db.commit()
    return {"detail": "Scenario deleted"}

@router.post("/{scenario_id}/regenerate", response_model=schemas.TestScenario)
def regenerate_scenario(agent_id: int, scenario_id: int, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id, models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    agent_schema = schemas.Agent.model_validate(db_agent)
    
    req = schemas.ScenarioGenerationRequest(
        categories=[db_sc.category],
        count=1,
        severity=db_sc.severity
    )
    
    engine = ScenarioEngine()
    try:
        generated = engine.generate_suite(agent_schema, req)
        if not generated:
            raise Exception("No scenario generated")
        new_sc = generated[0]
    except Exception as e:
        logger.error(f"Error regenerating scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate scenario: {str(e)}")
        
    db_sc.user_input = new_sc.user_input
    db_sc.expected_behavior = new_sc.expected_behavior
    db_sc.forbidden_behavior = new_sc.forbidden_behavior
    db_sc.evaluation_criteria = new_sc.evaluation_criteria
    db_sc.severity = new_sc.severity
    
    db.commit()
    db.refresh(db_sc)
    
    return db_sc

@router.post("/{scenario_id}/replay")
def replay_scenario(agent_id: int, scenario_id: int, db: Session = Depends(get_db)):
    logger.info(f"Replaying scenario {scenario_id} for agent {agent_id}")
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.agent_id == agent_id, models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    from core.sandbox import SandboxRunner
    from core.evaluator import EvaluationEngine
    
    runner = SandboxRunner()
    eval_engine = EvaluationEngine()
    
    # Execute scenario in sandbox
    new_trace_data = runner.run(db_agent, db_sc.user_input)
    failures = eval_engine.evaluate_trace(db_sc, new_trace_data, db_agent)
    
    status = "ERROR" if new_trace_data.get("error") else ("FAIL" if failures else "PASS")
    
    return {
        "scenario_id": scenario_id,
        "category": db_sc.category,
        "severity": db_sc.severity,
        "user_input": db_sc.user_input,
        "expected_behavior": db_sc.expected_behavior,
        "status": status,
        "trace_data": new_trace_data,
        "failures": failures
    }

top_router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

@top_router.put("/{scenario_id}", response_model=schemas.TestScenario)
def update_scenario_direct(scenario_id: int, scenario_in: schemas.TestScenarioUpdate, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    update_data = scenario_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sc, key, value)
        
    db.commit()
    db.refresh(db_sc)
    return db_sc

@top_router.delete("/{scenario_id}")
def delete_scenario_direct(scenario_id: int, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    db.delete(db_sc)
    db.commit()
    return {"detail": "Scenario deleted"}

@top_router.post("/{scenario_id}/regenerate", response_model=schemas.TestScenario)
def regenerate_scenario_direct(scenario_id: int, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return regenerate_scenario(db_sc.agent_id, scenario_id, db)

@top_router.post("/{scenario_id}/replay")
def replay_scenario_direct(scenario_id: int, db: Session = Depends(get_db)):
    db_sc = db.query(models.TestScenario).filter(models.TestScenario.id == scenario_id).first()
    if not db_sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return replay_scenario(db_sc.agent_id, scenario_id, db)
