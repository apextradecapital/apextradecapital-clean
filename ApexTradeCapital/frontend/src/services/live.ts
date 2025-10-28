export function subscribeEvents(onMsg: (e:any)=>void) {
  const wsUrl = (import.meta as any).env.VITE_BACKEND_WS_URL || "ws://localhost:3001";
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (m) => {
    try {
      const data = JSON.parse(m.data);
      if (data.topic === "events") onMsg(data);
    } catch {}
  };
  return () => ws.close();
}

