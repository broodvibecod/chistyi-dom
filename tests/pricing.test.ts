import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../src/pricing.ts';
test('area, minimum and selected extras',()=>{assert.equal(calculate('regular',50,[]).total,3500);assert.equal(calculate('regular',10,[]).total,2800);assert.equal(calculate('deep',50,['oven','fridge']).total,8500)});
test('windows and upholstery use units',()=>{assert.equal(calculate('windows',4,[]).total,2000);assert.equal(calculate('sofa',3,[]).total,3600)});
test('unknown extras cannot add arbitrary prices',()=>{assert.equal(calculate('regular',50,['unknown','oven','oven']).total,4300)});
test('invalid input rejected',()=>{assert.throws(()=>calculate('missing',50,[]));assert.throws(()=>calculate('regular',NaN,[]));assert.throws(()=>calculate('regular',-1,[]))});
