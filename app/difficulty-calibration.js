/* Expert Sync Personalised Difficulty Calibration — Stage 65 */
(function(){
const KEY="esaDifficultyCalibrationV1";
const ORDER=["foundation","developing","intermediate","advanced"];
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function band(score){return score<40?"foundation":score<65?"developing":score<80?"intermediate":"advanced"}
function calibrate(skill,base){
 const rows=read("esaActivityOutcomesV1",[]).filter(x=>x.type===skill||x.skill===skill).slice(-8);
 const scores=rows.map(x=>clamp(x.score)), avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
 const success=rows.length?rows.reduce((a,x)=>a+(Number(x.correct)>0?1:0),0)/rows.length*100:null;
 const recent=scores.slice(-3), volatility=recent.length>1?clamp(Math.sqrt(recent.reduce((a,x)=>a+Math.pow(x-(recent.reduce((p,q)=>p+q,0)/recent.length),2),0)/recent.length)):0;
 let idx=Math.max(0,ORDER.indexOf(base)),reason="Using evidence-based baseline difficulty.";
 if(avg!==null){
  if(avg>=88&&volatility<15){idx=Math.min(3,idx+1);reason="Recent performance is strong and stable; increase challenge."}
  else if(avg<55||volatility>=25){idx=Math.max(0,idx-1);reason=avg<55?"Recent performance is below target; reduce difficulty for reinforcement.":"Recent performance is variable; stabilise performance before increasing challenge."}
  else if(avg>=75&&success>=70){reason="Performance is on target; maintain challenge and build consistency."}
 }
 return {skill,level:ORDER[idx],average:avg===null?null:Math.round(avg),success:success===null?null:Math.round(success),volatility,attempts:rows.length,reason};
}
function build(){const skills=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"],p=read("esaAdaptivePlanV1",{}),out={updatedAt:new Date().toISOString(),skills:{}};skills.forEach(k=>out.skills[k]=calibrate(k,k===p.focus?(p.difficulty||"developing"):"developing"));out.focus=p.focus||"vocabulary";out.focusCalibration=out.skills[out.focus]||calibrate(out.focus,"developing");localStorage.setItem(KEY,JSON.stringify(out));return out}
function get(){return read(KEY,null)||build()}
function forSkill(skill,base){return calibrate(skill,base||"developing")}
window.ESADifficultyCalibration={build,get,forSkill};
})();