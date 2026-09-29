(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('fitness-form');
  const planner = $('planner');
  const intro = $('intro');
  const results = $('results');
  const steps = [...document.querySelectorAll('.form-step')];
  const indicators = [...document.querySelectorAll('[data-step-indicator]')];
  const unitButtons = [...document.querySelectorAll('[data-unit]')];
  const age = $('age');
  const height = $('height');
  const weight = $('weight');
  const bmiPreview = $('bmi-preview');
  let currentStep = 1;
  let unit = 'metric';

  const allowed = {
    sex: ['female', 'male'], goal: ['lose', 'maintain', 'gain'],
    activity: ['1.2', '1.375', '1.55', '1.725'], eating: ['irregular', 'mixed', 'balanced'],
    training: ['2', '3', '4'], equipment: ['bodyweight', 'bands', 'weights'],
    region: ['south-asia', 'middle-east', 'east-asia', 'africa', 'latin', 'western'],
    diet: ['vegetarian', 'nonveg', 'vegan', 'pescatarian'],
    foodNeed: ['lactose', 'gluten', 'nuts', 'shellfish'],
    condition: ['ibs', 'ibd', 'fatigue', 'depression', 'pregnancy', 'diabetes', 'heart', 'kidney', 'joint', 'eating', 'other']
  };
  const safeChoice = (data, name, fallback) => {
    const value = String(data.get(name) || '');
    return allowed[name].includes(value) ? value : fallback;
  };
  const safeChoices = (data, name) => data.getAll(name).map(String).filter((value) => allowed[name].includes(value));

  const regionNames = {
    'south-asia': 'South Asian', 'middle-east': 'Middle Eastern and North African',
    'east-asia': 'East and Southeast Asian', africa: 'Sub-Saharan African',
    latin: 'Latin American and Caribbean', western: 'European and North American'
  };

  const bmiCategory = (bmi) => bmi < 18.5 ? 'Below the standard range'
    : bmi < 25 ? 'Within the standard range'
      : bmi < 30 ? 'Above the standard range' : 'Well above the standard range';

  const measurements = () => {
    const h = Number(height.value);
    const w = Number(weight.value);
    if (!h || !w) return null;
    const heightCm = unit === 'metric' ? h : h * 2.54;
    const weightKg = unit === 'metric' ? w : w * 0.453592;
    return { heightCm, weightKg, bmi: weightKg / ((heightCm / 100) ** 2) };
  };

  const updateBmiPreview = () => {
    const data = measurements();
    const icon = document.createElement('span');
    icon.className = 'bmi-icon';
    icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const label = document.createElement('small');
    const message = document.createElement('strong');
    if (!data || data.bmi < 10 || data.bmi > 70) {
      icon.textContent = '↗';
      label.textContent = 'Your BMI will appear here';
      message.textContent = 'Add your height and weight to see your starting point.';
    } else {
      icon.textContent = data.bmi.toFixed(1);
      label.textContent = 'ESTIMATED BMI';
      message.textContent = `${bmiCategory(data.bmi)} — one data point, not a diagnosis.`;
    }
    copy.append(label, message);
    bmiPreview.replaceChildren(icon, copy);
  };

  const setUnit = (nextUnit) => {
    if (nextUnit === unit) return;
    const data = measurements();
    unit = nextUnit;
    unitButtons.forEach((button) => {
      const active = button.dataset.unit === unit;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (unit === 'metric') {
      height.min = '100'; height.max = '250'; height.placeholder = 'e.g. 170';
      weight.min = '30'; weight.max = '350'; weight.placeholder = 'e.g. 70';
      $('height-unit').textContent = 'cm'; $('weight-unit').textContent = 'kg'; $('target-unit').textContent = 'kg';
      if (data) { height.value = data.heightCm.toFixed(1); weight.value = data.weightKg.toFixed(1); }
    } else {
      height.min = '39'; height.max = '98'; height.placeholder = 'e.g. 67';
      weight.min = '66'; weight.max = '772'; weight.placeholder = 'e.g. 154';
      $('height-unit').textContent = 'in'; $('weight-unit').textContent = 'lb'; $('target-unit').textContent = 'lb';
      if (data) { height.value = (data.heightCm / 2.54).toFixed(1); weight.value = (data.weightKg / 0.453592).toFixed(1); }
    }
    updateBmiPreview();
  };

  const showStep = (nextStep) => {
    currentStep = nextStep;
    steps.forEach((step) => {
      const active = Number(step.dataset.step) === currentStep;
      step.hidden = !active;
      step.classList.toggle('active', active);
    });
    indicators.forEach((indicator) => {
      const value = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('active', value === currentStep);
      indicator.classList.toggle('done', value < currentStep);
    });
    $('mobile-step').textContent = `Step ${currentStep} of 4`;
    $('mobile-bar').dataset.progress = String(currentStep * 25);
    planner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showError = (input, message) => {
    input.closest('.field')?.classList.toggle('invalid', Boolean(message));
    const error = document.querySelector(`[data-error-for="${input.id}"]`);
    if (error) error.textContent = message;
  };

  const validateStep = () => {
    if (currentStep !== 1) return true;
    let valid = true;
    const rules = [
      [age, 18, 100, 'Enter an age from 18 to 100.'],
      [height, Number(height.min), Number(height.max), `Enter a height from ${height.min} to ${height.max} ${unit === 'metric' ? 'cm' : 'in'}.`],
      [weight, Number(weight.min), Number(weight.max), `Enter a weight from ${weight.min} to ${weight.max} ${unit === 'metric' ? 'kg' : 'lb'}.`]
    ];
    rules.forEach(([input, min, max, message]) => {
      const value = Number(input.value);
      const invalid = !input.value || value < min || value > max;
      showError(input, invalid ? message : '');
      if (invalid) valid = false;
    });
    if (!valid) document.querySelector('.field.invalid input')?.focus();
    return valid;
  };

  const renderList = (elementId, items) => {
    $(elementId).replaceChildren(...items.map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
  };

  const proteinFor = (region, diet, lactose) => {
    const proteins = {
      'south-asia': { vegetarian: lactose ? 'dal, chickpeas, or tofu' : 'dal, chickpeas, paneer, or curd', nonveg: 'eggs, chicken, fish, or dal', vegan: 'dal, chickpeas, soy, or tofu', pescatarian: 'fish, eggs, or dal' },
      'middle-east': { vegetarian: lactose ? 'lentils, chickpeas, or tahini' : 'lentils, labneh, eggs, or chickpeas', nonveg: 'chicken, fish, eggs, or lentils', vegan: 'lentils, chickpeas, beans, or tahini', pescatarian: 'fish, eggs, lentils, or chickpeas' },
      'east-asia': { vegetarian: 'tofu, tempeh, eggs, or edamame', nonveg: 'tofu, eggs, chicken, or fish', vegan: 'tofu, tempeh, edamame, or beans', pescatarian: 'fish, tofu, eggs, or edamame' },
      africa: { vegetarian: 'beans, cowpeas, lentils, eggs, or yogurt', nonveg: 'beans, eggs, chicken, or fish', vegan: 'beans, cowpeas, lentils, or seeds', pescatarian: 'fish, beans, eggs, or cowpeas' },
      latin: { vegetarian: lactose ? 'beans, lentils, eggs, or tofu' : 'beans, eggs, cheese, or yogurt', nonveg: 'beans, eggs, chicken, or fish', vegan: 'beans, lentils, tofu, or seeds', pescatarian: 'fish, beans, or eggs' },
      western: { vegetarian: lactose ? 'eggs, beans, lentils, or tofu' : 'eggs, yogurt, cottage cheese, beans, or tofu', nonveg: 'eggs, chicken, fish, beans, or yogurt', vegan: 'beans, lentils, tofu, tempeh, or soy yogurt', pescatarian: 'fish, eggs, beans, or yogurt' }
    };
    return proteins[region][diet];
  };

  const mealDayFor = (region, diet, needs) => {
    const lactose = needs.includes('lactose') || diet === 'vegan';
    const gluten = needs.includes('gluten');
    const nuts = needs.includes('nuts');
    const shellfish = needs.includes('shellfish');
    const protein = proteinFor(region, diet, lactose);
    const templates = {
      'south-asia': ['Vegetable poha, oats, or besan chilla with a protein side', `${protein} with sabzi and ${gluten ? 'rice or certified gluten-free roti' : 'roti or rice'}`, `Khichdi or a grain bowl with vegetables and ${protein}`, nuts ? 'Fruit with roasted seeds or a yogurt alternative' : 'Fruit with curd/soy yogurt or a small handful of nuts'],
      'middle-east': ['Ful or eggs/tofu with vegetables and whole-grain or gluten-free bread', `${protein}, chopped salad, and ${gluten ? 'rice or potatoes' : 'whole-grain pita or rice'}`, `Vegetable stew with ${protein} and rice or potatoes`, nuts ? 'Fruit with hummus and vegetables' : 'Fruit with yogurt or a few nuts'],
      'east-asia': ['Rice or oats with egg/tofu, greens, and fruit', `${protein}, mixed vegetables, and rice or rice noodles`, `Broth-based soup or stir-fry with ${protein} and vegetables`, 'Fruit, edamame, or unsweetened soy yogurt'],
      africa: ['Oats, millet, or maize porridge with fruit and a protein side', `${protein}, leafy vegetables, and a fist-sized serving of rice, yam, maize, or plantain`, `Bean or vegetable stew with ${protein} and local starch`, nuts ? 'Fruit with roasted chickpeas or seeds' : 'Fruit with yogurt or a few nuts'],
      latin: ['Eggs/tofu with beans, vegetables, and corn tortilla, or oats with fruit', `${protein}, beans, salsa, vegetables, and rice or corn tortilla`, `Vegetable soup or bowl with ${protein}, avocado, and a grain`, nuts ? 'Fruit with seeds or lactose-free yogurt' : 'Fruit with yogurt or nuts'],
      western: ['Oats or whole-grain/gluten-free toast with fruit and a protein side', `${protein}, salad or cooked vegetables, and potato or whole grain`, `Tray-baked vegetables with ${protein} and rice, quinoa, or potato`, nuts ? 'Fruit with seeds, hummus, or yogurt alternative' : 'Fruit with yogurt or nuts']
    };
    let meals = templates[region];
    if (lactose) meals = meals.map((meal) => meal.replaceAll('curd', 'fortified soy yogurt').replaceAll('yogurt', 'lactose-free or fortified plant yogurt').replaceAll('cheese', 'tofu'));
    if (shellfish) meals = meals.map((meal) => meal.replaceAll('fish', 'fin fish prepared without shellfish contact'));
    return meals;
  };

  const renderMeals = (meals) => {
    const labels = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    $('meal-list').replaceChildren(...meals.map((meal, index) => {
      const row = document.createElement('div');
      row.className = 'meal-row';
      const label = document.createElement('strong');
      label.textContent = labels[index];
      const value = document.createElement('span');
      value.textContent = meal;
      row.append(label, value);
      return row;
    }));
  };

  const conditionGuidance = (conditions) => {
    const notes = [];
    if (conditions.includes('ibs')) notes.push('IBS: keep a food-and-symptom log; do not start a restrictive low-FODMAP plan without a dietitian, and increase fibre gradually if advised.');
    if (conditions.includes('ibd')) notes.push('IBD: needs change during flares and remission. Ask your gastroenterology team or dietitian before changing fibre, supplements, or calories.');
    if (conditions.includes('fatigue')) notes.push('Persistent fatigue: unexplained fatigue lasting several weeks or affecting daily life deserves a medical review; use pacing, not push-through exercise.');
    if (conditions.includes('depression')) notes.push('Low mood: movement can support treatment but does not replace mental-health care. If you may harm yourself, contact local emergency or crisis support now.');
    if (conditions.includes('pregnancy')) notes.push('Pregnancy/postpartum: confirm activity and nutrition changes with your maternity clinician. Weight-loss targets and generic calorie estimates are not appropriate here.');
    if (conditions.includes('diabetes')) notes.push('Diabetes: coordinate meal timing, carbohydrates, activity, and medicines with your clinician to reduce the risk of low or high blood glucose.');
    if (conditions.includes('heart')) notes.push('Heart/blood pressure: get clearance for new exercise, keep intensity conversational, and stop for chest pressure, faintness, or unusual breathlessness.');
    if (conditions.includes('kidney')) notes.push('Kidney health: protein, fluids, potassium, and sodium may need individual limits—follow your renal team rather than generic targets.');
    if (conditions.includes('joint')) notes.push('Pain or mobility concerns: use pain-free ranges and consider a physiotherapist for movement substitutions.');
    if (conditions.includes('eating')) notes.push('Eating-disorder history: skip calorie and weight targets and work with an eating-disorder-informed clinician or dietitian.');
    if (conditions.includes('other')) notes.push('Other condition: check the plan with a qualified clinician who understands your diagnosis, symptoms, and medicines.');
    return notes;
  };

  const buildPlan = () => {
    const data = new FormData(form);
    const m = measurements();
    const userAge = Number(data.get('age'));
    const sex = safeChoice(data, 'sex', 'female');
    const goal = safeChoice(data, 'goal', 'maintain');
    const activity = Number(safeChoice(data, 'activity', '1.2'));
    const eating = safeChoice(data, 'eating', 'mixed');
    const sleep = Number(data.get('sleep'));
    const trainingDays = Number(safeChoice(data, 'training', '2'));
    const equipment = safeChoice(data, 'equipment', 'bodyweight');
    const region = safeChoice(data, 'region', 'western');
    const diet = safeChoice(data, 'diet', 'vegetarian');
    const foodNeeds = safeChoices(data, 'foodNeed');
    const conditions = safeChoices(data, 'condition');
    const clinicalNutrition = m.bmi < 18.5 || conditions.some((item) => ['ibd', 'pregnancy', 'diabetes', 'heart', 'kidney', 'eating'].includes(item));
    const requiresClearance = conditions.some((item) => ['ibd', 'fatigue', 'pregnancy', 'heart', 'joint', 'other'].includes(item));

    const bmr = (10 * m.weightKg) + (6.25 * m.heightCm) - (5 * userAge) + (sex === 'male' ? 5 : -161);
    const maintenance = Math.round(bmr * activity / 50) * 50;
    const adjustment = goal === 'lose' ? -350 : goal === 'gain' ? 250 : 0;
    const calorieCenter = maintenance + adjustment;
    const calorieLow = Math.max(sex === 'male' ? 1500 : 1200, calorieCenter - 100);
    const calorieHigh = Math.max(sex === 'male' ? 1600 : 1300, calorieCenter + 100);
    const goalNames = { lose: 'gradual fat loss', maintain: 'steady maintenance', gain: 'strength and muscle gain' };
    const pace = { lose: 'Aim for ~0.25–0.5 kg/week', maintain: 'Keep weight roughly stable', gain: 'Aim for ~0.1–0.25 kg/week' };
    const proteinLow = Math.round(m.weightKg * (goal === 'gain' ? 1.6 : 1.4));
    const proteinHigh = Math.round(m.weightKg * (goal === 'gain' ? 2.0 : 1.8));

    $('result-bmi').textContent = m.bmi.toFixed(1);
    $('result-category').textContent = bmiCategory(m.bmi);
    $('result-calories').textContent = clinicalNutrition ? 'Clinician guided' : `${Math.round(calorieLow / 50) * 50}–${Math.round(calorieHigh / 50) * 50}`;
    $('result-calories').nextElementSibling.textContent = clinicalNutrition ? 'individual assessment recommended' : 'estimated kcal/day';
    $('result-focus').textContent = `${trainingDays} home sessions`;
    $('result-pace').textContent = clinicalNutrition ? 'Health and consistency first' : pace[goal];
    const adjustedGoal = conditions.includes('pregnancy') || conditions.includes('eating') ? 'well-being and steady habits' : goalNames[goal];
    $('plan-summary').textContent = `Built for ${adjustedGoal}, with ${trainingDays} realistic home sessions and ${regionNames[region].toLowerCase()} food ideas.`;

    $('nutrition-intro').textContent = clinicalNutrition
      ? 'Your condition calls for individual nutrition guidance. Use this balanced pattern as a conversation starter with your clinician or dietitian—not a prescription.'
      : goal === 'lose' ? 'Build satisfying meals around protein and produce. The estimate uses a modest deficit—not a crash diet.'
        : goal === 'gain' ? 'Use a small energy surplus, enough protein, and consistent meals to support training without rushing the scale.'
          : 'Keep energy steady with balanced plates and a routine that makes good choices easier.';

    const nutritionItems = [
      clinicalNutrition ? 'Use portions and protein amounts recommended by your care team.' : `Use ${proteinLow}–${proteinHigh} g protein/day as a flexible reference, spread across meals.`,
      eating === 'irregular' ? 'Anchor your day with 2 reliable meals, then add one simple protein-rich snack.' : eating === 'mixed' ? 'Upgrade one convenience meal each day with a fruit, vegetable, or suitable protein.' : 'Keep your balanced routine; vary produce and protein sources through the week.',
      foodNeeds.includes('lactose') ? 'Choose lactose-free dairy or calcium- and vitamin-D-fortified plant alternatives; check labels.' : 'Include calcium-rich foods that fit your diet.',
      foodNeeds.includes('gluten') ? 'Use certified gluten-free grains and prevent cross-contact if you have coeliac disease.' : 'Choose whole grains or local minimally processed starches most often.',
      foodNeeds.includes('nuts') || foodNeeds.includes('shellfish') ? 'Read ingredient labels and prevent cross-contact for declared food allergies.' : 'Keep meals flexible by swapping foods within the same group.'
    ];
    if (conditions.includes('ibs')) nutritionItems.push('For IBS, change one variable at a time and record symptoms; tolerance is individual.');
    if (conditions.includes('ibd')) nutritionItems.push('During an IBD flare, follow the plan from your gastroenterology team rather than this general plate.');
    renderList('nutrition-list', nutritionItems);

    $('meal-intro').textContent = `${regionNames[region]}-inspired examples for a ${diet === 'nonveg' ? 'non-vegetarian' : diet} pattern. Adjust spices, portions, and ingredients to your tolerance and budget.`;
    renderMeals(mealDayFor(region, diet, foodNeeds));

    const equipmentMoves = {
      bodyweight: 'chair squat, wall or counter push-up, supported split squat, glute bridge, bird-dog, and standing calf raise',
      bands: 'band squat, band row, standing chest press, hip hinge, lateral walk, and Pallof press',
      weights: 'goblet squat, one-arm row, floor or standing press, Romanian deadlift, supported reverse lunge, and suitcase carry'
    };
    $('movement-intro').textContent = requiresClearance
      ? 'Begin only within the limits agreed with your clinician or physiotherapist. A five-minute easy version still counts.'
      : `Use ${equipment === 'bodyweight' ? 'your bodyweight and a sturdy chair' : equipment === 'bands' ? 'your resistance band' : 'dumbbells or a secure backpack'}. Keep the first week easy enough to finish feeling capable.`;
    const activeDays = trainingDays === 2 ? [1, 4] : trainingDays === 3 ? [0, 2, 4] : [0, 1, 3, 5];
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    $('week-strip').replaceChildren(...dayNames.map((day, index) => {
      const cell = document.createElement('div');
      cell.className = `day${activeDays.includes(index) ? ' active' : ''}`;
      const label = document.createElement('small');
      label.textContent = day;
      const value = document.createElement('span');
      value.textContent = activeDays.includes(index) ? 'GO' : '—';
      cell.append(label, value);
      return cell;
    }));
    const movementItems = conditions.includes('pregnancy') ? [
      'With maternity-team clearance: 10–20 minutes of comfortable walking, supported squats, wall push-ups, band rows, and side-lying work.',
      'Avoid overheating, breath-holding, fall-risk activities, and prolonged flat-on-back exercise after the first trimester.',
      'Use the talk test. Stop and seek care for pain, bleeding, dizziness, chest pain, fluid leakage, or unusual breathlessness.'
    ] : [
      `Session: 5-minute warm-up, then 2 rounds of ${equipmentMoves[equipment]}. Do 6–12 comfortable reps each.`,
      conditions.includes('joint') ? 'Use a pain-free range, a sturdy support, and clinician-approved substitutions.' : 'Rest 45–90 seconds as needed; finish with energy left rather than training to exhaustion.',
      conditions.includes('fatigue') || conditions.includes('depression') ? 'Low-energy option: 5 minutes—march gently, do 5 chair stands and 5 wall push-ups, then stop or repeat once.' : 'Progress by adding 1–2 reps before adding resistance. Two short walks on non-training days are enough to begin.'
    ];
    renderList('movement-list', movementItems);

    $('mind-intro').textContent = 'Every plan includes a small nervous-system reset. It is practice, not a performance.';
    const mindItems = conditions.includes('pregnancy') ? [
      '5–8 minutes of prenatal yoga approved by your maternity clinician; use support for balance and avoid hot yoga.',
      'Try shoulder rolls, cat-cow, supported side stretches, and a comfortable seated rest; avoid prolonged flat-on-back poses after the first trimester.',
      'Finish with 3 minutes of easy breathing—no breath-holds—or a short guided meditation.'
    ] : [
      '6-minute gentle flow: mountain pose, shoulder rolls, cat-cow, supported child’s pose, and an easy seated twist.',
      '3-minute meditation: notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.',
      'On hard days, take 5 slow breaths and stretch for 60 seconds. Keeping the habit alive is the win.'
    ];
    renderList('mind-list', mindItems);

    const sleepHours = Number(data.get('sleep'));
    const sleepText = sleepHours < 7 ? `Currently ${sleepHours} h — move bedtime 15 minutes earlier this week.` : `${sleepHours} h reported — protect the same sleep and wake times.`;
    const waterTarget = Math.max(1.5, Math.min(3.5, m.weightKg * 0.03)).toFixed(1);
    const hydrationText = conditions.includes('kidney') || conditions.includes('heart') ? 'Follow the fluid target given by your care team.' : `A practical baseline is about ${waterTarget} L/day; needs vary with heat, pregnancy, and exercise.`;
    const goalHabit = clinicalNutrition ? 'Track energy, symptoms, and consistency—not rapid weight change.' : goal === 'lose' ? 'Weigh 2–3 mornings/week; judge the 3–4 week trend.' : goal === 'gain' ? 'Log your main movements and improve one small thing weekly.' : 'Check energy, strength, and weight monthly—not daily.';
    const habits = [
      ['Sleep', sleepText], ['Hydration', hydrationText], ['Feedback loop', goalHabit],
      ['Motivation', 'Choose a fixed cue: after morning tea, after work, or before your shower. Start with five minutes.']
    ];
    $('habit-grid').replaceChildren(...habits.map(([title, text]) => {
      const card = document.createElement('div');
      card.className = 'habit';
      const heading = document.createElement('strong');
      heading.textContent = title;
      const copy = document.createElement('small');
      copy.textContent = text;
      card.append(heading, copy);
      return card;
    }));

    $('first-week-text').textContent = requiresClearance
      ? 'Confirm your safe limits, then try two five-minute movement sessions, one gentle yoga reset, and one repeatable meal.'
      : `Complete ${trainingDays} home sessions, one gentle yoga reset, and repeat one meal template twice. Use the five-minute version whenever motivation is low.`;

    const guidance = conditionGuidance(conditions);
    const clinicalNote = $('clinical-note');
    clinicalNote.hidden = guidance.length === 0;
    clinicalNote.replaceChildren();
    if (guidance.length) {
      const heading = document.createElement('strong');
      heading.textContent = 'Important notes for your selections';
      const body = document.createElement('p');
      body.textContent = guidance.join(' ');
      clinicalNote.append(heading, body);
    }
  };

  document.querySelector('[data-start]').addEventListener('click', () => {
    intro.hidden = true;
    planner.hidden = false;
    showStep(1);
  });
  unitButtons.forEach((button) => button.addEventListener('click', () => setUnit(button.dataset.unit)));
  [height, weight].forEach((input) => input.addEventListener('input', updateBmiPreview));
  document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => {
    if (validateStep()) showStep(Math.min(4, currentStep + 1));
  }));
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showStep(Math.max(1, currentStep - 1))));
  $('other-condition-check').addEventListener('change', (event) => {
    $('other-condition-wrap').hidden = !event.target.checked;
    if (event.target.checked) $('other-condition').focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    buildPlan();
    form.hidden = true;
    results.hidden = false;
    currentStep = 5;
    indicators.forEach((indicator) => {
      const value = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('active', value === 5);
      indicator.classList.toggle('done', value < 5);
    });
    $('mobile-step').textContent = 'Your plan';
    $('mobile-bar').dataset.progress = '100';
    planner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('restart').addEventListener('click', () => {
    form.reset();
    unit = 'metric';
    unitButtons.forEach((button) => {
      const active = button.dataset.unit === 'metric';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    height.min = '100'; height.max = '250'; height.placeholder = 'e.g. 170';
    weight.min = '30'; weight.max = '350'; weight.placeholder = 'e.g. 70';
    $('height-unit').textContent = 'cm'; $('weight-unit').textContent = 'kg'; $('target-unit').textContent = 'kg';
    $('other-condition-wrap').hidden = true;
    updateBmiPreview();
    results.hidden = true;
    form.hidden = false;
    showStep(1);
  });
  $('print-plan').addEventListener('click', () => window.print());
})();

