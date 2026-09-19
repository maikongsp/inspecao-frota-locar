-- =====================================================================
-- LOCAR GUINDASTES E TRANSPORTES INTERMODAIS
-- SCHEMA DE BANCO DE DADOS OFICIAL - SUPABASE (POSTGRESQL)
-- Sistema de Inspeção e Controle de Frota (Betim / MG)
-- =====================================================================

-- Extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE EQUIPAMENTOS DA FROTA (FROTA LOCAR BETIM)
CREATE TABLE IF NOT EXISTS public.fleet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('pta', 'guindaste', 'empilhadeira')),
    status VARCHAR(20) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'manutencao', 'locada')),
    current_contract VARCHAR(150),
    site_location VARCHAR(100) DEFAULT 'Betim - MG',
    capacity VARCHAR(50),
    horimeter NUMERIC(10, 1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para consultas rápidas de frota
CREATE INDEX IF NOT EXISTS idx_fleet_number ON public.fleet (fleet_number);
CREATE INDEX IF NOT EXISTS idx_fleet_category ON public.fleet (category);
CREATE INDEX IF NOT EXISTS idx_fleet_status ON public.fleet (status);

-- 2. TABELA DE INSPEÇÕES TÉCNICAS E LAUDOS PERICIAIS
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_code VARCHAR(50) UNIQUE NOT NULL,
    fleet_id UUID REFERENCES public.fleet(id) ON DELETE RESTRICT,
    fleet_number VARCHAR(50) NOT NULL,
    inspector_first_name VARCHAR(80) NOT NULL,
    inspector_last_name VARCHAR(80) NOT NULL,
    inspector_phone VARCHAR(30) NOT NULL,
    inspector_reg VARCHAR(50),
    horimeter NUMERIC(10, 1),
    status VARCHAR(30) NOT NULL CHECK (status IN ('aprovado', 'reprovado_pcm', 'em_andamento')),
    passed BOOLEAN NOT NULL DEFAULT false,
    total_items INTEGER DEFAULT 0,
    passed_items INTEGER DEFAULT 0,
    checklist_data JSONB NOT NULL,
    non_conformities JSONB,
    ai_expert_appraisal TEXT,
    ai_vision_audit_score NUMERIC(5, 2),
    signature_url TEXT,
    qr_code_hash VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_inspections_fleet_number ON public.inspections (fleet_number);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON public.inspections (started_at DESC);

-- 3. TABELA DE SOLICITAÇÕES DE SERVIÇO AO PCM (S.S. PCM)
CREATE TABLE IF NOT EXISTS public.pcm_service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
    fleet_number VARCHAR(50) NOT NULL,
    equipment_model VARCHAR(100),
    urgency VARCHAR(20) NOT NULL DEFAULT 'CRÍTICA' CHECK (urgency IN ('CRÍTICA', 'ALTA', 'MÉDIA')),
    status VARCHAR(30) NOT NULL DEFAULT 'aberta_pcm' CHECK (status IN ('aberta_pcm', 'em_analise_pcm', 'em_execucao', 'concluida')),
    inspector_name VARCHAR(150) NOT NULL,
    inspector_phone VARCHAR(30) NOT NULL,
    fault_summary TEXT NOT NULL,
    cmms_fault_codes TEXT[],
    norms_violated TEXT[],
    email_sent_to VARCHAR(120) DEFAULT 'pcm.betim@locar.com.br',
    email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pcm_requests_fleet ON public.pcm_service_requests (fleet_number);
CREATE INDEX IF NOT EXISTS idx_pcm_requests_status ON public.pcm_service_requests (status);

-- 4. TABELA DE FOTOS E AUDITORIAS DE VISÃO COMPUTACIONAL (IA)
CREATE TABLE IF NOT EXISTS public.inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
    item_key VARCHAR(100) NOT NULL,
    photo_url TEXT NOT NULL,
    ai_status VARCHAR(30) DEFAULT 'CONFORME_IA',
    ai_confidence NUMERIC(5, 2),
    ai_hash VARCHAR(60),
    ai_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pcm_service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública/autenticada para operação em campo
CREATE POLICY "Permitir leitura da frota" ON public.fleet FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de inspeções" ON public.inspections FOR ALL USING (true);
CREATE POLICY "Permitir gestão de S.S. ao PCM" ON public.pcm_service_requests FOR ALL USING (true);
CREATE POLICY "Permitir fotos auditadas" ON public.inspection_photos FOR ALL USING (true);
