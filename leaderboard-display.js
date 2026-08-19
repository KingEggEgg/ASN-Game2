import { firebaseConfig, leaderboardPath } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getDatabase, ref, onValue, query, orderByChild, limitToFirst, get, remove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const $=id=>document.getElementById(id);
const tokens=["YOUR_API_KEY","YOUR_PROJECT_ID","YOUR_MESSAGING_SENDER_ID","YOUR_APP_ID"];
const configured=tokens.every(t=>!JSON.stringify(firebaseConfig).includes(t)) && !!firebaseConfig.databaseURL;

function fmt(s){
  s=Math.max(0,Number(s)||0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;
}
function esc(v){
  return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function sortRows(rows){
  return rows.sort((a,b)=>(Number(a.scoreSeconds)||999999)-(Number(b.scoreSeconds)||999999)||(Number(a.completedAt)||0)-(Number(b.completedAt)||0));
}
function render(scores){
  $("bestTime").textContent=scores.length?fmt(scores[0].scoreSeconds):"--:--";
  $("displayRows").innerHTML=scores.length?scores.slice(0,50).map((x,i)=>`
    <tr><td>#${i+1}</td><td>${esc(x.playerName||"Player")}</td><td>${fmt(x.scoreSeconds)}</td></tr>
  `).join(""):'<tr><td colspan="3" style="text-align:center;opacity:.65">No scores yet.</td></tr>';
  $("lastRefresh").textContent="Refresh: "+new Date().toLocaleTimeString();
}
function snapshotToRows(snap){
  const rows=[];
  snap.forEach(child=>rows.push({id:child.key,...child.val()}));
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
    const top50=query(scoreRef,orderByChild("scoreSeconds"),limitToFirst(50));

    onValue(top50,snap=>{
      render(snapshotToRows(snap));
      $("displayStatus").textContent="● LIVE · auto refresh every 5 sec";
    },err=>{
      console.error(err);
      $("displayStatus").textContent="Connection error — check Firebase rules/config";
    });

    async function refreshNow(){
      try{
        const snap=await get(top50);
        render(snapshotToRows(snap));
      }catch(err){
        console.error("5-sec refresh failed",err);
      }
    }
    setInterval(refreshNow,5000);

    $("adminToggle").onclick=()=>$("adminPanel").classList.toggle("show");

    onAuthStateChanged(auth,user=>{
      $("adminLoggedOut").hidden=!!user;
      $("adminLoggedIn").hidden=!user;
      $("adminUser").textContent=user?.email||"";
      $("adminMessage").textContent=user?"Admin authenticated. You can reset the leaderboard.":"";
    });

    $("adminLogin").onclick=async()=>{
      $("adminMessage").textContent="Signing in...";
      try{
        await signInWithEmailAndPassword(auth,$("adminEmail").value.trim(),$("adminPassword").value);
        $("adminMessage").textContent="Login successful.";
      }catch(err){
        console.error(err);
        $("adminMessage").textContent="Login failed. Check email/password and enable Email/Password Authentication.";
      }
    };

    $("adminLogout").onclick=async()=>{
      await signOut(auth);
      $("adminMessage").textContent="Logged out.";
    };

    $("resetScores").onclick=async()=>{
      if(!auth.currentUser){
        $("adminMessage").textContent="Admin login required.";
        return;
      }
      const ok=confirm("Delete ALL leaderboard scores? This cannot be undone.");
      if(!ok)return;
      const ok2=confirm("Final confirmation: reset the entire ASN Rush leaderboard?");
      if(!ok2)return;
      try{
        await remove(scoreRef);
        $("adminMessage").textContent="All scores have been reset.";
        await refreshNow();
      }catch(err){
        console.error(err);
        $("adminMessage").textContent="Reset failed. Check Realtime Database Rules.";
      }
    };
  }catch(err){
    console.error(err);
    $("displayStatus").textContent="Firebase initialization failed";
  }
}
