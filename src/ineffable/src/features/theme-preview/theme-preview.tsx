export default function ThemePreview() {
  return (
    <div className="space-y-6 p-6 bg-background text-text">
      <h1 className="text-2xl font-bold">Theme Preview</h1>

      {/* Backgrounds */}
      <section>
        <h2 className="text-lg font-semibold">Backgrounds</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background border border-border">
            bg-background
          </div>
          <div className="p-4 bg-background-subtle border border-border">
            bg-background-subtle
          </div>
          <div className="p-4 bg-background-elevated border border-border">
            bg-background-elevated
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
