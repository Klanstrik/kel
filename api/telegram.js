export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const phoneDisplay = String(body.phone_display || body.phone || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !phone) {
      return res.status(400).json({ ok: false, error: 'name & phone required' });
    }

    const token = process.env.TG_BOT_TOKEN;
    if (!token) {
      return res.status(500).json({ ok: false, error: 'TG_BOT_TOKEN is not configured' });
    }

    const recipientsRaw = `${process.env.TG_CHAT_IDS || ''} ${process.env.TG_CHAT_ID || ''}`;
    const recipients = [...new Set(
      recipientsRaw
        .split(/[,\s;]+/)
        .map(v => v.trim())
        .filter(Boolean)
    )];

    if (!recipients.length) {
      return res.status(500).json({ ok: false, error: 'TG_CHAT_IDS/TG_CHAT_ID is not configured' });
    }

    const submittedAt = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Novosibirsk',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }); 
  
	  
    const text =
      `📨 Новая заявка с сайта\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Телефон: ${phoneDisplay}\n` +
      `🗒 Сообщение: ${message || '—'}\n` +
      `🕒 ${submittedAt}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const results = await Promise.all(
      recipients.map(async (chat_id) => {
        try {
          const tg = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text })
          });

          const data = await tg.json().catch(() => ({ ok: false, error: 'Invalid Telegram response' }));
          return { chat_id, ok: tg.ok && data.ok, status: tg.status, data };
        } catch (error) {
          return { chat_id, ok: false, status: 0, data: { ok: false, error: String(error) } };
        }
      })
    );

    const sent = results.filter(r => r.ok);
    const failed = results.filter(r => !r.ok);

    if (!sent.length) {
      return res.status(502).json({
        ok: false,
        error: 'Failed to send to all recipients',
        failed: failed.map(f => ({
          chat_id: f.chat_id,
          status: f.status,
          description: f.data?.description || f.data?.error || 'Unknown error'
        }))
      });
    }

    return res.status(200).json({
      ok: true,
      sent: sent.length,
      failed: failed.length,
      failedRecipients: failed.map(f => ({
        chat_id: f.chat_id,
        status: f.status,
        description: f.data?.description || f.data?.error || 'Unknown error'
      }))
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}