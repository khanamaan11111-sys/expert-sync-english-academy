/* Expert Sync Adaptive Session Generator — Stage 54 */
(function(){
const KEY="esaAdaptiveSessionV1",HIST="esaAdaptiveSessionHistoryV1",XP="esaAdaptiveSessionXPV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function build(){
 const plan=window.ESAAdaptiveLearning?.get?window.ESAAdaptiveLearning.get():{focus:"vocabulary",difficulty:"developing",activity:"Complete Smart Review and learn high-priority words."};
 const sequence=window.ESASequence?.build?window.ESASequence.build():null;
 const fallback={grammar:[["grammar","Grammar Accuracy Practice"],["review","Error Correction Review"],["challenge","Grammar Challenge"]],vocabulary:[["learn","Priority Vocabulary"],["recall","Recall Practice"],["review","Smart Review"]],speaking:[["speaking","Speaking Response"],["use","Sentence Production"],["challenge","Speaking Challenge"]],pronunciation:[["pronunciation","Pronunciation Practice"],["recall","Sound Recall"],["challenge","Pronunciation Challenge"]],interview:[["interview","Interview Response"],["speaking","Structured Speaking"],["challenge","Interview Challenge"]],customerService:[["customer-service","Customer Service Scenario"],["speaking","Response Practice"],["challenge","Service Challenge"]],aviation:[["aviation","Aviation Communication"],["speaking","Operational Response"],["challenge","Aviation Challenge"]]};
 const activities=sequence?.activities?.map(a=>[a.type,a.title])||fallback[plan.focus]||fallback.vocabulary;
 const minutes=plan.difficulty==="foundation"?12:plan.difficulty==="developing"?15:plan.difficulty==="intermediate"?18:22;
 const session={date:new Date().toISOString().slice(0,10),focus:plan.focus,difficulty:plan.difficulty,reason:plan.reason,emphasis:sequence?.emphasis||"balanced",estimatedMinutes:minutes,activities:activities.map((x,i)=>({order:i+1,type:x[0],title:x[1],completed:false}))};
 localStorage.setItem(KEY,JSON.stringify(session));return session;
}
function get(){const s=read(KEY,null);return s&&s.date===new Date().toISOString().slice(0,10)?s:build()}
function complete(i){const s=get();if(s.activities[i]){s.activities[i].completed=true;s.activities[i].completedAt=new Date().toISOString()}if(s.activities.every(a=>a.completed)&&!s.finishedAt){s.finishedAt=new Date().toISOString();s.score=100;s.xpAwarded=25+(s.difficulty==="advanced"?15:s.difficulty==="intermediate"?10:5);const h=read(HIST,[]);h.push(s);localStorage.setItem(HIST,JSON.stringify(h.slice(-30)));localStorage.setItem(XP,String(Number(localStorage.getItem(XP)||0)+s.xpAwarded))}localStorage.setItem(KEY,JSON.stringify(s));if(s.finishedAt&&window.ESAClosedLoop?.adapt)window.ESAClosedLoop.adapt();return s}
function history(){return read(HIST,[])}
function xp(){return Number(localStorage.getItem(XP)||0)}
window.ESAAdaptiveSession={build,get,complete,history,xp};
})();