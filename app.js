// Lógica principal do Bolão Salvaretes
// Tudo em memória (não salva no servidor)

const nomeInput = document.getElementById("nome-participante");
const apostaInputs = Array.from(document.querySelectorAll(".aposta-num"));
const sorteioInputs = Array.from(document.querySelectorAll(".sorteio-num"));

const btnAdicionar = document.getElementById("btn-adicionar");
const btnLimpar = document.getElementById("btn-limpar");
const btnCalcular = document.getElementById("btn-calcular");

const listaApostasEl = document.getElementById("lista-apostas");
const totalApostasEl = document.getElementById("total-apostas");
const resultadoEl = document.getElementById("resultado");
const mensagemErroEl = document.getElementById("mensagem-erro");

let apostas = []; // { id, nome, numeros: [..], acertos: null }

// Funções utilitárias
function limparMensagemErro() {
  mensagemErroEl.textContent = "";
  mensagemErroEl.style.color = "var(--muted)";
}

function mostrarErro(msg) {
  mensagemErroEl.textContent = msg;
  mensagemErroEl.style.color = "#fecaca";
}

function obterNumerosValidos(inputs, qtdEsperada) {
  const valores = inputs.map((input) => input.value.trim());
  if (valores.some((v) => v === "")) {
    throw new Error("Preencha todos os números.");
  }

  const numeros = valores.map((v) => Number(v));

  if (numeros.some((n) => Number.isNaN(n))) {
    throw new Error("Todos os campos devem conter números.");
  }

  if (numeros.some((n) => n < 1 || n > 60)) {
    throw new Error("Os números devem estar entre 1 e 60.");
  }

  const set = new Set(numeros);
  if (set.size !== numeros.length) {
    throw new Error("Não é permitido repetir números.");
  }

  if (qtdEsperada && numeros.length !== qtdEsperada) {
    throw new Error(`Você deve informar exatamente ${qtdEsperada} números.`);
  }

  // retorna ordenados
  return numeros.sort((a, b) => a - b);
}

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

  // encontrar maior número de acertos para destacar
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
  aposta.numeros.forEach((n, idx) => {
    if (apostaInputs[idx]) {
      apostaInputs[idx].value = n;
    }
  });
  // remove para ser regravada depois
  apostas = apostas.filter((a) => a.id !== id);
  atualizarListaApostas();
}

function excluirAposta(id) {
  apostas = apostas.filter((a) => a.id !== id);
  atualizarListaApostas();
  atualizarResultadoResumo();
}

// Resultado / resumo
function atualizarResultadoResumo() {
  resultadoEl.innerHTML = "";

  if (apostas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "O resultado aparecerá aqui depois do cálculo.";
    resultadoEl.appendChild(p);
    return;
  }

  // filtra apostas que já têm acertos calculados
  const calculadas = apostas.filter((a) => typeof a.acertos === "number");

  if (calculadas.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Depois de informar os números sorteados, clique em 'calcular acertos'.";
    resultadoEl.appendChild(p);
    return;
  }

  const maior = calculadas.reduce((max, a) => (a.acertos > max ? a.acertos : max), 0);

  const melhores = calculadas.filter((a) => a.acertos === maior && maior > 0);

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

  // contagem por número de acertos
  const mapa = new Map();
  calculadas.forEach((a) => {
    const k = a.acertos;
    mapa.set(k, (mapa.get(k) || 0) + 1);
  });

  const resumo = [];
  Array.from(mapa.entries())
    .sort((a, b) => b[0] - a[0])
    .forEach(([acertos, qtd]) => {
      resumo.push(`${qtd} aposta${qtd > 1 ? "s" : ""} com ${acertos} acerto${acertos > 1 ? "s" : ""}`);
    });

  const resumoEl = document.createElement("div");
  resumoEl.className = "hint";
  resumoEl.textContent = resumo.join(" · ");
  resultadoEl.appendChild(resumoEl);
}

// Eventos
btnAdicionar.addEventListener("click", () => {
  limparMensagemErro();
  try {
    const nome = nomeInput.value.trim();
    if (!nome) {
      throw new Error("Informe o nome do participante.");
    }

    const numeros = obterNumerosValidos(apostaInputs, 7);

    const novaAposta = {
      id: Date.now() + Math.random().toString(16).slice(2),
      nome,
      numeros,
      acertos: null,
    };

    apostas.push(novaAposta);
    limparCamposAposta();
    atualizarListaApostas();
    atualizarResultadoResumo();
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
    const numerosSorteio = obterNumerosValidos(sorteioInputs, 6);
    const setSorteio = new Set(numerosSorteio);

    apostas = apostas.map((a) => {
      const acertos = a.numeros.filter((n) => setSorteio.has(n)).length;
      return { ...a, acertos };
    });

    atualizarListaApostas();
    atualizarResultadoResumo();
  } catch (err) {
    mostrarErro(err.message);
  }
});

// inicial
atualizarListaApostas();
atualizarResultadoResumo();
