
BEGIN;

-- =====================================================
-- CASA CONTABIL V3.0
-- MODULO DE GESTAO COMERCIAL E FINANCEIRA
-- =====================================================

-- 01. ORIGENS DE CAPTACAO

CREATE TABLE IF NOT EXISTS public.origens_captacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.origens_captacao (nome)
VALUES
    ('Google'),
    ('Instagram'),
    ('Facebook'),
    ('WhatsApp'),
    ('Site institucional'),
    ('Indicacao'),
    ('Prospeccao ativa'),
    ('Representante comercial'),
    ('Parceria empresarial'),
    ('Outros')
ON CONFLICT (nome) DO NOTHING;


-- 02. POTENCIAIS CLIENTES - CRM

CREATE TABLE IF NOT EXISTS public.leads (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    origem_id BIGINT
        REFERENCES public.origens_captacao(id),
    cliente_id BIGINT
        REFERENCES public.clientes(id),
    nome TEXT NOT NULL,
    empresa TEXT,
    cnpj VARCHAR(14),
    email TEXT,
    whatsapp TEXT,
    cidade TEXT,
    uf VARCHAR(2),
    atividade TEXT,
    servico_interesse TEXT,
    valor_estimado NUMERIC(14,2)
        CHECK (valor_estimado >= 0),
    status TEXT NOT NULL DEFAULT 'novo'
        CHECK (status IN (
            'novo',
            'contatado',
            'qualificado',
            'proposta_enviada',
            'negociacao',
            'convertido',
            'perdido'
        )),
    motivo_perda TEXT,
    observacoes TEXT,
    proximo_contato TIMESTAMPTZ,
    convertido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 03. HISTORICO COMERCIAL

CREATE TABLE IF NOT EXISTS public.interacoes_comerciais (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lead_id BIGINT NOT NULL
        REFERENCES public.leads(id),
    responsavel UUID
        REFERENCES auth.users(id),
    canal TEXT NOT NULL
        CHECK (canal IN (
            'whatsapp',
            'email',
            'telefone',
            'reuniao',
            'presencial',
            'outros'
        )),
    descricao TEXT NOT NULL,
    resultado TEXT,
    proxima_acao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 04. CONTROLE DE TAREFAS

CREATE TABLE IF NOT EXISTS public.tarefas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT
        REFERENCES public.clientes(id),
    solicitacao_id BIGINT
        REFERENCES public.solicitacoes(id),
    responsavel UUID
        REFERENCES auth.users(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    departamento TEXT,
    prioridade TEXT NOT NULL DEFAULT 'normal'
        CHECK (prioridade IN (
            'baixa',
            'normal',
            'alta',
            'urgente'
        )),
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'em_andamento',
            'concluida',
            'cancelada'
        )),
    prazo TIMESTAMPTZ,
    concluido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 05. HONORARIOS RECORRENTES

CREATE TABLE IF NOT EXISTS public.assinaturas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL
        REFERENCES public.clientes(id),
    empresa_id BIGINT
        REFERENCES public.empresas(id),
    contrato_id BIGINT
        REFERENCES public.contratos(id),
    servico_id BIGINT NOT NULL
        REFERENCES public.servicos(id),
    valor_mensal NUMERIC(14,2) NOT NULL
        CHECK (valor_mensal > 0),
    dia_vencimento INTEGER NOT NULL
        CHECK (dia_vencimento BETWEEN 1 AND 28),
    inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    encerramento DATE,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'ativa',
            'suspensa',
            'cancelada',
            'encerrada'
        )),
    referencia_externa TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        encerramento IS NULL
        OR encerramento >= inicio
    )
);


-- 06. CONTAS A RECEBER

CREATE TABLE IF NOT EXISTS public.contas_receber (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL
        REFERENCES public.clientes(id),
    assinatura_id BIGINT
        REFERENCES public.assinaturas(id),
    solicitacao_id BIGINT
        REFERENCES public.solicitacoes(id),
    pagamento_id BIGINT
        REFERENCES public.pagamentos(id),
    descricao TEXT NOT NULL,
    competencia DATE,
    valor NUMERIC(14,2) NOT NULL
        CHECK (valor > 0),
    valor_recebido NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (valor_recebido >= 0),
    vencimento DATE NOT NULL,
    recebido_em TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'parcial',
            'recebido',
            'cancelado',
            'estornado'
        )),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (valor_recebido <= valor),

    UNIQUE (assinatura_id, competencia)
);


-- 07. DESPESAS DO ESCRITORIO

CREATE TABLE IF NOT EXISTS public.despesas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    fornecedor TEXT,
    valor NUMERIC(14,2) NOT NULL
        CHECK (valor > 0),
    competencia DATE,
    vencimento DATE NOT NULL,
    pago_em TIMESTAMPTZ,
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'pago',
            'cancelado'
        )),
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 08. CONTROLE DE DOCUMENTOS

