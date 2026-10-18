/* Expert Sync shared Supabase browser configuration.
   Publishable keys are safe for frontend use only when paired with RLS. */
window.ESASupabaseConfig = {
  url: "https://bhxmbbkgkaxikisugrcs.supabase.co",
  publishableKey: "sb_publishable_RvYvEhsMIFM0mW6M9SHiVw_d2NSlhnz",
  bucket: "expert-sync-books",
  priceInr: 400
};
(function(){
  if(window.supabase && !window.supabaseClient){
    window.supabaseClient = window.supabase.createClient(
      window.ESASupabaseConfig.url,
      window.ESASupabaseConfig.publishableKey
    );
  }
})();