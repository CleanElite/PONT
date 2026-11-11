// PONT: library of reusable restaurant dishes and daily menu selector.
import {renderDishChecklist} from './menu-templates.js?v=7';
export function initPontDishEditor({db, getRestaurants, refreshMenus, isRestaurantAdmin = false}) {
const $ = id => document.getElementById(id);
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups = [['first','Felul 1','bowl-food'], ['second','Felul 2','fork-knife'], ['dessert','Desert','cake']];
const todayRO = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Bucharest', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const priceRO = new Intl.NumberFormat('ro-RO', {minimumFractionDigits:2, maximumFractionDigits:2});
const host = $('toggleMenuForm'), wrap = $('menuFormWrap'), catalog = $('dishLibrary');
if (!host || !wrap || !catalog) return;

const photoValidationMessage = 'Fotografia trebuie să fie JPG, PNG sau WebP, maximum 2 MB.';
const selected = new Map(), savedChoices = new Map();
let dishes = [], category = 'first';
let editorVersion = 0, menuDescription = '', pendingMenu = null, savingModel = false;
let editingDish = null, editingMenu = null, loadedRid = '', loadVersion = 0, saving = false, previewURL = '', dishPhotoRemoved = false;
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
        <div class="admin-dish-editor-fields pont-dish-photo-price-layout">
          <div class="admin-dish-photo-field">
            <label class="admin-dish-photo">
              <img id="pontDishPreview" alt="" hidden>
              <span class="admin-dish-photo-empty" id="pontDishPhotoEmpty">${icon('camera')}Adaugă fotografie</span>
              <span class="admin-dish-photo-edit" id="pontDishPhotoEdit" hidden>${icon('camera')}</span>
              <input type="file" id="pontDishPhoto" aria-label="Fotografie preparat" aria-describedby="pontDishPhotoHelp" accept="image/jpeg,image/png,image/webp">
            </label>
            <small id="pontDishPhotoHelp">JPG, PNG sau WebP · max. 2 MB</small>
            <button type="button" id="pontDishRemovePhoto" hidden>Elimină poza</button>
          </div>
          <div class="pont-dish-grid">
            <label id="pontDishPriceField">Preț (lei)<input id="pontDishPrice" type="number" min="0" max="10000" step=".01" required></label>
            <label>Categorie<select id="pontDishCategory">${groups.map(([key, name]) => '<option value="' + key + '">' + name + '</option>').join('')}</select></label>
          </div>
        </div>
        <div class="admin-dish-details pont-dish-description">
          <label>Nume preparat<input id="pontDishName" required minlength="2" maxlength="120"></label>
          <label>Descriere (opțional)<textarea id="pontDishDescription" maxlength="500" rows="3"></textarea></label>
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

const compactDishLayoutStyle=document.createElement('style');
compactDishLayoutStyle.textContent=`
#pontDishForm .pont-dish-photo-price-layout{
  display:grid;
  grid-template-columns:116px minmax(0,1fr);
  gap:12px;
  align-items:start;
}
#pontDishForm .pont-dish-photo-price-layout .admin-dish-photo-field{width:116px;min-width:0}
#pontDishForm .pont-dish-photo-price-layout .admin-dish-photo{
  width:116px;height:116px;max-width:100%;aspect-ratio:1;
  border-radius:13px;
}
#pontDishForm .pont-dish-photo-price-layout .admin-dish-photo-empty{font-size:11px;gap:5px}
#pontDishForm .pont-dish-photo-price-layout .admin-dish-photo-field>small{font-size:10px;line-height:1.25;margin:5px 0 0}
#pontDishForm .pont-dish-photo-price-layout .pont-dish-grid{
  display:grid;
  grid-template-columns:minmax(0,1fr);
  grid-template-rows:repeat(2, 1fr);
  gap:9px;
  height:116px;
  margin:0;
  padding:0;
  border:0;
  min-width:0;
}
#pontDishForm .pont-dish-photo-price-layout .pont-dish-grid>label{
  display:grid;grid-template-columns:90px minmax(0,1fr);
  align-items:center;gap:8px;
  padding:6px 10px;
  min-width:0;
  background:rgba(8,50,43,.65);
  border:1px solid rgba(126,176,157,.38);
  border-radius:12px;
  color:#d9f1e6;
  font-size:12px;font-weight:650;
}
#pontDishForm .pont-dish-photo-price-layout .pont-dish-grid :is(input,select){
  width:100%;min-width:0;
  min-height:38px;height:38px;
  margin:0!important;
  padding:7px 9px;
  border-radius:9px;
  font-size:14px;
}
#pontDishForm .pont-dish-description{margin-top:15px;display:grid;grid-template-columns:minmax(0,1fr);gap:11px}
#pontDishForm .pont-dish-description label{margin:0}
#pontDishForm .pont-dish-description :is(input,textarea){margin-top:6px}
@media(max-width:520px){
 #pontDishForm .pont-dish-photo-price-layout{grid-template-columns:100px minmax(0,1fr);gap:9px}
 #pontDishForm .pont-dish-photo-price-layout .admin-dish-photo-field{width:100px}
 #pontDishForm .pont-dish-photo-price-layout .admin-dish-photo{width:100px;height:100px}
 #pontDishForm .pont-dish-photo-price-layout .pont-dish-grid{height:100px;gap:6px}
 #pontDishForm .pont-dish-photo-price-layout .pont-dish-grid>label{
   grid-template-columns:minmax(0,1fr);
   gap:2px;padding:4px 8px;font-size:11px;
 }
 #pontDishForm .pont-dish-photo-price-layout .pont-dish-grid :is(input,select){
   height:27px;min-height:27px;padding:2px 8px;font-size:14px;
 }
}
`;
document.head.append(compactDishLayoutStyle);

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
  <div id="pontDailyOverview">
    <div class="pont-daily-fields">
      <label id="pontDailyRestaurantField">Restaurant<select id="pontDailyRestaurant" required></select></label>
      <label>Data<input id="pontDailyDate" type="date" required></label>
      <div class="pont-daily-standard-price" role="status"><strong id="pontDailyComboDisplay">Preț nesetat</strong><input id="pontDailyCombo" type="hidden"></div>
    </div>
    <div id="pontDailyDishes" class="pont-daily-course-cards" aria-label="Alege preparatele pentru fiecare fel"></div>
    <section id="pontDailySummary" class="pont-daily-summary" aria-labelledby="pontDailySummaryTitle">
      <h3 id="pontDailySummaryTitle">Rezumatul meniului</h3>
      <div id="pontDailySummaryList"></div>
    </section>
    <p id="pontDailyError" class="pont-dish-error" role="alert"></p>
    <div class="pont-dish-actions">
      <button id="pontDailyCancel" type="button">Anulează</button>
      <button id="pontDailySaveModel" type="button" class="pont-daily-save-model">Salvează ca model</button>
      <button id="pontDailyNext" type="submit" class="primary">Publică</button>
    </div>
  </div>
  <dialog id="pontDailyPicker" class="pont-daily-picker" aria-labelledby="pontDailyPickerTitle">
    <div class="pont-daily-picker-head">
      <h3 id="pontDailyPickerTitle">Felul 1</h3>
    </div>
    <p class="pont-daily-picker-hint">Bifează preparatele dorite pentru această categorie.</p>
    <div id="pontDailyPickerList" class="pont-daily-picker-list"></div>
    <div class="pont-daily-picker-footer">
      <button type="button" id="pontDailyPickerBack" class="pont-daily-picker-back">← Înapoi fără modificări</button>
      <button type="button" class="primary" id="pontDailyPickerConfirm">Confirmă selecția</button>
    </div>
  </dialog>
`;
wrap.append(form);
// Move the category picker out of the publishing form so it can open above the page.
const pickerDialog = $('pontDailyPicker');
document.body.append(pickerDialog);

const standardPriceStyles=document.createElement('style');
standardPriceStyles.textContent='.pont-daily-fields .pont-daily-standard-price{display:flex;align-items:center;justify-content:center;align-self:end;flex:0 1 132px;min-width:0;min-height:40px;height:40px;padding:6px 10px;border:1px solid #447b78;border-radius:9px;background:#0d3438;box-sizing:border-box}.pont-daily-standard-price strong{font-size:13px;line-height:1.2;font-weight:700;color:#ffe5a0;text-align:center;white-space:nowrap}.pont-daily-standard-price strong.is-missing{color:#ffb6a5}@media(max-width:620px){.pont-daily-fields .pont-daily-standard-price{width:100%;flex:auto;padding:6px 5px}.pont-daily-standard-price strong{font-size:12px}}';
document.head.append(standardPriceStyles);



const wizardStyles = document.createElement('style');
wizardStyles.textContent = "\n/* C23: three clean category buttons and independent recap; dedicated picker view. */\n#pontDailyBuilder #pontDailyOverview[hidden],#pontDailyBuilder #pontDailyPicker[hidden]{display:none!important}\n#pontDailyBuilder .pont-daily-course-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:17px 0 14px}\n#pontDailyBuilder .pont-daily-course-open{display:grid;place-items:center;min-width:0;width:100%;min-height:55px;margin:0;padding:12px 5px;text-align:center;font:700 clamp(13px,2.5vw,16px)/1.2 system-ui,sans-serif;border:1px solid #6b9990;border-radius:12px;background:linear-gradient(145deg,#16494a,#0b3036);color:#f5fcf8;box-shadow:inset 0 1px #ffffff18;cursor:pointer}\n#pontDailyBuilder .pont-daily-course-open:active{background:#23645e}\n#pontDailyBuilder .pont-daily-summary{padding:15px 16px;border:1px solid #4c7b74;border-radius:14px;background:#0a2e31}\n#pontDailyBuilder .pont-daily-summary h3{font:700 15px system-ui,sans-serif;margin:0 0 12px;color:#e8eee9}\n#pontDailyBuilder .pont-daily-summary-group{padding:9px 0;border-top:1px solid #ffffff20}\n#pontDailyBuilder .pont-daily-summary-group:first-child{border-top:0;padding-top:0}\n#pontDailyBuilder .pont-daily-summary-group:last-child{padding-bottom:0}\n#pontDailyBuilder .pont-daily-summary-group-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px}\n#pontDailyBuilder .pont-daily-summary-group-head strong{font:700 13px system-ui,sans-serif;color:#e1d3ad}\n#pontDailyBuilder .pont-daily-summary-group-head button{padding:3px 8px;min-height:27px;margin:0;font:600 11px system-ui,sans-serif;color:#b9e4dd;background:transparent;border:1px solid #557970;border-radius:7px}\n#pontDailyBuilder .pont-daily-selected-list{display:grid;gap:5px;margin:0;padding-left:22px;font-size:13px;color:#e4f2ed}\n#pontDailyBuilder .pont-daily-selected-list li{line-height:1.4;padding-left:2px}\n#pontDailyBuilder .pont-daily-selected-list li::marker{color:#d9bd7b}\n#pontDailyBuilder .pont-daily-selected-list li button{float:right;display:inline-grid;place-items:center;width:23px;min-width:23px;height:23px;min-height:23px;padding:0;margin:-1px 0 0 7px;border:1px solid #63877f;border-radius:7px;background:#112f33;color:#f3c8be;font-size:18px;line-height:1}\n#pontDailyBuilder .pont-daily-selected-list li::after{content:\"\";display:block;clear:both}\n#pontDailyBuilder .pont-daily-none{margin:0;color:#9cb8b9;font-size:12px}\n#pontDailyBuilder .pont-daily-picker{margin:0;min-width:0;border:1px solid #50847d;border-radius:15px;background:#0a2a2d;overflow:hidden}\n#pontDailyBuilder .pont-daily-picker-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 14px;border-bottom:1px solid #3c6d68;background:#123b3d}\n#pontDailyBuilder .pont-daily-picker-head h3{margin:0;text-align:left;font:750 clamp(17px,3vw,21px)/1.2 system-ui,sans-serif;color:#f4f7f0}\n#pontDailyBuilder .pont-daily-picker-head button{flex:none;margin:0;min-height:38px;padding:8px 12px;font:700 12px system-ui,sans-serif}\n#pontDailyBuilder .pont-daily-picker-hint{margin:11px 14px;color:#a9d1c8;font-size:12px;line-height:1.4}\n#pontDailyBuilder .pont-daily-picker-list{display:grid;gap:0;max-height:min(60dvh,620px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 13px 8px}\n#pontDailyBuilder .pont-daily-picker-row{display:grid;grid-template-columns:minmax(0,1fr) auto 24px;align-items:center;gap:9px;padding:12px 0;border-bottom:1px solid #ffffff1b;min-width:0}\n#pontDailyBuilder .pont-daily-picker-name{font-size:13px;line-height:1.3;overflow-wrap:break-word;min-width:0}\n#pontDailyBuilder .pont-daily-picker-row small{font-size:11px;color:#b9d2c9;white-space:nowrap;text-align:right}\n#pontDailyBuilder .pont-daily-picker-price{display:flex;align-items:center;gap:3px;font-size:11px;margin:0;white-space:nowrap}\n#pontDailyBuilder .pont-daily-picker-price input{width:54px;min-width:0;margin:0;padding:6px 3px;height:32px;min-height:32px;text-align:center;font-size:12px}\n#pontDailyBuilder .pont-daily-picker-row input[type=checkbox]{appearance:auto;-webkit-appearance:checkbox;width:21px;height:21px;min-width:21px;min-height:21px;margin:0;accent-color:#d6ba78;cursor:pointer}\n#pontDailyBuilder .pont-daily-picker-row:has(input:disabled){opacity:.52}\n#pontDailyBuilder .pont-daily-picker-back{display:block;margin:10px 13px 15px;min-height:36px;padding:8px 12px;font:600 12px system-ui,sans-serif;color:#c6dfd6;background:transparent;border:1px solid #496e69;border-radius:9px}\n@media(max-width:430px){#pontDailyBuilder .pont-daily-course-cards{gap:6px}#pontDailyBuilder .pont-daily-course-open{min-height:49px;font-size:13px;padding:9px 2px}#pontDailyBuilder .pont-daily-summary{padding:12px}#pontDailyBuilder .pont-daily-picker-head{padding:12px 9px;gap:7px}#pontDailyBuilder .pont-daily-picker-head button{font-size:11px;padding:8px 7px}#pontDailyBuilder .pont-daily-picker-list{padding-inline:9px}#pontDailyBuilder .pont-daily-picker-row{gap:5px}#pontDailyBuilder .pont-daily-picker-name{font-size:12px}}\n";
document.head.append(wizardStyles);
const pickerModalStyles=document.createElement('style');
pickerModalStyles.textContent="\n/* C24 — independent category dialog over the unchanged publishing page. */\n#pontDailyPicker.pont-daily-picker {\n  position:fixed;\n  inset:0;\n  box-sizing:border-box;\n  width:min(580px,calc(100vw - 24px));\n  max-width:calc(100vw - 24px);\n  max-height:min(85dvh,760px);\n  margin:auto;\n  padding:0;\n  overflow:hidden;\n  border:1px solid #6da398;\n  border-radius:19px;\n  background:#0b292e;\n  color:#f1f9f7;\n  box-shadow:0 24px 90px #000b,0 0 0 1px #a0ebd318;\n}\n#pontDailyPicker::backdrop{background:rgba(0,8,13,.78);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}\n#pontDailyPicker .pont-daily-picker-head {\n  display:flex;align-items:center;justify-content:space-between;gap:12px;\n  padding:16px;border-bottom:1px solid #406b67;background:#14383d;\n}\n#pontDailyPicker .pont-daily-picker-head h3{margin:0;font:750 clamp(17px,4vw,21px)/1.2 system-ui,sans-serif}\n#pontDailyPicker .pont-daily-picker-head button{\n  flex:none;width:auto;min-width:0;min-height:40px;padding:9px 12px;\n  border-radius:10px;background:#9be7d5;border:1px solid #9be7d5;color:#07332d;\n  font:750 12px/1.2 system-ui,sans-serif;\n}\n#pontDailyPicker .pont-daily-picker-hint{margin:12px 15px;color:#b8d3cc;font-size:12px;line-height:1.45}\n#pontDailyPicker .pont-daily-picker-list{\n  display:grid;gap:0;max-height:calc(min(85dvh,760px) - 178px);overflow-y:auto;\n  -webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 14px 8px;\n}\n#pontDailyPicker .pont-daily-picker-row{\n  display:grid;grid-template-columns:minmax(0,1fr) auto 24px;\n  align-items:center;gap:9px;min-width:0;padding:12px 0;border-bottom:1px solid #ffffff20;\n}\n#pontDailyPicker .pont-daily-picker-name{min-width:0;font-size:13px;line-height:1.35;overflow-wrap:break-word}\n#pontDailyPicker .pont-daily-picker-row small{font-size:11px;color:#b9d2c9;white-space:nowrap;text-align:right}\n#pontDailyPicker .pont-daily-picker-price{display:flex;align-items:center;gap:4px;margin:0;color:#e5f1e9;font-size:11px}\n#pontDailyPicker .pont-daily-picker-price input{\n  width:55px;min-width:0;max-width:55px;height:33px;min-height:33px;\n  margin:0;padding:5px 3px;font:13px system-ui,sans-serif;text-align:center;\n  border-radius:8px;background:#123b40;border:1px solid #5f8680;color:#fff;\n}\n#pontDailyPicker .pont-daily-picker-row input[type=checkbox]{\n  appearance:auto;-webkit-appearance:checkbox;width:21px;height:21px;\n  min-width:21px;min-height:21px;margin:0;accent-color:#e5cc91;cursor:pointer;\n}\n#pontDailyPicker .pont-daily-picker-row:has(input:disabled){opacity:.55}\n#pontDailyPicker .pont-daily-picker-back{\n  display:block;width:calc(100% - 28px);min-height:39px;margin:8px 14px 14px;\n  padding:8px 12px;border:1px solid #567973;border-radius:10px;\n  background:#15373c;color:#d1e2df;font:600 12px system-ui,sans-serif;\n}\n@media(max-width:420px){\n  #pontDailyPicker .pont-daily-picker-head{padding:13px 10px;gap:7px}\n  #pontDailyPicker .pont-daily-picker-head button{font-size:11px;padding:9px 8px}\n  #pontDailyPicker .pont-daily-picker-list{padding-inline:10px}\n  #pontDailyPicker .pont-daily-picker-row{gap:6px}\n  #pontDailyPicker .pont-daily-picker-name{font-size:12px}\n}\n\n/* C25 — both actions in a stable bottom footer. */\n#pontDailyPicker.pont-daily-picker:not([open]){display:none!important}\n#pontDailyPicker.pont-daily-picker[open]{display:flex;flex-direction:column}\n#pontDailyPicker .pont-daily-picker-head{flex:none}\n#pontDailyPicker .pont-daily-picker-hint{flex:none}\n#pontDailyPicker .pont-daily-picker-list{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto}\n#pontDailyPicker .pont-daily-picker-footer{\n  flex:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);\n  align-items:stretch;gap:8px;padding:12px 14px max(14px,env(safe-area-inset-bottom));\n  border-top:1px solid #406b67;background:#10343a;\n}\n#pontDailyPicker .pont-daily-picker-footer button{\n  display:flex;align-items:center;justify-content:center;\n  width:100%;min-width:0;min-height:43px;height:auto;margin:0;padding:9px 8px;\n  border-radius:10px;font:700 12px/1.25 system-ui,sans-serif;text-align:center;\n}\n#pontDailyPicker .pont-daily-picker-footer #pontDailyPickerBack{\n  border:1px solid #567973;background:#15373c;color:#d1e2df;\n}\n#pontDailyPicker .pont-daily-picker-footer #pontDailyPickerConfirm{\n  border:1px solid #9be7d5;background:#9be7d5;color:#07332d;\n}\n@media(max-width:420px){\n #pontDailyPicker .pont-daily-picker-footer{gap:6px;padding-inline:10px}\n #pontDailyPicker .pont-daily-picker-footer button{font-size:11px;padding-inline:5px}\n}\n";
document.head.append(pickerModalStyles);

const dialog = document.createElement('dialog');
dialog.id = 'pontDishConfirm';
dialog.setAttribute('aria-labelledby', 'pontDishConfirmTitle');
dialog.innerHTML = '<h3 id="pontDishConfirmTitle">Confirmă publicarea</h3><div id="pontDishRecap"></div><p id="pontDishConfirmError" class="pont-dish-error" role="alert"></p><div class="pont-dish-actions"><button type="button" id="pontDishBack">Înapoi</button><button type="button" class="primary" id="pontDishPublish">Publică</button></div>';
document.body.append(dialog);

const rid = () => $('pontDailyRestaurant').value;
function syncStandardPrice(){
  const configured = getRestaurants()?.find(restaurant => restaurant.id === rid())?.menu_price;
  const value = Number(configured);
  const valid = configured !== null && configured !== undefined && Number.isFinite(value) && value > 0;
  $('pontDailyCombo').value = valid ? String(value) : '';
  $('pontDailyComboDisplay').textContent = valid ? 'Preț setat ' + new Intl.NumberFormat('ro-RO',{maximumFractionDigits:2}).format(value) + ' lei' : 'Preț nesetat';
  $('pontDailyComboDisplay').classList.toggle('is-missing', !valid);
}

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
  syncStandardPrice();
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
  return [...savedChoices, ...dishes.filter(dish => !savedChoices.has(dish.id)).map(dish => [dish.id, dish])];
}
let pickerCategory = null, pickerSnapshot = null;
function renderPicker() {
  const picker = $('pontDailyPicker');
  if (!pickerCategory) return;
  $('pontDailyPickerTitle').textContent = groups.find(([key]) => key === pickerCategory)?.[1] || 'Preparate';
  const entries = menuChoices().filter(([,dish]) => dish.category === pickerCategory);
  $('pontDailyPickerList').innerHTML = entries.length ? entries.map(([key,dish]) => {
    const checked = selected.has(key);
    const price = checked ? selected.get(key).price : dish.price;
    return '<div class="pont-daily-picker-row">' +
      '<span class="pont-daily-picker-name">' + esc(dish.name) + '</span>' +
      (pickerCategory === 'dessert' ? '<small>Inclus</small>' :
        checked ? '<label class="pont-daily-picker-price"><input data-price="' + esc(key) +
          '" aria-label="Preț ' + esc(dish.name) + '" type="number" inputmode="decimal" step=".01" min="0" max="10000" value="' +
          esc(Number.isFinite(price) ? price : '') + '">lei</label>' :
          '<small>' + priceRO.format(Number(dish.price) || 0) + ' lei</small>') +
      '<input type="checkbox" data-select="' + esc(key) + '" value="' + esc(key) +
      '" aria-label="Selectează ' + esc(dish.name) + '" ' + (checked ? 'checked ' : '') +
      (dish.available === false && !checked ? 'disabled ' : '') + '/></div>';
  }).join('') : '<p>Nu există preparate înregistrate la această categorie.</p>';
}
function showPicker(key) {
  if (!groups.some(([course]) => course === key)) return;
  pickerSnapshot = new Map([...selected].filter(([,item]) => item.category === key)
    .map(([id,item]) => [id,{...item}]));
  pickerCategory = key;
  renderPicker();
  if (!pickerDialog.open) pickerDialog.showModal();
  $('pontDailyPickerConfirm').focus({preventScroll:true});
}
function closePicker(confirmed = false) {
  if (!confirmed && pickerSnapshot && pickerCategory) {
    for (const [id,item] of selected) if (item.category === pickerCategory) selected.delete(id);
    for (const [id,item] of pickerSnapshot) selected.set(id,item);
  }
  pickerCategory = null;
  pickerSnapshot = null;
  if (pickerDialog.open) pickerDialog.close();
  choices();
}
function choices() {
  $('pontDailyDishes').innerHTML = groups.map(([key,label]) =>
    '<button type="button" class="pont-daily-course-open" data-open-course="' + key + '">' +
    label + '</button>').join('');
  $('pontDailySummaryList').innerHTML = groups.map(([key,label]) => {
    const items = [...selected.entries()].filter(([,item]) => item.category === key);
    const list = items.length ? '<ol class="pont-daily-selected-list">' + items.map(([id,item]) =>
      '<li><span>' + esc(item.name) + '</span><button type="button" data-unselect="' + esc(id) +
      '" aria-label="Elimină ' + esc(item.name) + '" title="Elimină preparatul">×</button></li>').join('') + '</ol>' :
      '<p class="pont-daily-none">Niciun preparat selectat</p>';
    return '<div class="pont-daily-summary-group"><div class="pont-daily-summary-group-head">' +
      '<strong>' + label + '</strong><button type="button" data-open-course="' + key +
      '" aria-label="Modifică selecția pentru ' + label + '">Modifică</button></div>' + list + '</div>';
  }).join('');
  if (pickerCategory) renderPicker();
  syncSaveModelButton();
}
function dailyOverviewClick(event) {
  const remove = event.target.closest('[data-unselect]');
  if (remove) {
    selected.delete(remove.dataset.unselect);
    resetModelSaved();
    choices();
    return;
  }
  const button = event.target.closest('[data-open-course]');
  if (button) showPicker(button.dataset.openCourse);
}
$('pontDailyDishes').addEventListener('click', dailyOverviewClick);
$('pontDailySummaryList').addEventListener('click', dailyOverviewClick);
$('pontDailyPickerBack').onclick = () => closePicker(false);
$('pontDailyPickerConfirm').onclick = () => { resetModelSaved(); closePicker(true); };
pickerDialog.addEventListener('cancel', event => { event.preventDefault(); closePicker(false); });
pickerDialog.addEventListener('click', event => {
  if (event.target === pickerDialog) closePicker(false);
});
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
  const url = previewURL || (dishPhotoRemoved ? '' : photoUrl(editingDish));
  const image = $('pontDishPreview');
  if (url) image.src = url;
  else image.removeAttribute('src');
  image.hidden = !url;
  $('pontDishPhotoEmpty').hidden = !!url;
  $('pontDishPhotoEdit').hidden = !url;
  $('pontDishRemovePhoto').hidden = !url;
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
  dishPhotoRemoved = false;
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
function canSaveDailyModel() {
  const items = [...selected.values()];
  return items.some(item => item.category === 'first') &&
    items.some(item => item.category === 'second');
}
function syncSaveModelButton() {
  const button = $('pontDailySaveModel');
  if (!button) return;
  button.disabled = savingModel || !canSaveDailyModel() || button.classList.contains('is-saved');
  button.title = canSaveDailyModel() ? '' : 'Selectează minimum un preparat din Felul 1 și unul din Felul 2.';
}
function resetModelSaved() {
  const button = $('pontDailySaveModel');
  if (!button) return;
  button.classList.remove('is-saved');
  button.textContent = 'Salvează ca model';
  syncSaveModelButton();
}
function selectedModelIds() {
  const currentIds = new Set(dishes.map(dish => dish.id));
  const picked = [...selected.values()].map(item => item.id ||
    dishes.find(dish => dish.category === item.category && dish.name === item.name)?.id || '');
  if (picked.some(id => !id || !currentIds.has(id))) return null;
  return [...new Set(picked)].sort();
}
function modelSignature() {
  return rid() + '|' + (selectedModelIds() || []).join(',');
}
function resetDaily() {
  resetModelSaved();
  editorVersion++;
  editingMenu = null;
  menuDescription = '';
  savedChoices.clear();
  selected.clear();
  $('pontDailyDate').value = todayRO();
  pickerCategory = null;
  pickerSnapshot = null;
  if (pickerDialog.open) pickerDialog.close();
  syncStandardPrice();
  $('pontDailyError').textContent = '';
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
async function open(menu, copy = false, {restaurant = menu?.restaurant_id, date = menu?.service_date} = {}) {
  options();
  resetDaily();
  const version = editorVersion;
  if (restaurant && rid() !== restaurant) {
    $('pontDailyRestaurant').value = restaurant;
    $('pontDishRestaurant').value = restaurant;
    resetDish();
  }
  if (!copy && date) $('pontDailyDate').value = date;
  if (menu) {
    editingMenu = copy ? null : menu.id;
    menuDescription = menu.description ?? '';
  }
  syncStandardPrice();
  setEditorOpen(false);
  await load();
  if (version !== editorVersion) return false;
  if (menu) restoreMenuDishes(menu);
  choices();
  setEditorOpen(true);
  if (menu) $('pontDailyDate').focus({preventScroll:true});
  return true;
}
async function refresh() {
  options();
  await load();
}
function changeRestaurant(event, message) {
  resetModelSaved();
  const value = event.target.value;
  $('pontDailyRestaurant').value = value;
  $('pontDishRestaurant').value = value;
  syncStandardPrice();
  editorVersion++;
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
$('pontDailyPickerList').onchange = event => {
  const checkbox = event.target.closest('[data-select]');
  if (!checkbox) return;
  const key = checkbox.value;
  const dish = menuChoices().find(([candidate]) => candidate === key)?.[1];
  if (!dish) return;
  resetModelSaved();
  if (checkbox.checked) selected.set(key, {
    ...(dish.id ? {id:dish.id} : {}), category:dish.category, name:dish.name, description:dish.description || '', available:dish.available !== false,
    price:dish.category === 'dessert' ? 0 : Number(dish.price),
    photo_url:dish.photo_url ?? photoUrl(dish)
  });
  else selected.delete(key);
  choices();
  [...$('pontDailyPickerList').querySelectorAll('[data-select]')].find(input => input.value === key)?.focus({preventScroll:true});
};
$('pontDailyPickerList').oninput = event => {
  const input = event.target.closest('[data-price]');
  const dish = input && selected.get(input.dataset.price);
  if (dish) {
    dish.price = input.valueAsNumber;
    resetModelSaved();
  }
};

$('pontDailySaveModel').onclick = async () => {
  const button = $('pontDailySaveModel');
  if (savingModel || button.classList.contains('is-saved')) return;
  if (!canSaveDailyModel()) {
    syncSaveModelButton();
    return;
  }
  const restaurant = rid(), ids = selectedModelIds();
  $('pontDailyError').textContent = '';
  if (!restaurant) { $('pontDailyError').textContent = 'Alege mai întâi un restaurant.'; return; }
  if (!canSaveDailyModel()) { $('pontDailyError').textContent = 'Selectează minimum un preparat din Felul 1 și unul din Felul 2.'; return; }
  if (!ids || ids.length !== selected.size) {
    $('pontDailyError').textContent = 'Modelul poate conține doar preparate salvate în biblioteca restaurantului.';
    return;
  }
  if (ids.length > 60) { $('pontDailyError').textContent = 'Un model poate conține maximum 60 de preparate.'; return; }
  const signature = modelSignature();
  const stamp = new Intl.DateTimeFormat('ro-RO', {timeZone:'Europe/Bucharest', day:'2-digit',
    month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).format(new Date());
  savingModel = true;
  button.disabled = true;
  button.textContent = 'Se salvează…';
  try {
    const {error} = await db.from('pont_menu_templates').insert({
      restaurant_id:restaurant, name:('Model ' + stamp).slice(0, 80), dish_ids:ids
    });
    if (error) throw error;
    if (signature === modelSignature()) {
      button.classList.add('is-saved');
      button.textContent = '✓ Salvat ca model';
    } else resetModelSaved();
    window.pontMenuModels?.refresh()?.catch(() => {});
  } catch (error) {
    resetModelSaved();
    $('pontDailyError').textContent = 'Modelul nu a fost salvat: ' + error.message;
  } finally {
    savingModel = false;
    syncSaveModelButton();
  }
};

form.onsubmit = event => {
  event.preventDefault();
  const items = [...selected.values()];
  const restaurant = rid(), date = $('pontDailyDate').value;
  syncStandardPrice();
  const price = Number($('pontDailyCombo').value);
  $('pontDailyError').textContent = '';
  if (!Number.isFinite(price) || price <= 0 || price > 10000) {
    $('pontDailyError').textContent = 'Configurează mai întâi prețul standard în Setări restaurant.';
    return;
  }
  if (!restaurant || !items.length) {
    $('pontDailyError').textContent = restaurant ? 'Selectează cel puțin un preparat.' : 'Alege un restaurant.';
    return;
  }
  if (items.some(item => !Number.isFinite(item.price) || item.price < 0 || item.price > 10000 || Math.abs(item.price * 100 - Math.round(item.price * 100)) > .00001)) {
    $('pontDailyError').textContent = 'Verifică prețurile preparatelor selectate.';
    return;
  }
  pendingMenu = {
    id:editingMenu, restaurant, date, price, items,
    description:menuDescription
  };
  const restaurantName = getRestaurants().find(item => item.id === restaurant)?.name ?? '';
  $('pontDishRecap').innerHTML = '<p><strong>Meniul zilei</strong> · ' + esc(date.split('-').reverse().join('.')) + '</p>' +
    (restaurantName ? '<p>' + esc(restaurantName) + '</p>' : '') +
    groups.map(([key,name]) => {
      const chosen = items.filter(item => item.category === key);
      return chosen.length ? '<div class="pont-dish-recap"><strong>' + name + '</strong>' + chosen.map(item =>
        '<div>' + esc(item.name) + ' · ' + (key === 'dessert' ? 'inclus' : priceRO.format(item.price) + ' lei') + '</div>').join('') + '</div>' : '';
    }).join('') + '<p>Preț meniu complet · ' + priceRO.format(price) + ' lei</p>';
  $('pontDishConfirmError').textContent = '';
  dialog.showModal();
};
$('pontDishBack').onclick = () => dialog.close();
dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
$('pontDishPublish').onclick = async () => {
  if (saving || savingModel || !pendingMenu) return;
  const {id, restaurant, date, price, items, description} = pendingMenu;
  const button = $('pontDishPublish');
  saving = true;
  button.disabled = true;
  $('pontDishBack').disabled = true;
  button.textContent = 'Se salvează…';
  $('pontDishConfirmError').textContent = '';
  try {
    const {data, error: authorizationError} = await db.rpc('pont_restaurant_month_paid', {p_restaurant_id:restaurant, p_service_date:date});
    if (authorizationError) throw authorizationError;
    if (!data) throw Error('Restaurantul nu este autorizat să publice meniuri în luna selectată.');
    const first = items.find(item => item.category === 'first');
    const second = items.find(item => item.category === 'second');
    const dessert = items.find(item => item.category === 'dessert');
    const values = {
      restaurant_id:restaurant, service_date:date, title:'Meniul zilei', price, description, published:true,
      first_course:first?.name || '', first_price:first?.price ?? null,
      second_course:second?.name || '', second_price:second?.price ?? null,
      dessert:dessert?.name || '', dish_selection:items.map(item => ({...item, available:(dishes.find(dish => dish.id === item.id)?.available ?? item.available) !== false}))
    };
    const {error} = await (id ? db.from('menus').update(values).eq('id', id) : db.from('menus').insert(values));
    if (error?.code === '23505') throw Error('Există deja un meniu publicat pentru această zi. Editează meniul existent sau alege altă dată.');
    if (error) throw error;
    pendingMenu = null;
    dialog.close();
    resetDaily();
    choices();
    setEditorOpen(false);
    const message = date > todayRO() ? 'Meniul zilei a fost programat pentru ' : 'Meniul zilei a fost publicat pentru ';
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
    button.textContent = 'Publică';
  }
};

$('pontDishRestaurant').onchange = event => changeRestaurant(event, 'pontDishMessage');
$('pontDailyRestaurant').onchange = event => changeRestaurant(event, 'pontDailyError');
$('pontDishPhoto').onchange = renderDishPhoto;
$('pontDishRemovePhoto').onclick = () => {
  const input = $('pontDishPhoto');
  input.value = '';
  dishPhotoRemoved = true;
  if (dishFormMessage.textContent === photoValidationMessage) dishFormMessage.textContent = '';
  renderDishPhoto();
  input.focus();
};
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
    photo_path: dishPhotoRemoved ? null : (draft?.photo_path || null)
  };
  if (!values.restaurant_id) {
    $('pontDishMessage').textContent = 'Alege un restaurant.';
    return;
  }
  if (!values.name || !Number.isFinite(values.price) || values.price < 0) return;
  if (file && (file.size > 2097152 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
    $('pontDishMessage').textContent = photoValidationMessage;
    return;
  }
  button.disabled = true;
  $('pontDishRemovePhoto').disabled = true;
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
    $('pontDishRemovePhoto').disabled = false;
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
