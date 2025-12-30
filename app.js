// Lógica principal do Bolão Salvaretes
// - Apostas com 6 ou 7 números (mínimo 6, sem repetir)
// - Auto-avance ao digitar 2 dígitos
// - Salva tudo em localStorage
// - Card de "Números mais jogados"
// - Botão para limpar sorteio
// - Botão para gerar PDF (imprimir apostas)
// - Resumo dos números sorteados (tela + PDF)

const nomeInput = document.getElementById("nome-participante");
const apostaInputs = Array.from(document.querySelectorAll(".aposta-num"));
const sorteioInputs = Array.from(document.querySelectorAll(".sorteio-num"));

const btnAdicionar = document.getElementById("btn-adicionar");
const btnLimpar = document.getElementById("btn-limpar");
const btnCalcular = document.getElementById("btn-calcular");
const btnLimparSorteio = document.getElementById("btn-limpar-sorteio");
const btnImprimir = document.getElementById("btn-imprimir");

const listaApostasEl = document.getElementById("lista-apostas");
const totalApostasEl = document.getElementById("total-apostas");
const resultadoEl = document.getElementById("resultado");
const mensagemErroEl = document.getElementById("mensagem-erro");

const STORAGE_KEY = "bolaoSalvaretes_v1";

let apostas = []; // { id, nome, numeros: [..], acertos: null }
let numerosSorteioAtual = null; // [n1..n6] ou null

// ---------- UTILITÁRIOS DE ERRO ----------
function limparMensagemErro() {
  mensagemErroEl.textContent = "";
  mensagemErroEl.style.color = "var(--muted)";
}

function mostrarErro(msg) {
  mensagemErroEl.textContent = msg;
  mensagemErroEl.style.color = "#f87171";
}

// ---------- AUTO-AVANÇAR CAMPOS (2 DÍGITOS) ----------
function setupAutoAdvance(inputs) {
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, ""); // só dígitos
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

// ---------- LOCALSTORAGE ----------
function salvarApostas() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apostas));
  } catch (e) {
    console.warn("Não foi possível salvar no localStorage:", e);
  }
}

function carregarApostas() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) return;
    const dados = JSON.parse(salvo);
    if (Array.isArray(dados)) {
      apostas = dados;
    }
  } catch (e) {
    console.warn("Não foi possível carregar do localStorage:", e);
  }
}

// ---------- VALIDAÇÃO DOS NÚMEROS ----------

// APOSTA: aceita 6 ou 7 números, sem repetir
function obterNumerosAposta() {
  const valores = apostaInputs
    .map((input) => input.value.trim())
    .filter((v) => v !== "");

  if (valores.length < 6) {
    throw new Error("Informe pelo menos 6 números para a aposta.");
  }

  const numeros = valores.map((v) => Number(v));

  if (numeros.some((n) => Number.isNaN(n))) {
    throw new Error("Todos os campos da aposta devem conter números.");
  }

  if (numeros.some((n) => n < 1 || n > 60)) {
    throw new Error("Os números da aposta devem estar entre 1 e 60.");
  }

  const set = new Set(numeros);
  if (set.size !== numeros.length) {
    throw new Error("Não é permitido repetir números na mesma aposta.");
  }

  return numeros.sort((a, b) => a - b);
}

// SORTEIO: exige exatamente 6 números preenchidos
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

// ---------- LISTA DE APOSTAS ----------
function atualizarListaApostas() {
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

  // maior número de acertos (para destacar)
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
    editarBtn.addEventListener("click", () => editarAposta(aposta.id));

    const excluirBtn = document.createElement("button");
    excluirBtn.className = "bet-btn danger";
    excluirBtn.textContent = "excluir";
    excluirBtn.addEventListener("click", () => excluirAposta(aposta.id));

    actions.appendChild(editarBtn);
    actions.appendChild(excluirBtn);

    item.appendChild(header);
    item.appendChild(numerosEl);
    item.appendChild(actions);

    listaApostasEl.appendChild(item);
  });
}

function limparCamposAposta() {
  nomeInput.value = "";
  apostaInputs.forEach((input) => (input.value = ""));
  limparMensagemErro();
}

function editarAposta(id) {
  const aposta = apostas.find((a) => a.id === id);
  if (!aposta) return;
  nomeInput.value = aposta.nome;
  apostaInputs.forEach((input) => (input.value = ""));
  aposta.numeros.forEach((n, idx) => {
    if (apostaInputs[idx]) {
      apostaInputs[idx].value = n;
    }
  });
  apostas = apostas.filter((a) => a.id !== id);
  salvarApostas();
  atualizarListaApostas();
  atualizarResultadoResumo();
  atualizarFrequenciaNumeros();
}

// ---------- RESUMO SORTEIO (tela + PDF) ----------
function atualizarResumoSorteioPrint() {
  const resumoEl = document.getElementById("resumo-sorteio-print");
  if (!resumoEl) return;

  if (
    !numerosSorteioAtual ||
    !Array.isArray(numerosSorteioAtual) ||
    numerosSorteioAtual.length !== 6
  ) {
    resumoEl.textContent = "Números sorteados: Carol ainda não inseriu.";
  } else {
    const nums = numerosSorteioAtual
      .map((n) => String(n).padStart(2, "0"))
      .join(" · ");
    resumoEl.textContent = `Números sorteados: ${nums}`;
  }
}

