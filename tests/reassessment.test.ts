import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse,priorityTone,scoped,filterItems} from '../src/engine';
import {posts,personas} from '../src/data';
import {importArchive,contentCategory} from '../src/imports';
import {reportModel} from '../src/report';
import type {ProfileState} from '../src/types';
const p:ProfileState={industry:'technology',occupation:'Software Developer',platforms:personas[2].platforms,decisions:{},checklist:[],scan:0,events:[],lastScan:null,frequency:'Manual only',cvStart:'2022',linkedStart:'2021',name:'Test'};
test('same field, different responsibilities reassess underlying safety content',()=>{
const post=posts.find(x=>x.category==='safety')!;
assert.equal(analyse(post,'technology',{},'Software Developer').priority,'Low priority');
assert.equal(analyse(post,'technology',{},'Civil Engineer').priority,'Medium priority');
assert.match(analyse(post,'technology',{},'Civil Engineer').explanation,/physical work/);
assert.equal(analyse(post,'technology',{status:'Dismissed',priority:'High priority'},'Civil Engineer').priority,'High priority');
assert.equal(priorityTone('High priority','Dismissed'),'neutral');
});
test('imports validate whole document, preserve source, and never flag opinions',()=>{
const archive={type:'OrderedCollection',orderedItems:[{type:'Create',object:{type:'Note',id:'https://social.example/users/a/statuses/1',published:'2026-01-01',content:'<p>access code: 1234</p>',to:['https://www.w3.org/ns/activitystreams#Public']}}]};
const result=importArchive(archive,'alex');assert.equal(result[0].source,'imported');assert.equal(result[0].category,'confidentiality');assert.equal(result[0].visibility,'Public');
assert.equal(contentCategory('I support a political party and practise my religion.'),'ordinary');
assert.throws(()=>importArchive({...archive,orderedItems:[{type:'Create',object:{type:'Note'}}]},'alex'));
assert.equal(scoped([...posts,...result],'alex',{...p,source:'imported'}).length,1);
assert.equal(scoped(posts,'alex',{...p,source:'connected'}).length,0);
});
test('reports use identical active filters and current career without resetting decisions',()=>{
const profile={...p,industry:'education',occupation:'Graduate Teacher',platforms:personas[0].platforms,decisions:{'alex-0':{status:'Reviewed' as const}}};
const filters=new URLSearchParams('platform=Facebook&priority=High+priority');
const filtered=filterItems(scoped(posts,'alex',profile),profile,filters);
const report=reportModel(filtered,profile,filters,'2026-11-17T00:00:00Z');
assert.equal(report.count,filtered.length);assert.equal(report.career,'Graduate Teacher');assert.equal(report.resolved,1);assert.equal(profile.decisions['alex-0'].status,'Reviewed');assert.match(report.scope,/platform/);assert.match(report.limitations,/fictional/);
});
