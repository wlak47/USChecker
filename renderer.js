const $ = id => document.getElementById(id);
let records = [], busy = false, stopRequested = false, selectedUsername = null, verifiedRecords = [];

function makeNames(length, amount, set) {
  const chars = set === "alnum" ? "abcdefghijklmnopqrstuvwxyz0123456789" : "abcdefghijklmnopqrstuvwxyz";
  const max = chars.length ** length, names = new Set();
  if (amount >= max && max <= 1000000) {
    const walk = prefix => {
      if (prefix.length === length) { names.add(prefix); return; }
      for (const c of chars) walk(prefix + c);
    };
    walk("");
  } else {
    while (names.size < amount) {
      let value = "";
      for (let i=0;i<length;i++) value += chars[Math.floor(Math.random()*chars.length)];
      names.add(value);
    }
  }
  return [...names].slice(0, amount);
}
function pct(n, total) { return total ? Math.round(n / total * 100) : 0; }
function updateStats() {
  const total = records.length;
  const available = records.filter(x=>x.status==="AVAILABLE").length;
  const taken = records.filter(x=>x.status==="TAKEN").length;
  const review = records.filter(x=>x.status==="CANDIDATE"||x.status==="UNKNOWN").length;
  $("count").textContent = total ? total : "—";
  $("available").textContent = total ? available : "—";
  $("taken").textContent = total ? taken : "—";
  $("review").textContent = total ? review : "—";
  $("availablePct").textContent = pct(available,total)+"%";
  $("takenPct").textContent = pct(taken,total)+"%";
  $("reviewPct").textContent = pct(review,total)+"%";
  $("availableBar").style.width = pct(available,total)+"%";
  $("takenBar").style.width = pct(taken,total)+"%";
  $("reviewBar").style.width = pct(review,total)+"%";
  $("resultCount").textContent = `${total} RECORD${total===1?"":"S"}`;
  $("export").disabled = !total;
}
function save() { return window.handleScout.save(records); }
function addRow(record) {
  const empty = document.querySelector(".empty-row"); if (empty) empty.remove();
  const tr = document.createElement("tr");
  tr.dataset.username = record.username;
  const name = document.createElement("td"); name.textContent = record.username; name.style.fontWeight = "700";
  const state = document.createElement("td"); state.className = "status-chip status-"+record.status; state.textContent = record.status;
  const detail = document.createElement("td"); detail.textContent = record.detail;
  const profile = document.createElement("td");
  if (record.url) {
    const a = document.createElement("a"); a.className = "profile-link"; a.href = "#"; a.textContent = "Open profile ↗";
    a.addEventListener("click", e=>{e.preventDefault();window.handleScout.openProfile(record.url);});
    profile.appendChild(a);
  } else profile.textContent = "—";
  tr.append(name,state,detail,profile);
  tr.addEventListener("click",()=>selectRow(tr,record.username));
  $("rows").prepend(tr);
}
function selectRow(tr, username) {
  document.querySelectorAll("#rows tr").forEach(x=>x.classList.remove("selected"));
  tr.classList.add("selected"); selectedUsername = username;
  const record = records.find(x=>x.username===username);
  $("confirm").disabled = !record || record.status==="AVAILABLE";
  $("markTaken").disabled = !record || record.status==="TAKEN";
}
async function updateRecord(username,status,detail) {
  const record = records.find(x=>x.username===username); if(!record) return;
  record.status=status; record.detail=detail;
  const row = [...$("rows").querySelectorAll("tr")].find(x=>x.dataset.username===username);
  if(row) {
    row.querySelector("td:nth-child(2)").textContent=status;
    row.querySelector("td:nth-child(2)").className="status-chip status-"+status;
    row.querySelector("td:nth-child(3)").textContent=detail;
  }
  updateStats(); await save(); selectRow(row,username);
}

