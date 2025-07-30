import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import qrVietQR from "../assets/images/mãQRTPBank.jpg";
import qrMomo from "../assets/images/mãQRMomo.jpg";
import "../style/PaymentPage.scss";
import axios from "axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId =
    location.state?.bookingId ||
    new URLSearchParams(window.location.search).get("bookingId");
  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: "momo",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    // Không cần validate gì đặc biệt nữa
    setError("");
    return true;
  };

  const handlePaymentSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/pay`,
        {
          paymentMethod: paymentInfo.paymentMethod,
          amount: 69000, // 69.000đ cho mỗi lần đặt lịch
          transactionId: "",
          note: "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      navigate("/booking", { replace: true });
    } catch (error) {
      setError(
        "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodFields = () => {
    switch (paymentInfo.paymentMethod) {
      case "momo":
        return (
          <div className="text-center mt-3">
            <h5 className="fw-bold mb-1">PHẠM XUÂN LỘC</h5>
            <div className="mb-2">
              Số điện thoại: <b>0862317046</b>
            </div>
            <div className="d-inline-block p-2 bg-white rounded-3 shadow mb-3">
              <img
                src={qrMomo}
                alt="QR MoMo"
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "contain",
                  borderRadius: 8,
                  display: "block",
                }}
              />
            </div>
            <div className="mt-2 text-start mx-auto" style={{ maxWidth: 320 }}>
              <b>Hướng dẫn:</b> Quét mã QR bằng app MoMo hoặc ngân hàng hỗ trợ
              VietQR.
              <br />
              <b>Nội dung chuyển khoản:</b>{" "}
              <span className="text-primary">[Họ tên hoặc số điện thoại]</span>
            </div>
          </div>
        );
      case "vnpay":
        return (
          <div className="text-center mt-3">
            <h5 className="fw-bold mb-1">PHẠM XUÂN LỘC</h5>
            <div className="mb-2">
              Số tài khoản: <b>3170 4624 549</b>
              <br />
              Ngân hàng: <b>TPBank</b>
            </div>
            <div className="d-inline-block p-2 bg-white rounded-3 shadow mb-3">
              <img
                src={qrVietQR}
                alt="VNPay TPBank"
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "contain",
                  borderRadius: 8,
                  display: "block",
                }}
              />
            </div>
            <div className="mt-2 text-start mx-auto" style={{ maxWidth: 320 }}>
              <b>Hướng dẫn:</b> Quét mã QR bằng app ngân hàng hỗ trợ
              VNPay/VietQR.
              <br />
              <b>Nội dung chuyển khoản:</b>{" "}
              <span className="text-primary">[Họ tên hoặc số điện thoại]</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card payment-form-box w-100" style={{ maxWidth: 420 }}>
        <div className="card-body">
          <h4 className="payment-title mb-3 text-center">
            Thanh toán lịch hẹn
          </h4>
          <div className="text-center mb-3">
            <span className="fw-bold text-primary">
              Số tiền cần thanh toán:{" "}
              <span className="text-danger">69.000&nbsp;₫</span>
            </span>
          </div>
          <div className="mb-3">
            <label htmlFor="paymentMethod" className="form-label">
              Phương thức thanh toán
            </label>
            <select
              className="form-select"
              id="paymentMethod"
              name="paymentMethod"
              value={paymentInfo.paymentMethod}
              onChange={handlePaymentInfoChange}
            >
              <option value="momo">Ví MoMo</option>
              <option value="vnpay">VNPay</option>
            </select>
          </div>
          {renderPaymentMethodFields()}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          <button
            className="btn btn-primary w-100 mt-4"
            onClick={handlePaymentSubmit}
            disabled={loading}
            type="button"
          >
            {loading
              ? "Đang xử lý..."
              : paymentInfo.paymentMethod === "vnpay"
                ? "Tôi đã chuyển khoản"
                : "Thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
