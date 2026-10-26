import { useId } from "react";
import { edgePoints, nodeSize, type Template } from "./templates/data";
export default function Diagram({
  template,
  hero = false,
}: {
  template: Template;
  hero?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const width =
    Math.max(...template.nodes.map((n) => n.x + nodeSize(n).w)) + 35;
  const height =
    Math.max(...template.nodes.map((n) => n.y + nodeSize(n).h)) + 35;
  return (
    <svg
      className={hero ? "diagram hero-diagram" : "diagram"}
      viewBox={`-15 -15 ${width + 30} ${height + 30}`}
      role="img"
      aria-label={`${template.name} editable template preview`}
    >
      <defs>
        <marker
          id={id}
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path
            d="M1 1 L7 4 L1 7"
            fill="none"
            stroke="#66758c"
            strokeWidth="1.4"
          />
        </marker>
      </defs>
      {template.edges.map(([a, b]) => {
        const p = edgePoints(template, a, b);
        return (
          <path
            key={a + b}
            d={`M${p.x1} ${p.y1} C${p.x1} ${(p.y1 + p.y2) / 2},${p.x2} ${(p.y1 + p.y2) / 2},${p.x2} ${p.y2}`}
            stroke="#8390a4"
            fill="none"
            strokeWidth="1.8"
            markerEnd={`url(#${id})`}
          />
        );
      })}
      {template.nodes.map((n) => {
        const { w, h } = nodeSize(n);
        return (
          <g key={n.id}>
            {n.shape === "ellipse" ? (
              <ellipse
                cx={n.x + w / 2}
                cy={n.y + h / 2}
                rx={w / 2}
                ry={h / 2}
                fill={n.color}
                stroke="#50637e"
                strokeWidth="1.5"
              />
            ) : n.shape === "diamond" ? (
              <path
                d={`M${n.x + w / 2} ${n.y - 12} L${n.x + w + 16} ${n.y + h / 2} L${n.x + w / 2} ${n.y + h + 12} L${n.x - 16} ${n.y + h / 2} Z`}
                fill={n.color}
                stroke="#827445"
                strokeWidth="1.5"
              />
            ) : (
              <rect
                x={n.x}
                y={n.y}
                width={w}
                height={h}
                rx="9"
                fill={n.color}
                stroke="#50637e"
                strokeWidth="1.5"
              />
            )}
            <text
              x={n.x + w / 2}
              y={n.y + h / 2 + 6}
              textAnchor="middle"
              fill="#253752"
              fontSize="18"
              fontFamily="'Comic Sans MS',cursive"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
