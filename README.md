# 🏗️ Sistema de Inspeção de Frota & Controle de Qualidade
### Locar Guindastes e Transportes Intermodais S/A — Filial Betim / MG

Sistema industrial para inspeção técnica regulamentar, conformidade visual estrita e liberação de frota operacional para **Plataformas Elevatórias (PTA)**, **Guindastes** e **Empilhadeiras**, integrado com **Inteligência Artificial (Visão Computacional e Copiloto Normativo)**, **Solicitações de Serviço (S.S.) para o PCM** e arquitetura em nuvem (**GitHub, Supabase e Vercel**).

---

## 🚀 Principais Funcionalidades

### 1. Diretriz de Tolerância Zero & Gestão de Pátio
* **Bloqueio Imediato em Caso de Não Conformidade:** Qualquer desvio (amassado, trinca, vazamento ou adesivo fora do padrão Locar) retém o equipamento no pátio de Betim com status **MANUTENÇÃO**.
* **Substituição de O.S. por S.S. ao PCM:** Gera automaticamente **Solicitação de Serviço (S.S.)** formal e despacha e-mail corporativo padrão (`pcm.betim@locar.com.br`) e link direto para WhatsApp com dados completos do inspetor.
* **Liberação Condicionada a 100% de Conformidade:** Equipamento só retorna a **DISPONÍVEL** se aprovado em todos os itens visuais, estruturais e testes de funcionamento de todas as operações.

### 2. Inteligência Artificial Embarcada (Garantia de Qualidade e Eficácia)
* **Locar AI Vision (Auditoria Visual de Fotos):**
  * Verificação em tempo real de iluminação, contraste e nitidez das fotos de evidência.
  * Validação das cores corporativas oficiais da Locar: **Cinza Chumbo (`#474444`)** e **Amarelo (`#FFF212`)**.
  * Reconhecimento de decalques de segurança e capacidade de carga (tabela de carga).
  * Emissão de Selo Pericial Digital com hash de autenticidade.
* **Locar AI Copilot (Diagnóstico Técnico & Normas):**
  * Assistente inteligente de diagnóstico baseado nas normas **NR-11**, **NR-12 (Anexo XII)**, **NR-18** e **NR-35**.
  * Sugere automaticamente códigos de falha do CMMS, risco operacional e ação recomendada de manutenção.
  * Emite **Parecer Pericial Técnico Automatizado** formal de engenharia no Laudo Pericial.

### 3. Dados Reais do CMMS Oficial da Locar Betim
* **273 Equipamentos Reais Ativos:**
  * **245 Plataformas Elevatórias (PTA):** Genie (Z-45, Z-60, S-65, GS-2646...), JLG, Haulotte.
  * **26 Guindastes Industriais:** Liebherr (LTM 1090, LTM 1100, LTM 1220, LTM 1500...), Grove, Tadano, XCMG.
  * **2 Empilhadeiras Operacionais:** Yale GLP 25 VX e Hyster H50FT.
* **Identificação Obrigatória do Inspetor:** Todo laudo e solicitação do PCM registra compulsoriamente **Nome**, **Sobrenome**, **Telefone de Contato (WhatsApp)** e registro profissional do inspetor.

### 4. Recursos Mobile & Pátio (PWA Offline-First)
* **Instalável no Celular/Tablet (PWA):** Funciona mesmo em áreas do pátio de Betim sem cobertura 4G/Wi-Fi via Service Worker.
* **Assinatura Digital Touch:** Inspetor assina com o dedo ou caneta touch diretamente na tela antes de emitir o laudo pericial.
* **QR Code Dinâmico:** Validação instantânea da autenticidade do laudo pericial técnico em campo.

---

## 🛠️ Stack Tecnológica

* **Frontend:** HTML5 Semântico, CSS3 Modular Moderno (Design System Locar), JavaScript Vanilla (ES6 Modules).
* **IA & Visão Computacional:** Algoritmos de gradiente de nitidez, fotometria BT.709 e correspondência cromática pericial.
* **Persistência Híbrida (Offline-First):** LocalStorage com conector para **Supabase (PostgreSQL)**.
* **Deploy & Hospedagem:** **Vercel** com cabeçalhos de segurança HTTP e cache otimizado.

---

## 📦 Como Executar Localmente

1. Clone o repositório ou navegue até a pasta do projeto:
   ```bash
   cd "Inspeção Locar"
   ```

2. Inicie qualquer servidor HTTP estático (ex: Python ou Live Server):
   ```bash
   python -m http.server 8080
   ```

3. Abra no navegador:
   👉 **http://localhost:8080/**

---

## ☁️ Configuração do Supabase (Nuvem)

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No painel do Supabase, acesse o **SQL Editor** e execute o script contido em:
   📁 [`supabase/schema.sql`](supabase/schema.sql)
3. Copie o arquivo de exemplo de variáveis:
   ```bash
   cp .env.example .env
   ```
4. Configure as chaves `SUPABASE_URL` e `SUPABASE_ANON_KEY` no seu ambiente ou informe-as no arquivo de configuração do sistema. O sistema continuará operando 100% offline se as chaves não forem preenchidas.

---

## 🚀 Deploy na Vercel

O projeto já inclui o arquivo [`vercel.json`](vercel.json) configurado para deploy imediato:

1. Instale o Vercel CLI (se aplicável):
   ```bash
   npm i -g vercel
   ```
2. Execute o comando de deploy na raiz do projeto:
   ```bash
   vercel --prod
   ```
3. O sistema estará imediatamente disponível no domínio seguro `https://seu-projeto.vercel.app`.

---

## 🔒 Normas Regulamentadoras Aplicadas
* **NR-11:** Transporte, Movimentação, Armazenagem e Manuseio de Materiais
* **NR-12 (Anexo XII):** Segurança no Trabalho em Máquinas e Equipamentos (Plataformas Elevatórias)
* **NR-18:** Segurança e Saúde no Trabalho na Indústria da Construção (Equipamentos de Guindar)
* **NR-35:** Trabalho em Altura
* **NBR 16776 / ASME B30.5:** Padrões técnicos de inspeção de guindastes e plataformas

---

**Locar Guindastes e Transportes Intermodais S/A**  
*Para Grandes Projetos, Grandes Soluções.*
