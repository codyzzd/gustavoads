'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './providers';
import { DATE_PRESET_LABELS } from './providers';
import {
  Settings, BarChart2, Megaphone, MessageSquare, Zap,
  TrendingUp, X, Users, RefreshCw, ChevronDown, AlertCircle, Sun, Moon,
} from 'lucide-react';
import { CAMPAIGN_MODE_LABELS } from '@/lib/metaTypes';
import { useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Análise',
    items: [
      { href: '/dashboard',  icon: BarChart2,    label: 'Dashboard' },
      { href: '/campanhas',  icon: Megaphone,    label: 'Campanhas' },
      { href: '/publicos',   icon: Users,         label: 'Públicos' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { href: '/chat', icon: MessageSquare, label: 'AI Copilot' },
    ],
  },
];

const PAGE_TITLE: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/campanhas':     'Campanhas',
  '/publicos':      'Análise de Públicos',
  '/chat':          'AI Copilot',
  '/configuracoes': 'Configurações',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    account, isLoading, syncError, setSyncError,
    datePreset, setDatePreset, campaignMode, setCampaignMode,
    syncMetaData, theme, setTheme,
  } = useApp();

  const [isDateMenuOpen, setIsDateMenuOpen]   = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen]   = useState(false);

  const routeBase = '/' + pathname.split('/')[1];
  const isCampaignDetail = pathname.startsWith('/campanhas/') && pathname !== '/campanhas';
  const showControls = !isCampaignDetail && routeBase !== '/chat' && routeBase !== '/configuracoes';
  const pageTitle = isCampaignDetail ? 'Campanhas' : (PAGE_TITLE[routeBase] ?? 'ARIA');

  return (
    <div className="app-container">

      {/* ── Sidebar ── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="logo-container">
          <div className="logo-icon">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="logo-text">ARIA</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', lineHeight: 1 }}>Meta Ads Agent</div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="nav-menu">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-section-label">{group.label}</div>
              {group.items.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Icon size={16} strokeWidth={pathname.startsWith(href) ? 2.5 : 2} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom: account status + settings */}
        <div className="settings-section">
          {account && (
            <div style={{
              padding: '8px 10px', marginBottom: 4, borderRadius: 6,
              background: 'var(--success-bg)', border: '1px solid var(--success-border)',
              fontSize: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                <span style={{ color: 'var(--fg-subtle)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {account.name}
                </span>
              </div>
            </div>
          )}
          <Link
            href="/configuracoes"
            className={`nav-item ${pathname.startsWith('/configuracoes') ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <Settings size={16} strokeWidth={pathname.startsWith('/configuracoes') ? 2.5 : 2} />
            <span>Configurações</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="main-content">

        {/* Top bar */}
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Breadcrumb */}
            {isCampaignDetail ? (
              <span style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link href="/campanhas" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>Campanhas</Link>
                <span style={{ color: 'var(--border-strong)' }}>›</span>
                <span style={{ color: 'var(--fg-base)', fontWeight: 500 }}>Detalhe</span>
              </span>
            ) : (
              <h1 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="header-actions">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {showControls && (
              <>
                {/* Campaign Mode */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setIsModeMenuOpen((p) => !p); setIsDateMenuOpen(false); }}>
                    {CAMPAIGN_MODE_LABELS[campaignMode]}
                    <ChevronDown size={13} />
                  </button>
                  {isModeMenuOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                      background: 'var(--bg-component)', border: '1px solid var(--border-base)',
                      borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 220,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      {(Object.entries(CAMPAIGN_MODE_LABELS) as [import('@/lib/metaTypes').CampaignMode, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setCampaignMode(key); setIsModeMenuOpen(false); }}
                          style={{
                            padding: '8px 12px', fontSize: '0.8125rem', cursor: 'pointer',
                            color: campaignMode === key ? 'var(--fg-base)' : 'var(--fg-subtle)',
                            background: campaignMode === key ? 'var(--bg-hover)' : 'transparent',
                            fontWeight: campaignMode === key ? 600 : 400,
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Preset */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setIsDateMenuOpen((p) => !p); setIsModeMenuOpen(false); }}>
                    {DATE_PRESET_LABELS[datePreset]}
                    <ChevronDown size={13} />
                  </button>
                  {isDateMenuOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                      background: 'var(--bg-component)', border: '1px solid var(--border-base)',
                      borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 160,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      {(Object.entries(DATE_PRESET_LABELS) as [import('@/lib/metaTypes').DatePreset, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setDatePreset(key); setIsDateMenuOpen(false); }}
                          style={{
                            padding: '8px 12px', fontSize: '0.8125rem', cursor: 'pointer',
                            color: datePreset === key ? 'var(--fg-base)' : 'var(--fg-subtle)',
                            background: datePreset === key ? 'var(--bg-hover)' : 'transparent',
                            fontWeight: datePreset === key ? 600 : 400,
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="btn-primary" onClick={syncMetaData} disabled={isLoading}>
                  {isLoading
                    ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Zap size={15} />
                  }
                  {isLoading ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </>
            )}
          </div>
        </div>

        <main className="page-content">
          {/* Error banner */}
          {syncError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', marginBottom: 16,
              background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 8,
            }}>
              <AlertCircle size={15} color="var(--danger)" />
              <span style={{ fontSize: '0.8125rem', color: 'var(--danger)', flex: 1 }}>{syncError}</span>
              <button
                onClick={() => setSyncError(null)}
                style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--fg-muted)', height: 'auto' }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
