
BEGIN;

CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(25) NOT NULL,
    cidade_uf VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empresas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    razao_social VARCHAR(150),
    cnpj VARCHAR(14),
    perfil VARCHAR(40),
    atividade VARCHAR(80),
    regime_tributario VARCHAR(50),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(60),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tabelas_precos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    versao VARCHAR(40) NOT NULL UNIQUE,
    inicio_vigencia DATE NOT NULL,
    fim_vigencia DATE,
    aprovado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS honorarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabela_id BIGINT NOT NULL REFERENCES tabelas_precos(id),
    servico_id BIGINT NOT NULL REFERENCES servicos(id),
    regime VARCHAR(50),
    atividade VARCHAR(80),
    faixa_faturamento VARCHAR(100),
    unidade VARCHAR(30) NOT NULL,
    valor_centavos BIGINT,
    CHECK (valor_centavos >= 0)
);

CREATE TABLE IF NOT EXISTS solicitacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    protocolo VARCHAR(100) NOT NULL UNIQUE,
    cliente_id BIGINT NOT NULL REFERENCES clientes(id),
    empresa_id BIGINT REFERENCES empresas(id),
    servico_id BIGINT NOT NULL REFERENCES servicos(id),
    observacoes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'solicitado',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN (
        'solicitado',
        'em_analise',
        'proposta_enviada',
        'proposta_aprovada',
        'contratado',
        'cancelado'
    ))
);

CREATE TABLE IF NOT EXISTS orcamentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id BIGINT NOT NULL REFERENCES solicitacoes(id),
    tabela_id BIGINT REFERENCES tabelas_precos(id),
    valor_centavos BIGINT NOT NULL CHECK (valor_centavos >= 0),
    escopo TEXT NOT NULL,
    aprovado_em TIMESTAMPTZ,
    validade DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_documentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id BIGINT NOT NULL REFERENCES solicitacoes(id),
    descricao TEXT NOT NULL,
    cliente_possui BOOLEAN NOT NULL DEFAULT FALSE,
    recebido BOOLEAN NOT NULL DEFAULT FALSE,
    conferido BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (NOT conferido OR recebido)
);

CREATE TABLE IF NOT EXISTS contratos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orcamento_id BIGINT NOT NULL REFERENCES orcamentos(id),
    referencia VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
    assinado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN (
        'rascunho',
        'enviado',
        'assinado',
        'encerrado',
        'cancelado'
    ))
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orcamento_id BIGINT NOT NULL REFERENCES orcamentos(id),
    provedor VARCHAR(30) NOT NULL DEFAULT 'mercadopago',
    referencia_externa VARCHAR(150) UNIQUE,
    valor_centavos BIGINT NOT NULL CHECK (valor_centavos > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    confirmado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN (
        'pendente',
        'confirmado',
        'recusado',
        'estornado',
        'cancelado'
    ))
);

CREATE TABLE IF NOT EXISTS notificacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id BIGINT NOT NULL REFERENCES solicitacoes(id),
    tipo VARCHAR(40) NOT NULL,
    destinatario VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    enviado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entidade VARCHAR(50) NOT NULL,
    entidade_id BIGINT NOT NULL,
    acao VARCHAR(100) NOT NULL,
    operador VARCHAR(150),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_status
ON solicitacoes(status);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_cliente
ON solicitacoes(cliente_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_status
ON pagamentos(status);

CREATE INDEX IF NOT EXISTS idx_checklist_solicitacao
ON checklist_documentos(solicitacao_id);

-- Bloqueia permissões concedidas genericamente ao público.
-- A implantação ainda exige papéis e políticas específicas.

REVOKE ALL ON clientes FROM PUBLIC;
REVOKE ALL ON empresas FROM PUBLIC;
REVOKE ALL ON solicitacoes FROM PUBLIC;
REVOKE ALL ON orcamentos FROM PUBLIC;
REVOKE ALL ON contratos FROM PUBLIC;
REVOKE ALL ON pagamentos FROM PUBLIC;
REVOKE ALL ON checklist_documentos FROM PUBLIC;
REVOKE ALL ON notificacoes FROM PUBLIC;
REVOKE ALL ON auditoria FROM PUBLIC;

COMMIT;

