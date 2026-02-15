import React, { useCallback, useEffect, useState } from "react";
import LoadingState from "../components/common/LoadingState";
import StatusMessage from "../components/common/StatusMessage";
import services from "../services";
import { onDataChange } from "../utils/dataEvents";
import { formatDateTime, formatNumber } from "../utils/formatters";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [procurementRecords, setProcurementRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (filter = "all") => {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, procurementRes] = await Promise.all([
        services.analyticsService.getSummary(),
        services.procurementService.list({ status: filter }),
      ]);

      setSummary(summaryRes);
      setProcurementRecords(procurementRes || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData("all");
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = onDataChange(() => {
      loadData(statusFilter);
    });
    return unsubscribe;
  }, [loadData, statusFilter]);

  const applyFilter = (nextFilter) => {
    setStatusFilter(nextFilter);
    loadData(nextFilter);
  };

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <StatusMessage type="error" message={error} />

      {loading ? <LoadingState /> : null}

      {summary ? (
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-title">Total Components</div>
            <div className="metric-value">{formatNumber(summary.totalComponents)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Low Stock Components</div>
            <div className="metric-value">{formatNumber(summary.lowStockCount)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Total Production Entries</div>
            <div className="metric-value">{formatNumber(summary.totalProductionEntries)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Pending Procurement Triggers</div>
            <div className="metric-value">{formatNumber(summary.pendingProcurementCount)}</div>
          </div>
        </div>
      ) : null}

      <section className="card">
        <h2>Procurement Trigger Records</h2>
        <div className="filter-chip-row">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "resolved", label: "Resolved" },
          ].map((filter) => (
            <button
              key={filter.value}
              className={`filter-chip ${statusFilter === filter.value ? "active" : ""}`}
              onClick={() => applyFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>Part Number</th>
                <th>Current Stock</th>
                <th>Monthly Required</th>
                <th>20% Threshold</th>
                <th>Triggered At</th>
                <th>Status</th>
                <th>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {procurementRecords.length === 0 ? (
                <tr>
                  <td colSpan={8}>No procurement records found.</td>
                </tr>
              ) : (
                procurementRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.componentName}</td>
                    <td>{record.partNumber}</td>
                    <td>{formatNumber(record.currentStockQty)}</td>
                    <td>{formatNumber(record.monthlyRequiredQty)}</td>
                    <td>{formatNumber(record.lowStockThreshold)}</td>
                    <td>{formatDateTime(record.triggeredAt)}</td>
                    <td>
                      <span
                        className={`badge ${
                          record.status === "pending" ? "badge-danger" : "badge-success"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td>{record.resolvedAt ? formatDateTime(record.resolvedAt) : "-"}</td>
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

export default DashboardPage;


