
/* =====================================================
   CASA CONTÁBIL
   CENTRAL DE AUTOATENDIMENTO
   Arquivo: atendimento.js
   Versão: 1.0 - TESTES
   ===================================================== */

"use strict";

/* =====================================================
   01. FUNÇÕES AUXILIARES
   ===================================================== */

const $ = id => document.getElementById(id);

const money = n => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
}).format(n / 100);

const el = (tag, text) => {
    const elemento = document.createElement(tag);
    elemento.textContent = text;
    return elemento;
};

const btn = (text, fn) => {
    const botao = el("button", text);
    botao.type = "button";
    botao.onclick = fn;
    return botao;
};

/* =====================================================
   02. CATÁLOGO DE SERVIÇOS

   Estrutura:
   Código
   Nome do serviço
   Valor em centavos
   Disponível para pagamento antecipado
   Documentação necessária
   ===================================================== */

const catalogo = [

    [
        "mei-abertura",
        "Formalização MEI",
        0,
        false,
        [
            "Atividade e endereço pretendidos"
        ]
    ],

    [
        "mei-alteracao",
        "Alteração MEI",
        40000,
        false,
        [
            "CCMEI",
            "Descrição da alteração"
        ]
    ],

    [
        "mei-baixa",
        "Baixa MEI",
        60000,
        false,
        [
            "CCMEI",
            "Situação das obrigações"
        ]
    ],

    [
        "dasn",
        "DASN-SIMEI",
        25000,
        true,
        [
            "CNPJ",
            "Receitas anuais",
            "Informações sobre empregados"
        ]
    ],

    [
        "dirpf",
        "DIRPF individual",
        30000,
        false,
        [
            "Ano-exercício",
            "Comprovantes de rendimentos"
        ]
    ],

    [
        "ditr",
        "DITR",
        35000,
        false,
        [
            "CIB",
            "Dados do imóvel rural"
        ]
    ],

    [
        "nfse",
        "Emissão NFS-e",
        5000,
        true,
        [
            "Dados da operação",
            "Inscrição municipal, se aplicável"
        ]
    ],

    [
        "nfe",
        "Emissão NF-e / NFA-e",
        10000,
        false,
        [
            "Dados da operação",
            "Inscrição estadual, se aplicável"
        ]
    ],

    [
        "cnd",
        "Consulta fiscal / CND",
        20000,
        true,
        [
            "CNPJ ou identificação do contribuinte"
        ]
    ],

    [
        "consultoria",
        "Consultoria contábil (hora)",
        25000,
        false,
        [
            "Descrição da demanda"
        ]
    ],

    [
        "tributaria",
        "Consultoria tributária (hora)",
        62500,
        false,
        [
            "Regime tributário",
            "Descrição da demanda"
        ]
    ],

    [
        "planejamento",
        "Planejamento tributário (hora)",
        76000,
        false,
        [
            "Regime tributário",
            "Faturamento"
        ]
    ],

    [
        "rescisao",
        "Rescisão trabalhista",
        10000,
        false,
        [
            "Dados do vínculo em canal seguro"
        ]
    ],

    [
        "abertura-sn",
        "Abertura ME/EPP Simples Nacional",
        80000,
        false,
        [
            "Atividades",
            "Dados dos sócios",
            "Endereço pretendido"
        ]
    ],

    [
        "abertura-lp",
        "Abertura Lucro Presumido",
        95000,
        false,
        [
            "Atividades",
            "Dados dos sócios",
            "Endereço pretendido"
        ]
    ],

    [
        "abertura-lr",
        "Abertura Lucro Real",
        120000,
        false,
        [
            "Atividades",
            "Dados dos sócios",
            "Endereço pretendido"
        ]
    ],

    [
        "alteracao",
        "Alteração ME/EPP",
        60000,
        false,
        [
            "Contrato social",
            "Descrição da alteração"
        ]
    ],

    [
        "baixa",
        "Baixa ME/EPP",
        80000,
        false,
        [
            "Contrato social",
            "Situação fiscal"
        ]
    ]

];

/* =====================================================
   03. CARRINHO E DOCUMENTAÇÃO
   ===================================================== */

const cart = new Map();

const checked = new Set();

function add(item) {

    cart.set(item[0], item);

    render();

}

/* =====================================================
   04. EXIBIÇÃO DO CATÁLOGO
   ===================================================== */

for (const item of catalogo) {

    const artigo = el("article", "");

    const descricao = item[2] === 0

        ? "Formalização gratuita no portal oficial; " +
          "assessoria sob consulta"

        : money(item[2]) +

          (
              item[3]

              ? " — referência avulsa"

              : " — referência sob orçamento"
          );

    artigo.append(

        el("h3", item[1]),

        el("p", descricao),

        btn("Adicionar", () => add(item))

    );

    $("catalogo").append(artigo);

}

/* =====================================================
   05. ATUALIZAÇÃO DO CARRINHO
   ===================================================== */

function render() {

    $("revisao").hidden = true;

    $("carrinho").replaceChildren();

    $("docs").replaceChildren();

    let total = 0;

    const docs = new Set();

    for (const item of cart.values()) {

        const linha = el("div", "");

        linha.className = "cc-line";

        const descricao = item[1] + " — " +

            (
                item[3]

                ? money(item[2])

                : "Sob orçamento"
            );

        linha.append(

            el("span", descricao),

            btn("Remover", () => {

                cart.delete(item[0]);

                render();

            })

        );

        $("carrinho").append(linha);

        if (item[3]) {

            total += item[2];

        }

        item[4].forEach(documento => {

            docs.add(documento);

        });

    }

    /* Remover marcações de documentos que
       não pertencem mais ao carrinho */

    for (const documento of checked) {

        if (!docs.has(documento)) {

            checked.delete(documento);

        }

    }

    /* Gerar checklist combinado */

    for (const documento of docs) {

        const label = el("label", "");

        label.className = "cc-check";

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            checked.has(documento);

        checkbox.onchange = () => {

            if (checkbox.checked) {

                checked.add(documento);

            } else {

                checked.delete(documento);

            }

            $("revisao").hidden = true;

        };

        label.append(

            checkbox,

            document.createTextNode(documento)

        );

        $("docs").append(label);

    }

    /* Atualizar subtotal */

    $("total").textContent = cart.size

        ? `Subtotal avulso estimado: ${money(total)}.
           Orçamentos separados.`

        : "Carrinho vazio";

    $("continuar").disabled = !cart.size;

}

