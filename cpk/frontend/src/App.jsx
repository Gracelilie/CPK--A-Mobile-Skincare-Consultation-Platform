import React, { useState, useEffect, useCallback } from 'react';
import { Home, Users, LineChart, Settings, Camera, MessageCircle, Calendar, ShoppingBag, Star, Clock, Video, Send } from 'lucide-react';
import { api } from './api.js';

const card = 'bg-white p-6 rounded-xl shadow-lg';

function Login({ onDone }) {
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const submit = async () => {
    try { await api.login(email, password); onDone(); } catch (e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className={`${card} w-full max-w-sm space-y-4`}>
        <h1 className="text-2xl font-bold">Sign in to CPK</h1>
        <input className="w-full border rounded-lg px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border rounded-lg px-3 py-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && submit()} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={submit} className="w-full bg-orange-400 text-white py-3 rounded-lg font-medium hover:bg-orange-500">Sign in</button>
        <p className="text-xs text-gray-500">Demo account is pre-filled.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(api.hasToken());
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [me, setMe] = useState(null);
  const [aestheticians, setAestheticians] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [progress, setProgress] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2500); };
  const guard = async (fn) => {
    try { setError(''); return await fn(); }
    catch (e) { if (/token|Unknown user/i.test(e.message)) { api.logout(); setAuthed(false); } else setError(e.message); }
  };

  const loadAll = useCallback(() => guard(async () => {
    const [m, a, ap, ms, pr] = await Promise.all([api.me(), api.aestheticians(), api.appointments(), api.messages(), api.progress()]);
    setMe(m); setAestheticians(a); setAppointments(ap); setMessages(ms); setProgress(pr);
  }), []);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  if (!me) return <div className="p-6">{error ? <p className="text-red-600">{error} — is the backend running on port 8000?</p> : 'Loading…'}</div>;

  const sendMessage = () => guard(async () => {
    if (!newMessage.trim()) return;
    await api.sendMessage(newMessage); setNewMessage(''); setMessages(await api.messages());
  });
  const book = (d) => guard(async () => { await api.book(d.id, 'Consultation'); setAppointments(await api.appointments()); flash(`Booked with ${d.name}`); });
  const setMode = (mode) => guard(async () => { await api.setProfileMode(mode); setMe({ ...me, profile_mode: mode }); });
  const addNote = () => guard(async () => {
    if (!note.trim()) return;
    const nextWeek = Math.max(0, ...progress.map(p => p.week)) + 1;
    await api.addProgress(nextWeek, note.trim()); setNote(''); setProgress(await api.progress());
  });

  const renderHome = () => (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {me.name}!</h1>
          <p className="text-gray-600">Your personalized skincare journey starts here.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowChat(true)} className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600"><MessageCircle size={20} /></button>
          <button onClick={() => flash('Video calls are not implemented in this demo')} className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"><Video size={20} /></button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
        <div><h3 className="text-lg font-semibold">{me.plan} Member</h3><p className="text-purple-100">Unlimited consultations • Priority support</p></div>
        <Star className="text-yellow-300" size={24} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('progress')} className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center space-y-2 hover:scale-105 transition-transform">
          <Camera className="text-orange-400" size={32} /><span className="font-medium">Log Progress</span>
        </button>
        <button onClick={() => flash('Product ordering is not implemented in this demo')} className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center space-y-2 hover:scale-105 transition-transform">
          <ShoppingBag className="text-blue-400" size={32} /><span className="font-medium">Order Products</span>
        </button>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold">Upcoming Appointments</h2><Calendar className="text-yellow-500" size={24} /></div>
        {appointments.length === 0 && <p className="text-gray-500 text-sm">No appointments yet. Book one from the Consults tab.</p>}
        {appointments.map(apt => (
          <div key={apt.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div>
              <p className="font-medium">{apt.type} - {apt.doctor}</p>
              <p className="text-gray-500 text-sm">{apt.date} at {apt.time} ({apt.duration})</p>
            </div>
            <button onClick={() => flash('Joining calls is not implemented in this demo')} className="bg-orange-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-500">Join</button>
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold">Latest Update</h2><LineChart className="text-yellow-500" size={24} /></div>
        {progress[0] ? <><p className="font-medium text-blue-400">Week {progress[0].week}</p><p className="text-gray-600 text-sm">{progress[0].update}</p></> : <p className="text-gray-500 text-sm">No updates yet.</p>}
      </div>
    </div>
  );

  const renderConsultations = () => (
    <div className="flex flex-col p-6 space-y-6">
      <h1 className="text-3xl font-bold">Find Your Aesthetician</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-400 text-white p-4 rounded-xl shadow-lg text-center"><Video className="mx-auto mb-2" size={24} /><p className="font-medium">30min Consultation</p><p className="text-xs opacity-90">$75</p></div>
        <button onClick={() => setShowChat(true)} className="bg-blue-400 text-white p-4 rounded-xl shadow-lg hover:bg-blue-500"><MessageCircle className="mx-auto mb-2" size={24} /><p className="font-medium">Open Chat</p><p className="text-xs opacity-90">$25/session</p></button>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Now</h2>
        {aestheticians.map(d => (
          <div key={d.id} className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{d.image}</div>
              <div>
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-gray-500 text-sm">{d.specialization}</p>
                <div className="flex items-center space-x-1"><Star className="text-yellow-400 fill-current" size={16} /><span className="text-sm">{d.rating}</span></div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600 text-sm mb-2"><Clock size={16} className="mr-1" />{d.availability}</div>
              <button onClick={() => book(d)} className="bg-yellow-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-500">Book Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="flex flex-col p-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Journey</h1>
      <div className={card}>
        <h2 className="text-xl font-semibold mb-4">Add a Progress Note</h2>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="How is your skin this week?" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        <button onClick={addNote} className="w-full mt-3 bg-orange-400 text-white py-3 rounded-lg font-medium hover:bg-orange-500">Save Note</button>
        <p className="text-xs text-gray-400 mt-2">Photo upload is not implemented in this demo.</p>
      </div>
      <div className={card}>
        <h2 className="text-xl font-semibold mb-4">Treatment Updates</h2>
        <div className="space-y-3">
          {progress.map(e => (
            <div key={e.week} className="border-l-4 border-blue-400 pl-4">
              <p className="font-medium text-blue-400">Week {e.week}</p>
              <p className="text-gray-600 text-sm">{e.update}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className={card}>
        <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
        <div className="flex items-center justify-between">
          <div><p className="font-medium">Profile Mode</p><p className="text-gray-500 text-sm">Control who can see your information</p></div>
          <div className="flex space-x-2">
            <button onClick={() => setMode('private')} className={`px-4 py-2 rounded-lg text-sm ${me.profile_mode === 'private' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Private</button>
            <button onClick={() => setMode('public')} className={`px-4 py-2 rounded-lg text-sm ${me.profile_mode === 'public' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Public</button>
          </div>
        </div>
      </div>
      <div className={card}>
        <h2 className="text-xl font-semibold mb-4">Referral Program</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4"><p className="text-sm text-gray-600 mb-2">Your Referral Code:</p><p className="font-mono text-lg font-bold">{me.referral_code}</p></div>
        <button onClick={() => { navigator.clipboard?.writeText(me.referral_code); flash('Code copied'); }} className="w-full bg-yellow-400 text-white py-3 rounded-lg font-medium hover:bg-yellow-500">Copy Code</button>
      </div>
      <div className={card}>
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <p className="text-gray-500 text-sm mb-4">{me.email}</p>
        <button onClick={() => { api.logout(); setAuthed(false); setMe(null); }} className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300">Sign out</button>
      </div>
    </div>
  );

  const content = { consultations: renderConsultations, progress: renderProgress, profile: renderProfile }[activeTab] || renderHome;
  const tabs = [['home', Home, 'Home'], ['consultations', Users, 'Consults'], ['progress', LineChart, 'Progress'], ['profile', Settings, 'Profile']];

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col relative max-w-2xl mx-auto">
      {error && <div className="bg-red-100 text-red-700 text-sm p-3">{error}</div>}
      <div className="flex-1 overflow-y-auto pb-20">{content()}</div>

      {toast && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg z-50">{toast}</div>}

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-2xl h-3/4 rounded-t-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b"><h3 className="font-semibold">Chat with Dr. Sarah</h3><button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">✕</button></div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-lg ${m.sender === 'You' ? 'bg-orange-400 text-white' : 'bg-gray-200'}`}><p className="text-sm">{m.message}</p><p className="text-xs opacity-70 mt-1">{m.time}</p></div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex space-x-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <button onClick={sendMessage} className="bg-orange-400 text-white p-2 rounded-lg hover:bg-orange-500"><Send size={20} /></button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl border-t border-gray-200">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
          {tabs.map(([id, Icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === id ? 'text-orange-400' : 'text-gray-400'}`}>
              <Icon size={24} /><span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
