
"use strict";

// ======================================================
// CASA CONTABIL
// CENTRAL DE AUTOATENDIMENTO
// VERSAO 1.1 - PRECIFICACAO E CONTROLE COMERCIAL
// ======================================================

const CONFIG = Object.freeze({

    ambiente: "teste",

    pagamentoHabilitado: false,

    whatsapp: "5569993842735",

    supabaseUrl:
        "https://fxpvnvhwmlmazxqbcgyj.supabase.co"

});

// ======================================================
// 01. FUNCOES AUXILIARES
// ======================================================

const $ = id => document.getElementById(id);

const money = centavos =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(centavos / 100);

function elemento(tag, texto = "") {

    const e = document.createElement(tag);

    e.textContent = texto;

    return e;

}

function botao(texto, acao) {

    const b = elemento("button", texto);

    b.type = "button";

    b.addEventListener("click", acao);

    return b;

}

// ======================================================
// 02. CATALOGO DE REFERENCIA
//
// Valores em centavos.
// Fixo: potencialmente elegivel para pagamento.
// Variavel: consulta previa obrigatoria.
// Sessao: consultoria com escopo definido.
// Diagnostico: valor apenas da analise inicial.
// Mensal: calculado pelo simulador.
// ======================================================

function servico(
    codigo,
    nome,
    preco,
    tipo,
    consultaPrevia,
    documentos,
    motivo = "",
    ativo = true
) {

    return {

        codigo,
        nome,
        preco,
        tipo,
        consultaPrevia,
        documentos,
        motivo,
        ativo,

        quantidade: 1,

        escopoValidado: false,

        pagamentoAntecipado:
            !consultaPrevia &&
            ["fixo", "sessao"].includes(tipo)

    };

}

