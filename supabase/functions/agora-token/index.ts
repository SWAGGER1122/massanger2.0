import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { RtcRole, RtcTokenBuilder } from "https://esm.sh/agora-access-token"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { channelName, uid } = await req.json()

    const appId = Deno.env.get("AGORA_APP_ID")
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE")

    if (!appId || !appCertificate) {
      throw new Error("Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE")
    }

    const role = RtcRole.PUBLISHER
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600
    const numericUid = typeof uid === "number" ? uid : Number(uid || 0)

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      String(channelName),
      numericUid,
      role,
      privilegeExpiredTs,
    )

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
