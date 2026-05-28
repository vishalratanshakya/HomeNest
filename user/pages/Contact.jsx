import { useState, useEffect } from 'react';
import { db } from '@core/services/firebaseService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import UserNavbar from '../components/UserNavbar';
import "./contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const revealElements = () => {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((reveal) => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible || windowHeight === 0) {
          reveal.classList.add('active');
          reveal.style.opacity = '1';
          reveal.style.transform = 'translateY(0)';
        }
      });
    };

    // Ensure initial visibility for top elements
    revealElements();

    window.addEventListener('scroll', revealElements);
    const timer = setTimeout(revealElements, 100);
    return () => {
      window.removeEventListener('scroll', revealElements);
      clearTimeout(timer);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await addDoc(collection(db, "contactMessages"), {
        ...formData,
        createdAt: serverTimestamp()
      });

      setStatus({
        type: 'success',
        message: 'Message sent successfully! We will get back to you soon.'
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus({
        type: 'error',
        message: 'Failed to send message. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <UserNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <section className="text-center mb-16 reveal">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight">Contact <span className="text-primary-600">Us</span></h1>
          <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            We’re here to help you with buying, renting, and property inquiries. Our team is available 24/7 to support your journey.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: '📞', title: 'Call Us', val: '+91 9876543210', color: 'bg-blue-50 text-blue-600' },
            { icon: '📧', title: 'Email', val: 'support@realestate.com', color: 'bg-green-50 text-green-600' },
            { icon: '📍', title: 'Office', val: 'Gaur City Center, Noida', color: 'bg-orange-50 text-orange-600' }
          ].map((card, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center text-center reveal transition-all hover:shadow-md">
              <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-2xl mb-6`}>{card.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-slate-500 font-medium">{card.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* FORM */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 reveal">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Send Message</h2>
            {status.message && (
              <div className={`mb-8 p-5 rounded-2xl text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                {status.message}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 0000000000"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Message</label>
                <textarea
                  rows="6"
                  name="message"
                  placeholder="How can we help you?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 resize-none"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          {/* INFO BOX */}
          <div className="bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl text-white flex flex-col justify-between reveal">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-8">Get In Touch</h2>
              <p className="text-slate-400 leading-relaxed mb-10">
                Our team is available to help you with property inquiries and support. We typically respond within 2 hours.
              </p>

              <div className="space-y-8">
                {[
                  { icon: '📞', val: '+91 9876543210', label: 'Call support' },
                  { icon: '📧', val: 'support@realestate.com', label: 'Email us' },
                  { icon: '📍', val: 'Gaur City Center, Greater Noida West', label: 'Visit us' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-slate-200">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">Office Hours</p>
              <p className="text-sm text-slate-300">Mon - Fri: 10:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>

        <section className="rounded-[2.5rem] overflow-hidden shadow-2xl reveal h-[400px] border border-slate-100">
          <iframe
            title="map"
            className="w-full h-full grayscale opacity-80"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.083162791444!2d77.4221199!3d28.5977931!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cef263c961e5b%3A0x7d6b38c237887e7f!2sGaur%20City%20Center!5e0!3m2!1sen!2sin!4v1715070000000!5m2!1sen!2sin"
            loading="lazy"
          ></iframe>
        </section>
      </main>
    </div>
  );
};

export default Contact;
