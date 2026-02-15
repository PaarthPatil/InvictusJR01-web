import React, { useState } from "react";

function FulfillmentModal({ isOpen, onClose, item, onFulfill }) {
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await onFulfill(item.id, notes);
            setNotes("");
            onClose();
        } catch (error) {
            alert(`Failed to mark as fulfilled: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content fulfillment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Mark Procurement as Fulfilled</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="fulfillment-item-info">
                            <p><strong>Component:</strong> {item.componentName}</p>
                            <p><strong>Part Number:</strong> {item.partNumber}</p>
                            <p><strong>Current Stock:</strong> {item.currentStockQty}</p>
                            <p><strong>Required:</strong> {item.monthlyRequiredQty}</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="fulfillment-notes">
                                <strong>Fulfillment Notes</strong> (Optional)
                            </label>
                            <textarea
                                id="fulfillment-notes"
                                className="form-control"
                                rows="4"
                                placeholder="e.g., PO#12345, received from XYZ Supplier, delivered on..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <small className="form-hint">
                                Add any relevant information about this fulfillment (PO number, supplier, delivery info, etc.)
                            </small>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="submit" className="btn" disabled={submitting}>
                            {submitting ? "Marking..." : "✓ Mark as Fulfilled"}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FulfillmentModal;
