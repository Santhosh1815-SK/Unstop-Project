from database import SessionLocal, engine
from models import Agent, TestScenario, ExecutionTrace, Failure, Evaluation, Base
from core.regression import RegressionEngine

def generate_mock_runs(db):
    # Agent v1.0
    a1 = Agent(name="Commerce Support", version="1.0", description="Old version")
    db.add(a1)
    # Agent v1.1
    a2 = Agent(name="Commerce Support", version="1.1", description="Fixed leak but new bug")
    db.add(a2)
    db.commit()
    
    # Scenarios (shared logically, we'll map them using dummy IDs 101, 102)
    
    # Run 1 (Original)
    e1 = Evaluation(agent_id=a1.id, overall_score=82.0, status="COMPLETED")
    db.add(e1)
    db.commit()
    
    # Scenario 101 (Data Leak - Critical)
    t1 = ExecutionTrace(evaluation_id=e1.id, test_scenario_id=101, status="FAIL")
    db.add(t1)
    # Scenario 102 (Goal Drift - Low)
    t2 = ExecutionTrace(evaluation_id=e1.id, test_scenario_id=102, status="FAIL")
    db.add(t2)
    db.commit()
    
    db.add(Failure(execution_id=t1.id, category="DATA_LEAK", severity="CRITICAL"))
    db.add(Failure(execution_id=t2.id, category="GOAL_DRIFT", severity="LOW"))
    
    # Run 2 (Replay / v1.1)
    e2 = Evaluation(agent_id=a2.id, overall_score=74.0, status="COMPLETED")
    db.add(e2)
    db.commit()
    
    # Scenario 101 (Data Leak is Fixed! No failure added)
    t3 = ExecutionTrace(evaluation_id=e2.id, test_scenario_id=101, status="PASS")
    db.add(t3)
    
    # Scenario 102 (Goal Drift - Persistent)
    t4 = ExecutionTrace(evaluation_id=e2.id, test_scenario_id=102, status="FAIL")
    db.add(t4)
    
    # Scenario 103 (New Bug introduced in v1.1: Missing Confirmation - Critical)
    t5 = ExecutionTrace(evaluation_id=e2.id, test_scenario_id=103, status="FAIL")
    db.add(t5)
    db.commit()
    
    db.add(Failure(execution_id=t4.id, category="GOAL_DRIFT", severity="LOW"))
    db.add(Failure(execution_id=t5.id, category="MISSING_CONFIRMATION", severity="CRITICAL"))
    
    db.commit()
    return e1.id, e2.id

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    e1_id, e2_id = generate_mock_runs(db)
    
    engine_reg = RegressionEngine()
    print("\n--- Running Regression Engine (v1.0 vs v1.1) ---")
    
    report = engine_reg.compare_evaluations(db, e1_id, e2_id)
    
    print(f"\nOriginal Run (v1.0) Score: {report['agent_v1_score']}/100")
    print(f"Replay Run   (v1.1) Score: {report['agent_v2_score']}/100")
    print(f"Score Difference: {'+' if report['score_difference']>0 else ''}{report['score_difference']}")
    if report["score_regression"]:
        print(">>> WARNING: OVERALL SCORE REGRESSION DETECTED <<<")
        
    print("\n[ Fixed Failures ]")
    for f in report["fixed_failures"]:
        print(f"  - Resolved {f['category']} in scenario {f['scenario']}")
        
    print("\n[ Persistent Failures ]")
    for f in report["persistent_failures"]:
        print(f"  - Unresolved {f['category']} in scenario {f['scenario']}")
        
    print("\n[ Newly Introduced Failures ]")
    for f in report["new_failures"]:
        print(f"  - REGRESSION: {f['category']} introduced in scenario {f['scenario']}")
        
    db.close()
    print("\nPhase 6 test complete.")
