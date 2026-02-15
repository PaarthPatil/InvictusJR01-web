import React, { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingState from "../components/common/LoadingState";
import StatusMessage from "../components/common/StatusMessage";
import services from "../services";
import { onDataChange } from "../utils/dataEvents";
import { formatDateTime } from "../utils/formatters";

function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [topConsumed, setTopConsumed] = useState([]);
  const [history, setHistory] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, topRes, historyRes, lowRes] = await Promise.all([
        services.analyticsService.getSummary(),
        services.analyticsService.getTopConsumed(),
        services.analyticsService.getConsumptionHistory(),
        services.analyticsService.getLowStockList(),
      ]);

      setSummary(summaryRes);
      setTopConsumed(topRes || []);
      setHistory(historyRes || []);
      setLowStockList(lowRes || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = onDataChange(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  return (
    <div className="page">
      <h1>Analytics Dashboard</h1>
      <StatusMessage type="error" message={error} />

      {loading ? <LoadingState /> : null}

      {summary ? (
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-title">Total Components</div>
            <div className="metric-value">{summary.totalComponents}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Low Stock Count</div>
            <div className="metric-value">{summary.lowStockCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Total Production Entries</div>
            <div className="metric-value">{summary.totalProductionEntries}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Pending Procurement</div>
            <div className="metric-value">{summary.pendingProcurementCount}</div>
          </div>
        </div>
      ) : null}

      <section className="card mb-14">
        <h2>Top Consumed Components</h2>
        <div className="chart-box">
          <ResponsiveContainer>
            <BarChart data={topConsumed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="componentName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="consumedQty" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card mb-14">
        <h2>Component Consumption History</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>PCB</th>
                <th>Component</th>
                <th>Consumed Quantity</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4}>No consumption records found.</td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.date)}</td>
                    <td>{entry.pcbName}</td>
                    <td>{entry.componentName}</td>
                    <td>{entry.consumedQty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Low Stock Components</h2>
        <ul>
          {lowStockList.length === 0 ? (
            <li>No low stock components.</li>
          ) : (
            lowStockList.map((component) => (
              <li key={component.id}>
                {component.name} - stock {component.currentStockQty} / threshold {component.lowStockThreshold}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export default AnalyticsPage;
