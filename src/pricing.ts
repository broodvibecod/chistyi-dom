import { services, extras } from './config.ts';
export function calculate(serviceId: string, amount: number, selected: string[]) {
 const service = services.find(s=>s.id===serviceId);
 if(!service || !Number.isFinite(amount) || amount<=0) throw new Error('Некорректные параметры');
 const base = Math.max(service.minimum, Math.round(amount * service.rate));
 const additional = extras.filter(e=>selected.includes(e.id)).reduce((sum,e)=>sum+e.price,0);
 return {base,additional,total:base+additional};
}
