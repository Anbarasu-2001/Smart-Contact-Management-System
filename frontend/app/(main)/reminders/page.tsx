'use client';

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/context/auth/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Divider } from '@heroui/divider';

interface Reminder {
  _id: string;
  message: string;
  remindAt: string;
  isActive: boolean;
  contactId?: any;
}

interface AIReminder {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function RemindersPage() {
  const authContext = useContext(AuthContext);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [aiReminders, setAiReminders] = useState<AIReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual form
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!authContext?.token) return;
    fetchData();
  }, [authContext?.token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [manRes, aiRes] = await Promise.all([
        axios.get('/api/reminders', { headers: { Authorization: `Bearer ${authContext?.token}` } }),
        axios.get('/api/ai-reminders', { headers: { Authorization: `Bearer ${authContext?.token}` } }),
      ]);
      setReminders(manRes.data);
      setAiReminders(aiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !time) return;
    
    try {
      const res = await axios.post('/api/reminders', {
        message,
        remindAt: new Date(time).toISOString(), // user selects locally
      }, { headers: { Authorization: `Bearer ${authContext?.token}` } });
      setReminders([...reminders, res.data]);
      setMessage('');
      setTime('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleManual = async (id: string) => {
    try {
      await axios.patch(`/api/reminders/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${authContext?.token}` } });
      setReminders(reminders.map(r => r._id === id ? { ...r, isActive: !r.isActive } : r));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* AI Suggestion Panel */}
      <div className="md:w-1/3 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
          <i className="fas fa-robot"></i> AI Suggestions
        </h2>
        {aiReminders.length === 0 && <p className="text-gray-500 text-sm">No AI suggestions right now.</p>}
        {aiReminders.map(ai => (
           <Card key={ai._id} className="bg-purple-50 dark:bg-purple-900 border border-purple-200 shadow-sm">
             <CardBody>
                <div className="flex gap-2 items-start">
                   <i className="fas fa-magic text-purple-500"></i>
                   <div>
                     <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{ai.message}</p>
                     <span className="text-xs text-gray-500 block">
                       {new Date(ai.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                </div>
             </CardBody>
           </Card>
        ))}
      </div>

      <Divider orientation="vertical" className="hidden md:block" />

      {/* Manual Reminders Panel */}
      <div className="md:w-2/3 flex flex-col gap-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-bell"></i> My Reminders
        </h2>

        <Card className="shadow">
          <CardHeader className="font-semibold px-6 pt-5 pb-2">Create New Reminder</CardHeader>
          <CardBody className="px-6 pb-6">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input 
                autoFocus 
                label="Reminder Title / Message" 
                placeholder="e.g. Call client about contract" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
              />
              <Input 
                type="datetime-local" 
                label="Remind Me At" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                required 
              />
              <Button type="submit" color="primary" className="font-bold w-1/3">Set Reminder</Button>
            </form>
          </CardBody>
        </Card>

        {/* Existing Reminders */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-gray-600">Upcoming ({reminders.filter(r => r.isActive).length})</h3>
          {reminders.filter(r => r.isActive).map(r => (
            <Card key={r._id} className="border-l-4 border-l-primary">
              <CardBody className="flex flex-row justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{r.message}</p>
                  <p className="text-xs text-gray-500">
                    <i className="far fa-clock"></i>
                    {new Date(r.remindAt).toLocaleString()}
                  </p>
                </div>
                <Button isIconOnly color="danger" size="sm" variant="light" onPress={() => toggleManual(r._id)}>
                  <i className="fas fa-times"></i>
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}