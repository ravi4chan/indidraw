import { useEffect, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/**
 * Dashed outline of a previewed assistant change, drawn over the canvas
 * without touching the scene, so nothing is saved until "Apply" is pressed.
 */
export default function AssistantGhost({
  api,
  elements,
}: {
  api: ExcalidrawImperativeAPI;
  elements: readonly ExcalidrawElement[];
}) {
  const read = () => {
    const { scrollX, scrollY, zoom } = api.getAppState();
    return { scrollX, scrollY, zoom: zoom.value };
  };
  const [view, setView] = useState(read);
  useEffect(
    () =>
      api.onChange((_, state) =>
        setView((current) =>
          current.scrollX === state.scrollX &&
          current.scrollY === state.scrollY &&
          current.zoom === state.zoom.value
            ? current
            : {
                scrollX: state.scrollX,
                scrollY: state.scrollY,
                zoom: state.zoom.value,
              },
        ),
      ),
    [api],
  );
  const x = (value: number) => (value + view.scrollX) * view.zoom;
  const y = (value: number) => (value + view.scrollY) * view.zoom;
  const z = view.zoom;
  return (
    <svg className="assistant-ghost" aria-hidden="true">
      {elements.map((e) => {
        if (e.type === "arrow") {
          const [start, end] = [e.points[0], e.points.at(-1)!];
          return (
            <line
              key={e.id}
              x1={x(e.x + start[0])}
              y1={y(e.y + start[1])}
              x2={x(e.x + end[0])}
              y2={y(e.y + end[1])}
              markerEnd="url(#assistant-ghost-arrow)"
            />
          );
        }
        if (e.type === "text")
          return (
            <text
              key={e.id}
              x={x(e.x + e.width / 2)}
              y={y(e.y + e.height / 2)}
              fontSize={Math.max(10, e.fontSize * z)}
            >
              {e.text}
            </text>
          );
        const left = x(e.x),
          top = y(e.y),
          width = e.width * z,
          height = e.height * z;
        if (e.type === "ellipse")
          return (
            <ellipse
              key={e.id}
              cx={left + width / 2}
              cy={top + height / 2}
              rx={width / 2}
              ry={height / 2}
            />
          );
        if (e.type === "diamond")
          return (
            <polygon
              key={e.id}
              points={`${left + width / 2},${top} ${left + width},${top + height / 2} ${left + width / 2},${top + height} ${left},${top + height / 2}`}
            />
          );
        return (
          <rect
            key={e.id}
            x={left}
            y={top}
            width={width}
            height={height}
            rx={12 * z}
          />
        );
      })}
      <defs>
        <marker
          id="assistant-ghost-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M1 1 L8 5 L1 9" fill="none" />
        </marker>
      </defs>
    </svg>
  );
}
