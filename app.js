const DATA = window.CMU_FOOD_DATA;

const state = {
  screen: 'start-screen',
  campus: DATA.campuses[0],
  mealTime: 'lunch',
  budget: 150,
  currentQuestionIndex: 0,
  selectedOptions: []
};

const tagLabels = {
  fast: '趕時間',
  cheap: '省錢',
  healthy: '健康',
  heavy: '重口味',
  comfort: '療癒',
  social: '聚餐',
  takeaway: '外帶'
};

const levelScore = {
  speedLevel: { '快': 2, '中': 1, '慢': 0 },
  queueLevel: { '低': 2, '中': 1, '高': 0 }
};

function buildMapUrl(restaurant) {
  const rawQuery = restaurant.mapQuery || `${restaurant.name} ${restaurant.area || ""} 台中市`;
  const destination = encodeURIComponent(rawQuery.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
}

const $ = (selector) => document.querySelector(selector);

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('is-active', screen.id === screenId);
  });
  state.screen = screenId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initSelects() {
  const campusSelect = $('#campus-select');
  campusSelect.innerHTML = DATA.campuses
    .map((campus) => `<option value="${campus}">${campus}</option>`)
    .join('');

  const mealSelect = $('#meal-select');
  mealSelect.innerHTML = DATA.mealTimes
    .map((meal) => `<option value="${meal.id}">${meal.label}</option>`)
    .join('');
}

function readSettings() {
  state.campus = $('#campus-select').value;
  state.mealTime = $('#meal-select').value;
  state.budget = Number($('#budget-input').value) || 150;
}

function renderQuestion() {
  const question = DATA.quizQuestions[state.currentQuestionIndex];
  const total = DATA.quizQuestions.length;
  const current = state.currentQuestionIndex + 1;

  $('#progress-text').textContent = `Q${current} / ${total}`;
  $('#progress-bar').style.width = `${(current / total) * 100}%`;
  $('#quiz-title').textContent = question.text;

  $('#option-list').innerHTML = question.options.map((option) => `
    <button class="option-button" data-option-id="${option.id}">
      ${option.text}
      <small>${option.hint}</small>
    </button>
  `).join('');
}

function findOptionById(optionId) {
  for (const question of DATA.quizQuestions) {
    const found = question.options.find((option) => option.id === optionId);
    if (found) return found;
  }
  return null;
}

function calculateUserScores() {
  const scores = Object.fromEntries(DATA.scoreTags.map((tag) => [tag, 0]));

  state.selectedOptions.forEach((optionId) => {
    const option = findOptionById(optionId);
    if (!option) return;

    Object.entries(option.score).forEach(([tag, value]) => {
      scores[tag] += value;
    });
  });

  return scores;
}

function determineMainTag(scores) {
  return DATA.tagPriority.reduce((bestTag, tag) => {
    if (!bestTag) return tag;
    return scores[tag] > scores[bestTag] ? tag : bestTag;
  }, null);
}

function matchesMealTime(restaurant) {
  if (state.mealTime === 'lunch') return restaurant.openLunch;
  if (state.mealTime === 'dinner') return restaurant.openDinner;
  if (state.mealTime === 'late') return restaurant.openLate;
  return true;
}

function getBudgetScore(restaurant) {
  if (restaurant.maxPrice <= state.budget) return 2;
  if (restaurant.minPrice <= state.budget) return 1;
  return -2;
}

function getDistanceScore(restaurant) {
  if (restaurant.walkTimeMin <= 3) return 3;
  if (restaurant.walkTimeMin <= 7) return 2;
  if (restaurant.walkTimeMin <= 10) return 1;
  return 0;
}

function scoreRestaurant(restaurant, userScores) {
  const wrongCampus = restaurant.campus !== state.campus;
  const wrongMealTime = !matchesMealTime(restaurant);

  if (wrongCampus || wrongMealTime) {
    return { ...restaurant, score: -999, scoreParts: { excluded: true } };
  }

  const tagScore = restaurant.tags.reduce((sum, tag) => sum + (userScores[tag] || 0), 0);
  const budgetScore = getBudgetScore(restaurant);
  const distanceScore = getDistanceScore(restaurant);
  const speedScore = levelScore.speedLevel[restaurant.speedLevel] ?? 0;
  const queueScore = levelScore.queueLevel[restaurant.queueLevel] ?? 0;
  const total = tagScore + budgetScore + distanceScore + speedScore + queueScore;

  return {
    ...restaurant,
    score: total,
    scoreParts: { tagScore, budgetScore, distanceScore, speedScore, queueScore }
  };
}

