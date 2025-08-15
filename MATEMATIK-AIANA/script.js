/* MATEMATIK AYANA — advanced quiz logic (10s per question) */
const TOTAL_QUESTIONS = 10;
const TIME_PER_QUESTION = 10; // <-- 10 seconds as requested
const BASE_POINTS = 5000;
const TIME_BONUS_MAX = 2500;
const WRONG_PENALTY = 1200;

let questions = [], currentIndex = 0, scoreCount = 0, totalPoints = 0;
let streak = 0, bestStreak = 0, startTimestamp = 0, timer = null, timeLeft = TIME_PER_QUESTION;
let records = [];

const progressText = document.getElementById("progressText");
const questionText = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const timerText = document.getElementById("timerText");
const timerArc = document.getElementById("timerArc");
const scoreMini = document.getElementById("scoreMini");
const streakEl = document.getElementById("streak");
const resultCard = document.getElementById("resultCard");
const finalPoints = document.getElementById("finalPoints");
const breakdown = document.getElementById("breakdown");
const retryBtn = document.getElementById("retryBtn");
const shareBtn = document.getElementById("shareBtn");

function randTwoDigit(){ return Math.floor(Math.random()*90)+10; }
function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
function formatNum(n){ return n.toLocaleString('en-US'); }

function generateQuestions() {
  questions = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    let a, b, op, correct;

    while (true) {
      a = randTwoDigit();
      b = randTwoDigit();

      const unitA = a % 10;
      const unitB = b % 10;

      // Екі санның да бірлігі >= 6
      if (unitA < 6 || unitB < 6) continue;

      // Операцияны кездейсоқ таңдау: 0 = қосу, 1 = азайту
      op = Math.random() < 0.5 ? '+' : '-';

      if (op === '-') {
        if (a <= b) continue; // теріс нәтиже болмау үшін

        // Азайтуға арналған арнайы шарттар
        if (unitA === 6 && ![7, 8, 9].includes(unitB)) continue;
        if (unitA === 9 && unitB !== 0) continue;
        if (unitA !== 6 && unitA !== 9 && unitB <= unitA) continue;

        correct = a - b;
      } else {
        correct = a + b;
      }

      break;
    }

    const answers = new Set([correct]);

    // Қате жауаптар генерациясы
    while (answers.size < 4) {
      let offset = (Math.random() < 0.15)
        ? (Math.floor(Math.random() * 50) - 25)
        : (Math.floor(Math.random() * 21) - 10);
      let wrong = correct + offset;
      if (wrong > 0) answers.add(wrong);
    }

    questions.push({
      a,
      b,
      op, // операцияны сақтаймыз
      correct,
      choices: shuffle(Array.from(answers))
    });
  }
}



function renderQuestion(){
  if (currentIndex >= TOTAL_QUESTIONS) { 
    endQuiz(); 
    return; 
  }
  const q = questions[currentIndex];
  progressText.textContent = `${currentIndex+1}/${TOTAL_QUESTIONS}`;
  
  // Операцияны (+ немесе -) шығару
  questionText.textContent = `${q.a} ${q.op} ${q.b} = ?`;

  choicesEl.innerHTML = "";
  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn w-full rounded-xl p-4 text-left bg-white shadow hover:shadow-lg flex items-center gap-3";
    btn.innerHTML = `<div class="flex-1"><span class="text-lg font-semibold">${choice}</span></div><div class="w-8 text-right text-xl text-slate-300"><i class="fa fa-circle"></i></div>`;
    btn.onclick = () => selectAnswer(choice, btn);
    choicesEl.appendChild(btn);
    gsap.from(btn, {opacity:0, y:8, duration:0.32, ease:"power2.out", delay:0.04});
  });
  resetTimer(); 
  startTimer();
}



function resetTimer(){ clearInterval(timer); timeLeft = TIME_PER_QUESTION; updateTimerArc(); timerText.innerText = `${timeLeft}s`; }
function startTimer(){
  const start = Date.now();
  timer = setInterval(()=>{
    const elapsed = Math.floor((Date.now()-start)/1000);
    timeLeft = TIME_PER_QUESTION - elapsed;
    if(timeLeft<0) timeLeft = 0;
    updateTimerArc();
    timerText.innerText = `${timeLeft}s`;
    if(timeLeft<=0){
      clearInterval(timer);
      handleTimeout();
    }
  }, 150);
}
function updateTimerArc(){
  const fraction = timeLeft / TIME_PER_QUESTION;
  const full = 100;
  const dash = (fraction * full).toFixed(2);
  timerArc.setAttribute("stroke-dasharray", `${dash} ${full-dash}`);
}

