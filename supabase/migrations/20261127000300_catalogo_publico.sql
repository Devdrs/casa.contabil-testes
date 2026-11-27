
-- =====================================================
-- CASA CONTABIL
-- CATALOGO PUBLICO E VALIDACAO COMERCIAL
-- VERSAO 1.1
-- =====================================================

BEGIN;

-- =====================================================
-- 01. CONFIGURACAO GLOBAL DE PAGAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.controle_checkout (

    id INTEGER PRIMARY KEY
        CHECK (id = 1),

    ambiente TEXT NOT NULL
        DEFAULT 'teste'

        CHECK (
            ambiente IN (
                'teste',
                'producao'
            )
        ),

    pagamento_habilitado BOOLEAN NOT NULL
        DEFAULT FALSE,

    atualizado_em TIMESTAMPTZ NOT NULL
        DEFAULT NOW()

);

INSERT INTO public.controle_checkout (

    id,
    ambiente,
    pagamento_habilitado

)

VALUES (

    1,
    'teste',
    FALSE

)

ON CONFLICT (id)

DO NOTHING;

ALTER TABLE public.controle_checkout

ENABLE ROW LEVEL SECURITY;

REVOKE ALL

ON TABLE public.controle_checkout

FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE

ON TABLE public.controle_checkout

TO service_role;

-- =====================================================
-- 02. CONSULTA PUBLICA DO CATALOGO
--
-- Retorna somente informacoes comerciais autorizadas.
-- Nao retorna dados de clientes ou administradores.
-- =====================================================

CREATE OR REPLACE FUNCTION
    public.consultar_catalogo()

RETURNS JSONB

LANGUAGE SQL

STABLE

SECURITY DEFINER

SET search_path = ''

AS $$

    SELECT COALESCE(

        jsonb_agg(

            jsonb_build_object(

                'codigo',
                    r.codigo,

                'nome',
                    r.nome,

                'preco_base_centavos',
                    r.preco_base_centavos,

                'tipo_precificacao',
                    r.tipo_precificacao,

                'unidade_cobranca',
                    r.unidade_cobranca,

                'exige_consulta_previa',
                    r.exige_consulta_previa,

                'escopo_servico',
                    r.escopo_servico,

                'motivo_bloqueio',
                    r.motivo_bloqueio,

                'pagamento_direto_previsto',

                    r.pagamento_antecipado

                    AND NOT r.exige_consulta_previa

                    AND (
                        NOT r.exige_habilitacao_especifica

                        OR r.habilitacao_confirmada
                    ),

                'pagamento_liberado',

                    COALESCE(

                        (
                            SELECT
                                c.pagamento_habilitado

                            FROM public.controle_checkout c

                            WHERE c.id = 1
                        ),

                        FALSE

                    )

                    AND r.pagamento_antecipado

                    AND NOT r.exige_consulta_previa

                    AND r.escopo_validado

                    AND r.tipo_precificacao IN (
                        'fixo',
                        'sessao'
                    )

                    AND COALESCE(
                        r.preco_base_centavos,
                        0
                    ) > 0

                    AND (

                        NOT r.exige_habilitacao_especifica

                        OR r.habilitacao_confirmada

                    )

            )

            ORDER BY r.nome

        ),

        '[]'::JSONB

    )

    FROM public.regras_comerciais r

    WHERE r.ativo = TRUE;

$$;

REVOKE ALL

ON FUNCTION public.consultar_catalogo()

FROM PUBLIC, anon, authenticated;

GRANT EXECUTE

ON FUNCTION public.consultar_catalogo()

TO anon, authenticated, service_role;

-- =====================================================
-- 03. VALIDACAO DE CARRINHO NO SERVIDOR
--
-- O navegador envia somente os codigos.
-- Os valores sao consultados no banco.
--
-- Esta funcao NAO cria cobrancas.
-- =====================================================

CREATE OR REPLACE FUNCTION
    public.validar_carrinho(
        p_codigos JSONB
    )

RETURNS JSONB

LANGUAGE plpgsql

STABLE

SECURITY INVOKER

SET search_path = ''

AS $$

DECLARE

    v_codigo TEXT;

    v_regra public.regras_comerciais%ROWTYPE;

    v_validacao JSONB;

    v_itens JSONB := '[]'::JSONB;

    v_codigos_processados TEXT[] :=
        ARRAY[]::TEXT[];

    v_checkout BOOLEAN := FALSE;

    v_liberado BOOLEAN;

    v_total_pagavel BIGINT := 0;

    v_total_avulso BIGINT := 0;

    v_total_diagnostico BIGINT := 0;

    v_total_mensal BIGINT := 0;

    v_total_analise BIGINT := 0;

