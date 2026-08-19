import { firebaseConfig, leaderboardPath } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const $ = id => document.getElementById(id);
const PLACEHOLDER_TOKENS=["YOUR_API_KEY","YOUR_PROJECT_ID","YOUR_MESSAGING_SENDER_ID","YOUR_APP_ID"];

function isConfigured(config){
  const blob=JSON.stringify(config||{});
  return PLACEHOLDER_TOKENS.every(token=>!blob.includes(token)) && Boolean(config?.databaseURL);
}
function formatSeconds(seconds){
  const s=Math.max(0,Number(seconds)||0);
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(Math.floor(s%60)).padStart(2,"0")}`;
}
function sanitizeName(value){
  return String(value||"").replace(/[<>]/g,"").replace(/\s+/g," ").trim().slice(0,20);
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
}
function getCurrentScore(){
  const n=Number(window.ASN_GAME_SCORE);
  if(Number.isFinite(n)&&n>0)return Math.floor(n);
  const txt=$("finalTime")?.textContent?.trim();
  const m=/^(\d+):(\d{2})$/.exec(txt||"");
  return m?Number(m[1])*60+Number(m[2]):0;
}
function setStatus(message,tone=""){
  const el=$("leaderboardStatus"); if(!el)return; el.textContent=message; el.dataset.tone=tone;
}
function normalizeScores(snapshot){
  const rows=[];
  snapshot.forEach(child=>{
    const v=child.val()||{};
    const seconds=Number(v.scoreSeconds);
    if(Number.isFinite(seconds))rows.push({id:child.key,...v,scoreSeconds:seconds});
  });
  rows.sort((a,b)=>a.scoreSeconds-b.scoreSeconds||(Number(a.completedAt)||0)-(Number(b.completedAt)||0));
  return rows;
}
function renderRows(scores,highlightId=null){
  const tbody=$("leaderboardRows"); if(!tbody)return;
  const top10=scores.slice(0,10);
  if(!top10.length){tbody.innerHTML='<tr><td colspan="3" class="empty-row">No scores yet. Be the first!</td></tr>';return;}
  tbody.innerHTML=top10.map((item,index)=>{
    const me=item.id===highlightId?' class="is-you"':'';
    return `<tr${me}><td>${index+1}</td><td>${escapeHtml(item.playerName||"Player")}${item.id===highlightId?' <span class="you-tag">YOU</span>':''}</td><td>${formatSeconds(item.scoreSeconds)}</td></tr>`;
  }).join("");
}

let db=null;
let scoreRef=null;
let latestScores=[];
let submittedId=null;

function updateYourTime(){const el=$("leaderboardYourTime");if(el)el.textContent=formatSeconds(getCurrentScore());}
setInterval(updateYourTime,500); updateYourTime();

function applySnapshot(snapshot){
  latestScores=normalizeScores(snapshot);
  renderRows(latestScores,submittedId);
  setStatus(`Live leaderboard connected · ${latestScores.length} total score${latestScores.length===1?'':'s'}.`,"online");
  if(submittedId){
    const idx=latestScores.findIndex(x=>x.id===submittedId);
    if($("rankHighlight"))$("rankHighlight").hidden=false;
    if($("currentRank"))$("currentRank").textContent=idx>=0?`#${idx+1}`:"–";
  }
}

if(!isConfigured(firebaseConfig)){
  setStatus("Leaderboard not connected — add your Firebase config to firebase-config.js.","offline");
  if($("submitScoreBtn"))$("submitScoreBtn").disabled=true;
}else{
  try{
    const app=initializeApp(firebaseConfig);
    db=getDatabase(app);
    scoreRef=ref(db,leaderboardPath);

    // Read the COMPLETE collection. Sort locally, then show Top 10.
    // This avoids Firebase query/index issues that previously caused only one row to appear.
    onValue(scoreRef,applySnapshot,err=>{
      console.error("Leaderboard listener error:",err);
      setStatus("Leaderboard connection failed. Check Firebase rules/config.","error");
    });

    async function refreshLeaderboardNow(){
      try{applySnapshot(await get(scoreRef));}
      catch(err){console.error("5-sec leaderboard refresh failed:",err);}
    }
    setInterval(refreshLeaderboardNow,5000);
    refreshLeaderboardNow();
  }catch(err){
    console.error("Firebase init error:",err);
    setStatus("Leaderboard connection failed. Check firebase-config.js.","error");
    if($("submitScoreBtn"))$("submitScoreBtn").disabled=true;
  }
}

const submitBtn=$("submitScoreBtn");
if(submitBtn){
  submitBtn.addEventListener("click",async()=>{
    if(!db||!scoreRef)return;
    const playerName=sanitizeName($("playerNameInput")?.value);
    const scoreSeconds=getCurrentScore();
    if(playerName.length<2){setStatus("Please enter at least 2 characters for your name.","error");$("playerNameInput")?.focus();return;}
    if(scoreSeconds<5||scoreSeconds>600){setStatus("Score is outside the allowed range.","error");return;}
    submitBtn.disabled=true; submitBtn.textContent="Submitting...";
    try{
      const result=await push(scoreRef,{playerName,scoreSeconds,completedAt:Date.now(),sessionId:(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`)});
      submittedId=result.key;
      setStatus("Score submitted! Ranking updated live.","online");
      submitBtn.textContent="Score Submitted ✓";
      if($("playerNameInput"))$("playerNameInput").disabled=true;
    }catch(err){
      console.error("Submit score error:",err);
      setStatus("Could not submit score. Check Firebase Database Rules.","error");
      submitBtn.disabled=false; submitBtn.textContent="Submit Score";
    }
  });
}
