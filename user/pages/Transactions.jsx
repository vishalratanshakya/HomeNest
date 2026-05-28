import { useEffect, useState } from 'react';
import "./userDashboard.css";
import { authService, bookingService } from "@core/services/firebaseService";
import { CreditCard, Download, ExternalLink } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      bookingService.getUserTransactions(user.uid).then(data => {
        setTransactions(data);
      });
    }
  }, []);

  const defaultTransactions = [
    {
      id: 'T1',
      propertyName: "Golden City Penthouse",
      method: "UPI / PhonePe",
      date: "05 May 2026",
      amount: "₹4,80,000",
      status: "Success"
    },
    {
      id: 'T2',
      propertyName: "Security Deposit - Elite Villa",
      method: "HDFC Debit Card",
      date: "02 May 2026",
      amount: "₹1,25,000",
      status: "Success"
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  const handleDownloadReport = () => {
    if (displayTransactions.length === 0) return;
    
    // Create CSV content
    const headers = ['Transaction ID', 'Property Name', 'Payment Method', 'Date', 'Amount', 'Status'];
    const csvRows = [headers.join(',')];
    
    displayTransactions.forEach(trans => {
      const amountStr = String(trans.amount || trans.propertyPrice || trans.totalAmount || '0').replace(/,/g, '');
      const row = [
        trans.id || trans.transactionId || 'N/A',
        `"${(trans.propertyName || trans.propertyTitle || 'Property Booking').replace(/"/g, '""')}"`,
        `"${trans.method || trans.paymentMethod || 'Online Payment'}"`,
        `"${trans.date || trans.createdAt || 'Today'}"`,
        `"${amountStr}"`,
        trans.status || trans.paymentStatus || 'Success'
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transaction_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReceipt = (trans) => {
    // Generate a simple text receipt
    const receiptContent = `=========================================
          TRANSACTION RECEIPT
=========================================
Transaction ID : ${trans.id || trans.transactionId || 'N/A'}
Date           : ${trans.date || trans.createdAt || new Date().toLocaleDateString()}
Property       : ${trans.propertyName || trans.propertyTitle || 'Property Booking'}
Payment Method : ${trans.method || trans.paymentMethod || 'Online Payment'}
Amount         : ${trans.amount || trans.propertyPrice || trans.totalAmount || '₹0'}
Status         : ${trans.status || trans.paymentStatus || 'SUCCESSFUL'}
=========================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Receipt_${trans.id || 'Transaction'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewTransaction = (trans) => {
    alert(`Transaction Details\n\nProperty: ${trans.propertyName || trans.propertyTitle || 'Property Booking'}\nTransaction ID: ${trans.id || trans.transactionId || 'N/A'}\nPayment Method: ${trans.method || trans.paymentMethod || 'Online Payment'}\nDate: ${trans.date || trans.createdAt || 'Today'}\nAmount: ${trans.amount || trans.propertyPrice || trans.totalAmount || '₹0'}\nStatus: ${trans.status || trans.paymentStatus || 'SUCCESSFUL'}`);
  };

  return (
    <>
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h2>Transaction History</h2>
            <p className="profile-subtitle">Track your recent payments and financial activities</p>
          </div>
          <button className="edit-profile-btn" onClick={handleDownloadReport}>Download Report</button>
        </div>
        
        <div className="transactions-list">
          {displayTransactions.map(trans => (
            <div key={trans.id} className="transaction-item">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{trans.propertyName || 'Property Booking'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {trans.method || 'Online Payment'} • {trans.date || 'Today'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="text-lg font-black text-blue-600">{trans.amount || '₹0'}</span>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[2px]">{trans.status || 'SUCCESSFUL'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400" 
                    title="Download Receipt"
                    onClick={() => handleDownloadReceipt(trans)}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                    title="View Details"
                    onClick={() => handleViewTransaction(trans)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Transactions;
