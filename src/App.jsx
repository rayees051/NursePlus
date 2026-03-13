import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_exfyxpi";
const EMAILJS_ADMIN_TEMPLATE = "template_0yxr5ed";
const EMAILJS_USER_TEMPLATE = "template_cllzroc";
const EMAILJS_PUBLIC_KEY = "8FrXjABn1nA-CBnax";

const SERVICES = [
  { id: "nurse-visit", icon: "🏥", title: "Home Nurse Visit", desc: "Professional nurse at your doorstep", duration: "1–3 hrs", price: "From ₹500" },
  { id: "regular-care", icon: "❤️", title: "Regular Caregiving", desc: "Daily or weekly in-home care support", duration: "Flexible", price: "From ₹300/hr" },
];

const TIMES = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM"];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }
function generateRef() { return "NP-" + Math.random().toString(36).substring(2,7).toUpperCase(); }

function HomeScreen({ onBook }) {
  return (
    <div className="screen home-screen">
      <header className="home-header">
        <div className="logo-row">
          <div className="logo-icon">✦</div>
          <span className="logo-text">NursePlus</span>
        </div>
        <div className="header-badge">Available 24/7</div>
      </header>
      <div className="hero-section">
        <div className="hero-tag">Instant Home Care</div>
        <h1 className="hero-title">Care that<br/>comes<br/><em>to you.</em></h1>
        <p className="hero-sub">Professional nurses & caregivers at your home — fast, reliable, trusted.</p>
      </div>
      <div className="services-label">Choose a service</div>
      <div className="services-list">
        {SERVICES.map(s => (
          <div key={s.id} className="service-card" onClick={() => onBook(s)}>
            <div className="service-card-left">
              <div className="service-icon">{s.icon}</div>
              <div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
                <div className="service-meta">
                  <span className="meta-pill">{s.duration}</span>
                  <span className="meta-pill accent">{s.price}</span>
                </div>
              </div>
            </div>
            <div className="service-arrow">→</div>
          </div>
        ))}
      </div>
      <div className="trust-row">
        <div className="trust-item"><span className="trust-icon">✔</span> Verified nurses</div>
        <div className="trust-item"><span className="trust-icon">✔</span> Insured visits</div>
        <div className="trust-item"><span className="trust-icon">✔</span> Instant booking</div>
      </div>
    </div>
  );
}

