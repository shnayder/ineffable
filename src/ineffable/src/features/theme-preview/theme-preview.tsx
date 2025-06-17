// List of colors to show. We'll filter by names below.
let color_roles = ["surface", "base", "inverted", "black", "white", "input", "link", "primary", "neutral", "notice", "negative", "secondary", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6"]
let colors = [
  "surface-bg-body",
  "surface-bg-base",
  "surface-bg-overlay",
  "surface-bg-overlay-hover",
  "surface-bg-overlay-active",
  "surface-border",
  "surface-border-focus",

  "base-fg-body",

  "base-fg-highlight",
  ]


export default function ThemePreview() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex flex-col">Theme Preview</h1>

      {/* Surfaces */}
      <section>
        <h2 className="text-lg font-semibold">Surfaces</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-surface-bg-body border border-border">
            surface-bg-body
          </div>
          <div className="p-4 bg-surface-bg-base border border-border">
            surface-bg-base
          </div>
          <div className="p-4 bg-surface-bg-overlay border border-border">
            surface-bg-overlay
          </div>
          <div className="p-4 bg-surface-bg-overlay-hover border border-border">
            surface-bg-overlay-hover
          </div>
          <div className="p-4 bg-surface-bg-overlay border border-surface-border-focus">
            surface-bg-overlay with surface-border-focus
          </div>

        </div>
      </section>

      {/* Text */}
      <section>
        <h2 className="text-lg font-semibold">Text</h2>
        <p className="text-text">Default text</p>
        <p className="text-text-muted">Muted text (comments)</p>
        <p className="text-text-subtle">Subtle hint text</p>
        <p className="bg-text-inverted text-white p-2">
          Inverted text on dark background
        </p>
      </section>

      {/* Surfaces */}
      <section>
        <h2 className="text-lg font-semibold">Surfaces</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-surface border border-border">
            Default surface
          </div>
          <div className="p-4 bg-surface-hover border border-border">
            Hover surface
          </div>
          <div className="p-4 bg-surface-selected border border-border">
            Selected surface
          </div>
        </div>
      </section>

      {/* Semantic colors */}
      <section>
        <h2 className="text-lg font-semibold">Semantic Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-primary text-white">Primary</div>
          <div className="p-4 bg-success text-white">Success</div>
          <div className="p-4 bg-warning text-white">Warning</div>
          <div className="p-4 bg-error text-white">Error</div>
        </div>
      </section>

      {/* Highlights */}
      <section>
        <h2 className="text-lg font-semibold">Highlights</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-highlight-yellow">Highlight Yellow</div>
          <div className="p-4 bg-highlight-blue">Highlight Blue</div>
          <div className="p-4 bg-highlight-pink">Highlight Pink</div>
        </div>
      </section>
   </div>
  );
}
