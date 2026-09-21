document.addEventListener("DOMContentLoaded", () => {
  const bank = Array.isArray(window.SHIELDGUARD_QUESTION_BANK) ? window.SHIELDGUARD_QUESTION_BANK : [];
  const categories = [
    "Phishing og e-post",
    "Passord og MFA",
    "Sosial manipulering",
    "Skadevare og løsepengevirus",
    "Trygg surfing og enheter",
    "Hendelser og rapportering"
  ];
  const difficulties = ["easy", "medium", "hard"];
  const difficultyLabels = {easy:"Lett", medium:"Middels", hard:"Vanskelig"};
  const patterns = [
    {easy:2, medium:2, hard:1},
    {easy:2, medium:1, hard:2},
    {easy:1, medium:2, hard:2}
  ];
  const sessionKey = "shieldguard-test-v1";
  const historyKey = "shieldguard-question-history-v1";
  const cycleKey = "shieldguard-selection-cycle-v1";

  const get = (id) => document.getElementById(id);
  const intro = get("quiz-intro"), app = get("quiz-app"), results = get("results-view"), questionCard = get("question-card");
  const categoryLabel = get("category-label"), questionCount = get("question-count"), progressPercent = get("progress-percent"), progressBar = get("progress-bar");
  const progressTrack = document.querySelector(".progress-track"), previousButton = get("previous-button"), checkButton = get("check-button"), nextButton = get("next-button");
  let questions = [], current = 0, answers = [], revealed = [];

  function randomIndex(max) {
    if (max <= 1) return 0;
    if (window.crypto && window.crypto.getRandomValues) {
      const limit = Math.floor(0x100000000 / max) * max;
      const value = new Uint32Array(1);
      do { window.crypto.getRandomValues(value); } while (value[0] >= limit);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomIndex(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function readStorage(storage, key, fallback) {
    try { const value = storage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch (_) { return fallback; }
  }

  function writeStorage(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); }
    catch (_) { /* Testen fungerer fortsatt dersom lagring er blokkert. */ }
  }

  function prepareQuestion(item) {
    const mixed = shuffle(item.o.map((text, originalIndex) => ({text, originalIndex})));
    return {...item, o:mixed.map((option) => option.text), a:mixed.findIndex((option) => option.originalIndex === item.a)};
  }

  function selectQuestions() {
    const history = readStorage(localStorage, historyKey, {});
    const storedCycle = Number(readStorage(localStorage, cycleKey, 0));
    const cycle = Number.isInteger(storedCycle) ? ((storedCycle % patterns.length) + patterns.length) % patterns.length : 0;
    const selected = [];

    categories.forEach((category, categoryIndex) => {
      const allocation = patterns[(categoryIndex + cycle) % patterns.length];
      difficulties.forEach((difficulty) => {
        const poolKey = `${category}|${difficulty}`;
        const pool = bank.filter((item) => item.category === category && item.difficulty === difficulty);
        const seen = Array.isArray(history[poolKey]) ? history[poolKey] : [];
        let available = pool.filter((item) => !seen.includes(item.id));
        if (available.length < allocation[difficulty]) {
          history[poolKey] = [];
          available = [...pool];
        }
        const chosen = shuffle(available).slice(0, allocation[difficulty]);
        selected.push(...chosen);
        history[poolKey] = [...(history[poolKey] || []), ...chosen.map((item) => item.id)];
      });
    });

    writeStorage(localStorage, historyKey, history);
    writeStorage(localStorage, cycleKey, (cycle + 1) % patterns.length);
    const prepared = shuffle(selected).map(prepareQuestion);
    writeStorage(sessionStorage, sessionKey, prepared);
    return prepared;
  }

  function loadQuestions(forceNew = false) {
    const saved = forceNew ? [] : readStorage(sessionStorage, sessionKey, []);
    questions = saved.length === 30 ? saved : selectQuestions();
    current = 0;
    answers = new Array(questions.length).fill(null);
    revealed = new Array(questions.length).fill(false);
  }

  function renderQuestion() {
    const item = questions[current], percent = Math.round(((current + 1) / questions.length) * 100);
    categoryLabel.textContent = item.category;
    questionCount.textContent = `Spørsmål ${current + 1} av ${questions.length}`;
    progressPercent.textContent = `${percent}%`;
    progressBar.style.width = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
    const options = item.o.map((option, index) => {
      const selected = answers[current] === index;
      let state = selected ? " selected" : "";
      if (revealed[current] && index === item.a) state += " correct";
      if (revealed[current] && selected && index !== item.a) state += " incorrect";
      return `<button class="answer-option${state}" type="button" data-answer="${index}" ${revealed[current] ? "disabled" : ""}><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span><i aria-hidden="true"></i></button>`;
    }).join("");
    const feedback = revealed[current] ? `<div class="answer-feedback ${answers[current] === item.a ? "is-correct" : "is-incorrect"}"><strong>${answers[current] === item.a ? "Riktig – godt sett." : `Ikke helt. Riktig svar er ${String.fromCharCode(65 + item.a)}.`}</strong><p>${item.e}</p></div>` : "";
    questionCard.innerHTML = `<div class="question-number">Spørsmål ${String(current + 1).padStart(2,"0")} · ${difficultyLabels[item.difficulty]}</div><h2>${item.q}</h2><div class="answer-list">${options}</div>${feedback}`;
    previousButton.disabled = current === 0;
    checkButton.classList.toggle("hidden", revealed[current]);
    nextButton.classList.toggle("hidden", !revealed[current]);
    checkButton.disabled = answers[current] === null;
    nextButton.textContent = current === questions.length - 1 ? "Se resultatet mitt →" : "Neste spørsmål →";
    questionCard.querySelectorAll(".answer-option").forEach((button) => button.addEventListener("click", () => {
      answers[current] = Number(button.dataset.answer);
      renderQuestion();
    }));
  }

  function resultRows(groups, labelKey) {
    return groups.map((group) => {
      const matching = questions.map((item,index) => ({...item,index})).filter((item) => item[labelKey] === group);
      const correct = matching.filter((item) => answers[item.index] === item.a).length;
      const percent = Math.round((correct / matching.length) * 100);
      const label = labelKey === "difficulty" ? difficultyLabels[group] : group;
      return `<div class="result-row"><div><span>${label}</span><small>${correct}/${matching.length} riktige</small></div><div class="result-meter"><i style="width:${percent}%"></i></div><strong>${percent}%</strong></div>`;
    }).join("");
  }

  function showResults() {
    app.classList.add("hidden");
    results.classList.remove("hidden");
    const score = answers.reduce((total, answer, index) => total + (answer === questions[index].a ? 1 : 0), 0);
    const percent = Math.round((score / questions.length) * 100);
    const wrong = questions.map((item,index) => ({...item,index})).filter((item) => answers[item.index] !== item.a);
    const review = wrong.length ? `<details class="review-panel"><summary>Se gjennom ${wrong.length} spørsmål på nytt</summary><div>${wrong.map((item) => `<article><span>${item.category} · ${difficultyLabels[item.difficulty]} · spørsmål ${item.index + 1}</span><strong>${item.q}</strong><p>${item.e}</p></article>`).join("")}</div></details>` : `<div class="perfect-note">Svært bra – du svarte riktig på alle spørsmålene.</div>`;
    let level = "Bevisstheten er under utvikling", message = "Les forklaringene og konsentrer deg om områdene med lavest poengsum.";
    if (percent >= 90) { level = "Svært god sikkerhetsbevissthet"; message = "Du gjenkjente gjennomgående det tryggeste valget i hele testen."; }
    else if (percent >= 75) { level = "Sterk sikkerhetsbevissthet"; message = "Du har et solid grunnlag. Se gjennom de få områdene som var utfordrende."; }
    else if (percent >= 60) { level = "Godt grunnlag"; message = "Du kjenner igjen mange vanlige risikoer og kan styrke vanene dine ytterligere."; }
    results.innerHTML = `<div class="results-head"><div class="score-ring" style="--score:${percent * 3.6}deg"><div><strong>${percent}%</strong><span>${score}/${questions.length}</span></div></div><div><div class="eyebrow"><span></span> Testen er fullført</div><h1>${level}</h1><p>${message}</p></div></div><div class="results-card"><div class="results-title"><h2>Resultat per kategori</h2><span>6 kategorier</span></div>${resultRows(categories,"category")}</div><div class="results-card"><div class="results-title"><h2>Resultat etter vanskelighetsgrad</h2><span>10 av hvert nivå</span></div>${resultRows(difficulties,"difficulty")}</div>${review}<div class="result-actions"><button class="button button-primary" id="restart-quiz" type="button">Ta en ny test</button><a class="button button-secondary" href="contact.html">Gi tilbakemelding</a></div>`;
    get("restart-quiz").addEventListener("click", restartQuiz);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function restartQuiz() {
    try { sessionStorage.removeItem(sessionKey); } catch (_) {}
    loadQuestions(true);
    results.classList.add("hidden");
    app.classList.remove("hidden");
    renderQuestion();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  if (bank.length !== 90) {
    get("start-quiz").disabled = true;
    get("start-quiz").textContent = "Spørsmålsbanken kunne ikke lastes";
    return;
  }

  get("start-quiz").addEventListener("click", () => {
    loadQuestions();
    intro.classList.add("hidden");
    app.classList.remove("hidden");
    renderQuestion();
  });
  checkButton.addEventListener("click", () => { if (answers[current] !== null) { revealed[current] = true; renderQuestion(); } });
  nextButton.addEventListener("click", () => { if (current === questions.length - 1) showResults(); else { current += 1; renderQuestion(); window.scrollTo({top:0,behavior:"smooth"}); } });
  previousButton.addEventListener("click", () => { if (current > 0) { current -= 1; renderQuestion(); } });
});
