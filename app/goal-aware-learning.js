/* Expert Sync Goal-Aware Learning Engine — Stage 64 */
(function(){
const KEY="esaLearningGoalV1";
const GOALS={
 general:{title:"General English",weights:{grammar:1,vocabulary:1,speaking:1,pronunciation:1,interview:.8,customerService:.7,aviation:.5}},
 interview:{title:"Interview English",weights:{grammar:.9,vocabulary:1,speaking:1.3,pronunciation:1,interview:1.6,customerService:.7,aviation:.4}},
 customerService:{title:"Customer Service English",weights:{grammar:.9,vocabulary:1,speaking:1.3,pronunciation:1,interview:.7,customerService:1.6,aviation:.7}},
 aviation:{title:"Aviation English",weights:{grammar:.9,vocabulary:1.1,speaking:1.3,pronunciation:1.4,interview:.7,customerService:.8,aviation:1.8}},
 workplace:{title:"Workplace English",weights:{grammar:1.1,vocabulary:1.2,speaking:1.2,pronunciation:1,interview:1,customerService:1.2,aviation:.4}}
};
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function infer(){const d=read("esaVocabularyDiagnosticV1",null),p=String(d?.recommendedPath||"").toLowerCase();if(p.includes("aviation"))return"aviation";if(p.includes("interview"))return"interview";if(p.includes("customer"))return"customerService";if(p.includes("workplace"))return"workplace";return"general"}
function getGoal(){const saved=read(KEY,null);return GOALS[saved?.id]?{id:saved.id,...GOALS[saved.id]}:{id:infer(),...GOALS[infer()]}}
function setGoal(id){if(!GOALS[id])return getGoal();localStorage.setItem(KEY,JSON.stringify({id}));return getGoal()}
function rank(){const goal=getGoal(),p=window.ESAUnifiedEvidence?.refresh?.()||read("esaUnifiedEvidenceV1",{summary:{}}),s=p.summary||{},items=Object.keys(goal.weights).map(k=>{const score=clamp(s[k]?.score),weight=goal.weights[k];return {skill:k,score,weight,need:clamp((100-score)*weight)}}).sort((a,b)=>b.need-a.need);return {goal,priority:items[0]?.skill||"vocabulary",skills:items}}
function recommendation(){const r=rank();return {goal:r.goal.title,priority:r.priority,reason:"Goal weighting is combined with actual skill evidence, so the target goal influences priority without overriding learner performance."}}
window.ESAGoalLearning={goals:GOALS,getGoal,setGoal,rank,recommendation};
})();