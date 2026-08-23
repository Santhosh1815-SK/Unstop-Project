from models import Evaluation, Failure
from logger import logger

class RegressionEngine:
    def compare_evaluations(self, db, original_eval_id: int, replay_eval_id: int):
        logger.info(f"Comparing Evaluation {original_eval_id} vs Replay {replay_eval_id}")
        
        eval_1 = db.query(Evaluation).filter(Evaluation.id == original_eval_id).first()
        eval_2 = db.query(Evaluation).filter(Evaluation.id == replay_eval_id).first()
        
        if not eval_1 or not eval_2:
            raise ValueError("Evaluations not found")
            
        failures_1 = db.query(Failure).join(Failure.execution).filter(Failure.execution.has(evaluation_id=original_eval_id)).all()
        failures_2 = db.query(Failure).join(Failure.execution).filter(Failure.execution.has(evaluation_id=replay_eval_id)).all()
        
        def map_failures(failures):
            f_map = {}
            for f in failures:
                scen_id = f.execution.test_scenario_id
                key = f"{scen_id}:{f.category}"
                f_map[key] = f
            return f_map
            
        map_1 = map_failures(failures_1)
        map_2 = map_failures(failures_2)
        
        fixed_failures = []
        new_failures = []
        persistent_failures = []
        
        for key, f in map_1.items():
            if key not in map_2:
                fixed_failures.append(f)
            else:
                persistent_failures.append(f)
                
        for key, f in map_2.items():
            if key not in map_1:
                new_failures.append(f)
                
        score_diff = eval_2.overall_score - eval_1.overall_score
        
        report = {
            "agent_v1_score": eval_1.overall_score,
            "agent_v2_score": eval_2.overall_score,
            "score_regression": score_diff < 0,
            "score_difference": round(score_diff, 2),
            "fixed_failures": [{"scenario": f.execution.test_scenario_id, "category": f.category} for f in fixed_failures],
            "new_failures": [{"scenario": f.execution.test_scenario_id, "category": f.category} for f in new_failures],
            "persistent_failures": [{"scenario": f.execution.test_scenario_id, "category": f.category} for f in persistent_failures]
        }
        
        return report
