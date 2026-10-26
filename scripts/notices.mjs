import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
const inventory = JSON.parse(
  await readFile("docs/dependency-licenses.json", "utf8"),
);
let notices =
  "# Dependency license texts\n\nGenerated from the installed lockfile. Brand artwork is excluded.\n";
for (const packages of Object.values(inventory))
  for (const pkg of packages) {
    for (const base of pkg.paths ?? [])
      try {
        const names = await readdir(base);
        for (const name of names.filter((n) =>
          /^(license|licence|notice|copying)(\.|$)/i.test(n),
        )) {
          try {
            const body = await readFile(join(base, name), "utf8");
            notices += `\n\n---\n## ${pkg.name} ${pkg.versions.join(", ")} — ${name}\n\n${body}\n`;
          } catch {
            /* Directories are not license texts. */
          }
        }
      } catch {
        /* Inventory path no longer available. */
      }
    delete pkg.paths;
  }
await mkdir("docs", { recursive: true });
await writeFile("docs/DEPENDENCY_LICENSE_TEXTS.md", notices);
await writeFile(
  "docs/dependency-licenses.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
