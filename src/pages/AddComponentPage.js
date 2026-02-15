import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import StatusMessage from "../components/common/StatusMessage";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import { emitDataChange } from "../utils/dataEvents";

function AddComponentPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    partNumber: "",
    currentStockQty: "",
    monthlyRequiredQty: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAdmin) {
    return <Navigate to="/components" replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const partNumber = form.partNumber.trim();
    const currentStockQty = Number(form.currentStockQty);
    const monthlyRequiredQty = Number(form.monthlyRequiredQty);

    if (!name || !partNumber) {
      setError("Name and Part Number are required.");
      return;
    }

    if (Number.isNaN(currentStockQty) || currentStockQty < 0) {
      setError("Current stock quantity must be a non-negative number.");
      return;
    }

    if (Number.isNaN(monthlyRequiredQty) || monthlyRequiredQty <= 0) {
      setError("Monthly required quantity must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      await services.componentsService.create({
        name,
        partNumber,
        currentStockQty,
        monthlyRequiredQty,
      });
      emitDataChange("component_created", { name, partNumber });
      navigate("/components");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to add component.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Add Component</h1>
      <StatusMessage type="error" message={error} />
      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="componentName">Component Name</label>
          <input
            id="componentName"
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="partNumber">Part Number</label>
          <input
            id="partNumber"
            value={form.partNumber}
            onChange={(event) => handleChange("partNumber", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="currentStockQty">Current Stock Quantity</label>
          <input
            id="currentStockQty"
            type="number"
            min="0"
            value={form.currentStockQty}
            onChange={(event) => handleChange("currentStockQty", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="monthlyRequiredQty">Monthly Required Quantity</label>
          <input
            id="monthlyRequiredQty"
            type="number"
            min="1"
            value={form.monthlyRequiredQty}
            onChange={(event) => handleChange("monthlyRequiredQty", event.target.value)}
          />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default AddComponentPage;
