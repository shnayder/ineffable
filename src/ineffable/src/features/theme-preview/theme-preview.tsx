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
          <div className="p-4 bg-surface-bg-body border border-surface-border-base">
            surface-bg-body
          </div>
          <div className="p-4 bg-surface-bg-base border border-surface-border-base">
            surface-bg-base
          </div>
          <div className="p-4 bg-surface-bg-overlay border border-surface-border-overlay">
            surface-bg-overlay with overlay border
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
        <h2 className="text-lg font-semibold py-2">Text</h2>
        <p className="text-neutral-fg-strong">Strong text</p>
        <p className="text-neutral-fg">Default text = medium</p>
        <p className="text-neutral-fg-subtle">Muted text (comments)</p>
        <p className="text-neutral-fg-dimmed">Dimmed hint text</p>
      </section>


      {/* Highlights */}
      <section>
        <h2 className="text-lg font-semibold py-2">Highlights</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-highlight">Highlight</div>
          <div className="p-4 border-b border-b-neutral-fg-accent1">Accent 1</div>
          <div className="p-4 border-b border-b-neutral-fg-accent2">Accent 2</div>
          <div className="p-4 border-b border-b-neutral-fg-accent3">Accent 3</div>
        </div>
      </section>


      {/* Primary colors */}
      <section>
        <h2 className="text-lg font-semibold py-2">Primary Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 text-primary-fg bg-primary-bg">Primary</div>
          <div className="p-4 text-primary-fg-hover bg-primary-bg-hover">Primary hover</div>
          <div className="p-4 text-primary-fg-active bg-primary-bg-active">Primary active</div>
          <div className="p-4 text-primary-fg-inactive bg-primary-bg-inactive">Primary inactive</div>
        </div>
      </section>
   </div>
  );
}
