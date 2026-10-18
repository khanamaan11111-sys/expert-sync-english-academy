/* Expert Sync Real Activity Outcome Tracking — Stage 55 */
(function(){
const KEY="esaActivityOutcomesV1",ACTIVE="esaActiveAdaptiveActivityV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function begin(sessionIndex,type,title){const x={sessionIndex,type,title,startedAt:new Date().toISOString()};save(ACTIVE,x);return x}
function active(){return read(ACTIVE,null)}
function record(outcome){const a=active();if(!a)return null;const o={...a,completedAt:new Date().toISOString(),score:Math.max(0,Math.min(100,Number(outcome?.score)||0)),attempts:Math.max(1,Number(outcome?.attempts)||1),correct:Math.max(0,Number(outcome?.correct)||0),evidence:outcome?.evidence||"self_reported_completion"};const all=read(KEY,[]);all.push(o);save(KEY,all.slice(-100));localStorage.removeItem(ACTIVE);return o}
function forSession(date){return read(KEY,[]).filter(x=>x.date===date||x.sessionIndex===date)}
function history(){return read(KEY,[])}
window.ESAActivityOutcomes={begin,active,record,forSession,history};
})();