function showView(view) {
  const scanner = view === "scanner";
  $("scannerView").hidden = !scanner;
  $("availableView").hidden = scanner;
  $("scannerNav").classList.toggle("active", scanner);
  $("availableNav").classList.toggle("active", !scanner);
  if (!scanner) renderVerified();
}
function platformLogo(platform) {
  const paths = {
    TikTok: '<path d="M14 3v11.2a4.2 4.2 0 1 1-3.7-4.17v3.1a1.3 1.3 0 1 0 .7 1.16V3h3c.2 2 1.3 3.2 3.2 3.5v3.1A7.1 7.1 0 0 1 14 8.2"/>',
    Instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
    X: '<path d="M4 3h4.4l11.6 18h-4.4L4 3Zm0 18 6.7-7.5m2.6-3L20 3"/>',
    Twitch: '<path d="M5 3h17v12l-5 5h-4l-3 3v-3H5V3Zm4 4v6m5-6v6"/>',
    Threads: '<path d="M18.5 8.5c-.8-3.1-3-4.7-6.4-4.7-4.3 0-7.1 3.2-7.1 8.1 0 5 2.8 8.3 7.2 8.3 3.8 0 6.3-2.2 6.3-5.4 0-2.4-1.6-4-4.1-4-2.2 0-3.6 1.2-3.6 3 0 1.5 1.1 2.5 2.7 2.5 2.5 0 4.1-2.3 4.1-5.6"/>',
    YouTube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[platform] || ""}</svg>`;
}
function renderVerified() {
  const platform = $("savedPlatform").value, term = $("savedSearch").value.trim().toLowerCase();
  const filtered = verifiedRecords.filter(r => (platform === "all" || r.platform === platform) && r.username.toLowerCase().includes(term));
  $("savedTotal").textContent = verifiedRecords.length;
  $("savedCount").textContent = verifiedRecords.length;
  const groups = ["TikTok","Instagram","X","Twitch","Threads","YouTube"]
    .map(name => ({name,items:filtered.filter(r=>r.platform===name)})).filter(g=>g.items.length);
  const root = $("savedGroups"); root.replaceChildren();
  if (!groups.length) {
    const empty = document.createElement("div"); empty.className="saved-empty";
    const b=document.createElement("b"); b.textContent=verifiedRecords.length ? "No matching usernames" : "Nothing verified yet";
    const span=document.createElement("span"); span.textContent=verifiedRecords.length ? "Try another platform or search term." : "Run a scan, select a candidate, then confirm it after the official app accepts it.";
    empty.append(b,span); root.append(empty); return;
  }
  for (const group of groups) {
    const card=document.createElement("section"); card.className="saved-group";
    const head=document.createElement("div"); head.className="saved-group-head";
    const identity=document.createElement("div"); identity.className="saved-platform-identity";
    const logo=document.createElement("span"); logo.className="platform-logo";
    logo.innerHTML=platformLogo(group.name);
    const title=document.createElement("b"); title.textContent=group.name;
    identity.append(logo,title);
    const count=document.createElement("span"); count.textContent=`${group.items.length} VERIFIED`;
    head.append(identity,count);
    const handles=document.createElement("div"); handles.className="saved-handles";
    for (const record of group.items) {
      const chip=document.createElement("button"); chip.className="saved-handle"; chip.textContent="@"+record.username;
      chip.title="Open public profile"; chip.addEventListener("click",()=>{if(record.url)window.handleScout.openProfile(record.url);});
      handles.append(chip);
    }
    card.append(head,handles); root.append(card);
  }
}
$("scannerNav").addEventListener("click",()=>showView("scanner"));
$("availableNav").addEventListener("click",()=>showView("available"));
$("savedPlatform").addEventListener("change",renderVerified);
$("savedSearch").addEventListener("input",renderVerified);
$("savedExport").addEventListener("click",async()=>{
  const q=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=["platform,username,status,details,profile_url",...verifiedRecords.map(r=>[r.platform,r.username,r.status,r.detail,r.url].map(q).join(","))].join("\r\n");
  const result=await window.handleScout.exportCsv(csv);
  if(!result.canceled)$("savedTotal").textContent=verifiedRecords.length;
});

function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

$("start").addEventListener("click", async()=>{
  if(busy)return;
  const platform=$("platform").value, length=Number($("length").value), charset=$("charset").value, amount=Number($("amount").value);
  if(!platform||!length||!charset||!Number.isInteger(amount)||amount<1||amount>5000){
    $("validation").textContent="Complete all four settings before starting (quantity: 1–5000).";return;
  }
  $("validation").textContent="";
  records=[];selectedUsername=null;$("rows").replaceChildren();updateStats();
  const names=makeNames(length,amount,charset);
  busy=true;stopRequested=false;$("start").disabled=true;$("stop").disabled=false;
  $("confirm").disabled=true;$("markTaken").disabled=true;
  $("sessionState").textContent="SCAN IN PROGRESS";
  $("status").textContent=`Preparing ${names.length} unique handles for ${platform}…`;
  $("progressBar").style.width="0%";$("progressLabel").textContent="0%";
  for(let i=0;i<names.length;i++){
    if(stopRequested)break;
    const result=await window.handleScout.check({platform,username:names[i]});
    result.platform = platform;
    records.push(result);addRow(result);updateStats();await save();
    const progress=Math.round((i+1)/names.length*100);
    $("progressBar").style.width=progress+"%";$("progressLabel").textContent=progress+"%";
    $("status").textContent=`Checking ${i+1} of ${names.length} · ${result.username} · ${result.status}`;
    if(i+1<names.length&&!stopRequested)await delay(950);
  }
  busy=false;$("start").disabled=false;$("stop").disabled=true;
  $("sessionState").textContent=stopRequested?"SCAN PAUSED":"SCAN COMPLETE";
  $("status").textContent=`${stopRequested?"Scan stopped":"Scan complete"} · ${records.length} results auto-saved.`;
});
$("stop").addEventListener("click",()=>{stopRequested=true;$("status").textContent="Stopping after current request…";});
$("confirm").addEventListener("click",async()=>{
  if(!selectedUsername)return;
  const ok=confirm("Did the official platform itself accept this username and allow you to save it? Only confirm if you tested it in the platform's own username settings.");
  if(ok) {
    await updateRecord(selectedUsername,"AVAILABLE","Confirmed by user in official platform");
    const record=records.find(r=>r.username===selectedUsername);
    if(record) {
      const idx=verifiedRecords.findIndex(r=>r.platform===record.platform&&r.username===record.username);
      if(idx>=0)verifiedRecords[idx]={...record}; else verifiedRecords.push({...record});
      $("savedCount").textContent=verifiedRecords.length;
    }
  }
});
$("markTaken").addEventListener("click",async()=>{
  if(selectedUsername)await updateRecord(selectedUsername,"TAKEN","Manually marked as taken");
});
$("export").addEventListener("click",async()=>{
  if(!records.length)return;
  const q=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=["username,status,details,profile_url",...records.map(r=>[r.username,r.status,r.detail,r.url].map(q).join(","))].join("\r\n");
  const result=await window.handleScout.exportCsv(csv);
  if(!result.canceled)$("status").textContent="CSV report exported successfully.";
});
$("folderBtn").addEventListener("click",()=>window.handleScout.openResultsFolder());
$("folderNav").addEventListener("click",()=>window.handleScout.openResultsFolder());

window.handleScout.loadVerified().then(items=>{verifiedRecords=Array.isArray(items)?items:[];$("savedCount").textContent=verifiedRecords.length;});
