// Vercel Serverless Function: /api/telegram
export default async function handler(req, res) {
  // CORS 
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  try {
    const { name = '', phone = '', message = '' } = req.body || {};
    if (!name || !phone) return res.status(400).json({ ok:false, error:'name & phone required' });

    const text =
      `📨 Новая заявка с сайта\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Телефон: ${phone}\n` +
      `🗒 Сообщение: ${message || '—'}\n` +
      `🕒 ${new Date().toLocaleString('ru-RU')}`;

    const url = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;
    const tg = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ chat_id: process.env.TG_CHAT_ID, text })
    });

    const data = await tg.json();
    if (!tg.ok || !data.ok) return res.status(500).json({ ok:false, error:data });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ ok:true });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
}
