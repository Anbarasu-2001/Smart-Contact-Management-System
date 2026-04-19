const renderChats = () => (
        <main className="p-6">
        <div className="fade-in min-h-[560px] w-full px-0 justify-start items-start">
            {!activeChatId && (
                <div className="glass-panel p-3">
                <h3 className="text-lg font-semibold neon-title px-2 py-2">Chat List</h3>
                <div className="flex flex-col gap-6">
                    {sortedChatThreads.length === 0 && <p className="text-sm app-muted p-2">No chats yet. Start a conversation from Contacts.</p>}
                    {sortedChatThreads.map((thread) => (
                        <div
                            key={thread.id}
                            role="button"
                            tabIndex={0}
                            className="w-full text-left glass-card p-3 cursor-pointer"
                            onClick={() => openChat({ id: thread.id, name: thread.name })}
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                openChat({ id: thread.id, name: thread.name });
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 min-w-0">
                                    <div className="avatar-orb !w-10 !h-10">{(thread.name?.charAt(0) || 'U').toUpperCase()}</div>
                                    <p className="font-semibold truncate">{thread.name}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    {thread.isPinned && <i className="fas fa-thumbtack text-amber-300 text-xs" />}
                                    <span className="text-xs app-muted">{thread.time}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm app-muted truncate">{thread.lastMessage}</p>
                                <div className="flex items-center gap-6">
                                    {thread.unread > 0 && <span className="badge-pill">{thread.unread}</span>}
                                    <button
                                        type="button"
                                        className="glass-action !min-w-7 !w-7 !h-7 rounded-2xl backdrop-blur-xl border border-white/40"
                                        aria-label={thread.isPinned ? 'Unpin chat' : 'Pin chat'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleChatPin(thread.id);
                                        }}
                                    >
                                        <i className={`fas ${thread.isPinned ? 'fa-thumbtack' : 'fa-thumbtack'} text-[10px]`} />
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-action !min-w-7 !w-7 !h-7 rounded-2xl backdrop-blur-xl border border-white/40"
                                        aria-label={thread.isArchived ? 'Unarchive chat' : 'Archive chat'}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggleChatArchive(thread.id);
                                        }}
                                    >
                                        <i className={`fas ${thread.isArchived ? 'fa-box-open' : 'fa-box-archive'} text-[10px]`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {activeChatId && (
                <div className="fixed inset-0 z-[58] bg-slate-950/95 p-3 sm:p-4 md:p-6">
                    <div className="glass-panel h-full p-4 flex flex-col">
                <div className="flex items-center justify-between gap-6">
                    <button
                        type="button"
                        className="glass-action px-3 py-2 rounded-2xl backdrop-blur-xl border border-white/40 text-sm min-w-[80px]"
                        onClick={() => {
                            setActiveChatId('');
                        }}
                    >
                        <i className="fas fa-arrow-left" />
                        Back
                    </button>
                    <h3 className="text-lg font-semibold neon-title truncate">{currentContact?.name || 'Chat Window'}</h3>
                    <div className="flex items-center gap-6 min-w-[96px] justify-end">
                        <Button
                            isIconOnly
                            className="glass-action !min-w-9 !w-9 !h-9"
                            aria-label="Voice call"
                            onPress={() => {
                                if (!currentContactId) return;
                                void startOutgoingCall(currentContactId, 'audio', currentContact?.name || 'Unknown');
                            }}
                        >
                            <i className="fas fa-phone" />
                        </Button>
                        <Button
                            isIconOnly
                            className="glass-action !min-w-9 !w-9 !h-9"
                            aria-label="Video call"
                            onPress={() => {
                                if (!currentContactId) return;
                                void startOutgoingCall(currentContactId, 'video', currentContact?.name || 'Unknown');
                            }}
                        >
                            <i className="fas fa-video" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs app-muted">
                    {currentContactId && onlineUsers.includes(currentContactId) ? 'Online now' : 'Offline'}
                </p>
                <div className="bg-white/60 backdrop-blur-lg rounded-2xl backdrop-blur-xl border border-white/40 p-4 flex-1 min-h-0 overflow-y-auto scroll-smooth border border-white/40 flex flex-col gap-6 shadow-lg hover:shadow-xl hover:shadow-cyan-900/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:border-[#9b5cff]/30 cursor-pointer transition-all duration-300" ref={chatScrollRef}>
                    {((messagesByContact[currentContactId] || []) as ChatMessage[]).slice(-50).map((message, idx) => {
                        const isMe = String(message.senderId?._id || message.senderId) === String(user?._id);
                        return (
                        <div key={`${message._id || message.clientMessageId || idx}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border border-white/40 shadow transition-all duration-200 ${isMe ? "bg-gradient-to-br from-teal-400 via-purple-400 to-cyan-400 text-white shadow-md shadow-teal-500/20 ml-auto" : "bg-white/60 text-slate-700"}`}>
                                {message.messageType === 'contact_share' ? (
                                    <div className="smart-share-chat-card flex flex-col gap-6">
                                        {String(message.senderId?._id || message.senderId) === String(user?._id) ? (
                                            <>
                                                <p className="font-semibold text-white">[ Shared Contact ]</p>
                                                <p className="text-sm text-slate-500/90">Name: {message.sharedContactName || 'Contact'}</p>
                                                <p className="text-xs app-muted">Expires in: {formatShareExpiry(message.sharePayload?.expiresAt || message.shareExpiresAt || null)}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-white">[ 🔐 Contact Access ]</p>
                                                <p className="text-xs app-muted">Sensitive details are hidden. Use secure actions only.</p>
                                                {(() => {
                                                    const token = getShareToken(message);
                                                    const state = shareActionByToken[token] || 'idle';
                                                    const expiresAt = getShareExpiresAt(message);
                                                    const isExpired = Boolean(expiresAt && expiresAt.getTime() <= Date.now()) || state === 'expired';
                                                    const isUsed = state === 'used';
                                                    const disabled = state === 'loading' || isExpired || isUsed || state === 'invalid';

                                                    if (isExpired) {
                                                        return <p className="text-xs text-rose-300">❌ Access Expired</p>;
                                                    }
                                                    if (isUsed) {
                                                        return <p className="text-xs text-amber-300">⚠ One-time access already used</p>;
                                                    }

                                                    return (
                                                        <div className="flex items-center gap-6 pt-1">
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                className="glass-action px-3 py-1 rounded-2xl backdrop-blur-xl border border-white/40 text-xs disabled:opacity-50"
                                                                onClick={() => {
                                                                    void consumeSharedContactAction(message, 'call');
                                                                }}
                                                            >
                                                                📞 Call
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={disabled}
                                                                className="glass-action px-3 py-1 rounded-2xl backdrop-blur-xl border border-white/40 text-xs disabled:opacity-50"
                                                                onClick={() => {
                                                                    void consumeSharedContactAction(message, 'chat');
                                                                }}
                                                            >
                                                                💬 Chat
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <p>{message.text}</p>
                                        {message.isTemporary && message.expiresAt && (
                                            <p className="text-[11px] text-amber-300">Temporary message • expires {new Date(message.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        )}
                                    </div>
                                )}
                                <div className={`text-[10px] flex items-center justify-end gap-6 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {String(message.senderId?._id || message.senderId) === String(user?._id) && (
                                        <span>
                                            {message.status === 'seen' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                    })}
                    {typingByContact[currentContactId] && (
                        <div className="message-row is-them">
                            <div className="message-bubble">
                                <p className="text-sm app-muted">typing...</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-6 items-center">
                    <button
                        type="button"
                        className="glass-action px-3 rounded-2xl backdrop-blur-xl border border-white/40 text-lg"
                        title="Share contact"
                        aria-label="Open contact share generator"
                        onClick={openInlineShareSheet}
                    >
                        🔗
                    </button>
                    <label className="glass-action px-2 py-2 rounded-2xl backdrop-blur-xl border border-white/40 text-xs cursor-pointer flex items-center gap-1">
                        <i className="fas fa-paperclip" />
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            multiple={false}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !currentContactId) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    headers: { 'x-auth-token': user?.token || '' },
                                    body: formData,
                                });
                                const data = await res.json();
                                if (!data.fileUrl) return;
                                let messageType = 'file';
                                if (file.type.startsWith('image/')) messageType = 'image';
                                else if (file.type.startsWith('video/')) messageType = 'video';
                                else if (file.type.startsWith('audio/')) messageType = 'audio';
                                socketService.emit('sendMessage', {
                                    senderId: user?._id,
                                    receiverId: currentContactId,
                                    messageType,
                                    fileUrl: data.fileUrl,
                                    fileName: data.fileName,
                                    fileSize: data.fileSize,
                                });
                            }}
                        />
                        Attach
                    </label>
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            className={`glass-action px-2 py-2 rounded-2xl backdrop-blur-xl border border-white/40 text-xs ${temporaryMode ? 'ring-1 ring-amber-300/60' : ''}`}
                            onClick={() => setTemporaryMode((prev) => !prev)}
                        >
                            <i className="fas fa-hourglass-half" />
                            Temp
                        </button>
                        {temporaryMode && (
                            <select
                                className="glass-action px-2 py-2 rounded-2xl backdrop-blur-xl border border-white/40 text-xs"
                                value={String(temporaryMinutes)}
                                onChange={(event) => setTemporaryMinutes(Number(event.target.value) || 60)}
                            >
                                <option value="15">15m</option>
                                <option value="60">1h</option>
                                <option value="180">3h</option>
                                <option value="720">12h</option>
                            </select>
                        )}
                    </div>
                    <input
                        value={chatInput}
                        onChange={(event) => {
                            const value = event.target.value;
                            setChatInput(value);
                            if (!currentContactId) return;

                            if (!isTyping) {
                                setIsTyping(true);
                                socketService.emit('typing-start', { contactId: currentContactId });
                                socketService.emit('typing', currentContactId);
                            }

                            if (typingStopTimer.current) {
                                window.clearTimeout(typingStopTimer.current);
                            }

                            typingStopTimer.current = window.setTimeout(() => {
                                setIsTyping(false);
                                socketService.emit('typing-stop', { contactId: currentContactId });
                                socketService.emit('stopTyping', currentContactId);
                            }, 1200);
                        }}
                        placeholder="Type a message"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <Button
                        className="neon-action px-5"
                        onClick={() => {
                            if (!chatInput.trim() || !currentContactId) return;
                            const messageText = chatInput.trim();
                            const clientMessageId = `msg-${Date.now()}`;
                            const expiresAt = temporaryMode
                                ? new Date(Date.now() + Math.floor(temporaryMinutes) * 60 * 1000).toISOString()
                                : null;
                            const optimistic = {
                                contactId: currentContactId,
                                text: messageText,
                                sender: 'user',
                                createdAt: new Date().toISOString(),
                                clientMessageId,
                                isTemporary: temporaryMode,
                                expiresAt,
                            };
                            setMessagesByContact((prev) => ({
                                ...prev,
                                [currentContactId]: [...(prev[currentContactId] || []), optimistic],
                            }));
                            upsertSummary(currentContactId, {
                                name: currentContact?.name || 'Unknown User',
                                lastMessage: messageText,
                                updatedAt: optimistic.createdAt,
                                unreadCount: 0,
                            });
                            socketService.emit('sendMessage', {
                                senderId: user?._id,
                                receiverId: currentContactId,
                                message: messageText,
                                clientMessageId,
                                expiresInMinutes: temporaryMode ? temporaryMinutes : null,
                            });
                            console.info('Message sent', clientMessageId);
                            setIsTyping(false);
                            socketService.emit('typing-stop', { contactId: currentContactId });
                            socketService.emit('stopTyping', currentContactId);
                            setChatInput('');
                        }}
                    >
                        Send
                    </Button>
                </div>
            </div>
            </div>
            )}
        </div>
        </main>
    );

    