const CATALOGO = [

    // ==================================================
    // MEI
    // ==================================================

    servico(
        "mei-abertura",
        "Formalização de MEI",
        0,
        "gratuito",
        false,
        [
            "Atividade pretendida",
            "Endereço pretendido",
            "Informações cadastrais"
        ]
    ),

    servico(
        "mei-alteracao",
        "Alteração de MEI",
        40000,
        "fixo",
        false,
        [
            "CCMEI",
            "Descrição da alteração"
        ]
    ),

    servico(
        "mei-baixa",
        "Baixa de MEI",
        60000,
        "variavel",
        true,
        [
            "CCMEI",
            "Situação das obrigações",
            "Informações sobre débitos"
        ],
        "Necessária análise das pendências."
    ),

    servico(
        "dasn",
        "Declaração anual DASN-SIMEI",
        25000,
        "fixo",
        false,
        [
            "CNPJ",
            "Receitas anuais",
            "Informações sobre empregados",
            "Ano da declaração"
        ]
    ),

    // ==================================================
    // PESSOA FISICA E PRODUTOR RURAL
    // ==================================================

    servico(
        "dirpf",
        "Declaração de Imposto de Renda PF",
        30000,
        "variavel",
        true,
        [
            "Ano-exercício",
            "Comprovantes de rendimentos",
            "Informações de bens e direitos",
            "Informações de dependentes"
        ],
        "O valor depende da complexidade da declaração."
    ),

    servico(
        "ditr",
        "Declaração de ITR",
        35000,
        "variavel",
        true,
        [
            "CIB",
            "Dados do imóvel rural",
            "CCIR, quando aplicável",
            "Informações sobre utilização da terra"
        ],
        "Necessária análise dos dados do imóvel rural."
    ),

    // ==================================================
    // NOTAS FISCAIS E CERTIDOES
    // ==================================================

    servico(
        "nfse",
        "Emissão de NFS-e",
        5000,
        "fixo",
        false,
        [
            "Dados da operação",
            "Dados do tomador",
            "Inscrição municipal, quando aplicável"
        ]
    ),

    servico(
        "nfe",
        "Emissão de NF-e",
        10000,
        "variavel",
        true,
        [
            "Dados da operação",
            "Dados dos produtos",
            "Inscrição estadual, quando aplicável"
        ],
        "Necessária análise da operação e tributação."
    ),

    servico(
        "cnd",
        "Emissão de certidão",
        20000,
        "fixo",
        false,
        [
            "Identificação do contribuinte",
            "Tipo de certidão solicitada"
        ]
    ),

    // ==================================================
    // CONSULTORIAS
    // ==================================================

    servico(
        "consultoria",
        "Consultoria contábil",
        25000,
        "sessao",
        false,
        [
            "Descrição da demanda",
            "Documentos relacionados ao assunto"
        ]
    ),

    servico(
        "tributaria",
        "Consultoria tributária",
        62500,
        "sessao",
        false,
        [
            "Regime tributário",
            "Descrição da demanda",
            "Informações fiscais"
        ]
    ),

    servico(
        "planejamento",
        "Planejamento tributário",
        76000,
        "variavel",
        true,
        [
            "Regime tributário",
            "Faturamento",
            "Atividades empresariais",
            "Informações sobre despesas"
        ],
        "Necessária avaliação técnica e definição do escopo."
    ),

    // ==================================================
    // DEPARTAMENTO PESSOAL
    // ==================================================

    servico(
        "rescisao",
        "Cálculo de rescisão trabalhista",
        10000,
        "variavel",
        true,
        [
            "Dados do vínculo empregatício",
            "Histórico de remuneração",
            "Motivo do desligamento",
            "Convenção coletiva aplicável"
        ],
        "Necessária análise das condições trabalhistas."
    ),

    // ==================================================
    // ABERTURA DE EMPRESAS
    // ==================================================

    servico(
        "abertura-sn",
        "Abertura de empresa - Simples Nacional",
        80000,
        "variavel",
        true,
        [
            "Atividades pretendidas",
            "Dados dos sócios",
            "Endereço pretendido",
            "Capital social"
        ],
        "Necessária análise de viabilidade e enquadramento."
    ),

    servico(
        "abertura-lp",
        "Abertura de empresa - Lucro Presumido",
        95000,
        "variavel",
        true,
        [
            "Atividades pretendidas",
            "Dados dos sócios",
            "Endereço pretendido",
            "Capital social"
        ],
        "Necessária análise societária e tributária."
    ),

    servico(
        "abertura-lr",
        "Abertura de empresa - Lucro Real",
        120000,
        "variavel",
        true,
        [
            "Atividades pretendidas",
            "Dados dos sócios",
            "Endereço pretendido",
            "Capital social",
            "Projeção de faturamento"
        ],
        "Necessária análise contábil, fiscal e societária."
    ),

    // ==================================================
    // ALTERACAO E ENCERRAMENTO
    // ==================================================

    servico(
        "alteracao",
        "Alteração empresarial",
        60000,
        "variavel",
        true,
        [
            "Contrato social",
            "CNPJ",
            "Descrição da alteração"
        ],
        "Necessária análise dos atos empresariais."
    ),

    servico(
        "baixa",
        "Baixa empresarial",
        80000,
        "variavel",
        true,
        [
            "Contrato social",
            "CNPJ",
            "Situação fiscal",
            "Informações sobre obrigações pendentes"
        ],
        "Necessária análise das obrigações da empresa."
    ),

    // ==================================================
    // CONTABILIDADE MENSAL
    // ==================================================

    servico(
        "mensal",
        "Contabilidade mensal",
        40000,
        "mensal",
        true,
        [
            "CNPJ e ato constitutivo",
            "Documentos fiscais",
            "Informações de folha"
        ],
        "Necessária aprovação dos honorários e do contrato."
    ),

    // ==================================================
    // SERVICOS COMPLEXOS
    // Valores referentes ao diagnostico inicial.
    // ==================================================

    servico(
        "regularizacao",
        "Regularização empresarial",
        35000,
        "diagnostico",
        true,
        [
            "CNPJ",
            "Relatórios de pendências",
            "Notificações recebidas"
        ],
        "A execução será objeto de orçamento separado."
    ),

    servico(
        "recuperacao-creditos",
        "Recuperação de créditos tributários",
        50000,
        "diagnostico",
        true,
        [
            "Documentos fiscais",
            "Apurações tributárias",
            "Comprovantes de recolhimento"
        ],
        "Necessária análise da existência e validade dos créditos."
    ),

    servico(
        "balanco-retroativo",
        "Balanço patrimonial retroativo",
        35000,
        "diagnostico",
        true,
        [
            "Balancetes existentes",
            "Extratos bancários",
            "Documentos contábeis"
        ],
        "O preço da execução depende dos registros existentes."
    ),

    servico(
        "escrituracao-retroativa",
        "Escrituração contábil retroativa",
        40000,
        "diagnostico",
        true,
        [
            "Documentos contábeis",
            "Documentos fiscais",
            "Períodos pendentes"
        ],
        "Necessário avaliar o volume de documentos."
    ),

    servico(
        "revisao-fiscal",
        "Revisão fiscal",
        62500,
        "diagnostico",
        true,
        [
            "Apurações fiscais",
            "Declarações transmitidas",
            "Documentos fiscais"
        ],
        "Necessária definição dos períodos e do escopo."
    ),

    servico(
        "diagnostico-endividamento",
        "Diagnóstico de endividamento",
        35000,
        "diagnostico",
        true,
        [
            "Relação de dívidas",
            "Contratos financeiros",
            "Informações de receitas e despesas"
        ],
        "Necessária análise da situação financeira."
    ),

    servico(
        "reestruturacao",
        "Reestruturação empresarial",
        62500,
        "diagnostico",
        true,
        [
            "Contrato social",
            "Demonstrações contábeis",
            "Descrição dos objetivos empresariais"
        ],
        "Necessária definição individual do projeto."
    ),

    // ==================================================
    // SERVICOS COM REQUISITOS PROFISSIONAIS ESPECIFICOS
    // Permanecem indisponiveis ate habilitacao.
    // ==================================================

    servico(
        "pericia",
        "Perícia contábil",
        50000,
        "diagnostico",
        true,
        [
            "Descrição da demanda",
            "Documentos relacionados ao objeto da perícia"
        ],
        "Disponibilidade sujeita à habilitação profissional.",
        false
    ),

    servico(
        "auditoria",
        "Auditoria contábil",
        75000,
        "diagnostico",
        true,
        [
            "Demonstrações contábeis",
            "Descrição do objeto da auditoria"
        ],
        "Disponibilidade sujeita à habilitação profissional.",
        false
    )

];

