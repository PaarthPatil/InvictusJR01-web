import React, { useState } from "react";
import StatusMessage from "../components/common/StatusMessage";
import services from "../services";
import { emitDataChange } from "../utils/dataEvents";

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function ImportExportPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImport = async () => {
    setError("");
    setSuccess("");

    if (files.length === 0) {
      setError("Select at least one .xlsx or .xlsm file.");
      return;
    }

    try {
      setLoading(true);
      const response = await services.importExportService.importExcel(files);
      const imported = response?.importedFiles?.length || files.length;
      const affected = response?.recordsAffected;
      const details =
        typeof affected === "number"
          ? ` Imported ${imported} file(s), affected ${affected} records.`
          : ` Imported ${imported} file(s).`;
      setSuccess((response.message || "Import completed.") + details);
      emitDataChange("import_completed", {
        importedFiles: response?.importedFiles || files.map((file) => file.name),
        recordsAffected: response?.recordsAffected,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportInventory = async () => {
    setError("");
    try {
      const blob = await services.importExportService.exportInventory();
      downloadBlob(blob, "inventory-export.csv");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Inventory export failed.");
    }
  };

  const handleExportConsumption = async () => {
    setError("");
    try {
      const blob = await services.importExportService.exportConsumption();
      downloadBlob(blob, "consumption-export.csv");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Consumption export failed.");
    }
  };

  return (
    <div className="page">
      <h1>Excel Import / Export</h1>
      <StatusMessage type="error" message={error} />
      <StatusMessage type="success" message={success} />

      <section className="card mb-14">
        <h2>Import</h2>
        <p>
          Upload full `.xlsx` / `.xlsm` files. In API mode, files are sent to backend parser. In
          local mode, import refreshes the app with the complete pre-analyzed workbook dataset.
        </p>
        <div className="form-field">
          <label htmlFor="files">Upload Excel Files (.xlsx, .xlsm)</label>
          <input
            id="files"
            type="file"
            multiple
            accept=".xlsx,.xlsm"
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
          />
        </div>
        <button className="btn" onClick={handleImport} disabled={loading}>
          {loading ? "Importing..." : "Import Files"}
        </button>
      </section>

      <section className="card">
        <h2>Export</h2>
        <div className="row">
          <button className="btn" onClick={handleExportInventory}>
            Export Inventory
          </button>
          <button className="btn btn-outline" onClick={handleExportConsumption}>
            Export Consumption
          </button>
        </div>
      </section>
    </div>
  );
}

export default ImportExportPage;
