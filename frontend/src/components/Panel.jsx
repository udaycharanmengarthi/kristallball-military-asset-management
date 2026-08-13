export default function Panel({ title, description, actions, children, className = "" }) {
  return (
    <div className={`rounded-lg border border-ink-600 bg-ink-800/50 shadow-panel ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
          <div>
            {title && (
              <h2 className="font-mono text-sm font-semibold uppercase tracking-widest2 text-mist-50">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-xs text-mist-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