function BookingScreen({ service, onBack, onConfirm }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", date: getTodayStr(), time: "", notes: "" });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validate2 = () => {
    const e = {};
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validate1()) setStep(2);
    else if (step === 2 && validate2()) setStep(3);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const ref = generateRef();
      const booking = {
        ...form,
        service: { id: service.id, title: service.title, price: service.price },
        ref,
        status: "pending",
        response: "",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "bookings"), booking);

      // Send email to ADMIN
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_ADMIN_TEMPLATE,
        {
          ref,
          patient_name: form.name,
          phone: form.phone,
          patient_email: form.email,
          service_title: service.title,
          date: form.date,
          time: form.time,
          address: form.address,
          notes: form.notes || "None",
        },
        EMAILJS_PUBLIC_KEY
      );

      onConfirm({ ...booking, docId: docRef.id, createdAt: new Date().toLocaleString() });
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="screen booking-screen">
      <div className="booking-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="progress-row">
          {[1,2,3].map(n => (
            <div key={n} className={`progress-dot ${step >= n ? "active" : ""}`} />
          ))}
        </div>
      </div>
      <div className="booking-service-chip"><span>{service.icon}</span> {service.title}</div>

      {step === 1 && (
        <div className="form-section">
          <h2 className="form-title">Your details</h2>
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" />
            {errors.name && <span className="err">{errors.name}</span>}
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" type="tel" />
            {errors.phone && <span className="err">{errors.phone}</span>}
          </div>
          <div className="field">
            <label>Email Address</label>
            <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@gmail.com" type="email" />
            {errors.email && <span className="err">{errors.email}</span>}
          </div>
          <div className="field">
            <label>Home Address</label>
            <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123, MG Road, Bengaluru" />
            {errors.address && <span className="err">{errors.address}</span>}
          </div>
          <div className="field">
            <label>Special Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any medical info, access instructions..." rows={3} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form-section">
          <h2 className="form-title">Pick a date & time</h2>
          <div className="field">
            <label>Date</label>
            <input type="date" value={form.date} min={getTodayStr()} onChange={e => set("date", e.target.value)} />
            {errors.date && <span className="err">{errors.date}</span>}
          </div>
          <div className="field">
            <label>Preferred Time</label>
            <div className="time-grid">
              {TIMES.map(t => (
                <button key={t} className={`time-chip ${form.time === t ? "selected" : ""}`} onClick={() => set("time", t)}>{t}</button>
              ))}
            </div>
            {errors.time && <span className="err">{errors.time}</span>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="form-section">
          <h2 className="form-title">Review & confirm</h2>
          <div className="review-card">
            <div className="review-row"><span>Service</span><strong>{service.title}</strong></div>
            <div className="review-row"><span>Name</span><strong>{form.name}</strong></div>
            <div className="review-row"><span>Phone</span><strong>{form.phone}</strong></div>
            <div className="review-row"><span>Email</span><strong>{form.email}</strong></div>
            <div className="review-row"><span>Address</span><strong>{form.address}</strong></div>
            <div className="review-row"><span>Date</span><strong>{form.date}</strong></div>
            <div className="review-row"><span>Time</span><strong>{form.time}</strong></div>
            {form.notes && <div className="review-row"><span>Notes</span><strong>{form.notes}</strong></div>}
            <div className="review-row"><span>Est. Price</span><strong className="price">{service.price}</strong></div>
          </div>
          <p className="review-note">Our team will confirm your booking within 10 minutes.</p>
        </div>
      )}

      <div className="booking-footer">
        {step < 3
          ? <button className="btn-primary" onClick={nextStep}>Continue →</button>
          : <button className="btn-primary btn-confirm" onClick={submit} disabled={loading}>
              {loading ? "Sending booking..." : "Confirm Booking ✓"}
            </button>
        }
      </div>
    </div>
  );
}

function ConfirmScreen({ booking, onHome, onAdmin }) {
  return (
    <div className="screen confirm-screen">
      <div className="confirm-anim"><div className="confirm-circle">✓</div></div>
      <h2 className="confirm-title">Booking Received!</h2>
      <p className="confirm-sub">We've received your request and will confirm within 10 minutes.</p>
      <div className="confirm-ref">Ref: <strong>{booking.ref}</strong></div>
      <div className="confirm-summary">
        <div className="cs-row"><span>📋</span> {booking.service.title}</div>
        <div className="cs-row"><span>📅</span> {booking.date} at {booking.time}</div>
        <div className="cs-row"><span>📍</span> {booking.address}</div>
        <div className="cs-row"><span>📞</span> {booking.phone}</div>
        <div className="cs-row"><span>📧</span> {booking.email}</div>
      </div>
      <div className="status-badge pending">Status: Awaiting Confirmation</div>
      <button className="btn-primary" onClick={onHome} style={{marginBottom:12}}>Book Another</button>
    
    </div>
  );
}

