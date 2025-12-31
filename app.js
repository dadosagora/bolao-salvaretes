// Painel de bolões da Carol

// Salvaretes
const nomeInput = document.getElementById("nome-participante");
const apostaInputs = Array.from(document.querySelectorAll(".aposta-num"));
const listaApostasEl = document.getElementById("lista-apostas");
const totalApostasEl = document.getElementById("total-apostas");
const resultadoSalvaretesEl = document.getElementById("resultado-salvaretes");
const resumoSorteioEl = document.getElementById("resumo-sorteio-print");
const listaFrequenciaEl = document.getElementById("lista-frequencia");
const totalNumerosUsadosEl = document.getElementById("total-numeros-usados");
const btnAdicionar = document.getElementById("btn-adicionar");
const btnLimpar = document.getElementById("btn-limpar");
const btnImprimir = document.getElementById("btn-imprimir");

// Sorteio global
const sorteioInputs = Array.from(document.querySelectorAll(".sorteio-num"));
const btnCalcular = document.getElementById("btn-calcular");
const btnLimparSorteio = document.getElementById("btn-limpar-sorteio");

// Mensagens
const mensagemErroEl = document.getElementById("mensagem-erro");

// Abas
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

// Outros bolões
const novoGrupoNomeInput = document.getElementById("novo-grupo-nome");
const btnCriarGrupo = document.getElementById("btn-criar-grupo");
const listaGruposEl = document.getElementById("lista-grupos");
const btnAddGrupoTop = document.getElementById("btn-add-grupo");

// Resultado geral
const listaResultadoGeralEl = document.getElementById("lista-resultado-geral");

// Storage keys
const STORAGE_KEY_SALVARETES = "bolaoSalvaretes_v1";
const STORAGE_KEY_GRUPOS = "bolaoGrupos_v1";

// Estado
let apostas = [];
let grupos = [];
let numerosSorteioAtual = null;

//// UTILITÁRIOS DE ERRO

function limparMensagemErro() {
  if (!mensagemErroEl) return;
  mensagemErroEl.textContent = "";
  mensagemErroEl.style.color = "var(--muted)";
}

function mostrarErro(msg) {
  if (!mensagemErroEl) return;
  mensagemErroEl.textContent = msg;
  mensagemErroEl.style.color = "#f87171";
}

//// AUTO-AVANÇAR CAMPOS NUMÉRICOS

function setupAutoAdvance(inputs) {
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 2) v = v.slice(0, 2);
      e.target.value = v;

      if (v.length === 2 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && e.target.value === "" && idx > 0) {
        inputs[idx - 1].focus();
      }
    });
  });
}

setupAutoAdvance(apostaInputs);
setupAutoAdvance(sorteioInputs);

//// LOCALSTORAGE

function salvarApostas() {
  try {
    localStorage.setItem(STORAGE_KEY_SALVARETES, JSON.stringify(apostas));
  } catch (e) {
    console.warn("Não foi possível salvar apostas:", e);
  }
}

function carregarApostas() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_SALVARETES);
    if (!salvo) return;
    const dados = JSON.parse(salvo);
    if (Array.isArray(dados)) apostas = dados;
  } catch (e) {
    console.warn("Não foi possível carregar apostas:", e);
  }
}

function salvarGrupos() {
  try {
    localStorage.setItem(STORAGE_KEY_GRUPOS, JSON.stringify(grupos));
  } catch (e) {
    console.warn("Não foi possível salvar grupos:", e);
  }
}

function carregarGrupos() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_GRUPOS);
    if (!salvo) return;
    const dados = JSON.parse(salvo);
    if (Array.isArray(dados)) {
      // migração: garantir id e array de apostas
      grupos = dados.map((g) => {
        const id = g.id || (Date.now() + Math.random().toString(16).slice(2));
        const apostasArr = Array.isArray(g.apostas) ? g.apostas : [];
        return { id, nome: g.nome || "Bolão sem nome", apostas: apostasArr };
      });
    }
  } catch (e) {
    console.warn("Não foi possível carregar grupos:", e);
  }
}