/* =====================================================
   06. SIMULADOR DE HONORÁRIOS MENSAIS
   ===================================================== */

const rows = window.PRECOS_MENSAIS || [];

function opts(id, values) {

    $(id).replaceChildren(

        ...values.map(

            valor => new Option(valor, valor)

        )

    );

}

/* Carregar regimes tributários */

opts(

    "regime",

    [...new Set(rows.map(r => r.regime))]

);

/* Carregar setores */

opts(

    "setor",

    [...new Set(rows.map(r => r.setor))]

);

/* Atualizar faixas de faturamento */

function sync() {

    opts(

        "faixa",

        [...new Set(

            rows

                .filter(
                    r => r.regime === $("regime").value
                )

                .map(r => r.faixa)

        )]

    );

    estimate();

}

/* =====================================================
   07. CÁLCULO DOS HONORÁRIOS
   ===================================================== */

function estimate() {

    const registro = rows.find(r =>

        r.regime === $("regime").value &&

        r.faixa === $("faixa").value &&

        r.setor === $("setor").value

    );

    const vinculos = Number($("vinculos").value);

    if (

        !registro ||

        !Number.isInteger(vinculos) ||

        vinculos < 0 ||

        vinculos > 10000

    ) {

        $("estimativa").textContent =
            "Sob consulta";

        return null;

    }

    /* Valor adicional por vínculo em centavos */

    const unitario =

        vinculos <= 2  ? 16550 :

        vinculos <= 5  ? 14560 :

        vinculos <= 10 ? 12950 :

        vinculos <= 20 ? 11820 :

        vinculos <= 40 ? 10750 :

        8730;

    const valor =

        Math.round(registro.valor * 100) +

        vinculos * unitario;

    $("estimativa").textContent =

        money(valor) + " / mês (estimativa)";

    return valor;

}

/* Atualizar simulador */

$("regime").onchange = sync;

for (const id of ["faixa", "setor", "vinculos"]) {

    $(id).oninput = estimate;

}

sync();

/* Adicionar orçamento mensal ao carrinho */

$("mensal").onclick = () => {

    const valor = estimate();

    const descricao = [

        $("regime").value,

        $("faixa").value,

        $("setor").value,

        $("vinculos").value + " vínculos",

        valor === null

            ? "Sob consulta"

            : money(valor) + "/mês"

    ].join(" · ");

    add([

        "mensal",

        "Contabilidade mensal — " + descricao,

        valor || 0,

        false,

        [

            "CNPJ e ato constitutivo",

            "Documentos fiscais",

            "Informações de folha"

        ]

    ]);

};

/* =====================================================
   08. CADASTRO E VALIDAÇÃO
   ===================================================== */

$("cadastro").oninput = () => {

    $("revisao").hidden = true;

};

$("cadastro").onsubmit = evento => {

    evento.preventDefault();

    if (!cart.size) {

        return;

    }

    const dados = new FormData(evento.target);

    const telefone =

        String(dados.get("whatsapp"))

            .replace(/\D/g, "");

    const cnpj =

        String(dados.get("cnpj"))

            .replace(/\D/g, "");

    if (

        telefone.length < 10 ||

        telefone.length > 13 ||

        (cnpj && cnpj.length !== 14)

    ) {

        alert("Confira WhatsApp e CNPJ.");

        return;

    }

    /* Gerar resumo dos serviços */

    $("resumo").replaceChildren(

        ...[...cart.values()].map(item =>

            el(

                "p",

                item[1] + " — " +

                (

                    item[3]

                    ? money(item[2])

                    : "Sob orçamento"

                )

            )

        )

    );

    const subtotal = [...cart.values()]

        .filter(item => item[3])

        .reduce((total, item) => total + item[2], 0);

    $("resumo").append(

        el(

            "strong",

            "Subtotal avulso estimado: " + money(subtotal)

        )

    );

    $("revisao").hidden = false;

    $("revisao").scrollIntoView({

        behavior: "smooth"

    });

};

/* =====================================================
   09. SOLICITAÇÃO DE REUNIÃO
   ===================================================== */

$("reuniao").onclick = () => {

    const servicos = [...cart.values()]

        .map(item => item[1])

        .join("; ");

    const mensagem =

        "Olá! Gostaria de agendar uma reunião " +

        "com a Casa Contábil sobre: " +

        servicos;

    const whatsapp = "5569993842735";

    location.href =

        "https://wa.me/" +

        whatsapp +

        "?text=" +

        encodeURIComponent(mensagem);

};

/* =====================================================
   10. INICIALIZAÇÃO DO SISTEMA
   ===================================================== */

render();

/* =====================================================
   INTEGRAÇÕES FUTURAS

   - Supabase
   - Cadastro definitivo
   - CRM
   - Mercado Pago
   - Protocolo de atendimento
   - Confirmação por e-mail
   - Agendamento automático
   - Aprovação individual dos serviços
   - Estornos parciais e integrais

   Nenhuma cobrança real habilitada nesta versão.
   ===================================================== */
