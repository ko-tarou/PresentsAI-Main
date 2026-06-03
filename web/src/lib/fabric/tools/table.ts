import { Canvas, Group, Rect, Textbox } from "fabric";
export interface TableData { rows: number; cols: number; cells?: string[][]; }

export function addTable(canvas: Canvas, data: TableData): void {
  const cw=120,ch=36;
  const objs: (Rect|Textbox)[] = [];
  for (let r=0;r<data.rows;r++) {
    for (let c=0;c<data.cols;c++) {
      const x=c*cw,y=r*ch,header=r===0;
      objs.push(new Rect({ left:x,top:y,width:cw,height:ch, fill:header?"#3B5BDB":c%2===0?"#f8f9fa":"#ffffff", stroke:"#dee2e6",strokeWidth:1,selectable:false }));
      objs.push(new Textbox(data.cells?.[r]?.[c]??(header?`列${c+1}`:""), { left:x+6,top:y+8,width:cw-12,fontSize:13,fill:header?"#fff":"#212529",fontWeight:header?"bold":"normal",editable:true }));
    }
  }
  const group = new Group(objs, { left:80,top:80 });
  canvas.add(group); canvas.setActiveObject(group); canvas.renderAll();
}