//// VALIDAÇÃO DE NÚMEROS

function obterNumerosDeInputs(inputs, contextoTexto) {
  const valores = inputs
    .map((input) => input.value.trim())
    .filter((v) => v !== "");

  if (valores.length < 6) {
    throw new Error(`Informe pelo menos 6 números ${contextoTexto}.`);
  }

  const numeros = valores.map((v) => Number(v));

  if (numeros.some((n) => Number.isNaN(n))) {
    throw new Error(`Todos os campos ${contextoTexto} devem conter números.`);
  }

  if (numeros.some((n) => n < 1 || n > 60)) {
    throw new Error(`Os números ${contextoTexto} devem estar entre 1 e 60.`);
  }

  const set = new Set(numeros);
  if (set.size !== numeros.length) {
    throw new Error(`Não é permitido repetir números ${contextoTexto}.`);
  }

  return numeros.sort((a, b) => a - b);
}

function obterNumerosApostaSalvaretes() {
  const numeros = obterNumerosDeInputs(
    apostaInputs,
    "na aposta do Bolão Salvaretes"
  );
  if (numeros.length > 7) {
    throw new Error("No Bolão Salvaretes, use no máximo 7 números por aposta.");
  }
  return numeros;
}

function obterNumerosSorteio() {
  const valores = sorteioInputs.map((input) => input.value.trim());

  if (valores.some((v) => v === "")) {
    throw new Error("Preencha todos os 6 números do sorteio.");
  }

  const numeros = valores.map((v) => Number(v));

  if (numeros.some((n) => Number.isNaN(n))) {
    throw new Error("Todos os campos do sorteio devem conter números.");
  }

  if (numeros.some((n) => n < 1 || n > 60)) {
    throw new Error("Os números do sorteio devem estar entre 1 e 60.");
  }

  const set = new Set(numeros);
  if (set.size !== numeros.length) {
    throw new Error("Não é permitido repetir números no sorteio.");
  }

  if (numeros.length !== 6) {
    throw new Error("Você deve informar exatamente 6 números no sorteio.");
  }

  return numeros.sort((a, b) => a - b);
}

//// TABS

function setActiveTab(tabId) {
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tabTarget === tabId);
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const alvo = btn.dataset.tabTarget;
    setActiveTab(alvo);
  });
});

if (btnAddGrupoTop) {
  btnAddGrupoTop.addEventListener("click", () => {
    setActiveTab("outros");
    if (novoGrupoNomeInput) {
      novoGrupoNomeInput.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => novoGrupoNomeInput.focus(), 300);
    }
  });
}

//// LISTA SALVARETES

function atualizarListaApostasSalvaretes() {
  if (!listaApostasEl || !totalApostasEl) return;

  listaApostasEl.innerHTML = "";

  if (apostas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Nenhuma aposta cadastrada ainda.";
    listaApostasEl.appendChild(p);
    totalApostasEl.textContent = "0";
    return;
  }

  totalApostasEl.textContent = String(apostas.length);

  const maioresAcertos = apostas.reduce((max, a) => {
    if (typeof a.acertos !== "number") return max;
    return a.acertos > max ? a.acertos : max;
  }, 0);

  apostas.forEach((aposta, index) => {
    const item = document.createElement("div");
    item.className = "bet-item";

    const header = document.createElement("div");
    header.className = "bet-header";

    const left = document.createElement("div");
    const nomeEl = document.createElement("div");
    nomeEl.className = "bet-name";
    nomeEl.textContent = aposta.nome;

    const indexEl = document.createElement("div");
    indexEl.className = "bet-index";
    indexEl.textContent = `#${index + 1}`;

    left.appendChild(nomeEl);
    left.appendChild(indexEl);

    const acertosEl = document.createElement("div");
    acertosEl.className = "bet-acertos";
    if (typeof aposta.acertos === "number") {
      acertosEl.textContent = `Acertos: ${aposta.acertos}`;
      if (aposta.acertos > 0 && aposta.acertos === maioresAcertos) {
        acertosEl.classList.add("highlight");
      }
    } else {
      acertosEl.textContent = "Acertos: –";
    }

    header.appendChild(left);
    header.appendChild(acertosEl);

    const numerosEl = document.createElement("div");
    numerosEl.className = "bet-numbers";
    aposta.numeros.forEach((n) => {
      const chip = document.createElement("span");
      chip.className = "chip-number";
      chip.textContent = String(n).padStart(2, "0");
      numerosEl.appendChild(chip);
    });

    const actions = document.createElement("div");
    actions.className = "bet-actions";

    const editarBtn = document.createElement("button");
    editarBtn.className = "bet-btn";
    editarBtn.textContent = "editar";
    editarBtn.addEventListener("click", () => editarApostaSalvaretes(aposta.id));

    const excluirBtn = document.createElement("button");
    excluirBtn.className = "bet-btn danger";
    excluirBtn.textContent = "excluir";
    excluirBtn.addEventListener("click", () => excluirApostaSalvaretes(aposta.id));

    actions.appendChild(editarBtn);
    actions.appendChild(excluirBtn);

    item.appendChild(header);
    item.appendChild(numerosEl);
    item.appendChild(actions);

    listaApostasEl.appendChild(item);
  });
}

