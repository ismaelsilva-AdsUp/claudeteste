/*
 * offerwall-gate — só imprime o top_rec (e o resto do wrapper) depois que o offerwall fechar.
 * Sites: oguiadocredito.com, creditario.com, co.creditario.com (e qualquer subdomínio deles).
 *
 * Não mexe no offerwall (sem CSS, sem alterar slot): apenas segura a inicialização do wrapper,
 * pelo mesmo gancho do plugin offerwall-waiter (adseleto.queue).
 *
 * POR QUE NÃO USAR O PLUGIN offerwall-waiter: ele só reconhece slot cujo ad unit TERMINA em "offerwall".
 * Com utm_source (meta, wpp, pushalert, adsup_br1_rcs...) o scripted-ads põe sufixo no ad unit
 * (ex.: as_oguiadocredito_mob_offerwall_meta) e o plugin fica cego: libera o wrapper no timeout de 2s.
 * Aqui o slot é reconhecido por /offerwall/ no último trecho do ad unit, com ou sem sufixo.
 *
 * Colocar no <head>, ANTES do script do wrapper (o <script type="module"> com import AdseletoWrapper
 * ou o src=".../as_creditario.js"). E REMOVER "offerwall-waiter" do bloco plugins do wrapper
 * (oguiadocredito.com), senão ele libera o wrapper em 2s.
 *
 * Debug na URL: ?gatedebug (loga no console) | ?nogate (desliga o snippet, para comparar).
 */
(function () {
  // ---- Configuração -------------------------------------------------------------------------------
  // Páginas onde o offerwall existe, por site (espelha o include_in/exclude_from do offerwall no wrapper).
  // Fora dessas páginas o snippet não faz nada, para não atrasar anúncio de quem não tem offerwall.
  // Suporta "*" e termina-com-"/*", igual ao wrapper. Barra final é ignorada.
  var SITES = [
    {
      host: /(^|\.)oguiadocredito\.com$/,
      include: [
        '/rec/*',
        '/saiba-como-solicitar-emprestimo-pre-aprovado/',
        '/emprestimo-supersim-2/',
        '/conheca-o-emprestimo-super-sim',
        '/como-solicitar-o-emprestimo-super-sim'
      ],
      exclude: ['/quiz/*', '/responda*', '/quem-somos/', '/politica-de-privacidade/', '/termos-de-uso/', '/contato/',
        '/como-parar-de-receber-mensagens-do-creditavel-cancelar-notificacoes-e-emails/']
    },
    {
      // creditario.com e co.creditario.com (o MX tem ainda /qc01-sms; o CO não — inofensivo ter nos dois)
      host: /(^|\.)creditario\.com$/,
      include: [
        '/rec/*',
        '/tu-nuevo-prestamo-personal-2',
        '/cat-vs-tasa-anual-comparar-prestamos',
        '/prestamo-nomina-vs-personal',
        '/tu-prestamo-a-tu-medida-mexico',
        '/tu-nuevo-prestamo-personal',
        '/tu-nuevo-prestamo',
        '/qc01-sms'
      ],
      exclude: []
    }
  ];

  var WAIT_FOR_OFFERWALL_MS = 6000;  // offerwall não pedido nesse tempo (sem demanda, falha de carga): libera
  var MAX_OPEN_MS = 120000;          // offerwall aberto mas nenhum evento de fechamento: libera mesmo assim
  // -------------------------------------------------------------------------------------------------

  function norm(p) { return p.replace(/^\//, '').replace(/\/$/, ''); }
  function globToRegex(g) {
    var s = norm(g).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.*)');
    return new RegExp('^' + s + '$');
  }
  function matchAny(list, path) {
    var p = norm(path);
    for (var i = 0; i < list.length; i++) if (globToRegex(list[i]).test(p)) return true;
    return false;
  }

  var site = null;
  for (var i = 0; i < SITES.length; i++) {
    if (SITES[i].host.test(location.hostname)) { site = SITES[i]; break; }
  }
  if (!site) return;
  if (!matchAny(site.include, location.pathname) || matchAny(site.exclude, location.pathname)) return;
  if (/[?&]nogate(&|=|$)/.test(location.search)) return;

  var debug = /[?&]gatedebug(&|=|$)/.test(location.search);
  var t0 = performance.now();
  function log(msg) {
    if (debug) console.log('[gate +' + Math.round(performance.now() - t0) + 'ms] ' + msg);
  }

  var state = 'waiting';  // waiting -> open (offerwall pedido) -> done (liberado)
  var release = null;     // função do wrapper, entregue pela fila
  var timer = null;

  // Último trecho do ad unit contém "offerwall": cobre _offerwall, _offerwall_native, _offerwall_meta, _offerwall_wpp...
  var isOfferwall = function (slot) {
    if (!slot) return false;
    var seg = slot.getAdUnitPath().split('/').pop();
    return /offerwall/i.test(seg);
  };

  function finish(why) {
    if (state === 'done') return;
    state = 'done';
    clearTimeout(timer);
    log('liberando wrapper (' + why + ')' + (release ? '' : ', ainda sem fila'));
    if (release) release();
  }

  function timeout() { finish('tempo esgotado'); }

  function opened() {
    if (state !== 'waiting') return;
    state = 'open';
    clearTimeout(timer);
    timer = setTimeout(timeout, MAX_OPEN_MS);
    log('offerwall pedido, esperando fechar');
  }

  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(function () {
    var pubads = googletag.pubads();
    pubads.addEventListener('slotRequested', function (e) {
      if (isOfferwall(e.slot)) opened();
    });
    // sem anúncio: o modal não abre, não há o que esperar
    pubads.addEventListener('slotRenderEnded', function (e) {
      if (!isOfferwall(e.slot)) return;
      log('offerwall renderizado, vazio=' + e.isEmpty);
      if (e.isEmpty) finish('offerwall sem anúncio');
    });
    // anúncio do offerwall assistido e fechado
    pubads.addEventListener('rewardedSlotClosed', function (e) {
      if (isOfferwall(e.slot)) finish('offerwall fechado');
    });
  });

  window.adseleto = window.adseleto || { queue: [] };
  window.adseleto.queue.push(function (wrapperRelease) {
    release = wrapperRelease;
    log('wrapper pediu para iniciar, estado=' + state);
    if (state === 'done') {                                 // offerwall já resolvido antes do wrapper chegar
      log('offerwall já resolvido, liberando');
      wrapperRelease();
      return;
    }
    if (state === 'waiting') timer = setTimeout(timeout, WAIT_FOR_OFFERWALL_MS);
  });
})();
