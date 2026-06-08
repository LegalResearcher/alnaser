// Resend Inbound Webhook → Forward to personal inbox
// Configure in Resend Dashboard → Inbound → Add Route:
//   Match: to == info@alnaseer.org
//   Action: Webhook → POST https://tozmmphymxiamvdxfmjv.supabase.co/functions/v1/resend-inbound

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

const FORWARD_TO = "moieen2000@gmail.com";
const FORWARD_FROM = "Alnaseer Inbox <info@alnaseer.org>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Inbound payload:", JSON.stringify(payload).slice(0, 500));

    // Resend inbound webhook shape: { type: "email.received", data: { from, to, subject, text, html, headers, attachments } }
    const data = payload?.data ?? payload;
    const from = data.from?.address || data.from || "unknown@unknown";
    const fromName = data.from?.name || from;
    const subject = data.subject || "(بدون عنوان)";
    const text = data.text || "";
    const html = data.html || `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
    const toList = Array.isArray(data.to) ? data.to.map((t: any) => t.address || t).join(", ") : (data.to?.address || data.to || "");

    const header = `
      <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:Arial,sans-serif;color:#374151;font-size:13px;line-height:1.6">
        <div><strong>من:</strong> ${escapeHtml(fromName)} &lt;${escapeHtml(from)}&gt;</div>
        <div><strong>إلى:</strong> ${escapeHtml(toList)}</div>
        <div><strong>الموضوع:</strong> ${escapeHtml(subject)}</div>
      </div>
    `;

    const forwardRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FORWARD_FROM,
        to: [FORWARD_TO],
        reply_to: from,
        subject: `[Fwd: ${subject}]`,
        html: header + html,
        text: `من: ${fromName} <${from}>\nإلى: ${toList}\nالموضوع: ${subject}\n\n${text}`,
      }),
    });

    const result = await forwardRes.json();
    if (!forwardRes.ok) {
      console.error("Resend forward failed:", result);
      return new Response(JSON.stringify({ error: "forward failed", detail: result }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Forwarded OK:", result.id);
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
