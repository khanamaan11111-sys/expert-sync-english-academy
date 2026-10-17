/* Expert Sync Vocabulary Rewards — Stage 44 */
(function(){
const KEY="esaVocabularyRewardsV1";
function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return{}}}
function save(x){localStorage.setItem(KEY,JSON.stringify(x))}
const milestones=[
 {id:"first-word",title:"First Word",icon:"🌱",text:"Your vocabulary journey has started.",test:s=>s.known>=1},
 {id:"ten-mastered",title:"10 Words Mastered",icon:"📚",text:"You have built your first vocabulary foundation.",test:s=>s.known>=10},
 {id:"twenty-five-mastered",title:"25 Words Mastered",icon:"🏆",text:"A strong vocabulary foundation is taking shape.",test:s=>s.known>=25},
 {id:"five-day-streak",title:"5-Day Streak",icon:"🔥",text:"Consistency is becoming a learning habit.",test:s=>s.days>=5},
 {id:"challenge-85",title:"Challenge 85",icon:"🥇",text:"Excellent challenge performance.",test:s=>s.best>=85},
 {id:"expert-level",title:"Expert Level",icon:"🚀",text:"You have reached the Expert progression level.",test:s=>s.level==="Expert"||s.level==="Master"},
 {id:"master-level",title:"Master Level",icon:"👑",text:"You have reached the highest Academy progression milestone.",test:s=>s.level==="Master"}
];
function evaluate(stats,level){
 const state=read(),fresh=[];
 milestones.forEach(m=>{if(m.test({...stats,level})&&!state[m.id]){state[m.id]={earnedAt:new Date().toISOString()};fresh.push(m)}});
 save(state); return fresh;
}
function allEarned(){const s=read();return milestones.filter(m=>s[m.id]).map(m=>({...m,earnedAt:s[m.id].earnedAt}))}
window.ESARewards={milestones,evaluate,allEarned,read};
})();