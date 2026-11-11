import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore plain Worker module
import worker from '../server/worker.js';
test('rejects foreign origin',async()=>{const r=await worker.fetch(new Request('https://api.example',{method:'POST',headers:{Origin:'https://evil.example'}}),{ALLOWED_ORIGIN:'https://site.example'});assert.equal(r.status,403)});
test('unconfigured integration does not return false success',async()=>{const r=await worker.fetch(new Request('https://api.example',{method:'POST',headers:{Origin:'https://site.example'}}),{ALLOWED_ORIGIN:'https://site.example'});assert.equal(r.status,503)});
test('spam is rejected before delivery',async()=>{const r=await worker.fetch(new Request('https://api.example',{method:'POST',headers:{Origin:'https://site.example'},body:JSON.stringify({website:'spam'})}),{ALLOWED_ORIGIN:'https://site.example',TURNSTILE_SECRET_KEY:'test',TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'test'});assert.equal(r.status,400)});
