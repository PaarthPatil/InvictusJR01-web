/**
 * Invoice Generator Utility
 * Generates detailed Bill of Materials invoices for procurement needs
 */

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}${day}-${random}`;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function calculateOrderQuantity(item) {
  const targetStock = item.monthlyRequiredQty * 2;
  const orderQty = Math.max(0, targetStock - item.currentStockQty);
  return Math.ceil(orderQty);
}

export function generateInvoiceHTML(procurementItems, options = {}) {
  const {
    invoiceNumber = generateInvoiceNumber(),
    invoiceDate = new Date(),
    companyName = "PCB Manufacturing Co.",
    companyAddress = "123 Industrial Park, Tech City, TC 12345",
    companyPhone = "(555) 123-4567",
    companyEmail = "procurement@pcbmfg.com",
    supplierName = "Components & Parts Supplier",
    supplierAddress = "456 Supply Street, Parts Town, PT 67890",
    pricePerUnit = 10,
  } = options;

  let totalAmount = 0;
  const invoiceRows = procurementItems.map((item) => {
    const orderQty = calculateOrderQuantity(item);
    const lineTotal = orderQty * pricePerUnit;
    totalAmount += lineTotal;

    return `
      <tr>
        <td>${item.componentName}</td>
        <td>${item.partNumber}</td>
        <td>${item.currentStockQty}</td>
        <td>${item.monthlyRequiredQty}</td>
        <td>${item.lowStockThreshold}</td>
        <td>${orderQty}</td>
        <td>${formatCurrency(pricePerUnit)}</td>
        <td>${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join("");

  const taxAmount = totalAmount * 0.1;
  const grandTotal = totalAmount + taxAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Procurement Invoice - ${invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0b5fff;
        }
        .company-info, .invoice-info {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        h1 {
          color: #0b5fff;
          margin: 0 0 10px 0;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .supplier-section {
          background: #f7f8fc;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #0b5fff;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
          background: #f9f9f9;
        }
        .totals-section {
          margin-top: 30px;
          text-align: right;
        }
        .totals-table {
          display: inline-block;
          min-width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .grand-total {
          font-size: 1.2em;
          font-weight: bold;
          color: #0b5fff;
          border-top: 2px solid #0b5fff;
          padding-top: 12px;
          margin-top: 8px;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #fff9e6;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #999;
          font-size: 0.9em;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="company-info">
          <h1>${companyName}</h1>
          <p>${companyAddress}</p>
          <p>Phone: ${companyPhone}</p>
          <p>Email: ${companyEmail}</p>
        </div>
        <div class="invoice-info">
          <h2>PROCUREMENT INVOICE</h2>
          <p><span class="info-label">Invoice #:</span> ${invoiceNumber}</p>
          <p><span class="info-label">Date:</span> ${formatDate(invoiceDate)}</p>
          <p><span class="info-label">Items:</span> ${procurementItems.length}</p>
        </div>
      </div>

      <div class="supplier-section">
        <h3>Supplier Information</h3>
        <p><strong>${supplierName}</strong></p>
        <p>${supplierAddress}</p>
      </div>

      <h3>Bill of Materials - Items Needing Procurement</h3>
      <table>
        <thead>
          <tr>
            <th>Component Name</th>
            <th>Part Number</th>
            <th>Current Stock</th>
            <th>Monthly Required</th>
            <th>Low Threshold</th>
            <th>Order Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceRows}
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-table">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(totalAmount)}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>${formatCurrency(taxAmount)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>${formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div class="notes">
        <h4>Notes:</h4>
        <ul>
          <li>Order quantities calculated to bring stock to 2x monthly requirement</li>
          <li>Prices are estimates - confirm with supplier before ordering</li>
          <li>Payment terms: Net 30 days</li>
        </ul>
      </div>

      <div class="footer">
        <p>Generated on ${formatDate(new Date())} by PCB Inventory Management System</p>
      </div>
    </body>
    </html>
  `;
}

export function downloadInvoice(htmlContent, filename) {
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printInvoice(htmlContent) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
