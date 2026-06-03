import { Canvas, FabricObject } from "fabric";

export interface ComponentDefinition {
  id: string;
  name: string;
  content: Record<string, unknown>; // Fabric.js JSON of the object
}

export class ComponentLibrary {
  private components: Map<string, ComponentDefinition> = new Map();

  register(def: ComponentDefinition) {
    this.components.set(def.id, def);
  }

  list(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  async instantiate(canvas: Canvas, id: string): Promise<FabricObject | null> {
    const def = this.components.get(id);
    if (!def) return null;
    await canvas.loadFromJSON({ version: "6.0.0", objects: [def.content] });
    const obj = canvas.getObjects().at(-1);
    if (obj) {
      (obj as FabricObject & { _componentId?: string })._componentId = id;
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
    return obj ?? null;
  }
}

export const globalComponentLibrary = new ComponentLibrary();

export async function createComponentFromSelection(
  canvas: Canvas,
  library: ComponentLibrary,
  name: string
): Promise<string | null> {
  const obj = canvas.getActiveObject();
  if (!obj) return null;
  const id = `comp-${Date.now()}`;
  const json = obj.toJSON() as Record<string, unknown>;
  library.register({ id, name, content: json });
  return id;
}
