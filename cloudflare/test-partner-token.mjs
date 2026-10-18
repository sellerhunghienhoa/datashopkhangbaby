import assert from 'node:assert/strict';
import {test} from 'node:test';
import {normalizeExpiry,isRefreshDue,encryptToken,decryptToken,refreshPartnerToken,getPartnerTokenStatus} from './src/partner-token.js';
const key=Buffer.alloc(32,9).toString('base64');
class MockDB {
  row=null;
  prepare(query) {
    const execute=(values)=>({
      first:async()=>this.row?{...this.row}:null,
      run:async()=>{
        if(query.includes('INSERT OR IGNORE')){
          if(!this.row)this.row={id:'partner',status:'awaiting_initial_authorization',lease_until:0,failure_count:0};
          return {meta:{changes:1}};
        }
        if(query.includes('SET lease_until=?')){
          if(this.row.lease_until>=values[2])return {meta:{changes:0}};
          this.row.lease_until=values[0];this.row.last_attempt_at=values[1];
          return {meta:{changes:1}};
        }
        if(query.includes('SET\n      access_token_encrypted=')){
          const keys=['access_token_encrypted','refresh_token_encrypted','access_expires_at','refresh_expires_at','open_id','user_type','granted_scopes','last_success_at'];
          for(let i=0;i<keys.length;i++)this.row[keys[i]]=values[i];
          Object.assign(this.row,{status:'active',last_error_code:null,retry_after:null,failure_count:0,lease_until:0});
          return {meta:{changes:1}};
        }
        if(query.includes('SET status=?,last_error_code=')){
          const keys=['status','last_error_code','retry_after','failure_count'];
          for(let i=0;i<keys.length;i++)this.row[keys[i]]=values[i];
          this.row.lease_until=0;
          return {meta:{changes:1}};
        }
        if(query.includes("status='reauthorization_required'"))this.row.status='reauthorization_required';
        if(query.includes("status='awaiting_initial_authorization'"))this.row.lease_until=0;
        return {meta:{changes:1}};
      }
    });
    const q={bind:(...values)=>execute(values),run:()=>execute([]).run(),first:()=>execute([]).first()};
    return q;
  }
}
function makeEnv(){return {DB:new MockDB(),PARTNER_APP_KEY:'app-placeholder',PARTNER_APP_SECRET:'secret-placeholder',PARTNER_INITIAL_REFRESH_TOKEN:'bootstrap-refresh-placeholder',PARTNER_TOKEN_ENCRYPTION_KEY:key};}
test('normalize provider epoch expiration or actual TTL',()=>{
  assert.equal(normalizeExpiry(1820000000,1000),1820000000);
  assert.equal(normalizeExpiry(14400,1000),15400);
  assert.equal(normalizeExpiry(null,1000),null);
});
test('AES GCM encrypted refresh token round trip and no plaintext',async()=>{
  const env=makeEnv();
  const ciphertext=await encryptToken('my-rotating-token',env);
  assert(!ciphertext.includes('my-rotating-token'));
  assert.equal(await decryptToken(ciphertext,env),'my-rotating-token');
});
test('Cron bootstrap, token rotation, skip if not due, then refresh when due',async()=>{
  const env=makeEnv();const expiry=Math.floor(Date.now()/1000)+14400;
  let calls=0;let lastRefresh='';
  const fetcher=async url=>{
    const parsed=new URL(url);
    lastRefresh=parsed.searchParams.get('refresh_token');
    calls++;
    const suffix=calls;
    return {ok:true,json:async()=>({code:0,data:{access_token:'access-'+suffix,refresh_token:'refresh-'+suffix,access_token_expire_in:expiry+suffix*100,refresh_token_expire_in:expiry+90000,user_type:3,open_id:'partner-test',granted_scopes:['partner.authorization.info']}})};
  };
  assert.equal((await refreshPartnerToken(env,{fetcher})).reason,'refreshed');
  assert.equal(lastRefresh,'bootstrap-refresh-placeholder');
  assert.equal(await decryptToken(env.DB.row.refresh_token_encrypted,env),'refresh-1');
  assert.equal((await refreshPartnerToken(env,{fetcher})).reason,'not_due');
  assert.equal(calls,1);
  env.DB.row.access_expires_at=Math.floor(Date.now()/1000)+100;
  assert.equal((await refreshPartnerToken(env,{fetcher})).reason,'refreshed');
  assert.equal(lastRefresh,'refresh-1');
  assert.equal(calls,2);
  const status=await getPartnerTokenStatus(env);
  assert.equal(status.status,'active');
  assert.equal(JSON.stringify(status).includes('refresh-2'),false);
  assert.equal(JSON.stringify(status).includes('secret-placeholder'),false);
});
test('provider failure schedules retry without leaking token',async()=>{
  const env=makeEnv();
  const failer=async()=>({ok:true,json:async()=>({code:1234,message:'secret must not leak'})});
  assert.equal((await refreshPartnerToken(env,{fetcher:failer})).reason,'retry_scheduled');
  const status=await getPartnerTokenStatus(env);
  assert.equal(status.status,'retry_scheduled');
  assert.equal(JSON.stringify(status).includes('secret'),false);
});
test('concurrent refresh lock',async()=>{
  const env=makeEnv();env.DB.row={id:'partner',lease_until:Math.floor(Date.now()/1000)+60,status:'active'};
  assert.equal((await refreshPartnerToken(env)).reason,'already_running');
});
