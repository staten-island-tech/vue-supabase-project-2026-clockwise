// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@pinia/nuxt'],
  runtimeConfig:{
    public: {supabase:{
      redirect:false,
      key: "sb_publishable_kpsmabVTGZNFFF2N89yNEQ_fxCyoF9K",
      url: "https://gotxxgvyoqwvedubdrcz.supabase.co"
    }}
  }
})