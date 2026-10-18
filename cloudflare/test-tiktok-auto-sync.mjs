import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signGet,mapLiveSession,sellerRefresh,pullSellerLives} from './src/tiktok-auto-sync.js';

test('HMAC signed query is deterministic and sensitive to app secret',async()=>{
 const a=await signGet('/analytics/202509/shop_lives/performance',{app_key:'abc',timestamp:'123',page_size:'10'},'example');
 const b=await signGet('/analytics/202509/shop_lives/performance',{page_size:'10',timestamp:'123',app_key:'abc'},'example');
 assert.equal(a,b);assert.match(a,/^[0-9a-f]{64}$/);
 assert.notEqual(a,await signGet('/analytics/202509/shop_lives/performance',{app_key:'abc',timestamp:'123',page_size:'10'},'changed'));
});
test('reject GMV that cannot be verified as integral VND or wrong channel',()=>{
 const base={live_room_id:'123',channel_username:'shopkhangbaby',start_time:1760000000,gmv:{currency:'VND',amount:'320000'},items_sold:8};
 assert.equal(mapLiveSession(base,'shopkhangbaby').gross_gmv_vnd,320000);
 assert.equal(mapLiveSession({...base,channel_username:'random'},'shopkhangbaby'),null);
 assert.equal(mapLiveSession({...base,gmv:{currency:'USD',amount:'5'}},'shopkhangbaby'),null);
 assert.equal(mapLiveSession({...base,items_sold:null},'shopkhangbaby'),null);
});
test('refresh fails closed without credentials; no outbound call',async()=>{
 let calls=0;const fetcher=()=>{calls++;throw Error('unexpected')};
 assert.equal((await sellerRefresh({},'shopkhangbaby',{fetcher})).reason,'not_configured');
 assert.equal((await sellerRefresh({},'not-approved',{fetcher})).reason,'unknown_channel');
 assert.equal((await pullSellerLives({},'shopkhangbaby',{fetcher})).status,'not_configured');
 assert.equal(calls,0);
});
