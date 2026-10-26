import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Download,
  Github,
  Globe2,
  Heart,
  Keyboard,
  Menu,
  Moon,
  MousePointer2,
  PenLine,
  ShieldCheck,
  Sparkles,
  Sun,
  WifiOff,
  X,
} from "lucide-react";
import Diagram from "./Diagram";
import { templates } from "./templates/data";
import { useTemplateFilter, TemplateFilters } from "./templates/filters";
import { repositoryUrl } from "./config";
import {
  LanguageSelector,
  ui,
  useLanguage,
  type LanguageCode,
} from "./i18n/languages";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="brand" aria-label="IndiDraw home">
      <img className="brand-symbol" src="/branding/symbol.png" alt="" />
      {!compact && (
        <img
          className="brand-wordmark"
          src="/branding/wordmark.png"
          alt="IndiDraw"
        />
      )}
    </a>
  );
}
export function ThemeButton({ language = "en" }: { language?: LanguageCode }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("indidraw-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("indidraw-theme", dark ? "dark" : "light");
    } catch {
      /* Theme is still usable when browser storage is denied. */
    }
  }, [dark]);
  return (
    <button
      className="icon-button"
      aria-label={ui(dark ? "Use light theme" : "Use dark theme", language)}
      onClick={() => setDark(!dark)}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
// Four reasons, led by what makes IndiDraw different.
const features = [
  {
    icon: Globe2,
    title: "Your language, your script",
    text: "Menus in six languages and bundled fonts for Devanagari, Telugu, Bengali and Tamil, so labels and exports look right.",
    label: "Indian languages",
  },
  {
    icon: Keyboard,
    title: "Type Hindi with any keyboard",
    text: "Type namaste and get नमस्ते. Pick another spelling with one key, or use your device’s Hindi keyboard.",
    label: "Phonetic typing",
  },
  {
    icon: ShieldCheck,
    title: "Private and offline",
    text: "No signup, no tracking. Drawings save on your device and keep working without internet.",
    label: "Private by default",
  },
  {
    icon: Download,
    title: "Free, open and yours to keep",
    text: "Export PNG, SVG or editable Excalidraw files. Built on open-source Excalidraw, free forever.",
    label: "Free & open source",
  },
];
const scripts = [
  ["हिन्दी", "hi"],
  ["తెలుగు", "te"],
  ["বাংলা", "bn"],
  ["தமிழ்", "ta"],
  ["मराठी", "mr"],
  ["English", "en"],
] as const;
type Page = { language: LanguageCode };
function Header({
  language,
  setLanguage,
}: Page & { setLanguage: (code: LanguageCode) => void }) {
  const [open, setOpen] = useState(false);
  const tr = (text: string) => ui(text, language);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav
          aria-label={tr("Main navigation")}
          className={open ? "nav open" : "nav"}
        >
          <a
            href="/"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            {tr("Home")}
          </a>
          <a href="/draw">{tr("Draw")}</a>
          <a
            href="/templates"
            aria-current={
              location.pathname === "/templates" ? "page" : undefined
            }
          >
            {tr("Templates")}
          </a>
          <a href="/#features">{tr("Features")}</a>
          <a href="/about">{tr("About")}</a>
          {repositoryUrl() && (
            <a href={repositoryUrl()} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={13} />
            </a>
          )}
        </nav>
        <div className="header-actions">
          <LanguageSelector value={language} onChange={setLanguage} />
          <ThemeButton language={language} />
          <a href="/draw" className="button primary small">
            {tr("Start Drawing")}{" "}
            <span className="free-label">{tr("— Free")}</span>
            <ArrowUpRight size={16} />
          </a>
          <button
            aria-label={tr("Toggle navigation")}
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
function Footer({ language }: Page) {
  const tr = (text: string) => ui(text, language);
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Brand />
          <p>{tr("Where ideas take shape.")}</p>
          <small>{tr("Made in India. Open to the World.")}</small>
        </div>
        <div>
          <span className="footer-label">{tr("CREATE")}</span>
          <a href="/draw">{tr("Start drawing")}</a>
          <a href="/templates">{tr("Explore templates")}</a>
          <a href="/#features">{tr("Features")}</a>
        </div>
        <div>
          <span className="footer-label">INDIDRAW</span>
          <a href="/about">{tr("Our story")}</a>
          <a href="/license">{tr("License")}</a>
          <a href="/contributing">{tr("Contributing")}</a>
          {repositoryUrl() && <a href={repositoryUrl()}>GitHub ↗</a>}
        </div>
        <div>
          <span className="footer-label">{tr("THE LITTLE THINGS")}</span>
          <a href="/privacy">{tr("Privacy")}</a>
          <a href="/terms">{tr("Terms")}</a>
          <span className="founder">A Soldier’s Enterprise</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} IndiDraw.{" "}
          {tr("Free to Draw. Open to Everyone.")}
        </span>
        <span>
          {tr(
            "Independent software initiative. No Indian Army or Government of India affiliation or endorsement.",
          )}
        </span>
      </div>
    </footer>
  );
}
function TemplateCard({
  template,
  language,
}: Page & { template: (typeof templates)[number] }) {
  return (
    <a
      className={`template-card category-${template.category.toLowerCase()}`}
      href={`/draw?template=${template.id}`}
    >
      <div className="template-art">
        <Diagram template={template} />
        <span className="template-open">
          <ArrowUpRight size={19} />
        </span>
      </div>
      <div className="template-info">
        <span className="eyebrow">{ui(template.category, language)}</span>
        <h3>{template.name}</h3>
        <p>{template.description}</p>
      </div>
    </a>
  );
}
/** The whole preview is one link: clicking it opens this flowchart to edit. */
function HeroPreview({ language }: Page) {
  const tr = (text: string) => ui(text, language);
  return (
    <div className="preview-wrap">
      <span className="hand-note note-left" aria-hidden="true">
        A little sketch.
        <br />A world of possibilities.
        <svg viewBox="0 0 110 60">
          <path
            d="M5 3 Q10 50 95 32 M80 24 L98 33 L83 44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </span>
      <a
        href="/draw?template=flowchart"
        className="editor-preview"
        aria-label={tr("Open this flowchart in the editor")}
      >
        <div className="preview-top">
          <div className="preview-title">
            <span className="preview-mark">i</span>
            <span>My next big idea</span>
            <ChevronDown size={13} />
          </div>
          <span className="preview-saved">
            <span /> Saved on this device
          </span>
        </div>
        <div className="preview-canvas" aria-hidden="true">
          <div className="preview-toolbar">
            <span className="selected">
              <MousePointer2 size={18} />
            </span>
            <span>▢</span>
            <span>◇</span>
            <span>○</span>
            <span>↗</span>
            <span>╱</span>
            <span>
              <PenLine size={17} />
            </span>
            <span>A</span>
            <span>▧</span>
          </div>
          <div className="preview-side">
            <span>Stroke</span>
            <div className="swatches">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>Background</span>
            <div className="swatches background">
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>Stroke width</span>
            <div className="stroke-demo">— &nbsp;━ &nbsp;▬</div>
            <span>Sloppiness</span>
            <div className="stroke-demo">╱ &nbsp;∿ &nbsp;〰</div>
          </div>
          <div className="preview-board">
            <span className="board-caption">Let’s make something great.</span>
            <Diagram template={templates[0]} hero />
            <span className="board-note">it all starts here ✧</span>
          </div>
          <div className="preview-zoom">
            − <span>100%</span> +
          </div>
        </div>
        <span className="preview-cta">
          <PenLine size={16} /> {tr("Click to edit this diagram")}
        </span>
      </a>
      <span className="hand-note note-right" aria-hidden="true">
        Your next big idea
        <br />
        belongs here.
        <svg viewBox="0 0 100 55">
          <path
            d="M90 2 Q85 45 8 32 M22 23 L6 33 L20 43"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </span>
    </div>
  );
}
const typingDemo = [
  ["namaste", "नमस्ते"],
  ["bharat", "भारत"],
  ["vidyalaya", "विद्यालय"],
  ["paani", "पानी"],
] as const;
/** Shows phonetic typing: English letters become Hindi as you type. */
function TypingDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setStep((s) => s + 1), 2200);
    return () => clearInterval(timer);
  }, []);
  const [roman, hindi] = typingDemo[step % typingDemo.length];
  return (
    <div className="typing-demo" role="img" aria-label="namaste → नमस्ते">
      <span className="typing-key" aria-hidden="true">
        {roman}
      </span>
      <ArrowRight size={22} aria-hidden="true" />
      <span className="typing-result" key={hindi} aria-hidden="true">
        {hindi}
      </span>
    </div>
  );
}
function Home({ language }: Page) {
  const tr = (text: string) => ui(text, language);
  return (
    <>
      <section className="hero">
        <div className="origin-pill">
          <span className="origin-dot" />{" "}
          {tr("A canvas for everyone. A spark from India.")}
        </div>
        <h1>
          {tr("Every great idea")}
          <br />
          {tr("starts with")}{" "}
          <span>
            {tr("a drawing.")}
            <svg viewBox="0 0 380 20" preserveAspectRatio="none">
              <path
                d="M4 13 Q155 -1 375 9 M25 18 Q190 4 355 14"
                stroke="#FF9933"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="hero-description">
          {tr(
            "A free visual workspace for diagrams, sketches and flowcharts — in your own language. No signup. Just draw.",
          )}
        </p>
        <ul className="hero-languages" aria-label={tr("Languages")}>
          {scripts.map(([name, code]) => (
            <li key={code} lang={code}>
              {name}
            </li>
          ))}
        </ul>
        <div className="hero-actions">
          <a className="button primary" href="/draw">
            {tr("Start Drawing")} <ArrowRight size={18} />
          </a>
          <a className="button secondary" href="/templates">
            {tr("Explore Templates")}{" "}
            <span className="template-button-icon">▦</span>
          </a>
        </div>
        <div className="hero-promises">
          <span>
            <Check />
            {tr("Free forever")}
          </span>
          <span>
            <Check />
            {tr("No signup needed")}
          </span>
          <span>
            <Check />
            {tr("Works offline")}
          </span>
        </div>
        <HeroPreview language={language} />
        <div className="preview-caption">
          <span className="mini-flag">
            <i />
            <i />
            <i />
          </span>{" "}
          {tr("Made in India. Open to the World.")}
        </div>
      </section>
      <section className="section languages-section" id="languages">
        <div>
          <span className="eyebrow">{tr("MADE FOR INDIA’S LANGUAGES")}</span>
          <h2>{tr("Draw and write in your own language.")}</h2>
          <p>
            {tr(
              "Switch the whole app to Hindi, Telugu, Bengali, Tamil or Marathi. Type Hindi with English letters and IndiDraw writes it in Devanagari. Labels and exports keep the right font for each script.",
            )}
          </p>
          <a className="button primary" href="/draw">
            {tr("Try it now")} <ArrowRight size={18} />
          </a>
        </div>
        <TypingDemo />
      </section>
      <section className="use-cases">
        <span>{tr("FOR THE WAY YOU THINK")}</span>
        <div>
          <span>
            <PenLine />
            {tr("Sketch an idea")}
          </span>
          <span>
            <Code2 />
            {tr("Map a system")}
          </span>
          <span>
            <Sparkles />
            {tr("Make a breakthrough")}
          </span>
          <span>
            <Heart />
            {tr("Teach something new")}
          </span>
        </div>
      </section>
      <section className="section features-section" id="features">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {tr("LESS FRICTION. MORE CREATION.")}
            </span>
            <h2>{tr("Everything you need. Nothing you don’t.")}</h2>
          </div>
        </div>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, text, label }, i) => (
            <article className="feature-card" key={title}>
              <span className={`feature-icon tone-${i % 4}`}>
                <Icon size={22} />
              </span>
              <span className="feature-label">{tr(label)}</span>
              <h3>{tr(title)}</h3>
              <p>{tr(text)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section templates-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {tr("SKIP THE BLANK-CANVAS MOMENT")}
            </span>
            <h2>{tr("A head start for your next idea.")}</h2>
          </div>
          <a className="text-link" href="/templates">
            {tr("All templates")} <ArrowRight size={17} />
          </a>
        </div>
        <div className="template-grid">
          {[
            templates[0],
            templates.find((t) => t.language === "hi") ?? templates[2],
            templates[1],
          ].map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              language={language}
            />
          ))}
        </div>
      </section>
      <section className="final-cta">
        <span className="eyebrow">{tr("YOUR CANVAS IS WAITING")}</span>
        <h2>{tr("What will you draw today?")}</h2>
        <p>
          {tr(
            "Free to use, open to improve, and yours to make something meaningful with.",
          )}
        </p>
        <div className="hero-actions">
          <a className="button primary" href="/draw">
            {tr("Start Drawing — It’s Free")} <ArrowRight size={18} />
          </a>
          <a
            className="button secondary"
            href={repositoryUrl() ?? "/contributing"}
          >
            {repositoryUrl() ? <Github size={18} /> : <Code2 size={18} />}{" "}
            {tr(repositoryUrl() ? "Explore on GitHub" : "How to contribute")}
          </a>
        </div>
      </section>
    </>
  );
}
function Gallery({ language }: Page) {
  const tr = (text: string) => ui(text, language);
  const filter = useTemplateFilter();
  return (
    <main className="section gallery">
      <span className="eyebrow">
        {tr("A LITTLE STRUCTURE. A LOT OF POSSIBILITY.")}
      </span>
      <h1>
        {tr("A starting point for")}
        <br />
        <span>{tr("something great.")}</span>
      </h1>
      <p>
        {tr(
          "Editable templates to get your thinking moving — including diagrams in Hindi. Pick one and make it yours.",
        )}
      </p>
      <TemplateFilters filter={filter} language={language} />
      <div className="template-grid">
        {filter.visible.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            language={language}
          />
        ))}
      </div>
      {!filter.visible.length && (
        <p>{tr("No templates match. Try another search.")}</p>
      )}
      <div className="gallery-foot">
        <WifiOff size={17} />{" "}
        {tr("Bundled with IndiDraw. Available offline after caching.")}
      </div>
    </main>
  );
}
const legal: Record<string, { title: string; sections: [string, string][] }> = {
  "/privacy": {
    title: "Your ideas stay yours.",
    sections: [
      [
        "Local by default",
        "IndiDraw stores drawings, titles, embedded images, and timestamps in IndexedDB on this browser. Theme preferences are stored locally. No account, analytics, or advertising trackers are included.",
      ],
      [
        "Network requests",
        "The app downloads its code, fonts, and templates from the hosting origin. The hosting provider may process ordinary HTTP logs. Diagram contents are not uploaded by IndiDraw. Following an external link takes you to that service.",
      ],
      [
        "Your control",
        "Export native files to back up your work. Clearing site data deletes drawings and offline caches. Browser eviction, private browsing, and device loss can also remove local data. Persistent storage, when granted by the browser, reduces eviction risk but is not a backup.",
      ],
      [
        "Offline cache",
        "The service worker caches app assets so drawing can continue offline after the cache completes. Updating the app may require reconnecting.",
      ],
    ],
  },
  "/terms": {
    title: "Simple tools. Clear terms.",
    sections: [
      [
        "Using IndiDraw",
        "IndiDraw is a free, independent drawing application. You retain ownership of the drawings you create. You are responsible for backing up your work and ensuring you have rights to imported material.",
      ],
      [
        "No warranty",
        "Original application code is provided under the MIT license, without warranty. The application may contain defects or lose local data. These terms do not limit rights that cannot lawfully be excluded.",
      ],
      [
        "Independent initiative",
        "IndiDraw is not affiliated with or endorsed by the Indian Army or Government of India. Future cloud services are not part of this release.",
      ],
    ],
  },
  "/license": {
    title: "Open by design.",
    sections: [
      [
        "Original code",
        "IndiDraw original application code is licensed under the MIT license. The full LICENSE file and third-party notices are included in the project source.",
      ],
      [
        "Built on Excalidraw",
        "The official Excalidraw drawing engine is MIT licensed. Dependency and font copyrights and licenses remain with their respective authors. See THIRD_PARTY_NOTICES.md and bundled font notices in the source distribution.",
      ],
      [
        "Brand artwork",
        "The logo artwork was supplied by the project owner. Its provenance and redistribution rights need confirmation before a public source release; the MIT code license does not grant trademark rights.",
      ],
    ],
  },
  "/contributing": {
    title: "Make room for better ideas.",
    sections: [
      [
        "A community in the making",
        "Contributions to accessibility, testing, documentation, and reviewed translations are welcome. A public IndiDraw repository has not been configured for this build. No repository link is invented.",
      ],
      [
        "Get started",
        "The source includes CONTRIBUTING.md, development commands, test instructions, a code of conduct, and issue templates. When a repository is configured, its verified GitHub link appears in navigation.",
      ],
      [
        "What comes next",
        "First, validate Phase 1 on real devices and browsers. Cloud synchronization, team workspaces, subscriptions, and optional AI are future work and are not available in this release.",
      ],
    ],
  },
};
function About() {
  return (
    <main className="about-page">
      <section className="about-hero section">
        <span className="eyebrow">MADE IN INDIA. OPEN TO THE WORLD.</span>
        <h1>
          A little space.
          <br />
          <span>A world of ideas.</span>
        </h1>
        <p>
          We believe visual thinking should be for everyone.
          <br />
          IndiDraw makes it simple to get an idea out of your head and onto a
          canvas.
        </p>
      </section>
      <div className="prose">
        <h2>Useful technology, accessible to all.</h2>
        <p>
          IndiDraw is an independent, India-origin visual whiteboarding
          initiative. It combines a simple, welcoming workspace with the
          open-source Excalidraw drawing engine, keeping the core drawing
          experience free and available without an account.
        </p>
        <h2>Your canvas. Your control.</h2>
        <p>
          Work is saved on your device. You can create offline after the
          application is cached, export your files, and take them to a
          compatible editor. We aim for WCAG 2.2 AA in our custom interface and
          welcome feedback on making visual thinking more accessible.
        </p>
        <section className="founder-story">
          <span className="eyebrow">DISCIPLINE. SERVICE. POSSIBILITY.</span>
          <h2>A Soldier’s Enterprise</h2>
          <p>
            IndiDraw is an independent initiative founded on the belief that
            useful technology should be accessible to everyone. Inspired by the
            values of discipline, service, and problem-solving, it aims to make
            visual thinking simple, free, and open to people everywhere.
          </p>
          <small>
            IndiDraw is not affiliated with or endorsed by the Indian Army or
            Government of India.
          </small>
        </section>
        <h2>Free to Draw. Open to Everyone.</h2>
        <p>
          The free editor comes first. Future optional cloud services may
          support this work, but ordinary drawing will not require a
          subscription. Our next step is a reliable, community-tested
          foundation.
        </p>
        <a className="button primary" href="/draw">
          Find your canvas <ArrowRight size={17} />
        </a>
      </div>
    </main>
  );
}
export default function App() {
  const path = location.pathname;
  const page = legal[path];
  // Shared with the editor: choosing Hindi here opens /draw in Hindi too.
  const { language, setLanguage } = useLanguage();
  return (
    <>
      <a className="skip-link" href="#main">
        {ui("Skip to content", language)}
      </a>
      <Header language={language} setLanguage={setLanguage} />
      <div
        id="main"
        // Only the home page and gallery are translated so far.
        lang={path === "/" || path === "/templates" ? language : "en"}
      >
        {path === "/" ? (
          <Home language={language} />
        ) : path === "/templates" ? (
          <Gallery language={language} />
        ) : path === "/about" ? (
          <About />
        ) : page ? (
          <main className="prose legal-page">
            <span className="eyebrow">INDIDRAW / {path.slice(1)}</span>
            <h1>{page.title}</h1>
            {page.sections.map(([title, body]) => (
              <section key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </section>
            ))}
          </main>
        ) : (
          <main className="prose legal-page">
            <h1>This page wandered off.</h1>
            <a className="button primary" href="/">
              Back home <ArrowRight size={17} />
            </a>
          </main>
        )}
      </div>
      <Footer language={language} />
    </>
  );
}
