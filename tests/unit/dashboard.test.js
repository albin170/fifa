/**
 * @fileoverview Unit tests for js/dashboard.js
 * Tests helper rendering functions: renderSuccessMetrics, renderTransportMini,
 * renderSustainabilityMini, renderModuleCards, and generateAlertFeed.
 * Verifies Problem Statement Alignment via success metrics structure.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Load dependencies in order ---
const securitySource = fs.readFileSync(path.resolve(__dirname, '../../js/security.js'), 'utf8');
// eslint-disable-next-line no-new-func
new Function(securitySource)();

// Stub globals required by dashboard.js
globalThis.AppState = { currentPage: 'dashboard', apiKey: '', userRole: 'fan', _pageIntervals: [] };
globalThis.showToast = () => {};
globalThis.escapeHtml = (t) => String(t ?? '');
globalThis.formatAIResponse = (t) => t;
globalThis.createAIChatInterface = () => {};
globalThis.navigateTo = () => {};
globalThis.GeminiAI = {
  call: async () => 'Mock AI response',
  stream: async (_p, _c, cb, done) => { cb('Mock'); done('Mock'); },
};

// Stub canvas (jsdom does not support it without the canvas npm package)
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  roundRect: () => {},
  stroke: () => {},
  fill: () => {},
  fillText: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
});

// Load dashboard.js
const dashboardSource = fs.readFileSync(path.resolve(__dirname, '../../js/dashboard.js'), 'utf8');
// eslint-disable-next-line no-new-func
new Function(dashboardSource)();

// Helper: render dashboard into a container and return it
function renderDashboardInto() {
  const container = document.createElement('div');
  container.id = 'pageContent';
  document.body.appendChild(container);
  globalThis.renderDashboard(container);
  return container;
}

// ---------------------------------------------------------------------------
// renderDashboard - overall structure
// ---------------------------------------------------------------------------
describe('renderDashboard', () => {
  it('renders a hero banner', () => {
    const container = renderDashboardInto();
    expect(container.querySelector('.hero-banner')).not.toBeNull();
  });

  it('renders the h1 heading containing Command Center', () => {
    const container = renderDashboardInto();
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toContain('Command Center');
  });

  it('renders KPI stat cards (at least 6)', () => {
    const container = renderDashboardInto();
    const statCards = container.querySelectorAll('.stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(6);
  });

  it('renders exactly 8 module quick-access buttons', () => {
    const container = renderDashboardInto();
    const moduleButtons = Array.from(container.querySelectorAll('button'))
      .filter((b) => b.getAttribute('aria-label')?.includes('Navigate to'));
    expect(moduleButtons.length).toBe(8);
  });

  it('renders a canvas for the crowd heatmap', () => {
    const container = renderDashboardInto();
    expect(container.querySelector('canvas#dashboardHeatmap')).not.toBeNull();
  });

  it('canvas has accessible aria-label', () => {
    const container = renderDashboardInto();
    const canvas = container.querySelector('canvas#dashboardHeatmap');
    expect(canvas.getAttribute('aria-label')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Success Metrics Tracker - Problem Statement Alignment
// ---------------------------------------------------------------------------
describe('renderDashboard - Success Metrics Tracker', () => {
  it('renders the FIFA 2026 Success Metrics Tracker region', () => {
    const container = renderDashboardInto();
    const region = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.includes('success metrics'));
    expect(region).not.toBeNull();
  });

  it('renders 7 success metric cards (one per problem statement KPI)', () => {
    const container = renderDashboardInto();
    const metricArticles = container.querySelectorAll('[role="article"][aria-label$="metric"]');
    expect(metricArticles.length).toBe(7);
  });

  it('includes Post-Match Dispersal metric (target <= 25 min)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Post-Match Dispersal');
  });

  it('includes Translations Automated metric (target > 95%)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Translations Automated');
  });

  it('includes Crowd Incident Response metric (target <= 3 min)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Crowd Incident Response');
  });

  it('includes Accessibility Requests metric (target 100%)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Accessibility Requests');
  });

  it('includes CO2 Tracking Accuracy metric (target +/- 2%)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Tracking Accuracy');
  });

  it('includes Fan Satisfaction Score metric (target >= 4.5/5.0)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('Fan Satisfaction Score');
  });

  it('includes AI Ops Decision Automation metric (target >= 90%)', () => {
    const container = renderDashboardInto();
    expect(container.innerHTML).toContain('AI Ops Decision Automation');
  });

  it('renders progress bars for each success metric', () => {
    const container = renderDashboardInto();
    const region = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.includes('success metrics'));
    const progressBars = region.querySelectorAll('.progress-bar');
    expect(progressBars.length).toBe(7);
  });

  it('shows "On Target" tags for metrics that meet goals', () => {
    const container = renderDashboardInto();
    const region = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.includes('success metrics'));
    const onTargetTags = Array.from(region.querySelectorAll('.tag'))
      .filter((el) => el.textContent.includes('On Target'));
    expect(onTargetTags.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Alert Feed
// ---------------------------------------------------------------------------
describe('renderDashboard - Alert Feed', () => {
  it('renders the live AI alert feed', () => {
    const container = renderDashboardInto();
    const feed = container.querySelector('#alertFeed');
    expect(feed).not.toBeNull();
    expect(feed.children.length).toBeGreaterThan(0);
  });

  it('alert feed has aria-live="polite" for screen readers', () => {
    const container = renderDashboardInto();
    const feed = container.querySelector('#alertFeed');
    expect(feed.getAttribute('aria-live')).toBe('polite');
  });

  it('alert feed contains at least 5 alerts', () => {
    const container = renderDashboardInto();
    const feed = container.querySelector('#alertFeed');
    expect(feed.children.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Sustainability Snapshot Panel
// ---------------------------------------------------------------------------
describe('renderDashboard - Sustainability Snapshot', () => {
  it('renders the sustainability snapshot region', () => {
    const container = renderDashboardInto();
    const snapshot = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.toLowerCase().includes('sustainability'));
    expect(snapshot).not.toBeNull();
  });

  it('renders progress bars in the sustainability snapshot', () => {
    const container = renderDashboardInto();
    const snapshot = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.toLowerCase().includes('sustainability'));
    const bars = snapshot.querySelectorAll('.progress-bar');
    expect(bars.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Transport Mini Panel
// ---------------------------------------------------------------------------
describe('renderDashboard - Transport Dashboard', () => {
  it('renders transport region', () => {
    const container = renderDashboardInto();
    const transport = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.includes('Transport status'));
    expect(transport).not.toBeNull();
  });

  it('renders route status tags in the transport mini panel', () => {
    const container = renderDashboardInto();
    const transport = Array.from(container.querySelectorAll('[role="region"]'))
      .find((el) => el.getAttribute('aria-label')?.includes('Transport status'));
    const tags = transport.querySelectorAll('.tag');
    expect(tags.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Module Quick Access
// ---------------------------------------------------------------------------
describe('renderDashboard - Module Quick Access', () => {
  it('all 8 module buttons have aria-label starting with "Navigate to"', () => {
    const container = renderDashboardInto();
    const buttons = Array.from(container.querySelectorAll('button'))
      .filter((b) => b.getAttribute('aria-label')?.startsWith('Navigate to'));
    expect(buttons.length).toBe(8);
  });

  it('module cards include all core modules from problem statement', () => {
    const container = renderDashboardInto();
    const html = container.innerHTML;
    // All 8 modules per problem statement
    const modules = ['Navigation', 'Crowd', 'Accessibility', 'Transport', 'Eco', 'Global', 'Ops', 'Decision'];
    modules.forEach((mod) => {
      expect(html).toContain(mod);
    });
  });
});
