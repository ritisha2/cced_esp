"""
Field Validation API Routes for Operator/Engineer Audit Logging.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ml.evaluation.field_validation import field_validator

validation_router = APIRouter(prefix="/api/esp/validation", tags=["ESP Field Validation"])


class FieldAuditLogRequest(BaseModel):
    esp_id: str
    well_id: str
    predicted_fault: str
    actual_fault: str
    verification_status: str
    operator_notes: Optional[str] = ""
    downtime_saved_hours: Optional[float] = 0.0


@validation_router.post("/log")
async def log_field_audit(req: FieldAuditLogRequest):
    res = await field_validator.log_field_verification(
        esp_id=req.esp_id,
        well_id=req.well_id,
        predicted_fault=req.predicted_fault,
        actual_fault=req.actual_fault,
        verification_status=req.verification_status,
        operator_notes=req.operator_notes or "",
        downtime_saved_hours=req.downtime_saved_hours or 0.0
    )
    return res


@validation_router.get("/scorecard")
async def get_field_scorecard():
    scorecard = await field_validator.get_field_scorecard()
    return {"status": "success", "scorecard": scorecard}
