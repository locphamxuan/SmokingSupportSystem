//hiển thị ngày trong nhật ký hàng ngày

import React, { useState, useMemo } from "react";
import "../style/MyProgressPage.scss";

const DailyLogSection = ({ dailyLog, onUpdateLog }) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    [],
  );

  const [localLog, setLocalLog] = useState(() => ({
    cigarettes: dailyLog?.cigarettes || 0,
    feeling: dailyLog?.feeling || "",
    date: todayStr,
  }));

  const handleUpdate = () => {
    console.log("[DailyLogSection] Gọi onUpdateLog với:", {
      ...localLog,
      date: todayStr,
    });
    onUpdateLog({
      ...localLog,
      date: todayStr,
    });
  };

  const handleReset = () => {
    setLocalLog({
      cigarettes: 0,
      feeling: "",
      date: todayStr,
    });
  };

  return (
    <>
      <div className="daily-log-content">
        <h6 className="mb-3">Ghi chép hôm nay - {formattedDate}</h6>

        <div className="form-group mb-3">
          <label htmlFor="cigarettes" className="form-label">
            Số điếu hút hôm nay:
          </label>
          <input
            type="number"
            id="cigarettes"
            className="form-control"
            value={localLog.cigarettes}
            onChange={(e) => {
              const value = Math.max(0, parseInt(e.target.value) || 0);
              setLocalLog((prev) => ({
                ...prev,
                cigarettes: value,
              }));
            }}
            min="0"
            placeholder="Nhập số điếu đã hút..."
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="feeling" className="form-label">
            Cảm nhận của bạn:
          </label>
          <textarea
            id="feeling"
            className="form-control"
            value={localLog.feeling}
            onChange={(e) =>
              setLocalLog((prev) => ({
                ...prev,
                feeling: e.target.value,
              }))
            }
            placeholder="Hãy chia sẻ cảm nhận của bạn về hôm nay..."
            rows="3"
          />
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={handleUpdate}>
            <i className="fas fa-save me-2"></i>
            Cập nhật Nhật ký
          </button>
          <button className="btn btn-outline-secondary" onClick={handleReset}>
            <i className="fas fa-refresh me-2"></i>
            Làm mới
          </button>
        </div>
      </div>
    </>
  );
};

export default DailyLogSection;
