import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const EXT_ID = "comfyui.WorkflowAnalyzer.v3";
const STORAGE_POS = "wf-analyzer-pos";
const STORAGE_LANG = "wf-analyzer-lang";

// =================================================================
// CSS
// =================================================================
const STYLES = `
#wf-analyzer-btn{position:fixed;z-index:9999;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2d6da8,#1a4f7a);color:#fff;border:2px solid rgba(255,255,255,0.2);box-shadow:0 3px 12px rgba(0,0,0,0.4);cursor:grab;display:flex;align-items:center;justify-content:center;font-size:20px;user-select:none;transition:box-shadow .2s,transform .15s}
#wf-analyzer-btn:hover{box-shadow:0 4px 18px rgba(45,109,168,0.6);transform:scale(1.08)}
#wf-analyzer-btn:active{cursor:grabbing;transform:scale(0.92)}
#wf-analyzer-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:10000;justify-content:center;align-items:center}
#wf-analyzer-overlay.open{display:flex}
#wf-analyzer-panel{background:#252525;color:#ddd;border:1px solid #444;border-radius:14px;width:660px;max-width:92vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.6);font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden}
#wf-analyzer-panel .hdr{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #3a3a3a;gap:8px}
#wf-analyzer-panel .hdr .ttl{flex:1;font-size:14px;font-weight:600}
#wf-analyzer-panel .hdr .set-btn{background:none;border:none;color:#888;font-size:18px;cursor:pointer;padding:0 4px;line-height:1}
#wf-analyzer-panel .hdr .set-btn:hover{color:#fff}
#wf-analyzer-panel .hdr .back-btn{background:none;border:none;color:#5b9bd5;font-size:16px;cursor:pointer;padding:0 4px;line-height:1;display:none}
#wf-analyzer-panel .hdr .back-btn:hover{color:#7ec8e3}
#wf-analyzer-panel .hdr .close{cursor:pointer;background:none;border:none;color:#888;font-size:20px;padding:0 4px;line-height:1}
#wf-analyzer-panel .hdr .close:hover{color:#fff}
#wf-analyzer-panel .body{flex:1;overflow-y:auto;padding:0}

/* SETTINGS OVERLAY */
#wfa-set-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:10001;justify-content:center;align-items:center}
#wfa-set-panel{background:#252525;color:#ddd;border:1px solid #444;border-radius:14px;width:480px;box-shadow:0 10px 40px rgba(0,0,0,0.6);font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden}
#wfa-set-panel .hdr{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #3a3a3a;gap:8px}
#wfa-set-panel .hdr .ttl{flex:1;font-size:14px;font-weight:600}
#wfa-set-panel .hdr .close{cursor:pointer;background:none;border:none;color:#888;font-size:20px;padding:0 4px;line-height:1}
#wfa-set-panel .hdr .close:hover{color:#fff}
#wfa-set-panel .tabs .tab.active{color:#7ec8e3;background:#1e2a35;border-right:2px solid #5b9bd5}
#wfa-set-panel .tabs .tab:hover{color:#ddd;background:#2a2a2a}
#wfa-set-panel .sbtn{padding:5px 14px;background:#2d6da8;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;margin-top:4px}
#wfa-set-panel .sbtn:hover{background:#3d7db8}
#wfa-set-panel .sbtn.saved{background:#4a8}

/* CONFIRM OVERLAY */
#wfa-confirm-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10002;justify-content:center;align-items:center}
#wfa-confirm-overlay.open{display:flex}
#wfa-confirm-panel{background:#252525;color:#ddd;border:1px solid #444;border-radius:12px;width:420px;max-width:90vw;max-height:70vh;box-shadow:0 10px 40px rgba(0,0,0,0.6);font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden;display:flex;flex-direction:column}
#wfa-confirm-panel .hdr{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #3a3a3a}
#wfa-confirm-panel .hdr .ttl{flex:1;font-size:14px;font-weight:600}
#wfa-confirm-panel .body{padding:14px;overflow-y:auto;flex:1;max-height:320px}
#wfa-confirm-panel .body .ci{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #333;font-size:12px}
#wfa-confirm-panel .body .ci .cn{color:#7ec8e3;flex:1}
#wfa-confirm-panel .body .ci .cv{color:#aaa;margin-left:8px;white-space:nowrap}
#wfa-confirm-panel .foot{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #3a3a3a;justify-content:flex-end}
#wfa-confirm-panel .foot button{padding:5px 16px;border:none;border-radius:5px;font-size:12px;cursor:pointer}
#wfa-confirm-panel .foot .ok{background:#2d6da8;color:#fff}
#wfa-confirm-panel .foot .ok:hover{background:#3d7db8}
#wfa-confirm-panel .foot .cancel{background:#444;color:#ccc}
#wfa-confirm-panel .foot .cancel:hover{background:#555}

/* SETTINGS */
#wfa-settings{display:flex;height:380px}
#wfa-settings .tabs{width:120px;border-right:1px solid #3a3a3a;padding:10px 0;flex-shrink:0}
#wfa-settings .tabs .tab{padding:8px 14px;cursor:pointer;font-size:12px;color:#999;transition:.15s}
#wfa-settings .tabs .tab:hover{color:#ddd;background:#2a2a2a}
#wfa-settings .tabs .tab.active{color:#7ec8e3;background:#1e2a35;border-right:2px solid #5b9bd5}
#wfa-settings .page{flex:1;padding:14px 18px;overflow-y:auto}
#wfa-settings .page h3{margin:0 0 12px;font-size:14px;color:#ddd}
#wfa-settings .page label{display:block;font-size:12px;color:#aaa;margin-bottom:4px}
#wfa-settings .page input[type=text]{width:100%;padding:6px 8px;background:#1e1e1e;border:1px solid #444;border-radius:5px;color:#ddd;font-size:12px;margin-bottom:10px;box-sizing:border-box}
#wfa-settings .page input[type=text]:focus{border-color:#5b9bd5;outline:none}
#wfa-settings .page .hint{font-size:11px;color:#666;margin:-6px 0 10px}
#wfa-settings .page select{width:100%;padding:5px 8px;background:#1e1e1e;border:1px solid #444;border-radius:5px;color:#ddd;font-size:12px;margin-bottom:10px;cursor:pointer}
#wfa-settings .page .sbtn{padding:5px 14px;background:#2d6da8;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;margin-top:4px}
#wfa-settings .page .sbtn:hover{background:#3d7db8}
#wfa-settings .page .sbtn.saved{background:#4a8}
#wfa-settings .page .stat{font-size:11px;color:#4a8;margin-top:6px}

/* drop zone */
.wfa-dz{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px;margin:14px;border-radius:12px;border:2px dashed #555;background:#1e1e1e;cursor:pointer;padding:24px;gap:6px;transition:border-color .25s,background .25s}
.wfa-dz.dragover{border-color:#5b9bd5;background:#1a2535}
.wfa-dz.has-file{min-height:auto;flex-direction:row;gap:8px;padding:8px 14px}
.wfa-dz svg{width:36px;height:36px;stroke:#666;flex-shrink:0}
.wfa-dz.dragover svg{stroke:#5b9bd5}
.wfa-dz .hint{color:#888;font-size:13px;text-align:center}
.wfa-dz .fn{color:#7ec8e3;font-size:12px;word-break:break-all}
.wfa-dz .chg{font-size:11px;color:#888;margin-left:auto;cursor:pointer;white-space:nowrap}
.wfa-dz .chg:hover{color:#ccc}
.wfa-sum{display:flex;gap:8px;padding:8px 14px}
.wfa-sum .st{flex:1;background:#1e1e1e;border-radius:8px;padding:6px 8px;text-align:center}
.wfa-sum .st .n{font-size:19px;font-weight:700;display:block}
.wfa-sum .st .l{font-size:10px;color:#999}
.wfa-sec{padding:0 14px 10px}
.wfa-sec h3{font-size:13px;margin:0 0 6px}
.wfa-card{background:#1e1e1e;border-radius:8px;margin-bottom:5px;border-left:3px solid #5b9bd5;overflow:hidden}
.wfa-card.installed{border-left-color:#4a8;opacity:.75}
.wfa-card.unk{border-left-color:#e06c6c}
.wfa-card .tp{display:flex;align-items:center;padding:7px 10px;gap:8px}
.wfa-card .tp .nm{flex:1;font-weight:600;color:#7ec8e3;font-size:12px;min-width:0}
.wfa-card .tp .nm a{color:#7ec8e3;text-decoration:none}
.wfa-card .tp .nm a:hover{text-decoration:underline}
.wfa-card .tp .ib{background:#2d6da8;color:#fff;cursor:pointer;transition:background .2s;border:none;border-radius:5px;padding:3px 10px;font-size:11px;white-space:nowrap}
.wfa-card .tp .ib:hover{background:#3d7db8}
.wfa-card .tp .ib.done{background:#4a8;cursor:default}
.wfa-card .tp .ib.err{background:#c44}
.wfa-card .tp .vs{background:#2a2a2a;color:#bbb;border:1px solid #555;border-radius:4px;padding:2px 4px;font-size:10px;cursor:pointer;max-width:90px}
.wfa-card .tp .vspin{display:inline-block;width:14px;height:14px;border:2px solid #444;border-top-color:#7ec8e3;border-radius:50%;animation:wfa-spin .6s linear infinite;flex-shrink:0;cursor:pointer}
.wfa-card .tp .vspin.done{display:none}
.wfa-card .tp .vspin.idle{animation:none;border-color:#666;border-top-color:#666;cursor:pointer}
.wfa-card .tp .vspin.idle:hover{border-color:#7ec8e3;border-top-color:#7ec8e3}
.wfa-card .url{padding:0 10px 3px;font-size:11px;color:#5b9bd5;word-break:break-all}
.wfa-card .url a{color:#5b9bd5;text-decoration:none}
.wfa-card .url a:hover{text-decoration:underline}
.hdr .mode-tab:hover{background:rgba(255,255,255,0.08)!important;color:#ddd!important}
.wfa-card .lbl{color:#777;font-size:10px;margin-right:2px;white-space:nowrap}
.wfa-card .tys{padding:0 10px 5px;display:flex;flex-wrap:wrap;gap:2px;align-items:center}
.wfa-card .tys span{background:#333;border-radius:3px;padding:1px 5px;font:10px monospace;color:#bbb}
.wfa-unk{padding:0 14px 10px}
.wfa-unk h4{color:#e06c6c;font-size:12px;margin:0 0 6px}
.wfa-unk .g{display:flex;flex-wrap:wrap;gap:3px}
.wfa-unk .g span{background:#332;color:#e06c6c;border-radius:3px;padding:1px 6px;font:11px monospace}
.wfa-act{display:flex;gap:6px;padding:8px 14px;border-top:1px solid #3a3a3a;flex-wrap:wrap}
.wfa-act button{background:#3a3a3a;border:1px solid #555;color:#ccc;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer}
.wfa-act button:hover{background:#4a4a4a}
.wfa-act button.pri{background:#2d6da8;border-color:#3d7db8;color:#fff}
.wfa-act button.pri:hover{background:#3d7db8}
.wfa-load{text-align:center;padding:36px;color:#888}
@keyframes wfa-spin{to{transform:rotate(360deg)}}
.wfa-spin{display:inline-block;width:26px;height:26px;border:3px solid #444;border-top-color:#7ec8e3;border-radius:50%;animation:wfa-spin .7s linear infinite}
.wfa-prog{padding:10px 14px}
.wfa-prog .bar{height:5px;background:#333;border-radius:3px;margin-top:5px;overflow:hidden}
.wfa-prog .bar .fl{height:100%;background:#2d6da8;border-radius:3px;transition:width .3s}
.wfa-prog .tx{font-size:11px;color:#999}
.wfa-allok{text-align:center;padding:28px;color:#888}
`;

