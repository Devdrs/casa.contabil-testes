
BEGIN;

-- ADMINISTRADORES

CREATE TABLE IF NOT EXISTS administradores (
    usuario_id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTROLE OPERACIONAL

CREATE TABLE IF NOT EXISTS ordens_servico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitacao_id BIGINT NOT NULL UNIQUE
        REFERENCES solicitacoes(id),
    responsavel TEXT,
    prazo DATE,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'aguardando',
    iniciado_em TIMESTAMPTZ,
    concluido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (status IN (
        'aguardando',
        'em_execucao',
        'aguardando_documentos',
        'em_revisao',
        'concluido',
        'cancelado'
    ))
);

-- CADASTRO DO CATALOGO

INSERT INTO servicos (codigo, nome, categoria)
VALUES
('mensal', 'Contabilidade mensal', 'mensal'),
('fiscal', 'Departamento fiscal', 'fiscal'),
('dp', 'Departamento pessoal', 'dp'),
('abertura', 'Abertura de empresa', 'abertura'),
('abertura_simples', 'Abertura Simples Nacional', 'abertura'),
('abertura_presumido', 'Abertura Lucro Presumido', 'abertura'),
('abertura_real', 'Abertura Lucro Real', 'abertura'),
('abertura_mei', 'Formalizacao MEI', 'abertura'),
('alteracao_mei', 'Alteracao MEI', 'regularizacao'),
('alteracao', 'Alteracao empresarial', 'regularizacao'),
('baixa_mei', 'Baixa MEI', 'regularizacao'),
('baixa', 'Baixa empresarial', 'regularizacao'),
('dasn', 'Declaracao anual MEI', 'fiscal'),
('irpf', 'Imposto de Renda Pessoa Fisica', 'irpf'),
('itr', 'Declaracao ITR', 'rural'),
('nfse', 'Emissao de NFS-e', 'fiscal'),
('nfe', 'Emissao de NF-e', 'fiscal'),
('cnd', 'Consulta fiscal e CND', 'regularizacao'),
('consultoria', 'Consultoria contabil', 'consultoria'),
('consultoria_tributaria', 'Consultoria tributaria', 'consultoria'),
('planejamento', 'Planejamento tributario', 'consultoria'),
('rescisao', 'Rescisao trabalhista', 'dp'),
('bpo', 'BPO Financeiro', 'bpo'),
('regularizacao', 'Regularizacao empresarial', 'regularizacao')
ON CONFLICT (codigo) DO NOTHING;

-- SEGURANCA

ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON administradores
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ordens_servico
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON administradores, ordens_servico
TO service_role;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO service_role;

-- REGISTRO ATOMICO DE SOLICITACAO

CREATE OR REPLACE FUNCTION public.registrar_solicitacao(
    p_dados JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_cliente BIGINT;
    v_empresa BIGINT;
    v_servico BIGINT;
    v_solicitacao BIGINT;
    v_protocolo TEXT;
BEGIN

    IF NULLIF(TRIM(p_dados->>'nome'), '') IS NULL
       OR NULLIF(TRIM(p_dados->>'email'), '') IS NULL
       OR NULLIF(TRIM(p_dados->>'whatsapp'), '') IS NULL
    THEN
        RAISE EXCEPTION 'Dados obrigatorios ausentes';
    END IF;

    SELECT id INTO v_servico
    FROM servicos
    WHERE codigo = p_dados->>'servico'
      AND ativo = TRUE;

    IF v_servico IS NULL THEN
        RAISE EXCEPTION 'Servico invalido';
    END IF;

    v_protocolo := 'CC-' || gen_random_uuid()::TEXT;

    INSERT INTO clientes (
        nome, email, whatsapp, cidade_uf
    )
    VALUES (
        p_dados->>'nome',
        p_dados->>'email',
        p_dados->>'whatsapp',
        p_dados->>'cidade'
    )
    RETURNING id INTO v_cliente;

    INSERT INTO empresas (
        cliente_id,
        razao_social,
        cnpj,
        perfil,
        atividade,
        regime_tributario
    )
    VALUES (
        v_cliente,
        p_dados->>'empresa',
        NULLIF(p_dados->>'cnpj', ''),
        p_dados->>'perfil',
        p_dados->>'atividade',
        p_dados->>'regime'
    )
    RETURNING id INTO v_empresa;

    INSERT INTO solicitacoes (
        protocolo,
        cliente_id,
        empresa_id,
        servico_id,
        observacoes,
        dados_simulacao,
        status
    )
    VALUES (
        v_protocolo,
        v_cliente,
        v_empresa,
        v_servico,
        p_dados->>'mensagem',
        COALESCE(p_dados->'simulacao', '{}'::JSONB),
        'solicitado'
    )
    RETURNING id INTO v_solicitacao;

    INSERT INTO historico_atendimento (
        solicitacao_id, evento, descricao
    )
    VALUES (
        v_solicitacao,
        'cadastro',
        'Solicitacao registrada pelo site'
    );

    INSERT INTO notificacoes (
        solicitacao_id,
        tipo,
        destinatario,
        status
    )
    VALUES (
        v_solicitacao,
        'nova_solicitacao',
        'diogoreissilva11@gmail.com',
        'pendente'
    );

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'protocolo', v_protocolo
    );

END;
$$;

REVOKE ALL ON FUNCTION
public.registrar_solicitacao(JSONB)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.registrar_solicitacao(JSONB)
TO service_role;

COMMIT;

