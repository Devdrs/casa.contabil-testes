
"use strict";

window.CASA_CONFIG = Object.freeze({

  versao: "2.1.0",

  ambiente: "teste",

  modoTeste: true,

  supabaseUrl: "",

  endpoints: {
    solicitacao: "/functions/v1/criar-solicitacao"
  },

  empresa: {
    nome: "Casa Contábil",
    email: "diogoreissilva11@gmail.com",
    whatsapp: "5569993842735",
    instagram: "casa.contabil"
  },

  pagamento: {
    provedor: "mercadopago",
    linkManual: "https://link.mercadopago.com.br/pontoweb1",
    exigirAprovacao: true,
    habilitado: false
  },

  contrato: {
    automatico: false,
    elaboracaoManual: true
  }

});