function AdminScreen({ onBack }) {
  const [bookings, setBookings] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bookings"), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const send = async (b) => {
    setSending(true);
    const response = msg || "Your booking is confirmed! Our nurse will arrive at the scheduled time.";
    try {
      // Update Firebase
      await updateDoc(doc(db, "bookings", b.docId), { status: "confirmed", response });

      // Send confirmation email to USER
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_USER_TEMPLATE,
        {
          patient_name: b.name,
          patient_email: b.email,
          ref: b.ref,
          service_title: b.service?.title,
          date: b.date,
          time: b.time,
          address: b.address,
          response,
        },
        EMAILJS_PUBLIC_KEY
      );

      alert("✅ Booking confirmed & email sent to patient!");
    } catch (err) {
      alert("Error sending email. Please try again.");
      console.error(err);
    }
    setRespondingId(null);
    setMsg("");
    setSending(false);
  };

  return (
    <div className="screen admin-screen">
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>← App</button>
        <span className="admin-title">Admin Panel</span>
        <span className="admin-badge">{bookings.filter(b=>b.status==="pending").length} pending</span>
      </div>
      {loading && <div className="empty-state">Loading bookings...</div>}
      {!loading && bookings.length === 0 && <div className="empty-state">No bookings yet.<br/>They'll appear here instantly.</div>}
      {bookings.map(b => (
        <div key={b.docId} className={`booking-card ${b.status}`}>
          <div className="bc-top">
            <div>
              <span className="bc-ref">{b.ref}</span>
              <span className={`bc-status ${b.status}`}>{b.status === "pending" ? "⏳ Pending" : "✅ Confirmed"}</span>
            </div>
          </div>
          <div className="bc-name">{b.name}</div>
          <div className="bc-meta">
            <span>📋 {b.service?.title}</span>
            <span>📅 {b.date} {b.time}</span>
          </div>
          <div className="bc-meta">
            <span>📞 {b.phone}</span>
            <span>📧 {b.email}</span>
          </div>
          <div className="bc-meta"><span>📍 {b.address}</span></div>
          {b.notes && <div className="bc-notes">Note: {b.notes}</div>}
          {b.status === "pending" && (
            respondingId === b.docId ? (
              <div className="respond-box">
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type your message to the patient... (or leave blank for default)" rows={3} />
                <div className="respond-actions">
                  <button className="btn-send" onClick={() => send(b)} disabled={sending}>
                    {sending ? "Sending..." : "Confirm & Email Patient ✓"}
                  </button>
                  <button className="btn-cancel-sm" onClick={() => setRespondingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-respond" onClick={() => setRespondingId(b.docId)}>Respond to Patient →</button>
            )
          )}
          {b.status === "confirmed" && b.response && (
            <div className="response-sent"><span>💬 Sent:</span> {b.response}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const isAdmin = window.location.search.includes("admin=nurseplus2024");
  const [screen, setScreen] = useState(isAdmin ? "admin" : "home");
  const [selectedService, setSelectedService] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e8eff7; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; }
        .screen { width: 100%; max-width: 420px; min-height: 100vh; background: #fff; margin: 0 auto; display: flex; flex-direction: column; overflow-y: auto; }
        .home-header { background: #0a3d7a; padding: 20px 24px 18px; display: flex; align-items: center; justify-content: space-between; }
        .logo-row { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 34px; height: 34px; background: #fff; color: #0a3d7a; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
        .logo-text { color: #fff; font-size: 20px; font-weight: 700; }
        .header-badge { background: #1ed4a0; color: #003a2f; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .hero-section { background: #0a3d7a; padding: 0 24px 40px; color: #fff; }
        .hero-tag { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #7ab3e8; margin-bottom: 12px; }
        .hero-title { font-family: 'DM Serif Display', serif; font-size: 48px; line-height: 1.05; color: #fff; margin-bottom: 14px; }
        .hero-title em { color: #7ab3e8; font-style: italic; }
        .hero-sub { font-size: 14px; color: #a8c8e8; line-height: 1.6; max-width: 280px; }
        .services-label { padding: 24px 24px 12px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #8899aa; }
        .services-list { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }
        .service-card { background: #fff; border: 1.5px solid #dce8f5; border-radius: 18px; padding: 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 12px rgba(10,61,122,0.06); }
        .service-card:hover { border-color: #0a3d7a; box-shadow: 0 4px 20px rgba(10,61,122,0.14); transform: translateY(-1px); }
        .service-card-left { display: flex; align-items: flex-start; gap: 14px; }
        .service-icon { font-size: 28px; }
        .service-title { font-weight: 600; font-size: 15px; color: #0d1f3a; margin-bottom: 3px; }
        .service-desc { font-size: 12px; color: #7a90aa; margin-bottom: 8px; }
        .service-meta { display: flex; gap: 6px; flex-wrap: wrap; }
        .meta-pill { background: #edf4ff; color: #0a3d7a; font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; }
        .meta-pill.accent { background: #e6faf4; color: #0a6e55; }
        .service-arrow { color: #0a3d7a; font-size: 20px; }
        .trust-row { display: flex; justify-content: space-around; padding: 24px 16px; margin-top: auto; border-top: 1px solid #edf2f8; }
        .trust-item { font-size: 11px; color: #7a90aa; font-weight: 500; display: flex; align-items: center; gap: 5px; }
        .trust-icon { color: #1ed4a0; font-weight: 700; }
        .booking-top { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #edf2f8; }
        .back-btn { background: none; border: none; color: #0a3d7a; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; }
        .progress-row { display: flex; gap: 8px; }
        .progress-dot { width: 28px; height: 6px; border-radius: 3px; background: #dce8f5; transition: background 0.3s; }
        .progress-dot.active { background: #0a3d7a; }
        .booking-service-chip { margin: 18px 20px 0; display: inline-flex; align-items: center; gap: 8px; background: #edf4ff; border: 1px solid #c5d9f5; color: #0a3d7a; font-weight: 600; font-size: 13px; padding: 8px 14px; border-radius: 20px; width: fit-content; }
        .form-section { padding: 20px 20px 0; flex: 1; }
        .form-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0d1f3a; margin-bottom: 20px; }
        .field { margin-bottom: 16px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: #7a90aa; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; }
        .field input, .field textarea { width: 100%; border: 1.5px solid #dce8f5; border-radius: 12px; padding: 12px 14px; font-family: 'Sora', sans-serif; font-size: 14px; color: #0d1f3a; outline: none; background: #fafcff; transition: border 0.2s; }
        .field input:focus, .field textarea:focus { border-color: #0a3d7a; }
        .err { font-size: 11px; color: #e03e3e; margin-top: 4px; display: block; }
        .time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .time-chip { background: #f0f6ff; border: 1.5px solid #dce8f5; border-radius: 10px; padding: 9px 6px; font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 500; color: #0a3d7a; cursor: pointer; transition: all 0.15s; }
        .time-chip.selected { background: #0a3d7a; color: #fff; border-color: #0a3d7a; }
        .review-card { background: #f5f9ff; border: 1.5px solid #dce8f5; border-radius: 16px; padding: 16px; }
        .review-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dce8f5; font-size: 13px; gap: 12px; }
        .review-row:last-child { border-bottom: none; }
        .review-row span { color: #7a90aa; font-size: 12px; white-space: nowrap; }
        .review-row strong { color: #0d1f3a; text-align: right; }
        .price { color: #0a3d7a; font-size: 15px; }
        .review-note { font-size: 12px; color: #7a90aa; text-align: center; margin-top: 14px; line-height: 1.5; }
        .booking-footer { padding: 20px; position: sticky; bottom: 0; background: #fff; border-top: 1px solid #edf2f8; }
        .btn-primary { width: 100%; background: #0a3d7a; color: #fff; border: none; border-radius: 14px; padding: 15px; font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-primary:hover { background: #0c4a94; }
        .btn-primary:disabled { background: #7a90aa; cursor: not-allowed; }
        .btn-confirm { background: linear-gradient(135deg, #0a3d7a, #0c5aad); }
        .btn-secondary { width: 100%; background: #edf4ff; color: #0a3d7a; border: none; border-radius: 14px; padding: 14px; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
        .confirm-screen { align-items: center; justify-content: center; padding: 30px 24px; text-align: center; }
        .confirm-anim { margin-bottom: 20px; }
        .confirm-circle { width: 80px; height: 80px; background: linear-gradient(135deg, #0a3d7a, #1d7ddc); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32px; animation: pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .confirm-title { font-family: 'DM Serif Display', serif; font-size: 30px; color: #0d1f3a; margin-bottom: 10px; }
        .confirm-sub { font-size: 14px; color: #7a90aa; line-height: 1.6; max-width: 280px; margin-bottom: 16px; }
        .confirm-ref { font-size: 12px; color: #7a90aa; margin-bottom: 20px; }
        .confirm-ref strong { color: #0a3d7a; }
        .confirm-summary { background: #f5f9ff; border: 1.5px solid #dce8f5; border-radius: 16px; padding: 16px; width: 100%; margin-bottom: 16px; }
        .cs-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #0d1f3a; padding: 6px 0; border-bottom: 1px solid #edf2f8; text-align: left; }
        .cs-row:last-child { border-bottom: none; }
        .status-badge { font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 20px; margin-bottom: 20px; }
        .status-badge.pending { background: #fff7e0; color: #a06000; border: 1px solid #f5d67a; }
        .admin-header { padding: 16px 20px; display: flex; align-items: center; gap: 12px; background: #0a3d7a; }
        .admin-title { color: #fff; font-size: 16px; font-weight: 600; flex: 1; }
        .admin-badge { background: #e03e3e; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
        .admin-header .back-btn { color: #7ab3e8; }
        .booking-card { margin: 12px 14px 0; background: #fff; border: 1.5px solid #dce8f5; border-radius: 16px; padding: 16px; }
        .booking-card.confirmed { border-color: #b2e8d6; background: #f9fffe; }
        .bc-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .bc-ref { font-size: 11px; font-weight: 700; color: #0a3d7a; letter-spacing: 1px; margin-right: 8px; }
        .bc-status { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .bc-status.pending { background: #fff7e0; color: #a06000; }
        .bc-status.confirmed { background: #e6faf4; color: #0a6e55; }
        .bc-name { font-size: 16px; font-weight: 600; color: #0d1f3a; margin-bottom: 8px; }
        .bc-meta { display: flex; gap: 12px; font-size: 12px; color: #7a90aa; margin-bottom: 4px; flex-wrap: wrap; }
        .bc-notes { font-size: 12px; color: #7a90aa; background: #f5f9ff; border-radius: 8px; padding: 8px; margin-top: 8px; }
        .btn-respond { margin-top: 12px; width: 100%; background: #edf4ff; border: 1.5px solid #c5d9f5; color: #0a3d7a; border-radius: 10px; padding: 10px; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
        .respond-box { margin-top: 12px; }
        .respond-box textarea { width: 100%; border: 1.5px solid #dce8f5; border-radius: 10px; padding: 10px; font-family: 'Sora', sans-serif; font-size: 13px; color: #0d1f3a; background: #fafcff; outline: none; resize: none; }
        .respond-actions { display: flex; gap: 8px; margin-top: 8px; }
        .btn-send { flex: 1; background: #0a3d7a; color: #fff; border: none; border-radius: 10px; padding: 10px; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-send:disabled { background: #7a90aa; cursor: not-allowed; }
        .btn-cancel-sm { background: #f0f2f5; color: #7a90aa; border: none; border-radius: 10px; padding: 10px 14px; font-family: 'Sora', sans-serif; font-size: 13px; cursor: pointer; }
        .response-sent { margin-top: 10px; font-size: 12px; color: #0a6e55; background: #e6faf4; border-radius: 8px; padding: 8px 10px; }
        .empty-state { text-align: center; color: #aabbcc; font-size: 14px; padding: 60px 20px; line-height: 1.8; }
        @media (max-width: 440px) { .screen { max-width: 100%; } }
      `}</style>
      {screen === "home" && <HomeScreen onBook={(s) => { setSelectedService(s); setScreen("booking"); }} />}
      {screen === "booking" && <BookingScreen service={selectedService} onBack={() => setScreen("home")} onConfirm={(b) => { setCurrentBooking(b); setScreen("confirm"); }} />}
      {screen === "confirm" && <ConfirmScreen booking={currentBooking} onHome={() => setScreen("home")} onAdmin={() => setScreen("admin")} />}
      {screen === "admin" && <AdminScreen onBack={() => setScreen("home")} />}
    </>
  );
}