function limparCamposApostaSalvaretes() {
  if (nomeInput) nomeInput.value = "";
  apostaInputs.forEach((input) => (input.value = ""));
  limparMensagemErro();
}

function editarApostaSalvaretes(id) {
  const aposta = apostas.find((a) => a.id === id);
  if (!aposta) return;
  if (nomeInput) nomeInput.value = aposta.nome;
  apostaInputs.forEach((input) => (input.value = ""));
  aposta.numeros.forEach((n, idx) => {
    if (apostaInputs[idx]) apostaInputs[idx].value = n;
  });
  apostas = apostas.filter((a) => a.id !== id);
  salvarApostas();
  atualizarListaApostasSalvaretes();
  atualizarResultadoSalvaretes();
  atualizarFrequenciaNumerosSalvaretes();
  atualizarResultadoGeral();
}

function excluirApostaSalvaretes(id) {
  apostas = apostas.filter((a) => a.id !== id);
  salvarApostas();
  atualizarListaApostasSalvaretes();
  atualizarResultadoSalvaretes();
  atualizarFrequenciaNumerosSalvaretes();
  atualizarResultadoGeral();
}

//// RESUMO SORTEIO

function atualizarResumoSorteioPrint() {
  if (!resumoSorteioEl) return;

  if (
    !numerosSorteioAtual ||
    !Array.isArray(numerosSorteioAtual) ||
    numerosSorteioAtual.length !== 6
  ) {
    resumoSorteioEl.textContent = "Números sorteados: Carol ainda não inseriu.";
  } else {
    const nums = numerosSorteioAtual
      .map((n) => String(n).padStart(2, "0"))
      .join(" · ");
    resumoSorteioEl.textContent = `Números sorteados: ${nums}`;
  }
}

//// RESULTADO SALVARETES

