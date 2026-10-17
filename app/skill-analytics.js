/* Expert Sync Skill Analytics — Stage 49 */
(function(){
const KEY="esaSkillAnalyticsV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function num(k){return Number(localStorage.getItem(k))||0}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n||0)))}
function snapshot(){
 const vocab=read("esaVocabularyProgressV1",{}), words=Object.keys(vocab), attempts=words.reduce((n,w)=>n+(vocab[w]?.attempts||0),0),correct=words.reduce((n,w)=>n+(vocab[w]?.correct||0),0);
 const vAcc=attempts?correct/attempts*100:0, mastered=words.filter(w=>vocab[w]?.status==="known").length;
 const sessions=num("esaPracticeSessions"), questions=num("esaQuestionsAnswered"), best=num("esaBestScore");
 const sim=read("esaSimulatorProgress",{}), simScore=Number(sim.score)||0, simRoute=Number(sim.routeProgress)||0;
 return {date:new Date().toISOString(),skills:{
   vocabulary:clamp(vAcc*.7+Math.min(100,mastered*4)*.3),
   grammar:clamp(Math.min(100,best*.7+Math.min(100,questions)*.3)),
   speaking:clamp(Math.min(100,sessions*8+best*.25)),
   pronunciation:20,
   interview:20,
   customerService:clamp(Math.min(100,sessions*6+best*.3)),
   aviation:clamp(sim?((simScore+simRoute)/2):0)
 }};
}
function history(){return read(KEY,[])}
function record(){
 const h=history(),s=snapshot(),last=h[h.length-1],today=s.date.slice(0,10);
 if(last&&last.date.slice(0,10)===today){h[h.length-1]=s}else h.push(s);
 localStorage.setItem(KEY,JSON.stringify(h.slice(-30))); return s;
}
function trend(skill){
 const h=history(),vals=h.map(x=>Number(x.skills?.[skill])||0);
 if(vals.length<2)return {current:vals[0]||0,change:0,direction:"steady",points:vals};
 const change=Math.round(vals[vals.length-1]-vals[vals.length-2]);
 return {current:vals[vals.length-1],change,direction:change>0?"up":change<0?"down":"steady",points:vals};
}
function all(){record();const names=["grammar","vocabulary","speaking","pronunciation","interview","customerService","aviation"];return Object.fromEntries(names.map(n=>[n,trend(n)]))}
window.ESASkillAnalytics={snapshot,record,history,trend,all};
})();