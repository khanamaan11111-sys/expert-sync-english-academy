/* Expert Sync Vocabulary Progression Engine — Stage 43 */
(function(){
const PROG="esaVocabularyProgressV1",HIST="esaVocabularyChallengeHistory",DAILY="esaDailyResultsV1";
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}}
function stats(){const p=read(PROG,{}),h=read(HIST,[]),d=read(DAILY,{}),words=Object.keys(p),known=words.filter(w=>p[w]?.status==="known").length,attempts=words.reduce((n,w)=>n+(p[w]?.attempts||0),0),correct=words.reduce((n,w)=>n+(p[w]?.correct||0),0),completedDays=Object.values(d).filter(x=>x?.steps===5).length,best=h.length?Math.max(...h.map(x=>Number(x.score)||0)):0;return{p,h,d,words,known,attempts,correct,completedDays,best,accuracy:attempts?Math.round(correct/attempts*100):0}}
function xp(s){return s.known*10+s.correct*2+s.h.length*25+s.best+s.completedDays*15}
const levels=[["Starter",0],["Explorer",100],["Builder",250],["Confident",500],["Skilled",800],["Advanced",1200],["Expert",1700],["Master",2500]];
function level(total){let current=levels[0],next=levels[1];for(let i=0;i<levels.length;i++)if(total>=levels[i][1]){current=levels[i];next=levels[i+1]||null}return{name:current[0],xp:total,base:current[1],nextXp:next?next[1]:null,toNext:next?Math.max(0,next[1]-total):0,percent:next?Math.min(100,Math.round((total-current[1])/(next[1]-current[1])*100)):100}}
window.ESAProgression={read,stats,xp,level,levels};
})();