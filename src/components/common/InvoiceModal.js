import React from "react";
import { downloadInvoice, printInvoice } from "../../utils/invoiceGenerator";

function InvoiceModal({ isOpen, onClose, invoiceHtml, itemCount }) {
    if (!isOpen) return null;

    const handleDownload = () => {
        const timestamp = new Date().toISOString().split("T")[0];
        downloadInvoice(invoiceHtml, `procurement-invoice-${timestamp}.html`);
    };

    const handlePrint = () => {
        printInvoice(invoiceHtml);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Procurement Invoice Preview</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <p className="invoice-info">
                        Invoice generated for <strong>{itemCount}</strong> pending procurement{" "}
                        {itemCount === 1 ? "item" : "items"}.
                    </p>

                    <div className="invoice-preview-container">
                        <iframe
                            title="Invoice Preview"
                            srcDoc={invoiceHtml}
                            className="invoice-preview-iframe"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn" onClick={handleDownload}>
                        📥 Download Invoice
                    </button>
                    <button className="btn btn-outline" onClick={handlePrint}>
                        🖨️ Print Invoice
                    </button>
                    <button className="btn btn-outline" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InvoiceModal;
