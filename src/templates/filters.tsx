import { useState } from "react";
import { Search } from "lucide-react";
import { templates } from "./data";
import { ui, type LanguageCode } from "../i18n/languages";

export const templateCategories = [
  "All templates",
  "Planning",
  "Brainstorming",
  "Engineering",
  "Education",
  "In Hindi",
] as const;
export type TemplateCategory = (typeof templateCategories)[number];

export function useTemplateFilter() {
  const [category, setCategory] = useState<TemplateCategory>("All templates");
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const visible = templates.filter(
    (t) =>
      (category === "All templates" ||
        (category === "In Hindi"
          ? t.language === "hi"
          : t.category === category)) &&
      `${t.name} ${t.description} ${t.category}`
        .toLocaleLowerCase()
        .includes(needle),
  );
  return { category, setCategory, query, setQuery, visible };
}

export function TemplateFilters({
  filter,
  language,
}: {
  filter: ReturnType<typeof useTemplateFilter>;
  language: LanguageCode;
}) {
  return (
    <div className="gallery-controls">
      <div
        className="filter-tabs"
        role="group"
        aria-label={ui("Template category", language)}
      >
        {templateCategories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter.category === c}
            className={filter.category === c ? "active" : ""}
            onClick={() => filter.setCategory(c)}
          >
            {ui(c, language)}
          </button>
        ))}
      </div>
      <label className="template-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label={ui("Search templates", language)}
          placeholder={ui("Search templates…", language)}
          value={filter.query}
          onChange={(e) => filter.setQuery(e.target.value)}
        />
      </label>
    </div>
  );
}
