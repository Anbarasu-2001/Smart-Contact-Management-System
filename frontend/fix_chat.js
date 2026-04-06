const fs = require('fs');

const chatFile = 'app/chat/[id]/page.tsx';
let chatData = fs.readFileSync(chatFile, 'utf8');

chatData = chatData.replace(
  'socketService.on("receiveMessage", handleReceiveMessage);',
  `socketService.on("receiveMessage", handleReceiveMessage);
      socketService.on("newMessage", handleReceiveMessage);`
);

chatData = chatData.replace(
  'socketService.on("typing", (data: any) => {\n        if (data.from === contactId) setIsTyping(true);\n      });',
  `socketService.on("typing", (data: any) => {
        if (data.from === contactId || data.userId === authUser?._id) setIsTyping(true);
      });`
);

chatData = chatData.replace(
  'socketService.on("stopTyping", (data: any) => {\n        if (data.from === contactId) setIsTyping(false);\n      });',
  `socketService.on("stopTyping", (data: any) => {
        if (data.from === contactId || data.userId === authUser?._id) setIsTyping(false);
      });`
);

chatData = chatData.replace(
  'socketService.off("receiveMessage");',
  'socketService.off("receiveMessage");\n      socketService.off("newMessage");'
);

chatData = chatData.replace(
  'socketService.emit("sendMessage", {\n        to: contactId,\n        message: sentMsg,\n      });',
  `socketService.emit("sendMessage", {
        to: contactId,
        message: sentMsg,
      });
      socketService.emit("send-message", {
        contactId: contactId,
        text: sentMsg.text,
        messageType: sentMsg.type,
      });`
);

fs.writeFileSync(chatFile, chatData);

const callFile = 'app/call/[id]/page.tsx';
if (fs.existsSync(callFile)) {
  let callData = fs.readFileSync(callFile, 'utf8');

  callData = callData.replace(
    'socketService.emit("callUser", {',
    `socketService.emit("call-user", {
      to: contactId,
      from: authUser._id,
      fromName: authUser.name,
      type: "audio",
      offer: "simulated_webrtc_offer"
    });
    socketService.emit("callUser", {`
  );

  callData = callData.replace(
    'socketService.on("incomingCall", (data: any) => {\n      setCallStatus("Incoming call from " + (data.fromName || "Unknown"));\n    });',
    `socketService.on("incomingCall", (data: any) => {
      setCallStatus("Incoming call from " + (data.fromName || "Unknown"));
    });
    socketService.on("incoming-call", (data: any) => {
      setCallStatus("Incoming call from " + (data.fromName || "Unknown"));
    });`
  );

  callData = callData.replace(
    'socketService.on("callAccepted", () => setCallStatus("Connected"));',
    'socketService.on("callAccepted", () => setCallStatus("Connected"));\n    socketService.on("call-accepted", () => setCallStatus("Connected"));'
  );

  callData = callData.replace(
    'socketService.on("callEnded", () => {\n      setCallStatus("Call Ended");\n      setTimeout(() => router.back(), 2000);\n    });',
    `socketService.on("callEnded", () => {
      setCallStatus("Call Ended");
      setTimeout(() => router.back(), 2000);
    });
    socketService.on("call-ended", () => {
      setCallStatus("Call Ended");
      setTimeout(() => router.back(), 2000);
    });`
  );

  callData = callData.replace(
    'socketService.off("incomingCall");',
    'socketService.off("incomingCall");\n      socketService.off("incoming-call");'
  );
  callData = callData.replace(
    'socketService.off("callAccepted");',
    'socketService.off("callAccepted");\n      socketService.off("call-accepted");'
  );
  callData = callData.replace(
    'socketService.off("callEnded");',
    'socketService.off("callEnded");\n      socketService.off("call-ended");'
  );

  callData = callData.replace(
    'socketService.emit("endCall", { to: contactId });',
    'socketService.emit("endCall", { to: contactId });\n    socketService.emit("end-call", { to: contactId });'
  );
  callData = callData.replace(
    'socketService.emit("endCall", { to: contactId });',
    'socketService.emit("endCall", { to: contactId });\n    socketService.emit("end-call", { to: contactId });'
  );

  callData = callData.replace(
    'socketService.emit("acceptCall", { to: contactId, answer: "simulated_webrtc_answer" });',
    'socketService.emit("acceptCall", { to: contactId, answer: "simulated_webrtc_answer" });\n    socketService.emit("accept-call", { to: contactId, answer: "simulated_webrtc_answer" });'
  );

  fs.writeFileSync(callFile, callData);
}
console.log("Done");