// ======================================================
// 03. CARRINHO
// ======================================================

const carrinho = new Map();

const documentosMarcados = new Set();

function adicionarServico(item) {

    if (!item.ativo) {

        alert("Serviço temporariamente indisponível.");

        return;

    }

    carrinho.set(item.codigo, {
        ...item
    });

    renderizarCarrinho();

}

function removerServico(codigo) {

    carrinho.delete(codigo);

    renderizarCarrinho();

}

// ======================================================
// 04. REGRAS DE PRECIFICACAO
// ======================================================

function apresentarPreco(item) {

    switch (item.tipo) {

        case "gratuito":

            return "Gratuito";

        case "fixo":

            return money(item.preco);

        case "sessao":

            return money(item.preco) + " por sessão";

        case "diagnostico":

            return money(item.preco) +
                " — diagnóstico inicial";

        case "mensal":

            return money(item.preco) +
                " / mês — estimativa";

        default:

            return "A partir de " + money(item.preco);

    }

}

function potencialPagamentoDireto(item) {

    return (

        item.ativo === true &&

        item.consultaPrevia === false &&

        item.pagamentoAntecipado === true &&

        ["fixo", "sessao"].includes(item.tipo) &&

        item.preco > 0

    );

}

function pagamentoLiberado(item) {

    return (

        CONFIG.pagamentoHabilitado === true &&

        potencialPagamentoDireto(item) &&

        item.escopoValidado === true

    );

}