function atualizarResultadoSalvaretes() {
  if (!resultadoSalvaretesEl) return;

  resultadoSalvaretesEl.innerHTML = "";

  if (apostas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "O resultado aparecerá aqui depois do cálculo.";
    resultadoSalvaretesEl.appendChild(p);
    return;
  }

  const calculadas = apostas.filter((a) => typeof a.acertos === "number");

  if (calculadas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Depois de informar os números sorteados, clique em 'calcular acertos'.";
    resultadoSalvaretesEl.appendChild(p);
    return;
  }

  const maior = calculadas.reduce(
    (max, a) => (a.acertos > max ? a.acertos : max),
    0
  );
  const melhores = calculadas.filter(
    (a) => a.acertos === maior && maior > 0
  );

  const tituloMelhores = document.createElement("div");
  tituloMelhores.className = "result-title";
  tituloMelhores.textContent = "Melhores apostas";
  resultadoSalvaretesEl.appendChild(tituloMelhores);

  if (melhores.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Nenhuma aposta teve acertos ainda.";
    resultadoSalvaretesEl.appendChild(p);
  } else {
    melhores.forEach((a) => {
      const linha = document.createElement("div");
      linha.className = "result-line";

      const nome = document.createElement("span");
      nome.className = "result-name";
      nome.textContent = a.nome;

      const badge = document.createElement("span");
      badge.className = "result-badge";
      badge.textContent = `${a.acertos} acertos`;

      linha.appendChild(nome);
      linha.appendChild(badge);
      resultadoSalvaretesEl.appendChild(linha);
    });
  }

  const divider = document.createElement("div");
  divider.style.margin = "6px 0";
  divider.style.height = "1px";
  divider.style.background = "#e5e7eb";
  resultadoSalvaretesEl.appendChild(divider);

  const tituloResumo = document.createElement("div");
  tituloResumo.className = "result-title";
  tituloResumo.textContent = "Resumo";
  resultadoSalvaretesEl.appendChild(tituloResumo);

  const mapa = new Map();
  calculadas.forEach((a) => {
    const k = a.acertos;
    mapa.set(k, (mapa.get(k) || 0) + 1);
  });

  const resumo = [];
  Array.from(mapa.entries())
    .sort((a, b) => b[0] - a[0])
    .forEach(([acertos, qtd]) => {
      resumo.push(
        `${qtd} aposta${qtd > 1 ? "s" : ""} com ${acertos} acerto${
          acertos > 1 ? "s" : ""
        }`
      );
    });

  const resumoEl = document.createElement("div");
  resumoEl.className = "hint";
  resumoEl.textContent = resumo.join(" · ");
  resultadoSalvaretesEl.appendChild(resumoEl);
}

//// FREQUÊNCIA SALVARETES

function atualizarFrequenciaNumerosSalvaretes() {
  if (!listaFrequenciaEl || !totalNumerosUsadosEl) return;

  listaFrequenciaEl.innerHTML = "";

  if (apostas.length === 0) {
    totalNumerosUsadosEl.textContent = "0 nºs";
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Os números mais jogados vão aparecer aqui depois que você cadastrar as apostas.";
    listaFrequenciaEl.appendChild(p);
    return;
  }

  const freq = new Map();

  apostas.forEach((a) => {
    a.numeros.forEach((n) => {
      freq.set(n, (freq.get(n) || 0) + 1);
    });
  });

  const totalNumeros = Array.from(freq.values()).reduce(
    (soma, v) => soma + v,
    0
  );
  totalNumerosUsadosEl.textContent = `${totalNumeros} nºs`;

  const ordenados = Array.from(freq.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] - b[0];
  });

  const top = ordenados.slice(0, 15);

  top.forEach(([numero, qtd]) => {
    const item = document.createElement("div");
    item.className = "freq-item";

    const numSpan = document.createElement("span");
    numSpan.className = "freq-item-num";
    numSpan.textContent = String(numero).padStart(2, "0");

    const countSpan = document.createElement("span");
    countSpan.className = "freq-item-count";
    countSpan.textContent = `${qtd}x`;

    item.appendChild(numSpan);
    item.appendChild(countSpan);

    listaFrequenciaEl.appendChild(item);
  });
}

//// OUTROS BOLÕES (GRUPOS) – COM VER MAIS / VER MENOS E ATÉ 20 NÚMEROS

