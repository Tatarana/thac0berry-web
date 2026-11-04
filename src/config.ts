// Endereço e chave PÚBLICA (publishable) do backend Supabase (repo
// thac0berry-backend). A chave publishable foi feita para ir no front-end:
// quem protege os dados são as regras de permissão (RLS) do banco.
// A chave service_role NUNCA entra aqui.
export const SUPABASE_URL = 'https://azydmvnlzmyvtsgfogbq.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VGUm2JdArmQuqeFBm1-Elg_ko24yZH2'

// Endereço base das imagens do site (CloudFront na frente do bucket S3; ver
// thac0berry-backend/docs/imagens-fora-do-supabase.md). Público: não tem segredo.
export const SITE_IMAGES_BASE_URL = 'https://d1ve1v7ojhgjr2.cloudfront.net'
