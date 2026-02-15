import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import StatusMessage from "../components/common/StatusMessage";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import { emitDataChange, onDataChange } from "../utils/dataEvents";
import { formatNumber } from "../utils/formatters";

function ComponentsPage() {
  const { isAdmin } = useAuth();
  const [components, setComponents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    partNumber: "",
    currentStockQty: "",
    monthlyRequiredQty: "",
  });

  const loadComponents = useCallback(async (searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const result = await services.componentsService.list({ search: searchTerm });
      setComponents(result || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load components.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComponents("");
  }, [loadComponents]);

  useEffect(() => {
    const unsubscribe = onDataChange(() => {
      loadComponents(search);
    });
    return unsubscribe;
  }, [loadComponents, search]);

  const onSearchSubmit = (event) => {
    event.preventDefault();
    loadComponents(search);
  };

  const startEdit = (component) => {
    setEditId(component.id);
    setEditForm({
      name: component.name,
      partNumber: component.partNumber,
      currentStockQty: String(component.currentStockQty),
      monthlyRequiredQty: String(component.monthlyRequiredQty),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({ name: "", partNumber: "", currentStockQty: "", monthlyRequiredQty: "" });
  };

  const saveEdit = async () => {
    setError("");
    setSuccess("");

    if (!editForm.name.trim() || !editForm.partNumber.trim()) {
      setError("Name and Part Number are required.");
      return;
    }

    const currentStockQty = Number(editForm.currentStockQty);
    const monthlyRequiredQty = Number(editForm.monthlyRequiredQty);

    if (Number.isNaN(currentStockQty) || currentStockQty < 0) {
      setError("Current stock quantity must be a non-negative number.");
      return;
    }

    if (Number.isNaN(monthlyRequiredQty) || monthlyRequiredQty <= 0) {
      setError("Monthly required quantity must be greater than zero.");
      return;
    }

    try {
      await services.componentsService.update(editId, {
        name: editForm.name.trim(),
        partNumber: editForm.partNumber.trim(),
        currentStockQty,
        monthlyRequiredQty,
      });
      emitDataChange("component_updated", { componentId: editId });
      setSuccess("Component updated successfully.");
      cancelEdit();
      loadComponents(search);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to update component.");
    }
  };

  const readOnlyNotice = useMemo(() => {
    if (isAdmin) return "";
    return "Read-only mode: only Admin can modify inventory.";
  }, [isAdmin]);

  return (
    <div className="page">
      <h1>Component Inventory</h1>
      <StatusMessage type="error" message={error} />
      <StatusMessage type="success" message={success} />
      <StatusMessage type="success" message={readOnlyNotice} />

      <div className="card mb-14">
        <form className="row" onSubmit={onSearchSubmit}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by component or part number"
          />
          <button className="btn" type="submit">
            Search
          </button>
          {isAdmin ? (
            <Link className="btn btn-outline" to="/components/add">
              Add Component
            </Link>
          ) : null}
        </form>
      </div>

      {loading ? <LoadingState /> : null}

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Part Number</th>
              <th>Current Stock</th>
              <th>Monthly Required</th>
              <th>20% Threshold</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {components.length === 0 ? (
              <tr>
                <td colSpan={7}>No components found.</td>
              </tr>
            ) : (
              components.map((component) => {
                const editing = editId === component.id;
                return (
                  <tr
                    key={component.id}
                    className={component.isLowStock && !editing ? "low-stock-row" : ""}
                  >
                    <td>
                      {editing ? (
                        <input
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                        />
                      ) : (
                        component.name
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          value={editForm.partNumber}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, partNumber: event.target.value }))
                          }
                        />
                      ) : (
                        component.partNumber
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.currentStockQty}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              currentStockQty: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        formatNumber(component.currentStockQty)
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.monthlyRequiredQty}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              monthlyRequiredQty: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        formatNumber(component.monthlyRequiredQty)
                      )}
                    </td>
                    <td>{formatNumber(component.lowStockThreshold)}</td>
                    <td>
                      {component.isLowStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Healthy</span>
                      )}
                    </td>
                    <td>
                      {!isAdmin ? (
                        "Read-only"
                      ) : editing ? (
                        <div className="row">
                          <button className="btn" type="button" onClick={saveEdit}>
                            Save
                          </button>
                          <button className="btn btn-outline" type="button" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-outline" type="button" onClick={() => startEdit(component)}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ComponentsPage;
