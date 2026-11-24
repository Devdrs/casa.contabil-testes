
"use strict";

const CONFIG = {
  modoTeste: true,
  whatsapp: "5569993842735",
  email: "diogoreissilva11@gmail.com",
  pagamentoUrl: "https://link.mercadopago.com.br/pontoweb1"
};

document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);
  const tabela = window.CASA_PRECOS;
  const form = $("formAtendimento");

  if (!form || !tabela) {
    const status = $("formStatus");

    if (status) {
      status.textContent = "Não foi possível carregar a tabela de preços.";
      status.className = "form-status erro";
    }

    if ($("enviar")) $("enviar").disabled = true;
    return;
  }

  const moeda = valor => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);

  let estimativa = null;
  let detalhes = "";
  let documentos = [];
  let ultimoResumo = "";
  let ultimoProtocolo = "";

  // CARREGAR CATÁLOGO

  Object.entries(tabela.servicos).forEach(([codigo, item]) => {
    $("servico").add(new Option(item.nome, codigo));
  });

  const parametros = new URLSearchParams(location.search);
  const servicoInicial = parametros.get("servico");

  if (
    servicoInicial &&
    Object.prototype.hasOwnProperty.call(
      tabela.servicos, servicoInicial
    )
  ) {
    $("servico").value = servicoInicial;
  }

  // FAIXAS DE FATURAMENTO

  function atualizarFaixas() {

    const anterior = $("faixa").value;
    $("faixa").replaceChildren();

    const mei = $("regime").value === "MEI";

    const faixas = mei
      ? [
          "Até R$ 81.000,00",
          "Acima da referência ou situação especial"
        ]
      : tabela.faixas;

    faixas.forEach((texto, indice) => {
      $("faixa").add(new Option(texto, String(indice)));
    });

    if ([...$("faixa").options].some(o => o.value === anterior)) {
      $("faixa").value = anterior;
    }
  }

  function mostrarCampo(id, mostrar) {
    const box = $(id);
    box.hidden = !mostrar;

    box.querySelectorAll("input, select").forEach(campo => {
      campo.disabled = !mostrar;
    });
  }

  // DEPARTAMENTO PESSOAL

  function calcularDP(vinculos) {

    if (!Number.isInteger(vinculos) ||
        vinculos < 0 || vinculos > 10000) {
      return null;
    }

    if (vinculos === 0) return 0;

    const faixa = tabela.departamentoPessoal.find(
      item => vinculos <= item.ate
    );

    return Math.round(
      vinculos * faixa.valor * 100
    ) / 100;
  }

  // CALCULADORA

  function calcular() {

    const codigo = $("servico").value;
    const item = tabela.servicos[codigo];
    const perfil = $("perfil").value;
    const atividade = $("atividade").value;

    const mensal = codigo === "mensal";
    const dp = codigo === "dp";

    mostrarCampo("regimeBox", mensal);
    mostrarCampo("faixaBox", mensal);
    mostrarCampo("vinculosBox", mensal || dp);

    mostrarCampo(
      "quantidadeBox",
      !mensal && !dp && item.valor !== null
    );

    estimativa = null;
    detalhes = "Serviço sujeito a orçamento individual.";

    if (mensal) {

      const regime = $("regime").value;
      const faixa = Number($("faixa").value);
      const vinculos = Number($("vinculos").value);

      const setor = atividade === "Tecnologia"
        ? "Serviços"
        : atividade;

      const indiceSetor = tabela.setores.indexOf(setor);

      const base = tabela.mensal[regime]
        ? tabela.mensal[regime][faixa]?.[indiceSetor]
        : undefined;

      const valorDP = calcularDP(vinculos);

      const perfilCompativel =
        perfil === "empresa" ||
        perfil === "nova" ||
        perfil === "mei";

      const meiCompativel =
        (perfil === "mei") === (regime === "MEI");

      if (!perfilCompativel) {

        detalhes = "Este perfil exige análise individual.";

      } else if (!meiCompativel) {

        detalhes = "Confira a compatibilidade entre perfil e regime.";

      } else if (regime === "MEI" && vinculos > 1) {

        detalhes = "Quantidade de vínculos exige análise do enquadramento.";

      } else if (valorDP === null) {

        detalhes = "Informe uma quantidade válida de vínculos.";

      } else if (typeof base === "number") {

        estimativa = Math.round((base + valorDP) * 100) / 100;

        detalhes =
          "Base contábil: " + moeda(base) +
          " | Departamento pessoal: " + moeda(valorDP) +
          " | Referência mensal.";
      }

    } else if (dp) {

      const vinculos = Number($("vinculos").value);
      const valor = calcularDP(vinculos);

      if (valor !== null && vinculos > 0) {
        estimativa = valor;
        detalhes = vinculos + " vínculo(s) — referência mensal.";
      } else {
        detalhes = "Informe pelo menos um vínculo válido.";
      }

    } else if (item.valor !== null) {

      const quantidade = Number($("quantidade").value);

      if (
        Number.isInteger(quantidade) &&
        quantidade >= 1 &&
        quantidade <= 1000
      ) {

        estimativa = Math.round(
          item.valor * quantidade * 100
        ) / 100;

        detalhes =
          moeda(item.valor) + " por " + item.unidade +
          " × " + quantidade;

      } else {

        detalhes = "Informe uma quantidade válida.";

      }
    }

    if (codigo === "abertura_mei") {
      detalhes =
        "A formalização oficial é gratuita. " +
        "Eventual assessoria profissional será orçada separadamente.";
    }

    $("valorEstimado").textContent =
      estimativa === null
        ? "Sob consulta"
        : moeda(estimativa) + (mensal || dp ? " / mês" : "");

    $("detalhePreco").textContent = detalhes;
  }

  // CHECKLISTS POR PERFIL

  const porPerfil = {

    empresa: [
      "Cartão CNPJ, se existente",
      "Contrato social ou ato constitutivo",
      "Dados do responsável legal"
    ],

    mei: [
      "CCMEI",
      "Relatório mensal de receitas",
      "Situação das declarações e pagamentos DAS"
    ],

    rural: [
      "Identificação do produtor",
      "Cadastro rural aplicável",
      "Documentos de receitas e despesas rurais"
    ],

    autonomo: [
      "Identificação profissional",
      "Inscrição municipal, quando aplicável",
      "Comprovantes de receitas e despesas"
    ],

    pf: [
      "Identificação do contribuinte",
      "Informações de contato"
    ],

    nova: [
      "Dados dos futuros sócios",
      "Endereço pretendido",
      "Descrição da atividade empresarial"
    ]
  };

  // CHECKLISTS POR ATIVIDADE

  const porAtividade = {

    "Serviços": [
      "Descrição dos serviços prestados",
      "Inscrição municipal, se aplicável",
      "Informações sobre emissão de NFS-e"
    ],

    "Comércio": [
      "Inscrição estadual, se aplicável",
      "Relação de produtos comercializados",
      "Notas fiscais de entrada e saída",
      "Informações de estoque"
    ],

    "Indústria": [
      "Descrição do processo produtivo",
      "Relação de matérias-primas e produtos",
      "Informações de estoque e produção",
      "Licenças industriais e ambientais aplicáveis"
    ],

    "Multissetorial": [
      "Relação das atividades exercidas",
      "Separação de receitas por atividade",
      "Inscrições e licenças pertinentes"
    ],

    "Transporte": [
      "Informações da frota e modalidade de transporte",
      "RNTRC, quando aplicável",
      "CT-e e MDF-e, quando aplicáveis"
    ],

    "Rural": [
      "CIB e cadastro no CAFIR, quando aplicáveis",
      "CCIR, quando pertinente",
      "Documentos do imóvel rural",
      "Informações de produção e comercialização"
    ],

    "Tecnologia": [
      "Descrição dos serviços ou produtos digitais",
      "Contratos de prestação de serviços",
      "Informações de receitas nacionais e internacionais"
    ],

    "Não se aplica": []
  };

  // CHECKLISTS POR SERVIÇO

  const porServico = {

    mensal: [
      "Regime tributário atual",
      "Balancetes e demonstrações anteriores, se existentes",
      "Documentos fiscais",
      "Extratos bancários empresariais",
      "Informações da folha de pagamento, se houver",
      "Obrigações acessórias e pendências existentes"
    ],

    abertura: [
      "Identificação dos sócios",
      "Endereço da sede",
      "Atividades econômicas pretendidas",
      "Capital social e participação dos sócios",
      "Nome empresarial pretendido",
      "Informações para viabilidade e licenciamento"
    ],

    fiscal: [
      "Período de referência",
      "Documentos fiscais pertinentes",
      "Descrição da obrigação ou operação"
    ],

    dp: [
      "Dados dos vínculos trabalhistas",
      "Informações de salários e jornadas",
      "Convenção coletiva aplicável",
      "Informações do evento trabalhista solicitado"
    ],

    regularizacao: [
      "Descrição das pendências",
      "Notificações recebidas",
      "Relatórios fiscais e débitos existentes"
    ],

    irpf: [
      "Ano-exercício",
      "Informes de rendimentos",
      "Comprovantes de despesas dedutíveis",
      "Informações de bens, direitos e dívidas",
      "Declaração anterior, se existente"
    ],

    rural: [
      "Ano de referência da declaração",
      "Informações de área e utilização do imóvel",
      "Documentação de propriedade ou posse",
      "Dados necessários à apuração do VTN"
    ],

    consultoria: [
      "Descrição do problema ou objetivo",
      "Faturamento e regime tributário",
      "Documentos relacionados à análise"
    ],

    bpo: [
      "Informações de contas a pagar e receber",
      "Fluxo de caixa existente",
      "Volume de movimentações financeiras",
      "Descrição dos controles atuais"
    ]
  };

  // ITENS ESPECÍFICOS

  const especificos = {

    rescisao: [
      "Motivo e data do desligamento",
      "Histórico de remuneração",
      "Informações de férias e aviso prévio"
    ],

    nfse: [
      "Descrição e valor do serviço",
      "Dados do tomador",
      "Município e código do serviço"
    ],

    nfe: [
      "Dados da operação e do destinatário",
      "Produtos, quantidades e valores",
      "Informações fiscais da mercadoria"
    ],

    dasn: [
      "Ano-calendário",
      "Receita bruta anual por atividade",
      "Informação sobre empregado no período"
    ],

    baixa: [
      "Situação cadastral e fiscal",
      "Informações dos sócios",
      "Documentos de encerramento"
    ],

    baixa_mei: [
      "Situação cadastral do MEI",
      "Receitas até o encerramento"
    ]
  };

  function atualizarChecklist() {

    const marcados = new Set(
      [...$("listaChecklist").querySelectorAll("input:checked")]
        .map(input => input.value)
    );

    const perfil = $("perfil").value;
    const atividade = $("atividade").value;
    const codigo = $("servico").value;
    const categoria = tabela.servicos[codigo].categoria;

    const pessoal = categoria === "irpf";

    documentos = [...new Set([

      "Informações de contato do responsável",

      ...(pessoal
        ? porPerfil.pf
        : porPerfil[perfil] || []),

      ...(pessoal
        ? []
        : porAtividade[atividade] || []),

      ...(porServico[categoria] || []),

      ...(especificos[codigo] || [])

    ])];

    $("listaChecklist").replaceChildren();

    documentos.forEach(texto => {

      const label = document.createElement("label");
      label.className = "checklist-item";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = texto;
      input.checked = marcados.has(texto);

      input.addEventListener("change", atualizarProgresso);

      const span = document.createElement("span");
      span.textContent = texto;

      label.append(input, span);
      $("listaChecklist").append(label);
    });

    atualizarProgresso();
  }

  function atualizarProgresso() {

    const total = documentos.length;

    const concluidos = $("listaChecklist")
      .querySelectorAll("input:checked").length;

    const percentual = total
      ? Math.round(concluidos / total * 100)
      : 0;

    $("progressoTexto").textContent =
      concluidos + " de " + total +
      " documentos disponíveis (" + percentual + "%)";

    $("progressoBarra").style.width = percentual + "%";
  }

  function textoChecklist() {

    return [...$("listaChecklist").querySelectorAll("input")]
      .map(input =>
        (input.checked ? "[X] " : "[ ] ") + input.value
      ).join("\n");
  }

  // COPIAR E SALVAR

  async function copiar(texto, destino) {

    try {
      await navigator.clipboard.writeText(texto);
      destino.textContent = "Conteúdo copiado.";
    } catch {
      destino.textContent =
        "Não foi possível copiar. Utilize a opção salvar.";
    }
  }

  function baixar(texto, nome) {

    const arquivo = new Blob([texto], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download = nome;

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("copiarChecklist").addEventListener("click", () => {
    copiar(textoChecklist(), $("checkStatus"));
  });

  $("baixarChecklist").addEventListener("click", () => {
    baixar(
      "CASA CONTÁBIL\nCHECKLIST DOCUMENTAL\n\n" +
      textoChecklist(),
      "checklist-casa-contabil.txt"
    );
  });

  // SINCRONIZAR TODAS AS INFORMAÇÕES

  function invalidarResultado() {
    $("resultado").hidden = true;
  }

  function atualizar() {
    calcular();
    atualizarChecklist();
    invalidarResultado();
  }

  $("perfil").addEventListener("change", () => {

    if ($("perfil").value === "mei") {
      $("regime").value = "MEI";
    } else if ($("regime").value === "MEI") {
      $("regime").value = "Simples Nacional";
    }

    atualizarFaixas();
    atualizar();
  });

  $("regime").addEventListener("change", () => {
    atualizarFaixas();
    atualizar();
  });

  ["servico", "atividade", "faixa"].forEach(id => {
    $(id).addEventListener("change", atualizar);
  });

  ["vinculos", "quantidade"].forEach(id => {
    $(id).addEventListener("input", () => {
      calcular();
      invalidarResultado();
    });
  });

  form.addEventListener("input", invalidarResultado);

  atualizarFaixas();
  atualizar();

  // RESUMO DA SOLICITAÇÃO

  function gerarResumo(protocolo = "") {

    calcular();

    const dados = new FormData(form);
    const servico = tabela.servicos[$("servico").value];

    const linhas = [
      "CASA CONTÁBIL — SOLICITAÇÃO",
      "Ambiente: " + (CONFIG.modoTeste ? "TESTE" : "PRODUÇÃO"),
      "Protocolo: " + (protocolo || "Não enviado"),
      "Data: " + new Date().toLocaleString("pt-BR"),
      "",
      "Nome: " + (dados.get("nome") || ""),
      "E-mail: " + (dados.get("email") || ""),
      "WhatsApp: " + (dados.get("whatsapp") || ""),
      "Empresa: " + (dados.get("empresa") || ""),
      "CNPJ: " + (dados.get("cnpj") || ""),
      "Cidade: " + (dados.get("cidade") || ""),
      "",
      "Serviço: " + servico.nome,
      "Perfil: " + $("perfil").selectedOptions[0].text,
      "Atividade: " + $("atividade").value,
      "Regime: " + (dados.get("regime") || "Não se aplica"),
      "Faturamento: " + (
        dados.has("faixa")
          ? $("faixa").selectedOptions[0].text
          : "Não se aplica"
      ),
      "Vínculos: " + (dados.get("vinculos") || "Não se aplica"),
      "Estimativa: " + (
        estimativa === null
          ? "Sob consulta"
          : moeda(estimativa)
      ),
      "Detalhes: " + detalhes,
      "Tabela: " + tabela.versao,
      "Prazo: " + (dados.get("prazo") || ""),
      "Notas fiscais: " + (dados.get("notas") || ""),
      "Observações: " + (dados.get("mensagem") || ""),
      "Ciência de privacidade: " + (
        dados.get("privacidade") || "Não"
      ),
      "",
      "CHECKLIST",
      textoChecklist(),
      "",
      "Status: solicitação de proposta",
      "Pagamento: não confirmado",
      "Contrato: não formalizado"
    ];

    return linhas.join("\n");
  }

  $("copiarResumo").addEventListener("click", () => {
    copiar(gerarResumo(), $("formStatus"));
  });

  $("salvarSolicitacao").addEventListener("click", () => {

    if (!ultimoResumo) return;

    baixar(
      ultimoResumo,
      ultimoProtocolo + ".txt"
    );
  });

  // VALIDAÇÃO E ENVIO

  const status = $("formStatus");
  const botao = $("enviar");

  function mensagem(texto, tipo = "") {
    status.textContent = texto;
    status.className = "form-status " + tipo;
  }

  if (!CONFIG.modoTeste) {
    botao.textContent = "Enviar solicitação";
  }

  form.addEventListener("submit", async evento => {

    evento.preventDefault();

    if (botao.disabled) return;
    if (form.elements["_honey"].value.trim()) return;
    if (!form.reportValidity()) return;

    const telefone = form.elements["whatsapp"]
      .value.replace(/\D/g, "");

    const telefoneNacional =
      telefone.length >= 12 && telefone.startsWith("55")
        ? telefone.slice(2)
        : telefone;

    if (!/^[1-9]\d{9,10}$/.test(telefoneNacional)) {
      mensagem("Informe um WhatsApp válido com DDD.", "erro");
      return;
    }

    const cnpj = form.elements["cnpj"].value.trim();

    if (cnpj) {

      const normalizado = cnpj
        .toUpperCase()
        .replace(/[./\-\s]/g, "");

      if (!/^[A-Z0-9]{12}\d{2}$/.test(normalizado)) {
        mensagem("Confira o formato do CNPJ informado.", "erro");
        return;
      }
    }

    const protocolo = "CC-" +
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + "-" + Math.random().toString(36).slice(2));

    const resumo = gerarResumo(protocolo);

    botao.disabled = true;
    mensagem("Processando solicitação...");
    $("resultado").hidden = true;

    try {

      if (!CONFIG.modoTeste) {

        const dados = new FormData();

        dados.append("_subject", "Casa Contábil - " + protocolo);
        dados.append("_template", "table");
        dados.append("email", form.elements["email"].value);
        dados.append("protocolo", protocolo);
        dados.append("solicitacao", resumo);

        const resposta = await fetch(
          "https://formsubmit.co/ajax/" + CONFIG.email,
          {
            method: "POST",
            body: dados,
            headers: { Accept: "application/json" }
          }
        );

        if (!resposta.ok) {
          throw new Error("Falha no envio");
        }

        const retorno = await resposta.json();

        if (
          retorno.success !== true &&
          retorno.success !== "true"
        ) {
          throw new Error("Envio não confirmado");
        }
      }

      ultimoResumo = resumo;
      ultimoProtocolo = protocolo;

      $("protocolo").textContent = protocolo;

      $("resultadoTitulo").textContent =
        CONFIG.modoTeste
          ? "Simulação concluída"
          : "Solicitação encaminhada";

      $("resultadoMensagem").textContent =
        CONFIG.modoTeste
          ? "Teste local concluído. Nenhum e-mail foi enviado."
          : "O serviço de envio aceitou sua solicitação. Aguarde a análise da Casa Contábil.";

      const linkWA =
        "https://wa.me/" + CONFIG.whatsapp +
        "?text=" + encodeURIComponent(
          "Olá! Enviei uma solicitação pelo site. " +
          "Protocolo: " + protocolo
        );

      $("whatsappResultado").href = linkWA;
      $("whatsappResultado").hidden = CONFIG.modoTeste;

      // Pagamento bloqueado até existir proposta aprovada.
      // A liberação segura deve ser feita pelo futuro backend.
      $("pagamento").hidden = true;

      $("resultado").hidden = false;

      mensagem(
        CONFIG.modoTeste
          ? "Teste concluído com sucesso."
          : "Solicitação aceita pelo serviço de envio.",
        "ok"
      );

      $("resultado").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (erro) {

      mensagem(
        "Não foi possível confirmar o envio. " +
        "Salve o resumo e tente novamente ou entre em contato.",
        "erro"
      );

    } finally {

      botao.disabled = false;

    }

  });

});

