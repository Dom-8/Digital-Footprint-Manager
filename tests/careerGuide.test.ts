import test from 'node:test';import assert from 'node:assert/strict';
import {industries} from '../src/data';import {careerGuide} from '../src/careerGuidance';import {roleExamples} from '../src/roleExamples';
test('every listed role has a specific publication check and custom roles have field context',()=>{
for(const field of industries)for(const role of field.occupations){assert.ok(roleExamples[role],role);const g=careerGuide(role,field.id);assert.equal(g.checks[0].text,roleExamples[role]);assert.equal(g.industry,field.name);assert.ok(g.checks.length<=3);}
const g=careerGuide('Custom marine researcher','engineering');assert.equal(g.industry,'Engineering');assert.ok(g.checks[0].text.length>10);
});
test('software and healthcare guidance use different underlying examples',()=>{assert.match(careerGuide('Software Engineer','technology').checks[0].text,/API keys/);assert.match(careerGuide('Nurse','healthcare').checks[0].text,/patient/);});
