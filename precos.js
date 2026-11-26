
/* =====================================================
   CASA CONTÁBIL
   TABELA DE HONORÁRIOS CONTÁBEIS
   Arquivo: precos.js
   Ambiente: TESTES
   ===================================================== */

(function () {
    "use strict";

    const setores = [
        "Serviço",
        "Comércio",
        "Indústria",
        "Multissetorial"
    ];

    const faixas = [
        ["MEI", "Até R$ 81.000,00"],
        ["ME", "Até R$ 180.000,00"],
        ["ME", "R$ 180.000,01 a R$ 360.000,00"],
        ["EPP", "R$ 360.000,01 a R$ 720.000,00"],
        ["EPP", "R$ 720.000,01 a R$ 1.800.000,00"],
        ["EPP", "R$ 1.800.000,01 a R$ 3.600.000,00"],
        ["EPP", "R$ 3.600.000,01 a R$ 4.800.000,00"]
    ];

    /* =================================================
       01. SIMPLES NACIONAL

       Ordem dos valores:
       Serviço, Comércio, Indústria, Multissetorial
       ================================================= */

    const simplesNacional = [
        [400, 550, 700, 800],
        [800, 1100, 1250, 1350],
        [1200, 1850, 2100, 2250],
        [2250, 2450, 2650, 3120],
        [3250, 3505, 3625, 4120],
        [4680, 4985, 5245, 6120],
        [5850, 6450, 6875, 7850]
    ];

    /* =================================================
       02. LUCRO PRESUMIDO
       ================================================= */

    const lucroPresumido = [
        null,
        [950, 1220, 1320, 1750],
        [2120, 2320, 2485, 2950],
        [4395, 4645, 4765, 5510],
        [5205, 5450, 5500, 6485],
        [6285, 6530, 6685, 7650],
        [8450, 8710, 8830, 10320]
    ];

    /* =================================================
       03. LUCRO REAL
       ================================================= */

    const lucroReal = [
        null,
        [1650, 1880, 2000, 2150],
        [3200, 3420, 3625, 3995],
        [3950, 4210, 4420, 5200],
        [6200, 6450, 6850, 7120],
        [9100, 10120, 10295, 11200],
        [13120, 13350, 13450, 15800]
    ];

    /* =================================================
       04. ORGANIZAÇÃO DAS TABELAS
       ================================================= */

    const tabelas = {
        "Simples Nacional": simplesNacional,
        "Lucro Presumido": lucroPresumido,
        "Lucro Real": lucroReal
    };

    const precosMensais = [];

    Object.entries(tabelas).forEach(
        ([regime, valores]) => {

            valores.forEach((linha, indice) => {

                if (!linha) {
                    return;
                }

                const [porte, faixa] = faixas[indice];

                linha.forEach((valor, setorIndice) => {

                    precosMensais.push({
                        regime: regime,
                        porte: porte,
                        faixa: faixa,
                        setor: setores[setorIndice],
                        valor: valor
                    });

                });

            });

        }
    );

    /* =================================================
       05. DISPONIBILIZAÇÃO PARA O AUTOATENDIMENTO
       ================================================= */

    window.PRECOS_MENSAIS = precosMensais;

})();
