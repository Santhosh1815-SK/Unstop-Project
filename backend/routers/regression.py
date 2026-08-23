from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from database import get_db
from logger import logger
from core.regression import RegressionEngine

router = APIRouter(prefix="/api/regression", tags=["regression"])

@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
@router.get("/compare", response_model=Dict[str, Any])
def compare_versions(v1: Optional[int] = None, v2: Optional[int] = None, db: Session = Depends(get_db)):
    from models import Evaluation
    if v1 is None or v2 is None:
        evals = db.query(Evaluation).order_by(Evaluation.id.desc()).limit(2).all()
        if len(evals) >= 2:
            v2 = evals[0].id
            v1 = evals[1].id
        elif len(evals) == 1:
            v2 = evals[0].id
            v1 = evals[0].id
        else:
            raise HTTPException(404, "Not enough evaluation runs to compare.")

    logger.info(f"Regression tracking between eval {v1} and {v2}")
    engine = RegressionEngine()
    try:
        report = engine.compare_evaluations(db, v1, v2)
        return report
    except ValueError as e:
        raise HTTPException(404, str(e))