function renderizarGrupos() {
  if (!listaGruposEl) return;

  listaGruposEl.innerHTML = "";

  if (grupos.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Nenhum outro bolão cadastrado ainda. Crie um grupo para a firma, rádio, amigos, etc.";
    listaGruposEl.appendChild(p);
    return;
  }

  grupos.forEach((grupo, indexGrupo) => {
    const card = document.createElement("div");
    card.className = "grupo-card";
    card.dataset.grupoId = grupo.id;

    const header = document.createElement("div");
    header.className = "grupo-header";

    const nomeSpan = document.createElement("div");
    nomeSpan.className = "grupo-nome";
    nomeSpan.textContent = grupo.nome;

    const badge = document.createElement("div");
    badge.className = "grupo-badge";
    const qtdApostas = grupo.apostas.length;
    badge.textContent = `${qtdApostas} aposta${qtdApostas === 1 ? "" : "s"}`;

    header.appendChild(nomeSpan);
    header.appendChild(badge);
    card.appendChild(header);

    const sub = document.createElement("div");
    sub.className = "grupo-subtitle";
    sub.textContent =
      "Toque em “ver mais” para cadastrar e ver as apostas deste bolão.";
    card.appendChild(sub);

    const detalhes = document.createElement("div");
    detalhes.className = "grupo-detalhes";

    // descrição
    const fieldDesc = document.createElement("div");
    fieldDesc.className = "field";

    const labelDesc = document.createElement("div");
    labelDesc.className = "field-label";
    labelDesc.innerHTML =
      '<span class="dot"></span> Nome/descrição da aposta (opcional)';
    const inputDesc = document.createElement("input");
    inputDesc.type = "text";
    inputDesc.className = "input-text grupo-descricao";
    inputDesc.placeholder = "Ex.: Cota 01, Jogo 20 números, Aposta da Carol";

    fieldDesc.appendChild(labelDesc);
    fieldDesc.appendChild(inputDesc);
    detalhes.appendChild(fieldDesc);

    // números (até 20)
    const fieldNums = document.createElement("div");
    fieldNums.className = "field";

    const labelNums = document.createElement("div");
    labelNums.className = "field-label";
    labelNums.innerHTML =
      '<span class="dot"></span> Números da aposta (6 a 20 números de 1 a 60)';
    const rowNums = document.createElement("div");
    rowNums.className = "numbers-row";

    const grupoInputs = [];
    for (let i = 0; i < 20; i++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = "60";
      input.placeholder = String(i + 1).padStart(2, "0");
      input.className = "num-input grupo-num";
      rowNums.appendChild(input);
      grupoInputs.push(input);
    }

    fieldNums.appendChild(labelNums);
    fieldNums.appendChild(rowNums);

    const hintNums = document.createElement("div");
    hintNums.className = "hint";
    hintNums.textContent =
      "Use apenas os campos necessários. Sem números repetidos na mesma aposta.";
    fieldNums.appendChild(hintNums);

    detalhes.appendChild(fieldNums);

    const btnAddAposta = document.createElement("button");
    btnAddAposta.className = "btn-primary";
    btnAddAposta.textContent = "adicionar aposta neste bolão";
    detalhes.appendChild(btnAddAposta);

    const listaApostasGrupo = document.createElement("div");
    listaApostasGrupo.className = "bets-list";
    listaApostasGrupo.style.marginTop = "8px";

    if (grupo.apostas.length === 0) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "Nenhuma aposta cadastrada ainda neste bolão.";
      listaApostasGrupo.appendChild(p);
    } else {
      const maiorAcertoGrupo = grupo.apostas.reduce((max, a) => {
        if (typeof a.acertos !== "number") return max;
        return a.acertos > max ? a.acertos : max;
      }, 0);

      grupo.apostas.forEach((aposta, idx) => {
        const item = document.createElement("div");
        item.className = "bet-item";

        const headerBet = document.createElement("div");
        headerBet.className = "bet-header";

        const left = document.createElement("div");
        const nomeAposta = document.createElement("div");
        nomeAposta.className = "bet-name";
        nomeAposta.textContent =
          aposta.descricao && aposta.descricao.trim() !== ""
            ? aposta.descricao
            : `Aposta #${idx + 1}`;

        const indexEl = document.createElement("div");
        indexEl.className = "bet-index";
        indexEl.textContent = `#${idx + 1}`;

        left.appendChild(nomeAposta);
        left.appendChild(indexEl);

        const acertosEl = document.createElement("div");
        acertosEl.className = "bet-acertos";
        if (typeof aposta.acertos === "number") {
          acertosEl.textContent = `Acertos: ${aposta.acertos}`;
          if (aposta.acertos > 0 && aposta.acertos === maiorAcertoGrupo) {
            acertosEl.classList.add("highlight");
          }
        } else {
          acertosEl.textContent = "Acertos: –";
        }

        headerBet.appendChild(left);
        headerBet.appendChild(acertosEl);

        const numerosEl = document.createElement("div");
        numerosEl.className = "bet-numbers";
        aposta.numeros.forEach((n) => {
          const chip = document.createElement("span");
          chip.className = "chip-number";
          chip.textContent = String(n).padStart(2, "0");
          numerosEl.appendChild(chip);
        });

        const actions = document.createElement("div");
        actions.className = "bet-actions";

        const excluirBtn = document.createElement("button");
        excluirBtn.className = "bet-btn danger";
        excluirBtn.textContent = "excluir";
        excluirBtn.addEventListener("click", () => {
          grupos[indexGrupo].apostas = grupos[indexGrupo].apostas.filter(
            (ap) => ap.id !== aposta.id
          );
          salvarGrupos();
          renderizarGrupos();
          atualizarResultadoGeral();
        });

        actions.appendChild(excluirBtn);

        item.appendChild(headerBet);
        item.appendChild(numerosEl);
        item.appendChild(actions);

        listaApostasGrupo.appendChild(item);
      });
    }

    detalhes.appendChild(listaApostasGrupo);
    card.appendChild(detalhes);

    const controles = document.createElement("div");
    controles.className = "grupo-controles";

    const btnToggle = document.createElement("button");
    btnToggle.className = "btn-secondary";
    btnToggle.textContent = "ver mais";

    const btnPdfGrupo = document.createElement("button");
    btnPdfGrupo.className = "btn-secondary";
    btnPdfGrupo.textContent = "Gerar PDF deste bolão";

    const btnExcluirGrupo = document.createElement("button");
    btnExcluirGrupo.className = "btn-secondary btn-danger";
    btnExcluirGrupo.textContent = "Excluir bolão";

    controles.appendChild(btnToggle);
    controles.appendChild(btnPdfGrupo);
    controles.appendChild(btnExcluirGrupo);

    card.appendChild(controles);

    // auto-avanço nos campos do grupo
    setupAutoAdvance(grupoInputs);

    // ver mais / ver menos
    btnToggle.addEventListener("click", () => {
      const expanded = card.classList.toggle("expanded");
      btnToggle.textContent = expanded ? "ver menos" : "ver mais";
    });

    // adicionar aposta neste bolão
    btnAddAposta.addEventListener("click", () => {
      limparMensagemErro();
      try {
        const numeros = obterNumerosDeInputs(
          grupoInputs,
          "na aposta deste bolão"
        );
        if (numeros.length > 20) {
          throw new Error("Use no máximo 20 números por aposta neste bolão.");
        }

        const descricao = inputDesc.value.trim();
        let acertos = null;

        if (
          Array.isArray(numerosSorteioAtual) &&
          numerosSorteioAtual.length === 6
        ) {
          const setSorteio = new Set(numerosSorteioAtual);
          acertos = numeros.filter((n) => setSorteio.has(n)).length;
        }

        const apostaNova = {
          id: Date.now() + Math.random().toString(16).slice(2),
          descricao,
          numeros,
          acertos,
        };

        grupos[indexGrupo].apostas.push(apostaNova);
        salvarGrupos();
        renderizarGrupos();
        atualizarResultadoGeral();

        inputDesc.value = "";
        grupoInputs.forEach((i) => (i.value = ""));
      } catch (err) {
        mostrarErro(err.message);
      }
    });

    // PDF deste grupo
    btnPdfGrupo.addEventListener("click", () => {
      setActiveTab("outros");

      const todosGrupos = Array.from(
        document.querySelectorAll(".grupo-card")
      );
      todosGrupos.forEach((g) => {
        g.classList.remove("print-target", "print-filtered");
      });

      if (todosGrupos.length > 1) {
        todosGrupos.forEach((g) => {
          if (g !== card) g.classList.add("print-filtered");
        });
      }
      card.classList.add("print-target");
      card.classList.add("expanded");

      window.print();

      setTimeout(() => {
        todosGrupos.forEach((g) => {
          g.classList.remove("print-target", "print-filtered");
        });
      }, 500);
    });

    // excluir grupo
    btnExcluirGrupo.addEventListener("click", () => {
      if (
        !confirm(
          `Tem certeza que deseja excluir o bolão "${grupo.nome}" e todas as apostas dele?`
        )
      )
        return;
      grupos = grupos.filter((_, idx) => idx !== indexGrupo);
      salvarGrupos();
      renderizarGrupos();
      atualizarResultadoGeral();
    });

    listaGruposEl.appendChild(card);
  });
}

