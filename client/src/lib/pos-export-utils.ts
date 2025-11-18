import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type Transaction = {
  id: string;
  customer: { name: string; email?: string; phone?: string };
  items: { productId: string; qty: number; price: number; name?: string }[];
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Refunded';
  staff?: string;
  serviceAttendee?: string;
  salesAgent?: string;
  openBalance?: number;
  totalReturn?: number;
  balanceAmount?: number;
  orderValue?: number;
  currency?: string;
  paymentMethod?: string;
};

// Format currency
const formatCurrency = (cents: number, currency = '₹'): string => {
  return `${currency}${(cents / 100).toFixed(2)}`;
};

// Download blob helper
const downloadBlob = (data: BlobPart, filename: string, mime: string) => {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ==================== CSV EXPORT ====================
export const exportToCSV = (transactions: Transaction[], filename = 'pos-transactions.csv') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No data to export');
  }

  const headers = [
    'Transaction ID',
    'Date',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Staff (Billing)',
    'Service Attendee',
    'Sales Agent',
    'Items',
    'Quantity',
    'Order Value',
    'Tax/Fees',
    'Total Amount',
    'Payment Method',
    'Open Balance',
    'Total Return',
    'Balance Amount',
    'Status'
  ];

  const rows = transactions.map(tx => {
    const totalItems = tx.items.reduce((sum, item) => sum + item.qty, 0);
    const itemNames = tx.items.map(item => item.name || item.productId).join('; ');
    const taxFees = (tx.amount - (tx.orderValue || tx.amount));

    return [
      tx.id,
      new Date(tx.date).toLocaleDateString(),
      tx.customer.name,
      tx.customer.email || '',
      tx.customer.phone || '',
      tx.staff || '',
      tx.serviceAttendee || '',
      tx.salesAgent || tx.staff || '',
      itemNames,
      totalItems,
      formatCurrency(tx.orderValue || tx.amount, tx.currency || '₹'),
      formatCurrency(taxFees, tx.currency || '₹'),
      formatCurrency(tx.amount, tx.currency || '₹'),
      tx.paymentMethod || 'Not specified',
      formatCurrency(tx.openBalance || 0, tx.currency || '₹'),
      formatCurrency(tx.totalReturn || 0, tx.currency || '₹'),
      formatCurrency(tx.balanceAmount || tx.amount, tx.currency || '₹'),
      tx.status
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Add BOM for Excel UTF-8 support
  const BOM = '\ufeff';
  downloadBlob(BOM + csvContent, filename, 'text/csv;charset=utf-8;');
};

// ==================== EXCEL EXPORT ====================
export const exportToExcel = (transactions: Transaction[], filename = 'pos-transactions.xlsx') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['POS Transaction Summary Report'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['Total Transactions:', transactions.length],
    ['Total Revenue:', formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))],
    ['Completed:', transactions.filter(tx => tx.status === 'Completed').length],
    ['Pending:', transactions.filter(tx => tx.status === 'Pending').length],
    ['Refunded:', transactions.filter(tx => tx.status === 'Refunded').length],
    [''],
    ['Date Range:', transactions.length > 0 ? `${new Date(transactions[transactions.length - 1].date).toLocaleDateString()} to ${new Date(transactions[0].date).toLocaleDateString()}` : 'N/A']
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Transactions Sheet
  const transactionRows = transactions.map(tx => ({
    'Transaction ID': tx.id,
    'Date': new Date(tx.date).toLocaleDateString(),
    'Time': new Date(tx.date).toLocaleTimeString(),
    'Customer Name': tx.customer.name,
    'Customer Email': tx.customer.email || '',
    'Customer Phone': tx.customer.phone || '',
    'Staff (Billing)': tx.staff || '',
    'Service Attendee': tx.serviceAttendee || '',
    'Sales Agent': tx.salesAgent || tx.staff || '',
    'Items': tx.items.map(item => item.name || item.productId).join('; '),
    'Total Quantity': tx.items.reduce((sum, item) => sum + item.qty, 0),
    'Order Value': formatCurrency(tx.orderValue || tx.amount, tx.currency || '₹'),
    'Tax/Fees': formatCurrency((tx.amount - (tx.orderValue || tx.amount)), tx.currency || '₹'),
    'Total Amount': formatCurrency(tx.amount, tx.currency || '₹'),
    'Payment Method': tx.paymentMethod || 'Not specified',
    'Open Balance': formatCurrency(tx.openBalance || 0, tx.currency || '₹'),
    'Total Return': formatCurrency(tx.totalReturn || 0, tx.currency || '₹'),
    'Balance Amount': formatCurrency(tx.balanceAmount || tx.amount, tx.currency || '₹'),
    'Status': tx.status
  }));
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);

  // Set column widths
  wsTransactions['!cols'] = [
    { wch: 18 }, // Transaction ID
    { wch: 12 }, // Date
    { wch: 12 }, // Time
    { wch: 20 }, // Customer Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 15 }, // Staff
    { wch: 15 }, // Service Attendee
    { wch: 15 }, // Sales Agent
    { wch: 40 }, // Items
    { wch: 10 }, // Quantity
    { wch: 12 }, // Order Value
    { wch: 12 }, // Tax
    { wch: 12 }, // Total
    { wch: 15 }, // Payment
    { wch: 12 }, // Open Balance
    { wch: 12 }, // Return
    { wch: 12 }, // Balance
    { wch: 10 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // Items Detail Sheet
  const itemsDetailRows: any[] = [];
  transactions.forEach(tx => {
    tx.items.forEach(item => {
      itemsDetailRows.push({
        'Transaction ID': tx.id,
        'Date': new Date(tx.date).toLocaleDateString(),
        'Customer': tx.customer.name,
        'Staff': tx.staff || '',
        'Item Name': item.name || item.productId,
        'Quantity': item.qty,
        'Unit Price': formatCurrency(item.price, tx.currency || '₹'),
        'Line Total': formatCurrency(item.price * item.qty, tx.currency || '₹'),
        'Status': tx.status
      });
    });
  });
  const wsItems = XLSX.utils.json_to_sheet(itemsDetailRows);
  wsItems['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Item Details');

  // Staff Performance Sheet
  const staffMap = new Map<string, { sales: number; amount: number; transactions: number }>();
  transactions.forEach(tx => {
    const staff = tx.staff || 'Unassigned';
    if (!staffMap.has(staff)) {
      staffMap.set(staff, { sales: 0, amount: 0, transactions: 0 });
    }
    const stats = staffMap.get(staff)!;
    stats.transactions += 1;
    stats.sales += tx.items.reduce((sum, item) => sum + item.qty, 0);
    stats.amount += tx.amount;
  });

  const staffRows = Array.from(staffMap.entries()).map(([staff, stats]) => ({
    'Staff Name': staff,
    'Total Transactions': stats.transactions,
    'Items Sold': stats.sales,
    'Total Revenue': formatCurrency(stats.amount),
    'Average Transaction': formatCurrency(Math.round(stats.amount / stats.transactions))
  }));
  const wsStaff = XLSX.utils.json_to_sheet(staffRows);
  wsStaff['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff Performance');

  // Write file
  XLSX.writeFile(wb, filename);
};

// ==================== PDF EXPORT ====================
export const exportToPDF = (transactions: Transaction[], filename = 'pos-transactions.pdf') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // brand color
  doc.text('POS Transaction Report', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });

  // Summary Stats
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completed = transactions.filter(tx => tx.status === 'Completed').length;
  const pending = transactions.filter(tx => tx.status === 'Pending').length;
  const refunded = transactions.filter(tx => tx.status === 'Refunded').length;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  const summaryY = 32;
  doc.text('Summary:', 14, summaryY);
  doc.setFontSize(9);
  doc.text(`Total Transactions: ${transactions.length}`, 14, summaryY + 6);
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, summaryY + 12);
  doc.text(`Completed: ${completed}`, 80, summaryY + 6);
  doc.text(`Pending: ${pending}`, 80, summaryY + 12);
  doc.text(`Refunded: ${refunded}`, 130, summaryY + 6);

  // Transactions Table
  const tableStartY = summaryY + 20;
  
  const tableData = transactions.map(tx => [
    tx.id,
    new Date(tx.date).toLocaleDateString(),
    tx.customer.name,
    tx.staff || '',
    tx.serviceAttendee || '-',
    tx.salesAgent || tx.staff || '-',
    tx.items.length,
    formatCurrency(tx.amount, tx.currency || '₹'),
    tx.paymentMethod || '-',
    tx.status
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['ID', 'Date', 'Customer', 'Staff', 'Attendee', 'Sales Agent', 'Items', 'Amount', 'Payment', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 20 },
      9: { cellWidth: 20, halign: 'center' }
    },
    margin: { top: 10, left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(filename);
};

// ==================== PRINT ====================
export const printTransactions = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No data to print');
  }

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const completed = transactions.filter(tx => tx.status === 'Completed').length;
  const pending = transactions.filter(tx => tx.status === 'Pending').length;
  const refunded = transactions.filter(tx => tx.status === 'Refunded').length;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>POS Transaction Report</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #4f46e5;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
          font-size: 12px;
        }
        .summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .summary-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #4f46e5;
        }
        .summary-item h3 {
          margin: 0 0 5px 0;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-item p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        th {
          background: #4f46e5;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          display: inline-block;
        }
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-refunded {
          background: #fee2e2;
          color: #991b1b;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 10px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛒 POS Transaction Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <h3>Total Transactions</h3>
          <p>${transactions.length}</p>
        </div>
        <div class="summary-item">
          <h3>Total Revenue</h3>
          <p>${formatCurrency(totalRevenue)}</p>
        </div>
        <div class="summary-item">
          <h3>Completed</h3>
          <p>${completed}</p>
        </div>
        <div class="summary-item">
          <h3>Pending</h3>
          <p>${pending}</p>
        </div>
        <div class="summary-item">
          <h3>Refunded</h3>
          <p>${refunded}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Staff (Billing)</th>
            <th>Service Attendee</th>
            <th>Sales Agent</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => `
            <tr>
              <td><strong>${tx.id}</strong></td>
              <td>${new Date(tx.date).toLocaleDateString()}</td>
              <td>
                <strong>${tx.customer.name}</strong><br/>
                <span style="font-size: 10px; color: #666;">${tx.customer.email || ''}</span>
              </td>
              <td>${tx.staff || '-'}</td>
              <td>${tx.serviceAttendee || '-'}</td>
              <td>${tx.salesAgent || tx.staff || '-'}</td>
              <td>${tx.items.map(item => `${item.name || item.productId} (${item.qty})`).join(', ')}</td>
              <td><strong>${formatCurrency(tx.amount, tx.currency || '₹')}</strong></td>
              <td>${tx.paymentMethod || '-'}</td>
              <td>
                <span class="status status-${tx.status.toLowerCase()}">
                  ${tx.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This is a computer-generated report. Confidential and proprietary information.</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
  }
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.print();
  };
};

// ==================== SINGLE TRANSACTION PRINT ====================
export const printSingleTransaction = (transaction: Transaction) => {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${transaction.id}</title>
      <style>
        @media print {
          @page { margin: 0.5cm; size: A4; }
          body { margin: 0; }
        }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        .receipt {
          border: 2px dashed #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
        }
        .header p {
          margin: 3px 0;
          font-size: 12px;
        }
        .section {
          margin: 15px 0;
        }
        .section-title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 13px;
        }
        .items {
          border-top: 1px dashed #666;
          border-bottom: 1px dashed #666;
          padding: 10px 0;
          margin: 15px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .item-name {
          flex: 1;
        }
        .item-qty {
          width: 50px;
          text-align: center;
        }
        .item-price {
          width: 80px;
          text-align: right;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          border-top: 1px dashed #666;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>🧾 RECEIPT</h1>
          <p><strong>${transaction.id}</strong></p>
          <p>${new Date(transaction.date).toLocaleString()}</p>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="row">
            <span>Name:</span>
            <span><strong>${transaction.customer.name}</strong></span>
          </div>
          ${transaction.customer.email ? `
            <div class="row">
              <span>Email:</span>
              <span>${transaction.customer.email}</span>
            </div>
          ` : ''}
          ${transaction.customer.phone ? `
            <div class="row">
              <span>Phone:</span>
              <span>${transaction.customer.phone}</span>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Staff Details</div>
          <div class="row">
            <span>Billing Staff:</span>
            <span><strong>${transaction.staff || 'N/A'}</strong></span>
          </div>
          ${transaction.serviceAttendee ? `
            <div class="row">
              <span>Service Attendee:</span>
              <span><strong>${transaction.serviceAttendee}</strong></span>
            </div>
          ` : ''}
          ${transaction.salesAgent ? `
            <div class="row">
              <span>Sales Agent:</span>
              <span><strong>${transaction.salesAgent}</strong></span>
            </div>
          ` : ''}
        </div>

        <div class="items">
          <div class="section-title">Items</div>
          ${transaction.items.map(item => `
            <div class="item">
              <span class="item-name">${item.name || item.productId}</span>
              <span class="item-qty">x${item.qty}</span>
              <span class="item-price">${formatCurrency(item.price * item.qty, transaction.currency || '₹')}</span>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="row">
            <span>Order Value:</span>
            <span>${formatCurrency(transaction.orderValue || transaction.amount, transaction.currency || '₹')}</span>
          </div>
          ${(transaction.amount - (transaction.orderValue || transaction.amount)) > 0 ? `
            <div class="row">
              <span>Tax/Fees:</span>
              <span>${formatCurrency(transaction.amount - (transaction.orderValue || transaction.amount), transaction.currency || '₹')}</span>
            </div>
          ` : ''}
          <div class="row total">
            <span>TOTAL:</span>
            <span>${formatCurrency(transaction.amount, transaction.currency || '₹')}</span>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <span>Payment Method:</span>
            <span><strong>${transaction.paymentMethod || 'N/A'}</strong></span>
          </div>
          <div class="row">
            <span>Status:</span>
            <span><strong>${transaction.status}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>★★★★★</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
  }
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  printWindow.onload = () => {
    printWindow.print();
  };
};
