// PONT: library of reusable restaurant dishes and daily menu selector.
export function initPontDishEditor({db, getRestaurants, refreshMenus, isRestaurantAdmin = false}) {
const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups = [['first','Felul 1','bowl-food'], ['second','Felul 2','fork-knife'], ['dessert','Desert','cake']];
const todayRO = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Bucharest', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const priceRO = new Intl.NumberFormat('ro-RO', {minimumFractionDigits:2, maximumFractionDigits:2});
const host = $('toggleMenuForm'), wrap = $('menuFormWrap'), catalog = $('dishLibrary');
if (!host || !wrap || !catalog) return;

const selected = new Map(), savedChoices = new Map();
let dishes = [], category = 'first', dailyCategory = 'first';
let draftVersion = 0, menuDescription = '', pendingMenu = null;
let editingDish = null, editingMenu = null, loadedRid = '', loadVersion = 0, saving = false, previewURL = '';
const icon = name => '<svg class="admin-icon" aria-hidden="true"><use href="../admin-icons.svg?v=1#' + name + '"></use></svg>';

catalog.innerHTML = `
  <div class="admin-library-grid">
    <aside class="card">
      <div class="admin-panel-head"><h2>Categorii</h2></div>
      <div class="admin-categories" id="pontDishTabs" aria-label="Categorii de preparate"></div>
      <p class="admin-category-help">Alege o categorie pentru a vedea preparatele salvate.</p>
    </aside>
    <section class="card admin-dish-editor">
      <div class="admin-panel-head"><h2>${icon('chef-hat')}<span id="pontDishFormTitle">Adaugă preparat</span></h2></div>
      <label>Restaurant<select id="pontDishRestaurant" required></select></label>
      <form id="pontDishForm">
        <div class="admin-dish-editor-fields">
          <div class="admin-dish-photo-field">
            <label class="admin-dish-photo">
              <img id="pontDishPreview" alt="" hidden>
              <span class="admin-dish-photo-empty" id="pontDishPhotoEmpty">${icon('camera')}Adaugă fotografie</span>
              <span class="admin-dish-photo-edit" id="pontDishPhotoEdit" hidden>${icon('camera')}</span>
              <input type="file" id="pontDishPhoto" aria-label="Fotografie preparat" aria-describedby="pontDishPhotoHelp" accept="image/jpeg,image/png,image/webp">
            </label>
            <small id="pontDishPhotoHelp">JPG, PNG sau WebP · maximum 2 MB</small>
          </div>
          <div class="admin-dish-details">
            <label>Nume preparat<input id="pontDishName" required minlength="2" maxlength="120"></label>
            <label>Descriere (opțional)<textarea id="pontDishDescription" maxlength="500" rows="3"></textarea></label>
          </div>
        </div>
        <div class="pont-dish-grid">
          <label id="pontDishPriceField">Preț (lei)<input id="pontDishPrice" type="number" min="0" max="10000" step=".01" required></label>
          <label>Categorie<select id="pontDishCategory">${groups.map(([key, name]) => '<option value="' + key + '">' + name + '</option>').join('')}</select></label>
        </div>
        <div class="pont-dish-actions">
          <button id="pontDishCancel" type="button" hidden>Anulează editarea</button>
          <button id="pontDishSave" type="submit" class="primary">Adaugă preparat</button>
        </div>
      </form>
      <p id="pontDishMessage" role="status"></p>
    </section>
  </div>
  <section class="card">
    <div class="admin-panel-head">
      <h2 id="pontDishListTitle">Preparate salvate</h2>
      <button id="pontDishNew" type="button" class="primary">${icon('plus')}Adaugă preparat</button>
    </div>
    <div id="pontDishList"></div>
  </section>
`;

const availabilityStyle = document.createElement('style');
availabilityStyle.textContent = `
.pont-availability { display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap; }
.pont-availability-btn { min-height:34px; padding:7px 11px; border:1px solid rgba(170,195,201,.35); border-radius:9px; background:rgba(80,104,113,.10); color:#c3cdd1; font:600 12px/1.2 system-ui,sans-serif; cursor:pointer; transition:background .15s ease,border-color .15s ease,color .15s ease; }
.pont-availability-btn.available.is-selected { background:#146c43; border-color:#41d48a; color:#fff; }
.pont-availability-btn.sold-out.is-selected { background:#a42935; border-color:#fa727d; color:#fff; }
.pont-availability-btn:not(.is-selected):hover { border-color:#97c0c9; color:#f5ffff; }
.pont-availability-btn:focus-visible { outline:2px solid #cbf7ff;outline-offset:3px; }
.pont-availability-btn:disabled { opacity:.7;cursor:wait; }
@media(max-width:560px){.pont-availability {width:100%;}.pont-availability-btn{flex:1;}}
`;
catalog.prepend(availabilityStyle);
const dishEditor = catalog.querySelector('.admin-dish-editor');
const dishFormMessage = $('pontDishMessage');
let dishListMessage = dishFormMessage;
if (!isRestaurantAdmin) {
  const libraryCard = $('pontDishList').closest('section');
  const filters = catalog.querySelector('.admin-library-grid aside');
  const layout = filters.parentElement;
  const results = document.createElement('div');
  results.className = 'dashboard-catalog-main';
  filters.querySelector('.admin-panel-head').after($('pontDishRestaurant').closest('label'));
  results.append(dishEditor, libraryCard);
  layout.append(results);
  catalog.insertAdjacentHTML('afterbegin', '<div class="dashboard-heading"><div><h2>Preparate</h2><p>Alege restaurantul și categoria pentru a-i vedea biblioteca.</p></div></div>');
  dishEditor.hidden = true;
  dishListMessage = document.createElement('p');
  dishListMessage.className = 'dashboard-message';
  dishListMessage.setAttribute('role', 'status');
  $('pontDishList').before(dishListMessage);
}

const form = document.createElement('form');
form.id = 'pontDailyBuilder';
form.innerHTML = `
  <div class="pont-daily-fields">
    <label id="pontDailyRestaurantField">Restaurant<select id="pontDailyRestaurant" required></select></label>
    <label>Data<input id="pontDailyDate" type="date" required></label>
    <label>Preț (lei)<input id="pontDailyCombo" type="number" min="0" step=".01" inputmode="decimal" placeholder="0,00" required></label>
    <label>Stare<select id="pontDailyState"><option value="true">Publică</option><option value="false">Ciornă</option></select></label>
  </div>
  <div class="admin-daily-grid">
    <div class="admin-daily-categories">
      <h4>Categorii</h4>
      <div id="pontDailyTabs" class="admin-categories" aria-label="Categorii din meniul zilei"></div>
    </div>
    <div class="admin-daily-selection">
      <h4>Preparate</h4>
      <div id="pontDailyDishes"></div>
    </div>
  </div>
  <p id="pontDailyError" class="pont-dish-error" role="alert"></p>
  <div class="pont-dish-actions">
    <button id="pontDailyCancel" type="button" hidden>Anulează</button>
    <button id="pontDailyNext" type="submit" class="primary">Publică</button>
  </div>
`;
wrap.append(form);

const dialog = document.createElement('dialog');
dialog.id = 'pontDishConfirm';
dialog.setAttribute('aria-labelledby', 'pontDishConfirmTitle');
dialog.innerHTML = '<h3 id="pontDishConfirmTitle">Verifică meniul</h3><div id="pontDishRecap"></div><p id="pontDishConfirmError" class="pont-dish-error" role="alert"></p><div class="pont-dish-actions"><button type="button" id="pontDishBack">Înapoi</button><button type="button" class="primary" id="pontDishPublish">Publică</button></div>';
document.body.append(dialog);

const rid = () => $('pontDailyRestaurant').value;
const photoUrl = dish => dish?.photo_path ? db.storage.from('pont-dish-images').getPublicUrl(dish.photo_path).data.publicUrl : '';

function options() {
  const restaurants = getRestaurants() || [];
  const before = rid();
  const value = restaurants.some(restaurant => restaurant.id === before) ? before : restaurants[0]?.id || '';
  const markup = restaurants.map(restaurant => '<option value="' + esc(restaurant.id) + '">' + esc(restaurant.name) + '</option>').join('');
  for (const picker of [$('pontDailyRestaurant'), $('pontDishRestaurant')]) {
    picker.innerHTML = markup;
    picker.value = value;
    picker.disabled = restaurants.length === 1;
    picker.closest('label').hidden = isRestaurantAdmin && restaurants.length === 1;
  }
  if (before !== value) {
    resetDaily();
    resetDish();
  }
}

function tabs(id, active, onSelect, items = dishes, showIcons = true) {
  $(id).innerHTML = groups.map(([key, name, glyph]) =>
    '<button type="button" data-category="' + key + '" aria-pressed="' + (key === active) + '">' +
    (showIcons ? icon(glyph) : '') + '<span>' + name + '</span><span class="admin-category-count" aria-hidden="true">' +
    items.filter(dish => dish.category === key).length + '</span></button>'
  ).join('');
  $(id).onclick = event => {
    const button = event.target.closest('[data-category]');
    if (button) {
      onSelect(button.dataset.category);
      $(id).querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
    }
  };
}

function library() {
  tabs('pontDishTabs', category, next => {
    category = next;
    if (!editingDish) {
      $('pontDishCategory').value = next;
      syncDishPrice();
    }
    library();
  });
  const list = dishes.filter(dish => dish.category === category);
  const count = list.length === 1 ? '1 preparat' : list.length + ' preparate';
  $('pontDishListTitle').textContent = groups.find(([key]) => key === category)[1] + ' · ' + count;
  $('pontDishList').innerHTML = list.length ? list.map(dish => {
    const photo = photoUrl(dish);
    return '<div class="pont-dish-line pont-library-row"><div class="pont-dish-summary">' +
      (photo ? '<img loading="lazy" alt="" src="' + esc(photo) + '">' : '') +
      '<span class="name"><strong>' + esc(dish.name) + '</strong>' +
      (dish.description ? '<small>' + esc(dish.description) + '</small>' : '') + '</span></div>' +
      '<span class="pont-dish-price">' + (dish.category === 'dessert' ? 'Inclus' : priceRO.format(dish.price) + ' lei') + '</span>' +
      '<div class="pont-availability" role="group" aria-label="Disponibilitate ' + esc(dish.name) + '">' +
      '<button type="button" class="pont-availability-btn available' + (dish.available !== false ? ' is-selected' : '') + '" data-availability="' + esc(dish.id) + '" data-available="true" aria-pressed="' + String(dish.available !== false) + '">Disponibil</button>' +
      '<button type="button" class="pont-availability-btn sold-out' + (dish.available === false ? ' is-selected' : '') + '" data-availability="' + esc(dish.id) + '" data-available="false" aria-pressed="' + String(dish.available === false) + '">Epuizat</button></div>' +
      '<div class="admin-row-actions"><button type="button" data-edit-dish="' + esc(dish.id) + '" aria-label="Editează ' + esc(dish.name) + '" title="Editează">' + icon('pencil-simple') + '</button>' +
      '<button type="button" class="admin-danger" data-delete-dish="' + esc(dish.id) + '" aria-label="Șterge ' + esc(dish.name) + '" title="Șterge">' + icon('trash') + '</button></div></div>';
  }).join('') : '<p>Nu există preparate salvate în această categorie.</p>';
}

function menuChoices() {
  return [...dishes.filter(dish => !savedChoices.has(dish.id)).map(dish => [dish.id, dish]), ...savedChoices];
}
function choices() {
  const entries = menuChoices();
  tabs('pontDailyTabs', dailyCategory, next => { dailyCategory = next; choices(); }, entries.map(([,dish]) => dish), false);
  const list = entries.filter(([,dish]) => dish.category === dailyCategory);
  $('pontDailyDishes').innerHTML = list.length ? list.map(([key,dish]) => {
    const chosen = selected.get(key);
    const price = dish.category === 'dessert' ? '<span class="pont-daily-price">Inclus</span>' :
      chosen ? '<div class="pont-daily-price"><input type="number" aria-label="Preț ' + esc(dish.name) + '" data-price="' + esc(key) +
        '" inputmode="decimal" min="0" max="10000" step=".01" value="' + esc(Number.isFinite(chosen.price) ? chosen.price : '') + '"><span>lei</span></div>' :
        '<span class="pont-daily-price">' + priceRO.format(dish.price) + ' lei</span>';
    return '<div class="pont-daily-dish"><div class="pont-daily-dish-info"><strong>' + esc(dish.name) + '</strong>' + price +
      '</div><label class="pont-daily-switch"><input type="checkbox" role="switch" aria-label="Include ' + esc(dish.name) +
      ' în meniul zilei" data-select="' + esc(key) + '"' + (chosen ? ' checked' : '') + '></label></div>';
  }).join('') : '<p class="pont-daily-empty">Niciun preparat în această categorie.</p>';
}

async function load() {
  const version = ++loadVersion;
  const restaurant = rid();
  if (!restaurant || restaurant !== loadedRid) {
    dishes = [];
    library();
    choices();
  }
  if (!restaurant) return;
  const {data, error} = await db.from('pont_dishes').select('*').eq('restaurant_id', restaurant).order('name');
  if (version !== loadVersion) return;
  if (error) {
    loadedRid = '';
    throw error;
  }
  loadedRid = restaurant;
  dishes = data || [];
  library();
  choices();
}
function renderDishPhoto() {
  if (previewURL) URL.revokeObjectURL(previewURL);
  const file = $('pontDishPhoto').files[0];
  previewURL = file ? URL.createObjectURL(file) : '';
  const url = previewURL || photoUrl(editingDish);
  const image = $('pontDishPreview');
  if (url) image.src = url;
  else image.removeAttribute('src');
  image.hidden = !url;
  $('pontDishPhotoEmpty').hidden = !!url;
  $('pontDishPhotoEdit').hidden = !url;
}
function syncDishPrice() {
  const dessert = $('pontDishCategory').value === 'dessert';
  const input = $('pontDishPrice');
  $('pontDishPriceField').hidden = dessert;
  input.disabled = dessert;
  input.required = !dessert;
}

function resetDish() {
  editingDish = null;
  $('pontDishForm').reset();
  $('pontDishCategory').value = category;
  syncDishPrice();
  $('pontDishFormTitle').textContent = 'Adaugă preparat';
  $('pontDishSave').textContent = 'Adaugă preparat';
  $('pontDishCancel').hidden = isRestaurantAdmin;
  $('pontDishCancel').textContent = isRestaurantAdmin ? 'Anulează editarea' : 'Anulează';
  dishFormMessage.textContent = '';
  renderDishPhoto();
}
function updateDailyButton() {
  $('pontDailyNext').textContent = $('pontDailyState').value === 'true' ? 'Publică' : 'Salvează ciorna';
}
function resetDaily() {
  draftVersion++;
  editingMenu = null;
  menuDescription = '';
  savedChoices.clear();
  selected.clear();
  dailyCategory = 'first';
  $('pontDailyDate').value = todayRO();
  $('pontDailyCombo').value = '';
  $('pontDailyState').value = 'true';
  $('pontDailyCancel').hidden = true;
  $('pontDailyError').textContent = '';
  updateDailyButton();
}
function setEditorOpen(open) {
  wrap.hidden = !open;
  host.setAttribute('aria-expanded', String(open));
}
function restoreMenuDishes(menu) {
  const stored = Array.isArray(menu.dish_selection) ? menu.dish_selection.filter(dish =>
    dish?.name && groups.some(([key]) => key === dish.category)) : [];
  const items = stored.length ? stored : [
    {name:menu.first_course, category:'first', price:menu.first_price ?? menu.price},
    {name:menu.second_course, category:'second', price:menu.second_price ?? menu.price},
    {name:menu.dessert, category:'dessert', price:0}
  ].filter(dish => dish.name?.trim());
  for (const [index,dish] of items.entries()) {
    const match = dishes.find(candidate => dish.id ? candidate.id === dish.id :
      candidate.category === dish.category && candidate.name === dish.name);
    const id = dish.id || match?.id;
    const key = id || 'saved-' + index;
    const item = {
      ...(id ? {id} : {}), name:dish.name, category:dish.category,
      available:(match?.available ?? dish.available) !== false,
      price:dish.category === 'dessert' ? 0 : Number(dish.price ?? match?.price ?? 0),
      description:dish.description ?? match?.description ?? '',
      photo_url:dish.photo_url ?? photoUrl(match)
    };
    savedChoices.set(key, item);
    selected.set(key, {...item});
  }
}
async function open(menu, copy = false) {
  options();
  resetDaily();
  const version = draftVersion;
  if (menu) {
    editingMenu = copy ? null : menu.id;
    menuDescription = menu.description ?? '';
    if (rid() !== menu.restaurant_id) {
      $('pontDailyRestaurant').value = menu.restaurant_id;
      $('pontDishRestaurant').value = menu.restaurant_id;
      resetDish();
    }
    $('pontDailyDate').value = copy ? todayRO() : menu.service_date;
    $('pontDailyCombo').value = menu.price ?? 0;
    $('pontDailyState').value = String(!copy && menu.published);
    $('pontDailyCancel').hidden = false;
  }
  updateDailyButton();
  setEditorOpen(true);
  if (menu) $('pontDailyDate').focus();
  await load();
  if (menu && version === draftVersion) {
    restoreMenuDishes(menu);
    choices();
  }
}
async function refresh() {
  options();
  await load();
}
function changeRestaurant(event, message) {
  const value = event.target.value;
  $('pontDailyRestaurant').value = value;
  $('pontDishRestaurant').value = value;
  draftVersion++;
  savedChoices.clear();
  selected.clear();
  resetDish();
  $(message).textContent = '';
  load().catch(error => { $(message).textContent = error.message; });
}
host.onclick = () => {
  const open = wrap.hidden;
  setEditorOpen(open);
  if (open) refresh().catch(error => { $('pontDailyError').textContent = error.message; });
};
$('pontDailyCancel').onclick = () => {
  resetDaily();
  choices();
  setEditorOpen(false);
  host.focus();
};
$('pontDailyState').onchange = updateDailyButton;
$('pontDailyDishes').onchange = event => {
  const checkbox = event.target.closest('[data-select]');
  if (!checkbox) return;
  const key = checkbox.dataset.select;
  const dish = menuChoices().find(([candidate]) => candidate === key)?.[1];
  if (!dish) return;
  if (checkbox.checked) selected.set(key, {
    ...(dish.id ? {id:dish.id} : {}), category:dish.category, name:dish.name, description:dish.description || '', available:dish.available !== false,
    price:dish.category === 'dessert' ? 0 : Number(dish.price),
    photo_url:dish.photo_url ?? photoUrl(dish)
  });
  else selected.delete(key);
  choices();
  [...$('pontDailyDishes').querySelectorAll('[data-select]')].find(input => input.dataset.select === key)?.focus({preventScroll:true});
};
$('pontDailyDishes').oninput = event => {
  const input = event.target.closest('[data-price]');
  const dish = input && selected.get(input.dataset.price);
  if (dish) dish.price = input.valueAsNumber;
};

form.onsubmit = event => {
  event.preventDefault();
  const items = [...selected.values()];
  const restaurant = rid(), date = $('pontDailyDate').value;
  const published = $('pontDailyState').value === 'true';
  const price = $('pontDailyCombo').valueAsNumber;
  $('pontDailyError').textContent = '';
  if (!restaurant || !items.length) {
    $('pontDailyError').textContent = restaurant ? 'Selectează cel puțin un preparat.' : 'Alege un restaurant.';
    return;
  }
  if (items.some(item => !Number.isFinite(item.price) || item.price < 0 || item.price > 10000 || Math.abs(item.price * 100 - Math.round(item.price * 100)) > .00001)) {
    $('pontDailyError').textContent = 'Verifică prețurile preparatelor selectate.';
    return;
  }
  pendingMenu = {
    id:editingMenu, restaurant, date, price, published, items,
    description:menuDescription
  };
  $('pontDishConfirmTitle').textContent = published ? 'Confirmă publicarea' : 'Confirmă ciorna';
  const restaurantName = getRestaurants().find(item => item.id === restaurant)?.name ?? '';
  $('pontDishRecap').innerHTML = '<p><strong>Meniul zilei</strong> · ' + esc(date.split('-').reverse().join('.')) + '</p>' +
    (restaurantName ? '<p>' + esc(restaurantName) + '</p>' : '') +
    groups.map(([key,name]) => {
      const chosen = items.filter(item => item.category === key);
      return chosen.length ? '<div class="pont-dish-recap"><strong>' + name + '</strong>' + chosen.map(item =>
        '<div>' + esc(item.name) + ' · ' + (key === 'dessert' ? 'inclus' : priceRO.format(item.price) + ' lei') + '</div>').join('') + '</div>' : '';
    }).join('') + '<p>Preț meniu complet · ' + priceRO.format(price) + ' lei</p>';
  $('pontDishConfirmError').textContent = '';
  $('pontDishPublish').textContent = published ? 'Publică' : 'Salvează ciorna';
  dialog.showModal();
};
$('pontDishBack').onclick = () => dialog.close();
dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
$('pontDishPublish').onclick = async () => {
  if (saving || !pendingMenu) return;
  const {id, restaurant, date, price, published, items, description} = pendingMenu;
  const button = $('pontDishPublish');
  saving = true;
  button.disabled = true;
  $('pontDishBack').disabled = true;
  button.textContent = 'Se salvează…';
  $('pontDishConfirmError').textContent = '';
  try {
    if (published) {
      const {data,error} = await db.rpc('pont_restaurant_month_paid', {p_restaurant_id:restaurant, p_service_date:date});
      if (error) throw error;
      if (!data) throw Error('Restaurantul nu este autorizat pentru luna selectată. Poți salva meniul ca ciornă.');
    }
    const first = items.find(item => item.category === 'first');
    const second = items.find(item => item.category === 'second');
    const dessert = items.find(item => item.category === 'dessert');
    const values = {
      restaurant_id:restaurant, service_date:date, title:'Meniul zilei', price, description, published,
      first_course:first?.name || '', first_price:first?.price ?? null,
      second_course:second?.name || '', second_price:second?.price ?? null,
      dessert:dessert?.name || '', dish_selection:items.map(item => ({...item, available:(dishes.find(dish => dish.id === item.id)?.available ?? item.available) !== false}))
    };
    const {error} = await (id ? db.from('menus').update(values).eq('id', id) : db.from('menus').insert(values));
    if (error?.code === '23505') throw Error('Există deja un meniu publicat pentru această zi. Editează meniul existent sau salvează o ciornă.');
    if (error) throw error;
    pendingMenu = null;
    dialog.close();
    resetDaily();
    choices();
    setEditorOpen(false);
    const message = published ? 'Meniul zilei a fost publicat pentru ' : 'Ciorna a fost salvată pentru ';
    $('menuSuccessMessage').textContent = message + date.split('-').reverse().join('.') + '.';
    try {
      await refreshMenus();
    } catch {
      $('menuSuccessMessage').textContent += ' Reîncarcă pagina pentru a actualiza lista.';
    }
    $('menuSuccessDialog').showModal();
  } catch (error) {
    $('pontDishConfirmError').textContent = error.message;
  } finally {
    saving = false;
    button.disabled = false;
    $('pontDishBack').disabled = false;
    button.textContent = published ? 'Publică' : 'Salvează ciorna';
  }
};

$('pontDishRestaurant').onchange = event => changeRestaurant(event, 'pontDishMessage');
$('pontDailyRestaurant').onchange = event => changeRestaurant(event, 'pontDailyError');
$('pontDishPhoto').onchange = renderDishPhoto;
$('pontDishCategory').onchange = syncDishPrice;
$('pontDishCancel').onclick = () => {
  resetDish();
  if (!isRestaurantAdmin) {
    dishEditor.hidden = true;
    $('pontDishNew').focus();
  }
};
$('pontDishNew').onclick = () => {
  resetDish();
  dishListMessage.textContent = '';
  dishEditor.hidden = false;
  $('pontDishName').focus();
};
$('pontDishForm').onsubmit = async event => {
  event.preventDefault();
  const button = $('pontDishSave');
  if (button.disabled) return;
  const file = $('pontDishPhoto').files[0], draft = editingDish;
  const dishCategory = $('pontDishCategory').value;
  const values = {
    restaurant_id: rid(),
    category: dishCategory,
    name: $('pontDishName').value.trim(),
    description: $('pontDishDescription').value.trim(),
    price: dishCategory === 'dessert' ? 0 : $('pontDishPrice').valueAsNumber,
    photo_path: draft?.photo_path || null
  };
  if (!values.restaurant_id) {
    $('pontDishMessage').textContent = 'Alege un restaurant.';
    return;
  }
  if (!values.name || !Number.isFinite(values.price) || values.price < 0) return;
  if (file && (file.size > 2097152 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
    $('pontDishMessage').textContent = 'Fotografia trebuie să fie JPG, PNG sau WebP, maximum 2 MB.';
    return;
  }
  button.disabled = true;
  try {
    if (file) {
      const extension = {'image/png':'png', 'image/webp':'webp', 'image/jpeg':'jpg'}[file.type];
      values.photo_path = values.restaurant_id + '/' + crypto.randomUUID() + '.' + extension;
      const {error} = await db.storage.from('pont-dish-images').upload(values.photo_path, file, {contentType:file.type});
      if (error) throw error;
    }
    const {error} = draft ? await db.from('pont_dishes').update(values).eq('id', draft.id) : await db.from('pont_dishes').insert(values);
    if (error) throw error;
    if (rid() === values.restaurant_id) {
      if (editingDish === draft) {
        category = values.category;
        resetDish();
        if (!isRestaurantAdmin) {
          dishEditor.hidden = true;
          $('pontDishNew').focus();
        }
      }
      await load();
      dishListMessage.textContent = 'Preparatul a fost salvat.';
    }
  } catch (error) {
    $('pontDishMessage').textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
$('pontDishList').onclick = async event => {
  const toggle = event.target.closest('[data-availability]');
  if (toggle) {
    const item = dishes.find(d => d.id === toggle.dataset.availability);
    if (!item || toggle.disabled) return;
    const desired = toggle.dataset.available === 'true';
    if ((item.available !== false) === desired) return;
    const group = toggle.closest('.pont-availability');
    group.querySelectorAll('button').forEach(button => {button.disabled = true});
    try {
      const {error} = await db.from('pont_dishes').update({available:desired}).eq('id',item.id).eq('restaurant_id',item.restaurant_id);
      if(error)throw error;
      await load();
      dishListMessage.textContent = desired ? 'Preparatul este disponibil pentru comandă.' : 'Preparatul este epuizat și nu mai poate fi comandat.';
    } catch(err) {
      dishListMessage.textContent = err.message;
      group.querySelectorAll('button').forEach(button => {button.disabled = false});
    }
    return;
  }
  const edit = event.target.closest('[data-edit-dish]');
  const del = event.target.closest('[data-delete-dish]');
  const dish = dishes.find(d => d.id === (edit?.dataset.editDish || del?.dataset.deleteDish));
  if (!dish) return;
  if (edit) {
    resetDish();
    editingDish = dish;
    $('pontDishName').value = dish.name;
    $('pontDishPrice').value = dish.category === 'dessert' ? '' : dish.price;
    $('pontDishDescription').value = dish.description || '';
    $('pontDishCategory').value = dish.category;
    syncDishPrice();
    $('pontDishFormTitle').textContent = 'Editare preparat';
    $('pontDishSave').textContent = 'Salvează modificările';
    $('pontDishCancel').hidden = false;
    renderDishPhoto();
    dishListMessage.textContent = '';
    dishEditor.hidden = false;
    $('pontDishName').focus();
  }
  if (del && confirm('Ștergi preparatul ' + dish.name + '? Meniurile deja publicate nu vor fi afectate.')) {
    const {error} = await db.from('pont_dishes').delete().eq('id', dish.id);
    if (error) {
      dishListMessage.textContent = error.message;
      return;
    }
    if (editingDish?.id === dish.id) resetDish();
    selected.delete(dish.id);
    try {
      await load();
      if (!isRestaurantAdmin) dishListMessage.textContent = 'Preparatul a fost șters.';
    } catch (error) {
      dishListMessage.textContent = error.message;
    }
  }
};
resetDaily();
return {refresh, open, activate:open};
}
