from database import SessionLocal
from core.demo_agent import seed_demo_agent, run_tests

if __name__ == "__main__":
    db = SessionLocal()
    seed_demo_agent(db)
    run_tests(db)
    db.close()
    print("Phase 2 test complete.")
