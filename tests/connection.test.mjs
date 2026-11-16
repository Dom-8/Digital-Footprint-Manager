import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHandler} from '../api/connection.mjs';
const env={APP_ORIGIN:'https://app.example',MASTODON_BASE_URL:'https://social.example',MASTODON_CLIENT_ID:'client',MASTODON_CLIENT_SECRET:'secret',SESSION_ENCRYPTION_KEY:'a'.repeat(40),UPSTASH_REDIS_REST_URL:'https://redis.example',UPSTASH_REDIS_REST_TOKEN:'redis-secret'};
function harness(){
const values=new Map(),calls=[];let limited=false,revokeFails=false;
const request=async(url,init={})=>{
calls.push({url:String(url),...init});
if(String(url)==='https://redis.example'){
const [cmd,key,value]=JSON.parse(init.body);let result;
if(cmd==='SET'){values.set(key,value);result='OK';}
if(cmd==='GET')result=values.get(key)||null;
if(cmd==='GETDEL'){result=values.get(key)||null;values.delete(key);}
if(cmd==='DEL'){values.delete(key);result=1;}
return Response.json({result});
}
const u=new URL(url);
if(u.pathname.includes('.well-known'))return Response.json({code_challenge_methods_supported:['S256']});
if(u.pathname==='/oauth/token')return Response.json({access_token:'never-send-to-browser',scope:'read:accounts read:statuses'});
if(u.pathname.includes('verify_credentials'))return Response.json({id:'123',acct:'person'});
if(u.pathname==='/oauth/revoke')return new Response('',{status:revokeFails?500:200});
if(limited)return Response.json({error:'rate limited'},{status:429,headers:{'Retry-After':'30'}});
return Response.json([{id:'55',account:{id:'123'},content:'<p>hello</p>',created_at:'2026-01-01',visibility:'public',url:'https://social.example/@person/55'},{id:'56',account:{id:'999'},content:'other account',created_at:'2026-01-01'}],{headers:{Link:'<https://social.example/api/v1/accounts/123/statuses?max_id=50>; rel="next"'}});
};
const handler=createHandler({env,request});
const run=async(action,headers={},method='GET')=>{const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(body){this.body=body||'';}};await handler({url:'/api/connection?action='+action,headers,method},res);return res;};
return {run,values,calls,limit(){limited=true;},failRevoke(){revokeFails=true;}};
}
async function authorise(h){
const start=await h.run('start');assert.equal(start.statusCode,303);
const oauthCookie=start.headers['set-cookie'].split(';')[0],u=new URL(start.headers.location);
assert.equal(u.searchParams.get('code_challenge_method'),'S256');assert.equal(u.searchParams.get('scope'),'read:accounts read:statuses');
const cb=await h.run('callback&state='+u.searchParams.get('state')+'&code=code',{cookie:oauthCookie});assert.equal(cb.statusCode,303);
const tokenCall=h.calls.find(x=>new URL(x.url).pathname==='/oauth/token');const verifier=new URLSearchParams(tokenCall.body).get('code_verifier');
assert.equal(createHash('sha256').update(verifier).digest('base64url'),u.searchParams.get('code_challenge'));
return {cookie:cb.headers['set-cookie'][1].split(';')[0],oauthCookie,state:u.searchParams.get('state')};
}
test('unconfigured connection is accurately unavailable',async()=>{
const handler=createHandler({env:{},request:()=>{throw Error('must not call');}});let body;const res={setHeader(){},end(v){body=JSON.parse(v);}};await handler({url:'/?action=status',method:'GET',headers:{}},res);assert.equal(body.configured,false);assert.ok(body.missing.includes('MASTODON_CLIENT_ID'));
});
test('mock OAuth, PKCE, encrypted storage, pagination, rate limit, CSRF and disconnect',async()=>{
const h=harness(),s=await authorise(h);assert.ok([...h.values.values()].every(v=>!v.includes('never-send-to-browser')));
const headers={cookie:s.cookie};const status=await h.run('status',headers);assert.equal(JSON.parse(status.body).connected,true);assert.ok(!status.body.includes('never-send-to-browser'));
const page=await h.run('posts',headers);assert.equal(JSON.parse(page.body).next,'50');assert.equal(JSON.parse(page.body).posts.length,1);
await h.run('posts&cursor=50',headers);assert.ok(h.calls.some(x=>x.url.includes('max_id=50')));
assert.equal((await h.run('posts&cursor=https://evil.example',headers)).statusCode,400);
h.limit();const limited=await h.run('posts',headers);assert.equal(limited.statusCode,429);assert.equal(JSON.parse(limited.body).retryAfter,30);
assert.equal((await h.run('disconnect',{...headers,origin:'https://evil.example','x-dfm-request':'1'},'POST')).statusCode,403);
h.failRevoke();const disconnected=await h.run('disconnect',{...headers,origin:env.APP_ORIGIN,'x-dfm-request':'1'},'POST');assert.equal(disconnected.statusCode,200);assert.ok(JSON.parse(disconnected.body).warning);assert.equal(h.values.size,0);assert.equal((await h.run('posts',headers)).statusCode,401);
});
test('tampered state and reused callbacks cannot create sessions',async()=>{
const h=harness(),start=await h.run('start'),cookie=start.headers['set-cookie'].split(';')[0];
assert.equal((await h.run('callback&state=wrong&code=x',{cookie})).statusCode,400);
assert.equal((await h.run('callback&state=wrong&code=x',{cookie})).statusCode,400);assert.equal(h.values.size,0);
});
