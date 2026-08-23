from database import SessionLocal
from core.demo_agent import seed_demo_agent
import models
from core.scenario_generator import ScenarioEngine
from schemas import Agent

if __name__ == "__main__":
    db = SessionLocal()
    seed_demo_agent(db)
    db_agent = db.query(models.Agent).filter(models.Agent.name == "Commerce Support Agent").first()
    
    agent_schema = Agent.model_validate(db_agent)
    
    engine = ScenarioEngine()
    print("Testing Scenario Engine for all 15 categories...\n")
    scenarios = engine.generate_suite(agent_schema)
    
    print(f"Generated {len(scenarios)} unique scenarios.")
    for s in scenarios:
        print(f"[{s.category}] ({s.severity}): {s.user_input}")
        
    db.close()
    print("\nPhase 3 test complete.")
