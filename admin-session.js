export function createPontAdminSession(db,{onExpired=()=>location.replace('../login/')}={}){
const KEY='pont_admin_session_v1',LIMIT=7200000;let timer=null,expiring=false;
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
const clear=()=>{try{localStorage.removeItem(KEY)}catch(_){}};
const write=uid=>{localStorage.setItem(KEY,JSON.stringify({uid,started:Date.now()}))};
const remaining=uid=>{const x=read();return x?.uid===uid&&Number.isFinite(x.started)?Math.max(0,x.started+LIMIT-Date.now()):0};
async function logout(){if(timer)clearTimeout(timer);clear();const {error}=await db.auth.signOut({scope:'local'});if(error)throw error}
async function expire(){if(expiring)return false;expiring=true;try{await logout()}catch(_){clear()}finally{onExpired()}return false}
function schedule(uid){if(timer)clearTimeout(timer);const ms=remaining(uid);if(ms<=0){void expire();return}timer=setTimeout(()=>{void check()},Math.min(ms,2147483647))}
async function getUser(){const {data,error}=await db.auth.getUser();return error?null:data?.user||null}
async function check(){const user=await getUser();if(!user){clear();return false}if(!remaining(user.id))return expire();schedule(user.id);return true}
async function resume(){const user=await getUser();if(!user){clear();return false}if(!read())write(user.id);return check()}
async function markLogin(){const user=await getUser();if(!user)throw Error('Autentificarea nu a putut fi verificată.');write(user.id);schedule(user.id)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check()});
window.addEventListener('focus',()=>{void check()});
window.addEventListener('storage',e=>{if(e.key===KEY)void check()});
return {resume,markLogin,check,logout,remaining};
}