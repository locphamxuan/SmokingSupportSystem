import React, { useState } from "react";
import { quitPlanAPI } from "../services/api";

const QuitPlanStage = ({ stage, userStageId, onStageComplete }) => {
  const [showCriteriaMessage, setShowCriteriaMessage] = useState(false);

  const handleCompleteStage = async () => {
    try {
      console.log(
        "QuitPlanStage - handleCompleteStage called with userStageId:",
        userStageId,
      );
      console.log("QuitPlanStage - stage object:", stage);

      if (!userStageId) {
        console.error("userStageId is undefined or null");
        setShowCriteriaMessage(true);
        return;
      }

      // Call the API to complete the stage
      await quitPlanAPI.completeStage(userStageId);

      // Call the callback to refresh UI
      if (onStageComplete) {
        onStageComplete(userStageId);
      }
    } catch (error) {
      setShowCriteriaMessage(true);
      console.error("Error completing stage:", error);
    }
  };

  const getStageStatusColor = () => {
    if (stage.Status === "completed" || stage.Status === "Completed")
      return "#28a745"; // Green
    if (stage.Status === "in_progress" || stage.Status === "In Progress")
      return "#ffc107"; // Yellow
    return "#6c757d"; // Grey
  };

  return (
    <div
      className="quit-plan-stage card mb-4"
      style={{ borderLeft: `5px solid ${getStageStatusColor()}` }}
    >
      <div
        className="card-header"
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1" style={{ color: "#343a40" }}>
              {stage.StageName}
              {stage.StageOrder && (
                <span
                  className="badge ms-2"
                  style={{
                    backgroundColor: getStageStatusColor(),
                    color: "white",
                  }}
                >
                  Giai đoạn {stage.StageOrder}
                </span>
              )}
              <span className="badge bg-secondary ms-2">
                {stage.Status === "Completed" ? "Hoàn thành" : "Đang thực hiện"}
              </span>
            </h5>
            <p className="text-muted mb-0">{stage.Objective}</p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {stage.Description && (
          <div className="mb-3">
            <small className="text-muted">{stage.Description}</small>
          </div>
        )}

        {/* Display custom stage data if available */}
        {(stage.StartDate || stage.EndDate) && (
          <div className="mb-3 p-2 rounded bg-light border">
            <div className="row">
              <div className="col">
                <small className="text-muted d-block">Bắt đầu giai đoạn</small>
                <strong>
                  {new Date(stage.StartDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
              <div className="col">
                <small className="text-muted d-block">Kết thúc giai đoạn</small>
                <strong>
                  {new Date(stage.EndDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
            </div>
          </div>
        )}

        {stage.InitialCigarettes !== null &&
          typeof stage.InitialCigarettes !== "undefined" && (
            <div className="mb-3 p-2 rounded bg-light border">
              <small className="text-muted d-block">Mục tiêu giảm thuốc</small>
              <div className="d-flex align-items-center">
                <span className="badge bg-secondary fs-6">
                  {stage.InitialCigarettes} điếu
                </span>
                <i className="bi bi-arrow-right mx-2"></i>
                <span className="badge bg-success fs-6">
                  {stage.TargetCigarettes} điếu
                </span>
              </div>
            </div>
          )}
      </div>

      {(stage.Status === "in_progress" || stage.Status === "In Progress") && (
        <div className="card-footer text-end">
          {showCriteriaMessage && (
            <div className="alert alert-warning">
              Chưa đạt đủ điều kiện để qua giai đoạn.
            </div>
          )}
          <button
            className="btn btn-success"
            onClick={handleCompleteStage}
            disabled={
              stage.Status !== "in_progress" && stage.Status !== "In Progress"
            }
          >
            Hoàn thành giai đoạn
          </button>
        </div>
      )}
    </div>
  );
};

export default QuitPlanStage;