function selectAnswer(choice, btn){
  if(!timer) return;
  clearInterval(timer);
  const q = questions[currentIndex];
  const correct = q.correct;
  const timeTaken = TIME_PER_QUESTION - timeLeft;
  let pointsAwarded = 0, isCorrect = false;

  if(choice === correct){
    isCorrect = true; scoreCount++; streak++; bestStreak = Math.max(bestStreak, streak);
    const timeBonus = Math.round((timeLeft / TIME_PER_QUESTION) * TIME_BONUS_MAX);
    const streakFactor = 1 + Math.min(streak,8)*0.12;
    pointsAwarded = Math.round((BASE_POINTS + timeBonus) * streakFactor);
    totalPoints += pointsAwarded;
    btn.classList.add("bg-emerald-50");
    btn.querySelector("i").className = "fa fa-check text-emerald-500";
    gsap.fromTo(btn, {scale:0.98},{scale:1,duration:0.3,ease:"elastic.out(1,0.6)"});
  } else {
    streak = 0;
    pointsAwarded = -WRONG_PENALTY;
    totalPoints += pointsAwarded;
    btn.classList.add("bg-red-50");
    btn.querySelector("i").className = "fa fa-times text-red-500";
    Array.from(choicesEl.children).forEach(b=>{
      if(b.innerText.trim().startsWith(String(correct))){
        b.classList.add("bg-emerald-50");
        b.querySelector("i").className = "fa fa-check text-emerald-500";
      }
    });
  }

  records.push({ index: currentIndex+1, question: `${q.a} + ${q.b}`, correct, chosen: choice, isCorrect, timeTaken, pointsAwarded });
  scoreMini.textContent = scoreCount;
  streakEl.textContent = streak;

  setTimeout(()=>{ currentIndex++; renderQuestion(); }, 700);
}

function handleTimeout(){
  streak = 0; totalPoints -= WRONG_PENALTY;
  const q = questions[currentIndex];
  Array.from(choicesEl.children).forEach(b=>{
    if(b.innerText.trim().startsWith(String(q.correct))){
      b.classList.add("bg-emerald-50"); b.querySelector("i").className = "fa fa-check text-emerald-500";
    } else { b.classList.add("bg-slate-50"); }
  });
  records.push({ index: currentIndex+1, question:`${q.a} + ${q.b}`, correct: q.correct, chosen: null, isCorrect: false, timeTaken: TIME_PER_QUESTION, pointsAwarded: -WRONG_PENALTY });
  scoreMini.textContent = scoreCount; streakEl.textContent = streak;
  setTimeout(()=>{ currentIndex++; renderQuestion(); }, 900);
}

function endQuiz(){
  clearInterval(timer);
  const totalTimeSec = Math.floor((Date.now() - startTimestamp)/1000);
  const correctCount = records.filter(r=>r.isCorrect).length;
  const accuracy = correctCount / TOTAL_QUESTIONS;
  const avgTime = Math.round(records.reduce((s,r)=>s+r.timeTaken,0) / records.length * 100)/100;
  const maxPossible = TOTAL_QUESTIONS * (BASE_POINTS + TIME_BONUS_MAX) * (1 + 8*0.12);
  const raw = Math.max(0, totalPoints);
  const skillIndex = Math.round((raw / maxPossible) * 100000);

  resultCard.classList.remove("hidden");
  finalPoints.innerText = `${formatNum(skillIndex)} pts`;

  breakdown.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "p-3 bg-white rounded-lg shadow";
  summary.innerHTML = `<div class="text-sm text-slate-500">Дұрыс: <strong>${correctCount}/${TOTAL_QUESTIONS}</strong></div>
    <div class="text-sm text-slate-500">Ұпай: <strong>${formatNum(totalPoints)}</strong></div>
    <div class="text-sm text-slate-500">Жалпы уақыт: <strong>${totalTimeSec}s</strong></div>
    <div class="text-sm text-slate-500">Орташа уақыт: <strong>${avgTime}s</strong></div>
    <div class="text-sm text-slate-500">Ең үздік серия: <strong>${bestStreak}</strong></div>`;
  breakdown.appendChild(summary);

  records.forEach(r=>{
    const row = document.createElement("div");
    row.className = "mt-2 p-2 rounded-md bg-slate-50 text-sm flex items-center justify-between";
    row.innerHTML = `<div><div class="font-medium">${r.index}. ${r.question} = ${r.correct}</div>
      <div class="text-xs text-slate-500">Сiz таңдаған: <strong>${(r.chosen===null)?'—':r.chosen}</strong> · Уақыт: ${r.timeTaken}s</div></div>
      <div class="text-right"><div class="${r.isCorrect ? "text-emerald-600":"text-red-600"} font-semibold">${r.pointsAwarded>0?'+':''}${r.pointsAwarded}</div></div>`;
    breakdown.appendChild(row);
  });

  renderCharts(records);
  const percent = (correctCount/TOTAL_QUESTIONS)*100;
  if(percent >= 80) confetti({particleCount:120,spread:90,origin:{y:0.4}});

  // smooth scroll to result
  resultCard.scrollIntoView({behavior:"smooth"});
}