// =================================================================
// PLUGIN
// =================================================================
app.registerExtension({
    name: EXT_ID,
    _lang:"en", _strings:{}, _langs:[], _lastAnalyzedFile:null, _versionCache:{}, _confirmResolve:null, _promiseCache:null, _unknownCache:{},

    async t(key,subs){let s=this._strings[key];if(s===undefined)s=key;if(subs)for(const[k,v]of Object.entries(subs))s=s.replace(`{${k}}`,v);return s},

    async setup(){
        const style=document.createElement("style");style.textContent=STYLES;document.head.appendChild(style);
        try{const r=await api.fetchApi("/wf-analyzer/languages");this._langs=await r.json()}catch{this._langs=["zh","en"]}
        // Read language from settings.json, fallback localStorage, default "zh"
        let initialLang = "zh";
        try {
            const r = await api.fetchApi("/wf-analyzer/settings");
            const d = await r.json();
            if (d.lang && this._langs.includes(d.lang)) initialLang = d.lang;
        } catch {
            const savedLang = localStorage.getItem(STORAGE_LANG);
            if (savedLang && this._langs.includes(savedLang)) initialLang = savedLang;
        }
        await this._loadLang(initialLang);
        await this._preloadCache();
        await this._preloadUnknownCache();
        this._createFloatingButton();this._createDialog();
    },

    async _loadLang(code){
        try{const r=await api.fetchApi(`/wf-analyzer/lang/${code}`);this._strings=await r.json()}catch{
            this._strings={pluginName:"Workflow Analyzer",btnTitle:"Workflow Analyzer — drag a .json file",dialogTitle:"🔍 Workflow Analyzer",dropHint:'Drop a ComfyUI workflow <strong>.json</strong> file here',dropHintSmall:"or click to browse",dropChange:"(change)",dropAgain:"Drop another file or click to browse",analyzing:'Analyzing <strong>{fileName}</strong>...',summaryTotal:"Total",summaryBuiltin:"Built-in",summaryCustom:"Custom",summaryUnknown:"Unknown",sectionCustom:"📦 Custom Nodes ({count})",btnInstall:"⬇ Install",btnInstalling:"⏳ ...",btnInstalled:"✅ Done",btnFailed:"❌ Failed",sectionUnknown:"⚠️ Unknown ({count}) — not found in node database",allBuiltin:"✅ All nodes are built-in ComfyUI nodes. No custom nodes required!",btnInstallAll:"⬇ Install All ({count})",btnCopyUrls:"📋 Copy URLs",btnExportJson:"💾 Export JSON",installProgress:"Installing {done}/{total}...",installProgressFail:"Installing… {done}/{total} ({fail} failed)",installDone:"✅ All {count} installed — restart ComfyUI to apply",installDoneFail:"✅ {done} installed, ❌ {fail} failed — restart ComfyUI to apply",copied:"✅ Copied!",errorPrefix:"Error: {msg}",rebootHint:"Restart ComfyUI to load new nodes",langLabel:"🌐 Language",labelRepo:"Repo",labelUrl:"URL",labelNodes:"Nodes",labelInstalled:"✓ Installed",labelNotInstalled:"Not Installed",btnReinstall:"🔄 Reinstall",sectionCustomUninstalled:"📦 Custom Nodes — Not Installed ({count})",sectionCustomInstalled:"✅ Custom Nodes — Already Installed ({count})",settingsTitle:"⚙ Settings",tabLanguage:"🌐 Language",tabProxy:"🔌 Proxy",proxyLabel:"SOCKS5 Proxy",proxyHint:"e.g. 127.0.0.1:10808 — leave empty for direct connection",proxySaved:"✅ Saved",proxySave:"Save",proxyTest:"Test",proxyTesting:"Testing...",proxyTestOK:"✅ Proxy works",proxyTestFail:"❌ Connection failed",btnRefreshVersions:"🔄 Versions",btnRefreshing:"⏳ Refreshing...",confirmTitle:"Confirm Install",confirmTitleAll:"Install All",confirmCancel:"Cancel",confirmOk:"OK",labelCopy:"Click to copy",btnSearchNode:"🔍 Search",searching:"⏳ Searching...",searchFound:"Found on GitHub",searchNone:"No GitHub repo found, please search manually",searchCached:"📦 Found via Search",tabSearch:"🔎 Search",searchEngineLabel:"Search Engine",searchEngineGitHub:"GitHub",searchEngineGoogle:"Google",searchEngineBaidu:"Baidu",searchEngineDuckDuckGo:"DuckDuckGo",searchEngineBing:"Bing",labelOpenSearch:"Open in browser",searchHint:"GitHub: auto-search via API / Others: open browser tab",btnModels:"📦 Models",modelMatchTitle:"📦 Model Path Matcher",sectionModels:"Model References ({count})",modelCategory:"Category",modelRequested:"Requested",modelMatched:"Matched",modelNoMatch:"No match found in local models",modelMatchHint:"Drop a workflow <strong>.json</strong> file to match model file paths",modelMatchScore:"Score: {score}%",modelWait:"Matching models in <strong>{fileName}</strong>...",tabAnalyzer:"🔍 Analyzer",tabModels:"📦 Models",modelManualSelect:"Manual Select:",modelRescan:"🔄 Rescan All Models",modelRescanning:"⏳ Scanning models...",modelRescanDone:"✅ Scanned {cat} categories, {files} files",modelApplying:"⏳ Applying...",modelApplyDone:"✅ Updated {count} nodes on canvas",modelUpdateBtn:"📝 Update Model Paths"};
        }
        this._lang=code;localStorage.setItem(STORAGE_LANG,code);
    },

    async _switchLang(code){await this._loadLang(code);
        this._updateTabText();
        // Save language to settings.json
        try{await api.fetchApi("/wf-analyzer/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang:code})})}catch{}
        // Update settings overlay if open
        const setOv = document.getElementById("wfa-set-overlay");
        if (setOv && setOv.style.display !== "none") {
            this._applySetLang();
            setOv.querySelector("#wfa-set-ttl").textContent = this._strings.settingsTitle || "⚙ Settings";
            // Re-render the current settings tab
            const activeTab = setOv.querySelector(".tab.active");
            if (activeTab) this._renderSetTab(activeTab.dataset.tab);
        }
        // Re-render current main view
        if(this._viewState?.type==="results"){this._renderResult(this._viewState.result,this._viewState.fileName);return}
        this._renderInitial()
    },

    // Floating button
    _createFloatingButton(){
        const btn=document.createElement("div");btn.id="wf-analyzer-btn";btn.textContent="🔍";this._btn=btn;
        let pos={x:20,y:80};try{const s=localStorage.getItem(STORAGE_POS);if(s)pos=JSON.parse(s)}catch{}
        btn.style.left=pos.x+"px";btn.style.top=pos.y+"px";document.body.appendChild(btn);
        let drag=false,off={x:0,y:0};
        btn.addEventListener("mousedown",e=>{drag=true;off.x=e.clientX-btn.offsetLeft;off.y=e.clientY-btn.offsetTop;btn.style.cursor="grabbing";e.preventDefault()});
        document.addEventListener("mousemove",e=>{if(!drag)return;pos.x=Math.max(0,e.clientX-off.x);pos.y=Math.max(0,e.clientY-off.y);btn.style.left=pos.x+"px";btn.style.top=pos.y+"px"});
        document.addEventListener("mouseup",()=>{if(drag){drag=false;btn.style.cursor="grab";localStorage.setItem(STORAGE_POS,JSON.stringify(pos))}});
        let moved=false;btn.addEventListener("click",()=>{if(!moved)this._openForDrop();moved=false});btn.addEventListener("mousemove",()=>{moved=true});
    },

    // Dialog
    _createDialog(){
        const overlay=document.createElement("div");overlay.id="wf-analyzer-overlay";
        overlay.innerHTML=`<div id="wf-analyzer-panel"><div class="hdr"><span class="ttl" id="wfa-ttl"><span class="mode-tab active" id="wfa-mode-analyzer" style="cursor:pointer;padding:2px 8px;border-radius:4px;font-size:13px;transition:.15s;background:rgba(45,109,168,0.3);color:#7ec8e3;">🔍 Analyzer</span><span class="mode-tab" id="wfa-mode-models" style="cursor:pointer;padding:2px 8px;border-radius:4px;font-size:13px;transition:.15s;color:#999;">📦 Models</span></span><button class="set-btn" id="wfa-settings-btn" title="Settings">&#x2699;</button><button class="close" id="wfa-close">&times;</button></div><div class="body" id="wfa-body"></div></div>`;
        document.body.appendChild(overlay);this._overlay=overlay;this._body=overlay.querySelector("#wfa-body");
        overlay.querySelector("#wfa-close").addEventListener("click",()=>this._closeDialog());
        overlay.addEventListener("click",e=>{if(e.target===overlay)this._closeDialog()});
        document.addEventListener("keydown",e=>{if(e.key==="Escape")this._closeDialog()});
        overlay.querySelector("#wfa-mode-analyzer").addEventListener("click",()=>{this._isModelMode=false;this._switchMode()});
        overlay.querySelector("#wfa-mode-models").addEventListener("click",()=>{this._isModelMode=true;this._switchMode()});
        overlay.querySelector("#wfa-settings-btn").addEventListener("click",()=>this._showSettings());
        const fi=document.createElement("input");fi.type="file";fi.accept=".json";fi.style.display="none";overlay.appendChild(fi);this._fileInput=fi;
        this._renderInitial();
    },
    _openDialog(){this._overlay.classList.add("open");if(!this._viewState)this._renderInitial()},
    _openForDrop(){this._isModelMode=false;this._switchMode()},
    _closeDialog(){this._overlay.classList.remove("open")},
    _switchMode(){this._viewState=null;this._overlay.classList.add("open");
        const tabs = this._overlay.querySelectorAll(".mode-tab");
        tabs.forEach(t=>{t.style.background="";t.style.color="#999"});
        const active = this._isModelMode ? this._overlay.querySelector("#wfa-mode-models") : this._overlay.querySelector("#wfa-mode-analyzer");
        if(active){active.style.background="rgba(45,109,168,0.3)";active.style.color="#7ec8e3"}
        this._updateTabText();
        this._renderInitial()
    },
    _updateTabText(){
        const aTab = this._overlay?.querySelector("#wfa-mode-analyzer");
        const mTab = this._overlay?.querySelector("#wfa-mode-models");
        if(aTab)aTab.textContent=this._strings.tabAnalyzer||"🔍 Analyzer";
        if(mTab)mTab.textContent=this._strings.tabModels||"📦 Models";
    },
    _openForModels(){this._isModelMode=true;this._switchMode()},

    /** Render the initial drop-zone view */
    _renderInitial(){
        this._viewState=null;
        
        const dzHint = this._isModelMode ? (this._strings.modelMatchHint||'Drop a ComfyUI workflow <strong>.json</strong> file to match model file paths') : (this._strings.dropHint||'Drop a ComfyUI workflow <strong>.json</strong> file here');
        const dzSmall = this._isModelMode ? "" : `<div class="hint" style="font-size:11px;">${this._strings.dropHintSmall||'or click to browse'}</div>`;
        this._body.innerHTML=`<div class="wfa-dz" id="wfa-dz-init">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
            <div class="hint">${dzHint}</div>
            ${dzSmall}
        </div>`;
        this._bindDropZone(this._body.querySelector("#wfa-dz-init"));
    },

    // Settings page — separate overlay on top of main dialog
    async _showSettings(){
        // Create or reuse settings overlay
        let setOverlay = document.getElementById("wfa-set-overlay");
        if (!setOverlay) {
            setOverlay = document.createElement("div");
            setOverlay.id = "wfa-set-overlay";
            setOverlay.innerHTML = `<div id="wfa-set-panel"><div class="hdr"><span class="ttl" id="wfa-set-ttl">⚙ Settings</span><button class="close" id="wfa-set-close">&times;</button></div><div id="wfa-set-body" style="display:flex;height:380px;"><div class="tabs" style="width:120px;border-right:1px solid #3a3a3a;padding:10px 0;flex-shrink:0;"><div class="tab active" data-tab="lang" style="padding:8px 14px;cursor:pointer;font-size:12px;color:#999;" id="wfa-tab-lang">LANG</div><div class="tab" data-tab="proxy" style="padding:8px 14px;cursor:pointer;font-size:12px;color:#999;" id="wfa-tab-proxy">PROXY</div><div class="tab" data-tab="search" style="padding:8px 14px;cursor:pointer;font-size:12px;color:#999;" id="wfa-tab-search">SEARCH</div></div><div class="page" id="wfa-set-page" style="flex:1;padding:14px 18px;overflow-y:auto;"></div></div></div>`;
            document.body.appendChild(setOverlay);
            setOverlay.querySelector("#wfa-set-close").addEventListener("click", () => this._closeSettings());
            setOverlay.addEventListener("click", e => { if (e.target === setOverlay) this._closeSettings(); });
            // Tab switching
            setOverlay.querySelector("#wfa-tab-lang").addEventListener("click", () => {
                setOverlay.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
                setOverlay.querySelector("#wfa-tab-lang").classList.add("active");
                this._renderSetTab("lang");
            });
            setOverlay.querySelector("#wfa-tab-proxy").addEventListener("click", () => {
                setOverlay.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
                setOverlay.querySelector("#wfa-tab-proxy").classList.add("active");
                this._renderSetTab("proxy");
            });
            setOverlay.querySelector("#wfa-tab-search").addEventListener("click", () => {
                setOverlay.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
                setOverlay.querySelector("#wfa-tab-search").classList.add("active");
                this._renderSetTab("search");
            });
        }
        // Apply current language to settings UI
        this._applySetLang();
        // Show overlay
        setOverlay.style.cssText = "display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:10001;justify-content:center;align-items:center;";
        setOverlay.querySelector("#wfa-set-ttl").textContent = this._strings.settingsTitle || "⚙ Settings";
        // Load settings (proxy + search_engine)
        try { const r = await api.fetchApi("/wf-analyzer/settings"); const d = await r.json(); this._currentProxy = d.proxy || ""; this._currentSearchEngine = d.search_engine || "bing"; } catch { this._currentProxy = ""; this._currentSearchEngine = "bing"; }
        // Reset active tab to Language every time settings open
        setOverlay.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        const langTabEl = setOverlay.querySelector("#wfa-tab-lang");
        if (langTabEl) langTabEl.classList.add("active");
        this._renderSetTab("lang");
    },

    _closeSettings() {
        const setOverlay = document.getElementById("wfa-set-overlay");
        if (setOverlay) setOverlay.style.display = "none";
    },

    _applySetLang() {
        const langTab = document.getElementById("wfa-tab-lang");
        const proxyTab = document.getElementById("wfa-tab-proxy");
        const searchTab = document.getElementById("wfa-tab-search");
        if (langTab) langTab.textContent = this._strings.tabLanguage || "🌐 Language";
        if (proxyTab) proxyTab.textContent = this._strings.tabProxy || "🔌 Proxy";
        if (searchTab) searchTab.textContent = this._strings.tabSearch || "🔎 Search";
    },

    _renderSetTab(tab){
        const page = document.getElementById("wfa-set-page"); if (!page) return;
        if (tab === "lang") {
            const names = { en: "EN", zh: "中文", ja: "日本語", ko: "한국어", fr: "FR", de: "DE", es: "ES", pt: "PT", ru: "RU" };
            let opts = ""; for (const c of this._langs) { const s = c === this._lang ? " selected" : ""; opts += `<option value="${c}"${s}>${names[c] || c.toUpperCase()}</option>`; }
            page.innerHTML = `<h3 style="margin:0 0 12px;font-size:14px;color:#ddd;">${this._strings.tabLanguage || "🌐 Language"}</h3><select id="wfa-set-lang" style="width:100%;padding:5px 8px;background:#1e1e1e;border:1px solid #444;border-radius:5px;color:#ddd;font-size:12px;cursor:pointer;">${opts}</select>`;
            page.querySelector("#wfa-set-lang").addEventListener("change", e => this._switchLang(e.target.value));
        } else if (tab === "proxy") {
            const pv = this._currentProxy || "";
            page.innerHTML = `<h3 style="margin:0 0 12px;font-size:14px;color:#ddd;">${this._strings.tabProxy || "🔌 Proxy"}</h3>
                <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px;">${this._strings.proxyLabel || "SOCKS5 Proxy"}</label>
                <input type="text" id="wfa-proxy-input" value="${this._esc(pv)}" placeholder="127.0.0.1:10808" style="width:100%;padding:6px 8px;background:#1e1e1e;border:1px solid #444;border-radius:5px;color:#ddd;font-size:12px;margin-bottom:10px;box-sizing:border-box;">
                <div style="font-size:11px;color:#666;margin:-6px 0 10px;">${this._strings.proxyHint || "e.g. 127.0.0.1:10808 — leave empty for direct connection"}</div>
                <button class="sbtn" id="wfa-proxy-save" style="padding:5px 14px;background:#2d6da8;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;">${this._strings.proxySave || "Save"}</button>
                <span class="stat" id="wfa-proxy-stat" style="font-size:11px;color:#4a8;margin-top:6px;"></span>`;
            const input = page.querySelector("#wfa-proxy-input");
            const saveBtn = page.querySelector("#wfa-proxy-save");
            saveBtn.addEventListener("click", async () => {
                const val = input.value.trim();
                const resp = await api.fetchApi("/wf-analyzer/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proxy: val }) });
                if (resp.ok) { this._currentProxy = val; saveBtn.textContent = this._strings.proxySaved || "✅ Saved"; saveBtn.classList.add("saved"); setTimeout(() => { saveBtn.textContent = this._strings.proxySave || "Save"; saveBtn.classList.remove("saved"); }, 2000); }
            });
        } else if (tab === "search") {
            const engines = [
                {id:"github", key:"searchEngineGitHub"},
                {id:"google", key:"searchEngineGoogle"},
                {id:"baidu", key:"searchEngineBaidu"},
                {id:"duckduckgo", key:"searchEngineDuckDuckGo"},
                {id:"bing", key:"searchEngineBing"}
            ];
            const current = this._currentSearchEngine || "bing";
            let opts = "";
            for (const e of engines) {
                const label = this._strings[e.key] || e.id.charAt(0).toUpperCase() + e.id.slice(1);
                const sel = e.id === current ? " selected" : "";
                opts += `<option value="${e.id}"${sel}>${label}</option>`;
            }
            page.innerHTML = `<h3 style="margin:0 0 12px;font-size:14px;color:#ddd;">${this._strings.tabSearch || "🔎 Search"}</h3>
                <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px;">${this._strings.searchEngineLabel || "Search Engine"}</label>
                <select id="wfa-search-engine" style="width:100%;padding:5px 8px;background:#1e1e1e;border:1px solid #444;border-radius:5px;color:#ddd;font-size:12px;cursor:pointer;">${opts}</select>
                <div style="font-size:11px;color:#666;margin:4px 0 10px;">${this._strings.searchHint || "GitHub: auto-search via API / Others: open browser tab"}</div>
                <button class="sbtn" id="wfa-search-save" style="padding:5px 14px;background:#2d6da8;border:none;border-radius:5px;color:#fff;font-size:12px;cursor:pointer;">${this._strings.proxySave || "Save"}</button>
                <span class="stat" id="wfa-search-stat" style="font-size:11px;color:#4a8;margin-top:6px;"></span>`;
            const saveSearchBtn = page.querySelector("#wfa-search-save");
            saveSearchBtn.addEventListener("click", async () => {
                const val = page.querySelector("#wfa-search-engine").value;
                const resp = await api.fetchApi("/wf-analyzer/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ search_engine: val }) });
                if (resp.ok) {
                    this._currentSearchEngine = val;
                    saveSearchBtn.textContent = this._strings.proxySaved || "✅ Saved";
                    saveSearchBtn.classList.add("saved");
                    setTimeout(() => {
                        saveSearchBtn.textContent = this._strings.proxySave || "Save";
                        saveSearchBtn.classList.remove("saved");
                    }, 2000);
                }
            });
        }
    },

    // Installed repos
    async _fetchInstalledRepos(){try{const r=await api.fetchApi("/wf-analyzer/installed-repos");const d=await r.json();return new Set(d.installed||[])}catch{return new Set()}},

    // Render results
    async _renderResult(result,fileName){this._isModelMode=false;
        this._viewState={type:"results",result,fileName};
        const{total_nodes,builtin_count,unknown_nodes}=result;let cList=(result.custom_nodes||[]).slice();
        const installed=await this._fetchInstalledRepos();const uninstalled=[];const alreadyInstalled=[];
        for(const n of cList){if(installed.has(n.repo_name)){n._installed=true;alreadyInstalled.push(n)}else{n._installed=false;uninstalled.push(n)}}
        const sortedCustom=[...uninstalled,...alreadyInstalled];const uList=unknown_nodes||[];
        
        let html=`<div class="wfa-dz has-file" id="wfa-dz-result"><svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg><span class="fn">${this._esc(fileName)}</span><span class="chg" id="wfa-chg">${this._strings.dropChange||'(change)'}</span></div>`;
        html+=`<div class="wfa-sum"><div class="st"><span class="n">${total_nodes}</span><span class="l">${this._strings.summaryTotal||'Total'}</span></div><div class="st"><span class="n">${builtin_count}</span><span class="l">${this._strings.summaryBuiltin||'Built-in'}</span></div><div class="st"><span class="n">${cList.length}</span><span class="l">${this._strings.summaryCustom||'Custom'}</span></div><div class="st"><span class="n">${uList.length}</span><span class="l">${this._strings.summaryUnknown||'Unknown'}</span></div></div>`;
        if(uninstalled.length>0){const st=await this.t("sectionCustomUninstalled",{count:uninstalled.length});html+=`<div class="wfa-sec" style="border-top:2px solid #5b9bd5;padding-top:10px;"><h3 style="color:#5b9bd5;">${st}</h3>`+this._renderCards(uninstalled,false)+`</div>`}
        if(alreadyInstalled.length>0){const st=await this.t("sectionCustomInstalled",{count:alreadyInstalled.length});html+=`<div class="wfa-sec"><h3 style="color:#4a8;">${st}</h3>`+this._renderCards(alreadyInstalled,true)+`</div>`}
        // ── Unknown nodes: check cache first, then show searchable list ──
        const unknownWithCache=[], unknownToSearch=[];
        for(const ct of uList){
            if(this._unknownCache[ct])unknownWithCache.push({class_type:ct,...this._unknownCache[ct]});
            else unknownToSearch.push(ct);
        }
        if(unknownWithCache.length>0){
            const sct=await this.t("searchCached",{count:unknownWithCache.length})||"📦 Found via Search";
            html+=`<div class="wfa-sec"><h3 style="color:#e8a040;">${sct}</h3>`;
            for(const n of unknownWithCache){
                const ty=[n.class_type];const u=n.github_url;
                html+=`<div class="wfa-card" data-url="${this._esc(u)}"><div class="tp"><div class="nm"><span class="lbl">${this._esc(this._strings.labelRepo||'Repo')}:</span> <a href="#" onclick="navigator.clipboard.writeText('${this._esc(n.repo_name)}');this.style.color='#4a8';setTimeout(()=>this.style.color='\\',800);return false;" style="color:#7ec8e3;text-decoration:none;" title="${this._esc(this._strings.labelCopy||'Click to copy')}">${this._esc(n.repo_name)}</a></div><select class="vs" data-url="${this._esc(u)}"><option value="latest">latest</option></select><button class="ib" data-url="${this._esc(u)}">${this._strings.btnInstall||'⬇ Install'}</button></div><div class="url"><span class="lbl">${this._esc(this._strings.labelUrl||'URL')}:</span> <a href="${this._esc(u)}" target="_blank" rel="noopener" style="color:#5b9bd5;">${this._esc(u)}</a></div><div class="tys"><span class="lbl">${this._esc(this._strings.labelNodes||'Nodes')}:</span> <span>${this._esc(this._splitNodeName(n.class_type))}</span></div></div>`;
            }
            html+=`</div>`;
        }
        if(unknownToSearch.length>0){
            const ut=await this.t("sectionUnknown",{count:unknownToSearch.length});
            html+=`<div class="wfa-unk" id="wfa-unk-section"><h4>${ut}</h4><div class="g" id="wfa-unk-list">${unknownToSearch.map(t=>`<span data-ct="${this._esc(t)}">${this._esc(this._splitNodeName(t))}<button class="unk-sbtn" data-ct="${this._esc(t)}" style="margin-left:6px;padding:1px 6px;background:#5b9bd5;border:none;border-radius:3px;color:#fff;font-size:10px;cursor:pointer;">${this._strings.btnSearchNode||'🔍 Search'}</button></span>`).join("")}</div></div>`;
        }
        if(cList.length===0&&uList.length===0)html+=`<div class="wfa-allok">${this._strings.allBuiltin||'✅ All nodes are built-in ComfyUI nodes. No custom nodes required!'}</div>`;
        html+=`<div class="wfa-act">`;
        if(uninstalled.length>0){const it=await this.t("btnInstallAll",{count:uninstalled.length});html+=`<button class="pri" id="wfa-iall">${it}</button>`}
        html+=`<button id="wfa-refresh-v">${this._strings.btnRefreshVersions||'🔄 Versions'}</button><button id="wfa-copy">${this._strings.btnCopyUrls||'📋 Copy URLs'}</button><button id="wfa-export">${this._strings.btnExportJson||'💾 Export JSON'}</button></div>`;
        this._body.innerHTML=html;
        const chg=this._body.querySelector("#wfa-chg");if(chg)chg.addEventListener("click",()=>{this._renderInitial()});
        for(const btn of this._body.querySelectorAll(".ib:not(.done):not(.err)")){
            btn.addEventListener("click",async()=>{
                const url=btn.dataset.url;const sel=btn.parentElement.querySelector(".vs");const version=sel?sel.value:"latest";
                const card=btn.closest(".wfa-card");const nameEl=card?.querySelector(".nm a");const name=nameEl?.textContent||url.split("/").pop();
                const confirmed=await this._showInstallConfirm([{name,version}]);
                if(!confirmed)return;
                btn.textContent=this._strings.btnInstalling||"⏳ ...";btn.disabled=true;
                const ok=await this._installNode(url,version);
                btn.textContent=ok?(this._strings.btnInstalled||"✅ Done"):(this._strings.btnFailed||"❌ Failed");btn.classList.add(ok?"done":"err");
            });
        }
        // Auto-fetch versions with concurrency of 3
        const fetchQueue=[...this._body.querySelectorAll(".vs")].map(sel=>({sel,url:sel.dataset.url}));
        const _batch=self=>{
            let idx=0;
            const next=async()=>{
                while(idx<fetchQueue.length){
                    const item=fetchQueue[idx++];
                    if(!item)continue;
                    const sel2=document.querySelector(`.vs[data-url="${CSS.escape(item.url)}"]`);
                    if(sel2){if(self._versionCache[item.url])self._populateVersionSelect(sel2,item.url);else await self._populateVersionSelect(sel2,item.url)}
                }
            };
            // Start 3 concurrent workers
            Promise.all([next(),next(),next()]);
        };
        _batch(this);
        // Bind clickable version refresh on vspin elements
        for(const spin of this._body.querySelectorAll(".vspin")){
            spin.addEventListener("click",async()=>{
                const url=spin.dataset.url;
                const sel=this._body.querySelector(`.vs[data-url="${CSS.escape(url)}"]`);
                if(sel){this._versionCache[url]=null;await this._populateVersionSelect(sel,url,true)}
            });
        }
        const iall=this._body.querySelector("#wfa-iall");
        if(iall){
            iall.addEventListener("click",async()=>{
                // Only install uninstalled nodes (skip cards with .installed class)
                const ibs=[...this._body.querySelectorAll(".ib:not(.done):not(.err)")].filter(
                    btn=>!btn.closest(".wfa-card")?.classList.contains("installed")
                );
                if(ibs.length===0)return;
                // Build items list for confirmation
                const items=ibs.map(btn=>{
                    const url=btn.dataset.url;const sel=btn.parentElement.querySelector(".vs");const version=sel?sel.value:"latest";
                    const card=btn.closest(".wfa-card");const nameEl=card?.querySelector(".nm a");const name=nameEl?.textContent||url.split("/").pop();
                    return{name,version};
                });
                const confirmed=await this._showInstallConfirm(items);
                if(!confirmed)return;
                if(ibs.length===0)return;
                const acts=this._body.querySelector(".wfa-act");
                acts.innerHTML=`<div class="wfa-prog"><div class="tx" id="wfa-ptx">${await this.t("installProgress",{done:0,total:ibs.length})}</div><div class="bar"><div class="fl" style="width:0%" id="wfa-pfl"></div></div></div>`;
                const ptx=acts.querySelector("#wfa-ptx");const pfl=acts.querySelector("#wfa-pfl");let done=0,fail=0;
                for(const btn of ibs){
                    const url=btn.dataset.url;const sel=btn.parentElement.querySelector(".vs");const version=sel?sel.value:"latest";
                    btn.textContent="⏳";btn.disabled=true;
                    const ok=await this._installNode(url,version);btn.textContent=ok?"✅":"❌";btn.classList.add(ok?"done":"err");
                    if(ok)done++;else fail++;const pct=Math.round(((done+fail)/ibs.length)*100);
                    pfl.style.width=pct+"%";ptx.textContent=fail>0?await this.t("installProgressFail",{done,total:ibs.length,fail}):await this.t("installProgress",{done,total:ibs.length});
                }
                pfl.style.width="100%";pfl.style.background=fail>0?"#c88":"#4a8";
                ptx.textContent=fail>0?await this.t("installDoneFail",{done,fail}):await this.t("installDone",{count:done});
                if(done>0){const rb=document.createElement("button");rb.textContent="🔄 Re-check";rb.className="pri";rb.style.cssText="margin-top:8px;padding:4px 12px;font-size:12px;cursor:pointer;border:none;border-radius:5px;background:#2d6da8;color:#fff;";rb.addEventListener("click",()=>{if(this._lastAnalyzedFile)this._analyzeFile(this._lastAnalyzedFile);else this._renderInitial()});acts.appendChild(rb)}
            });
        }
        const copyBtn=this._body.querySelector("#wfa-copy");if(copyBtn)copyBtn.addEventListener("click",()=>{const urls=cList.map(n=>n.github_url).join("\n");navigator.clipboard.writeText(urls).then(()=>{copyBtn.textContent=this._strings.copied||"✅ Copied!";setTimeout(()=>{copyBtn.textContent=this._strings.btnCopyUrls||"📋 Copy URLs"},2000)})});
        const expBtn=this._body.querySelector("#wfa-export");if(expBtn)expBtn.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="workflow-analysis.json";a.click();URL.revokeObjectURL(url)});
        const refV=this._body.querySelector("#wfa-refresh-v");if(refV)refV.addEventListener("click",async()=>{
            refV.textContent=this._strings.btnRefreshing||"⏳ Refreshing...";refV.disabled=true;
            this._versionCache={}; // Clear memory cache
            const sels=this._body.querySelectorAll(".vs");
            for(const sel of sels){const url=sel.dataset.url;await this._populateVersionSelect(sel,url,true)}
            refV.textContent=this._strings.btnRefreshVersions||"🔄 Versions";refV.disabled=false;
        });
        // Bind unknown node search buttons
        for(const sbtn of this._body.querySelectorAll(".unk-sbtn")){
            sbtn.addEventListener("click",async()=>{
                const ct=sbtn.dataset.ct;if(!ct)return;
                const engine = this._currentSearchEngine || "bing";
                if (engine === "github") {
                    // GitHub: use API search (programmatic)
                    sbtn.textContent=this._strings.searching||"⏳ Searching...";sbtn.disabled=true;
                    const result=await this._searchNode(this._splitNodeName(ct));
                    sbtn.textContent=this._strings.btnSearchNode||"🔍 Search";sbtn.disabled=false;
                    if(result&&result.length>0){
                        // Cache
                        this._unknownCache[ct]={repo_name:result[0].repo_name,github_url:result[0].github_url};
                        this._saveUnknownCache();
                        // Show inline result after the button
                        const span=sbtn.closest("span");if(span){
                            const r=result[0];
                            const link=document.createElement("a");
                            link.href=r.github_url;link.target="_blank";link.rel="noopener";
                            link.textContent=" "+r.repo_name;
                            link.style.cssText="color:#5b9bd5;font-size:11px;margin-left:4px;text-decoration:none;";
                            link.onmouseover=function(){this.style.textDecoration="underline"};
                            link.onmouseout=function(){this.style.textDecoration="none"};
                            span.appendChild(link);
                            // Add a small reuse badge
                            const badge=document.createElement("span");
                            badge.textContent=" ✓cached";
                            badge.style.cssText="color:#4a8;font-size:9px;margin-left:2px;";
                            span.appendChild(badge);
                            sbtn.remove(); // Remove search button since we found it
                        }
                    }else{
                        // Show "not found" message
                        const msg=this._strings.searchNone||"No GitHub repo found, please search manually";
                        const span=sbtn.closest("span");if(span){const txt=document.createElement("span");txt.textContent=" "+msg;txt.style.cssText="color:#e06c6c;font-size:10px;margin-left:4px;";span.appendChild(txt)}
                    }
                } else {
                    // Other engines: open browser tab with search URL
                    const searchUrl = this._getSearchUrl(ct, engine);
                    if (searchUrl) {
                        window.open(searchUrl, '_blank');
                        // Brief feedback on the button
                        const origText = sbtn.textContent;
                        sbtn.textContent = "↗ " + (this._strings.labelOpenSearch || "Open in browser");
                        sbtn.style.background = "#4a8";
                        setTimeout(() => {
                            sbtn.textContent = origText;
                            sbtn.style.background = "";
                        }, 2000);
                    }
                }
            });
        }
        this._bindDropZoneResult();
    },
    /** Render model match results */
    async _renderModelMatch(result,fileName){
        this._viewState={type:"models",result,fileName};
        const models = result.models || [];
        const byCategory = {};
        for (const m of models) {
            const cat = m.category || "other";
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(m);
        }
        // Pre-fetch model lists for each category
        const catModelLists = {};
        const cats = Object.keys(byCategory);
        for (const cat of cats) {
            try {
                const r = await api.fetchApi("/wf-analyzer/list-models?category=" + encodeURIComponent(cat));
                if (r.ok) { const d = await r.json(); catModelLists[cat] = d.models || []; }
                else { catModelLists[cat] = []; }
            } catch { catModelLists[cat] = []; }
        }
        let html = `<div class="wfa-dz has-file" id="wfa-dz-result"><svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg><span class="fn">${this._esc(fileName)}</span><span class="chg" id="wfa-chg">${this._strings.dropChange||'(change)'}</span></div>`;
        html += `<div class="wfa-sum"><div class="st"><span class="n">${models.length}</span><span class="l">${(this._strings.sectionModels||'Model References ({count})').replace('{count}',models.length)}</span></div></div>`;
        for (const [cat, items] of Object.entries(byCategory)) {
            html += `<div class="wfa-sec" style="border-top:2px solid #5b9bd5;padding-top:10px;"><h3 style="color:#5b9bd5;">${this._esc(cat)} (${items.length})</h3>`;
            for (const m of items) {
                const bestMatch = m.matches && m.matches.length > 0 ? m.matches[0] : null;
                const matchClass = bestMatch ? "wfa-card" : "wfa-card unk";
                const matchInfo = bestMatch
                    ? `<span style="color:#4a8;">${this._esc((m.category + '\\' + bestMatch.path).replace(/\//g, '\\'))} <span style="font-size:10px;color:#888;">(${bestMatch.score}%)</span></span>`
                    : `<span style="color:#e06c6c;">${this._strings.modelNoMatch||'No match found in local models'}</span>`;
                const ty = this._splitNodeName(m.class_type);
                const modelList = catModelLists[cat] || [];
                const selId = "wfa-msel-" + m.node_id + "-" + m.model_key;
                let selOpts = '<option value="">-- none --</option>';
                let selValue = bestMatch ? this._esc(bestMatch.path) : "";
                // Also try matching by filename without extension
                const reqLower = m.requested_name.replace(/\.[^.]+$/, '\\').toLowerCase();
                let foundExact = false;
                for (const mp of modelList) {
                    const selected = (mp === selValue || mp.toLowerCase().includes(reqLower) || mp.toLowerCase() === m.requested_name.toLowerCase()) ? " selected" : "";
                    if (selected) foundExact = true;
                    selOpts += `<option value="${this._esc(mp)}"${selected}>${this._esc(mp.replace(/\//g,'\\'))}</option>`;
                }
                html += `<div class="${matchClass}" id="wfa-mcard-${m.node_id}"><div class="tp"><div class="nm"><span class="lbl">${this._esc(this._strings.labelNodes||'Nodes')}:</span> <span style="color:#7ec8e3;">${this._esc(ty)}</span></div></div><div class="url"><span class="lbl">${this._esc(this._strings.modelRequested||'Requested Name')}:</span> <span style="color:#ddd;">${this._esc(m.requested_name)}</span></div><div class="url"><span class="lbl">${this._esc(this._strings.modelMatched||'Matched')}:</span> ${matchInfo}</div><div class="url" style="display:flex;align-items:center;gap:4px;"><span class="lbl" style="white-space:nowrap;flex-shrink:0;">${this._esc(this._strings.modelManualSelect||'Manual Select:')}</span> <select id="${selId}" style="flex:1;padding:3px 6px;background:#1e1e1e;border:1px solid #555;border-radius:4px;color:#ddd;font-size:11px;cursor:pointer;">${selOpts}</select></div></div>`;
            }
            html += `</div>`;
        }
        html += `<div class="wfa-act"><button id="wfa-update-paths" style="background:#2563eb;border-color:#3b82f6;color:#fff;font-weight:700;">${this._strings.modelUpdateBtn||'📝 Update Model Paths'}</button><button id="wfa-rescan" style="background:#6a4a8a;border-color:#7a5a9a;color:#fff;">${this._strings.modelRescan||'🔄 Rescan All Models'}</button><button id="wfa-export">${this._strings.btnExportJson||'💾 Export JSON'}</button></div>`;
        this._body.innerHTML=html;
        const chg=this._body.querySelector("#wfa-chg");if(chg)chg.addEventListener("click",()=>{this._switchMode()});
        const expBtn=this._body.querySelector("#wfa-export");if(expBtn)expBtn.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="model-match.json";a.click();URL.revokeObjectURL(url)});
        // Bind manual select change handlers: update the Matched line
        for (const m of models) {
            const sel = this._body.querySelector("#wfa-msel-" + m.node_id + "-" + m.model_key);
            if (!sel) continue;
            sel.addEventListener("change", function() {
                const card = this.closest(".wfa-card");
                if (!card) return;
                const matchedLine = card.querySelector(".url:nth-child(3) span:last-child");
                if (matchedLine) {
                    if (this.value) {
                        const catLabel = this.closest('.wfa-sec')?.querySelector('h3')?.textContent?.split('(')[0]?.trim() || '\\'; matchedLine.innerHTML = '<span style="color:#4a8;">' + (catLabel ? catLabel + '/' : '\\') + this.options[this.selectedIndex].text.replace(/\//g,'\\') + ' <span style="font-size:10px;color:#888;">(manual)</span></span>';
                    } else {
                        matchedLine.innerHTML = '<span style="color:#e06c6c;">' + (this._strings?.modelNoMatch || 'No match found in local models') + '</span>';
                    }
                }
            });
        }
        // Rescan all models button handler
        const rescanBtn=this._body.querySelector("#wfa-rescan");
        if(rescanBtn){
            rescanBtn.addEventListener("click",async()=>{
                rescanBtn.textContent=this._strings.modelRescanning||"⏳ Scanning models...";rescanBtn.disabled=true;
                try{
                    const resp=await api.fetchApi("/wf-analyzer/refresh-models",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
                    if(resp.ok){
                        const d=await resp.json();
                        const msg=(this._strings.modelRescanDone||"✅ Scanned {cat} categories, {files} files").replace("{cat}",d.categories).replace("{files}",d.total_files);
                        rescanBtn.textContent=msg;rescanBtn.style.background="#4a8";
                        const sels=this._body.querySelectorAll("select[id^=\"wfa-msel-\"]");
                        for(const sel of sels){
                            const sec=sel.closest(".wfa-sec");const h3=sec?.querySelector("h3");
                            if(!h3)continue;
                            const catName=h3.textContent.split("(")[0].trim();
                            try{
                                const r2=await api.fetchApi("/wf-analyzer/list-models?category="+encodeURIComponent(catName));
                                if(r2.ok){const d2=await r2.json();const files=d2.models||[];
                                    const curVal=sel.value;sel.innerHTML="<option value=\"\">-- none --</option>";
                                    for(const f of files){const opt=document.createElement("option");opt.value=f;opt.textContent=f;if(f===curVal)opt.selected=true;sel.appendChild(opt)}}
                            }catch{}
                        }
                    }else{rescanBtn.textContent=this._strings.modelRescan||"🔄 Rescan All Models";rescanBtn.style.background="";}
                }catch{rescanBtn.textContent=this._strings.modelRescan||"🔄 Rescan All Models";rescanBtn.style.background="";}
                setTimeout(()=>{rescanBtn.style.background="";rescanBtn.disabled=false;rescanBtn.textContent=this._strings.modelRescan||"🔄 Rescan All Models"},3000);
            });
        }
        // Update model paths button: apply selected paths to canvas
        const updateBtn=this._body.querySelector("#wfa-update-paths");
        if(updateBtn){
            updateBtn.addEventListener("click",async()=>{
                updateBtn.textContent=this._strings.modelApplying||"⏳ Applying...";updateBtn.disabled=true;
                let updated=0;
                try{
                    const graph=app?.graph;
                    if(!graph||!Array.isArray(graph._nodes)){updateBtn.textContent=this._strings.modelUpdateBtn||"📝 Update Model Paths";updateBtn.disabled=false;return;}
                    for(const m of models){
                        const sel=this._body.querySelector("#wfa-msel-"+m.node_id+"-"+m.model_key);
                        if(!sel||!sel.value)continue;
                        const targetNode=graph._nodes.find(n=>String(n.id)===String(m.node_id));
                        if(!targetNode||!Array.isArray(targetNode.widgets))continue;
                        const widget=targetNode.widgets.find(w=>w.name===m.model_key);
                        if(!widget)continue;
                        const optValue=widget.options?.values?.find(v=>String(v)===sel.value)
                            ||widget.options?.values?.find(v=>String(v).replace(/\\/g,"/")===sel.value)
                            ||sel.value;
                        if(String(widget.value)!==String(optValue)){
                            widget.value=optValue;
                            updated+=1;
                        }
                    }
                    if(graph.change)graph.change();
                    if(graph.setDirtyCanvas)graph.setDirtyCanvas(true,true);
                    const msg=(this._strings.modelApplyDone||"✅ Updated {count} nodes on canvas").replace("{count}",updated);
                    updateBtn.textContent=msg;updateBtn.style.background="#4a8";
                }catch(e){updateBtn.textContent=this._strings.modelUpdateBtn||"📝 Update Model Paths";}
                setTimeout(()=>{updateBtn.style.background="#2563eb";updateBtn.disabled=false;updateBtn.textContent=this._strings.modelUpdateBtn||"📝 Update Model Paths"},3000);
            });
        }
        this._bindDropZoneResult();
    },
    _renderCards(nodes,isInstalled){
        let h="";const it=this._strings.btnInstall||"⬇ Install";const rt=this._strings.btnReinstall||"🔄 Reinstall";
        for(const n of nodes){const ty=n.class_types||[];const u=n.github_url;
            h+=`<div class="${isInstalled?"wfa-card installed":"wfa-card"}" data-url="${this._esc(u)}"><div class="tp"><div class="nm"><span class="lbl">${this._esc(this._strings.labelRepo||'Repo')}:</span> <a href="#" onclick="navigator.clipboard.writeText('${this._esc(n.repo_name)}');this.style.color='#4a8';setTimeout(()=>this.style.color='\\',800);return false;" style="color:#7ec8e3;text-decoration:none;" title="${this._esc(this._strings.labelCopy||'Click to copy')}">${this._esc(n.repo_name)}</a></div><span class="vspin" data-url="${this._esc(u)}"></span><select class="vs" data-url="${this._esc(u)}"><option value="latest">latest</option></select><button class="ib" data-url="${this._esc(u)}">${isInstalled?rt:it}</button></div><div class="url"><span class="lbl">${this._esc(this._strings.labelUrl||'URL')}:</span> <a href="${this._esc(u)}" target="_blank" rel="noopener" style="color:#5b9bd5;">${this._esc(u)}</a></div><div class="tys"><span class="lbl">${this._esc(this._strings.labelNodes||'Nodes')}:</span> ${ty.map(t=>`<span>${this._esc(this._splitNodeName(t))}</span>`).join("")}</div></div>`
        }return h;
    },
    _bindDropZone(el){const fi=this._fileInput;const self=this;
        el.addEventListener("click",()=>fi.click());fi.addEventListener("change",()=>{const f=fi.files?.[0];if(f){fi.value="";self._analyzeFile(f)}});
        el.addEventListener("dragenter",e=>{e.preventDefault();el.classList.add("dragover")});el.addEventListener("dragover",e=>e.preventDefault());
        el.addEventListener("dragleave",()=>el.classList.remove("dragover"));el.addEventListener("drop",e=>{e.preventDefault();el.classList.remove("dragover");const f=e.dataTransfer?.files?.[0];if(f&&f.name.endsWith(".json"))self._analyzeFile(f)});
    },
    _bindDropZoneResult(){const fi=this._fileInput;const self=this;fi.addEventListener("change",()=>{const f=fi.files?.[0];if(f){fi.value="";self._analyzeFile(f)}})},

    // Analyze file
    async _analyzeFile(file){this._viewState=null;this._lastAnalyzedFile=file;const body=this._body;
        const at=(this._strings.analyzing||'Analyzing <strong>{fileName}</strong>...').replace('{fileName}',this._esc(file.name));
        const waitMsg = this._isModelMode ? (this._strings.modelWait||'Matching models in <strong>{fileName}</strong>...').replace('{fileName}',this._esc(file.name)) : at;
        body.innerHTML=`<div class="wfa-load"><div class="wfa-spin"></div><div style="margin-top:8px">${waitMsg}</div></div>`;
        try{const text=await file.text();const wd=JSON.parse(text);
            if(this._isModelMode){
                const resp=await api.fetchApi("/wf-analyzer/analyze-models",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workflow:wd})});
                if(resp.ok){const result=await resp.json();await this._renderModelMatch(result,file.name)}else{throw new Error("API error")}
            }else{
                const resp=await api.fetchApi("/wf-analyzer/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workflow:wd})});
                let result;if(resp.ok)result=await resp.json();else result=await this._clientSideAnalyze(wd);await this._renderResult(result,file.name)
            }
        }catch(err){const et=(this._strings.errorPrefix||'Error: {msg}').replace('{msg}',err.message);
            body.innerHTML=`<div class="wfa-dz" id="wfa-dz-err" style="border-color:#c44;"><svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" style="stroke:#c44;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg><div class="hint" style="color:#e06c6c;">${this._esc(et)}</div><div class="hint" style="font-size:11px;">${this._strings.dropAgain||'Drop another file or click to browse'}</div></div>`;
            this._bindDropZone(body.querySelector("#wfa-dz-err"));
        }
    },

    // Client-side analysis
    async _clientSideAnalyze(wd){
        if(!this._nodeMap){try{const r=await api.fetchApi("/wf-analyzer/node-map");this._nodeMap=await r.json()}catch{this._nodeMap={}}}
        const types=this._collectTypes(wd);const B=new Set(["KSampler","KSamplerAdvanced","CheckpointLoaderSimple","CLIPTextEncode","CLIPSetLastLayer","CLIPVisionEncode","VAEDecode","VAEEncode","VAEEncodeForInpaint","LoadImage","SaveImage","PreviewImage","LoadLatent","SaveLatent","EmptyLatentImage","LatentUpscale","LatentUpscaleBy","LatentRotate","LatentFlip","LatentComposite","LatentBlend","LatentCrop","UpscaleModelLoader","ImageUpscaleWithModel","ImageScale","ImageScaleToTotalPixels","ImageCrop","ImageInvert","ImagePadForOutpaint","ImageResize","ImageFlip","ImageRotate","ImageBlend","ImageComposite","LoraLoader","LoraLoaderModelOnly","ControlNetLoader","ControlNetApply","ControlNetApplyAdvanced","DiffControlNetLoader","CLIPLoader","DualCLIPLoader","UNETLoader","VAELoader","HypernetworkLoader","GLIGENLoader","StyleModelLoader","CLIPVisionLoader","IPAdapterApply","Reroute","Note","PrimitiveNode","ConditioningCombine","ConditioningAverage","ConditioningSetArea","ConditioningSetMask","ConditioningZeroOut","ConditioningSetTimestepRange","ModelMergeSimple","ModelMergeSubtract","ModelMergeAdd","ModelMergeMultiply","VAEDecodeTiled","VAEEncodeTiled","ImageBatch","LatentBatch","CheckpointLoader","FluxGuidance","DualCFGGuider","EmptySD3LatentImage","EmptyMochiLatentImage","LoadVideo","SaveVideo","unCLIPCheckpointLoader","GLIGENTextBoxApply","InstructPixToPixConditioning","PixelKSampleUpscalerProvider"]);
        let bi=0;const co={};const un=[];
        for(const ct of[...types].sort()){const urls=this._nodeMap[ct];if(B.has(ct))bi++;else if(urls?.length){for(const url of urls){if(url==="https://github.com/comfyanonymous/ComfyUI"||url==="https://github.com/Comfy-Org/ComfyUI"){bi++;continue}if(!co[url])co[url]={github_url:url,repo_name:url.replace(/\/+$/,"").split("/").pop(),class_types:[]};co[url].class_types.push(ct)}}else un.push(ct)}
        return{total_nodes:types.size,builtin_count:bi,custom_nodes:Object.values(co),unknown_nodes:un};
    },
    _collectTypes(wf){const s=new Set();if(!wf)return s;if(wf.nodes&&Array.isArray(wf.nodes)){for(const n of wf.nodes){if(n.type&&typeof n.type==='string'&&!n.type.startsWith('_'))s.add(n.type)}}if(typeof wf==='object'){for(const k of Object.keys(wf)){const v=wf[k];if(v&&v.class_type)s.add(v.class_type)}}return s},

    // Install / Version
    /** Load version cache from server cache/versions.json */
    _loadVersionCache(){
        // Always return a promise-like interface — we'll handle synchronously via stored cache
        return this._promiseCache;
    },
    /** Save version cache to server cache/versions.json */
    _saveVersionCache(versionsMap){
        const cache={date:new Date().toISOString().slice(0,10),versions:versionsMap};
        api.fetchApi("/wf-analyzer/cache/versions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(cache)}).catch(()=>{});
    },
    /** Pre-load cache on setup */
    async _preloadCache(){
        try{const r=await api.fetchApi("/wf-analyzer/cache/versions");this._promiseCache=await r.json()}catch{this._promiseCache=null}
    },
    /** Pre-load unknown node search cache */
    async _preloadUnknownCache(){
        try{const r=await api.fetchApi("/wf-analyzer/cache/unknown");this._unknownCache=await r.json()}catch{this._unknownCache={}}
    },
    /** Save unknown node search cache to server */
    _saveUnknownCache(){
        api.fetchApi("/wf-analyzer/cache/unknown",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(this._unknownCache)}).catch(()=>{});
    },
    /** Search for a node class_type on GitHub */
    async _searchNode(classType){
        try{
            const resp=await api.fetchApi("/wf-analyzer/search-node",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({class_type:classType})});
            if(resp.ok){const d=await resp.json();return d.results||[]}
        }catch{}
        return [];
    },
    /** Get search URL for a class_type based on engine */
    _getSearchUrl(classType, engine){
        const splitName = this._splitNodeName(classType);
        const q = encodeURIComponent(splitName + " ComfyUI node");
        const map = {
            github: "https://github.com/search?q=" + q + "&type=repositories",
            google: "https://www.google.com/search?q=" + q,
            baidu: "https://www.baidu.com/s?wd=" + q,
            duckduckgo: "https://duckduckgo.com/?q=" + q,
            bing: "https://www.bing.com/search?q=" + q
        };
        return map[engine] || map.bing;
    },
    /** Split CamelCase node name into separate words */
    _splitNodeName(name){
        if (!name) return "";
        return name.replace(/([a-z])([A-Z])/g, '$1 $2')
                    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    },
    /** Show install confirmation dialog. Returns Promise<boolean> */
    _showInstallConfirm(items){
        // Store resolve for re-entry safety
        if (this._confirmResolve) {
            this._confirmResolve(false); // reject any pending
        }
        return new Promise(resolve=>{
            this._confirmResolve = resolve;
            let ov=document.getElementById("wfa-confirm-overlay");
            if(!ov){
                ov=document.createElement("div");ov.id="wfa-confirm-overlay";
                ov.innerHTML=`<div id="wfa-confirm-panel"><div class="hdr"><span class="ttl" id="wfa-confirm-ttl">Confirm Install</span></div><div class="body" id="wfa-confirm-body"></div><div class="foot"><button class="cancel" id="wfa-confirm-no">Cancel</button><button class="ok" id="wfa-confirm-yes">OK</button></div></div>`;
                document.body.appendChild(ov);
                ov.querySelector("#wfa-confirm-no").addEventListener("click",()=>{
                    const r=this._confirmResolve;this._confirmResolve=null;
                    ov.classList.remove("open");ov.style.display="none";if(r)r(false);
                });
                ov.querySelector("#wfa-confirm-yes").addEventListener("click",()=>{
                    const r=this._confirmResolve;this._confirmResolve=null;
                    ov.classList.remove("open");ov.style.display="none";if(r)r(true);
                });
                ov.addEventListener("click",e=>{if(e.target===ov){
                    const r=this._confirmResolve;this._confirmResolve=null;
                    ov.classList.remove("open");ov.style.display="none";if(r)r(false);
                }});
            }
            // Update with current language strings
            ov.querySelector("#wfa-confirm-ttl").textContent=items.length>1?`${this._strings.confirmTitleAll||"Install All"} (${items.length})`:this._strings.confirmTitle||"Confirm Install";
            ov.querySelector("#wfa-confirm-no").textContent=this._strings.confirmCancel||"Cancel";
            ov.querySelector("#wfa-confirm-yes").textContent=this._strings.confirmOk||"OK";
            ov.querySelector("#wfa-confirm-body").innerHTML=items.map(i=>`<div class="ci"><span class="cn">${this._esc(i.name)}</span><span class="cv">${this._esc(i.version)}</span></div>`).join("");
            ov.style.display="flex";ov.classList.add("open");
        });
    },
    async _populateVersionSelect(sel,githubUrl,forceRefresh){
        if(!sel||!sel.parentElement)return; // DOM element no longer valid
        const spin = document.querySelector(`.vspin[data-url="${CSS.escape(githubUrl)}"]`);
        if(spin){spin.classList.remove("idle","done");spin.classList.add("vspin")}
        // Auto-fetch: check today's cache first (unless forceRefresh)
        if(!forceRefresh){
            const cache=this._loadVersionCache();
            if(cache&&cache.date===new Date().toISOString().slice(0,10)&&cache.versions[githubUrl]){
                this._versionCache[githubUrl]=cache.versions[githubUrl];
                if(sel.parentElement)this._applyVersionsToSelect(sel,cache.versions[githubUrl]);
                if(spin)spin.classList.add("idle");
                return;
            }
        }
        // Fetch from network
        if(this._versionCache[githubUrl]&&!forceRefresh){if(sel.parentElement)this._applyVersionsToSelect(sel,this._versionCache[githubUrl]);if(spin)spin.classList.add("idle");return}
        try{const resp=await api.fetchApi("/wf-analyzer/node-versions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({github_url:githubUrl})});
            if(resp.ok&&sel.parentElement){const d=await resp.json();const vs=d.versions||["latest"];this._versionCache[githubUrl]=vs;this._applyVersionsToSelect(sel,vs)
                // Save to persistent cache
                const cur=this._loadVersionCache()||{date:new Date().toISOString().slice(0,10),versions:{}};
                cur.versions[githubUrl]=vs;this._saveVersionCache(cur.versions);
            }
        }catch{}
        if(spin)spin.classList.add("idle");
    },
    _applyVersionsToSelect(sel,versions){
        const spin = document.querySelector(`.vspin[data-url="${CSS.escape(sel.dataset.url)}"]`);
        if(spin)spin.classList.add("idle");
        const cur=sel.value;sel.innerHTML="";for(const v of versions){const opt=document.createElement("option");opt.value=v;opt.textContent=v;if(v===cur||(cur==="latest"&&v==="latest"))opt.selected=true;sel.appendChild(opt)}
    },
    async _installNode(githubUrl,version){version=version||"latest";
        try{const resp=await api.fetchApi("/wf-analyzer/install-nodes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({urls:[{url:githubUrl,version}]})});
            if(!resp.ok)return false;const d=await resp.json();const r=d.results?.[0];return r?.status===200
        }catch{return false}
    },
    _esc(s){if(!s)return "";return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m])},
});
