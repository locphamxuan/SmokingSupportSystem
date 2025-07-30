import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { quitPlanAPI } from "../services/api";

const CreatePlanPage = () => {
  const [plan, setPlan] = useState({
    planName: "",
    startDate: "",
    targetDate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPlan({ ...plan, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await quitPlanAPI.createPlan(plan);
      setSuccess("Kế hoạch đã được tạo thành công!");
      setTimeout(() => navigate("/my-progress"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Tạo kế hoạch thất bại.");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Tạo kế hoạch cai thuốc mới</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="planName" className="form-label">
            Tên kế hoạch
          </label>
          <input
            type="text"
            className="form-control"
            id="planName"
            name="planName"
            value={plan.planName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="startDate" className="form-label">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            className="form-control"
            id="startDate"
            name="startDate"
            value={plan.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="targetDate" className="form-label">
            Ngày kết thúc
          </label>
          <input
            type="date"
            className="form-control"
            id="targetDate"
            name="targetDate"
            value={plan.targetDate}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Tạo kế hoạch
        </button>
      </form>
    </div>
  );
};

export default CreatePlanPage;
