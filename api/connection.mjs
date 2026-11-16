import {randomBytes,createHash,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
export const REQUIRED=['APP_ORIGIN','MASTODON_BASE_URL','MASTODON_CLIENT_ID','MASTODON_CLIENT_SECRET','SESSION_ENCRYPTION_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'];
const SCOPE='read:accounts read:statuses';
const hash=s=>createHash('sha256').update(s).digest('hex');
const random=()=>randomBytes(32).toString('base64url');
function equal(a,b){return typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(v=>v.length===2));}
function cookie(name,value,maxAge){return name+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;}
function issue(status,message,retryAfter){return Object.assign(new Error(message),{status,retryAfter});}
export function createHandler({env=process.env,request=fetch}={}){
function config(){
const missing=REQUIRED.filter(k=>!env[k]);if(missing.length)throw issue(503,'Connection configuration is incomplete.');
for(const key of ['APP_ORIGIN','MASTODON_BASE_URL','UPSTASH_REDIS_REST_URL']){const u=new URL(env[key]);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw issue(503,'Server URLs must be HTTPS origins without paths or credentials.');}
if(env.SESSION_ENCRYPTION_KEY.length<32)throw issue(503,'The session encryption key must be at least 32 characters.');
return {origin:new URL(env.APP_ORIGIN).origin,base:new URL(env.MASTODON_BASE_URL).origin,callback:new URL('/api/connection?action=callback',env.APP_ORIGIN).href};
}
function seal(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',createHash('sha256').update(env.SESSION_ENCRYPTION_KEY).digest(),iv);const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(x=>x.toString('base64url')).join('.');}
function unseal(value){const [iv,tag,data]=value.split('.').map(x=>Buffer.from(x,'base64url'));const d=createDecipheriv('aes-256-gcm',createHash('sha256').update(env.SESSION_ENCRYPTION_KEY).digest(),iv);d.setAuthTag(tag);return JSON.parse(Buffer.concat([d.update(data),d.final()]).toString('utf8'));}
async function fetchSafe(url,init){return request(url,{...init,redirect:'error',signal:AbortSignal.timeout(10000)});}
async function db(...command){const r=await fetchSafe(env.UPSTASH_REDIS_REST_URL,{method:'POST',headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(command)});if(!r.ok)throw issue(503,'Secure session storage is unavailable. Retry later.');const d=await r.json();if(d.error)throw issue(503,'Secure session storage rejected the request.');return d.result;}
async function mastodon(path,init={}){
const c=config();const u=new URL(path,c.base);if(u.origin!==c.base)throw issue(400,'Unexpected API origin.');
const r=await fetchSafe(u.href,init);
if(r.status===429){const reset=Date.parse(r.headers.get('x-ratelimit-reset')||'');const raw=r.headers.get('retry-after');const seconds=raw&&/^\d+$/.test(raw)?Number(raw):Number.isFinite(reset)?Math.max(1,Math.ceil((reset-Date.now())/1000)):60;throw issue(429,'Mastodon rate limit reached. Keep the loaded posts and retry later.',seconds);}
if(!r.ok)throw issue(r.status===401?401:502,r.status===401?'Mastodon authorisation expired or was revoked. Disconnect, then reconnect.':'Mastodon could not complete the request. Check server availability, registered redirect URI and approved scopes.');
return r;
}
async function session(req){const sid=cookies(req)['__Host-dfm-session'];if(!sid||!/^[\w-]{43}$/.test(sid))return null;const value=await db('GET','dfm:session:'+hash(sid));return value?{sid,...unseal(value)}:null;}
return async function handler(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
const send=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
const redirect=location=>{res.statusCode=303;res.setHeader('Location',location);res.end();};
try{
const action=new URL(req.url,'https://internal.invalid').searchParams.get('action')||'status';
if(action==='status'){
if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
const missing=REQUIRED.filter(k=>!env[k]);if(missing.length)return send(200,{configured:false,connected:false,missing});
const c=config(),s=await session(req);return send(200,{configured:true,connected:!!s,instance:c.base,account:s?.account?.acct});
}
const c=config();
if(action==='disconnect'){
if(req.method!=='POST')return send(405,{error:'Use POST to disconnect.'});
if(req.headers.origin!==c.origin||req.headers['x-dfm-request']!=='1')return send(403,{error:'Request origin validation failed.'});
const s=await session(req);let warning;
if(s){try{await mastodon('/oauth/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.MASTODON_CLIENT_ID,client_secret:env.MASTODON_CLIENT_SECRET,token:s.token})});}catch{warning='Local connection deleted, but remote revocation could not be confirmed. Revoke this app in Mastodon Settings → Account → Authorised apps.';}
await db('DEL','dfm:session:'+hash(s.sid));}
res.setHeader('Set-Cookie',cookie('__Host-dfm-session','',0));return send(200,{connected:false,warning});
}
if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
if(action==='start'){
if(await session(req))return send(409,{error:'Disconnect your existing account before authorising another.'});
const browser=random(),state=random(),verifier=random();const metadata=await mastodon('/.well-known/oauth-authorization-server');const meta=await metadata.json();
if(!meta.code_challenge_methods_supported?.includes('S256'))return send(503,{error:'The configured Mastodon server must support PKCE S256 (Mastodon 4.3+).'});
await db('SET','dfm:oauth:'+hash(browser),seal({state,verifier}),'EX',600);
res.setHeader('Set-Cookie',cookie('__Host-dfm-oauth',browser,600));
const u=new URL('/oauth/authorize',c.base);u.search=new URLSearchParams({response_type:'code',client_id:env.MASTODON_CLIENT_ID,redirect_uri:c.callback,scope:SCOPE,state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();return redirect(u.href);
}
if(action==='callback'){
const q=new URL(req.url,c.origin).searchParams,browser=cookies(req)['__Host-dfm-oauth'];
res.setHeader('Set-Cookie',cookie('__Host-dfm-oauth','',0));
if(!browser||!/^[\w-]{43}$/.test(browser))return send(400,{error:'Authorisation session missing or expired. Return to the app and reconnect.'});
const record=await db('GETDEL','dfm:oauth:'+hash(browser));
if(!record)return send(400,{error:'Authorisation request expired or already used. Reconnect from the app.'});
const pending=unseal(record);
if(!equal(pending.state,q.get('state')))return send(400,{error:'Authorisation state validation failed. Reconnect from the app.'});
if(q.get('error'))return redirect(c.origin+'/#/platforms?connection=cancelled');
if(!q.get('code'))return send(400,{error:'Authorisation code missing. Reconnect from the app.'});
const r=await mastodon('/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:env.MASTODON_CLIENT_ID,client_secret:env.MASTODON_CLIENT_SECRET,redirect_uri:c.callback,code:q.get('code'),code_verifier:pending.verifier})});
const token=await r.json();if(typeof token.access_token!=='string')throw issue(502,'The server did not return a valid token.');
const granted=(token.scope||'').split(' ');if(!granted.includes('read')&&!SCOPE.split(' ').every(s=>granted.includes(s)))throw issue(403,'Required read permissions were not granted.');
const a=await mastodon('/api/v1/accounts/verify_credentials',{headers:{Authorization:'Bearer '+token.access_token}});const account=await a.json();
if(!/^\d+$/.test(account.id))throw issue(502,'Invalid account response.');
const sid=random();await db('SET','dfm:session:'+hash(sid),seal({token:token.access_token,account:{id:account.id,acct:account.acct}}),'EX',604800);
res.setHeader('Set-Cookie',[cookie('__Host-dfm-oauth','',0),cookie('__Host-dfm-session',sid,604800)]);return redirect(c.origin+'/#/platforms?connection=success');
}
if(action==='posts'){
const s=await session(req);if(!s)return send(401,{error:'No connected account. Authorise Mastodon first.'});
const cursor=new URL(req.url,c.origin).searchParams.get('cursor');if(cursor&&!/^\d{1,30}$/.test(cursor))return send(400,{error:'Invalid pagination cursor.'});
const path='/api/v1/accounts/'+s.account.id+'/statuses';const u=new URL(path,c.base);u.searchParams.set('limit','40');u.searchParams.set('exclude_reblogs','true');if(cursor)u.searchParams.set('max_id',cursor);
const r=await mastodon(u.href,{headers:{Authorization:'Bearer '+s.token}});const values=await r.json();if(!Array.isArray(values))throw issue(502,'Unexpected post response.');
const link=(r.headers.get('link')||'').split(',').find(x=>/rel="next"/.test(x));let next=null;
if(link){const match=link.match(/<([^>]+)>/);if(match){const n=new URL(match[1]);if(n.origin===c.base&&n.pathname===path&&/^\d{1,30}$/.test(n.searchParams.get('max_id')||''))next=n.searchParams.get('max_id');}}
return send(200,{account:s.account.acct,next,posts:values.filter(x=>!x.reblog&&x.account?.id===s.account.id&&typeof x.content==='string'&&Number.isFinite(Date.parse(x.created_at))).map(x=>({id:x.id,text:x.content,date:x.created_at,visibility:x.visibility,url:x.url}))});
}
return send(404,{error:'Unknown connection action.'});
}catch(e){if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return send(e.status||503,{error:e.status?e.message:'Connection service is unavailable. Retry from Platforms; no demonstration data has been substituted.',retryAfter:e.retryAfter});}
};
}
export default createHandler();
