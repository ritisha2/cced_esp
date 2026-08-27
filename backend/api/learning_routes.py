"""
Continuous Learning, Verified Field Feedback & Model Governance API Routes.
Provides REST endpoints for field ground truth logging, quarantine lifecycle,
retraining triggers, Champion/Challenger evaluation, promotion, rollback, and trends.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from ml.learning.ground_truth_service import ground_truth_service
from ml.learning.candidate_pipeline import candidate_pipeline
from ml.learning.continuous_trainer import continuous_trainer
from backend.database_ml import ml_db

learning_router = APIRouter(prefix="/api/esp/learning", tags=["ESP Continuous Learning & Feedback"])


class GroundTruthRequest(BaseModel):
    asset_id: str = Field(..., example="FS-010")
    well_id: str = Field(..., example="WELL-010")
    fault_type: str = Field(..., example="DRY_WELL_PUMP_OFF")
    confirmation_status: str = Field("CONFIRMED", example="CONFIRMED") # UNVERIFIED, CONFIRMED, FALSE_ALARM, REJECTED, UNKNOWN
    event_start: Optional[str] = Field(None, example="2026-08-25T10:00:00Z")
    event_end: Optional[str] = None
    operator_note: str = ""
    maintenance_action: str = ""
    source: str = "OPERATOR_FIELD"


class RetrainRequest(BaseModel):
    candidate_version_tag: str = Field(..., example="fault_classifier_v1.1_candidate")
    dataset_version: str = Field("v1.1", example="v1.1")


class PromoteRequest(BaseModel):
    training_run_id: str = Field(..., example="RUN-A1B2C3D4")
    approved_by: str = Field("ML_ENGINEER", example="ML_ENGINEER")


class RollbackRequest(BaseModel):
    reason: str = Field("Field validation regression observed", example="Field validation regression observed")


# --- 1. Ground Truth & Field Feedback ---

@learning_router.post("/ground-truth")
async def record_ground_truth(req: GroundTruthRequest):
    """Record operator verified field outcome or false alarm."""
    res = await ground_truth_service.record_field_outcome(
        asset_id=req.asset_id,
        well_id=req.well_id,
        fault_type=req.fault_type,
        confirmation_status=req.confirmation_status,
        event_start=req.event_start,
        event_end=req.event_end,
        operator_note=req.operator_note,
        maintenance_action=req.maintenance_action,
        source=req.source
    )
    # If confirmed, automatically ingest matching raw telemetry into QUARANTINED state
    if req.confirmation_status.upper() == "CONFIRMED":
        await candidate_pipeline.ingest_field_event_as_candidates(
            ground_truth_id=res["ground_truth_id"],
            asset_id=req.asset_id,
            well_id=req.well_id,
            event_start=req.event_start or "",
            event_end=req.event_end,
            verified_label=req.fault_type
        )
    return res


@learning_router.get("/ground-truth")
async def list_ground_truth(status: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    """List historical field ground truth records."""
    records = await ml_db.get_ground_truth(status=status, limit=limit)
    return {"count": len(records), "records": records}


# --- 2. Training Candidate Quarantine Queue ---

@learning_router.get("/candidates")
async def get_candidate_queue(state: Optional[str] = None):
    """List training candidates in QUARANTINED, VALIDATED, or TRAINING_READY state."""
    candidates = await ml_db.get_training_candidates(state=state)
    summary = {
        "QUARANTINED": len([c for c in candidates if c["lifecycle_state"] == "QUARANTINED"]),
        "VALIDATED": len([c for c in candidates if c["lifecycle_state"] == "VALIDATED"]),
        "TRAINING_READY": len([c for c in candidates if c["lifecycle_state"] == "TRAINING_READY"]),
        "USED_IN_TRAINING": len([c for c in candidates if c["lifecycle_state"] == "USED_IN_TRAINING"]),
    }
    return {"summary": summary, "candidates": candidates}


@learning_router.post("/quarantine/advance")
async def advance_quarantine(ground_truth_id: str = Body(..., embed=True)):
    """Advance quarantined candidates for a confirmed event through quality and leakage gates."""
    res = await candidate_pipeline.advance_quarantine_batch(ground_truth_id)
    return res


@learning_router.post("/dataset/compile")
async def compile_dataset(version_tag: str = Body(..., embed=True)):
    """Compile all current TRAINING_READY candidates into a versioned learning dataset."""
    res = await candidate_pipeline.compile_continuous_dataset(version_tag)
    return res


@learning_router.get("/datasets")
async def list_datasets():
    """List all versioned continuous learning datasets."""
    datasets = await ml_db.get_dataset_versions()
    return {"count": len(datasets), "datasets": datasets}


# --- 3. Retraining Triggers & Candidate Training ---

@learning_router.get("/retrain/triggers")
async def check_retrain_triggers():
    """Evaluate whether verified field data meets configured retraining thresholds."""
    return await continuous_trainer.evaluate_retraining_triggers()


@learning_router.post("/retrain")
async def train_candidate_model(req: RetrainRequest):
    """Trigger training and evaluation of a challenger model on candidate dataset."""
    res = await continuous_trainer.train_candidate_model(
        candidate_version_tag=req.candidate_version_tag,
        dataset_version=req.dataset_version
    )
    return res


# --- 4. Champion / Challenger Governance, Promotion & Rollback ---

@learning_router.get("/models")
async def get_models_status():
    """Retrieve active Champion, active Challenger, and training governance run history."""
    runs = await ml_db.get_training_runs(limit=20)
    return {
        "current_champion": continuous_trainer.current_champion,
        "active_challenger": continuous_trainer.active_challenger,
        "rollback_available": len(continuous_trainer.previous_champions) > 0,
        "previous_champions": continuous_trainer.previous_champions,
        "training_runs": runs
    }


@learning_router.post("/promote")
async def promote_candidate(req: PromoteRequest):
    """Promote an evaluated candidate model to active Champion."""
    res = await continuous_trainer.promote_candidate_to_champion(
        training_run_id=req.training_run_id,
        operator_approved_by=req.approved_by
    )
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("reason"))
    return res


@learning_router.post("/rollback")
async def rollback_champion(req: RollbackRequest):
    """Roll back active Champion to previous verified production model artifact."""
    res = await continuous_trainer.rollback_to_previous_champion(reason=req.reason)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("reason"))
    return res


# --- 5. Self-Improvement Metrics Trends & 13-Fault Progression ---

@learning_router.get("/13-fault-progression")
async def get_13_fault_progression():
    """Live 13-fault learning progression and field readiness matrix."""
    matrix = await continuous_trainer.get_13_fault_learning_progression()
    return {"matrix": matrix}


@learning_router.get("/validation-scorecard")
async def get_validation_scorecard():
    """Real field outcome validation scorecard."""
    return await ground_truth_service.get_validation_summary()


@learning_router.get("/metrics-trend")
async def get_metrics_trend():
    """Historical self-improvement progression over model versions loaded from real artifacts and runs."""
    import json
    from pathlib import Path
    trend = []
    
    # 1. Baseline from actual training report
    rep_path = Path(__file__).resolve().parent.parent.parent / "models" / "fault_classifier" / "v1.0" / "training_report.json"
    if rep_path.exists():
        try:
            with open(rep_path, "r", encoding="utf-8") as f:
                rep = json.load(f)
            m = rep.get("metrics", {})
            train_s = rep.get("train_samples", 0)
            test_s = rep.get("test_samples", 0)
            trend.append({
                "version": f"{rep.get('version', 'v1.0')} (Baseline)",
                "dataset_version": "dataset_v1.0",
                "samples": train_s + test_s,
                "macro_f1": round(m.get("macro_f1", 0.0), 4),
                "accuracy": round(m.get("accuracy", 0.0), 4),
                "false_alarm_rate": round(1.0 - m.get("per_class_metrics", {}).get("HEALTHY", {}).get("precision", 1.0), 4),
                "timestamp": rep.get("created_at", "")
            })
        except Exception as e:
            logger.error(f"Error reading baseline training report: {e}")

    # 2. Candidate training runs from SQLite
    runs = await ml_db.get_training_runs()
    for r in runs:
        m_after = r.get("metrics_after", {})
        trend.append({
            "version": f"{r.get('candidate_version', 'Candidate')} ({r.get('state', 'TRAINED')})",
            "dataset_version": r.get("dataset_version", "unknown"),
            "samples": r.get("training_samples", 0),
            "macro_f1": round(m_after.get("macro_f1", 0.0), 4),
            "accuracy": round(m_after.get("accuracy", 0.0), 4),
            "false_alarm_rate": round(m_after.get("false_alarm_rate", 0.0), 4),
            "timestamp": r.get("training_timestamp", "")
        })

    return {"metric_trends": trend}
