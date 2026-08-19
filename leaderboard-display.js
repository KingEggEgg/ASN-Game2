import { firebaseConfig, leaderboardPath } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase, ref, onValue, get, remove } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $=id=>document.getElementById(id);
const tokens=["YOUR_API_KEY","YOUR_PROJECT_ID","YOUR_MESSAGING_SENDER_ID","YOUR_APP_ID"];
const configured=tokens.every(t=>!JSON.stringify(firebaseConfig).includes(t)) && !!firebaseConfig.databaseURL;

function fmt(s){s=Math.max(0,Number(s)||0);return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;}
function esc(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function sortRows(rows){return rows.sort((a,b)=>(Number(a.scoreSeconds)||999999)-(Number(b.scoreSeconds)||999999)||(Number(a.completedAt)||0)-(Number(b.completedAt)||0));}
function render(scores){
  const top50=scores.slice(0,50);
  $("bestTime").textContent=top50.length?fmt(top50[0].scoreSeconds):"--:--";
  $("displayRows").innerHTML=top50.length?top50.map((x,i)=>`<tr><td>#${i+1}</td><td>${esc(x.playerName||"Player")}</td><td>${fmt(x.scoreSeconds)}</td></tr>`).join(""):'<tr><td colspan="3" style="text-align:center;opacity:.65">No scores yet.</td></tr>';
  $("displayStatus").textContent=`● LIVE · TOP 50 · ${top50.length} shown / ${scores.length} total · refresh every 5 sec`;
  $("lastRefresh").textContent="Refresh: "+new Date().toLocaleTimeString();
}
function snapshotToRows(snap){
  const raw=snap.val()||{};
  const rows=[];
  const add=(id,value)=>{
    if(value && Number.isFinite(Number(value.scoreSeconds))) rows.push({id,...value});
  };
  Object.entries(raw).forEach(([id,value])=>{
    if(value && Number.isFinite(Number(value.scoreSeconds))) add(id,value);
    else if(value && typeof value==='object') Object.entries(value).forEach(([subId,subValue])=>add(`${id}/${subId}`,subValue));
  });
  return sortRows(rows);
}

if(!configured){
  $("displayStatus").textContent="Leaderboard not connected — configure firebase-config.js";
}else{
  try{
    const app=initializeApp(firebaseConfig);
    const db=getDatabase(app);
    const auth=getAuth(app);
    const scoreRef=ref(db,leaderboardPath);
    const applySnapshot=snap=>render(snapshotToRows(snap));

    onValue(scoreRef,applySnapshot,err=>{
      console.error(err);
      $("displayStatus").textContent="Connection error — check Firebase rules/config";
    });

    async function refreshNow(){
      try{applySnapshot(await get(scoreRef));}
      catch(err){console.error("5-sec refresh failed",err);}
    }
    setInterval(refreshNow,5000);
    refreshNow();

    $("adminToggle").onclick=()=>$("adminPanel").classList.toggle("show");
    onAuthStateChanged(auth,user=>{
      $("adminLoggedOut").hidden=!!user;
      $("adminLoggedIn").hidden=!user;
      $("adminUser").textContent=user?.email||"";
      $("adminMessage").textContent=user?"Admin authenticated. You can reset the leaderboard.":"";
    });
    $("adminLogin").onclick=async()=>{
      $("adminMessage").textContent="Signing in...";
      try{await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value);$("adminMessage").textContent="Login successful.";}
      catch(err){console.error(err);$("adminMessage").textContent="Login failed. Check email/password and enable Email/Password Authentication.";}
    };
    $("adminLogout").onclick=async()=>{await signOut(auth);$("adminMessage").textContent="Logged out.";};
    $("resetScores").onclick=async()=>{
      if(!auth.currentUser){$("adminMessage").textContent="Admin login required.";return;}
      if(!confirm("Delete ALL leaderboard scores? This cannot be undone."))return;
      if(!confirm("Final confirmation: reset the entire ASN Rush leaderboard?"))return;
      try{await remove(scoreRef);$("adminMessage").textContent="All scores have been reset.";await refreshNow();}
      catch(err){console.error(err);$("adminMessage").textContent="Reset failed. Check Realtime Database Rules.";}
    };
  }catch(err){console.error(err);$("displayStatus").textContent="Firebase initialization failed";}
}
