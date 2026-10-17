import { test } from "node:test";
import assert from "node:assert/strict";
import { allPublishedListings } from "../src/listing-pagination.js";
test("map fetches every public listing page and deduplicates overlapping records", async () => {
  const calls=[];
  const result=await allPublishedListings(async cursor=>{
    calls.push(cursor);
    return cursor === null ? {items:[{id:"one"}],cursor:"next",more:true} : {items:[{id:"one"},{id:"two"}],more:false};
  });
  assert.deepEqual(calls,[null,"next"]);
  assert.deepEqual(result.map(p=>p.id),["one","two"]);
});
test("map rejects a broken pagination cursor instead of looping", async () => {
  await assert.rejects(allPublishedListings(async()=>({items:[],more:true,cursor:null})),/retry/);
});
test("map does not report a partial result after a failed page", async () => {
  await assert.rejects(allPublishedListings(async cursor=>{
    if(cursor) throw Error("offline");
    return {items:[{id:"one"}],cursor:"next",more:true};
  }),/offline/);
});
