const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "جميع الحقول مطلوبة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;direction:rtl">
        <div style="background:#1d4ed8;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">رسالة جديدة من منصة الناصر القانونية</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:120px">الاسم:</td>
              <td style="padding:8px 0;color:#1e293b;font-weight:bold">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px">البريد:</td>
              <td style="padding:8px 0;color:#1e293b"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px">الموضوع:</td>
              <td style="padding:8px 0;color:#1e293b;font-weight:bold">${escapeHtml(subject)}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
          <p style="color:#64748b;font-size:14px;margin:0 0 8px">الرسالة:</p>
          <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0;color:#1e293b;line-height:1.8;white-space:pre-wrap">${escapeHtml(message)}</div>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "منصة الناصر القانونية <onboarding@resend.dev>",
        to: ["moieen2000@gmail.com"],
        reply_to: email,
        subject: `رسالة جديدة: ${subject}`,
        html,
        text: `من: ${name}\nالبريد: ${email}\nالموضوع: ${subject}\n\n${message}`,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "فشل الإرسال", detail: result }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
}
