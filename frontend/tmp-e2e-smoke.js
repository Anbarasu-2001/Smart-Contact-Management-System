const axios = require('axios');
const { io } = require('socket.io-client');
const crypto = require('crypto');

(async () => {
  const base = 'http://localhost:5000';
  const pw = 'Pass1234!';

  async function createFreshUser(name, tag) {
    for (let i = 0; i < 10; i++) {
      const email = `e2e_${tag}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}@test.local`;
      try {
        console.log('register attempt', tag, email);
        await axios.post(`${base}/api/auth/register`, { name, email, password: pw });
        const login = await axios.post(`${base}/api/auth/login`, { email, password: pw });
        const token = login.data.token;
        const me = await axios.get(`${base}/api/auth/user`, {
          headers: { 'x-auth-token': token, Authorization: `Bearer ${token}` },
        });
        return { email, token, user: me.data };
      } catch (e) {
        const msg = e.response?.data?.msg;
        console.log('register/login fail', tag, e.response?.status, e.response?.data || e.message);
        if (e.response?.status === 400 && msg === 'User already exists') continue;
        throw e;
      }
    }
    throw new Error('Could not create fresh user after retries');
  }

  console.log('step users');
  const u1 = await createFreshUser('E2E One', 'one');
  const u2 = await createFreshUser('E2E Two', 'two');

  const h1 = { 'x-auth-token': u1.token, Authorization: `Bearer ${u1.token}` };

  console.log('step contact create');
  const contactRes = await axios.post(
    `${base}/api/contacts`,
    {
      name: 'E2E Contact Two',
      phone: `+1555${String(Date.now()).slice(-6)}`,
      purpose: 'test',
      priority: 'medium',
    },
    { headers: h1 }
  );

  const contactId = contactRes.data._id;
  console.log('step contact fetch');
  const getContact = await axios.get(`${base}/api/contacts/${contactId}`, { headers: h1 });

  console.log('step message api');
  const apiMsg = await axios.post(
    `${base}/api/messages`,
    { contactId, text: 'api message smoke', clientMessageId: `api-${Date.now()}` },
    { headers: h1 }
  );

  console.log('step socket connect/send');
  const socket = io(base, {
    transports: ['websocket'],
    auth: { token: u1.token, userId: u1.user._id },
  });

  const socketResult = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('socket timeout waiting for new-message')), 12000);

    socket.on('connect', () => {
      socket.emit('join-chat', { contactId });
      socket.once('new-message', (m) => {
        clearTimeout(t);
        resolve(m);
      });
      socket.emit('send-message', {
        contactId,
        text: 'socket message smoke',
        clientMessageId: `sock-${Date.now()}`,
      });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });

  console.log('step reminder due');
  const reminderDue = await new Promise(async (resolve, reject) => {
    const t = setTimeout(() => reject(new Error('reminder timeout >45s')), 45000);

    socket.once('reminder-due', (r) => {
      clearTimeout(t);
      resolve(r);
    });

    await axios.post(
      `${base}/api/reminders`,
      { message: 'e2e reminder', remindAt: new Date(Date.now() - 1000).toISOString(), repeat: 'none' },
      { headers: h1 }
    );
  });

  socket.disconnect();

  console.log(JSON.stringify({
    ok: true,
    user1: u1.email,
    user2: u2.email,
    contactFetched: !!getContact.data?._id,
    apiMessage: apiMsg.data?.text,
    socketMessage: socketResult?.text,
    reminderMessage: reminderDue?.message,
  }, null, 2));
})().catch((err) => {
  const out = {
    ok: false,
    message: err.message,
    status: err.response?.status,
    data: err.response?.data,
    stack: err.stack,
  };
  console.error(JSON.stringify(out, null, 2));
  process.exit(1);
});
