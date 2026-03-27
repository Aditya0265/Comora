// Comora — Supabase Edge Function: send-email
// Deploy: supabase functions deploy send-email
// Set secret: supabase secrets set RESEND_API_KEY=re_xxxxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL     = 'Comora <hello@comora.app>'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailType =
  | 'booking_confirmed'
  | 'event_reminder_48h'
  | 'event_reminder_2h'
  | 'booking_cancelled'
  | 'event_cancelled'
  | 'host_verified'
  | 'application_approved'
  | 'application_declined'

interface EmailPayload {
  type:        EmailType
  to:          string
  guestName:   string
  eventTitle?: string
  hostName?:   string
  eventDate?:  string
  eventTime?:  string
  eventCity?:  string
  price?:      string
  cancelPolicy?: string
  eventId?:    string
}

function getSubjectAndHtml(payload: EmailPayload): { subject: string; html: string } {
  const base = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;background:#FDFCF8;border-radius:16px;overflow:hidden;border:1px solid #E8E6E1">
      <div style="background:#1E3A5F;padding:24px 32px">
        <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.5px">Comora</span>
        <p style="color:#93C5FD;margin:4px 0 0;font-size:13px;font-style:italic">Where people meet around ideas.</p>
      </div>
  `
  const footer = `
      <div style="padding:24px 32px;background:#F5F3EE;border-top:1px solid #E8E6E1">
        <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center">
          © 2025 Comora · <em>"Food gathers people in a room. Ideas keep them at the table."</em>
        </p>
      </div>
    </div>
  `

  const eventCard = (p: EmailPayload) => `
    <div style="margin:16px 0;padding:16px;background:#FFFFFF;border-radius:10px;border:1px solid #E8E6E1">
      <p style="font-weight:600;font-size:15px;color:#1C1C1E;margin:0 0 8px">${p.eventTitle}</p>
      ${p.hostName   ? `<p style="color:#4B5563;font-size:13px;margin:2px 0">Hosted by ${p.hostName}</p>` : ''}
      ${p.eventDate  ? `<p style="color:#4B5563;font-size:13px;margin:2px 0">📅 ${p.eventDate} at ${p.eventTime}</p>` : ''}
      ${p.eventCity  ? `<p style="color:#4B5563;font-size:13px;margin:2px 0">📍 ${p.eventCity}</p>` : ''}
      ${p.price      ? `<p style="color:#1E3A5F;font-size:13px;font-weight:600;margin:8px 0 0">${p.price}</p>` : ''}
    </div>
  `

  const templates: Record<EmailType, { subject: string; body: string }> = {
    booking_confirmed: {
      subject: `🎉 You're going! — ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">You're confirmed, ${payload.guestName}!</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Your spot is reserved. We're excited to see you there.</p>
          ${eventCard(payload)}
          <p style="color:#4B5563;font-size:13px;margin:16px 0 0">
            Your <strong>Conversation Warm-Up Pack</strong> — icebreakers and discussion prompts — will be available in your bookings dashboard closer to the event. Come ready to talk!
          </p>
          ${payload.cancelPolicy ? `<p style="color:#9CA3AF;font-size:12px;margin:12px 0 0">Cancellation policy: ${payload.cancelPolicy}</p>` : ''}
          <div style="margin-top:24px">
            <a href="https://comora.app/events/${payload.eventId}" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">View Event →</a>
          </div>
        </div>
      `,
    },

    event_reminder_48h: {
      subject: `📅 Reminder: ${payload.eventTitle} is in 2 days`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">See you in 2 days, ${payload.guestName}!</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Just a reminder that your gathering is coming up.</p>
          ${eventCard(payload)}
          <p style="color:#4B5563;font-size:14px;margin:16px 0 0">
            Check your Conversation Warm-Up Pack in your dashboard — it has icebreakers and discussion prompts tailored to this event's agenda.
          </p>
          <div style="margin-top:24px">
            <a href="https://comora.app/my-bookings" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">View My Bookings →</a>
          </div>
        </div>
      `,
    },

    event_reminder_2h: {
      subject: `🕐 Starting soon: ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">Almost time, ${payload.guestName}!</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Your gathering starts in about 2 hours.</p>
          ${eventCard(payload)}
          <p style="color:#F59E0B;font-size:13px;font-weight:600;margin:16px 0 0">💡 Tip: Review your icebreakers before you arrive — conversations start easier when you already have something to say.</p>
        </div>
      `,
    },

    booking_cancelled: {
      subject: `Booking cancelled — ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">Your booking has been cancelled</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Hi ${payload.guestName}, your spot at the following event has been cancelled.</p>
          ${eventCard(payload)}
          <p style="color:#4B5563;font-size:13px;margin:16px 0 0">If you paid for this event, a refund will be processed according to the cancellation policy.</p>
          <div style="margin-top:24px">
            <a href="https://comora.app/browse" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Discover other events →</a>
          </div>
        </div>
      `,
    },

    event_cancelled: {
      subject: `Event cancelled — ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">Unfortunately, this event has been cancelled</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Hi ${payload.guestName}, we're sorry to let you know that the host has cancelled this gathering.</p>
          ${eventCard(payload)}
          <p style="color:#4B5563;font-size:13px;margin:16px 0 0">If you paid, a full refund will be issued within 3–5 business days. We're sorry for the inconvenience.</p>
          <div style="margin-top:24px">
            <a href="https://comora.app/browse" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Find another gathering →</a>
          </div>
        </div>
      `,
    },

    host_verified: {
      subject: '✅ You are now a Verified Host on Comora',
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">Congratulations, ${payload.guestName}!</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Your host verification has been approved. You now have a Verified Host badge on your profile.</p>
          <div style="padding:16px;background:#ECFDF5;border-radius:10px;border:1px solid #A7F3D0;margin:0 0 20px">
            <p style="color:#065F46;font-size:14px;font-weight:600;margin:0">✓ Verified Host — Your identity has been confirmed by the Comora team.</p>
          </div>
          <p style="color:#4B5563;font-size:13px">You can now create events and build your community. Head to the Host Studio to get started.</p>
          <div style="margin-top:24px">
            <a href="https://comora.app/host/studio/new" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Create Your First Event →</a>
          </div>
        </div>
      `,
    },

    application_approved: {
      subject: `🎉 Your application was approved — ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">You're in, ${payload.guestName}!</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">The host has approved your application to join this gathering.</p>
          ${eventCard(payload)}
          <div style="margin-top:24px">
            <a href="https://comora.app/my-bookings" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">View My Bookings →</a>
          </div>
        </div>
      `,
    },

    application_declined: {
      subject: `Application update — ${payload.eventTitle}`,
      body: `
        <div style="padding:32px">
          <h2 style="color:#1C1C1E;font-size:22px;font-weight:700;margin:0 0 8px">Application not accepted, ${payload.guestName}</h2>
          <p style="color:#4B5563;font-size:14px;margin:0 0 20px">Unfortunately, the host was unable to accept your application for this gathering. This is often due to fit or capacity constraints rather than a reflection of you personally.</p>
          ${eventCard(payload)}
          <div style="margin-top:24px">
            <a href="https://comora.app/browse" style="background:#1E3A5F;color:#FFFFFF;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">Discover other gatherings →</a>
          </div>
        </div>
      `,
    },
  }

  const t = templates[payload.type]
  return {
    subject: t.subject,
    html: base + t.body + footer,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: EmailPayload = await req.json()

    if (!payload.type || !payload.to) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { subject, html } = getSubjectAndHtml(payload)

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [payload.to],
        subject: subject,
        html:    html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return new Response(
        JSON.stringify({ error: data }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
