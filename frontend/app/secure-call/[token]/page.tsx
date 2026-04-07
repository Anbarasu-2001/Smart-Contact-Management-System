'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/utils/api';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import socketService from '@/utils/socketService';

export default function SecureCallPage() {
    const params = useParams();
    const token = params?.token as string;

    const [status, setStatus] = useState<'loading' | 'active' | 'expired'>('loading');
    const [calling, setCalling] = useState(false);

    useEffect(() => {
        if (!token) return;
        
        const fetchStatus = async () => {
            try {
                // Ensure the token resolves returning NO sender details.
                const res = await api.get(`/share/${token}`);
                setStatus('active');
                
                // Join temporary secure WebRTC/Socket channel room.
                socketService.emit('joinSecureRoom', token);
            } catch (err: any) {
                setStatus('expired');
            }
        };

        fetchStatus();
    }, [token]);

    const handleStartCall = () => {
        setCalling(true);
        socketService.emit('startCall', { token });
        // The sender will receive this event and negotiate a WebRTC connection
    };

    if (status === 'loading') {
        return <div className="flex h-screen items-center justify-center text-cyan-400">Verifying link...</div>;
    }

    if (status === 'expired') {
        return (
            <div className="flex h-[80vh] items-center justify-center p-4">
                <Card className="glass-panel-strong w-full max-w-md border border-red-500/30 bg-red-900/10">
                    <CardHeader className="flex gap-3 justify-center pb-0 pt-6">
                        <i className="fas fa-lock text-3xl text-red-500" />
                        <div className="flex flex-col text-center">
                            <p className="text-xl text-slate-100 font-bold">Link Expired</p>
                            <p className="text-sm text-red-400/80">This secure link is no longer valid or has been revoked.</p>
                        </div>
                    </CardHeader>
                    <CardBody className="py-6 flex flex-col justify-center items-center">
                       <p className="text-slate-400">Communication cannot be established.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-[100vh] items-center justify-center p-4 container mx-auto bg-gradient-to-br from-slate-900 to-black">
            <Card className="glass-panel-strong max-w-xl w-full border border-cyan-500/40 neon-border p-6 text-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                 <div className="text-5xl text-cyan-400 mb-6 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                    <i className="fas fa-shield-halved" />
                 </div>
                 <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                     Secure Call Session
                 </h2>
                 <p className="app-muted mb-8 text-lg">
                    This link is valid for limited time and provides an anonymous connection. 
                 </p>

                 {calling ? (
                     <div className="animate-pulse flex flex-col items-center">
                        <i className="fas fa-phone-volume text-4xl text-green-400 mb-4" />
                        <h3 className="text-xl text-green-300">Ringing...</h3>
                        <p className="app-muted text-sm mt-2">Waiting for the other party to accept</p>
                     </div>
                 ) : (
                    <Button 
                        onPress={handleStartCall}
                        className="bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/50 w-full h-16 text-xl rounded-2xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                        startContent={<i className="fas fa-phone mr-2" />}
                    >
                        Start Call
                    </Button>
                 )}
            </Card>
        </div>
    );
}