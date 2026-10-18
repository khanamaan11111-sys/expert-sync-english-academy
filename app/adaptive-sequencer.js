/* Expert Sync Personalised Session Sequencer — Stage 54 */
(function(){
const KEY="esaAdaptiveSequenceV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
const catalog={
 grammar:[["grammar","Grammar Accuracy Practice"],["review","Error Correction Review"],["sentence","Sentence Transformation"],["challenge","Grammar Challenge"]],
 vocabulary:[["learn","Priority Vocabulary"],["recall","Recall Practice"],["review","Smart Review"],["challenge","Vocabulary Challenge"]],
 speaking:[["speaking","Speaking Response"],["use","Sentence Production"],["fluency","Fluency Drill"],["challenge","Speaking Challenge"]],
 pronunciation:[["pronunciation","Pronunciation Practice"],["recall","Sound Recall"],["shadow","Shadowing Practice"],["challenge","Pronunciation Challenge"]],
 interview:[["interview","Interview Response"],["speaking","Structured Speaking"],["followup","Follow-up Question Drill"],["challenge","Interview Challenge"]],
 customerService:[["customer-service","Customer Service Scenario"],["speaking","Response Practice"],["deescalation","De-escalation Practice"],["challenge","Service Challenge"]],
 aviation:[["aviation","Aviation Communication"],["speaking","Operational Response"],["briefing","Operational Briefing"],["challenge","Aviation Challenge"]]
};
function sequence(){
 const plan=window.ESAAdaptiveLearning?.get?ESAAdaptiveLearning.get():{focus:"vocabulary",difficulty:"developing"};
 const history=read("esaAdaptiveSessionHistoryV1",[]);
 const prior=history.slice(-3).map(s=>s.activities?.map(a=>a.type)||[]).flat();
 const pool=catalog[plan.focus]||catalog.vocabulary;
 const unused=pool.filter(x=>!prior.includes(x[0]));
 const ordered=(unused.length>=3?unused:pool).slice(0,3);
 const emphasis=plan.difficulty==="foundation"?"guided":plan.difficulty==="advanced"?"challenge":"balanced";
 return {focus:plan.focus,difficulty:plan.difficulty,emphasis,activities:ordered.map((x,i)=>({order:i+1,type:x[0],title:x[1],completed:false}))};
}
function build(){const s=sequence();localStorage.setItem(KEY,JSON.stringify(s));return s}
function get(){return read(KEY,null)||build()}
window.ESASequence={sequence,build,get};
})();