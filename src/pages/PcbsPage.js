import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import StatusMessage from "../components/common/StatusMessage";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import { onDataChange } from "../utils/dataEvents";

function PcbsPage() {
  const { isAdmin } = useAuth();
  const [pcbs, setPcbs] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pcbResult, componentResult] = await Promise.all([
        services.pcbService.list(),
        services.componentsService.list(),
      ]);
      setPcbs(pcbResult || []);
      setComponents(componentResult || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load PCB list.");
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

  const componentNameMap = useMemo(() => {
    return components.reduce((acc, component) => {
      acc[component.id] = component.name;
      return acc;
    }, {});
  }, [components]);

  return (
    <div className="page">
      <h1>PCB - Component Mapping</h1>
      <StatusMessage type="error" message={error} />

      {!isAdmin ? <StatusMessage type="success" message="Read-only mode." /> : null}

      <div className="row mb-12">
        {isAdmin ? (
          <Link className="btn" to="/pcbs/create">
            Create PCB
          </Link>
        ) : null}
      </div>

      {loading ? <LoadingState /> : null}

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>PCB Name</th>
              <th>Mapped Components</th>
            </tr>
          </thead>
          <tbody>
            {pcbs.length === 0 ? (
              <tr>
                <td colSpan={2}>No PCBs found.</td>
              </tr>
            ) : (
              pcbs.map((pcb) => (
                <tr key={pcb.id}>
                  <td>{pcb.name}</td>
                  <td>
                    {(pcb.components || []).length === 0
                      ? "No mapping"
                      : pcb.components
                          .map(
                            (item) =>
                              `${componentNameMap[item.componentId] || item.componentId} (qty ${
                                item.quantityPerComponent
                              })`
                          )
                          .join(", ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default PcbsPage;