BEGIN

    -- Validar estrutura recebida.

    IF p_codigos IS NULL

        OR jsonb_typeof(p_codigos) <> 'array'

    THEN

        RAISE EXCEPTION
            'Carrinho invalido.';

    END IF;

    IF jsonb_array_length(p_codigos) < 1

        OR jsonb_array_length(p_codigos) > 50

    THEN

        RAISE EXCEPTION
            'Quantidade de servicos invalida.';

    END IF;

    IF EXISTS (

        SELECT 1

        FROM jsonb_array_elements(p_codigos) AS e(valor)

        WHERE jsonb_typeof(e.valor) <> 'string'

    ) THEN

        RAISE EXCEPTION
            'Codigo de servico invalido.';

    END IF;

    -- Consultar a trava global.

    SELECT pagamento_habilitado

    INTO v_checkout

    FROM public.controle_checkout

    WHERE id = 1;

    v_checkout := COALESCE(
        v_checkout,
        FALSE
    );

    -- Validar cada servico.

    FOR v_codigo IN

        SELECT jsonb_array_elements_text(
            p_codigos
        )

    LOOP

        -- Impedir duplicidade.

        IF v_codigo = ANY(
            v_codigos_processados
        ) THEN

            RAISE EXCEPTION
                'Servico duplicado: %',
                v_codigo;

        END IF;

        v_codigos_processados := array_append(

            v_codigos_processados,

            v_codigo

        );

        -- Consultar cadastro oficial.

        SELECT *

        INTO v_regra

        FROM public.regras_comerciais

        WHERE codigo = v_codigo;

        IF NOT FOUND THEN

            RAISE EXCEPTION
                'Servico nao cadastrado: %',
                v_codigo;

        END IF;

        IF NOT v_regra.ativo THEN

            RAISE EXCEPTION
                'Servico indisponivel: %',
                v_codigo;

        END IF;

        -- Consultar a trava individual.

        v_validacao :=
            public.validar_pagamento_servico(
                v_codigo
            );

        v_liberado :=

            v_checkout

            AND COALESCE(

                (
                    v_validacao ->> 'liberado'
                )::BOOLEAN,

                FALSE

            );

        -- Separar valores por modalidade.

        IF v_regra.tipo_precificacao = 'mensal' THEN

            v_total_mensal :=

                v_total_mensal +

                COALESCE(
                    v_regra.preco_base_centavos,
                    0
                );

        ELSIF
            v_regra.tipo_precificacao = 'diagnostico'
        THEN

            v_total_diagnostico :=

                v_total_diagnostico +

                COALESCE(
                    v_regra.preco_base_centavos,
                    0
                );

        ELSE

            v_total_avulso :=

                v_total_avulso +

                COALESCE(
                    v_regra.preco_base_centavos,
                    0
                );

        END IF;

        IF v_regra.exige_consulta_previa

            AND v_regra.tipo_precificacao NOT IN (
                'mensal',
                'diagnostico'
            )

        THEN

            v_total_analise :=

                v_total_analise +

                COALESCE(
                    v_regra.preco_base_centavos,
                    0
                );

        END IF;

        IF v_liberado THEN

            v_total_pagavel :=

                v_total_pagavel +

                v_regra.preco_base_centavos;

        END IF;

        -- Montar retorno individual.

        v_itens := v_itens ||

            jsonb_build_array(

                jsonb_build_object(

                    'codigo',
                        v_regra.codigo,

                    'nome',
                        v_regra.nome,

                    'preco_base_centavos',
                        v_regra.preco_base_centavos,

                    'tipo_precificacao',
                        v_regra.tipo_precificacao,

                    'exige_consulta_previa',
                        v_regra.exige_consulta_previa,

                    'pagamento_liberado',
                        v_liberado,

                    'motivo',

                        CASE

                            WHEN v_regra.exige_consulta_previa

                            THEN COALESCE(

                                v_regra.motivo_bloqueio,

                                'Consulta previa obrigatoria.'

                            )

                            WHEN NOT v_checkout

                            THEN
                                'Checkout global desabilitado.'

                            ELSE

                                v_validacao ->> 'motivo'

                        END

                )

            );

    END LOOP;

    RETURN jsonb_build_object(

        'valido',
            TRUE,

        'checkout_habilitado',
            v_checkout,

        'quantidade_servicos',
            cardinality(v_codigos_processados),

        'itens',
            v_itens,

        'total_avulso_referencia_centavos',
            v_total_avulso,

        'total_avulso_sob_analise_centavos',
            v_total_analise,

        'total_diagnostico_centavos',
            v_total_diagnostico,

        'total_mensal_base_centavos',
            v_total_mensal,

        'total_pagavel_centavos',
            v_total_pagavel,

        'moeda',
            'BRL'

    );

END;

$$;

-- =====================================================
-- 04. PERMISSOES DA VALIDACAO
-- Somente o backend pode validar o checkout.
-- =====================================================

REVOKE ALL

ON FUNCTION public.validar_carrinho(JSONB)

FROM PUBLIC, anon, authenticated;

GRANT EXECUTE

ON FUNCTION public.validar_carrinho(JSONB)

TO service_role;

COMMIT;

-- =====================================================
-- FIM DA MIGRACAO
-- CASA CONTABIL
-- =====================================================

