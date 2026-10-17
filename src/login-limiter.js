// This device-only cooldown improves retry UX; Firebase must enforce server-side abuse limits.
export function createLoginLimiter(storage, now = Date.now) {
 const key='dormpath-login-retries';
 const read=()=>{try{return JSON.parse(storage.getItem(key)) || {count:0,until:0};}catch{return {count:0,until:0};}};
 const save=v=>{try{storage.setItem(key,JSON.stringify(v));}catch{}};
 return {
  check(){const s=read(); if(s.until>now()) throw Error(`Too many attempts. Try again in ${Math.ceil((s.until-now())/1000)} seconds.`);},
  fail(){let s=read();if(s.until && s.until<=now())s={count:0,until:0};s.count++;if(s.count>=5)s.until=now()+60000;save(s);},
  clear(){try{storage.removeItem(key);}catch{}}
 };
}
