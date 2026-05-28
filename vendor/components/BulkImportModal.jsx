import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authService, db } from '../../src/core/services/firebaseService';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

export default function BulkImportModal({ isOpen, onClose, onSuccess, defaultListingType = 'sell' }) {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeData = (data) => {
    let listingType = defaultListingType || 'sell';
    if (listingType === 'sale' || listingType === 'buy') listingType = 'sell';

    let price = data.pricing?.price || data.price || data.monthlyRent || data.totalPrice || 0;
    let securityDeposit = data.pricing?.securityDeposit || data.securityDeposit || 0;

    // Adjust based on type
    if (listingType === "sell") {
      securityDeposit = 0;
    } else if (listingType === "rent") {
      if (!securityDeposit) securityDeposit = price * 2;
    }

    const cityVal = data.location?.city || data.city || (typeof data.location === 'string' ? data.location : '');
    const stateVal = data.location?.state || data.state || '';
    const addressVal = data.location?.address || data.address || '';
    const localityVal = data.location?.locality || data.locality || '';
    const countryVal = data.location?.country || data.country || 'India';
    const zipCodeVal = data.location?.zipCode || data.zipCode || '';

    const locationObj = {
      city: cityVal,
      state: stateVal,
      address: addressVal,
      locality: localityVal,
      country: countryVal,
      zipCode: zipCodeVal
    };

    const type = data.type || data.propertyType || 'Apartment';

    return {
      ...data,
      listingType,
      type,
      propertyType: type,
      category: listingType,
      price,
      totalPrice: listingType === 'sell' ? price : '',
      monthlyRent: listingType === 'rent' ? price : '',
      securityDeposit: listingType === 'rent' ? securityDeposit : '',
      location: locationObj,
      city: locationObj.city,
      pricing: {
        price,
        securityDeposit,
        negotiable: data.pricing?.negotiable ?? data.negotiable ?? false
      }
    };
  };

  const handleJsonSubmit = async () => {
    if (!jsonInput.trim()) {
      setError("Please provide JSON data");
      return;
    }

    try {
      setError(null);
      const parsed = JSON.parse(jsonInput);
      const properties = Array.isArray(parsed) ? parsed : [parsed];
      const currentUser = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));

      setIsLoading(true);
      const uploadToast = toast.loading(`Uploading ${properties.length} properties...`);

      for (let i = 0; i < properties.length; i++) {
        let data = properties[i];
        
        // Normalize data
        data = normalizeData(data);

        // Validation
        if (!data.title) throw new Error(`Missing title in item ${i + 1}`);
        if (!data.price) throw new Error(`Missing price in item ${i + 1}`);
        if (!data.location?.city) throw new Error(`Missing city in item ${i + 1}`);

        // Slug
        const slug = data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, '');

        const mainImage = data.mainImage || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
        const images = data.images || [mainImage];

        const constructionStatus = (data.status && data.status !== 'active' && data.status !== 'inactive') 
          ? data.status 
          : (data.constructionStatus || 'Ready to Move');

        const vendorId = currentUser?.uid || 'json_upload';
        const vendorRole = currentUser?.role || 'vendor';
        const vendorName = currentUser?.displayName || currentUser?.name || 'Vendor';
        const vendorPhone = currentUser?.phoneNumber || currentUser?.phone || data.contact?.phone || data.contactPhone || '+91 00000 00000';

        await addDoc(collection(db, "properties"), {
          ...data,
          slug,
          vendorId,
          vendorRole,
          vendorName,
          vendorPhone,
          status: 'active',
          constructionStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          mainImage,
          images
        });
      }

      toast.success(`Successfully uploaded ${properties.length} properties!`, { id: uploadToast });
      setJsonInput("");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Bulk Property Import</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Production-Ready JSON Normalizer</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed font-medium">
                  <p className="font-bold mb-1">JSON Schema Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Supports Single Object or Array of Objects</li>
                    <li>Fields: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">title</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">listingType</code> (sale/rent)</li>
                    <li>Pricing: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">pricing.price</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">pricing.securityDeposit</code></li>
                    <li>Images: Array of URLs in <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200">images</code></li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 ml-1">Paste JSON Data</label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid JSON format required</span>
                </div>
                <div className="relative group">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"title": "Luxury Villa", "price": 50000, ...}]'
                    rows="10"
                    className="w-full p-6 bg-slate-950 text-emerald-400 font-mono text-sm rounded-2xl border-2 border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none scrollbar-thin scrollbar-thumb-slate-800"
                  />
                  {!jsonInput && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <Upload className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isLoading}
                onClick={handleJsonSubmit}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Start Bulk Upload
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
