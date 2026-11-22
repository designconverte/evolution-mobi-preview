(function (janela) {
  'use strict';

  const doc = janela.document;
  if (!doc) return;

  const FOCAVEIS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const NOME_DA_LOJA = 'Evolution Mobi';

  // Fotos do catálogo da Evolution (decisão deste projeto, curadoria de 21/11/2026):
  // recorte com fundo transparente (sombra), recorte em fundo branco (multiply) e foto da loja (cover).
  const FOTOS_COM_ALFA = new Set(['cappuccino-retro/01', 'cappuccino-retro/02', 'cappuccino-retro/03', 'cappuccino-retro/04', 'v20-ultra/01', 'pop/06', 'pop/07', 'm9/04']);
  const FOTOS_SEM_ALFA = new Set(['x13/01', 'x13/07', 'x13/08', 'pop/01']);
  // Versões de 1600 px (largura real; abaixo disso só existe a de 800).
  const LARGURA_GRANDE = { 'cappuccino-retro/01': 1213, 'cappuccino-retro/02': 1371, 'cappuccino-retro/03': 1360, 'cappuccino-retro/04': 969, 'v20-ultra/01': 1246, 'pop/06': 995, 'pop/07': 993, 'x13/01': 851, 'x13/07': 955, 'x13/08': 955, 'pop/01': 993 };
  // Modelos sem foto recortada: o card mostra o aviso e a ficha mostra as fotos da loja (styleguide v2.0).
  const SEM_RECORTE = new Set([]);
  // Cor que é estampa (não tem hex): a amostra é uma imagem do projeto.
  const ESTAMPA_DA_COR = { Bandeira: 'reino-unido' };

  const ROTULO_DO_TIPO = { scooter: 'Scooter elétrica', 'e-bike': 'Bike elétrica', triciclo: 'Triciclo elétrico' };
  const SELO_DO_TIPO = { scooter: 'Scooter', 'e-bike': 'Bike', triciclo: 'Triciclo' };
  const FILTRO_DO_TIPO = { todos: 'Todos', scooter: 'Scooters', 'e-bike': 'Bikes elétricas', triciclo: 'Triciclos' };
  const TAMANHOS_DO_CARD = '(min-width: 80em) 300px, (min-width: 64em) 30vw, (min-width: 40em) 45vw, 92vw';
  const TAMANHOS_DA_GALERIA = '(min-width: 64em) 60vw, 100vw';

  function todos(raiz, seletor) {
    return Array.prototype.slice.call(raiz.querySelectorAll(seletor));
  }

  function elemento(tag, classe, texto) {
    const el = doc.createElement(tag);
    if (classe) el.className = classe;
    if (texto) el.textContent = texto;
    return el;
  }

  function movimentoReduzido() {
    try {
      return janela.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_erro) {
      return true;
    }
  }

  function telaGrande() {
    try {
      return janela.matchMedia('(min-width: 64em)').matches;
    } catch (_erro) {
      return false;
    }
  }

  function rolagem() {
    const l = janela.ES_LENIS;
    return l && typeof l.stop === 'function' && typeof l.start === 'function' ? l : null;
  }

  function gsapPronto() {
    const g = janela.gsap;
    return g && typeof g.timeline === 'function' && !movimentoReduzido() ? g : null;
  }

  // ------------------------------------------------------------ fotos

  function idDaFoto(src) {
    const m = String(src || '').match(/assets\/img\/(?:fabricante|vitrine)\/([^/]+)\/(\d+)/);
    return m ? `${m[1]}/${m[2]}` : null;
  }

  function tratamento(id) {
    if (FOTOS_COM_ALFA.has(id)) return 'alfa';
    if (FOTOS_SEM_ALFA.has(id)) return 'sem-alfa';
    return 'ambiente';
  }

  function marcarFoto(img, src) {
    const t = tratamento(idDaFoto(src || img.getAttribute('src')));
    img.classList.toggle('ev-sem-alfa', t === 'sem-alfa');
    img.classList.toggle('ev-ambiente', t === 'ambiente');
  }

  function fonteLeve(id) {
    const [modelo, n] = id.split('/');
    const base = `assets/img/vitrine/${modelo}/${n}`;
    const grande = LARGURA_GRANDE[id];
    return { src: `${base}-800.webp`, srcset: grande ? `${base}-800.webp 800w, ${base}-1600.webp ${grande}w` : `${base}-800.webp 800w` };
  }

  function versaoLeve(img, tamanhos) {
    const atual = img.getAttribute('src') || '';
    marcarFoto(img, atual);
    if (!/^assets\/img\/fabricante\//.test(atual)) return;
    const id = idDaFoto(atual);
    if (!id) return;
    const leve = fonteLeve(id);
    img.setAttribute('srcset', leve.srcset);
    img.setAttribute('sizes', tamanhos);
    img.setAttribute('src', leve.src);
  }

  function usarFotosLeves() {
    todos(doc, '.es-catalogo-card__foto').forEach((img) => versaoLeve(img, TAMANHOS_DO_CARD));
    todos(doc, 'template[data-es-modelo-detalhe]').forEach((molde) => {
      if (molde.content) todos(molde.content, '.es-catalogo-galeria__foto').forEach((img) => versaoLeve(img, TAMANHOS_DA_GALERIA));
    });
  }

  // ------------------------------------------------------------ topo, menu, flutuante, âncoras

  function ligarTopo() {
    const topo = doc.querySelector('[data-ev-topo]');
    if (!topo) return;
    let quadro = 0;
    const hero = doc.querySelector('[data-ev-hero]');
    const medir = () => {
      quadro = 0;
      const y = janela.scrollY;
      topo.classList.toggle('topo--rolado', y > 24);
      topo.classList.toggle('topo--escuro', Boolean(hero) && y < hero.offsetHeight - topo.offsetHeight);
    };
    janela.addEventListener('scroll', () => {
      if (!quadro) quadro = janela.requestAnimationFrame(medir);
    }, { passive: true });
    medir();

    const links = todos(topo, '.topo__link');
    if (!links.length || typeof janela.IntersectionObserver !== 'function') return;
    const pares = links.map((link) => {
      const url = new URL(link.href, janela.location.href);
      const secao = url.pathname === janela.location.pathname && url.hash ? doc.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      return { link, secao };
    }).filter((p) => p.secao);
    const observador = new janela.IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        pares.forEach((p) => {
          if (p.secao === entrada.target) p.link.setAttribute('aria-current', 'true');
          else p.link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    pares.forEach((p) => observador.observe(p.secao));
    todos(doc, 'main > section').filter((s) => !pares.some((p) => p.secao === s)).forEach((s) => observador.observe(s));
  }

  function ligarMenu() {
    const topo = doc.querySelector('[data-ev-topo]');
    const botao = topo ? topo.querySelector('.topo__menu') : null;
    const menu = doc.querySelector('[data-ev-menu]');
    if (!botao || !menu) return;
    const rotulo = botao.querySelector('[data-ev-menu-rotulo]');
    menu.hidden = false;
    botao.hidden = false;
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menu');
    let aberto = false;

    const definir = (abrir, devolverFoco) => {
      if (abrir === aberto) return;
      aberto = abrir;
      menu.classList.toggle('is-aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
      if (rotulo) rotulo.textContent = abrir ? 'Fechar' : 'Menu';
      doc.documentElement.classList.toggle('ev-menu-aberto', abrir);
      todos(doc, 'main, footer, .flutuante').forEach((el) => {
        if (abrir) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
      const l = rolagem();
      if (l) {
        if (abrir) l.stop();
        else l.start();
      }
      if (abrir) {
        const primeiro = menu.querySelector('.menu__item');
        if (primeiro) janela.requestAnimationFrame(() => primeiro.focus({ preventScroll: true }));
      } else if (devolverFoco) {
        botao.focus();
      }
    };

    botao.addEventListener('click', () => definir(!aberto, false));
    menu.addEventListener('click', (evento) => {
      const alvo = evento.target;
      if (!alvo || typeof alvo.closest !== 'function') return;
      if (alvo.closest('a')) definir(false, false);
    });
    doc.addEventListener('keydown', (evento) => {
      if (!aberto) return;
      if (evento.key === 'Escape') {
        evento.preventDefault();
        definir(false, true);
        return;
      }
      if (evento.key !== 'Tab') return;
      const alvos = [botao].concat(todos(menu, FOCAVEIS));
      const i = alvos.indexOf(doc.activeElement);
      if (i === -1) {
        evento.preventDefault();
        alvos[0].focus();
      } else if (evento.shiftKey && i === 0) {
        evento.preventDefault();
        alvos[alvos.length - 1].focus();
      } else if (!evento.shiftKey && i === alvos.length - 1) {
        evento.preventDefault();
        alvos[0].focus();
      }
    });
    try {
      janela.matchMedia('(min-width: 64em)').addEventListener('change', (mudanca) => {
        if (mudanca.matches) definir(false, false);
      });
    } catch (_erro) {
      return;
    }
  }

  function ligarFlutuante() {
    const botao = doc.querySelector('.flutuante');
    const hero = doc.querySelector('.hero');
    if (!botao || !hero || typeof janela.IntersectionObserver !== 'function') return;
    const observador = new janela.IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => botao.classList.toggle('flutuante--recolhido', entrada.isIntersecting));
    }, { rootMargin: '0px 0px -35% 0px' });
    observador.observe(hero);
  }

  function ligarFaq() {
    const itens = todos(doc, '.faq__item');
    if (!itens.length) return;
    if (!itens.some((i) => i.open)) itens[0].open = true;
    if (movimentoReduzido()) return;
    itens.forEach((item) => {
      const pergunta = item.querySelector('summary');
      const resposta = item.querySelector('.faq__resposta');
      if (!pergunta || !resposta || typeof resposta.animate !== 'function') return;
      let animacao = null;
      pergunta.addEventListener('click', (evento) => {
        evento.preventDefault();
        if (animacao) animacao.cancel();
        if (!item.open) {
          item.open = true;
          const altura = resposta.scrollHeight;
          animacao = resposta.animate([{ height: '0px', opacity: 0 }, { height: `${altura}px`, opacity: 1 }], { duration: 320, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
          animacao.onfinish = () => { animacao = null; };
        } else {
          const altura = resposta.scrollHeight;
          item.classList.add('is-fechando');
          animacao = resposta.animate([{ height: `${altura}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
          animacao.onfinish = () => {
            item.open = false;
            item.classList.remove('is-fechando');
            animacao = null;
          };
          animacao.oncancel = () => item.classList.remove('is-fechando');
        }
      });
    });
  }

  function ligarAncoras() {
    doc.addEventListener('click', (evento) => {
      const link = evento.target && evento.target.closest ? evento.target.closest('a[href]') : null;
      if (!link || evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey) return;
      const url = new URL(link.href, janela.location.href);
      if (url.pathname !== janela.location.pathname || !url.hash) return;
      const alvo = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!alvo) return;
      const lenis = janela.ES_LENIS;
      if (!lenis || typeof lenis.scrollTo !== 'function') return;
      evento.preventDefault();
      lenis.scrollTo(alvo, { duration: 1.1 });
      if (janela.history && typeof janela.history.replaceState === 'function') janela.history.replaceState(janela.history.state, '', url.hash);
      alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
    });
  }

  function ligarMapa() {
    const frame = doc.querySelector('[data-ev-mapa]');
    const endereco = doc.querySelector('.rodape__endereco');
    if (!frame || !endereco) return;
    const busca = (frame.getAttribute('data-ev-mapa-busca') || endereco.textContent).replace(/\s+/g, ' ').trim();
    if (!busca) return;
    const carregar = () => {
      if (frame.getAttribute('src')) return;
      frame.addEventListener('load', () => frame.parentElement.classList.add('is-carregado'), { once: true });
      frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(busca)}&t=m&z=16&output=embed&iwloc=near`;
    };
    if (typeof janela.IntersectionObserver !== 'function') {
      carregar();
      return;
    }
    const observador = new janela.IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) return;
      carregar();
      observador.disconnect();
    }, { rootMargin: '600px' });
    observador.observe(frame);
  }

  // ------------------------------------------------------------ dados lidos da vitrine gerada

  const DESTAQUES = [
    { rotulo: 'Velocidade', teste: /^velocidade/i },
    { rotulo: 'Potência', teste: /^pot[êe]ncia/i },
    { rotulo: 'Autonomia', teste: /^autonomia/i },
  ];

  function itensDaFicha(dl) {
    return dl ? todos(dl, '.es-catalogo-especificacoes__item').map((item) => {
      const dt = item.querySelector('dt');
      const dd = item.querySelector('dd');
      return { item, rotulo: dt ? dt.textContent.trim() : '', valor: dd ? dd.textContent.trim() : '' };
    }) : [];
  }

  function partesDoNumero(valor) {
    const partes = String(valor).match(/^([\d.,]+)\s*(.*)$/);
    return partes ? { numero: partes[1].replace(/^(\d{1,2})\.(\d{3})$/, '$1$2'), unidade: partes[2] } : null;
  }

  function numerosEmDestaque(itens, classe) {
    const escolhidos = DESTAQUES.map((d) => {
      const achado = itens.find((i) => d.teste.test(i.rotulo));
      return achado ? { rotulo: d.rotulo, valor: achado.valor, item: achado.item } : null;
    }).filter(Boolean);
    if (!escolhidos.length) return null;
    const dl = elemento('dl', `es-catalogo-especificacoes ev-numeros ${classe}`);
    escolhidos.forEach((e) => {
      const celula = elemento('div', 'es-catalogo-especificacoes__item');
      const dd = elemento('dd');
      const partes = partesDoNumero(e.valor);
      if (partes) {
        dd.appendChild(elemento('b', '', partes.numero));
        if (partes.unidade) dd.appendChild(elemento('span', '', partes.unidade));
      } else {
        dd.textContent = e.valor;
      }
      celula.appendChild(elemento('dt', '', e.rotulo));
      celula.appendChild(dd);
      dl.appendChild(celula);
    });
    return { dl, usados: escolhidos.map((e) => e.item), valores: escolhidos };
  }

  function moldeDo(id) {
    return id ? doc.querySelector(`template[data-es-modelo-detalhe="${id}"]`) : null;
  }

  function tipoDo(id) {
    const card = id ? doc.querySelector(`.es-catalogo-card[data-es-modelo="${id}"]`) : null;
    return card ? card.getAttribute('data-tipo') : null;
  }

  function coresDo(id) {
    const molde = moldeDo(id);
    return molde && molde.content ? todos(molde.content, '[data-es-cor]').map((b) => b.getAttribute('data-es-cor')).filter(Boolean) : [];
  }

  function dadosDoModelo(id) {
    const card = doc.querySelector(`.es-catalogo-card[data-es-modelo="${id}"]`);
    const molde = moldeDo(id);
    if (!card || !molde || !molde.content) return null;
    const nome = card.querySelector('.es-catalogo-card__nome');
    const preco = card.querySelector('.es-catalogo-preco__valor');
    const destaque = numerosEmDestaque(itensDaFicha(molde.content.querySelector('.es-catalogo-especificacoes')), '');
    const primeira = molde.content.querySelector('.es-catalogo-galeria__foto');
    const cor = molde.content.querySelector('[data-es-cor][aria-pressed="true"]') || molde.content.querySelector('[data-es-cor]');
    return {
      id,
      nome: nome ? nome.textContent.trim() : id,
      tipo: card.getAttribute('data-tipo'),
      preco: preco ? preco.textContent.trim() : '',
      numeros: destaque ? destaque.valores.map((v) => ({ rotulo: v.rotulo, partes: partesDoNumero(v.valor), valor: v.valor })) : [],
      foto: primeira ? primeira.getAttribute('src') : null,
      cor: cor ? cor.getAttribute('data-es-cor') : '',
    };
  }

  // ------------------------------------------------------------ vitrine: filtro, nota e cards

  function ligarVitrineVazia() {
    const aviso = doc.querySelector('[data-ev-vitrine-vazia]');
    if (!aviso) return;
    aviso.hidden = doc.querySelectorAll('.es-catalogo-card').length > 0;
  }

  function precoEmNumero(texto) {
    const limpo = String(texto).replace(/[^\d,]/g, '').replace(',', '.');
    const n = Number(limpo);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function listaComE(nomes) {
    if (nomes.length < 2) return nomes.join('');
    return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
  }

  function ligarFiltro() {
    const vitrine = doc.querySelector('[data-es-catalogo]');
    const filtro = vitrine ? vitrine.querySelector('[data-es-filtro]') : null;
    const nota = doc.querySelector('[data-ev-vitrine-nota]');
    const cards = vitrine ? todos(vitrine, '[data-es-modelo]') : [];
    const total = cards.length;
    todos(doc, '[data-ev-total-modelos]').forEach((el) => {
      if (total) el.textContent = el.classList.contains('visualmente-oculto') ? `${total} ` : String(total);
    });

    const resumo = (tipo) => {
      const doGrupo = cards.filter((c) => tipo === 'todos' || c.getAttribute('data-tipo') === tipo);
      if (!doGrupo.length) return '';
      const nomes = doGrupo.map((c) => {
        const n = c.querySelector('.es-catalogo-card__nome');
        return n ? n.textContent.trim() : '';
      }).filter(Boolean);
      if (tipo !== 'todos') return `${FILTRO_DO_TIPO[tipo] || 'Modelos'} da loja: ${listaComE(nomes)}.`;
      const precos = doGrupo.map((c) => {
        const p = c.querySelector('.es-catalogo-preco__valor');
        return p ? { texto: p.textContent.trim(), n: precoEmNumero(p.textContent) } : null;
      }).filter((p) => p && p.n !== null).sort((a, b) => a.n - b.n);
      const faixa = precos.length > 1 ? `, de ${precos[0].texto.replace(/,00$/, '')} a ${precos[precos.length - 1].texto.replace(/,00$/, '')} à vista` : '';
      return `${doGrupo.length === 1 ? 'O modelo' : `Os ${doGrupo.length} modelos`} da loja${faixa}. Toque na foto para ver a ficha completa.`;
    };
    const mostrarNota = (tipo) => {
      if (!nota) return;
      const texto = resumo(tipo);
      nota.textContent = texto;
      nota.hidden = !texto;
    };
    mostrarNota('todos');
    const lista = vitrine ? vitrine.querySelector('[data-es-lista]') : null;
    if (nota && lista) lista.parentNode.insertBefore(nota, lista);
    if (!filtro) return;

    todos(filtro, '[data-es-filtro-tipo]').forEach((botao) => {
      if (botao.querySelector('.ev-contagem')) return;
      const tipo = botao.getAttribute('data-es-filtro-tipo');
      const n = tipo === 'todos' ? total : cards.filter((c) => c.getAttribute('data-tipo') === tipo).length;
      if (FILTRO_DO_TIPO[tipo]) botao.textContent = FILTRO_DO_TIPO[tipo];
      const contagem = elemento('span', 'ev-contagem', String(n));
      contagem.setAttribute('aria-hidden', 'true');
      botao.insertBefore(contagem, botao.firstChild);
      botao.addEventListener('click', () => mostrarNota(tipo));
    });

    if (typeof janela.IntersectionObserver !== 'function') return;
    const sentinela = elemento('div', 'ev-sentinela');
    sentinela.setAttribute('aria-hidden', 'true');
    filtro.parentNode.insertBefore(sentinela, filtro);
    const topo = doc.querySelector('[data-ev-topo]');
    const folga = (topo ? topo.offsetHeight : 64) + 9;
    new janela.IntersectionObserver((entradas) => {
      const e = entradas[0];
      filtro.classList.toggle('is-fixo', !e.isIntersecting && e.boundingClientRect.top < folga);
    }, { rootMargin: `-${folga}px 0px 0px 0px`, threshold: 0 }).observe(sentinela);
  }

  function avisoSemRecorte() {
    const aviso = elemento('span', 'ev-card__pendente');
    aviso.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h3l2-3h6l2 3h3v13H4Z M15 13a3 3 0 1 1-6 0a3 3 0 1 1 6 0Z"/></svg>';
    aviso.appendChild(doc.createTextNode('Foto recortada pendente'));
    aviso.appendChild(elemento('span', '', 'Toque para ver as fotos da loja'));
    return aviso;
  }

  function ligarCards() {
    todos(doc, '.es-catalogo-card[data-es-modelo]').forEach((card) => {
      if (card.classList.contains('ev-card')) return;
      const id = card.getAttribute('data-es-modelo');
      const tipo = card.getAttribute('data-tipo');
      const molde = moldeDo(id);
      const ficha = molde && molde.content ? molde.content.querySelector('.es-catalogo-especificacoes') : null;
      const foto = card.querySelector('.es-catalogo-card__foto');
      const nome = card.querySelector('.es-catalogo-card__nome');
      const selos = todos(card, '.es-catalogo-selo');
      const especificacoes = card.querySelector('.es-catalogo-especificacoes');
      const preco = card.querySelector('.es-catalogo-preco');
      const comprar = card.querySelector('.es-catalogo-card__comprar');
      const detalhes = card.querySelector('.es-catalogo-card__detalhes');

      const caixa = elemento('div', 'ev-card__caixa');
      const midia = elemento('div', 'ev-card__midia');
      const corpo = elemento('div', 'ev-card__corpo');
      const cabeca = elemento('div', 'ev-card__cabeca');

      if (foto) {
        if (SEM_RECORTE.has(id)) {
          foto.hidden = true;
          midia.appendChild(avisoSemRecorte());
        }
        midia.appendChild(foto);
      }
      if (SELO_DO_TIPO[tipo]) midia.appendChild(elemento('span', 'ev-card__selo', SELO_DO_TIPO[tipo]));

      if (ROTULO_DO_TIPO[tipo]) cabeca.appendChild(elemento('p', 'ev-card__tipo', ROTULO_DO_TIPO[tipo]));
      if (nome) cabeca.appendChild(nome);
      const cores = coresDo(id);
      if (cores.length) cabeca.appendChild(elemento('p', 'ev-card__cores', `Cores: ${cores.join(' · ')}`));
      selos.forEach((s) => cabeca.appendChild(s));
      corpo.appendChild(cabeca);

      const destaque = numerosEmDestaque(itensDaFicha(ficha), 'es-catalogo-especificacoes--card');
      if (destaque) corpo.appendChild(destaque.dl);
      else if (especificacoes) corpo.appendChild(especificacoes);
      if (destaque && especificacoes) especificacoes.remove();

      if (preco) {
        const condicao = preco.querySelector('.es-catalogo-preco__condicao');
        const aVista = preco.querySelector('.es-catalogo-preco__a-vista');
        if (condicao && aVista && !preco.querySelector('.ev-preco__rotulo')) {
          const rotulo = elemento('span', 'ev-preco__rotulo', condicao.textContent.trim().replace(/^./, (c) => c.toUpperCase()));
          condicao.classList.add('visualmente-oculto');
          aVista.parentNode.insertBefore(rotulo, aVista);
          preco.appendChild(elemento('span', 'ev-preco__nota', 'Condições de pagamento pelo WhatsApp'));
        }
        corpo.appendChild(preco);
      }

      const acoes = elemento('div', 'ev-card__acoes');
      if (comprar) acoes.appendChild(comprar);
      if (detalhes) {
        detalhes.textContent = '+ Detalhes';
        acoes.appendChild(detalhes);
      }
      corpo.appendChild(acoes);

      caixa.appendChild(midia);
      caixa.appendChild(corpo);
      card.textContent = '';
      card.appendChild(caixa);
      card.classList.add('ev-card');

      const abrir = card.querySelector('[data-es-abrir]');
      if (abrir) midia.addEventListener('click', () => abrir.click());
    });
  }

  // ------------------------------------------------------------ hero: fluxo de luz no ângulo do E (33° da vertical)

  function ligarFluxo() {
    const hero = doc.querySelector('[data-ev-hero]');
    const canvas = hero ? hero.querySelector('[data-ev-fluxo]') : null;
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return null;
    const angulo = (-57 * Math.PI) / 180;
    const dx = Math.cos(angulo);
    const dy = Math.sin(angulo);
    const estado = { velocidade: 1, alvo: 1, mx: 0, my: 0 };
    let largura = 0;
    let altura = 0;
    let rastros = [];
    let quadro = 0;
    let ultimo = 0;
    let visivel = true;
    let proximaDescarga = 2.4;

    const sortear = (r, inicio) => {
      const perto = Math.random();
      r.perto = perto;
      r.comp = 36 + perto * 220 + Math.random() * 70;
      r.vel = 50 + perto * 300 + Math.random() * 90;
      r.larg = 0.5 + perto * 1.5;
      r.alfa = 0.1 + perto * 0.42;
      r.violeta = Math.random() < 0.16;
      r.descarga = false;
      const faixa = largura + altura * 0.8;
      if (inicio) {
        r.x = Math.random() * faixa - altura * 0.6;
        r.y = Math.random() * altura;
      } else if (Math.random() < 0.7) {
        r.x = Math.random() * faixa - altura * 0.6;
        r.y = altura + r.comp * Math.abs(dy) + Math.random() * 40;
      } else {
        r.x = -r.comp * dx - Math.random() * 40;
        r.y = Math.random() * altura * 1.1;
      }
      return r;
    };

    const descarga = () => {
      const r = sortear({}, false);
      r.comp = 380 + Math.random() * 260;
      r.vel = 1500 + Math.random() * 600;
      r.larg = 2.2;
      r.alfa = 0.95;
      r.violeta = false;
      r.descarga = true;
      r.perto = 1;
      rastros.push(r);
    };

    const medir = () => {
      const dpr = Math.min(janela.devicePixelRatio || 1, 2);
      largura = hero.clientWidth;
      altura = hero.clientHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const quantos = Math.max(60, Math.min(240, Math.round((largura * altura) / 7000)));
      rastros = rastros.filter((r) => !r.descarga).slice(0, quantos);
      while (rastros.length < quantos) rastros.push(sortear({}, true));
    };

    const desenhar = () => {
      ctx.clearRect(0, 0, largura, altura);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      rastros.forEach((r) => {
        const ox = estado.mx * r.perto * 26;
        const oy = estado.my * r.perto * 18;
        const comp = r.comp * (0.7 + estado.velocidade * 0.3);
        const hx = r.x + ox;
        const hy = r.y + oy;
        const tx = hx - dx * comp;
        const ty = hy - dy * comp;
        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        const cor = r.descarga ? '255, 255, 255' : (r.violeta ? '150, 70, 255' : '214, 196, 255');
        grad.addColorStop(0, `rgba(${cor}, 0)`);
        grad.addColorStop(1, `rgba(${cor}, ${r.alfa})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = r.violeta ? r.larg * 1.4 : r.larg;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        if (r.descarga || (r.violeta && r.perto > 0.6)) {
          ctx.fillStyle = r.descarga ? 'rgba(201, 168, 255, 0.9)' : 'rgba(150, 70, 255, 0.55)';
          ctx.beginPath();
          ctx.arc(hx, hy, r.descarga ? 2.6 : 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'source-over';
    };

    const passo = (agora) => {
      quadro = 0;
      const dt = Math.min(0.05, ultimo ? (agora - ultimo) / 1000 : 0.016);
      ultimo = agora;
      estado.velocidade += (estado.alvo - estado.velocidade) * Math.min(1, dt * 2.2);
      rastros.forEach((r) => {
        const v = r.vel * dt * (r.descarga ? 1 : estado.velocidade);
        r.x += dx * v;
        r.y += dy * v;
      });
      rastros = rastros.filter((r) => {
        const fora = r.y < -r.comp || r.x - dx * r.comp > largura + 40;
        if (!fora) return true;
        if (r.descarga) return false;
        sortear(r, false);
        return true;
      });
      proximaDescarga -= dt;
      if (proximaDescarga <= 0) {
        descarga();
        proximaDescarga = 2.2 + Math.random() * 3.2;
      }
      desenhar();
      if (visivel && !movimentoReduzido()) quadro = janela.requestAnimationFrame(passo);
    };

    const tocar = () => {
      if (quadro || !visivel || movimentoReduzido()) return;
      ultimo = 0;
      quadro = janela.requestAnimationFrame(passo);
    };
    const parar = () => {
      if (quadro) janela.cancelAnimationFrame(quadro);
      quadro = 0;
    };

    medir();
    desenhar();
    if (typeof janela.ResizeObserver === 'function') {
      new janela.ResizeObserver(() => {
        medir();
        desenhar();
      }).observe(hero);
    }
    if (typeof janela.IntersectionObserver === 'function') {
      new janela.IntersectionObserver((entradas) => {
        visivel = entradas[0].isIntersecting;
        if (visivel) tocar();
        else parar();
      }).observe(hero);
    }
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) parar();
      else tocar();
    });
    janela.addEventListener('scroll', () => {
      const p = Math.max(0, Math.min(1, janela.scrollY / Math.max(1, hero.offsetHeight)));
      estado.alvo = 1 + p * 5;
    }, { passive: true });
    if (janela.matchMedia) {
      const consulta = janela.matchMedia('(prefers-reduced-motion: reduce)');
      const mudou = () => {
        if (consulta.matches) {
          parar();
          estado.velocidade = 1;
          desenhar();
        } else {
          tocar();
        }
      };
      if (consulta.addEventListener) consulta.addEventListener('change', mudou);
    }
    tocar();
    return estado;
  }

  // ------------------------------------------------------------ modal

  function montarGaleria(lado) {
    const contador = elemento('p', 'ev-modal__contador');
    contador.setAttribute('aria-hidden', 'true');
    const anterior = elemento('button', 'ev-modal__seta ev-modal__seta--anterior');
    anterior.type = 'button';
    anterior.setAttribute('aria-label', 'Foto anterior');
    const proxima = elemento('button', 'ev-modal__seta ev-modal__seta--proxima');
    proxima.type = 'button';
    proxima.setAttribute('aria-label', 'Próxima foto');
    const miniaturas = elemento('div', 'ev-modal__miniaturas');
    miniaturas.setAttribute('role', 'group');
    miniaturas.setAttribute('aria-label', 'Fotos do modelo');
    lado.appendChild(contador);
    lado.appendChild(anterior);
    lado.appendChild(proxima);
    lado.appendChild(miniaturas);
    let comMouse = false;
    try {
      comMouse = janela.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (_erro) {
      comMouse = false;
    }
    if (!comMouse) {
      anterior.hidden = true;
      proxima.hidden = true;
    }

    const modal = lado.closest('[data-es-catalogo-modal]');
    const porCor = todos(lado, '[data-es-galeria]').filter((g) => g.getAttribute('data-es-galeria') !== '');
    const corMarcada = () => {
      const b = modal ? modal.querySelector('[data-es-cor][aria-pressed="true"]') : null;
      return b ? b.getAttribute('data-es-cor') : '';
    };

    const aviso = elemento('p', 'ev-modal__aviso-cor');
    aviso.hidden = true;
    lado.appendChild(aviso);
    const avisarCorSemFoto = () => {
      const cor = corMarcada();
      const semFoto = Boolean(cor) && porCor.length > 0 && !porCor.some((g) => g.getAttribute('data-es-galeria') === cor);
      aviso.textContent = semFoto ? `Ainda sem foto da cor ${cor}: a imagem mostra outra cor.` : '';
      aviso.hidden = !semFoto;
    };

    const visivel = () => lado.querySelector('[data-es-galeria]:not([hidden])') || lado.querySelector('[data-es-galeria]');
    const fotos = () => {
      const g = visivel();
      return g ? todos(g, '.es-catalogo-galeria__foto') : [];
    };
    const indice = () => {
      const g = visivel();
      return g && g.clientWidth ? Math.round(g.scrollLeft / g.clientWidth) : 0;
    };
    const ir = (i) => {
      const g = visivel();
      const lista = fotos();
      if (!g || !lista.length) return;
      const alvo = Math.max(0, Math.min(lista.length - 1, i));
      g.scrollTo({ left: alvo * g.clientWidth, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
    };
    const atualizar = () => {
      const lista = fotos();
      const i = indice();
      contador.textContent = `${i + 1} / ${lista.length}`;
      contador.hidden = lista.length < 2;
      miniaturas.hidden = lista.length < 2;
      lado.classList.toggle('tem-varias', lista.length > 1);
      anterior.disabled = i <= 0;
      proxima.disabled = i >= lista.length - 1;
      todos(miniaturas, '.ev-modal__mini').forEach((m, j) => m.setAttribute('aria-current', j === i ? 'true' : 'false'));
    };
    const refazer = () => {
      miniaturas.textContent = '';
      fotos().forEach((foto, j) => {
        const mini = elemento('button', 'ev-modal__mini');
        mini.type = 'button';
        mini.setAttribute('aria-label', `Foto ${j + 1}`);
        const img = elemento('img');
        img.src = foto.getAttribute('src');
        marcarFoto(img, img.src);
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        mini.appendChild(img);
        mini.addEventListener('click', () => ir(j));
        miniaturas.appendChild(mini);
      });
      const g = visivel();
      if (g) g.scrollLeft = 0;
      avisarCorSemFoto();
      atualizar();
    };
    anterior.addEventListener('click', () => ir(indice() - 1));
    proxima.addEventListener('click', () => ir(indice() + 1));
    todos(lado, '[data-es-galeria]').forEach((g) => {
      g.addEventListener('scroll', () => janela.requestAnimationFrame(atualizar), { passive: true });
    });
    refazer();
    return refazer;
  }

  const ORDEM_DA_FICHA = [
    'Fabricante', 'Motor', 'Bateria', 'Tempo de recarga', 'Carregador', 'Câmbio', 'Marchas', 'Assistência ao pedal',
    'Freios', 'Freio dianteiro', 'Freio traseiro', 'Suspensão', 'Pneus', 'Quadro', 'Display', 'Entre-eixos',
    'Dimensões', 'Carga máxima', 'Peso',
  ];
  const LINHA_DA_FICHA = /^([^:]{2,40}):\s+(.+)$/;
  const AVISO_DA_FICHA = 'Ficha informada pela loja e confirmada no atendimento. A autonomia é a máxima e varia com peso, relevo e modo de condução. A classificação legal de cada modelo é confirmada com você antes da compra. Imagens ilustrativas.';

  function subtituloAntes(el) {
    const anterior = el ? el.previousElementSibling : null;
    return anterior && anterior.classList.contains('es-catalogo-modal__subtitulo') ? anterior : null;
  }

  function organizarFicha(ficha, barra) {
    const conteudo = barra ? barra.parentNode : null;
    if (!conteudo) return null;
    const lista = conteudo.querySelector('.es-catalogo-lista-tecnica');
    const tituloLista = subtituloAntes(lista);
    const linhas = [];
    let chamada = null;
    if (ficha) {
      todos(ficha, '.es-catalogo-especificacoes__item').forEach((item) => {
        const dt = item.querySelector('dt');
        const dd = item.querySelector('dd');
        if (dt && dd) linhas.push([dt.textContent.trim(), dd.textContent.trim()]);
      });
      const tituloFicha = subtituloAntes(ficha);
      if (tituloFicha) tituloFicha.remove();
      ficha.remove();
    }
    if (lista) {
      todos(lista, 'li').forEach((li) => {
        const m = LINHA_DA_FICHA.exec(li.textContent.trim());
        if (!m) return;
        if (m[1] === 'Chamada') chamada = m[2];
        else linhas.push([m[1], m[2]]);
        li.remove();
      });
      if (!lista.children.length) {
        if (tituloLista) tituloLista.remove();
        lista.remove();
      } else if (tituloLista) {
        tituloLista.textContent = 'Itens de série';
      }
    }
    const posicao = (rotulo) => {
      const i = ORDEM_DA_FICHA.indexOf(rotulo);
      return i < 0 ? ORDEM_DA_FICHA.length - 1.5 : i;
    };
    const ordenadas = linhas.map((l, i) => [l, i]).sort((a, b) => posicao(a[0][0]) - posicao(b[0][0]) || a[1] - b[1]).map((x) => x[0]);
    const depois = (tituloLista && tituloLista.isConnected) ? tituloLista : barra;
    if (ordenadas.length) {
      const dl = elemento('dl', 'es-catalogo-especificacoes ev-ficha');
      ordenadas.forEach(([rotulo, valor]) => {
        const item = elemento('div', 'es-catalogo-especificacoes__item');
        item.appendChild(elemento('dt', '', rotulo));
        item.appendChild(elemento('dd', '', valor));
        dl.appendChild(item);
      });
      conteudo.insertBefore(elemento('h3', 'es-catalogo-modal__subtitulo', 'Ficha técnica'), depois);
      conteudo.insertBefore(dl, depois);
      conteudo.insertBefore(elemento('p', 'ev-modal__aviso-ficha', AVISO_DA_FICHA), barra);
    }
    return chamada;
  }

  function ligarModal() {
    const modal = doc.querySelector('[data-es-catalogo-modal]');
    const conteudo = modal ? modal.querySelector('[data-es-catalogo-conteudo]') : null;
    const caixa = modal ? modal.querySelector('[role="dialog"]') : null;
    if (!conteudo || !caixa) return;
    modal.classList.add('ev-modal');
    caixa.setAttribute('data-lenis-prevent', '');
    let refazerGaleria = null;
    let rotuloCor = null;

    const nomeDaCor = () => {
      const marcada = conteudo.querySelector('[data-es-cor][aria-pressed="true"]');
      return marcada ? marcada.getAttribute('data-es-cor') : '';
    };

    const montarNavegacao = (lado, id) => {
      const ids = todos(doc, '.es-catalogo-card[data-es-modelo]').filter((c) => !c.hidden).map((c) => c.getAttribute('data-es-modelo'));
      const i = ids.indexOf(id);
      if (i < 0 || ids.length < 2) return;
      const nav = elemento('div', 'ev-modal__navegacao');
      const botao = (classe, rotulo, alvo) => {
        const b = elemento('button', `ev-modal__nav ${classe}`);
        b.type = 'button';
        b.setAttribute('aria-label', rotulo);
        b.addEventListener('click', () => {
          const abrir = doc.querySelector(`[data-es-abrir="${alvo}"]`);
          if (abrir) abrir.click();
        });
        return b;
      };
      nav.appendChild(botao('ev-modal__nav--anterior', 'Modelo anterior', ids[(i - 1 + ids.length) % ids.length]));
      nav.appendChild(elemento('span', 'ev-modal__nav-texto', `${i + 1} / ${ids.length}`));
      nav.appendChild(botao('ev-modal__nav--proximo', 'Próximo modelo', ids[(i + 1) % ids.length]));
      lado.appendChild(nav);
    };

    const montar = () => {
      if (!conteudo.firstElementChild || conteudo.querySelector('.ev-modal__painel')) return;
      const galerias = conteudo.querySelector('.es-catalogo-galerias');
      const titulo = conteudo.querySelector('.es-catalogo-modal__titulo');
      const cores = conteudo.querySelector('.es-catalogo-cores');
      const barra = conteudo.querySelector('.es-catalogo-modal__barra');
      const comprar = barra ? barra.querySelector('a[data-es-link][data-modelo]') : null;
      const id = comprar ? comprar.getAttribute('data-modelo') : null;

      let lado = null;
      if (galerias) {
        lado = elemento('div', 'ev-modal__galeria');
        conteudo.insertBefore(lado, galerias);
        lado.appendChild(galerias);
        todos(galerias, '.es-catalogo-galeria__foto').forEach((img) => marcarFoto(img));
      }

      const painel = elemento('div', 'ev-modal__painel');
      const topo = elemento('div', 'ev-modal__topo');
      const corpo = elemento('div', 'ev-modal__corpo');
      const base = elemento('div', 'ev-modal__base');
      corpo.setAttribute('data-lenis-prevent', '');
      const tipo = ROTULO_DO_TIPO[tipoDo(id)];
      topo.appendChild(elemento('p', 'ev-modal__eyebrow', tipo ? `${NOME_DA_LOJA} · ${tipo}` : NOME_DA_LOJA));
      if (titulo) topo.appendChild(titulo);

      const ficha = conteudo.querySelector('.es-catalogo-especificacoes');
      const destaque = numerosEmDestaque(itensDaFicha(ficha), 'ev-numeros--modal');
      if (destaque) {
        topo.appendChild(destaque.dl);
        destaque.usados.forEach((item) => item.remove());
      }
      const chamada = organizarFicha(ficha, barra);
      if (chamada) topo.insertBefore(elemento('p', 'ev-modal__chamada', chamada), destaque ? destaque.dl : null);

      Array.prototype.slice.call(conteudo.children).forEach((filho) => {
        if (filho === lado || filho === barra || filho === cores) return;
        corpo.appendChild(filho);
      });

      rotuloCor = null;
      if (cores) {
        todos(cores, '.es-catalogo-cor').forEach((b) => {
          if (b.querySelector('.es-catalogo-cor__amostra')) return;
          const estampa = ESTAMPA_DA_COR[b.getAttribute('data-es-cor')];
          if (!estampa) {
            b.classList.add('ev-cor--texto');
            return;
          }
          const amostra = elemento('span', `es-catalogo-cor__amostra ev-estampa ev-estampa--${estampa}`);
          amostra.setAttribute('aria-hidden', 'true');
          b.insertBefore(amostra, b.firstChild);
        });
        const linha = elemento('div', 'ev-modal__cores');
        const rotulo = elemento('p', 'ev-modal__cor', 'Cor: ');
        rotuloCor = elemento('strong', '', nomeDaCor());
        rotulo.appendChild(rotuloCor);
        linha.appendChild(rotulo);
        linha.appendChild(cores);
        base.appendChild(linha);
      }
      if (barra) base.appendChild(barra);
      base.appendChild(elemento('p', 'ev-modal__nota', 'Atendimento direto pelo WhatsApp da loja.'));

      painel.appendChild(topo);
      painel.appendChild(corpo);
      painel.appendChild(base);
      conteudo.appendChild(painel);
      refazerGaleria = lado ? montarGaleria(lado) : null;
      if (lado) montarNavegacao(lado, id);
    };

    const lightbox = elemento('div', 'ev-lightbox');
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Foto ampliada');
    const fotoGrande = elemento('img', 'ev-lightbox__foto');
    fotoGrande.alt = '';
    const fecharFoto = elemento('button', 'ev-lightbox__fechar');
    fecharFoto.type = 'button';
    fecharFoto.setAttribute('aria-label', 'Fechar a foto ampliada');
    fecharFoto.textContent = '×';
    lightbox.appendChild(fotoGrande);
    lightbox.appendChild(fecharFoto);
    caixa.appendChild(lightbox);
    let voltarPara = null;
    const fecharLightbox = () => {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      fotoGrande.removeAttribute('src');
      if (voltarPara) voltarPara.focus();
      voltarPara = null;
    };
    fecharFoto.addEventListener('click', fecharLightbox);
    lightbox.addEventListener('click', (evento) => {
      if (evento.target === lightbox) fecharLightbox();
    });
    janela.addEventListener('keydown', (evento) => {
      if (lightbox.hidden || evento.key !== 'Escape') return;
      evento.preventDefault();
      evento.stopPropagation();
      fecharLightbox();
    }, true);
    conteudo.addEventListener('click', (evento) => {
      const foto = evento.target && evento.target.closest ? evento.target.closest('.es-catalogo-galeria__foto') : null;
      if (!foto) return;
      voltarPara = foto.closest('.ev-modal__galeria');
      fotoGrande.src = foto.currentSrc || foto.getAttribute('src');
      fotoGrande.alt = foto.alt || '';
      fotoGrande.classList.toggle('ev-sem-alfa', foto.classList.contains('ev-sem-alfa'));
      lightbox.hidden = false;
      fecharFoto.focus();
    });

    if (typeof janela.MutationObserver === 'function') {
      new janela.MutationObserver(montar).observe(conteudo, { childList: true });
    }
    modal.addEventListener('click', (evento) => {
      const alvo = evento.target;
      if (!alvo || typeof alvo.closest !== 'function' || !alvo.closest('[data-es-cor]')) return;
      if (rotuloCor) rotuloCor.textContent = nomeDaCor();
      if (refazerGaleria) refazerGaleria();
    });
  }

  // ------------------------------------------------------------ movimento próprio (GSAP)

  function ligarHero(gsap, fluxo) {
    const hero = doc.querySelector('[data-ev-hero]');
    if (!hero || movimentoReduzido()) return;
    const linhas = todos(hero, '.hero__linha > span');
    const blocos = todos(doc, '[data-ev-hero-bloco]');
    const raio = hero.querySelector('[data-ev-raio]');
    const simbolo = hero.querySelector('[data-ev-simbolo]');
    const raioDoSimbolo = hero.querySelector('[data-ev-simbolo-raio]');
    const aurora = hero.querySelector('[data-ev-aurora]');
    const canvas = hero.querySelector('[data-ev-fluxo]');
    const conteudo = hero.querySelector('.hero__conteudo');

    const linha = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (aurora) linha.fromTo(aurora, { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'power3.out' }, 0);
    if (canvas) linha.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.1);
    if (raio) {
      linha.fromTo(raio, { x: '-12vw', rotation: 33, opacity: 0 }, { x: '112vw', rotation: 33, opacity: 1, duration: 1.15, ease: 'power3.inOut' }, 0.15);
      linha.to(raio, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 1.0);
    }
    if (fluxo) linha.add(() => { fluxo.velocidade = 9; }, 0.2);
    if (linhas.length) linha.fromTo(linhas, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.3);
    if (simbolo) linha.fromTo(simbolo, { opacity: 0, scale: 1.12 }, { opacity: getComputedStyle(simbolo).opacity, scale: 1, duration: 2, ease: 'power3.out', clearProps: 'opacity' }, 0.45);
    if (raioDoSimbolo) {
      linha.fromTo(raioDoSimbolo, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power4.in', clearProps: 'clipPath' }, 0.95);
      linha.fromTo(raioDoSimbolo, { filter: 'brightness(2.4) drop-shadow(0 0 30px rgb(119 1 250 / 1))' }, { filter: 'brightness(1) drop-shadow(0 0 18px rgb(119 1 250 / 0.85))', duration: 1.2, ease: 'power2.out', clearProps: 'filter' }, 1.5);
      linha.to(raioDoSimbolo, { opacity: 0.72, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 2.8);
    }
    if (blocos.length) linha.fromTo(blocos, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.75);

    if (simbolo && janela.matchMedia && janela.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const sx = gsap.quickTo(simbolo, 'x', { duration: 1.2, ease: 'power3.out' });
      const sy = gsap.quickTo(simbolo, 'y', { duration: 1.2, ease: 'power3.out' });
      const ax = aurora ? gsap.quickTo(aurora, 'x', { duration: 1.6, ease: 'power3.out' }) : null;
      const ay = aurora ? gsap.quickTo(aurora, 'y', { duration: 1.6, ease: 'power3.out' }) : null;
      hero.addEventListener('pointermove', (evento) => {
        const caixa = hero.getBoundingClientRect();
        const nx = (evento.clientX - caixa.left) / caixa.width - 0.5;
        const ny = (evento.clientY - caixa.top) / caixa.height - 0.5;
        sx(nx * -28);
        sy(ny * -20);
        if (ax) ax(nx * 40);
        if (ay) ay(ny * 30);
        if (fluxo) {
          fluxo.mx = nx;
          fluxo.my = ny;
        }
      });
    }

    if (!janela.ScrollTrigger) return;
    const rolagem = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    if (conteudo) gsap.fromTo(conteudo, { yPercent: 0 }, { yPercent: -14, ease: 'none', scrollTrigger: rolagem });
    if (simbolo) gsap.fromTo(simbolo, { yPercent: 0, rotation: 0 }, { yPercent: 18, rotation: -4, ease: 'none', scrollTrigger: Object.assign({}, rolagem) });
  }

  function ligarShowroom(gsap) {
    const secao = doc.querySelector('[data-ev-showroom]');
    if (!secao || !janela.ScrollTrigger) return;
    const regua = secao.querySelector('[data-ev-regua]');
    const fotos = todos(secao, '.showroom__foto');
    if (regua) gsap.fromTo(regua, { xPercent: 0 }, { xPercent: -25, ease: 'none', scrollTrigger: { trigger: secao, start: 'top bottom', end: 'bottom top', scrub: true } });
    fotos.forEach((foto, i) => {
      gsap.fromTo(foto,
        { clipPath: 'polygon(0 100%, 0 100%, 0 100%, 0 100%, 0 100%)' },
        {
          clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 43px, 100% 100%, 0 100%)',
          duration: 1.1,
          delay: i * 0.12,
          ease: 'power4.out',
          clearProps: 'clipPath',
          scrollTrigger: { trigger: foto, start: 'top bottom', once: true },
        });
    });
  }

  function iniciar() {
    ligarTopo();
    ligarMenu();
    ligarFlutuante();
    ligarMapa();
    ligarVitrineVazia();
    ligarAncoras();
    usarFotosLeves();
    ligarFiltro();
    ligarCards();
    ligarModal();
    ligarFaq();
    const fluxo = ligarFluxo();
    const gsap = gsapPronto();
    if (!gsap) return;
    try {
      if (janela.ScrollTrigger) gsap.registerPlugin(janela.ScrollTrigger);
      ligarHero(gsap, fluxo);
      ligarShowroom(gsap);
    } catch (_erro) {
      gsap.set('[data-ev-hero-bloco], .hero__linha > span, [data-ev-raio], [data-ev-simbolo], [data-ev-simbolo-raio], [data-ev-aurora], [data-ev-fluxo], .hero__conteudo, .showroom__foto, .showroom__regua', { clearProps: 'all' });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);
