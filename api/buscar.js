// api/buscar.js — Serverless Function (Vercel)
// Faz a chamada à API do Mercado Livre no servidor,
// evitando o bloqueio de CORS no navegador.

export default async function handler(req, res) {
  // Permite requisições do próprio site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" obrigatório.' });
  }

  const ML_TOKEN = process.env.ML_TOKEN;
  const PUBID    = process.env.ML_PUBID || 'py20260630212044';

  if (!ML_TOKEN) {
    return res.status(500).json({ error: 'Token não configurado.' });
  }

  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=48&sort=relevance`;

    const mlResp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ML_TOKEN}` }
    });

    if (!mlResp.ok) {
      const err = await mlResp.json();
      return res.status(mlResp.status).json({ error: err.message || 'Erro na API do ML' });
    }

    const data = await mlResp.json();

    // Adiciona link de afiliado em cada produto
    const produtos = (data.results || []).map(p => ({
      id:             p.id,
      title:          p.title,
      price:          p.price,
      original_price: p.original_price,
      thumbnail:      p.thumbnail?.replace('http:', 'https:'),
      free_shipping:  p.shipping?.free_shipping || false,
      link:           `${p.permalink}?deal_print_id=${PUBID}`,
      condition:      p.condition,
    }));

    return res.status(200).json({ produtos, total: data.paging?.total || 0 });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
