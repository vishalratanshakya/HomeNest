import { motion } from 'framer-motion';
import { CheckCircle2, Download, Home, LayoutDashboard, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './successModal.css';

export default function SuccessModal({ isOpen, onClose, paymentDetails }) {
  if (!isOpen) return null;

  const downloadInvoice = async () => {
    const element = document.getElementById('invoice-template');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${paymentDetails.paymentId}.pdf`);
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="success-modal-content"
      >
        <button className="close-modal-btn" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>

        <div className="success-icon-wrapper">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>

        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-subtitle">Your property booking has been confirmed.</p>

        <div className="payment-summary-box">
          <div className="summary-row">
            <span>Property:</span>
            <strong>{paymentDetails.propertyName}</strong>
          </div>
          <div className="summary-row">
            <span>Amount Paid:</span>
            <strong>₹{paymentDetails.amount.toLocaleString()}</strong>
          </div>
          <div className="summary-row">
            <span>Payment ID:</span>
            <strong>{paymentDetails.paymentId}</strong>
          </div>
          <div className="summary-row">
            <span>Status:</span>
            <span className="status-badge-paid">Paid</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="download-invoice-btn" onClick={downloadInvoice}>
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
          
          <div className="secondary-actions">
            <button className="dashboard-btn" onClick={() => window.location.href = '/user/profile'}>
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </button>
            <button className="home-btn" onClick={() => window.location.href = '/'}>
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>

        {/* Hidden Invoice Template for PDF Generation */}
        <div id="invoice-template" style={{ position: 'absolute', left: '-9999px', width: '800px', padding: '40px', background: 'white' }}>
          <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ color: '#2563eb', margin: 0 }}>BOOKING INVOICE</h1>
            <p style={{ color: '#64748b' }}>Invoice ID: {paymentDetails.paymentId}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Buyer Details:</h4>
              <p style={{ margin: '5px 0', color: '#475569' }}>Name: {paymentDetails.userName}</p>
              <p style={{ margin: '5px 0', color: '#475569' }}>Email: {paymentDetails.email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Date:</h4>
              <p style={{ margin: '5px 0', color: '#475569' }}>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '15px', borderBottom: '1px solid #e2e8f0' }}>Description</th>
                <th style={{ textAlign: 'right', padding: '15px', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
                  Property Booking: {paymentDetails.propertyName}
                </td>
                <td style={{ textAlign: 'right', padding: '15px', borderBottom: '1px solid #e2e8f0' }}>
                  ₹{paymentDetails.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>Total Amount Paid</td>
                <td style={{ textAlign: 'right', padding: '15px', fontWeight: 'bold', fontSize: '20px', color: '#2563eb' }}>
                  ₹{paymentDetails.amount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
            <p>Thank you for choosing our platform for your dream property.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
