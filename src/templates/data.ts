export type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  color?: string;
  shape?: "rectangle" | "ellipse" | "diamond";
};
export type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Set for templates whose labels are written in that language. */
  language?: "hi";
  nodes: Node[];
  edges: [string, string][];
};
const n = (
  id: string,
  label: string,
  x: number,
  y: number,
  color = "#e8eef9",
  shape: Node["shape"] = "rectangle",
): Node => ({ id, label, x, y, color, shape });
export const templates: Template[] = [
  {
    id: "flowchart",
    name: "Basic Flowchart",
    category: "Planning",
    description: "Turn the next step into a clear path forward.",
    nodes: [
      n("a", "Start here", 280, 25, "#e5f3e4", "ellipse"),
      n("b", "Your big idea", 280, 140, "#fff0db"),
      n("c", "Does it work?", 280, 270, "#fff6cd", "diamond"),
      n("d", "Make it happen", 100, 425, "#e5f3e4"),
      n("e", "Try a new angle", 470, 425),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
      ["c", "e"],
    ],
  },
  {
    id: "architecture",
    name: "Software Architecture",
    category: "Engineering",
    description: "See how every part of your system connects.",
    nodes: [
      n("a", "Web application", 280, 25),
      n("b", "API gateway", 280, 165, "#fff0db"),
      n("c", "Authentication", 60, 330, "#e5f3e4"),
      n("d", "Application server", 280, 330),
      n("e", "File storage", 500, 330, "#fff6cd"),
      n("f", "Database", 280, 490, "#f0eafa"),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["b", "d"],
      ["b", "e"],
      ["d", "f"],
    ],
  },
  {
    id: "mindmap",
    name: "Mind Map",
    category: "Brainstorming",
    description: "Give your thoughts a little room to grow.",
    nodes: [
      n("a", "A bright idea", 280, 240, "#fff0db", "ellipse"),
      n("b", "What if…", 30, 70, "#e5f3e4"),
      n("c", "Explore", 530, 70),
      n("d", "Connect", 30, 420, "#fff6cd"),
      n("e", "Build", 530, 420, "#f0eafa"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["a", "e"],
    ],
  },
  {
    id: "organization",
    name: "Organizational Chart",
    category: "Planning",
    description: "Put people and responsibilities in perspective.",
    nodes: [
      n("a", "Team lead", 280, 30, "#fff0db"),
      n("b", "Design", 60, 200),
      n("c", "Engineering", 280, 200),
      n("d", "Operations", 500, 200),
      n("e", "Research", 60, 370, "#e5f3e4"),
      n("f", "Development", 280, 370, "#e5f3e4"),
      n("g", "Delivery", 500, 370, "#e5f3e4"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["b", "e"],
      ["c", "f"],
      ["d", "g"],
    ],
  },
  {
    id: "timeline",
    name: "Project Timeline",
    category: "Planning",
    description: "From first spark to the finish line.",
    nodes: [
      n("a", "01 · Discover", 20, 120),
      n("b", "02 · Define", 245, 120, "#fff0db"),
      n("c", "03 · Build", 470, 120, "#e5f3e4"),
      n("d", "04 · Launch", 695, 120, "#fff6cd"),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
    ],
  },
  {
    id: "decision",
    name: "Decision Tree",
    category: "Planning",
    description: "Work through your options, one decision at a time.",
    nodes: [
      n("a", "Your decision", 280, 20, "#fff6cd", "diamond"),
      n("b", "Option A", 70, 210),
      n("c", "Option B", 500, 210),
      n("d", "Outcome A", 70, 390, "#e5f3e4"),
      n("e", "Outcome B", 500, 390, "#fff0db"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["b", "d"],
      ["c", "e"],
    ],
  },
  {
    id: "concept",
    name: "Classroom Concept Map",
    category: "Education",
    description: "Make a new subject easier to understand.",
    nodes: [
      n("a", "The big concept", 280, 210, "#fff0db"),
      n("b", "Definition", 30, 30),
      n("c", "Examples", 530, 30, "#e5f3e4"),
      n("d", "Connections", 30, 400, "#fff6cd"),
      n("e", "Questions", 530, 400, "#f0eafa"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["a", "e"],
    ],
  },
  {
    id: "notes",
    name: "Study Notes Diagram",
    category: "Education",
    description: "A visual home for everything you are learning.",
    nodes: [
      n("a", "Topic", 280, 20, "#fff0db"),
      n("b", "Key ideas", 30, 190),
      n("c", "Remember", 280, 190, "#fff6cd"),
      n("d", "Practice", 530, 190, "#e5f3e4"),
      n("e", "Summary", 280, 390, "#f0eafa"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["c", "e"],
    ],
  },
  {
    id: "process",
    name: "Process Workflow",
    category: "Engineering",
    description: "Get everyone on the same page, step by step.",
    nodes: [
      n("a", "Request", 20, 40),
      n("b", "Review", 245, 40, "#fff0db"),
      n("c", "Create", 470, 40, "#e5f3e4"),
      n("d", "Check", 470, 245, "#fff6cd", "diamond"),
      n("e", "Deliver", 245, 440, "#e5f3e4"),
      n("f", "Improve", 695, 440),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
      ["d", "e"],
      ["d", "f"],
    ],
  },
  {
    id: "brainstorm",
    name: "Blank Brainstorming Board",
    category: "Brainstorming",
    description: "An open invitation to your next great idea.",
    nodes: [
      { ...n("a", "Ideas", 30, 50, "#fff0db"), w: 210, h: 250 },
      { ...n("b", "Questions", 290, 50, "#e8eef9"), w: 210, h: 250 },
      { ...n("c", "Possibilities", 550, 50, "#e5f3e4"), w: 210, h: 250 },
    ],
    edges: [],
  },
  {
    id: "rainwater-hi",
    name: "वर्षा जल संचयन",
    category: "Education",
    language: "hi",
    description: "छत से बगीचे तक बारिश के पानी का सफ़र।",
    nodes: [
      n("a", "वर्षा", 280, 25, "#e8eef9", "ellipse"),
      n("b", "छत", 280, 140, "#fff0db"),
      n("c", "फ़िल्टर", 280, 255, "#fff6cd"),
      n("d", "भंडारण टंकी", 280, 370, "#e5f3e4"),
      n("e", "बगीचा", 280, 485, "#e5f3e4", "ellipse"),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
      ["d", "e"],
    ],
  },
  {
    id: "lesson-plan-hi",
    name: "पाठ योजना",
    category: "Education",
    language: "hi",
    description: "कक्षा के लिए लक्ष्य से मूल्यांकन तक की योजना।",
    nodes: [
      n("a", "सीखने का लक्ष्य", 280, 25, "#fff0db", "ellipse"),
      n("b", "परिचय", 60, 190),
      n("c", "गतिविधि", 280, 190, "#e5f3e4"),
      n("d", "चर्चा", 500, 190, "#fff6cd"),
      n("e", "मूल्यांकन", 280, 360, "#f0eafa"),
    ],
    edges: [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["c", "e"],
    ],
  },
  {
    id: "project-hi",
    name: "परियोजना योजना",
    category: "Planning",
    language: "hi",
    description: "विचार से काम तक, हर कदम साफ़।",
    nodes: [
      n("a", "विचार", 280, 25, "#e5f3e4", "ellipse"),
      n("b", "योजना बनाएँ", 280, 140, "#fff0db"),
      n("c", "क्या तैयार है?", 280, 270, "#fff6cd", "diamond"),
      n("d", "काम शुरू करें", 100, 425, "#e5f3e4"),
      n("e", "सुधार करें", 470, 425),
    ],
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
      ["c", "e"],
    ],
  },
];
export function nodeSize(node: Node) {
  return { w: node.w ?? 180, h: node.h ?? 70 };
}
export function edgePoints(template: Template, from: string, to: string) {
  const a = template.nodes.find((n) => n.id === from)!;
  const b = template.nodes.find((n) => n.id === to)!;
  const sa = nodeSize(a),
    sb = nodeSize(b);
  const horizontal = Math.abs(b.x - a.x) > Math.abs(b.y - a.y) * 1.8;
  return horizontal
    ? {
        x1: a.x + (b.x > a.x ? sa.w : 0),
        y1: a.y + sa.h / 2,
        x2: b.x + (b.x > a.x ? 0 : sb.w),
        y2: b.y + sb.h / 2,
      }
    : {
        x1: a.x + sa.w / 2,
        y1: a.y + (b.y > a.y ? sa.h : 0),
        x2: b.x + sb.w / 2,
        y2: b.y + (b.y > a.y ? 0 : sb.h),
      };
}