function situacaoServico(item) {

    if (!item.ativo) {

        return "🔒 Temporariamente indisponível";

    }

    if (item.tipo === "gratuito") {

        return "Sem cobrança";

    }

    if (item.consultaPrevia) {

        return "🔒 Consulta prévia obrigatória";

    }

    if (pagamentoLiberado(item)) {

        return "Pagamento disponível";

    }

    if (potencialPagamentoDireto(item)) {

        return "Pagamento direto previsto";

    }

    return "🔒 Pagamento bloqueado";

}

// ======================================================
// 05. EXIBIR CATALOGO
// ======================================================

function renderizarCatalogo() {

    $("catalogo").replaceChildren();

    for (const item of CATALOGO) {

        // A contabilidade mensal possui simulador proprio.

        if (item.codigo === "mensal") {

            continue;

        }

        const card = elemento("article");

        const titulo = elemento("h3", item.nome);

        const preco = elemento(
            "p",
            apresentarPreco(item)
        );

        preco.style.fontWeight = "700";

        preco.style.color = "#0A2540";

        const status = elemento(
            "p",
            situacaoServico(item)
        );

        status.style.fontSize = "13px";

        status.style.color =
            item.consultaPrevia || !item.ativo
                ? "#92400E"
                : "#475569";

        card.append(titulo, preco, status);

        if (item.motivo) {

            card.append(
                elemento("p", item.motivo)
            );

        }

        if (item.tipo === "diagnostico") {

            card.append(
                elemento(
                    "p",
                    "A execução não está inclusa no valor do diagnóstico."
                )
            );

        }

        if (item.tipo === "gratuito") {

            card.append(
                elemento(
                    "p",
                    "Formalização gratuita no Portal do Empreendedor."
                )
            );

        }

        const adicionar = botao(

            item.ativo
                ? "Adicionar ao carrinho"
                : "Indisponível",

            () => adicionarServico(item)

        );

        adicionar.disabled = !item.ativo;

        card.append(adicionar);

        $("catalogo").append(card);

    }

}

// ======================================================
// 06. CALCULO DOS TOTAIS
// ======================================================

function calcularTotais() {

    const totais = {

        avulsoDireto: 0,

        avulsoAnalise: 0,

        diagnostico: 0,

        mensal: 0,

        pagamentoLiberado: 0,

        gratuitos: 0

    };

    for (const item of carrinho.values()) {

        const valor = item.preco * item.quantidade;

        if (item.tipo === "gratuito") {

            totais.gratuitos++;

        } else if (item.tipo === "mensal") {

            totais.mensal += valor;

        } else if (item.tipo === "diagnostico") {

            totais.diagnostico += valor;

        } else if (potencialPagamentoDireto(item)) {

            totais.avulsoDireto += valor;

        } else {

            totais.avulsoAnalise += valor;

        }

        if (pagamentoLiberado(item)) {

            totais.pagamentoLiberado += valor;

        }

    }

    totais.estimativaAvulsa =

        totais.avulsoDireto +

        totais.avulsoAnalise +

        totais.diagnostico;

    return totais;

}

function exibirTotais(destino) {

    const t = calcularTotais();

    destino.append(

        elemento(
            "p",
            "Serviços avulsos padronizados: " +
            money(t.avulsoDireto)
        ),

        elemento(
            "p",
            "Serviços avulsos sob análise: " +
            money(t.avulsoAnalise)
        ),

        elemento(
            "p",
            "Diagnósticos iniciais: " +
            money(t.diagnostico)
        ),

        elemento(
            "p",
            "Total avulso de referência: " +
            money(t.estimativaAvulsa)
        ),

        elemento(
            "p",
            "Honorários mensais estimados: " +
            money(t.mensal) + " / mês"
        ),

        elemento(
            "p",
            "Disponível para pagamento agora: " +
            money(t.pagamentoLiberado)
        )

    );

    if (t.diagnostico > 0) {

        destino.append(
            elemento(
                "p",
                "A execução dos serviços complexos será orçada separadamente."
            )
        );

    }

    destino.append(
        elemento(
            "p",
            "Tributos, multas, taxas públicas e despesas adicionais não estão inclusos."
        )
    );

}

