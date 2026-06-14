/**
 * PageLayout — consistent page wrapper used by every page.
 *
 * Produces: max-w-6xl centered container with uniform top/side padding.
 * The navbar is 64px (h-16). PageLayout adds pt-10 to clear it cleanly.
 *
 * Usage:
 *   import PageLayout from '../components/PageLayout'
 *   <PageLayout title="Page Title" subtitle="Optional subtitle">
 *     {content}
 *   </PageLayout>
 */
export default function PageLayout({ title, subtitle, children, fullWidth = false }) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div className={`${fullWidth ? '' : 'max-w-6xl mx-auto px-4'} pt-10 pb-16`}>
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-base" style={{ color: 'var(--muted-foreground)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
