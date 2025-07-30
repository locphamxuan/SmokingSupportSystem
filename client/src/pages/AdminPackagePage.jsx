import React, { useEffect, useState } from "react";
import {
  getAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
} from "../services/adminService";
import "../style/AdminPackagePage.scss";

const initialForm = {
  name: "",
  description: "",
  price: "",
  durationInDays: "",
  features: "",
};

const AdminPackagePage = () => {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await getAdminPackages();
      setPackages(data);
    } catch (err) {
      setError("Không thể tải danh sách gói");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Sửa lại handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let packageData = {
        ...form,
        price: Number(form.price || 0),
      };

      // Xử lý đặc biệt cho gói thường
      if (form.name === "Gói Thường" || packageData.name === "Gói Thường") {
        packageData = {
          ...packageData,
          durationInDays: -1,
          price: 0,
          features: [
            "Truy cập blog chia sẻ cộng đồng",
            "Tự tạo kế hoạch cai thuốc cho riêng mình",
            "Trao thành tích khi đạt mốc",
          ],
        };
      } else {
        // Xử lý cho các gói khác
        packageData.features = packageData.features
          ? typeof packageData.features === "string"
            ? packageData.features.split("\n")
            : packageData.features
          : [];
        packageData.durationInDays = Number(packageData.durationInDays);
      }

      setLoading(true);
      setError("");

      if (editingId) {
        await updateAdminPackage(editingId, packageData);
      } else {
        await createAdminPackage(packageData);
      }

      setForm(initialForm);
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      console.error("Error saving package:", err);
      setError("Lỗi khi lưu gói: " + (err.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  // Sửa lại handleEdit
  const handleEdit = (pkg) => {
    // Chuyển đổi features từ mảng sang chuỗi
    const featuresString = Array.isArray(pkg.features)
      ? pkg.features.join("\n")
      : pkg.features || "";

    setForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.name === "Gói Thường" ? 0 : pkg.price,
      durationInDays: pkg.name === "Gói Thường" ? -1 : pkg.durationInDays,
      features: featuresString,
    });
    setEditingId(pkg.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa gói này?")) return;
    setLoading(true);
    setError("");
    try {
      await deleteAdminPackage(id);
      fetchPackages();
    } catch (err) {
      setError("Lỗi khi xóa gói");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  return (
    <div className="admin-package-page container mt-4">
      <h2>Quản lý gói</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="mb-4" onSubmit={handleSubmit}>
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label">Tên gói</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Mô tả</label>
            <input
              type="text"
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Giá (VNĐ)</label>
            <input
              type="number"
              className="form-control"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Số ngày</label>
            <select
              className="form-control"
              name="durationInDays"
              value={form.durationInDays}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn số ngày --</option>
              <option value={-1}>Không giới hạn</option>
              <option value={30}>30 ngày</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Tính năng</label>
            <textarea
              className="form-control"
              name="features"
              value={
                form.features
                  ? Array.isArray(form.features)
                    ? form.features.join("\n")
                    : form.features
                  : ""
              }
              onChange={handleChange}
              rows={4}
              placeholder="Nhập mỗi đặc điểm 1 dòng"
            />
          </div>
          <div className="col-md-12 mt-2">
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={loading}
            >
              {editingId ? "Cập nhật" : "Thêm mới"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </form>
      <table className="table table-bordered table-hover">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Tên gói</th>
            <th>Mô tả</th>
            <th>Giá (VNĐ)</th>
            <th>Số ngày</th>
            <th>Tính năng</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, idx) => (
            <tr key={pkg.id}>
              <td>{idx + 1}</td>
              <td>{pkg.name}</td>
              <td>{pkg.description}</td>
              <td>{pkg.price.toLocaleString()}</td>
              <td>
                {pkg.name === "Gói Thường" || pkg.durationInDays === -1
                  ? "Không giới hạn"
                  : pkg.durationInDays}
              </td>
              <td>
                <ul className="mb-0 ps-3">
                  {(Array.isArray(pkg.features)
                    ? pkg.features
                    : String(pkg.features || "").split(/\r?\n|\\n/)
                  )
                    .filter((f) => f.trim())
                    .map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                </ul>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() => handleEdit(pkg)}
                  disabled={loading}
                >
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(pkg.id)}
                  disabled={loading}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPackagePage;
