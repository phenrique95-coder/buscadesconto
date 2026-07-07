export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Parâmetro q obrigatório.' });

  const PUBID = process.env.ML_PUBID || 'py20260630212044';

  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=48&sort=relevance`;
    const resp = await fetch(url);
    
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.message || 'Erro na API');
    }

    const data = await resp.json();
    const produtos = (data.results || []).map(p => ({
      id:             p.id,
      title:          p.title,
      price:          p.price,
      original_price: p.original_price,
      thumbnail:      p.thumbnail?.replace('http:', 'https:'),
      free_shipping:  p.shipping?.free_shipping || false,
      link:           `${p.permalink}?deal_print_id=${PUBID}`,
    }));

    return res.status(200).json({ produtos, total: data.paging?.total || 0 });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
