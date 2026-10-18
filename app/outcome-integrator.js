/* Expert Sync Automatic Outcome Integration — Stage 56 */
(function(){
const KEY="esaActivityOutcomesV1",ACTIVE="esaActiveAdaptiveActivityV1",SYNC="esaOutcomeSyncV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function clamp(n){return Math.max(0,Math.min(100,Number(n)||0))}
function active(){return read(ACTIVE,null)}
function recordFromResult(result){
 const a=active();if(!a||!result)return null;
 const score=clamp(result.score??result.accuracy??result.percentage);
 const attempts=Math.max(1,Number(result.attempts??result.questions??result.total)||1);
 const correct=Math.max(0,Number(result.correct??result.correctAnswers??Math.round(attempts*score/100))||0);
 const outcomes=read(KEY,[]);
 const signature=a.startedAt+"|"+score+"|"+attempts+"|"+correct;
 if(outcomes.some(x=>x.signature===signature))return outcomes[outcomes.length-1];
 const o={...a,completedAt:new Date().toISOString(),score,attempts,correct,evidence:"activity_result",signature};
 outcomes.push(o);save(KEY,outcomes.slice(-100));localStorage.removeItem(ACTIVE);
 return o;
}
function sync(result){
 const o=recordFromResult(result);if(o){save(SYNC,{lastSync:new Date().toISOString(),score:o.score,type:o.type,title:o.title});window.dispatchEvent(new CustomEvent("esa:activity-outcome",{detail:o}))}return o;
}
function status(){return read(SYNC,{lastSync:null})}
window.ESAOutcomeIntegrator={recordFromResult,sync,status};
})();