function excluirAposta(id) {
  apostas = apostas.filter((a) => a.id !== id);
  salvarApostas();
  atualizarListaApostas();
  atualizarResultadoResumo();
  atualizarFrequenciaNumeros();
}

// ---------- RESULTADO / RESUMO ----------
function atualizarResultadoResumo() {
  resultadoEl.innerHTML = "";

  if (apostas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "O resultado aparecerá aqui depois do cálculo.";
    resultadoEl.appendChild(p);
    return;
  }

  const calculadas = apostas.filter((a) => typeof a.acertos === "number");

  if (calculadas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Depois de informar os números sorteados, clique em 'calcular acertos'.";
    resultadoEl.appendChild(p);
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
  resultadoEl.appendChild(tituloMelhores);

  if (melhores.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Nenhuma aposta teve acertos ainda.";
    resultadoEl.appendChild(p);
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
      resultadoEl.appendChild(linha);
    });
  }

  const divider = document.createElement("div");
  divider.className = "divider";
  resultadoEl.appendChild(divider);

  const tituloResumo = document.createElement("div");
  tituloResumo.className = "result-title";
  tituloResumo.textContent = "Resumo";
  resultadoEl.appendChild(tituloResumo);

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
        `${qtd} aposta${qtd > 1 ? "s" : ""} com ${acertos} acerto${acertos > 1 ? "s" : ""}`
      );
    });

  const resumoEl = document.createElement("div");
  resumoEl.className = "hint";
  resumoEl.textContent = resumo.join(" · ");
  resultadoEl.appendChild(resumoEl);
}

// ---------- FREQUÊNCIA DE NÚMEROS ----------
function atualizarFrequenciaNumeros() {
  const lista = document.getElementById("lista-frequencia");
  const totalSpan = document.getElementById("total-numeros-usados");
  if (!lista || !totalSpan) return;

  lista.innerHTML = "";

  if (apostas.length === 0) {
    totalSpan.textContent = "0 nºs";
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent =
      "Os números mais jogados vão aparecer aqui depois que você cadastrar as apostas.";
    lista.appendChild(p);
    return;
  }

  const freq = new Map();

  apostas.forEach((a) => {
    a.numeros.forEach((n) => {
      freq.set(n, (freq.get(n) || 0) + 1);
    });
  });

  const totalNumeros = Array.from(freq.values()).reduce((soma, v) => soma + v, 0);
  totalSpan.textContent = `${totalNumeros} nºs`;

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

    lista.appendChild(item);
  });
}

// ---------- LIMPAR SORTEIO ----------
function limparSorteioCamposEAcertos() {
  sorteioInputs.forEach((i) => (i.value = ""));
  numerosSorteioAtual = null;
  apostas = apostas.map((a) => ({ ...a, acertos: null }));
  salvarApostas();
  atualizarListaApostas();
  atualizarResultadoResumo();
  atualizarResumoSorteioPrint();
}

// ---------- EVENTOS ----------
btnAdicionar.addEventListener("click", () => {
  limparMensagemErro();
  try {
    const nome = nomeInput.value.trim();
    if (!nome) {
      throw new Error("Informe o nome do participante.");
    }

    const numeros = obterNumerosAposta();

    const novaAposta = {
      id: Date.now() + Math.random().toString(16).slice(2),
      nome,
      numeros,
      acertos: null,
    };

    apostas.push(novaAposta);
    salvarApostas();
    limparCamposAposta();
    atualizarListaApostas();
    atualizarResultadoResumo();
    atualizarFrequenciaNumeros();
  } catch (err) {
    mostrarErro(err.message);
  }
});

btnLimpar.addEventListener("click", () => {
  limparCamposAposta();
});

btnCalcular.addEventListener("click", () => {
  limparMensagemErro();
  try {
    const numerosSorteio = obterNumerosSorteio();
    const setSorteio = new Set(numerosSorteio);

    numerosSorteioAtual = numerosSorteio;
    atualizarResumoSorteioPrint();

    apostas = apostas.map((a) => {
      const acertos = a.numeros.filter((n) => setSorteio.has(n)).length;
      return { ...a, acertos };
    });

    salvarApostas();
    atualizarListaApostas();
    atualizarResultadoResumo();
  } catch (err) {
    mostrarErro(err.message);
  }
});

if (btnLimparSorteio) {
  btnLimparSorteio.addEventListener("click", () => {
    limparMensagemErro();
    limparSorteioCamposEAcertos();
  });
}

if (btnImprimir) {
  btnImprimir.addEventListener("click", () => {
    window.print(); // você escolhe "Salvar como PDF"
  });
}

// ---------- INICIALIZAÇÃO ----------
carregarApostas();
atualizarListaApostas();
atualizarResultadoResumo();
atualizarFrequenciaNumeros();
atualizarResumoSorteioPrint();
