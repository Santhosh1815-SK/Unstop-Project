from database import SessionLocal, engine
from core.demo_agent import seed_demo_agent
from core.evaluator import EvaluationEngine
from core.scoring import ScoringEngine
from models import Agent, TestScenario, ExecutionTrace, Failure, Evaluation, Base
import json

# Dummy data generator since we didn't hook up the full pipeline sequentially in the test script yet
def generate_mock_evaluation(db):
    agent = db.query(Agent).first()
    
    # Create evaluation run
    eval_run = Evaluation(agent_id=agent.id, status="RUNNING")
    db.add(eval_run)
    db.commit()
    db.refresh(eval_run)
    
    # Mock traces and failures to test Scoring Engine mathematically
    # 1. Trace with CRITICAL data leak
    t1 = ExecutionTrace(evaluation_id=eval_run.id, status="FAIL", trace_data={})
    db.add(t1)
    db.commit()
    db.add(Failure(execution_id=t1.id, category="DATA_LEAK", severity="CRITICAL", description="Leaked address"))
    
    # 2. Trace with HIGH policy violation and HIGH prompt injection
    t2 = ExecutionTrace(evaluation_id=eval_run.id, status="FAIL", trace_data={})
    db.add(t2)
    db.commit()
    db.add(Failure(execution_id=t2.id, category="POLICY_VIOLATION", severity="HIGH", description="Cancelled blindly"))
    db.add(Failure(execution_id=t2.id, category="PROMPT_INJECTION", severity="HIGH", description="Followed instructions"))
    
    # 3. Trace with LOW goal drift
    t3 = ExecutionTrace(evaluation_id=eval_run.id, status="FAIL", trace_data={})
    db.add(t3)
    db.commit()
    db.add(Failure(execution_id=t3.id, category="GOAL_DRIFT", severity="LOW", description="Told a joke"))
    
    db.commit()
    return eval_run.id

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_agent(db)
    
    eval_id = generate_mock_evaluation(db)
    
    engine_score = ScoringEngine()
    print("\n--- Running Risk & Scoring Engine ---")
    
    result = engine_score.calculate_scores(db, eval_id)
    
    print("\n[ Risk Prioritization ]")
    for sev, count in result["risk_profile"].items():
        if count > 0:
            print(f"  {sev}: {count} failures")
            
    print("\n[ Reliability Scores ]")
    for metric, score in result["scores"].items():
        if metric == "overall":
            print(f"  >> OVERALL SCORE: {score}/100")
        else:
            print(f"     - {metric.capitalize()}: {score}/100")
            
    print("\n[ Transparent Explanations ]")
    print(result["explanation"])
    
    db.close()
    print("\nPhase 5 test complete.")
