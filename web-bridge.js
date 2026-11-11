/* Browser adapter for GitHub Pages. No Electron APIs required. */
(() => {
  const KEY = 'wellauschecker_web_results_v1';
  const VERIFIED = 'wellauschecker_web_verified_v1';
  const urls = {
    TikTok: n => `https://www.tiktok.com/@${n}`,
    Instagram: n => `https://www.instagram.com/${n}/`,
    X: n => `https://x.com/${n}`,
    Twitch: n => `https://www.twitch.tv/${n}`,
    Threads: n => `https://www.threads.net/@${n}`,
    YouTube: n => `https://www.youtube.com/@${n}`
  };
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const download = (name, content, type='text/plain;charset=utf-8') => {
    const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  window.handleScout = {
    async check({platform, username}) {
      const url = urls[platform]?.(username) || '';
      if (!url) return {platform,username,status:'UNKNOWN',detail:'Unsupported platform',url:''};
      try {
        const response = await fetch(url, {method:'GET', mode:'cors', redirect:'follow'});
        if (response.status === 200) return {platform,username,status:'TAKEN',detail:'Public profile responds',url};
        if (response.status === 404) return {platform,username,status:'CANDIDATE',detail:'No public profile found · verify in app',url};
        return {platform,username,status:'UNKNOWN',detail:`Platform response ${response.status} · inconclusive`,url};
      } catch (_) {
        return {platform,username,status:'UNKNOWN',detail:'Browser blocked this platform request (CORS / anti-bot). Open profile and verify manually.',url};
      }
    },
    async save(records) {
      try { localStorage.setItem(KEY, JSON.stringify(records)); } catch {}
      const verified = read(VERIFIED); const map = new Map(verified.map(x=>[`${x.platform}:${x.username}`,x]));
      for (const r of records || []) if (r.status === 'AVAILABLE' && r.platform) map.set(`${r.platform}:${r.username}`,r);
      try { localStorage.setItem(VERIFIED, JSON.stringify([...map.values()])); } catch {}
      return true;
    },
    async loadVerified() { return read(VERIFIED); },
    async exportCsv(csv) { download('wellauschecker-report.csv', csv, 'text/csv;charset=utf-8'); return {canceled:false}; },
    async openProfile(url) { if (typeof url === 'string' && /^https:\/\/(www\.)?(tiktok\.com|instagram\.com|x\.com|twitch\.tv|threads\.net|youtube\.com)\//.test(url)) window.open(url,'_blank','noopener,noreferrer'); },
    async openResultsFolder() {
      const payload = {results:read(KEY), verified:read(VERIFIED), exportedAt:new Date().toISOString()};
      download('wellauschecker-results.json', JSON.stringify(payload,null,2), 'application/json');
    }
  };
})();