function getTopRecommendations(userScores) {
  const scored = DATA.restaurants
    .map((restaurant) => scoreRestaurant(restaurant, userScores))
    .filter((restaurant) => restaurant.score > -999)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.walkTimeMin - b.walkTimeMin;
    });

  return scored.slice(0, 3);
}

function renderScores(scores) {
  const maxScore = Math.max(...Object.values(scores), 1);
  $('#score-list').innerHTML = DATA.scoreTags.map((tag) => {
    const percent = Math.round((scores[tag] / maxScore) * 100);
    return `
      <div class="score-item">
        <strong>${tagLabels[tag]}</strong>
        <div class="score-bar"><span style="width: ${percent}%"></span></div>
        <span>${scores[tag]}</span>
      </div>
    `;
  }).join('');
}

function renderRecommendations(recommendations) {
  if (recommendations.length === 0) {
    $('#recommendations').innerHTML = `
      <div class="restaurant-card">
        <h4>目前沒有符合條件的店家</h4>
        <p class="reason">可以調高預算、換用餐時段，或先確認餐廳資料表是否有該校區資料。</p>
      </div>
    `;
    return;
  }

  $('#recommendations').innerHTML = recommendations.map((restaurant, index) => `
    <article class="restaurant-card">
      <span class="restaurant-rank">推薦 ${index + 1}</span>
      <h4>${restaurant.name}</h4>
      <div class="meta-list">
        <span>類型：${restaurant.category}</span>
        <span>價位：${restaurant.priceRange}</span>
        <span>距離：${restaurant.walkTimeText}</span>
        <span>排隊：${restaurant.queueLevel}｜出餐：${restaurant.speedLevel}</span>
        <span>總分：${restaurant.score}</span>
      </div>
      <div class="tag-list">
        ${restaurant.tags.map((tag) => `<span class="tag">${tagLabels[tag] || tag}</span>`).join('')}
      </div>
      <p class="reason">${restaurant.reason}</p>
      <a class="map-button" href="${buildMapUrl(restaurant)}" target="_blank" rel="noopener noreferrer">開啟 Google Maps 導航</a>
    </article>
  `).join('');
}

function renderResult() {
  const scores = calculateUserScores();
  const mainTag = determineMainTag(scores);
  const personality = DATA.personalities[mainTag];
  const recommendations = getTopRecommendations(scores);

  $('#result-title').textContent = `你的今日吃飯人格：${personality.name}`;
  $('#result-copy').textContent = `${personality.copy} 推薦方向：${personality.recommendDirection}`;

  renderScores(scores);
  renderRecommendations(recommendations);
}

function restartQuiz() {
  state.currentQuestionIndex = 0;
  state.selectedOptions = [];
  renderQuestion();
  showScreen('start-screen');
}

function bindEvents() {
  $('#start-btn').addEventListener('click', () => showScreen('setup-screen'));

  $('#go-quiz-btn').addEventListener('click', () => {
    readSettings();
    state.currentQuestionIndex = 0;
    state.selectedOptions = [];
    renderQuestion();
    showScreen('quiz-screen');
  });

  $('#option-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-option-id]');
    if (!button) return;

    state.selectedOptions[state.currentQuestionIndex] = button.dataset.optionId;

    if (state.currentQuestionIndex < DATA.quizQuestions.length - 1) {
      state.currentQuestionIndex += 1;
      renderQuestion();
    } else {
      renderResult();
      showScreen('result-screen');
    }
  });

  $('#quiz-back-btn').addEventListener('click', () => {
    if (state.currentQuestionIndex === 0) {
      showScreen('setup-screen');
      return;
    }
    state.currentQuestionIndex -= 1;
    renderQuestion();
  });

  document.querySelectorAll('[data-back]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.back));
  });

  $('#restart-btn').addEventListener('click', restartQuiz);
  $('#change-setting-btn').addEventListener('click', () => showScreen('setup-screen'));
}

initSelects();
bindEvents();
