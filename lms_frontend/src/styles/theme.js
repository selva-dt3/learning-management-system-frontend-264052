//
// Ocean Professional Theme definitions and helpers
//

// PUBLIC_INTERFACE
export const theme = {
  colors: {
    primary: '#2563EB',
    secondary: '#F59E0B',
    success: '#F59E0B',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    mutedText: '#6B7280',
    border: '#E5E7EB',
    shadow: 'rgba(17, 24, 39, 0.08)'
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px'
  },
  shadow: {
    sm: '0 1px 2px rgba(17, 24, 39, 0.06)',
    md: '0 4px 10px rgba(17, 24, 39, 0.08)',
    lg: '0 10px 25px rgba(17, 24, 39, 0.12)'
  },
  transition: {
    base: 'all 200ms ease'
  },
  gradient: 'linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(249,250,251,1) 100%)'
};

// PUBLIC_INTERFACE
export function injectThemeCSSVariables() {
  const root = document.documentElement;
  root.style.setProperty('--oc-primary', theme.colors.primary);
  root.style.setProperty('--oc-secondary', theme.colors.secondary);
  root.style.setProperty('--oc-success', theme.colors.success);
  root.style.setProperty('--oc-error', theme.colors.error);
  root.style.setProperty('--oc-bg', theme.colors.background);
  root.style.setProperty('--oc-surface', theme.colors.surface);
  root.style.setProperty('--oc-text', theme.colors.text);
  root.style.setProperty('--oc-muted-text', theme.colors.mutedText);
  root.style.setProperty('--oc-border', theme.colors.border);
  root.style.setProperty('--oc-shadow', theme.colors.shadow);

  root.style.setProperty('--oc-radius-sm', theme.radius.sm);
  root.style.setProperty('--oc-radius-md', theme.radius.md);
  root.style.setProperty('--oc-radius-lg', theme.radius.lg);

  root.style.setProperty('--oc-shadow-sm', theme.shadow.sm);
  root.style.setProperty('--oc-shadow-md', theme.shadow.md);
  root.style.setProperty('--oc-shadow-lg', theme.shadow.lg);

  root.style.setProperty('--oc-transition', theme.transition.base);
  root.style.setProperty('--oc-gradient', theme.gradient);
}
