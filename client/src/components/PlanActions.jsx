import React from "react";

const PlanActions = ({ isCompleted, onNew, onArchive, onCancel }) => {
  if (isCompleted) {
    return (
      <>
        <button className="btn btn-success" onClick={onNew}>
          <i className="bi bi-plus-circle me-1"></i>
          Tạo kế hoạch mới
        </button>
        <button className="btn btn-outline-secondary" onClick={onArchive}>
          <i className="bi bi-archive me-1"></i>
          Lưu trữ kế hoạch
        </button>
      </>
    );
  } else {
    return (
      <button className="btn btn-danger" onClick={onCancel}>
        Hủy kế hoạch
      </button>
    );
  }
};

export default PlanActions;
