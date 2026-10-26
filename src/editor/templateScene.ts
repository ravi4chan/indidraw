import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { edgePoints, nodeSize, type Template } from "../templates/data";
import { labelFont } from "./labelFont";
export function templateElements(template: Template) {
  const shapes = template.nodes.map((node) => {
    const { w, h } = nodeSize(node);
    return {
      type: node.shape ?? "rectangle",
      id: node.id,
      x: node.x,
      y: node.y,
      width: w,
      height: h,
      backgroundColor: node.color,
      strokeColor: "#3d506e",
      fillStyle: "solid" as const,
      roughness: 1,
      roundness: { type: 3 as const },
      label: {
        text: node.label,
        fontSize: 18,
        fontFamily: labelFont(node.label),
      },
    };
  });
  const arrows = template.edges.map(([a, b]) => {
    const p = edgePoints(template, a, b);
    return {
      type: "arrow" as const,
      x: p.x1,
      y: p.y1,
      points: [
        [0, 0],
        [p.x2 - p.x1, p.y2 - p.y1],
      ] as [number, number][],
      strokeColor: "#657891",
      roughness: 1,
      endArrowhead: "arrow" as const,
    };
  });
  return convertToExcalidrawElements([...shapes, ...arrows]);
}
