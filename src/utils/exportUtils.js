import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data array to CSV file
 */
export const exportToCSV = (filename, rows, headers) => {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);

  const csvContent = [
    headerLabels.join(','),
    ...rows.map((row) =>
      headerKeys
        .map((key) => {
          let val = row[key] ?? '';
          if (typeof val === 'string') {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate PDF Report
 */
export const exportReportPDF = (reportTitle, summaryData, tableHeaders, tableRows) => {
  const doc = new jsPDF();

  // Header branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(53, 24, 6); // Brand dark brown
  doc.text('echaii', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 108, 94);
  doc.text('Internal POS & Operations Report', 14, 26);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 31);

  doc.setDrawColor(230, 220, 210);
  doc.line(14, 34, 196, 34);

  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(35, 24, 13);
  doc.text(reportTitle, 14, 43);

  // Summary Grid
  let yPos = 52;
  doc.setFontSize(10);
  summaryData.forEach((item, index) => {
    const x = 14 + (index % 3) * 60;
    const y = yPos + Math.floor(index / 3) * 14;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 90, 80);
    doc.text(item.label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(35, 24, 13);
    doc.text(String(item.value), x, y + 5);
  });

  const tableStartY = yPos + Math.ceil(summaryData.length / 3) * 14 + 10;

  if (tableHeaders && tableRows && tableRows.length) {
    doc.autoTable({
      startY: tableStartY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [74, 40, 16],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [40, 30, 20],
      },
      alternateRowStyles: {
        fillColor: [250, 248, 245],
      },
    });
  }

  doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