function renderCharts(data){
  const correct = data.filter(d=>d.isCorrect).length;
  const wrong = TOTAL_QUESTIONS - correct;
  const ctx1 = document.getElementById("chartCorrect").getContext("2d");
  new Chart(ctx1, { type:"doughnut", data:{ labels:["Дұрыс","Қате"], datasets:[{ data:[correct,wrong], backgroundColor:["#10b981","#ef4444"] }]}, options:{plugins:{legend:{position:"bottom"}}, responsive:true, maintainAspectRatio:false }});
  const times = data.map(d=>d.timeTaken);
  const labels = data.map(d=>`Q${d.index}`);
  const ctx2 = document.getElementById("chartTime").getContext("2d");
  new Chart(ctx2, { type:"bar", data:{ labels, datasets:[{ label:"Time (s)", data:times, backgroundColor: times.map(t=> t<3 ? "#34d399" : (t<7 ? "#f59e0b":"#f97316")) }]}, options:{ scales:{ y:{ beginAtZero:true, suggestedMax: TIME_PER_QUESTION } }, plugins:{ legend:{display:false}}, responsive:true, maintainAspectRatio:false }});
}

function start(){
  generateQuestions();
  currentIndex=0; scoreCount=0; totalPoints=0; streak=0; bestStreak=0; records=[]; startTimestamp = Date.now();
  resultCard.classList.add("hidden");
  renderQuestion();
}
retryBtn.onclick = ()=>{ start(); window.scrollTo({top:0,behavior:"smooth"}); };
shareBtn.onclick = ()=>{
  const correct = records.filter(r=>r.isCorrect).length;
  const text = `Мен ${TOTAL_QUESTIONS} сұрақтан ${correct}/${TOTAL_QUESTIONS} дұрыс жауап бердім! Ұпайым: ${formatNum(totalPoints)}.`;
  navigator.clipboard.writeText(text).then(()=> alert("Нәтиже көшірілді!"));
};

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js").catch(e=>console.warn("SW error",e));
}
window.addEventListener("load", ()=> start());


/*
function generateQuestions() {
  questions = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    let a, b;

    while (true) {
      a = randTwoDigit();
      b = randTwoDigit();

      const unitA = a % 10;
      const unitB = b % 10;

      // Теріс нәтиже болмауы үшін
      if (a <= b) continue;

      // Шарт: егер a-ның бірлігі 9 болса, b-ның бірлігі 0 болуы керек
      if (unitA === 9) {
        if (unitB !== 0) continue;
      } else {
        // Әйтпесе, b-ның бірлігі a-ның бірлігінен үлкен болуы керек
        if (unitB <= unitA) continue;
      }

      break; // шарттар орындалды
    }

    const correct = a - b; // Азайту
    const answers = new Set([correct]);

    // Қате жауаптар генерациясы
    while (answers.size < 4) {
      let offset = (Math.random() < 0.15)
        ? (Math.floor(Math.random() * 50) - 25)
        : (Math.floor(Math.random() * 21) - 10);
      let wrong = correct + offset;
      if (wrong > 0) answers.add(wrong);
    }

    questions.push({
      a,



*/