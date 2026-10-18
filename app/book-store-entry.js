(function(){
  function add(){
    if(document.getElementById("esa-book-store-fab"))return;
    var fab=document.createElement("div");
    fab.id="esa-book-store-fab";
    fab.style.cssText="position:fixed;right:16px;bottom:92px;z-index:9998;display:flex;flex-direction:column;gap:8px;align-items:flex-end;";
    var store=document.createElement("button");
    store.type="button";
    store.style.cssText="border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:11px 14px;font-weight:900;background:#063b91;color:#fff;box-shadow:0 8px 22px rgba(3,27,63,.24);cursor:pointer;";
    store.innerHTML="📚 Book Store";
    store.onclick=function(){location.href="book-store.html"};
    fab.appendChild(store);
    try{
      if(window.supabaseClient){
        window.supabaseClient.auth.getUser().then(function(x){
          var u=x.data&&x.data.user;
          if(u&&u.app_metadata&&u.app_metadata.role==="admin"){
            var admin=document.createElement("button");
            admin.type="button";
            admin.style.cssText="border:1px solid #d4af37;border-radius:14px;padding:11px 14px;font-weight:900;background:#d4af37;color:#172033;box-shadow:0 8px 22px rgba(3,27,63,.20);cursor:pointer;";
            admin.innerHTML="⬆️ Upload PDF";
            admin.onclick=function(){location.href="book-admin.html"};
            fab.insertBefore(admin,store);
          }
        });
      }
    }catch(e){}
    document.body.appendChild(fab);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();
})();