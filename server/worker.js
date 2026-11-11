// Deploy separately: npx wrangler deploy --config server/wrangler.jsonc
export default {
 async fetch(request, env) {
  const origin = request.headers.get('Origin');
  const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':env.ALLOWED_ORIGIN || '', 'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if (!env.ALLOWED_ORIGIN || origin!==env.ALLOWED_ORIGIN) return reply(403,{ok:false});
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  if(request.method!=='POST') return reply(405,{ok:false});
  if(!env.TURNSTILE_SECRET_KEY || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return reply(503,{ok:false,error:'Integration is not configured'});
  if(Number(request.headers.get('Content-Length'))>12000) return reply(413,{ok:false});
  try {
   const raw=await request.text();if(raw.length>12000)return reply(413,{ok:false});
   const data=JSON.parse(raw);
   if(data.website || !data.consent || typeof data.name!=='string' || data.name.trim().length<2 || data.name.length>80 || typeof data.phone!=='string' || !/^[+\d ()-]{10,24}$/.test(data.phone) || !/^\d{10,15}$/.test(data.phone.replace(/\D/g,'')) || typeof data.token!=='string' || data.token.length>2048 || !Number.isFinite(data.startedAt) || Date.now()-data.startedAt<2500 || Date.now()-data.startedAt>86400000 || (data.comment && (typeof data.comment!=='string'||data.comment.length>1500))) return reply(400,{ok:false});
   const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:data.token,remoteip:request.headers.get('CF-Connecting-IP')||''}),signal:AbortSignal.timeout(8000)});
   const check=await verification.json();
   if(!check.success || check.hostname!==new URL(env.ALLOWED_ORIGIN).hostname)return reply(403,{ok:false});
   const details=data.details&&typeof data.details==='object'?data.details:{};
   const clean=(value)=>String(value??'не указано').slice(0,400);
   const message=`Новая заявка — Чистый Дом\nИмя: ${data.name.trim()}\nТелефон: ${data.phone}\nУслуга: ${clean(details.service)}\nОбъём: ${clean(details.amount)} ${clean(details.unit)}\nКомнаты: ${clean(details.rooms)}\nДата: ${clean(details.date||'согласовать')}\nДополнения: ${clean(Array.isArray(details.extras)?details.extras.join(', '):'нет')}\nПредварительный расчёт клиента (проверить): ${clean(details.estimate)} ₽\nКомментарий: ${data.comment||'нет'}\nСогласие: получено ${new Date().toISOString()}`;
   const response=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:message}),signal:AbortSignal.timeout(10000)});
   const result=await response.json();
   return response.ok&&result.ok?reply(200,{ok:true}):reply(502,{ok:false});
  }catch{return reply(502,{ok:false});}
 }
};
