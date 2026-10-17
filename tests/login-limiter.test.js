import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoginLimiter} from '../src/login-limiter.js';
test('login cooldown blocks after five failures, expires, and clears on success',()=>{
 const values=new Map();let time=1000;
 const limiter=createLoginLimiter({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},()=>time);
 for(let i=0;i<4;i++){limiter.fail();assert.doesNotThrow(()=>limiter.check());}
 limiter.fail();assert.throws(()=>limiter.check(),/60 seconds/);
 time+=60000;assert.doesNotThrow(()=>limiter.check());
 limiter.clear();assert.equal(values.size,0);
});
