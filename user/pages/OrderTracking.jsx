import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, XCircle, ChevronLeft } from 'lucide-react';
import { bookingService, firestoreService } from '@core/services/firebaseService';

export default function UserOrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      setLoading(true);
      try {
        // 1. Try fetching as a booking first
        const booking = await bookingService.getBooking(orderId);
        if (booking) {
          const createdAt = booking.createdAt?.toDate ? booking.createdAt.toDate() : (new Date(booking.createdAt || Date.now()));
          const statusMap = {
            'pending': 'in_progress',
            'confirmed': 'in_progress',
            'completed': 'completed',
            'approved': 'completed',
            'rejected': 'cancelled',
            'cancelled': 'cancelled'
          };
          
          const mappedStatus = statusMap[booking.bookingStatus || booking.status] || 'pending';
          
          const mappedOrder = {
            id: booking.id,
            productName: booking.propertyName || 'Property Inquiry',
            productImage: booking.propertyImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
            amount: booking.price || booking.monthlyEMI || 0,
            status: mappedStatus,
            paymentStatus: booking.paymentStatus || 'pending',
            paymentMethod: booking.paymentMethod || 'finance',
            createdAt: createdAt,
            tracking: [
              { status: 'pending', message: 'Inquiry Submitted', timestamp: createdAt }
            ]
          };

          if (mappedStatus === 'in_progress') {
            mappedOrder.tracking.push({ status: 'in_progress', message: 'Inquiry Under Review', timestamp: new Date(createdAt.getTime() + 864000) });
          } else if (mappedStatus === 'completed') {
            mappedOrder.tracking.push({ status: 'in_progress', message: 'Inquiry Under Review', timestamp: new Date(createdAt.getTime() + 864000) });
            mappedOrder.tracking.push({ status: 'completed', message: 'Inquiry Approved', timestamp: new Date(createdAt.getTime() + 1728000) });
          } else if (mappedStatus === 'cancelled') {
            mappedOrder.tracking.push({ status: 'cancelled', message: 'Inquiry Rejected', timestamp: new Date(createdAt.getTime() + 864000) });
          }
          
          setOrder(mappedOrder);
          setLoading(false);
          return;
        }

        // 2. Try fetching as a regular order
        const firestoreOrder = await firestoreService.getOrder(orderId);
        if (firestoreOrder) {
          if (!firestoreOrder.tracking) {
             firestoreOrder.tracking = [
                { status: 'pending', message: 'Order Placed', timestamp: firestoreOrder.createdAt?.toDate ? firestoreOrder.createdAt.toDate() : new Date() }
             ];
          }
          setOrder(firestoreOrder);
          setLoading(false);
          return;
        }

      } catch (err) {
        console.error("Error fetching order:", err);
      }
      
      // No order found in Firestore
      setLoading(false);
    };

    fetchTracking();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col gap-4 items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Locating your inquiry...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Package className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepColor = (index, currentStep) => {
    if (index < currentStep) return 'bg-green-500';
    if (index === currentStep) return 'bg-primary-500';
    return 'bg-gray-300';
  };

  const currentStep = order.tracking.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="text-xl font-bold text-gray-900">#{order.id}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                order.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={order.productImage}
              alt={order.productName}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{order.productName}</h3>
              <p className="text-lg font-bold text-primary-600">₹{Number(order.amount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {order.tracking.map((track, index) => (
              <div key={index} className="relative flex items-start mb-8 last:mb-0">
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-gray-200">
                  {getStepIcon(track.status)}
                </div>
                <div className="ml-6 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{track.message}</h4>
                    <span className="text-sm text-gray-600">
                      {new Date(track.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{track.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${
                order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900 capitalize">{order.paymentMethod || 'Pending'}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-gray-900">₹{Number(order.amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {order.status === 'pending' && (
            <button className="w-full mt-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all">
              Cancel Order
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
