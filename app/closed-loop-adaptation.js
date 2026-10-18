/* Expert Sync Closed-Loop Adaptation — Stage 53 */
(function(){
const KEY="esaClosedLoopV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n||0)))}
function analyse(){
 const sessions=read("esaAdaptiveSessionHistoryV1",[]);
 const latest=sessions[sessions.length-1];
 const previous=sessions[sessions.length-2];
 if(!latest)return {status:"awaiting",message:"Complete an adaptive session to create learning evidence."};
 const completion=latest.activities?.length?latest.activities.filter(a=>a.completed).length/latest.activities.length*100:0;
 const score=Number(latest.score)||completion;
 const priorScore=previous?Number(previous.score)||0:null;
 const delta=priorScore===null?0:Math.round(score-priorScore);
 const response=score>=90?"accelerate":score>=75?"progress":score>=55?"reinforce":"support";
 return {status:"updated",score,delta,completion:clamp(completion),response,focus:latest.focus,difficulty:latest.difficulty,sessionCount:sessions.length};
}
function adapt(){
 const x=analyse();
 if(x.status==="awaiting")return x;
 const p=read("esaAdaptivePlanV1",{});
 let difficulty=p.difficulty||"developing";
 const order=["foundation","developing","intermediate","advanced"];
 let i=order.indexOf(difficulty);
 if(x.response==="accelerate")i=Math.min(order.length-1,i+1);
 if(x.response==="support")i=Math.max(0,i-1);
 const nextDifficulty=order[i]||"developing";
 const reason=x.delta>0?"Recent session performance improved.":"Recent session evidence has been added.";
 const result={...x,nextDifficulty,reason,updatedAt:new Date().toISOString()};
 localStorage.setItem(KEY,JSON.stringify(result));
 return result;
}
function get(){return read(KEY,null)||adapt()}
window.ESAClosedLoop={analyse,adapt,get};
})();