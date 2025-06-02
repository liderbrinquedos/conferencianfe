// Variáveis globais
let produtos = [];
let nfProdutos = [];
let codigosLidos = {};

// Carregar produtos do Excel
function carregarProdutos() {
  const reader = new FileReader();
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx';
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    reader.readAsBinaryString(file);
  };
  fileInput.click();

  reader.onload = () => {
    const data = reader.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json(sheet);

    produtos = parsed.map(p => ({
      codigo: String(p["Cód. Produto"]).trim(),
      nome: String(p["Nome Produto"]).trim(),
      cod_barras_unitario: String(p["Cod. Barras Unitário"]).trim(),
      cod_barras_caixa: String(p["Cod. Barras Caixa"]).trim(),
      multiplo: parseInt(p["Múltiplo"]) || 1
    }));

    console.log("Produtos carregados:", produtos);
    alert("Produtos carregados com sucesso!");
  };
}

// Carregar NF-e via Excel
function carregarNFeExcel() {
  const reader = new FileReader();
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx';
  fileInput.onchange = () => {
    const file = fileInput.files[0];
    reader.readAsBinaryString(file);
  };
  fileInput.click();

  reader.onload = () => {
    const data = reader.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json(sheet);

    nfProdutos = parsed.map(item => ({
      codigo: String(item["Cód. Produto"]).trim(),
      nome: String(item["Nome Produto"]).trim(),
      quantidade: parseInt(item["Quantidade"]) || 0
    }));

    // Inicializa contador
    codigosLidos = {};
    nfProdutos.forEach(p => codigosLidos[p.codigo] = 0);

    // Atualiza interface
    document.getElementById("nota").innerText = "NF Exemplo";
    document.getElementById("cliente").innerText = "Cliente Teste";
    atualizarTabela();
    alert("NF-e carregada com sucesso!");
  };
}

// Atualiza tabela de produtos da NF-e
function atualizarTabela() {
  const tbody = document.querySelector("#tabelaProdutos tbody");
  tbody.innerHTML = "";
  nfProdutos.forEach(p => {
    codigosLidos[p.codigo] = codigosLidos[p.codigo] || 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.nome}</td>
      <td>${p.quantidade}</td>
      <td>${codigosLidos[p.codigo]}</td>
      <td class="${codigosLidos[p.codigo] >= p.quantidade ? 'ok' : 'pendente'}">
        ${codigosLidos[p.codigo] >= p.quantidade ? 'OK' : 'Pendente'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Função principal: processa código lido
function processarCodigo(codigoDigitado) {
  let produtoEncontrado = null;
  const codigo = String(codigoDigitado).trim();

  for (const p of produtos) {
    if (codigo === p.cod_barras_unitario) {
      produtoEncontrado = p;
      codigosLidos[p.codigo] += 1;
      break;
    } else if (codigo === p.cod_barras_caixa) {
      produtoEncontrado = p;
      codigosLidos[p.codigo] += p.multiplo;
      break;
    }
  }

  if (!produtoEncontrado) {
    alert("Produto não encontrado! Código lido: " + codigo);
    return;
  }

  const produtoNF = nfProdutos.find(p => p.codigo === produtoEncontrado.codigo);
  if (!produtoNF) {
    alert(`⚠️ Produto "${produtoEncontrado.nome}" não está na NF-e.`);
    return;
  }

  const qtdBipada = codigosLidos[produtoEncontrado.codigo];
  const qtdEsperada = produtoNF.quantidade;

  if (qtdBipada > qtdEsperada) {
    alert(`❗ Quantidade bipada maior que a registrada para ${produtoEncontrado.nome}: ${qtdBipada}/${qtdEsperada}`);
  } else if (qtdBipada === qtdEsperada) {
    console.log(`✔️ Quantidade exata atingida para ${produtoEncontrado.nome}`);
  }

  atualizarTabela();
}

// Escuta entrada do código de barras
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("inputCodigo").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const codigo = this.value.trim();
      if (codigo.length > 0) {
        processarCodigo(codigo);
        this.value = "";
      }
    }
  });

  // Adicionar botões dinâmicos para facilitar testes
  const body = document.body;
  const btnCarregarProd = document.createElement("button");
  btnCarregarProd.innerText = "Carregar Cadastro de Produtos";
  btnCarregarProd.onclick = carregarProdutos;
  body.insertBefore(btnCarregarProd, document.body.firstChild);

  const btnCarregarNFe = document.createElement("button");
  btnCarregarNFe.innerText = "Carregar NF-e (Excel)";
  btnCarregarNFe.onclick = carregarNFeExcel;
  body.insertBefore(btnCarregarNFe, document.body.firstChild);
});