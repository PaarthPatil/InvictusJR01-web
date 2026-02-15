import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import LoadingState from "../components/common/LoadingState";
import StatusMessage from "../components/common/StatusMessage";
import { emitDataChange } from "../utils/dataEvents";

function ProductionPage() {
  const { isAdmin } = useAuth();
  const [pcbs, setPcbs] = useState([]);
  const [selectedPcbId, setSelectedPcbId] = useState("");
  const [quantityToProduce, setQuantityToProduce] = useState("");

  const [affectedComponents, setAffectedComponents] = useState([]);
  const [deductions, setDeductions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadPcbs = async () => {
      setInitialLoading(true);
      try {
        const list = await services.pcbService.list();
        setPcbs(list || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load PCB list.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadPcbs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setDeductions([]);

    if (!isAdmin) {
      setError("Only Admin can create production entries.");
      return;
    }

    if (!selectedPcbId) {
      setError("Select a PCB.");
      return;
    }

    const quantity = Number(quantityToProduce);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("Quantity to produce must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      const response = await services.productionService.create({
        pcbId: selectedPcbId,
        quantityToProduce: quantity,
      });

      setSuccess("Production entry created and stock deducted successfully.");
      setDeductions(response.deductions || []);
      setAffectedComponents(response.updatedComponents || []);
      setQuantityToProduce("");
      emitDataChange("production_completed", {
        pcbId: selectedPcbId,
        quantityToProduce: quantity,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create production entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Production Entry</h1>
      <StatusMessage type="error" message={error} />
      <StatusMessage type="success" message={success} />

      {initialLoading ? <LoadingState /> : null}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="pcbId">Select PCB</label>
          <select
            id="pcbId"
            value={selectedPcbId}
            onChange={(event) => setSelectedPcbId(event.target.value)}
          >
            <option value="">Select PCB</option>
            {pcbs.map((pcb) => (
              <option key={pcb.id} value={pcb.id}>
                {pcb.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="qty">Quantity to Produce</label>
          <input
            id="qty"
            type="number"
            min="1"
            value={quantityToProduce}
            onChange={(event) => setQuantityToProduce(event.target.value)}
          />
        </div>

        <button className="btn" type="submit" disabled={loading || !isAdmin}>
          {loading ? "Submitting..." : "Submit Production"}
        </button>
      </form>

      <section className="card mt-14">
        <h2>Deduction Result</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Quantity Deducted</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={2}>No production deduction yet.</td>
                </tr>
              ) : (
                deductions.map((item) => (
                  <tr key={`${item.componentId}-${item.quantityDeducted}`}>
                    <td>{item.componentName}</td>
                    <td>{item.quantityDeducted}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-14">
        <h2>Updated Stock Snapshot</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Current Stock</th>
                <th>Monthly Required</th>
                <th>20% Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {affectedComponents.length === 0 ? (
                <tr>
                  <td colSpan={5}>No stock update snapshot available.</td>
                </tr>
              ) : (
                affectedComponents.map((component) => (
                  <tr key={component.id} className={component.isLowStock ? "low-stock-row" : ""}>
                    <td>{component.name}</td>
                    <td>{component.currentStockQty}</td>
                    <td>{component.monthlyRequiredQty}</td>
                    <td>{component.lowStockThreshold}</td>
                    <td>
                      {component.isLowStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Healthy</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ProductionPage;