//// RESULTADO GERAL

function atualizarResultadoGeral() {
  if (!listaResultadoGeralEl) return;

  listaResultadoGeralEl.innerHTML = "";

  if (
    !numerosSorteioAtual ||
    !Array.isArray(numerosSorteioAtual) ||
    numerosSorteioAtual.length !== 6
  ) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Informe os 6 números sorteados e clique em 'calcular acertos' para ver o resultado geral aqui.";
    listaResultadoGeralEl.appendChild(p);
    return;
  }

  const linhas = [];

  // Salvaretes
  apostas.forEach((a) => {
    if (typeof a.acertos !== "number") return;
    linhas.push({
      bolao: "Bolão Salvaretes",
      nome: a.nome,
      qtd: a.numeros.length,
      acertos: a.acertos,
    });
  });

  // Grupos
  grupos.forEach((grupo) => {
    grupo.apostas.forEach((ap, idx) => {
      if (typeof ap.acertos !== "number") return;
      linhas.push({
        bolao: grupo.nome,
        nome:
          ap.descricao && ap.descricao.trim() !== ""
            ? ap.descricao
            : `Aposta #${idx + 1}`,
        qtd: ap.numeros.length,
        acertos: ap.acertos,
      });
    });
  });

  if (linhas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Nenhuma aposta com acertos ainda. Confira se há apostas cadastradas nos bolões.";
    listaResultadoGeralEl.appendChild(p);
    return;
  }

  linhas.sort((a, b) => {
    if (b.acertos !== a.acertos) return b.acertos - a.acertos;
    if (a.bolao !== b.bolao) return a.bolao.localeCompare(b.bolao);
    return a.nome.localeCompare(b.nome);
  });

  const maiorAcerto = linhas[0].acertos;

  const header = document.createElement("div");
  header.className = "resultado-geral-header";
  header.innerHTML =
    "<div>Bolão</div><div>Aposta</div><div>Qtd nºs</div><div>Acertos</div>";
  listaResultadoGeralEl.appendChild(header);

  linhas.forEach((linha) => {
    const row = document.createElement("div");
    row.className = "resultado-geral-row";
    if (linha.acertos === maiorAcerto && maiorAcerto > 0) {
      row.classList.add("highlight");
    }

    row.innerHTML = `
      <div>${linha.bolao}</div>
      <div>${linha.nome}</div>
      <div>${linha.qtd}</div>
      <div>${linha.acertos}</div>
    `;

    listaResultadoGeralEl.appendChild(row);
  });
}

