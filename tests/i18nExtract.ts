import ts from "typescript";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Calls whose first string argument is shown to people through ui()/tr(). */
const messageCalls = new Set([
  "ui",
  "tr",
  "notify",
  "setStatus",
  "setError",
  "setCacheStatus",
  "AssistantError",
  "uiFill",
  // Thrown messages reach people through setError(ui(saveError(e))).
  "Error",
]);
/** Object fields that hold copy, e.g. feature cards and template names. */
const textProperties = new Set([
  "title",
  "text",
  "label",
  "name",
  "description",
]);
const textAttributes = new Set(["aria-label", "title", "placeholder", "alt"]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !name.endsWith(".d.ts") ? [path] : [];
  });
}

export interface Found {
  file: string;
  line: number;
  kind: "message" | "dynamic" | "jsx-text" | "attribute" | "property";
  text: string;
}

/** Every user-visible English literal in src, found from the syntax tree. */
export function extractStrings(root: string): Found[] {
  const found: Found[] = [];
  for (const file of files(join(root, "src"))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const add = (node: ts.Node, kind: Found["kind"], text: string) =>
      found.push({
        file: file.slice(root.length + 1),
        line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        kind,
        text,
      });
    const visit = (node: ts.Node) => {
      if (
        (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
        node.arguments?.length
      ) {
        const name = ts.isIdentifier(node.expression)
          ? node.expression.text
          : undefined;
        if (name && messageCalls.has(name)) {
          // Follow conditional branches: ui(dark ? "A" : "B", language).
          const collect = (value: ts.Expression) => {
            if (
              ts.isStringLiteral(value) ||
              ts.isNoSubstitutionTemplateLiteral(value)
            ) {
              if (value.text) add(value, "message", value.text);
            } else if (ts.isTemplateExpression(value))
              add(value, "dynamic", value.getText());
            else if (ts.isConditionalExpression(value)) {
              collect(value.whenTrue);
              collect(value.whenFalse);
            } else if (ts.isParenthesizedExpression(value))
              collect(value.expression);
          };
          collect(node.arguments[0]);
        }
      }
      if (
        ts.isJsxAttribute(node) &&
        textAttributes.has(node.name.getText()) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        /[A-Za-z]{2}/.test(node.initializer.text)
      )
        add(node, "attribute", node.initializer.text);
      if (
        ts.isPropertyAssignment(node) &&
        textProperties.has(node.name.getText()) &&
        (ts.isStringLiteral(node.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(node.initializer)) &&
        /[A-Za-z]{2}/.test(node.initializer.text)
      )
        add(node, "property", node.initializer.text);
      if (ts.isJsxText(node)) {
        const text = node.text.replace(/\s+/g, " ").trim();
        if (/[A-Za-z]{2}/.test(text)) add(node, "jsx-text", text);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}
