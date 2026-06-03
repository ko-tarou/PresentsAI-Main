import type { SlideContent } from "@shared/types/slide";
export interface Template { id: string; name: string; thumbnail: string; content: SlideContent; }

export const BUILT_IN_TEMPLATES: Template[] = [
  { id:"blank", name:"ブランク", thumbnail:"⬜", content:{ version:"6.0.0", objects:[], background:"#ffffff" } },
  { id:"title", name:"タイトル", thumbnail:"📋", content:{ version:"6.0.0", background:"#3B5BDB", objects:[
    { type:"textbox",version:"6.0.0",left:100,top:260,width:1080,fontSize:56,fontWeight:"bold",fill:"#ffffff",textAlign:"center",text:"プレゼンテーションタイトル" },
    { type:"textbox",version:"6.0.0",left:100,top:360,width:1080,fontSize:28,fill:"rgba(255,255,255,0.8)",textAlign:"center",text:"サブタイトルを入力" }
  ]}},
  { id:"two-col", name:"2カラム", thumbnail:"📰", content:{ version:"6.0.0", background:"#ffffff", objects:[
    { type:"textbox",version:"6.0.0",left:60,top:40,width:1160,fontSize:36,fontWeight:"bold",fill:"#212529",text:"セクションタイトル" },
    { type:"rect",version:"6.0.0",left:60,top:120,width:550,height:520,fill:"#f1f3f5",rx:8,ry:8 },
    { type:"rect",version:"6.0.0",left:670,top:120,width:550,height:520,fill:"#f1f3f5",rx:8,ry:8 }
  ]}},
  { id:"dark", name:"ダーク", thumbnail:"🌙", content:{ version:"6.0.0", background:"#1a1b1e", objects:[
    { type:"textbox",version:"6.0.0",left:100,top:280,width:1080,fontSize:52,fontWeight:"bold",fill:"#ffffff",textAlign:"center",text:"ダークテーマスライド" }
  ]}}
];
