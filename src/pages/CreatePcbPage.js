import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import StatusMessage from "../components/common/StatusMessage";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import { emitDataChange } from "../utils/dataEvents";

const EMPTY_ROW = { componentId: "", quantityPerComponent: "1" };

function CreatePcbPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [rows, setRows] = useState([EMPTY_ROW]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const list = await services.componentsService.list();
        setComponents(list || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load components.");
      }
    };

    load();
  }, []);

  if (!isAdmin) {
    return <Navigate to="/pcbs" replace />;
  }

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const pcbName = name.trim();
    if (!pcbName) {
      setError("PCB name is required.");
      return;
    }

    const cleanRows = rows
      .map((row) => ({
        componentId: row.componentId,
        quantityPerComponent: Number(row.quantityPerComponent),
      }))
      .filter((row) => row.componentId);

    if (cleanRows.length === 0) {
      setError("Add at least one component mapping row.");
      return;
    }

    if (cleanRows.some((row) => Number.isNaN(row.quantityPerComponent) || row.quantityPerComponent <= 0)) {
      setError("Quantity per component must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      await services.pcbService.create({
        name: pcbName,
        components: cleanRows,
      });
      emitDataChange("pcb_created", { name: pcbName, mappingCount: cleanRows.length });
      navigate("/pcbs");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create PCB.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Create PCB Mapping</h1>
      <StatusMessage type="error" message={error} />

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="pcbName">PCB Name</label>
          <input id="pcbName" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <h3>Component Rows</h3>
        {rows.map((row, index) => (
          <div key={`${index}-${row.componentId}`} className="row mb-8">
            <select
              value={row.componentId}
              onChange={(event) => updateRow(index, "componentId", event.target.value)}
            >
              <option value="">Select component</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={row.quantityPerComponent}
              onChange={(event) => updateRow(index, "quantityPerComponent", event.target.value)}
              placeholder="Qty per component"
            />

            <button className="btn btn-outline" type="button" onClick={() => removeRow(index)}>
              Remove
            </button>
          </div>
        ))}

        <div className="row">
          <button className="btn btn-outline" type="button" onClick={addRow}>
            Add Row
          </button>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Create PCB"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePcbPage;