// ======================================================
// 07. RENDERIZAR CARRINHO
// ======================================================

function renderizarCarrinho() {

    $("revisao").hidden = true;

    $("carrinho").replaceChildren();

    $("total").replaceChildren();

    if (carrinho.size === 0) {

        $("carrinho").append(
            elemento("p", "Seu carrinho está vazio.")
        );

        $("continuar").disabled = true;

        renderizarDocumentos();

        return;

    }

    for (const item of carrinho.values()) {

        const linha = elemento("div");

        linha.className = "cc-line";

        const informacoes = elemento("div");

        informacoes.append(

            elemento("strong", item.nome),

            elemento("p", apresentarPreco(item)),

            elemento("p", situacaoServico(item))

        );

        linha.append(

            informacoes,

            botao(
                "Remover",
                () => removerServico(item.codigo)
            )

        );

        $("carrinho").append(linha);

    }

    exibirTotais($("total"));

    $("continuar").disabled = false;

    renderizarDocumentos();

}

// ======================================================
// 08. CHECKLIST DE DOCUMENTOS
// ======================================================

function renderizarDocumentos() {

    $("docs").replaceChildren();

    const documentos = new Set();

    for (const item of carrinho.values()) {

        item.documentos.forEach(
            documento => documentos.add(documento)
        );

    }

    for (const documento of documentosMarcados) {

        if (!documentos.has(documento)) {

            documentosMarcados.delete(documento);

        }

    }

    if (!documentos.size) {

        $("docs").append(
            elemento(
                "p",
                "Adicione serviços para consultar a documentação."
            )
        );

        return;

    }

    $("docs").append(
        elemento(
            "p",
            "Marque os documentos que você já possui. Não envie arquivos ou dados reais neste ambiente."
        )
    );

    for (const documento of documentos) {

        const label = elemento("label");

        label.className = "cc-check";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            documentosMarcados.has(documento);

        checkbox.addEventListener("change", () => {

            if (checkbox.checked) {

                documentosMarcados.add(documento);

            } else {

                documentosMarcados.delete(documento);

            }

            $("revisao").hidden = true;

        });

        label.append(

            checkbox,

            document.createTextNode(documento)

        );

        $("docs").append(label);

    }

}

// ======================================================
// 09. SIMULADOR DE HONORARIOS MENSAIS
// ======================================================

const tabelaMensal = window.PRECOS_MENSAIS || [];

function preencherOpcoes(id, valores) {

    $(id).replaceChildren(

        ...valores.map(
            valor => new Option(valor, valor)
        )

    );

}

function sincronizarFaixas() {

    const regime = $("regime").value;

    const faixas = [

        ...new Set(

            tabelaMensal

                .filter(r => r.regime === regime)

                .map(r => r.faixa)

        )

    ];

    preencherOpcoes("faixa", faixas);

    calcularMensal();

}

function calcularMensal() {

    const linha = tabelaMensal.find(r =>

        r.regime === $("regime").value &&

        r.faixa === $("faixa").value &&

        r.setor === $("setor").value

    );

    const vinculos = Number($("vinculos").value);

    if (

        !linha ||

        $("vinculos").value.trim() === "" ||

        !Number.isInteger(vinculos) ||

        vinculos < 0 ||

        vinculos > 10000 ||

        !Number.isFinite(Number(linha.valor)) ||

        Number(linha.valor) <= 0

    ) {

        $("estimativa").textContent =
            "Não foi possível calcular. Necessária consulta.";

        $("mensal").disabled = true;

        return null;

    }

    const valorPorVinculo =

        vinculos <= 2 ? 16550 :

        vinculos <= 5 ? 14560 :

        vinculos <= 10 ? 12950 :

        vinculos <= 20 ? 11820 :

        vinculos <= 40 ? 10750 :

        8730;

    const valorBase = Math.round(
        Number(linha.valor) * 100
    );

    const departamentoPessoal =

        vinculos * valorPorVinculo;

    const total =

        valorBase + departamentoPessoal;

    $("estimativa").textContent =

        "Honorário mensal estimado: " +

        money(total) +

        " / mês — sujeito à aprovação do contador.";

    $("mensal").disabled = false;

    return total;

}

