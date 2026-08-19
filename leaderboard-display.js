import { firebaseConfig, leaderboardPath } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getDatabase, ref, onValue, query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const $ = id => document.getElementById(id);
const tokens=["YOUR_API_KEY","YOUR_PROJECT_ID","YOUR_MESSAGING_SENDER_ID","YOUR_APP_ID"];
const configured = tokens.every(t=>!JSON.stringify(firebaseConfig).includes(t)) && !!firebaseConfig.databaseURL;

function fmt(s){
  s=Math.max(0,Number(s)||0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;
}
function esc(v){
  return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function render(scores){
  $("bestTime").textContent=scores.length?fmt(scores[0].scoreSeconds):"--:--";
  $("displayRows").innerHTML=scores.length?scores.slice(0,10).map((x,i)=>`
    <tr><td>#${i+1}</td><td>${esc(x.playerName||"Player")}</td><td>${fmt(x.scoreSeconds)}</td></tr>
  `).join(""):'<tr><td colspan="3" style="text-align:center;opacity:.65">No scores yet.</td></tr>';
}

if(!configured){
  $("displayStatus").textContent="Leaderboard not connected — configure firebase-config.js";
}else{
  try{
    const app=initializeApp(firebaseConfig);
    const db=getDatabase(app);
    const q=query(ref(db,leaderboardPath),orderByChild("scoreSeconds"),limitToFirst(10));
    onValue(q,snap=>{
      const rows=[];
      snap.forEach(child=>rows.push({id:child.key,...child.val()}));
      rows.sort((a,b)=>(a.scoreSeconds||999999)-(b.scoreSeconds||999999)||(a.completedAt||0)-(b.completedAt||0));
      render(rows);
      $("displayStatus").textContent="● LIVE";
    },err=>{
      console.error(err);
      $("displayStatus").textContent="Connection error — check Firebase rules/config";
    });
  }catch(err){
    console.error(err);
    $("displayStatus").textContent="Firebase initialization failed";
  }
}
