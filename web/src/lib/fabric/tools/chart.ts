import { Canvas, FabricImage } from "fabric";
export type ChartType = "bar" | "line" | "pie" | "donut";
export interface ChartData { labels: string[]; values: number[]; colors?: string[]; }
const COLORS = ["#4A90E2","#7ED321","#F5A623","#D0021B","#9013FE","#4CAF50","#FF5722"];

export async function addChart(canvas: Canvas, type: ChartType, data: ChartData): Promise<void> {
  const svg = buildSVG(type, data);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = await FabricImage.fromURL(url);
  img.set({ left: 100, top: 100, scaleX: 0.6, scaleY: 0.6 });
  canvas.add(img); canvas.setActiveObject(img); canvas.renderAll();
  URL.revokeObjectURL(url);
}

function buildSVG(type: ChartType, data: ChartData): string {
  const W=600,H=400,PAD=50;
  const colors = data.colors ?? COLORS;
  const max = Math.max(...data.values, 1);

  if (type === "bar") {
    const bw = (W-PAD*2)/data.labels.length - 8;
    const bars = data.labels.map((l,i) => {
      const bh = (data.values[i]/max)*(H-PAD*2);
      const x = PAD+i*(bw+8), y = H-PAD-bh;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${colors[i%colors.length]}" rx="3"/>
              <text x="${x+bw/2}" y="${H-PAD+16}" text-anchor="middle" font-size="11" fill="#666">${l}</text>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:white">${bars}</svg>`;
  }
  if (type==="pie"||type==="donut") {
    const total = data.values.reduce((a,b)=>a+b,0)||1;
    const cx=W/2,cy=H/2,r=Math.min(W,H)/2-PAD,inner=type==="donut"?r*.5:0;
    let a=-Math.PI/2;
    const slices = data.values.map((v,i)=>{
      const angle=(v/total)*Math.PI*2, ea=a+angle;
      const x1=cx+Math.cos(a)*r,y1=cy+Math.sin(a)*r,x2=cx+Math.cos(ea)*r,y2=cy+Math.sin(ea)*r;
      const ix1=cx+Math.cos(a)*inner,iy1=cy+Math.sin(a)*inner,ix2=cx+Math.cos(ea)*inner,iy2=cy+Math.sin(ea)*inner;
      const lg=angle>Math.PI?1:0;
      const d=type==="donut"
        ?`M${ix1} ${iy1}A${inner} ${inner} 0 ${lg} 1 ${ix2} ${iy2}L${x2} ${y2}A${r} ${r} 0 ${lg} 0 ${x1} ${y1}Z`
        :`M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${lg} 1 ${x2} ${y2}Z`;
      a=ea;
      return `<path d="${d}" fill="${colors[i%colors.length]}"/>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:white">${slices}</svg>`;
  }
  const pts=data.values.map((v,i)=>{
    const x=PAD+(i/(data.labels.length-1||1))*(W-PAD*2);
    const y=H-PAD-(v/max)*(H-PAD*2);
    return `${x},${y}`;
  }).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:white">
    <polyline points="${pts}" fill="none" stroke="${colors[0]}" stroke-width="2.5"/>
    ${data.values.map((v,i)=>{
      const x=PAD+(i/(data.labels.length-1||1))*(W-PAD*2),y=H-PAD-(v/max)*(H-PAD*2);
      return `<circle cx="${x}" cy="${y}" r="4" fill="${colors[0]}"/>`;
    }).join("")}
  </svg>`;
}
