//hiển thị ngày trong nhật ký hàng ngày

import React from 'react';
import '../style/MyProgressPage.scss';

const DailyLogSection = ({ dailyLog, onUpdateLog }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  return (
    <>
      <div className="card-header bg-success text-white d-flex justify-content-between align-items-center p-3">
        <span>{formattedDate}</span>
      </div>
      
      <div className="card-body">
        <div className="daily-log-content">
          <h6 className="mb-3">Ghi chép hôm nay</h6>
          
          <div className="form-group mb-3">
            <label htmlFor="cigarettes">Số điếu hút hôm nay:</label>
            <input
              type="number"
              id="cigarettes"
              className="form-control"
              value={dailyLog.cigarettes || 0}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value) || 0);
                onUpdateLog({
                  ...dailyLog,
                  cigarettes: value
                });
              }}
              min="0"
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="feeling">Cảm nhận của bạn:</label>
            <textarea
              id="feeling"
              className="form-control"
              value={dailyLog.feeling || ''}
              onChange={(e) => onUpdateLog({
                ...dailyLog,
                feeling: e.target.value
              })}
              placeholder="Hãy chia sẻ cảm nhận của bạn về hôm nay..."
            />
          </div>

          <button
            className="btn btn-success"
            onClick={() => onUpdateLog(dailyLog)}
          >
            Cập nhật Nhật ký
          </button>
        </div>
      </div>
    </>
  );
};

export default DailyLogSection; 