//// CÁLCULO DE ACERTOS

function aplicarAcertosParaTodosOsBoloes() {
  if (
    !numerosSorteioAtual ||
    !Array.isArray(numerosSorteioAtual) ||
    numerosSorteioAtual.length !== 6
  ) {
    return;
  }

  const setSorteio = new Set(numerosSorteioAtual);

  apostas = apostas.map((a) => {
    const acertos = a.numeros.filter((n) => setSorteio.has(n)).length;
    return { ...a, acertos };
  });

  grupos = grupos.map((g) => {
    const aps = g.apostas.map((ap) => {
      const acertos = ap.numeros.filter((n) => setSorteio.has(n)).length;
      return { ...ap, acertos };
    });
    return { ...g, apostas: aps };
  });

  salvarApostas();
  salvarGrupos();
}

//// LIMPAR SORTEIO

function limparSorteioCamposEAcertos() {
  sorteioInputs.forEach((i) => (i.value = ""));
  numerosSorteioAtual = null;

  apostas = apostas.map((a) => ({ ...a, acertos: null }));
  grupos = grupos.map((g) => ({
    ...g,
    apostas: g.apostas.map((ap) => ({ ...ap, acertos: null })),
  }));

  salvarApostas();
  salvarGrupos();

  atualizarListaApostasSalvaretes();
  atualizarResultadoSalvaretes();
  atualizarFrequenciaNumerosSalvaretes();
  atualizarResumoSorteioPrint();
  renderizarGrupos();
  atualizarResultadoGeral();
}

