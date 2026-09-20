# Guia Rápido de Configuração: Appwrite Cloud (Locar Betim)

Siga este passo a passo de 2 minutos para configurar o backend gratuito no **Appwrite Cloud**:

---

### 1. Criar Conta e Projeto no Appwrite
1. Acesse **[cloud.appwrite.io](https://cloud.appwrite.io/)** e crie uma conta gratuita.
2. Clique em **"Create project"** e defina o nome: `Locar Inspeção Betim`.
3. Copie o **Project ID** gerado (ele aparece no topo da página do projeto).

---

### 2. Adicionar Plataforma Web (Permitir Acessos)
1. No painel do seu projeto, role até **"Add a platform"** e clique em **"Web app"**.
2. **Name:** `Sistema de Inspeção Locar`
3. **Hostname:** 
   * Para testes locais: `localhost`
   * Para produção: `*.vercel.app` (ou o domínio da sua Vercel)
4. Clique em **"Next"** até concluir.

---

### 3. Criar o Banco de Dados (Databases)
1. No menu lateral esquerdo, clique em **Databases ➔ Create database**.
2. **Database ID:** `locar_betim_db`
3. **Name:** `Banco Locar Betim`

---

### 4. Criar as Coleções (Collections)

#### Coleção 1: `inspections`
* Clique em **"Create collection"**:
  * **Collection ID:** `inspections`
  * **Name:** `Inspeções e Laudos`
* Na aba **Permissions (Permissões)**:
  * Adicione **"Any"** e marque as caixas: `Create` e `Read`. Clique em Salvar.
* Na aba **Attributes (Atributos)**, crie os seguintes campos do tipo **String**:
  * `inspection_id` (size: 64)
  * `equipment_tag` (size: 64)
  * `equipment_name` (size: 128)
  * `equipment_type` (size: 32)
  * `inspector_first_name` (size: 64)
  * `inspector_last_name` (size: 64)
  * `inspector_full_name` (size: 128)
  * `inspector_phone` (size: 32)
  * `inspector_reg` (size: 64)
  * `hourmeter` (tipo: **Float** ou Integer)
  * `final_status` (size: 32)
  * `verdict` (size: 255)
  * `total_non_conformities` (tipo: **Integer**)
  * `technical_opinion` (size: 2000)
  * `ai_expert_appraisal` (size: 3000)
  * `started_at` (size: 64)
  * `finished_at` (size: 64)

#### Coleção 2: `pcm_service_requests`
* Clique em **"Create collection"**:
  * **Collection ID:** `pcm_service_requests`
  * **Name:** `Solicitações ao PCM`
* Na aba **Permissions**: Adicione **"Any"** com `Create` e `Read`.
* Na aba **Attributes**, crie os seguintes campos:
  * `request_id` (String, size: 64)
  * `equipment_tag` (String, size: 64)
  * `equipment_name` (String, size: 128)
  * `status` (String, size: 32)
  * `severity` (String, size: 32)
  * `inspector_name` (String, size: 128)
  * `inspector_phone` (String, size: 32)
  * `opened_date` (String, size: 64)
  * `recipient_email` (String, size: 128)
  * `faults_summary` (String, size: 2000)

---

### 5. Ativar no Sistema
No arquivo `.env` ou no painel da Vercel (Environment Variables), adicione:
```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=SEU_PROJECT_ID_AQUI
APPWRITE_DATABASE_ID=locar_betim_db
```
Pronto! Todos os laudos e solicitações ao PCM serão sincronizados automaticamente em nuvem no Appwrite.
