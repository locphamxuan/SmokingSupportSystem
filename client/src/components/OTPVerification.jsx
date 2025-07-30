import React, { useState } from "react";
import axios from "axios";

const OTPVerification = ({ email, onVerificationSuccess, onBack }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Start cooldown timer
  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post("/api/auth/verify-otp", {
        email,
        otp,
      });

      if (response.data.success) {
        setMessage("Xác thực thành công!");
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Xác thực OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post("/api/auth/send-otp", { email });

      if (response.data.success) {
        setMessage("Mã OTP mới đã được gửi đến email của bạn");
        startCooldown();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Gửi lại OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title text-center mb-4">Xác thực Email</h4>

          <div className="alert alert-info">
            <i className="fas fa-envelope"></i> Mã OTP đã được gửi đến:{" "}
            <strong>{email}</strong>
          </div>

          <form onSubmit={handleVerifyOTP}>
            <div className="mb-3">
              <label htmlFor="otp" className="form-label">
                Nhập mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                className="form-control text-center"
                id="otp"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                style={{ fontSize: "1.5rem", letterSpacing: "0.5rem" }}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle"></i> {error}
              </div>
            )}

            {message && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i> {message}
              </div>
            )}

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xác thực...
                  </>
                ) : (
                  "Xác thực OTP"
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleResendOTP}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Gửi lại sau ${resendCooldown}s`
                  : "Gửi lại mã OTP"}
              </button>

              <button
                type="button"
                className="btn btn-link"
                onClick={onBack}
                disabled={loading}
              >
                ← Quay lại
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
