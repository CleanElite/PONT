// PONT: library of reusable restaurant dishes and daily menu selector.
export function initPontDishEditor({db, getRestaurants, refreshMenus, isRestaurantAdmin = false}) {
const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups = [['first','Felul 1','bowl-food'], ['second','Felul 2','fork-knife'], ['dessert','Desert','cake']];
const todayRO = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Bucharest', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const priceRO = new Intl.NumberFormat('ro-RO', {minimumFractionDigits:2, maximumFractionDigits:2});
const host = $('toggleMenuForm'), wrap = $('menuFormWrap'), old = $('menuForm'), catalog = $('dishLibrary');
if (!host || !wrap || !old || !catalog) return;

let dishes = [], selected = new Map(), category = 'first', dailyCategory = 'first';
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
          <label>Preț (lei)<input id="pontDishPrice" type="number" min="0" max="10000" step=".01" required></label>
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

const dishEditor = catalog.querySelector('.admin-dish-editor');
const dishFormMessage = $('pontDishMessage');
let dishListMessage = dishFormMessage;
if (!isRestaurantAdmin) {
  const library = $('pontDishList').closest('section');
  const filters = catalog.querySelector('.admin-library-grid aside');
  const layout = filters.parentElement;
  const results = document.createElement('div');
  results.className = 'dashboard-catalog-main';
  filters.querySelector('.admin-panel-head').after($('pontDishRestaurant').closest('label'));
  results.append(dishEditor, library);
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
  <div class="pont-dish-grid">
    <label>Restaurant<select id="pontDailyRestaurant" required></select></label>
    <label>Data<input id="pontDailyDate" type="date" required></label>
    <label>Titlu<input id="pontDailyTitle" maxlength="120" value="Meniul zilei" required></label>
    <label>Preț meniu complet (lei)<input id="pontDailyCombo" type="number" min="0" step=".01" value="0" required></label>
    <label>Stare<select id="pontDailyState"><option value="true">Publică</option><option value="false">Salvează ciorna</option></select></label>
  </div>
  <div class="admin-daily-grid">
    <div>
      <h4>Categorii</h4>
      <div id="pontDailyTabs" class="admin-categories" aria-label="Categorii din meniul zilei"></div>
    </div>
    <div class="admin-daily-selection">
      <h4>Preparate pentru meniul zilei</h4>
      <div id="pontDailyDishes"></div>
    </div>
  </div>
  <p>Activează preparatele dorite. Prețurile ajustate aici se aplică doar meniului acestei zile.</p>
  <p id="pontDailyError" class="pont-dish-error" role="alert"></p>
  <div class="pont-dish-actions">
    <button id="pontDailyNext" type="submit" class="primary">Publică</button>
    <button id="pontDailyClassic" type="button">Formular clasic</button>
  </div>
`;
wrap.insertBefore(form, old);
old.hidden = true;

const dialog = document.createElement('dialog');
dialog.id = 'pontDishConfirm';
dialog.setAttribute('aria-labelledby', 'pontDishConfirmTitle');
dialog.innerHTML = '<h3 id="pontDishConfirmTitle">Verifică meniul</h3><div id="pontDishRecap"></div><p id="pontDishConfirmError" class="pont-dish-error" role="alert"></p><div class="pont-dish-actions"><button type="button" id="pontDishBack">Înapoi</button><button type="button" class="primary" id="pontDishPublish">Publică</button></div>';
document.body.append(dialog);

const rid = () => $('pontDailyRestaurant').value || $('restaurant').value;
const photoUrl = dish => dish?.photo_path ? db.storage.from('pont-dish-images').getPublicUrl(dish.photo_path).data.publicUrl : '';
function pic(dish) {
  const url = photoUrl(dish);
  return url ? '<img loading="lazy" alt="" src="' + esc(url) + '">' : '<span class="pont-dish-placeholder">' + icon('camera') + '</span>';
}
function options() {
  const restaurants = getRestaurants() || [];
  const before = rid();
  const value = restaurants.some(r => r.id === before) ? before : restaurants[0]?.id || '';
  for (const picker of [$('pontDailyRestaurant'), $('pontDishRestaurant')]) {
    picker.innerHTML = restaurants.map(r => '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>').join('');
    picker.value = value;
    picker.disabled = restaurants.length <= 1;
    picker.closest('label').hidden = isRestaurantAdmin && restaurants.length === 1;
  }
  if (before !== value) {
    selected.clear();
    resetDish();
  }
}
function tabs(id, active, onSelect) {
  $(id).innerHTML = groups.map(([key, name, glyph]) =>
    '<button type="button" data-category="' + key + '" aria-pressed="' + (key === active) + '">' +
    icon(glyph) + '<span>' + name + '</span><span class="admin-category-count">' +
    dishes.filter(d => d.category === key).length + '</span></button>'
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
    if (!editingDish) $('pontDishCategory').value = next;
    library();
  });
  const list = dishes.filter(d => d.category === category);
  const count = list.length === 1 ? '1 preparat' : list.length + ' preparate';
  $('pontDishListTitle').textContent = groups.find(([key]) => key === category)[1] + ' · ' + count;
  $('pontDishList').innerHTML = list.length ? list.map(dish =>
    '<div class="pont-dish-line">' + pic(dish) +
      '<span class="name"><strong>' + esc(dish.name) + '</strong>' +
      (dish.description ? '<small>' + esc(dish.description) + '</small>' : '') + '</span>' +
      '<span class="pont-dish-price">' + priceRO.format(dish.price) + ' lei</span>' +
      '<button type="button" data-availability="' + esc(dish.id) + '" aria-pressed="' + String(dish.available !== false) + '" title="Modifică disponibilitatea">' + (dish.available === false ? 'Epuizat · Reactivează' : 'Disponibil · Marchează epuizat') + '</button>' +
      '<div class="admin-row-actions"><button type="button" data-edit-dish="' + esc(dish.id) + '" aria-label="Editează ' + esc(dish.name) + '" title="Editează">' + icon('pencil-simple') + '</button>' +
      '<button type="button" class="admin-danger" data-delete-dish="' + esc(dish.id) + '" aria-label="Șterge ' + esc(dish.name) + '" title="Șterge">' + icon('trash') + '</button></div></div>'
  ).join('') : '<p>Nu există preparate salvate în această categorie.</p>';
}
function choices() {
  tabs('pontDailyTabs', dailyCategory, next => { dailyCategory = next; choices(); });
  const list = dishes.filter(d => d.category === dailyCategory);
  $('pontDailyDishes').innerHTML = list.length ? list.map(dish => {
    const chosen = selected.get(dish.id);
    return '<div class="pont-dish-line">' + pic(dish) + '<span class="name"><strong>' + esc(dish.name) + '</strong>' +
      (dish.description ? '<small>' + esc(dish.description) + '</small>' : '') + '</span>' +
      '<input type="checkbox" role="switch" aria-label="Include ' + esc(dish.name) + ' în meniul zilei" data-select="' + esc(dish.id) + '" ' + (chosen ? 'checked' : '') + '>' +
      '<input type="number" aria-label="Preț ' + esc(dish.name) + '" data-price="' + esc(dish.id) + '" min="0" step=".01" value="' + esc(chosen?.price ?? dish.price) + '"></div>';
  }).join('') : '<p>Adaugă preparate din această categorie în bibliotecă.</p>';
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
function resetDish() {
  editingDish = null;
  $('pontDishForm').reset();
  $('pontDishCategory').value = category;
  $('pontDishFormTitle').textContent = 'Adaugă preparat';
  $('pontDishSave').textContent = 'Adaugă preparat';
  $('pontDishCancel').hidden = isRestaurantAdmin;
  $('pontDishCancel').textContent = isRestaurantAdmin ? 'Anulează editarea' : 'Anulează';
  dishFormMessage.textContent = '';
  renderDishPhoto();
}
async function activate(menu = null) {
  const before = rid();
  options();
  editingMenu = menu?.id || null;
  selected.clear();
  if (menu) {
    $('pontDailyRestaurant').value = menu.restaurant_id;
    $('pontDishRestaurant').value = menu.restaurant_id;
    $('pontDailyDate').value = menu.service_date;
    $('pontDailyTitle').value = menu.title;
    $('pontDailyCombo').value = menu.price ?? 0;
    $('pontDailyState').value = String(menu.published);
    for (const dish of menu.dish_selection || []) {
      if (dish.id) selected.set(dish.id, {...dish});
    }
  } else {
    $('pontDailyDate').value = todayRO();
    $('pontDailyTitle').value = 'Meniul zilei';
    $('pontDailyCombo').value = '0';
    $('pontDailyState').value = 'true';
  }
  if (before !== rid()) resetDish();
  $('pontDailyError').textContent = '';
  form.hidden = false;
  old.hidden = true;
  await load();
  $('pontDailyNext').textContent = $('pontDailyState').value === 'true' ? 'Publică' : 'Salvează ciorna';
}
function changeRestaurant(event, message) {
  const value = event.target.value;
  $('pontDailyRestaurant').value = value;
  $('pontDishRestaurant').value = value;
  selected.clear();
  resetDish();
  $(message).textContent = '';
  load().catch(error => { $(message).textContent = error.message; });
}
$('pontDishRestaurant').onchange = event => changeRestaurant(event, 'pontDishMessage');
$('pontDailyRestaurant').onchange = event => changeRestaurant(event, 'pontDailyError');
$('pontDishPhoto').onchange = renderDishPhoto;
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
  const values = {
    restaurant_id: rid(),
    category: $('pontDishCategory').value,
    name: $('pontDishName').value.trim(),
    description: $('pontDishDescription').value.trim(),
    price: Number($('pontDishPrice').value),
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
    toggle.disabled = true;
    try {const {error} = await db.from('pont_dishes').update({available:item.available === false}).eq('id',item.id).eq('restaurant_id',item.restaurant_id); if(error)throw error; await load(); dishListMessage.textContent='Disponibilitatea a fost actualizată și în meniurile publicate.';}
    catch(err){dishListMessage.textContent=err.message;toggle.disabled=false;}
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
    $('pontDishPrice').value = dish.price;
    $('pontDishDescription').value = dish.description || '';
    $('pontDishCategory').value = dish.category;
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
$('pontDailyDishes').onchange=e=>{const checkbox=e.target.closest('[data-select]'),price=e.target.closest('[data-price]');if(checkbox){const d=dishes.find(d=>d.id===checkbox.dataset.select);if(!d)return;if(checkbox.checked){selected.set(d.id,{id:d.id,category:d.category,name:d.name,description:d.description||'',price:Number($('pontDailyDishes').querySelector('[data-price="'+d.id+'"]').value),available:d.available !== false,photo_url:d.photo_path?db.storage.from('pont-dish-images').getPublicUrl(d.photo_path).data.publicUrl:''})}else selected.delete(d.id)}if(price&&selected.has(price.dataset.price)){selected.get(price.dataset.price).price=Number(price.value)}};
$('pontDailyState').onchange=()=>{$('pontDailyNext').textContent=$('pontDailyState').value==='true'?'Publică':'Salvează ciorna'};
const libraryButton = document.createElement('button');
libraryButton.type = 'button';
libraryButton.textContent = 'Alege din biblioteca de preparate';
libraryButton.onclick = () => { old.hidden = true; form.hidden = false; };
old.prepend(libraryButton);
$('pontDailyClassic').onclick = () => { form.hidden = true; old.hidden = false; };
document.addEventListener('click',e=>{const b=e.target.closest('[data-edit],[data-copy]');if(!b||!b.closest('#menus,#menuRows'))return;const item=(window.pontAllMenus?.()||[]).find(m=>m.id===(b.dataset.edit||b.dataset.copy));if(!item)return;if(item.dish_selection?.length){e.stopImmediatePropagation();e.preventDefault();if(isRestaurantAdmin)$('showAdd')?.click();const copy=b.dataset.copy?{...item,id:null,service_date:todayRO(),published:false}:item;activate(copy).catch(err=>$('pontDailyError').textContent=err.message);wrap.hidden=false;host.setAttribute('aria-expanded','true');wrap.scrollIntoView({behavior:'smooth'})}else if(b.dataset.edit){form.hidden=true;old.hidden=false}},true);
form.onsubmit=e=>{e.preventDefault();const items=[...selected.values()];try{if(!items.length)throw Error('Activează cel puțin un preparat.');if(!form.reportValidity())return;if(items.some(i=>!Number.isFinite(i.price)||i.price<0||i.price>10000))throw Error('Verifică prețurile preparatelor.');const date=$('pontDailyDate').value.split('-').reverse().join('.');$('pontDishConfirmTitle').textContent=$('pontDailyState').value==='true'?'Confirmă publicarea':'Confirmă ciorna';$('pontDishRecap').innerHTML='<p><strong>'+esc($('pontDailyTitle').value)+'</strong> · '+esc(date)+'</p>'+groups.map(([cat,n])=>{const x=items.filter(i=>i.category===cat);return x.length?'<div class="pont-dish-recap"><strong>'+n+'</strong>'+x.map(i=>'<div>'+esc(i.name)+' — '+esc(i.price)+' lei</div>').join('')+'</div>':''}).join('')+'<p>Preț meniu complet: '+esc($('pontDailyCombo').value)+' lei</p>';$('pontDishConfirmError').textContent='';$('pontDishPublish').textContent=$('pontDailyState').value==='true'?'Publică':'Salvează ciorna';dialog.showModal()}catch(err){$('pontDailyError').textContent=err.message}};
$('pontDishBack').onclick=()=>dialog.close();
$('pontDishPublish').onclick=async()=>{if(saving)return;saving=true;const button=$('pontDishPublish');button.disabled=true;button.textContent='Se salvează…';try{const items=[...selected.values()].map(item=>({...item,available:dishes.find(d=>d.id===item.id)?.available !== false})),restaurant_id=rid(),date=$('pontDailyDate').value,published=$('pontDailyState').value==='true';if(published){const {data,error}=await db.rpc('pont_restaurant_month_paid',{p_restaurant_id:restaurant_id,p_service_date:date});if(error)throw error;if(!data)throw Error('Restaurantul nu este autorizat PONT pentru această lună. Poți salva meniul ca ciornă.')}const first=items.find(i=>i.category==='first'),second=items.find(i=>i.category==='second'),dessert=items.find(i=>i.category==='dessert');const values={restaurant_id,service_date:date,title:$('pontDailyTitle').value.trim(),price:Number($('pontDailyCombo').value),description:'',published,first_course:first?.name||'',first_price:first?.price??null,second_course:second?.name||'',second_price:second?.price??null,dessert:dessert?.name||'',dish_selection:items};const {error}=editingMenu?await db.from('menus').update(values).eq('id',editingMenu):await db.from('menus').insert(values);if(error){if(error.code==='23505')throw Error('Există deja un meniu publicat pentru această zi. Editează meniul existent sau salvează o ciornă.');throw error;}dialog.close();editingMenu=null;selected.clear();
if(!isRestaurantAdmin){
 $('pontDailyDate').value=todayRO();
 $('pontDailyTitle').value='Meniul zilei';
 $('pontDailyCombo').value='0';
 $('pontDailyState').value='true';
 choices();
}
await refreshMenus();wrap.hidden=true;host.setAttribute('aria-expanded','false');$('menuSuccessMessage').textContent=published?'Felicitări! Meniul zilei din data de '+date.split('-').reverse().join('.')+' a fost postat!':'Ciorna meniului zilei din data de '+date.split('-').reverse().join('.')+' a fost salvată!';$('menuSuccessDialog').showModal()}catch(err){$('pontDishConfirmError').textContent=err.message}finally{saving=false;button.disabled=false;button.textContent=$('pontDailyState').value==='true'?'Publică':'Salvează ciorna'}};
// Authentication / restaurant list is loaded asynchronously by the parent app.
return {refresh:async()=>{options();if(!$('pontDailyDate').value){$('pontDailyDate').value=todayRO();$('pontDailyTitle').value='Meniul zilei';$('pontDailyCombo').value='0'}await load()},activate};
}
