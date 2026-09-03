// Cache entre o app e o Supabase do HackTown.
//
// Sem isto, cada abertura do app fazia 2 requisições no backend deles (1.255
// atividades em páginas de 1000). Com isto, o Supabase é consultado uma vez a
// cada TTL, independente de quantas pessoas estiverem usando.
//
// A chave é publishable (pública por design). Fica aqui como padrão pra o deploy
// funcionar sem passo extra; pra sobrescrever, defina SB_KEY nas variáveis de
// ambiente do projeto no Cloudflare.

const SB_URL = "https://xbsooiedncsrmrhjasvk.supabase.co";
const SB_KEY_PADRAO = "sb_publishable_-xZkCMPyJLSSXZZvwHRGLw_QFbLS_yN";
const SELECT = "id,title,description,event_date,start_time,end_time,age_rating,activity_type,status,guarda_chuva,is_evento_maior,image_url,parent_event_id,formato,mediador,selo,registration_url,venue:venue_id(name,area,maps_url),event_tracks(tracks(id,name,code)),event_speakers(cargo_empresa,speakers(id,name,cargo_empresa))";

// Paginação do Supabase: a API devolve no máximo PAGINA por chamada.
// MAX_PAGINAS é teto de segurança contra laço infinito, não limite de dados —
// se a programação passar de PAGINA*MAX_PAGINAS, trunca em silêncio.
const PAGINA = 1000, MAX_PAGINAS = 8;

// TTL curto de propósito: durante o evento a programação muda, e atraso de
// horário na tela é pior que algumas requisições a mais.
const TTL = 300;              // 5 min — resposta servida do edge
const TTL_RESERVA = 86400;    // 24 h — cópia usada só se o Supabase falhar

const chaveDe = (url, sufixo = "") =>
  new Request(new URL("/api/events" + sufixo, url).toString(), { method: "GET" });

const marcar = (res, origem) => {
  const out = new Response(res.body, res);
  out.headers.set("x-mht-cache", origem);
  return out;
};

async function buscarTudo(chave) {
  let offset = 0, all = [];
  for (let i = 0; i < MAX_PAGINAS; i++) {
    const url = `${SB_URL}/rest/v1/events?select=${encodeURIComponent(SELECT)}`
      + `&status=eq.publicado&order=event_date.asc,start_time.asc,id.asc`
      + `&limit=${PAGINA}&offset=${offset}`;
    const res = await fetch(url, { headers: { apikey: chave, Authorization: "Bearer " + chave } });
    if (!res.ok) throw new Error("Supabase HTTP " + res.status);
    const rows = await res.json();
    all = all.concat(rows);
    if (rows.length < PAGINA) break;
    offset += PAGINA;
  }
  return all;
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const url = context.request.url;

  const quente = await cache.match(chaveDe(url));
  if (quente) return marcar(quente, "hit");

  try {
    const rows = await buscarTudo(context.env.SB_KEY || SB_KEY_PADRAO);
    const corpo = JSON.stringify(rows);

    const resposta = new Response(corpo, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${TTL}`
      }
    });
    const reserva = new Response(corpo, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${TTL_RESERVA}`
      }
    });

    context.waitUntil(Promise.all([
      cache.put(chaveDe(url), resposta.clone()),
      cache.put(chaveDe(url, "?reserva=1"), reserva)
    ]));

    return marcar(resposta, "miss");
  } catch (e) {
    // Supabase fora do ar: serve a última cópia boa das últimas 24 h, se houver.
    const frio = await cache.match(chaveDe(url, "?reserva=1"));
    if (frio) return marcar(frio, "reserva");

    return new Response(JSON.stringify({ erro: String(e && e.message || e) }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }
}