function inicializarSimulador() {

    preencherOpcoes(

        "regime",

        [...new Set(tabelaMensal.map(r => r.regime))]

    );

    preencherOpcoes(

        "setor",

        [...new Set(tabelaMensal.map(r => r.setor))]

    );

    $("regime").addEventListener(
        "change",
        sincronizarFaixas
    );

    for (const id of [
        "faixa",
        "setor",
        "vinculos"
    ]) {

        $(id).addEventListener(
            "input",
            calcularMensal
        );

    }

    $("mensal").addEventListener("click", () => {

        const valor = calcularMensal();

        if (valor === null) {

            return;

        }

        const base = CATALOGO.find(
            item => item.codigo === "mensal"
        );

        adicionarServico({

            ...base,

            preco: valor,

            nome: "Contabilidade mensal — " +
                $("regime").value,

            dadosSimulacao: {

                regime: $("regime").value,

                faixa: $("faixa").value,

                setor: $("setor").value,

                vinculos: Number($("vinculos").value)

            }

        });

    });

    sincronizarFaixas();

}

// ======================================================
// 10. REVISAO DO CADASTRO
// ======================================================

function revisarPedido(evento) {

    evento.preventDefault();

    if (!carrinho.size) {

        alert("Adicione pelo menos um serviço.");

        return;

    }

    const dados = new FormData(evento.target);

    const telefone = String(
        dados.get("whatsapp") || ""
    ).replace(/\D/g, "");

    const cnpj = String(
        dados.get("cnpj") || ""
    ).replace(/\D/g, "");

    if (

        telefone.length < 10 ||

        telefone.length > 13

    ) {

        alert("Confira o número do WhatsApp.");

        return;

    }

    if (cnpj && cnpj.length !== 14) {

        alert("Confira o CNPJ informado.");

        return;

    }

    $("resumo").replaceChildren();

    for (const item of carrinho.values()) {

        $("resumo").append(

            elemento(
                "h3",
                item.nome
            ),

            elemento(
                "p",
                apresentarPreco(item)
            ),

            elemento(
                "p",
                situacaoServico(item)
            )

        );

        if (item.dadosSimulacao) {

            const d = item.dadosSimulacao;

            $("resumo").append(

                elemento(
                    "p",
                    [
                        d.regime,
                        d.faixa,
                        d.setor,
                        d.vinculos + " vínculos"
                    ].join(" | ")
                )

            );

        }

    }

    exibirTotais($("resumo"));

    $("resumo").append(
        elemento(
            "p",
            "Ambiente de testes: nenhum pedido foi transmitido ao banco de dados."
        )
    );

    // Trava absoluta nesta versao.
    // Nenhuma cobranca real pode ser criada.

    $("pagar").disabled = true;

    $("pagar").textContent =
        "Pagamento online — integração pendente";

    $("revisao").hidden = false;

    $("revisao").scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}

// ======================================================
// 11. SOLICITACAO DE REUNIAO
// ======================================================

