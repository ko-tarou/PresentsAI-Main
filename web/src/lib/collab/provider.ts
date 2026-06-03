export interface CollabMessage { type: "update"|"presence"; data: unknown; userId?: string; }

export class CollabProvider {
  private ws: WebSocket|null=null;
  private roomId: string;
  private onMsg: (m: CollabMessage)=>void;
  private timer: ReturnType<typeof setTimeout>|null=null;

  constructor(roomId: string, onMsg: (m: CollabMessage)=>void) {
    this.roomId=roomId; this.onMsg=onMsg; this.connect();
  }

  private connect() {
    const url=`${process.env.NEXT_PUBLIC_COLLAB_URL??"ws://localhost:8081"}/ws?room=${this.roomId}`;
    this.ws=new WebSocket(url);
    this.ws.onmessage=e=>{
      try { this.onMsg(JSON.parse(e.data as string) as CollabMessage); }
      catch { this.onMsg({type:"update",data:e.data}); }
    };
    this.ws.onclose=()=>{ this.timer=setTimeout(()=>this.connect(),3000); };
  }

  send(msg: CollabMessage) { if (this.ws?.readyState===WebSocket.OPEN) this.ws.send(JSON.stringify(msg)); }
  destroy() { if (this.timer) clearTimeout(this.timer); this.ws?.close(); }
}
