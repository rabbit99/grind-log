// 測試用：模擬 Google 登入元件和 Drive／Sheets API。資料放在外層頁面（window.parent），
// 換 iframe（模擬換一台裝置）時雲端的資料還在。
window.GRIND_LOG_GOOGLE_CLIENT_ID = "test-client";
(function(){
  const P = window.parent;
  const store = P.__cloudStore || (P.__cloudStore = {files: {}, nextId: 1, log: [], tokenCount: 0});
  window.__store = store;
  window.google = {accounts: {oauth2: {
    initTokenClient: cfg => ({requestAccessToken(){
      store.tokenCount++;
      setTimeout(() => store.denyToken ? cfg.error_callback({type: "popup_closed"})
        : cfg.callback({access_token: "tok" + store.tokenCount, expires_in: store.expiresIn || 3600, scope: cfg.scope}), 0);
    }}),
    hasGrantedAllScopes: () => true,
    revoke: (t, cb) => { store.revoked = t; if(cb) cb(); }
  }}};
  const json = (status, body) => Promise.resolve(new Response(JSON.stringify(body), {status, headers: {"Content-Type": "application/json"}}));
  const clone = o => JSON.parse(JSON.stringify(o));
  const trim = rows => {
    const out = rows.map(r => { const a = r.slice(); while(a.length && (a[a.length-1] === "" || a[a.length-1] == null)) a.pop(); return a; });
    while(out.length && !out[out.length-1].length) out.pop();
    return out;
  };
  window.fetch = async (url, opts = {}) => {
    const method = opts.method || "GET";
    const body = opts.body ? JSON.parse(opts.body) : null;
    store.log.push(method + " " + url);
    if(store.failNext && store.failNext.test(method + " " + url)){ store.failNext = null; return json(500, {error: {message: "模擬的伺服器錯誤"}}); }
    if(store.expireAuth){ store.expireAuth = false; return json(401, {error: {message: "expired"}}); }
    const u = new URL(url);
    let m;
    if(u.host === "www.googleapis.com" && u.pathname === "/drive/v3/files"){
      if(method === "GET"){
        const files = Object.entries(store.files)
          .filter(([, f]) => !f.trashed && f.appProperties && f.appProperties.grindLog === "v1")
          .sort((a, b) => b[1].modified - a[1].modified).map(([id]) => ({id}));
        return json(200, {files});
      }
      if(method === "POST"){
        const id = "sheet" + (store.nextId++);
        store.files[id] = {name: body.name, mimeType: body.mimeType, appProperties: body.appProperties, trashed: false, modified: Date.now(),
          sheets: [{sheetId: 0, title: "工作表1", grid: {rowCount: 1000, columnCount: 26}, cells: []}]};
        return json(200, {id});
      }
    }
    if(u.host === "www.googleapis.com" && (m = u.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/))){
      const f = store.files[m[1]];
      if(!f) return json(404, {error: {message: "File not found"}});
      return json(200, {id: m[1], trashed: !!f.trashed});
    }
    if(u.host === "sheets.googleapis.com" && (m = u.pathname.match(/^\/v4\/spreadsheets\/([^/:]+)(.*)$/))){
      const f = store.files[decodeURIComponent(m[1])];
      if(!f) return json(404, {error: {message: "Requested entity was not found."}});
      const rest = m[2];
      if(rest === "" && method === "GET")
        return json(200, {sheets: f.sheets.map(s => ({properties: {sheetId: s.sheetId, title: s.title, gridProperties: clone(s.grid)}}))});
      if(rest === ":batchUpdate"){
        const sheets = clone(f.sheets);           // 整批成功才套用（跟 Google 一樣是原子的）
        for(const r of body.requests){
          if(r.updateSheetProperties){
            const p = r.updateSheetProperties.properties, s = sheets.find(s => s.sheetId === p.sheetId);
            if(!s) return json(400, {error: {message: "No grid with id"}});
            if(p.title) s.title = p.title;
            if(p.gridProperties) Object.assign(s.grid, p.gridProperties);
          }else if(r.addSheet){
            const p = r.addSheet.properties;
            if(sheets.some(s => s.title === p.title)) return json(400, {error: {message: "A sheet with the name already exists"}});
            sheets.push({sheetId: Math.max(...sheets.map(s => s.sheetId)) + 1, title: p.title,
              grid: Object.assign({rowCount: 1000, columnCount: 26}, p.gridProperties || {}), cells: []});
          }else if(r.updateCells){
            const c = r.updateCells, s = sheets.find(s => s.sheetId === c.range.sheetId);
            if(!s) return json(400, {error: {message: "No grid with id"}});
            if(c.rows.length > s.grid.rowCount || c.rows.some(row => row.values.length > s.grid.columnCount))
              return json(400, {error: {message: "exceeds grid limits"}});
            s.cells = c.rows.map(row => row.values.map(v => {
              const x = v.userEnteredValue; if(!x) return "";
              if("numberValue" in x) return x.numberValue;
              if("boolValue" in x) return x.boolValue;
              return x.stringValue;
            }));
          }else return json(400, {error: {message: "mock 不認得的 request：" + Object.keys(r)}});
        }
        f.sheets = sheets; f.modified = Date.now();
        return json(200, {replies: []});
      }
      if(rest === "/values:batchGet"){
        const valueRanges = u.searchParams.getAll("ranges").map(r => {
          const title = r.replace(/^'|'$/g, ""), s = f.sheets.find(s => s.title === title);
          return {range: r, values: s ? trim(clone(s.cells)) : []};
        });
        return json(200, {valueRanges});
      }
    }
    return json(400, {error: {message: "mock 不認得 " + method + " " + url}});
  };
})();
