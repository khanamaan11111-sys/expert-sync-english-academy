/* Expert Sync Academy — Stage 94 learning context bridge */
(function(){
  const KEY="esaLearningContextV1";
  const now=()=>new Date().toISOString();
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return{}}}
  function write(x){try{localStorage.setItem(KEY,JSON.stringify(x))}catch(e){}}
  function moduleFromPath(){
    const p=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    if(p==="index.html") return "student";
    if(p.includes("interview")) return "interview";
    if(p.includes("dictionary")) return "dictionary";
    if(p.includes("vocabulary")) return "vocabulary";
    if(p.includes("pronunciation")) return "pronunciation";
    if(p.includes("mobile")) return "mobile";
    return "academy";
  }
  const ctx=read();
  ctx.currentModule=moduleFromPath();
  ctx.lastVisited=now();
  ctx.visitCount=(ctx.visitCount||0)+1;
  write(ctx);
  window.ESAContext={
    get:read,
    set:function(patch){const x=Object.assign(read(),patch||{}, {updatedAt:now()});write(x);return x},
    rememberWord:function(word,source){return this.set({lastWord:word,lastWordSource:source||moduleFromPath()})},
    rememberQuestion:function(question,source){return this.set({lastQuestion:question,lastQuestionSource:source||"interview"})},
    rememberReturn:function(url){return this.set({returnUrl:url||"index.html"})}
  };
})();