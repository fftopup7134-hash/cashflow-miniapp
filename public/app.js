const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const tgUser = tg?.initDataUnsafe?.user;
const state = { userId: tgUser?.id || "demo", name: tgUser?.first_name || "Guest" };

async function api(url, body={}) {
  const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data = await r.json();
  if(!r.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
function render(u){
  document.getElementById("balance").textContent = Number(u.balance).toFixed(2);
  document.getElementById("name").textContent = u.name;
  document.getElementById("uid").textContent = u.id;
  document.getElementById("avatar").textContent = (u.name||"G").charAt(0).toUpperCase();
  document.getElementById("adCount").textContent = `${u.adsWatched} / 20`;
  document.getElementById("adProgress").style.width = `${Math.min(100,u.adsWatched/20*100)}%`;
}
function toast(msg){const x=document.getElementById("toast");x.textContent=msg;x.style.display="block";setTimeout(()=>x.style.display="none",1800)}
async function load(){
  try{
    const u=await api("/api/session",{initData:tg?.initData||"",user:tgUser||state});
    render(u);
  }catch(e){toast(e.message)}
}
async function watchAd(){
  try{
    if (typeof window.show_11916419 !== "function") {
      throw new Error("Monetag ad is not ready yet. Please try again.");
    }
    toast("Loading ad...");
    await window.show_11916419();
    // Credit only after the Monetag rewarded-interstitial promise resolves.
    render(await api("/api/watch-ad",state));
    toast("Ad completed! +$0.30");
  }catch(e){
    toast(e.message || "Ad was not completed");
  }
}
async function completeTask(){
  try{render(await api("/api/task",state));toast("Task completed")}catch(e){toast(e.message)}
}
async function invite(){
  const link = tgUser ? `https://t.me/${location.hostname.replace(/[^a-zA-Z0-9_]/g,"")}?start=ref_${tgUser.id}` : location.href;
  try{await navigator.clipboard.writeText(link);toast("Invite link copied")}catch{toast("Invite link: "+link)}
}
async function withdraw(){
  try{
    const u=await api("/api/withdraw",{...state,amount:document.getElementById("amount").value,method:document.getElementById("method").value,account:document.getElementById("account").value});
    render(u);document.getElementById("withdrawStatus").textContent="Withdrawal request submitted.";
    toast("Withdrawal request submitted");
  }catch(e){document.getElementById("withdrawStatus").textContent=e.message;toast(e.message)}
}
function go(id){document.getElementById(id).scrollIntoView({behavior:"smooth",block:"start"})}
function showSupport(){toast("Support: add your Telegram support username in index.html")}
function toggleLanguage(){document.getElementById("lang").textContent=document.getElementById("lang").textContent==="EN"?"BN":"EN";toast("Language toggle demo")}
load();

/* CashFlow Monetag rewarded-ad controller
   Server-authoritative reward flow:
   - max 20 rewarded impressions per UTC day
   - a server-issued nonce is required for each attempt
   - the client never changes the balance directly
   - Monetag controls ad delivery/fill
*/
(function () {
  const MAX_ADS_PER_DAY = 20;
  let busy = false;

  function tgUserId() {
    try {
      return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
    } catch (_) { return null; }
  }

  async function api(path, body) {
    const r = await fetch(path, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body || {})
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  window.CashFlowMonetag = {
    async watchAd() {
      if (busy) return {ok:false, error:"An ad is already running."};
      if (typeof window.show_11916419 !== "function") {
        return {ok:false, error:"Monetag SDK is not ready."};
      }

      const userId = tgUserId();
      if (!userId) return {ok:false, error:"Open this app from Telegram."};

      busy = true;
      try {
        const start = await api("/api/ad/start", {telegram_id: String(userId)});
        if (start.remaining <= 0) return {ok:false, error:"Daily ad limit reached."};

        await window.show_11916419();

        // Only notify the server after the SDK promise resolves.
        const complete = await api("/api/ad/complete", {
          telegram_id: String(userId),
          nonce: start.nonce
        });
        return complete;
      } catch (e) {
        return {ok:false, error:e.message || "Ad was not completed."};
      } finally {
        busy = false;
      }
    }
  };
})();
