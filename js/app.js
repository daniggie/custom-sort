/**
 * CustomSort — Ordenacao personalizada de planilhas no navegador
 *
 * COMO FUNCIONA A LOGICA DE ORDENACAO:
 *
 * 1. O usuario envia uma planilha (xlsx, xls ou csv).
 * 2. A biblioteca SheetJS le o arquivo e converte em um array de objetos JS.
 *    Cada objeto representa uma linha, com chaves sendo os nomes das colunas.
 *    Ex: [{ id: 1, prioridade: "verde" }, { id: 2, prioridade: "azul" }]
 *
 * 3. O usuario escolhe UMA coluna para servir de base (ex: "prioridade").
 *
 * 4. O sistema extrai todos os valores UNICOS dessa coluna, na ordem em que
 *    aparecem na planilha. Ex: ["verde", "azul", "turquesa"]
 *
 * 5. O usuario reorganiza essa lista arrastando os itens na ordem que deseja.
 *    Ex: ["azul", "verde", "turquesa"]
 *
 * 6. O sistema cria um MAPA DE PRIORIDADE (Map), onde:
 *       "azul"      -> 0 (primeiro)
 *       "verde"     -> 1 (segundo)
 *       "turquesa"  -> 2 (terceiro)
 *
 * 7. Com esse mapa, ordena a planilha inteira usando Array.sort():
 *    Para cada par de linhas (a, b), compara o indice de prioridade
 *    do valor da coluna escolhida. Quem tem indice menor vem antes.
 *    Valores nao mapeados recebem um indice alto (vao para o final).
 *
 * 8. O resultado e exibido numa tabela e pode ser baixado como xlsx ou csv.
 */
