
"use strict";

(() => {

    const CHAVE = "cc_carrinho_v2";
    const WHATSAPP = "5569993842735";

    const $ = id => document.getElementById(id);

    const moeda = centavos =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(centavos / 100);

    let itens = [];
    let dadosCliente = null;

    const tiposPermitidos = [
        "gratuito",
        "fixo",
        "variavel",
        "sessao",
        "diagnostico",
        "mensal",
        "orcamento"
    ];

    function texto(tag, conteudo = "") {

        const e = document.createElement(tag);
        e.textContent = conteudo;

        return e;
    }

    // ==========================================
    // 01. CARREGAMENTO DO CARRINHO
    // ==========================================

    function carregarCarrinho() {

        try {

            const bruto = JSON.parse(
                sessionStorage.getItem(CHAVE) || "[]"
            );

            if (
                !Array.isArray(bruto) ||
                bruto.length > 28
            ) {
                return [];
            }

            const codigos = new Set();

            for (const item of bruto) {

                if (
                    !item ||
                    typeof item.codigo !== "string" ||
                    !/^[a-z0-9-]{1,80}$/.test(item.codigo) ||
                    typeof item.nome !== "string" ||
                    item.nome.length > 200 ||
                    !Number.isSafeInteger(item.preco) ||
                    item.preco < 0 ||
                    item.preco > 1000000000 ||
                    !tiposPermitidos.includes(item.tipo) ||
                    typeof item.consultaPrevia !== "boolean" ||
                    typeof item.pagamentoAntecipado !== "boolean" ||
                    item.ativo !== true ||
                    codigos.has(item.codigo)
                ) {
                    return [];
                }

                codigos.add(item.codigo);
            }

            return bruto;

        } catch {
            return [];
        }
    }

    // ==========================================
    // 02. CONTROLE DAS ETAPAS
    // ==========================================

    function mostrarEtapa(etapa) {

        for (const nome of [
            "cadastro", "revisao", "pagamento"
        ]) {

            $("etapa-" + nome).hidden = nome !== etapa;
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // ==========================================
    // 03. REGRAS DE PAGAMENTO
    // ==========================================

    function pagamentoDiretoPrevisto(item) {

        return item.ativo === true &&
            item.consultaPrevia === false &&
            item.pagamentoAntecipado === true &&
            ["fixo", "sessao"].includes(item.tipo) &&
            item.preco > 0;
    }

    function descricaoPreco(item) {

        switch (item.tipo) {

            case "gratuito":
                return "Gratuito";

            case "mensal":
                return moeda(item.preco) + " / mês — estimativa";

            case "diagnostico":
                return moeda(item.preco) + " — diagnóstico inicial";

            case "sessao":
                return moeda(item.preco) + " por sessão";

            case "fixo":
                return moeda(item.preco);

            default:
                return "A partir de " + moeda(item.preco);
        }
    }

    function calcularTotais() {

        const t = {
            direto: 0,
            analise: 0,
            diagnostico: 0,
            mensal: 0
        };

        for (const item of itens) {

            if (item.tipo === "gratuito") continue;

            if (item.tipo === "mensal") {
                t.mensal += item.preco;
            } else if (item.tipo === "diagnostico") {
                t.diagnostico += item.preco;
            } else if (pagamentoDiretoPrevisto(item)) {
                t.direto += item.preco;
            } else {
                t.analise += item.preco;
            }
        }

        t.avulso = t.direto + t.analise + t.diagnostico;

        return t;
    }

    // ==========================================
    // 04. PERFIL DO CLIENTE
    // ==========================================

    function atualizarPerfil() {

        const perfil = $("perfil").value;

        const empresarial =
            perfil === "pj" || perfil === "mei";

        $("dados-empresa").hidden = !empresarial;

        $("razao_social").disabled = !empresarial;
        $("cnpj").disabled = !empresarial;

        if (!empresarial) {

            $("razao_social").value = "";
            $("cnpj").value = "";
        }
    }

    // ==========================================
    // 05. VALIDACAO DO CADASTRO
    // ==========================================

    function revisar(evento) {

        evento.preventDefault();

        if (!itens.length) {

            alert("Seu carrinho está vazio.");
            return;
        }

        const dados = Object.fromEntries(
            new FormData(evento.target).entries()
        );

        for (const chave of Object.keys(dados)) {

            dados[chave] = String(dados[chave]).trim();
        }

        const telefone = String(
            dados.whatsapp || ""
        ).replace(/\D/g, "");

        const cnpj = String(
            dados.cnpj || ""
        ).replace(/[.\-\/\s]/g, "").toUpperCase();

        if (!["pf", "pj", "mei", "rural"].includes(dados.perfil)) {

            alert("Selecione o tipo de cliente.");
            return;
        }

        if (!dados.nome || !dados.cidade_uf || !dados.email) {

            alert("Confira os campos obrigatórios.");
            return;
        }

        if (
            telefone.length < 10 ||
            telefone.length > 13
        ) {

            alert("Confira o WhatsApp informado.");
            return;
        }

        if (
            cnpj &&
            !/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)
        ) {

            alert("Confira o formato do CNPJ.");
            return;
        }

        dadosCliente = {
            ...dados,
            whatsapp: telefone,
            cnpj
        };

        $("aceite-termos").checked = false;
        $("btn-pagamento").disabled = true;

        renderizarResumo();

        mostrarEtapa("revisao");
    }

    // ==========================================
    // 06. REVISAO DOS SERVICOS
    // ==========================================

    function renderizarResumo() {

        $("resumo-cliente").replaceChildren(

            texto("h3", "Dados do cliente"),

            texto("p", dadosCliente.nome),

            texto("p", dadosCliente.email),

            texto("p", dadosCliente.whatsapp),

            texto("p", dadosCliente.cidade_uf)
        );

        if (dadosCliente.razao_social) {

            $("resumo-cliente").append(
                texto("p", dadosCliente.razao_social)
            );
        }

        if (dadosCliente.cnpj) {

            $("resumo-cliente").append(
                texto("p", "CNPJ: " + dadosCliente.cnpj)
            );
        }

        const resumo = $("resumo-servicos");

        resumo.replaceChildren(
            texto("h3", "Serviços selecionados")
        );

        for (const item of itens) {

            const linha = texto("div");

            linha.className = "cc-line";

            const info = texto("div");

            const status =
                item.tipo === "gratuito"
                    ? "Sem cobrança"
                    : item.consultaPrevia
                        ? "🔒 Consulta prévia obrigatória"
                        : pagamentoDiretoPrevisto(item)
                            ? "Pagamento direto previsto"
                            : "🔒 Pagamento bloqueado";

            info.append(

                texto("strong", item.nome),

                texto("p", descricaoPreco(item)),

                texto("p", status)
            );

            if (item.tipo === "diagnostico") {

                info.append(texto(
                    "p",
                    "Execução orçada separadamente."
                ));
            }

            if (
                item.tipo === "mensal" &&
                item.dadosSimulacao
            ) {

                const d = item.dadosSimulacao;

                info.append(texto(
                    "p",
                    [
                        d.regime,
                        d.faixa,
                        d.setor,
                        d.vinculos + " vínculos"
                    ].join(" | ")
                ));
            }

            if (Array.isArray(item.documentosDisponiveis)) {

                const docs = item.documentosDisponiveis
                    .filter(d => typeof d === "string")
                    .slice(0, 30);

                if (docs.length) {

                    info.append(texto(
                        "p",
                        "Documentos disponíveis: " + docs.join("; ")
                    ));
                }
            }

            linha.append(info);

            resumo.append(linha);
        }

        const t = calcularTotais();

        $("resumo-financeiro").replaceChildren(

            texto("h3", "Resumo financeiro"),

            texto(
                "p",
                "Serviços padronizados: " + moeda(t.direto)
            ),

            texto(
                "p",
                "Serviços sob análise: " + moeda(t.analise)
            ),

            texto(
                "p",
                "Diagnósticos iniciais: " + moeda(t.diagnostico)
            ),

            texto(
                "strong",
                "Total avulso de referência: " + moeda(t.avulso)
            ),

            texto(
                "p",
                "Honorários mensais estimados: " +
                moeda(t.mensal) + " / mês"
            ),

            texto(
                "p",
                "Disponível para pagamento agora: R$ 0,00"
            ),

            texto(
                "p",
                "Tributos e taxas públicas não inclusos."
            )
        );
    }

    // ==========================================
    // 07. FINALIZACAO E PAGAMENTO
    // ==========================================

    function abrirPagamento() {

        if (
            !$("aceite-termos").checked ||
            !dadosCliente ||
            !itens.length
        ) {
            return;
        }

        const t = calcularTotais();

        $("valor-pagamento").replaceChildren(

            texto(
                "h3",
                "Valor previsto para pagamento direto"
            ),

            texto("strong", moeda(t.direto)),

            texto(
                "p",
                "Valor atualmente autorizado: R$ 0,00"
            )
        );

        $("metodos-pagamento").hidden = t.direto === 0;

        // Bloqueio obrigatório até integração do backend.

        $("btn-confirmar").disabled = true;

        $("btn-confirmar").textContent =
            t.direto > 0
                ? "Pagamento indisponível em testes"
                : "Solicitação online ainda indisponível";

        atualizarMetodo();

        mostrarEtapa("pagamento");
    }

    function atualizarMetodo() {

        const t = calcularTotais();

        if (t.direto === 0) {

            $("mensagem-pagamento").textContent =
                "Nenhum serviço possui cobrança direta prevista. " +
                "Solicite atendimento pelo WhatsApp.";

            return;
        }

        const metodo = document.querySelector(
            'input[name="metodo"]:checked'
        )?.value;

        const mensagens = {

            pix:
                "O QR Code será gerado no ambiente seguro do provedor.",

            cartao:
                "Os dados do cartão serão informados diretamente no provedor.",

            boleto:
                "O boleto será gerado conforme as condições disponíveis."
        };

        $("mensagem-pagamento").textContent =
            (mensagens[metodo] || "") +
            " Integração ainda em homologação.";
    }

    // ==========================================
    // 08. ATENDIMENTO PELO WHATSAPP
    // ==========================================

    function configurarWhatsApp() {

        const mensagem = [

            "Olá! Gostaria de atendimento da Casa Contábil.",

            "",

            "Serviços de meu interesse:",

            ...itens.map(item =>
                "- " + item.nome + ": " + descricaoPreco(item)
            ),

            "",

            "Gostaria de confirmar as condições de contratação."

        ].join("\n");

        $("link-whatsapp").href =
            "https://wa.me/" + WHATSAPP +
            "?text=" + encodeURIComponent(mensagem);
    }

    // ==========================================
    // 09. INICIALIZACAO
    // ==========================================

    function iniciar() {

        itens = carregarCarrinho();

        $("btn-confirmar").disabled = true;

        if (!itens.length) {

            $("checkout-status").textContent =
                "Nenhum carrinho válido encontrado. " +
                "Volte à página de serviços.";

            $("etapa-cadastro").hidden = true;

            return;
        }

        $("checkout-status").textContent =
            itens.length + " serviço(s) selecionado(s).";

        $("perfil").addEventListener(
            "change", atualizarPerfil
        );

        $("form-checkout").addEventListener(
            "submit", revisar
        );

        $("aceite-termos").addEventListener(
            "change",
            evento => {

                $("btn-pagamento").disabled =
                    !evento.target.checked;
            }
        );

        $("btn-pagamento").addEventListener(
            "click", abrirPagamento
        );

        $("btn-voltar-cadastro").addEventListener(
            "click",
            () => mostrarEtapa("cadastro")
        );

        $("btn-voltar-revisao").addEventListener(
            "click",
            () => mostrarEtapa("revisao")
        );

        document.querySelectorAll(
            'input[name="metodo"]'
        ).forEach(input => {

            input.addEventListener(
                "change", atualizarMetodo
            );
        });

        atualizarPerfil();

        configurarWhatsApp();

        mostrarEtapa("cadastro");

        console.info(
            "Casa Contábil — Checkout 1.3 — Testes"
        );
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded", iniciar
        );

    } else {

        iniciar();
    }

})();
