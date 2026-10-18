/* Expert Sync Personalised Activity Selection — Stage 66 */
(function(){
const KEY="esaPersonalisedActivitySelectionV1";
const CATALOG={
 grammar:[["grammar","Accuracy Drill"],["review","Error Correction"],["sentence","Sentence Transformation"],["challenge","Grammar Challenge"]],
 vocabulary:[["learn","Priority Vocabulary"],["recall","Active Recall"],["review","Smart Review"],["challenge","Vocabulary Challenge"]],
 speaking:[["speaking","Guided Speaking"],["use","Sentence Production"],["fluency","Fluency Drill"],["challenge","Speaking Challenge"]],
 pronunciation:[["pronunciation","Sound Practice"],["shadow","Shadowing"],["recall","Pronunciation Recall"],["challenge","Pronunciation Challenge"]],
 interview:[["interview","Interview Response"],["followup","Follow-up Drill"],["speaking","Structured Speaking"],["challenge","Interview Challenge"]],
 customerService:[["customer-service","Service Scenario"],["deescalation","De-escalation"],["speaking","Response Practice"],["challenge","Service Challenge"]],
 aviation:[["aviation","ATC Communication"],["briefing","Operational Briefing"],["speaking","Operational Response"],["challenge","Aviation Challenge"]]
};
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function select(){
 const plan=window.ESAAdaptiveLearning?.get?ESAAdaptiveLearning.get():{focus:"vocabulary",difficulty:"developing"};
 const cal=window.ESADifficultyCalibration?.get?.()||{skills:{}}, ret=window.ESAMasteryRetention?.build?.()||{due:[]};
 const history=read("esaAdaptiveSessionHistoryV1",[]).slice(-5).flatMap(s=>s.activities||[]).map(a=>a.type);
 const pool=CATALOG[plan.focus]||CATALOG.vocabulary;
 const available=pool.filter(x=>!history.includes(x[0]));
 const chosen=(available.length>=3?available:pool).slice(0,3);
 const mode=ret.due?.includes(plan.focus)?"retention":plan.difficulty==="advanced"?"challenge":plan.difficulty==="foundation"?"guided":"balanced";
 return {focus:plan.focus,difficulty:plan.difficulty,mode,goal:plan.goal||null,calibration:cal.skills?.[plan.focus]||null,activities:chosen.map((x,i)=>({order:i+1,type:x[0],title:x[1],reason:mode==="retention"?"Retention review":mode==="challenge"?"Challenge calibrated to current performance":"Selected for current skill priority"}))};
}
function build(){const x=select();localStorage.setItem(KEY,JSON.stringify({...x,updatedAt:new Date().toISOString()}));return x}
function get(){return read(KEY,build())}
window.ESAPersonalisedActivities={select,build,get};
})();