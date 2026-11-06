// Cloudflare Access JWT verification, enforced for every administrator API request.
const decode=s=>{const a=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(a.padEnd(Math.ceil(a.length/4)*4,"=")),c=>c.charCodeAt(0))};
const obj=s=>JSON.parse(new TextDecoder().decode(decode(s)));
export async function accessEmail(request,env){
 const token=request.headers.get("Cf-Access-Jwt-Assertion");
 if(!token||!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)return null;
 try{
  const [h,p,s,...extra]=token.split(".");
  if(extra.length||!s)return null;
  const header=obj(h),claims=obj(p);
  if(header.alg!=="RS256"||!header.kid||!Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUD))return null;
  const issuer="https://"+env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,"").replace(/\/$/,"");
  if(claims.iss!==issuer||!claims.exp||claims.exp<=Date.now()/1000||!claims.email)return null;
  const response=await fetch(issuer+"/cdn-cgi/access/certs");
  if(!response.ok)return null;
  const keys=(await response.json()).keys||[];
  const jwk=keys.find(k=>k.kid===header.kid&&k.kty==="RSA");
  if(!jwk)return null;
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(s),new TextEncoder().encode(h+"."+p));
  return valid?String(claims.email).toLowerCase():null;
 }catch{return null}
}
