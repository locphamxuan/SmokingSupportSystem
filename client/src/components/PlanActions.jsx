import React from "react";

const PlanActions = ({ isCompleted, onNew, onCancel }) => {
  if (isCompleted) {
    return (
      <button className="btn btn-success" onClick={onNew}>
        <i className="bi bi-plus-circle me-1"></i>
        Tạo kế hoạch mới
      </button>
    );
  } else {
    return onCancel ? (
      <button className="btn btn-danger" onClick={onCancel}>
        Hủy kế hoạch
      </button>
    ) : null;
  }
};

export default PlanActions;
