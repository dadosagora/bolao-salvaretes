# Bolão Salvaretes

Aplicação simples em HTML, CSS e JavaScript para controlar o bolão da família na Mega da Virada.

## Funcionalidades

- Cadastro de participantes com aposta de **7 números** (1 a 60, sem repetir);
- Listagem de todas as apostas em uma única tela;
- Cadastro dos **6 números sorteados**;
- Cálculo automático de acertos por aposta;
- Destaque para as melhores apostas;
- Resumo da distribuição de acertos.

Tudo funciona **no navegador**, sem backend e sem banco de dados (os dados ficam apenas em memória enquanto a página está aberta).

## Como usar

1. Abra o arquivo `index.html` em qualquer navegador moderno.
2. No bloco **"Cadastrar aposta"**, informe:
   - Nome do participante;
   - 7 números da aposta.
3. Clique em **"adicionar aposta"**.
4. Repita o processo para todos os participantes.
5. Após o sorteio da Mega da Virada:
   - Digite os 6 números sorteados no bloco **"Números sorteados"**;
   - Clique em **"calcular acertos"**.
6. A lista de apostas será atualizada com o número de acertos, e o quadro de **Resultado** mostrará:
   - as melhores apostas;
   - um resumo com quantas apostas fizeram cada quantidade de acertos.

## Estrutura de arquivos

- `index.html` – estrutura da página e componentes principais;
- `style.css` – estilos do layout (tema escuro, visual de app);
- `app.js` – lógica do cadastro de apostas e cálculo de acertos.

## Publicando no GitHub Pages

1. Crie um repositório no GitHub (por exemplo: `bolao-salvaretes`);
2. Faça upload dos arquivos:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. No GitHub, acesse **Settings > Pages**;
4. Em **Source**, selecione a branch (`main` ou `master`) e a pasta `/root`;
5. Salve. O GitHub vai gerar um link do tipo:

   `https://seu-usuario.github.io/bolao-salvaretes/`

Pronto: o Bolão Salvaretes estará disponível online para você abrir no celular na hora do sorteio. 🎰🎯
