
BEGIN;

ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS dados_simulacao JSONB
DEFAULT '{}'::jsonb;

ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS valor_estimado_centavos BIGINT;

ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS versao_precos VARCHAR(40);

ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ
DEFAULT NOW();

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS preference_id TEXT;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS referencia_interna UUID
DEFAULT gen_random_uuid();

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS moeda VARCHAR(3)
DEFAULT 'BRL';

CREATE UNIQUE INDEX IF NOT EXISTS
idx_pagamento_referencia_interna
ON pagamentos(referencia_interna);

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS tentativas INTEGER
NOT NULL DEFAULT 0;

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS identificador_envio TEXT;

ALTER TABLE notificacoes
ADD COLUMN IF NOT EXISTS conteudo JSONB
DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS eventos_pagamento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provedor TEXT NOT NULL DEFAULT 'mercadopago',
    evento_id TEXT NOT NULL,
    pagamento_externo TEXT,
    recebido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processado_em TIMESTAMPTZ,
    UNIQUE (provedor, evento_id)
);

CREATE TABLE IF NOT EXISTS historico_atendimento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id BIGINT NOT NULL
        REFERENCES solicitacoes(id),
    evento TEXT NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Proteção dos dados contra acesso público.

DO $$
DECLARE
    tabela TEXT;
BEGIN
    FOREACH tabela IN ARRAY ARRAY[
        'clientes',
        'empresas',
        'servicos',
        'tabelas_precos',
        'honorarios',
        'solicitacoes',
        'orcamentos',
        'checklist_documentos',
        'contratos',
        'pagamentos',
        'notificacoes',
        'auditoria',
        'eventos_pagamento',
        'historico_atendimento'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
            tabela
        );

        EXECUTE format(
            'REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',
            tabela
        );

        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',
            tabela
        );
    END LOOP;
END $$;

GRANT USAGE, SELECT ON ALL SEQUENCES
IN SCHEMA public TO service_role;

COMMIT;

