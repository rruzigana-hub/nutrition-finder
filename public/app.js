const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const button = document.getElementById('search-btn');
const controls = document.getElementById('controls');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const statusBox = document.getElementById('status');
const resultsBox = document.getElementById('results');
const serverInfo = document.getElementById('server-info');

// All foods from the last search
let allFoods = [];

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = isError ? 'error' : '';
}

// One small box with a number and a label
function makeStat(label, value, unit) {
  const div = document.createElement('div');
  div.className = 'stat';
  const strong = document.createElement('strong');
  strong.textContent = value + unit;
  div.appendChild(strong);
  div.appendChild(document.createTextNode(label));
  return div;
}

// One food card
function makeCard(food) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('h3');
  title.textContent = food.name;

  const tag = document.createElement('span');
  tag.className = 'category';
  tag.textContent = food.category;

  const stats = document.createElement('div');
  stats.className = 'stats';
  stats.appendChild(makeStat('Calories', food.calories, ' kcal'));
  stats.appendChild(makeStat('Protein', food.protein, ' g'));
  stats.appendChild(makeStat('Fat', food.fat, ' g'));
  stats.appendChild(makeStat('Carbs', food.carbs, ' g'));

  card.appendChild(title);
  card.appendChild(tag);
  card.appendChild(stats);
  return card;
}

// Fill the filter menu with the categories found in the results
function fillCategories(foods) {
  const categories = [...new Set(foods.map((f) => f.category))].sort();
  categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    categoryFilter.appendChild(option);
  });
}

// Filter, sort, then show the cards
function render() {
  let list = [...allFoods];

  if (categoryFilter.value !== 'all') {
    list = list.filter((f) => f.category === categoryFilter.value);
  }

  const sort = sortSelect.value;
  if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'protein-desc') {
    list.sort((a, b) => b.protein - a.protein);
  } else if (sort === 'calories-asc') {
    list.sort((a, b) => a.calories - b.calories);
  } else if (sort === 'calories-desc') {
    list.sort((a, b) => b.calories - a.calories);
  }

  resultsBox.innerHTML = '';

  if (list.length === 0) {
    setStatus('No foods match this filter.');
    return;
  }

  list.forEach((food) => resultsBox.appendChild(makeCard(food)));
  setStatus(`Showing ${list.length} of ${allFoods.length} foods.`);
}

// Ask our server for foods
async function searchFoods(query) {
  button.disabled = true;
  resultsBox.innerHTML = '';
  controls.classList.add('hidden');
  setStatus('Loading... the first search can take up to a minute.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70000);

  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(query), {
      signal: controller.signal,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || 'Something went wrong.', true);
      return;
    }

    allFoods = data.foods;

    if (allFoods.length === 0) {
      setStatus('No foods found. Try another word.', true);
      return;
    }

    fillCategories(allFoods);
    sortSelect.value = 'name';
    controls.classList.remove('hidden');
    serverInfo.textContent =
      'Served by: ' + data.server + (data.cached ? ' (from cache)' : '');
    render();
  } catch (err) {
    if (err.name === 'AbortError') {
      setStatus('The request took too long. Try again.', true);
    } else {
      setStatus('Network error or bad response. Try again.', true);
    }
  } finally {
    clearTimeout(timer);
    button.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) {
    setStatus('Please type a food name.', true);
    return;
  }
  searchFoods(query);
});

categoryFilter.addEventListener('change', render);
sortSelect.addEventListener('change', render);