//// EVENTOS: SALVARETES

if (btnAdicionar) {
  btnAdicionar.addEventListener("click", () => {
    limparMensagemErro();
    try {
      const nome = nomeInput ? nomeInput.value.trim() : "";
      if (!nome) {
        throw new Error("Informe o nome do participante.");
      }

      const numeros = obterNumerosApostaSalvaretes();

      let acertos = null;
      if (
        Array.isArray(numerosSorteioAtual) &&
        numerosSorteioAtual.length === 6
      ) {
        const setSorteio = new Set(numerosSorteioAtual);
        acertos = numeros.filter((n) => setSorteio.has(n)).length;
      }

      const novaAposta = {
        id: Date.now() + Math.random().toString(16).slice(2),
        nome,
        numeros,
        acertos,
      };

      apostas.push(novaAposta);
      salvarApostas();
      limparCamposApostaSalvaretes();
      atualizarListaApostasSalvaretes();
      atualizarResultadoSalvaretes();
      atualizarFrequenciaNumerosSalvaretes();
      atualizarResultadoGeral();
    } catch (err) {
      mostrarErro(err.message);
    }
  });
}

if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    limparCamposApostaSalvaretes();
  });
}

if (btnImprimir) {
  btnImprimir.addEventListener("click", () => {
    setActiveTab("salvaretes");
    window.print();
  });
}

//// EVENTOS: SORTEIO

if (btnCalcular) {
  btnCalcular.addEventListener("click", () => {
    limparMensagemErro();
    try {
      const numeros = obterNumerosSorteio();
      numerosSorteioAtual = numeros;

      aplicarAcertosParaTodosOsBoloes();

      atualizarListaApostasSalvaretes();
      atualizarResultadoSalvaretes();
      atualizarFrequenciaNumerosSalvaretes();
      atualizarResumoSorteioPrint();
      renderizarGrupos();
      atualizarResultadoGeral();
    } catch (err) {
      mostrarErro(err.message);
    }
  });
}

if (btnLimparSorteio) {
  btnLimparSorteio.addEventListener("click", () => {
    limparMensagemErro();
    limparSorteioCamposEAcertos();
  });
}

//// EVENTOS: CRIAR GRUPO

if (btnCriarGrupo) {
  btnCriarGrupo.addEventListener("click", () => {
    limparMensagemErro();
    try {
      const nome = novoGrupoNomeInput
        ? novoGrupoNomeInput.value.trim()
        : "";
      if (!nome) {
        throw new Error("Informe o nome do bolão.");
      }

      const novoGrupo = {
        id: Date.now() + Math.random().toString(16).slice(2),
        nome,
        apostas: [],
      };

      grupos.push(novoGrupo);
      salvarGrupos();
      novoGrupoNomeInput.value = "";
      renderizarGrupos();
    } catch (err) {
      mostrarErro(err.message);
    }
  });
}

//// INICIALIZAÇÃO

carregarApostas();
carregarGrupos();

atualizarListaApostasSalvaretes();
atualizarResultadoSalvaretes();
atualizarFrequenciaNumerosSalvaretes();
atualizarResumoSorteioPrint();
renderizarGrupos();
atualizarResultadoGeral();

setActiveTab("salvaretes");
