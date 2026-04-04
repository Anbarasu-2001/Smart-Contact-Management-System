const axios = require('axios');
const { io } = require('socket.io-client');

(async () => {
  const base = 'http://localhost:5000';
  const stamp = Date.now();
  const email = `ai_${stamp}@test.local`;
  const password = 'Pass1234!';

  await axios.post(`${base}/api/auth/register`, { name: 'AI User', email, password });
  const login = await axios.post(`${base}/api/auth/login`, { email, password });
  const token = login.data.token;
  const authHeaders = { 'x-auth-token': token, Authorization: `Bearer ${token}` };

  const contact = await axios.post(`${base}/api/contacts`, {
    name: 'Emma AI',
    phone: `+1888${String(stamp).slice(-6)}`,
    purpose: 'Client Follow-up',
    priority: 'High'
  }, { headers: authHeaders });

  const contactId = contact.data._id;

  await axios.post(`${base}/api/interactions`, {
    contactId,
    type: 'message_sent',
    notes: 'Initial outreach'
  }, { headers: authHeaders });

  const msg = await axios.post(`${base}/api/messages`, {
    contactId,
    text: 'Hello from AI upgrade',
    clientMessageId: `m-${stamp}`
  }, { headers: authHeaders });

  const socket = io(base, { transports: ['websocket'], auth: { token, userId: login.data.user._id } });

  const realtime = await new Promise((resolve, reject) => {
    const out = { delivered: false, seen: false };
    const timeout = setTimeout(() => reject(new Error('Realtime timeout')), 12000);

    socket.on('connect', () => {
      socket.emit('join-chat', { contactId });
      socket.emit('mark-seen', { contactId });
    });

    socket.on('message-delivered', () => { out.delivered = true; });
    socket.on('message-seen', () => { out.seen = true; });

    setTimeout(() => {
      clearTimeout(timeout);
      resolve(out);
    }, 2500);
  });

  socket.disconnect();

  const dashboard = await axios.get(`${base}/api/dashboard`, { headers: authHeaders });
  const aiReminders = await axios.get(`${base}/api/ai-reminders`, { headers: authHeaders });

  console.log(JSON.stringify({
    ok: true,
    userId: login.data.user._id,
    contactId,
    messageId: msg.data._id,
    realtime,
    dashboard: {
      totalContacts: dashboard.data.totalContacts,
      pendingFollowUps: dashboard.data.pendingFollowUps,
      topContacts: (dashboard.data.topContacts || []).length,
      aiSuggestions: (dashboard.data.aiSuggestions || []).length
    },
    aiReminderCount: (aiReminders.data || []).length
  }, null, 2));
})().catch((err) => {
  console.error(JSON.stringify({ ok: false, message: err.message, status: err.response?.status, data: err.response?.data }, null, 2));
  process.exit(1);
});