(() => {
  'use strict';

  // ── Estado da aplicacao ─────────────────────────────────
  let rawData = [];            // dados brutos da planilha (array de objetos)
  let headers = [];            // nomes das colunas
  let selectedColumn = null;   // coluna escolhida pelo usuario
  let uniqueValues = [];       // valores unicos da coluna selecionada
  let sortedData = [];         // dados apos a ordenacao personalizada
  let originalFileName = 'planilha'; // nome original do arquivo (sem extensao)
  let currentStep = 1;         // passo atual (1, 2 ou 3)

  // ── Referencias ao DOM ──────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Views (secoes exclusivas — apenas uma visivel por vez)
  const viewUpload    = $('#step-upload');
  const viewConfigure = $('#step-configure');
  const viewResult    = $('#step-result');
  const views         = [viewUpload, viewConfigure, viewResult];

  // Elementos do passo 1 (upload)
  const fileInput      = $('#file-input');
  const uploadArea     = $('#upload-area');
  const fileNameEl     = $('#file-name');
  const btnNextUpload  = $('#btn-next-upload');

  // Elementos do passo 2 (configuracao)
  const fileBadge        = $('#file-badge');
  const columnGrid       = $('#column-grid');
  const orderPlaceholder = $('#order-placeholder');
  const sortableEl       = $('#sortable-list');
  const btnGenerate      = $('#btn-generate');

  // Elementos do passo 3 (resultado)
  const previewTbl       = $('#preview-table');
  const btnDownload      = $('#btn-download');
  const btnDownloadCsv   = $('#btn-download-csv');
  const btnBackConfigure = $('#btn-back-configure');

  // Rodape e barra de progresso
  const btnRestart     = $('#btn-restart');
  const appFooter      = $('#app-footer');
  const progressFill   = $('#progress-fill');
  const progressSteps  = $$('.progress-step');

  // Overlay de carregamento
  const loadingOverlay = $('#loading-overlay');
  const loadingText    = $('#loading-text');

  // Modal de erro/aviso
  const modalOverlay = $('#modal-overlay');
  const modalIcon    = $('#modal-icon');
  const modalTitle   = $('#modal-title');
  const modalMessage = $('#modal-message');
  const modalClose   = $('#modal-close');

  // ── Carregamento (loading) ──────────────────────────────

  /** Mostra o overlay de carregamento com uma mensagem personalizada */
  function showLoading(text) {
    loadingText.textContent = text || 'Processando...';
    loadingOverlay.classList.add('visible');
  }

  /** Esconde o overlay de carregamento */
  function hideLoading() {
    loadingOverlay.classList.remove('visible');
  }

  // ── Modal de erro/aviso ─────────────────────────────────

  /** Exibe um modal com titulo, mensagem e tipo (error ou warning) */
  function showModal(title, message, type) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Define o estilo do icone conforme o tipo
    modalIcon.className = 'modal__icon';
    if (type === 'error') modalIcon.classList.add('modal__icon--error');
    else modalIcon.classList.add('modal__icon--warning');

    modalOverlay.classList.add('visible');
  }

  /** Fecha o modal */
  function closeModal() {
    modalOverlay.classList.remove('visible');
  }

  // Fechar modal: botao, clique fora ou tecla Escape
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) closeModal();
  });

  // ── Navegacao entre passos ──────────────────────────────

  /** Alterna para o passo especificado (1, 2 ou 3) */
  function goToStep(step) {
    currentStep = step;

    // Esconde todas as views e mostra apenas a do passo atual
    views.forEach((v) => v.classList.remove('active'));
    if (step === 1) viewUpload.classList.add('active');
    if (step === 2) viewConfigure.classList.add('active');
    if (step === 3) viewResult.classList.add('active');

    // Atualiza a barra de progresso
    progressFill.style.width = `${(step / 3) * 100}%`;
    progressSteps.forEach((s) => {
      const n = parseInt(s.dataset.step);
      s.classList.remove('active', 'done');
      if (n === step) s.classList.add('active');
      else if (n < step) s.classList.add('done');
    });

    // Botao recomecar visivel a partir do passo 2
    if (step > 1) appFooter.classList.add('show-restart');
    else appFooter.classList.remove('show-restart');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Resetar tudo (recomecar) ────────────────────────────

  /** Limpa todo o estado e volta ao passo 1 */
  function resetAll() {
    rawData = [];
    headers = [];
    selectedColumn = null;
    uniqueValues = [];
    sortedData = [];
    fileInput.value = '';
    fileNameEl.textContent = '';
    btnNextUpload.disabled = true;
    columnGrid.innerHTML = '';
    sortableEl.innerHTML = '';
    previewTbl.innerHTML = '';
    orderPlaceholder.classList.remove('hidden');
    btnGenerate.disabled = true;
    goToStep(1);
  }

  // ── Passo 1: Leitura do arquivo ─────────────────────────

  let pendingFile = null; // arquivo selecionado aguardando processamento

  /**
   * Valida o arquivo selecionado pelo usuario.
   * Se valido, armazena em pendingFile e habilita o botao "Proximo".
   */
  function handleFile(file) {
    if (!file) return;

    // Verifica se a extensao e aceita
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      const received = '.' + ext;
      showModal(
        'Formato nao suportado',
        `O arquivo "${file.name}" possui o formato ${received}, que nao e aceito. Por favor, envie um arquivo .xlsx, .xls ou .csv.`,
        'error'
      );
      return;
    }

    pendingFile = file;
    originalFileName = file.name.replace(/\.[^.]+$/, '');
    fileNameEl.textContent = file.name;
    btnNextUpload.disabled = false;
  }

  /**
   * Processa o arquivo pendente usando SheetJS.
   * Le o binario, converte para JSON e avanca para o passo 2.
   */
  function processFile() {
    if (!pendingFile) return;

    showLoading('Lendo planilha...');

    const ext = pendingFile.name.split('.').pop().toLowerCase();
    const isCsv = ext === 'csv';

    const reader = new FileReader();

    // Erro ao ler o arquivo (ex: arquivo corrompido)
    reader.onerror = () => {
      hideLoading();
      showModal(
        'Erro ao ler o arquivo',
        'Nao foi possivel ler o arquivo selecionado. Verifique se ele nao esta corrompido e tente novamente.',
        'error'
      );
    };

    // Arquivo lido com sucesso — faz o parse com SheetJS
    reader.onload = (e) => {
      // setTimeout permite que o overlay de loading renderize antes do parse pesado
      setTimeout(() => {
        try {
          let workbook;

          if (isCsv) {
            // CSV: le como texto UTF-8 para preservar acentos
            let text = e.target.result;
            // Remove BOM se presente
            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
            // Detecta separador: se a primeira linha tem mais ";" que ",", usa ";"
            const firstLine = text.split(/\r?\n/)[0];
            const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
            workbook = XLSX.read(text, { type: 'string', FS: sep });
          } else {
            // XLSX/XLS: le como binario
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, { type: 'array' });
          }

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          hideLoading();

          // Planilha sem dados
          if (!json.length) {
            showModal(
              'Planilha vazia',
              'O arquivo foi lido com sucesso, mas nao contem dados. Verifique se a planilha possui linhas preenchidas e tente novamente.',
              'warning'
            );
            return;
          }

          // Armazena os dados e extrai os nomes das colunas
          rawData = json;
          headers = Object.keys(json[0]);
          buildConfigureView();
        } catch {
          hideLoading();
          showModal(
            'Erro ao processar arquivo',
            'O arquivo nao pode ser interpretado como uma planilha valida. Verifique o formato e tente novamente com um .xlsx, .xls ou .csv.',
            'error'
          );
        }
      }, 50);
    };

    // CSV: le como texto UTF-8; XLSX/XLS: le como binario
    if (isCsv) reader.readAsText(pendingFile, 'UTF-8');
    else reader.readAsArrayBuffer(pendingFile);
  }

  // ── Passo 2: Tela de configuracao ───────────────────────

  /** Monta a tela de configuracao com os botoes de colunas */
  function buildConfigureView() {
    // Exibe o nome do arquivo no badge
    fileBadge.textContent = pendingFile.name;

    // Cria um botao para cada coluna encontrada na planilha
    columnGrid.innerHTML = '';
    headers.forEach((col) => {
      const btn = document.createElement('button');
      btn.className = 'column-btn';
      btn.textContent = col;
      btn.addEventListener('click', () => selectColumn(col, btn));
      columnGrid.appendChild(btn);
    });

    // Reseta o painel de ordem
    sortableEl.innerHTML = '';
    orderPlaceholder.classList.remove('hidden');
    selectedColumn = null;
    btnGenerate.disabled = true;

    goToStep(2);
  }

  /**
   * Ao clicar em uma coluna:
   * 1. Destaca o botao selecionado
   * 2. Extrai os valores unicos dessa coluna (preservando a ordem original)
   * 3. Monta a lista arrastavel no painel ao lado
   */
  function selectColumn(col, btnEl) {
    // Desmarca todos e marca o clicado
    columnGrid.querySelectorAll('.column-btn').forEach((b) => b.classList.remove('selected'));
    btnEl.classList.add('selected');
    selectedColumn = col;

    // Extrai valores unicos mantendo a ordem de aparicao
    const seen = new Set();
    uniqueValues = [];
    rawData.forEach((row) => {
      const val = String(row[col] ?? '');
      if (!seen.has(val)) {
        seen.add(val);
        uniqueValues.push(val);
      }
    });

    buildSortableList();
    btnGenerate.disabled = false;
  }

  // ── Lista arrastavel (drag-and-drop) ────────────────────

  let sortableInstance = null; // instancia do SortableJS

  /** Cria a lista visual de valores unicos que o usuario pode arrastar */
  function buildSortableList() {
    orderPlaceholder.classList.add('hidden');
    sortableEl.innerHTML = '';

    uniqueValues.forEach((val, i) => {
      const li = document.createElement('li');
      li.dataset.value = val;
      li.innerHTML = `
        <span class="drag-handle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </span>
        <span class="rank">${i + 1}</span>
        <span>${escapeHtml(val || '(vazio)')}</span>
      `;
      sortableEl.appendChild(li);
    });

    // Destroi a instancia anterior (se existir) e cria uma nova
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = new Sortable(sortableEl, {
      animation: 180,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: updateRanks, // atualiza os numeros apos arrastar
    });
  }

  /** Atualiza os numeros de ranking na lista apos reordenacao */
  function updateRanks() {
    sortableEl.querySelectorAll('.rank').forEach((el, i) => {
      el.textContent = i + 1;
    });
  }

  // ── Passo 3: Gerar resultado e previa ───────────────────

  /**
   * LOGICA CENTRAL DE ORDENACAO:
   *
   * 1. Le a ordem atual dos itens na lista arrastavel (DOM)
   * 2. Cria um Map onde cada valor recebe seu indice (posicao na lista)
   *    Ex: { "azul" => 0, "verde" => 1, "turquesa" => 2 }
   * 3. Ordena o array de dados usando Array.sort(), comparando o indice
   *    de cada linha no mapa de prioridade
   * 4. Valores nao encontrados no mapa recebem um indice = tamanho da lista,
   *    ficando automaticamente no final
   */
  function generateResult() {
    if (!selectedColumn) return;

    showLoading('Ordenando planilha...');

    // setTimeout permite que o overlay de loading renderize antes da ordenacao pesada
    setTimeout(() => {
      // Cria o mapa de prioridade a partir da ordem atual no DOM
      const items = sortableEl.querySelectorAll('li');
      const priorityMap = new Map();
      items.forEach((li, i) => priorityMap.set(li.dataset.value, i));

      // Valores nao mapeados vao para o final
      const fallback = items.length;

      // Ordena toda a planilha comparando os indices de prioridade
      sortedData = [...rawData].sort((a, b) => {
        const va = String(a[selectedColumn] ?? '');
        const vb = String(b[selectedColumn] ?? '');
        const pa = priorityMap.has(va) ? priorityMap.get(va) : fallback;
        const pb = priorityMap.has(vb) ? priorityMap.get(vb) : fallback;
        return pa - pb;
      });

      buildPreview();
      hideLoading();
      goToStep(3);
    }, 50);
  }

  /** Monta a tabela de previa com os dados ordenados */
  function buildPreview() {
    const MAX_ROWS = 200; // limite de linhas exibidas na previa
    const display = sortedData.slice(0, MAX_ROWS);

    // Cabecalho da tabela
    let html = '<thead><tr>';
    headers.forEach((h) => {
      const cls = h === selectedColumn ? ' class="highlight-col"' : '';
      html += `<th${cls}>${escapeHtml(h)}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Corpo da tabela (linhas de dados)
    display.forEach((row) => {
      html += '<tr>';
      headers.forEach((h) => {
        const cls = h === selectedColumn ? ' class="highlight-col"' : '';
        html += `<td${cls}>${escapeHtml(String(row[h] ?? ''))}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    // Aviso se ha mais linhas do que o limite exibido
    if (sortedData.length > MAX_ROWS) {
      html += `<tfoot><tr><td colspan="${headers.length}" style="text-align:center;color:var(--clr-text-muted);padding:.75rem;font-size:.82rem;">Mostrando ${MAX_ROWS} de ${sortedData.length} linhas</td></tr></tfoot>`;
    }

    previewTbl.innerHTML = html;
  }

  // ── Downloads ───────────────────────────────────────────

  /** Gera e baixa o arquivo .xlsx usando SheetJS */
  function downloadXlsx() {
    const ws = XLSX.utils.json_to_sheet(sortedData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ordenado');
    XLSX.writeFile(wb, `${originalFileName}_customsort.xlsx`);
  }

  /** Gera e baixa o arquivo .csv com BOM UTF-8 para compatibilidade */
  function downloadCsv() {
    const ws = XLSX.utils.json_to_sheet(sortedData, { header: headers });
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalFileName}_customsort.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Seguranca ───────────────────────────────────────────

  /** Escapa caracteres HTML para prevenir injecao de codigo (XSS) */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Eventos ─────────────────────────────────────────────

  // Upload: clique, teclado, drag-and-drop
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  // Navegacao entre passos
  btnNextUpload.addEventListener('click', processFile);
  btnGenerate.addEventListener('click', generateResult);
  btnBackConfigure.addEventListener('click', () => goToStep(2));

  // Botoes de download
  btnDownload.addEventListener('click', downloadXlsx);
  btnDownloadCsv.addEventListener('click', downloadCsv);

  // Botao recomecar (rodape)
  btnRestart.addEventListener('click', resetAll);
})();
