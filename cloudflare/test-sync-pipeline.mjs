import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,statement} from './src/sync-pipeline.js';
const seller={session_id:'7697565117730999048',channel_username:'@shopkhangbaby',title:'LIVE thật',started_at:'2026-10-17T09:24:00Z',ended_at:'2026-10-17T12:33:00Z',gross_gmv_vnd:1500000,canceled_refunded_vnd:0,sold_units:15,net_units:15,source_updated_at:'2026-10-18T01:00:00Z'};
const fakeDb={prepare:sql=>({bind:(...params)=>({sql,params})})};
test('chỉ 2 kênh chính thức',()=>{
 assert.equal(normalize('seller',seller).channel_username,'shopkhangbaby');
 assert.throws(()=>normalize('seller',{...seller,channel_username:'affiliate_d'}),/Chỉ đồng bộ/);
});
test('net GMV không âm, không vượt gross',()=>{
 const row=normalize('seller',{...seller,canceled_refunded_vnd:500000});
 assert.equal(row.net_gmv_vnd,1000000);
 assert.throws(()=>normalize('seller',{...seller,net_gmv_vnd:2000000}),/vượt/);
});
test('upsert LIVE dùng đúng khóa session_id và timestamp',()=>{
 const stmt=statement(fakeDb,'seller',normalize('seller',seller));
 assert.match(stmt.sql,/ON CONFLICT\(session_id\) DO UPDATE/);
 assert.match(stmt.sql,/excluded.source_updated_at>=live_sessions.source_updated_at/);
 assert.equal(stmt.params[0],seller.session_id);
});
test('upsert Ads theo advertiser+campaign+date',()=>{
 const row=normalize('ads',{advertiser_id:'a',campaign_id:'b',campaign_name:'Test',report_date:'2026-10-18',spend_vnd:100,attributed_revenue_vnd:700,impressions:5000,clicks:10,orders:1});
 assert.match(statement(fakeDb,'ads',row).sql,/ON CONFLICT\(advertiser_id,campaign_id,report_date\)/);
});
test('orders không ghi đè bản ghi mới bởi timestamp cũ',()=>{
 const row=normalize('orders',{order_id:'order1',channel_username:'mekhangsua',order_status:'paid',gross_amount_vnd:1000,refunded_amount_vnd:0,last_source_update:'2026-10-18T01:00:00Z'});
 assert.match(statement(fakeDb,'orders',row).sql,/excluded.last_source_update >= order_reconciliations.last_source_update/);
});
