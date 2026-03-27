# ⚡ CustomSort

**Ordene seus dados do seu jeito.** Uma aplicação web que permite ordenar planilhas com base em uma ordem personalizada — sem fórmulas, sem código, só arrastar e soltar.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 🎯 O que é?

O **CustomSort** resolve um problema simples que todo mundo já teve: ordenar dados em uma ordem que **faz sentido para você**, não em ordem alfabética ou numérica.

> *Exemplo: você quer que "Crítico" venha antes de "Médio", que venha antes de "Baixo" — mas o Excel insiste em ordenar como "Baixo → Crítico → Médio" (alfabético).*

Com o CustomSort, você define a ordem arrastando os itens. Pronto.

---

## 📋 Exemplo Prático

### Planilha de entrada (`tickets.xlsx`)

| ID | Prioridade | Descrição | Responsável |
|----|------------|-----------|-------------|
| 001 | baixa | Ajustar cor do botão | Ana |
| 002 | crítica | Sistema fora do ar | Carlos |
| 003 | média | Lentidão no relatório | Beatriz |
| 004 | crítica | Dados não salvam | Carlos |
| 005 | alta | Erro no login | Daniela |
| 006 | baixa | Trocar ícone do menu | Ana |
| 007 | média | Notificação duplicada | Beatriz |
| 008 | alta | Timeout na API | Daniela |

### Ordem personalizada definida (arrastar e soltar)

```
1. crítica
2. alta
3. média
4. baixa
```

### Planilha de saída (`tickets_customsort.xlsx`)

| ID | Prioridade | Descrição | Responsável |
|----|------------|-----------|-------------|
| 002 | crítica | Sistema fora do ar | Carlos |
| 004 | crítica | Dados não salvam | Carlos |
| 005 | alta | Erro no login | Daniela |
| 008 | alta | Timeout na API | Daniela |
| 003 | média | Lentidão no relatório | Beatriz |
| 007 | média | Notificação duplicada | Beatriz |
| 001 | baixa | Ajustar cor do botão | Ana |
| 006 | baixa | Trocar ícone do menu | Ana |

---

## 🚀 Como usar — Passo a Passo

### Passo 1 — Upload do arquivo

- Abra o `index.html` no navegador
- Arraste sua planilha para a área de upload (ou clique para selecionar)
- Formatos aceitos: `.xlsx`, `.xls`, `.csv`

### Passo 2 — Escolha a coluna e defina a ordem

- Selecione a coluna que será usada como critério de ordenação (ex: "Prioridade")
- Os valores únicos daquela coluna aparecem em uma lista
- **Arraste os itens** para cima ou para baixo até que a ordem fique como você deseja

### Passo 3 — Gere e baixe o resultado

- Clique em **Gerar** para aplicar a ordenação
- Visualize o resultado em uma tabela de preview (até 200 linhas)
- Baixe o arquivo ordenado como `.xlsx` ou `.csv`
- O arquivo gerado terá o nome `seuarquivo_customsort.xlsx`

---

## 💡 Mais exemplos de uso

### Ordenar status de pedidos

| Pedido | Status | Valor |
|--------|--------|-------|
| #301 | entregue | R$ 89,90 |
| #302 | em trânsito | R$ 45,00 |
| #303 | preparando | R$ 120,00 |
| #304 | aguardando pagamento | R$ 67,50 |
| #305 | em trânsito | R$ 200,00 |

**Ordem desejada:** `aguardando pagamento → preparando → em trânsito → entregue`

Resultado: os pedidos ficam organizados pelo fluxo real do processo, não pelo alfabeto.

---

### Ordenar tamanhos de roupa

| Produto | Tamanho | Estoque |
|---------|---------|---------|
| Camiseta Preta | GG | 12 |
| Camiseta Preta | P | 30 |
| Camiseta Preta | M | 25 |
| Camiseta Preta | G | 18 |
| Camiseta Preta | PP | 8 |

**Ordem desejada:** `PP → P → M → G → GG`

O Excel ordenaria como `G → GG → M → P → PP` (alfabético). Com o CustomSort, fica na ordem lógica.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **HTML/CSS/JS** | Interface completa, sem frameworks |
| [SheetJS](https://sheetjs.com/) | Leitura e escrita de arquivos Excel/CSV |
| [Sortable.js](https://sortablejs.github.io/Sortable/) | Drag-and-drop na lista de ordenação |
| [Google Fonts](https://fonts.google.com/) | Tipografia (Inter + JetBrains Mono) |

Não precisa instalar nada. Não precisa de servidor. Roda direto no navegador.

---

## 📂 Estrutura do Projeto

```
custom-sort/
├── index.html        # Aplicação principal
├── app.html          # Página showcase (app + código explicado)
├── js/
│   └── app.js        # Lógica: upload, parsing, ordenação, export
├── css/
│   ├── style.css     # Estilo da aplicação (tema cyberpunk)
│   └── showcase.css  # Estilo da página showcase
└── README.md
```

---

## ▶️ Como rodar

**Opção 1 — Abrir direto**
```
Dê dois cliques no index.html
```

**Opção 2 — Servidor local** (recomendado)
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```
Acesse `http://localhost:8000`

---

## 🧠 Como funciona por baixo

```
Upload (.xlsx/.csv)
    ↓
SheetJS converte para array de objetos
    ↓
Usuário escolhe coluna → valores únicos extraídos
    ↓
Usuário arrasta para definir ordem (Sortable.js)
    ↓
Algoritmo cria mapa de prioridades:
   { "crítica": 0, "alta": 1, "média": 2, "baixa": 3 }
    ↓
Array.sort() compara pelo índice de cada valor
    ↓
Resultado exportado como .xlsx ou .csv
```

---

## 📄 Licença

Feito por **Daniela Gross**.