function solicitarReuniao() {

    if (!carrinho.size) {

        alert("Selecione os serviços desejados.");

        return;

    }

    const mensagem = [

        "Olá! Gostaria de conversar com a Casa Contábil.",

        "",

        "Serviços de meu interesse:",

        ...Array.from(carrinho.values()).map(item =>

            "- " +

            item.nome +

            ": " +

            apresentarPreco(item)

        ),

        "",

        "Gostaria de confirmar os valores e as condições de atendimento."

    ].join("\n");

    const url =

        "https://wa.me/" +

        CONFIG.whatsapp +

        "?text=" +

        encodeURIComponent(mensagem);

    window.location.href = url;

}

// ======================================================
// 12. INICIALIZACAO
// ======================================================

function iniciarSistema() {

    const obrigatorios = [

        "catalogo",
        "regime",
        "faixa",
        "setor",
        "vinculos",
        "estimativa",
        "mensal",
        "carrinho",
        "total",
        "docs",
        "cadastro",
        "continuar",
        "revisao",
        "resumo",
        "pagar",
        "reuniao"

    ];

    const ausentes = obrigatorios.filter(
        id => !$(id)
    );

    if (ausentes.length) {

        console.error(

            "Casa Contábil: elementos HTML ausentes.",

            ausentes

        );

        if ($("pagar")) {

            $("pagar").disabled = true;

        }

        return;

    }

    $("pagar").disabled = true;

    $("cadastro").addEventListener("input", () => {

        $("revisao").hidden = true;

    });

    $("cadastro").addEventListener(
        "submit",
        revisarPedido
    );

    $("reuniao").addEventListener(
        "click",
        solicitarReuniao
    );

    renderizarCatalogo();

    inicializarSimulador();

    renderizarCarrinho();

    console.info(

        "Casa Contábil 1.1 — ambiente de testes."

    );

}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarSistema
    );

} else {

    iniciarSistema();

}

// ======================================================
// FIM DO ARQUIVO
// CASA CONTABIL - VERSAO 1.1
// ======================================================

// ======================================================
// CASA CONTABIL
// INTEGRACAO DO CARRINHO COM CHECKOUT
// VERSAO 1.2
// ======================================================

function finalizarContratacao() {

    if (!carrinho.size) {

        alert("Selecione pelo menos um serviço.");

        return;

    }

    const itensCheckout = Array.from(

        carrinho.values()

    ).map(item => ({

        codigo: item.codigo,

        nome: item.nome,

        preco: item.preco,

        tipo: item.tipo,

        ativo: item.ativo,

        consultaPrevia: item.consultaPrevia,

        pagamentoAntecipado:
            item.pagamentoAntecipado,

        documentos: item.documentos || [],

        documentosDisponiveis:

            (item.documentos || []).filter(

                documento =>

                    documentosMarcados.has(documento)

            ),

        dadosSimulacao:

            item.dadosSimulacao || null

    }));

    try {

        sessionStorage.setItem(

            "cc_carrinho_v2",

            JSON.stringify(itensCheckout)

        );

        window.location.href = "checkout.html";

    } catch {

        alert(

            "Não foi possível transferir o carrinho. " +

            "Confira as configurações do navegador."

        );

    }

}

function integrarCheckout() {

    const continuar = document.getElementById(

        "continuar"

    );

    const cadastro = document.getElementById(

        "cadastro"

    );

    const revisao = document.getElementById(

        "revisao"

    );

    if (!continuar || !cadastro) {

        console.error(

            "Não foi possível integrar o checkout."

        );

        return;

    }

    // Retirar o botao do formulario antigo.

    const novoBotao = continuar.cloneNode(true);

    novoBotao.type = "button";

    novoBotao.textContent =

        "Finalizar contratação";

    continuar.remove();

    cadastro.before(novoBotao);

    // Ocultar o cadastro antigo.

    cadastro.hidden = true;

    if (revisao) {

        revisao.hidden = true;

    }

    novoBotao.disabled = carrinho.size === 0;

    novoBotao.addEventListener(

        "click",

        finalizarContratacao

    );

}

if (document.readyState === "loading") {

    document.addEventListener(

        "DOMContentLoaded",

        integrarCheckout

    );

} else {

    integrarCheckout();

}
