const Layout = ({ children }: { children: React.ReactNode }) =>
  <main
    style={{
      minHeight: '100vh',
      padding: 40,
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#f8fafc',
    }}
  >
    {children}
  </main>

export default Layout;