import { firebaseConfig, leaderboardPath } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

const $ = id => document.getElementById(id);

const PLACEHOLDER_TOKENS = [
  "YOUR_API_KEY",
  "YOUR_PROJECT_ID",
  "YOUR_MESSAGING_SENDER_ID",
  "YOUR_APP_ID"
];

function isConfigured(config){
  const blob = JSON.stringify(config || {});
  return PLACEHOLDER_TOKENS.every(token => !blob.includes(token))
    && Boolean(config?.databaseURL);
}

function formatSeconds(seconds){
  const s = Math.max(0, Number(seconds) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2,"0");
  const ss = String(Math.floor(s % 60)).padStart(2,"0");
  return `${mm}:${ss}`;
}

function sanitizeName(value){
  return String(value || "")
    .replace(/[<>]/g,"")
    .replace(/\s+/g," ")
    .trim()
    .slice(0,20);
}

function getCurrentScore(){
  const n = Number(window.ASN_GAME_SCORE);
  if(Number.isFinite(n) && n > 0) return Math.floor(n);

  const txt = $("finalTime")?.textContent?.trim();
  const m = /^(\d+):(\d{2})$/.exec(txt || "");
  if(m) return Number(m[1]) * 60 + Number(m[2]);
  return 0;
}

function setStatus(message, tone=""){
  const el = $("leaderboardStatus");
  if(!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function renderRows(scores, highlightId=null){
  const tbody = $("leaderboardRows");
  if(!tbody) return;
  if(!scores.length){
    tbody.innerHTML = '<tr><td colspan="3" class="empty-row">No scores yet. Be the first!</td></tr>';
    return;
  }

  tbody.innerHTML = scores.slice(0,10).map((item,index)=>{
    const me = item.id === highlightId ? ' class="is-you"' : "";
    return `<tr${me}>
      <td>${index+1}</td>
      <td>${escapeHtml(item.playerName || "Player")}${item.id===highlightId?' <span class="you-tag">YOU</span>':''}</td>
      <td>${formatSeconds(item.scoreSeconds)}</td>
    </tr>`;
  }).join("");
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

let db = null;
let latestScores = [];
let submittedId = null;

function updateYourTime(){
  const el = $("leaderboardYourTime");
  if(el) el.textContent = formatSeconds(getCurrentScore());
}

setInterval(updateYourTime, 500);
updateYourTime();

if(!isConfigured(firebaseConfig)){
  setStatus("Leaderboard not connected — add your Firebase config to firebase-config.js.", "offline");
  const btn = $("submitScoreBtn");
  if(btn) btn.disabled = true;
}else{
  try{
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);

    const topScoresQuery = query(
      ref(db, leaderboardPath),
      orderByChild("scoreSeconds"),
      limitToFirst(10)
    );

    onValue(topScoresQuery, snapshot=>{
      latestScores = [];
      snapshot.forEach(child=>{
        latestScores.push({ id: child.key, ...child.val() });
      });
      latestScores.sort((a,b)=>
        (Number(a.scoreSeconds)||999999) - (Number(b.scoreSeconds)||999999)
        || (Number(a.completedAt)||0) - (Number(b.completedAt)||0)
      );
      renderRows(latestScores, submittedId);

      if(submittedId){
        const idx = latestScores.findIndex(x=>x.id===submittedId);
        if(idx >= 0){
          $("rankHighlight").hidden = false;
          $("currentRank").textContent = `#${idx+1}`;
        }else{
          $("rankHighlight").hidden = false;
          $("currentRank").textContent = "Top 10+";
        }
      }
    }, err=>{
      console.error("Leaderboard listener error:", err);
      setStatus("Leaderboard connection failed. Check Firebase rules/config.", "error");
    });

    setStatus("Live leaderboard connected.", "online");
  }catch(err){
    console.error("Firebase init error:", err);
    setStatus("Leaderboard connection failed. Check firebase-config.js.", "error");
    const btn = $("submitScoreBtn");
    if(btn) btn.disabled = true;
  }
}

const submitBtn = $("submitScoreBtn");
if(submitBtn){
  submitBtn.addEventListener("click", async ()=>{
    if(!db) return;

    const playerName = sanitizeName($("playerNameInput")?.value);
    const scoreSeconds = getCurrentScore();

    if(playerName.length < 2){
      setStatus("Please enter at least 2 characters for your name.", "error");
      $("playerNameInput")?.focus();
      return;
    }
    if(scoreSeconds < 5 || scoreSeconds > 600){
      setStatus("Score is outside the allowed range.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try{
      const result = await push(ref(db, leaderboardPath), {
        playerName,
        scoreSeconds,
        completedAt: Date.now(),
        sessionId: (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)
      });
      submittedId = result.key;
      setStatus("Score submitted! Ranking updated live.", "online");
      submitBtn.textContent = "Score Submitted ✓";
      $("playerNameInput").disabled = true;
      renderRows(latestScores, submittedId);
    }catch(err){
      console.error("Submit score error:", err);
      setStatus("Could not submit score. Check Firebase Database Rules.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Score";
    }
  });
}
