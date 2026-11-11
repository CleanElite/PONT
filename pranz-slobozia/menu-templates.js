const esc = value => String(value ?? '').replace(/[&<>"]/g, char =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[char]));
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Bucharest'}).format(new Date());
const formatDate = date => date.split('-').reverse().join('.');
const groups = [['first','Felul 1'], ['second','Felul 2'], ['dessert','Desert']];

export function renderDishChecklist(entries, selected, {daily = false, renderDetails = () => ''} = {}) {
  return groups.map(([category, label]) => {
    const categoryEntries = entries.filter(([, dish]) => dish.category === category);
    const totalCount = categoryEntries.length;
    const selectedCount = categoryEntries.filter(([key]) => selected.has(key)).length;
    const options = categoryEntries.map(([key, dish], index) => {
      const checked = selected.has(key);
      const name = esc(dish.name) + (dish.available === false ? ' · Epuizat' : '');
      if (daily) {
        const inputId = 'pont-daily-' + category + '-' + index;
        return `<div class="pont-checklist-option pont-daily-choice">
          <label for="${inputId}" class="pont-daily-choice-name"><span>${name}</span></label>
          ${renderDetails(key, dish, checked)}
          <input id="${inputId}" type="checkbox" data-select aria-label="Selectează ${esc(dish.name)}" value="${esc(key)}" ${checked ? 'checked' : ''}>
        </div>`;
      }
      return `<div class="pont-checklist-option">
        <label><input type="checkbox" name="dish" value="${esc(key)}" ${checked ? 'checked' : ''}><span>${name}</span></label>
        ${renderDetails(key, dish, checked)}
      </div>`;
    }).join('');
    const counter = daily ? `<div class="pont-daily-course-counter" aria-live="polite"><span>${totalCount} preparate</span><span aria-hidden="true"> · </span><span>${selectedCount} selectate</span></div>` : '';
    return `<fieldset${daily ? ' class="pont-daily-fieldset pont-daily-fieldset--' + category + '"' : ''}><legend>${label}</legend><div class="${daily ? 'pont-daily-scroll-list' : 'pont-standard-dish-list'}" data-course="${category}">${options || '<small>Niciun preparat.</small>'}</div>${counter}</fieldset>`;
  }).join('');
}

function renderMenuCourses(menu) {
  const snapshots = Array.isArray(menu.dish_selection) ? menu.dish_selection : [];
  const legacy = {first:menu.first_course, second:menu.second_course, dessert:menu.dessert};
  return groups.map(([key, label]) => {
    const dishes = snapshots.filter(dish => dish?.category === key && dish.name).map(dish => dish.name);
    if (!dishes.length && legacy[key]) dishes.push(legacy[key]);
    return dishes.length ? '<div><dt>'+label+'</dt><dd>'+dishes.map(esc).join(' · ')+'</dd></div>' : '';
  }).join('');
}

export function renderPublishedToday(target, menus, restaurants, showRestaurantName, resetExpanded = false) {
  const date = today();
  const published = restaurants.flatMap(restaurant => menus
    .filter(menu => menu.published && menu.service_date === date && menu.restaurant_id === restaurant.id)
    .map(menu => ({menu, restaurant})));
  const editButton = menu => '<button type="button" class="pont-today-edit" data-today-edit="' +
    esc(menu.id) + '">Editează</button>';
  const expanded = !resetExpanded && target.querySelector('.pont-today-toggle')?.getAttribute('aria-expanded') === 'true';
  const header = '<div class="pont-today-header"><h3 id="pontTodayHeading">' +
    '<button class="pont-today-toggle" type="button" aria-expanded="' + expanded + '" aria-controls="pontTodayDetails">' +
    '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>' +
    'Meniul publicat azi</button></h3>' +
    '<time datetime="' + date + '">' + formatDate(date) + '</time>' +
    (published.length === 1 ? editButton(published[0].menu) : '') + '</div>';
  const cards = published.map(({menu, restaurant}) => {
    const heading = showRestaurantName ? '<h4>' + esc(restaurant.name) + '</h4>' : '';
    const action = published.length > 1 ? editButton(menu) : '';
    const courses = renderMenuCourses(menu);
    return '<article class="pont-archive-row pont-today-card">' +
      (heading || action ? '<div class="pont-today-meta">' + heading + action + '</div>' : '') +
      (courses ? '<dl>' + courses + '</dl>' : '<p>Detalii indisponibile.</p>') + '</article>';
  }).join('');
  target.innerHTML = header + '<div id="pontTodayDetails"' + (expanded ? '' : ' hidden') + '>' +
    (cards || '<p class="pont-today-empty">Nu există meniuri publicate azi.</p>') + '</div>';
  const toggle = target.querySelector('.pont-today-toggle');
  const details = target.querySelector('#pontTodayDetails');
  toggle.addEventListener('click', () => {
    details.hidden = !details.hidden;
    toggle.setAttribute('aria-expanded', String(!details.hidden));
  });
}

export function renderMenuArchive(target, menus, restaurants) {
  const names = new Map(restaurants.map(restaurant => [restaurant.id, restaurant.name]));
  const cutoff = today();
  const items = menus.filter(menu => menu.published && menu.service_date && menu.service_date <= cutoff);
  target.innerHTML = items.map(menu => {
    const courses = renderMenuCourses(menu);
    const restaurant = restaurants.length > 1 ? ' · '+esc(names.get(menu.restaurant_id) || 'Restaurant') : '';
    const price = menu.price == null || menu.price === '' ? '' : ' · '+esc(Number(menu.price).toLocaleString('ro-RO'))+' lei';
    return `<article class="pont-archive-row">
      <p><time datetime="${esc(menu.service_date)}">${esc(formatDate(menu.service_date))}</time> · <strong>${esc(menu.title || 'Meniul zilei')}</strong>${restaurant}${price}</p>
      ${courses ? '<dl>'+courses+'</dl>' : '<p>Detaliile preparatelor nu sunt disponibile.</p>'}
    </article>`;
  }).join('') || '<p>Nu există meniuri publicate până azi.</p>';
}

export function initMenuTemplates({db, getRestaurants, refreshHistory}) {
  const host = document.getElementById('pontMenuTemplates');
  host.innerHTML = `
    <div class="pont-model-toolbar">
      <h2>Modele de meniu</h2>
      <label id="pontModelRestaurantField">Restaurant<select id="pontModelRestaurant"></select></label>
      <button type="button" class="primary" id="pontModelNew">Model nou</button>
    </div>
    <p id="pontModelStatus" role="status"></p>
    <details class="pont-model-saved" id="pontModelSaved">
      <summary>Modele salvate <span class="pont-model-chevron" aria-hidden="true"></span></summary>
      <div class="pont-model-saved-body">
        <p class="pont-model-hint">Alege un model și o dată pentru a publica. Poți reutiliza același model oricând.</p>
        <div id="pontModelList"></div>
      </div>
    </details>
    <dialog id="pontModelDialog" class="pont-menu-dialog pont-model-dialog" aria-labelledby="pontModelTitle">
      <form id="pontModelForm">
        <h3 id="pontModelTitle"></h3>
        <div id="pontModelEditor">
          <label>Numele modelului<input id="pontModelName" maxlength="80" required></label>
          <div id="pontModelDishes" class="pont-dish-checklist"></div>
        </div>
        <div id="pontModelPublishFields" hidden>
          <p id="pontModelPublishName"></p>
          <label>Data meniului<input type="date" id="pontModelDate"></label>
        </div>
        <p id="pontModelError" role="alert"></p>
        <div class="pont-model-actions">
          <button type="button" id="pontModelCancel">Anulează</button>
          <button type="submit" class="primary" id="pontModelSubmit">Salvează modelul</button>
        </div>
      </form>
    </dialog>`;
  const $ = id => document.getElementById(id);
  const restaurantPicker = $('pontModelRestaurant');
  const list = $('pontModelList');
  const status = $('pontModelStatus');
  const dialog = $('pontModelDialog');
  const nameInput = $('pontModelName');
  const dateInput = $('pontModelDate');
  const submit = $('pontModelSubmit');
  const cancel = $('pontModelCancel');
  const errorMessage = $('pontModelError');
  let models = [], dishes = [], byId = new Map();
  let request = 0, ready = false, busy = false, activeModel = null, publishing = false, focusAfterClose = null;

  function renderList() {
    list.innerHTML = models.map(model => {
      const selected = model.dish_ids.map(id => byId.get(id));
      const categories = groups.map(([key, label]) => {
        const names = selected.filter(dish => dish?.category === key).map(dish => esc(dish.name));
        return names.length ? '<div><dt>'+label+'</dt><dd>'+names.join(' · ')+'</dd></div>' : '';
      }).join('');
      const unavailable = selected.some(dish => !dish);
      const restaurant = getRestaurants().find(item => item.id === model.restaurant_id);
      return `<article class="pont-model-row">
        <h3>${esc(model.name)}</h3><dl>${categories}</dl>
        ${unavailable ? '<p>Un preparat lipsește din bibliotecă. Editează modelul.</p>' : ''}
        <div class="pont-model-actions">
          <button type="button" class="primary" data-model-publish="${esc(model.id)}" ${unavailable || !restaurant?.enabled ? 'disabled' : ''}>Publică</button>
          <button type="button" data-model-edit="${esc(model.id)}">Editează</button>
          <button type="button" data-model-delete="${esc(model.id)}" class="admin-danger">Șterge</button>
        </div>
      </article>`;
    }).join('') || '<p>Nu ai încă modele salvate.</p>';
  }

  async function refresh(selectedId, keepStatus = false) {
    const version = ++request;
    const restaurants = getRestaurants();
    const previous = selectedId || restaurantPicker.value;
    restaurantPicker.replaceChildren(...restaurants.map(restaurant => new Option(restaurant.name, restaurant.id)));
    if (restaurants.some(restaurant => restaurant.id === previous)) restaurantPicker.value = previous;
    $('pontModelRestaurantField').hidden = restaurants.length < 2;
    const restaurant = restaurantPicker.value;
    ready = false;
    $('pontModelNew').disabled = true;
    list.replaceChildren();
    if (!restaurant) {
      status.textContent = 'Alege un restaurant pentru a vedea modelele.';
      return;
    }
    if (!keepStatus) status.textContent = 'Se încarcă modelele…';
    try {
      const [templateResult, dishResult] = await Promise.all([
        db.from('pont_menu_templates').select('id,restaurant_id,name,dish_ids').eq('restaurant_id', restaurant).order('name'),
        db.from('pont_dishes').select('id,category,name,available').eq('restaurant_id', restaurant).order('name')
      ]);
      if (version !== request) return;
      if (templateResult.error || dishResult.error) throw (templateResult.error || dishResult.error);
      models = templateResult.data ?? [];
      dishes = dishResult.data ?? [];
      byId = new Map(dishes.map(dish => [dish.id, dish]));
      ready = true;
      $('pontModelNew').disabled = false;
      if (!keepStatus) status.textContent = '';
      renderList();
    } catch (error) {
      if (version === request) status.textContent = 'Modelele nu s-au încărcat. ' + error.message;
    }
  }

  function open(model, publish, trigger) {
    if (!ready || dialog.open) return;
    activeModel = model;
    publishing = publish;
    focusAfterClose = trigger;
    errorMessage.textContent = '';
    $('pontModelTitle').textContent = publish ? 'Alege data publicării' : model?.id ? 'Editează modelul' : 'Model nou';
    $('pontModelEditor').hidden = publish;
    $('pontModelPublishFields').hidden = !publish;
    nameInput.disabled = publish;
    dateInput.disabled = !publish;
    dateInput.required = publish;
    submit.textContent = publish ? 'Publică' : 'Salvează modelul';
    if (publish) {
      dateInput.min = today();
      dateInput.value = dateInput.min;
      $('pontModelPublishName').textContent = model.name;
    } else {
      nameInput.value = model?.name ?? '';
      const picked = new Set(model?.dish_ids ?? []);
      $('pontModelDishes').innerHTML = renderDishChecklist(dishes.map(dish => [dish.id, dish]), picked);
      if (model?.dish_ids.some(id => !byId.has(id))) {
        errorMessage.textContent = 'Preparatele eliminate din bibliotecă trebuie înlocuite.';
      }
    }
    dialog.showModal();
    (publish ? dateInput : nameInput).focus();
  }

  restaurantPicker.onchange = () => void refresh();
  $('pontModelNew').onclick = event => open(null, false, event.currentTarget);
  cancel.onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    if (focusAfterClose?.isConnected) focusAfterClose.focus();
  });

  list.onclick = async event => {
    const button = event.target.closest('button');
    if (!button || !ready) return;
    const {modelEdit, modelPublish, modelDelete} = button.dataset;
    const model = models.find(item => item.id === (modelEdit || modelPublish || modelDelete));
    if (!model) return;
    if (modelEdit || modelPublish) {
      open(model, Boolean(modelPublish), button);
      return;
    }
    if (!confirm('Ștergi modelul „'+model.name+'”?')) return;
    button.disabled = true;
    try {
      const {error} = await db.from('pont_menu_templates').delete().eq('id', model.id).eq('restaurant_id', model.restaurant_id);
      if (error) throw error;
      if (restaurantPicker.value === model.restaurant_id) await refresh();
    } catch (error) {
      if (restaurantPicker.value === model.restaurant_id) status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };

  $('pontModelForm').onsubmit = async event => {
    event.preventDefault();
    if (busy) return;
    const restaurant = restaurantPicker.value;
    errorMessage.textContent = '';
    busy = submit.disabled = cancel.disabled = true;
    try {
      if (publishing) {
        const date = dateInput.value;
        const {error} = await db.rpc('pont_publish_menu_template', {p_template:activeModel.id, p_date:date});
        if (error) throw error;
        dialog.close();
        status.textContent = date === today()
          ? 'Meniul a fost publicat pentru azi.'
          : 'Meniul a fost programat pentru '+formatDate(date)+'.';
        try { await refreshHistory(); } catch { status.textContent += ' Reîncarcă pagina pentru a vedea istoricul.'; }
      } else {
        const name = nameInput.value.trim();
        const ids = new FormData(event.currentTarget).getAll('dish');
        if (!name || !ids.length || ids.length > 60) throw Error('Completează numele și selectează între 1 și 60 de preparate.');
        const values = {name, dish_ids:ids};
        const query = activeModel?.id
          ? db.from('pont_menu_templates').update(values).eq('id', activeModel.id).eq('restaurant_id', restaurant)
          : db.from('pont_menu_templates').insert({...values, restaurant_id:restaurant});
        const {error} = await query;
        if (error) throw error;
        dialog.close();
        status.textContent = 'Model salvat.';
        await refresh(restaurant, true);
        $('pontModelNew').focus();
      }
    } catch (error) {
      errorMessage.textContent = error.message;
    } finally {
      busy = submit.disabled = cancel.disabled = false;
    }
  };

  return {refresh};
}