CREATE TABLE IF NOT EXISTS public.documentos_cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL
        REFERENCES public.clientes(id),
    empresa_id BIGINT
        REFERENCES public.empresas(id),
    solicitacao_id BIGINT
        REFERENCES public.solicitacoes(id),
    tipo_documento TEXT NOT NULL,
    nome_arquivo TEXT,
    caminho_armazenamento TEXT,
    competencia DATE,
    validade DATE,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'recebido',
            'em_analise',
            'aprovado',
            'rejeitado',
            'vencido'
        )),
    observacoes TEXT,
    recebido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 09. OBRIGACOES CONTABEIS E FISCAIS

CREATE TABLE IF NOT EXISTS public.obrigacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL
        REFERENCES public.empresas(id),
    responsavel UUID
        REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    departamento TEXT NOT NULL,
    competencia DATE NOT NULL,
    vencimento DATE NOT NULL,
    entregue_em TIMESTAMPTZ,
    protocolo_entrega TEXT,
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN (
            'pendente',
            'em_elaboracao',
            'em_revisao',
            'entregue',
            'dispensada',
            'cancelada'
        )),
    observacoes TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (empresa_id, nome, competencia)
);


-- 10. CONFIGURACOES OPERACIONAIS

CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
    chave TEXT PRIMARY KEY,
    valor JSONB NOT NULL,
    descricao TEXT,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.configuracoes_sistema
    (chave, valor, descricao)
VALUES
    (
        'ambiente',
        '"teste"'::JSONB,
        'Ambiente atual do sistema'
    ),
    (
        'contrato_automatico',
        'false'::JSONB,
        'Contratos elaborados manualmente'
    ),
    (
        'pagamento_habilitado',
        'false'::JSONB,
        'Liberacao da integracao financeira'
    ),
    (
        'email_habilitado',
        'false'::JSONB,
        'Liberacao das notificacoes'
    ),
    (
        'aprovacao_manual',
        'true'::JSONB,
        'Aprovacao obrigatoria dos honorarios'
    )
ON CONFLICT (chave) DO NOTHING;


-- =====================================================
-- INDICES PARA MELHORAR O DESEMPENHO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_leads_status
ON public.leads(status);

CREATE INDEX IF NOT EXISTS idx_leads_proximo_contato
ON public.leads(proximo_contato);

CREATE INDEX IF NOT EXISTS idx_interacoes_lead
ON public.interacoes_comerciais(lead_id);

CREATE INDEX IF NOT EXISTS idx_tarefas_prazo
ON public.tarefas(prazo, status);

CREATE INDEX IF NOT EXISTS idx_assinaturas_cliente
ON public.assinaturas(cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_receber_vencimento
ON public.contas_receber(vencimento, status);

CREATE INDEX IF NOT EXISTS idx_despesas_vencimento
ON public.despesas(vencimento, status);

CREATE INDEX IF NOT EXISTS idx_documentos_cliente
ON public.documentos_cliente(cliente_id);

CREATE INDEX IF NOT EXISTS idx_obrigacoes_vencimento
ON public.obrigacoes(vencimento, status);


-- =====================================================
-- ATUALIZACAO AUTOMATICA DE DATA
-- =====================================================

CREATE OR REPLACE FUNCTION public.cc_atualizar_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cc_leads_atualizacao
ON public.leads;

CREATE TRIGGER trg_cc_leads_atualizacao
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.cc_atualizar_data();

DROP TRIGGER IF EXISTS trg_cc_config_atualizacao
ON public.configuracoes_sistema;

CREATE TRIGGER trg_cc_config_atualizacao
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.cc_atualizar_data();


-- =====================================================
-- SEGURANCA E PROTECAO DE DADOS
-- =====================================================

DO $$
DECLARE
    tabela TEXT;
BEGIN
    FOREACH tabela IN ARRAY ARRAY[
        'origens_captacao',
        'leads',
        'interacoes_comerciais',
        'tarefas',
        'assinaturas',
        'contas_receber',
        'despesas',
        'documentos_cliente',
        'obrigacoes',
        'configuracoes_sistema'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            tabela
        );

        EXECUTE format(
            'REVOKE ALL ON TABLE public.%I
             FROM PUBLIC, anon, authenticated',
            tabela
        );

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE
             ON TABLE public.%I TO service_role',
            tabela
        );
    END LOOP;
END $$;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO service_role;

REVOKE ALL ON FUNCTION public.cc_atualizar_data()
FROM PUBLIC, anon, authenticated;

COMMIT;

