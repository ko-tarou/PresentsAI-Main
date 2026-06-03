"use client";
import { useRef } from "react";
import { playTransition, type TransitionType } from "@lib/fabric/animation";
const TRANSITIONS: {type:TransitionType;label:string}[] = [
  {type:"none",label:"なし"},{type:"fade",label:"フェード"},
  {type:"slide-left",label:"スライド左"},{type:"slide-right",label:"スライド右"},{type:"zoom",label:"ズーム"}
];
export function TransitionPanel({ containerRef }: { containerRef: React.RefObject<HTMLDivElement|null> }) {
  const sel = useRef<TransitionType>("fade");
  return (
    <div className="p-3 border-b">
      <p className="text-xs font-medium text-gray-500 mb-2">トランジション</p>
      {TRANSITIONS.map(({type,label})=>(
        <label key={type} className="flex items-center gap-2 cursor-pointer mb-1">
          <input type="radio" name="tr" value={type} defaultChecked={type==="none"} onChange={()=>{sel.current=type;}} className="text-blue-600"/>
          <span className="text-xs">{label}</span>
        </label>
      ))}
      <button onClick={()=>containerRef.current&&playTransition(containerRef.current,sel.current)} className="mt-2 w-full rounded bg-gray-100 py-1 text-xs hover:bg-gray-200">プレビュー</button>
    </div>
  );
}
