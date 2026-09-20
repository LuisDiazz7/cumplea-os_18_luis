import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const TTL_SEGUNDOS = 3600

const HEADERS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', ...HEADERS_CORS },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return responder({})

  if (req.method !== 'POST') return responder({ error: 'metodo_no_permitido' }, 405)

  try {
    const cuerpo = await req.json()
    const codigoQr = typeof cuerpo?.codigo_qr === 'string' ? cuerpo.codigo_qr.trim() : null

    if (!codigoQr) return responder({ error: 'codigo_qr_requerido' }, 400)

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return responder({ error: 'configuracion_incompleta' }, 500)
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: invitado, error: errInvitado } = await admin
      .from('invitados')
      .select('foto')
      .eq('codigo_qr', codigoQr)
      .maybeSingle()

    if (errInvitado || !invitado) return responder({ error: 'invitado_no_encontrado' }, 404)

    const ruta = invitado.foto
    if (!ruta) return responder({ url: null })

    const { data: firma, error: errFirma } = await admin.storage
      .from('fotos-invitados')
      .createSignedUrl(ruta, TTL_SEGUNDOS)

    if (errFirma || !firma?.signedUrl) {
      return responder({ error: 'no_se_pudo_firmar', detalle: errFirma?.message ?? null }, 500)
    }

    return responder({ url: firma.signedUrl })
  } catch {
    return responder({ error: 'solicitud_invalida' }, 400)
  }
})