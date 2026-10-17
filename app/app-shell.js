(function(){
  const ctxKey="esaLearningContextV1";
  function saveNav(module){try{const x=JSON.parse(localStorage.getItem(ctxKey)||"{}");x.currentModule=module;x.lastVisited=new Date().toISOString();localStorage.setItem(ctxKey,JSON.stringify(x))}catch(e){}}

  const path=(location.pathname.split("/").pop()||"index.html");
  if(document.getElementById("esa-app-shell")) return;
  const links=[
    ["📱","Student App","index.html"],
    ["📊","My Dashboard","vocabulary-dashboard.html"],
    ["🧭","Mobile Hub","mobile-hub.html"],
    ["🎤","Interview","interview-hub.html"],
    ["📖","Dictionary","dictionary.html"],
    ["📚","Vocabulary","vocabulary-achievement-center.html"],
    ["🔊","Pronunciation","pronunciation-lab.html"]
  ];
  const wrap=document.createElement("div");
  wrap.id="esa-app-shell";
  wrap.innerHTML='<style>
  #esa-app-shell{position:sticky;top:0;z-index:9999;background:#fff;border-bottom:1px solid #dbe5f2;box-shadow:0 3px 12px rgba(3,27,63,.08);font-family:Arial,sans-serif}
  #esa-app-shell .esa-nav{max-width:980px;margin:auto;display:flex;gap:6px;overflow-x:auto;padding:8px 10px;scrollbar-width:none}
  #esa-app-shell .esa-nav::-webkit-scrollbar{display:none}
  #esa-app-shell a{flex:0 0 auto;text-decoration:none;color:#063b91;font-size:11px;font-weight:800;padding:8px 10px;border-radius:10px;white-space:nowrap;background:#f4f8ff;border:1px solid #dbe5f2}
  #esa-app-shell a.active{background:#063b91;color:#fff;border-color:#063b91}
  </style><nav class="esa-nav" aria-label="Expert Sync Academy navigation"></nav>';
  document.body.insertBefore(wrap,document.body.firstChild);
  const nav=wrap.querySelector(".esa-nav");
  links.forEach(function(item){
    const a=document.createElement("a");
    a.href=item[2]; a.addEventListener("click",function(){saveNav(item[1].toLowerCase().replace(/\\s+/g,"-"))}); a.innerHTML=item[0]+" "+item[1];
    if(path===item[2]) a.className="active";
    if(item[2]==="vocabulary-dashboard.html") a.setAttribute("aria-label","Open your personalised learner progress dashboard");
    nav.appendChild(a);
  });
})();