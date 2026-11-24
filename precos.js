
"use strict";

window.CASA_PRECOS = {

  versao: "2026-11-teste",

  setores: [
    "Serviços",
    "Comércio",
    "Indústria",
    "Multissetorial"
  ],

  faixas: [
    "Até R$ 180.000,00",
    "R$ 180.000,01 a R$ 360.000,00",
    "R$ 360.000,01 a R$ 720.000,00",
    "R$ 720.000,01 a R$ 1.800.000,00",
    "R$ 1.800.000,01 a R$ 3.600.000,00",
    "R$ 3.600.000,01 a R$ 4.800.000,00",
    "Acima de R$ 4.800.000,00"
  ],

  mensal: {

    "MEI": [
      [400, 550, 700, 800]
    ],

    "Simples Nacional": [
      [800, 1100, 1250, 1350],
      [1200, 1850, 2100, 2250],
      [2250, 2450, 2650, 3120],
      [3250, 3505, 3625, 4120],
      [4680, 4985, 5245, 6120],
      [5850, 6450, 6875, 7850]
    ],

    "Lucro Presumido": [
      [950, 1220, 1320, 1750],
      [2120, 2320, 2485, 2950],
      [4395, 4645, 4765, 5510],
      [5205, 5450, 5500, 6485],
      [6285, 6530, 6685, 7650],
      [8450, 8710, 8830, 10320]
    ],

    "Lucro Real": [
      [1650, 1880, 2000, 2150],
      [3200, 3420, 3625, 3995],
      [3950, 4210, 4420, 5200],
      [6200, 6450, 6850, 7120],
      [9100, 10120, 10295, 11200],
      [13120, 13350, 13450, 15800]
    ]
  },

  departamentoPessoal: [
    { ate: 2, valor: 165.50 },
    { ate: 5, valor: 145.60 },
    { ate: 10, valor: 129.50 },
    { ate: 20, valor: 118.20 },
    { ate: 40, valor: 107.50 },
    { ate: Infinity, valor: 87.30 }
  ],

  servicos: {

    mensal: {
      nome: "Contabilidade mensal",
      valor: null,
      unidade: "mês",
      categoria: "mensal"
    },

    fiscal: {
      nome: "Departamento fiscal",
      valor: null,
      unidade: "orçamento",
      categoria: "fiscal"
    },

    dp: {
      nome: "Departamento pessoal",
      valor: null,
      unidade: "mês",
      categoria: "dp"
    },

    abertura: {
      nome: "Abertura de empresa",
      valor: null,
      unidade: "processo",
      categoria: "abertura"
    },

    abertura_simples: {
      nome: "Abertura ME/EPP - Simples Nacional",
      valor: 800,
      unidade: "processo",
      categoria: "abertura"
    },

    abertura_presumido: {
      nome: "Abertura - Lucro Presumido",
      valor: 950,
      unidade: "processo",
      categoria: "abertura"
    },

    abertura_real: {
      nome: "Abertura - Lucro Real",
      valor: 1200,
      unidade: "processo",
      categoria: "abertura"
    },

    abertura_mei: {
      nome: "Formalização MEI",
      valor: null,
      unidade: "orçamento",
      categoria: "abertura"
    },

    alteracao_mei: {
      nome: "Alteração MEI - assessoria",
      valor: 400,
      unidade: "processo",
      categoria: "regularizacao"
    },

    alteracao: {
      nome: "Alteração ME/EPP",
      valor: 600,
      unidade: "processo",
      categoria: "regularizacao"
    },

    baixa_mei: {
      nome: "Baixa MEI - assessoria",
      valor: 600,
      unidade: "processo",
      categoria: "regularizacao"
    },

    baixa: {
      nome: "Baixa ME/EPP",
      valor: 800,
      unidade: "processo",
      categoria: "regularizacao"
    },

    dasn: {
      nome: "Declaração anual MEI",
      valor: 250,
      unidade: "declaração",
      categoria: "fiscal"
    },

    irpf: {
      nome: "Imposto de Renda Pessoa Física",
      valor: 300,
      unidade: "declaração",
      categoria: "irpf"
    },

    itr: {
      nome: "Declaração ITR",
      valor: 350,
      unidade: "declaração",
      categoria: "rural"
    },

    nfse: {
      nome: "Emissão de NFS-e",
      valor: 50,
      unidade: "serviço",
      categoria: "fiscal"
    },

    nfe: {
      nome: "Emissão de NF-e / NFA-e",
      valor: 100,
      unidade: "serviço",
      categoria: "fiscal"
    },

    cnd: {
      nome: "Consulta fiscal / CND",
      valor: 200,
      unidade: "serviço",
      categoria: "regularizacao"
    },

    consultoria: {
      nome: "Consultoria contábil",
      valor: 250,
      unidade: "hora",
      categoria: "consultoria"
    },

    consultoria_tributaria: {
      nome: "Consultoria tributária",
      valor: 625,
      unidade: "hora",
      categoria: "consultoria"
    },

    planejamento: {
      nome: "Planejamento tributário",
      valor: 760,
      unidade: "hora",
      categoria: "consultoria"
    },

    rescisao: {
      nome: "Rescisão trabalhista",
      valor: 100,
      unidade: "rescisão",
      categoria: "dp"
    },

    bpo: {
      nome: "BPO Financeiro",
      valor: null,
      unidade: "orçamento",
      categoria: "bpo"
    },

    regularizacao: {
      nome: "Regularização empresarial",
      valor: null,
      unidade: "orçamento",
      categoria: "regularizacao"
    }
  }
};

