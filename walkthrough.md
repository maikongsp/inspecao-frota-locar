# Walkthrough - Módulo de Reserva Comercial de Frota (Locar Betim)

Implementamos a funcionalidade completa para o time Comercial da **Locar Guindastes e Transportes Intermodais (Unidade Betim)** realizar a reserva de frotas disponíveis com especificação do período operacional estimado, validação estrita de disponibilidade e transição com um clique para **Locada** no início da operação.

---

## 🎯 Regras de Negócio Implementadas

1. **Disponibilidade Estrita**: Apenas equipamentos com status `disponivel` podem receber reservas comerciais. Tentativas em máquinas em `manutencao` ou `bloqueado` são estritamente bloqueadas no front-end e no storage:
   > *"Regra Comercial Locar: Apenas frotas com status 'DISPONÍVEL' podem ser reservadas."*
2. **Cálculo Automático de Dias**: O consultor comercial seleciona a data de início e a data de término prevista da operação, e o sistema calcula automaticamente a quantidade de dias úteis/corridos estimados.
3. **Identificação e Rastreabilidade do Cliente**: Registro do nome do cliente contratante (ex: *Vale*, *Gerdau*, *Petrobras*), proposta comercial/contrato, local da obra/site e requisitos especiais.
4. **Transição para Locada**: Quando a máquina é mobilizada e a operação é iniciada, o usuário clica em `🚀 Iniciar Operação (Locar)` e o equipamento transita automaticamente para o status **Locada**, registrando data e hora de mobilização.
5. **Cancelamento Ágil**: Caso o cliente desista ou altere o cronograma, a ação `✕ Cancelar` retorna o equipamento imediatamente para o status **Disponível**, limpando a reserva e guardando o histórico do motivo.

---

## 🛠️ Arquivos Modificados e Adições

| Arquivo | Mudanças Realizadas |
| :--- | :--- |
| [index.html](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/index.html) | Adicionado botão de filtro **Reservadas** (`#badge-count-reservada`), atalho rápido de perfil para **Consultor Comercial** no Modal 8, e o **Modal 10 (`#modal-reserve-equipment`)** com todos os campos de proposta, datas e cliente. |
| [js/modules/auth.js](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/js/modules/auth.js) | Criado o perfil corporativo `commercial` (*Juliana Vasconcelos* - Matrícula `LOC-4200`, PIN `1234`), com o método `canManageReservations()`. |
| [js/storage.js](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/js/storage.js) | Implementados os métodos `reserveEquipment(id, data)`, `activateRental(id)` e `cancelReservation(id, reason)` com validação estrita de status. |
| [js/modules/fleetManager.js](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/js/modules/fleetManager.js) | Adicionado card de KPI **Frotas Reservadas**, badge de status âmbar `#F59E0B`, cálculo de taxa de aproveitamento comercial, e botões dinâmicos no card (`📑 Reservar`, banner informativo da reserva, `🚀 Iniciar Operação` e `✕ Cancelar`). |
| [js/app.js](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/js/app.js) | Delegação de eventos no grid de frota, cálculo em tempo real do período estimado (dias), submissão da reserva, acionamento de início de operação e cancelamento com confirmação, além de contadores dinâmicos nos filtros. |

---

## 🧪 Resultados dos Testes Automatizados

O script [scratch/test_reservations.js](file:///c:/Users/maiko/Desktop/Maikon%20Pinho/Projetos%20IA/Inspeção%20Locar/scratch/test_reservations.js) foi executado com sucesso:

```
=== TESTE DE RESERVA COMERCIAL DE FROTA ===

--- 1. Perfil Comercial (RBAC) ---
✓ PASSOU: Usuário comercial autenticado com sucesso (Juliana Vasconcelos)
✓ PASSOU: Comercial tem permissão canManageReservations()
✓ PASSOU: Comercial NÃO tem permissão de inspeção técnica
✓ PASSOU: Comercial NÃO tem permissão de gerência de frota

--- 2. Regra de Disponibilidade Estrita ---
✓ PASSOU: Frota carregada com 273 equipamentos
✓ PASSOU: Tentativa de reservar máquina 'manutencao' foi barrada com a mensagem correta
✓ PASSOU: Regra estrita barrou equipamento não-disponível

--- 3. Reserva de Máquina Disponível ---
✓ PASSOU: Encontrado equipamento disponível: 40/100/36
✓ PASSOU: Status do equipamento mudou para "reservada"
✓ PASSOU: Dados do cliente gravados
✓ PASSOU: Período estimado gravado (15 dias)
✓ PASSOU: Agente comercial registrado

--- 4. Início de Operação (Transição para Locada) ---
✓ PASSOU: Status mudou com sucesso para "locada"
✓ PASSOU: Data/hora de início da locação registrada
✓ PASSOU: Campo de cliente atualizado na frota

--- 5. Cancelamento de Reserva ---
✓ PASSOU: Segundo equipamento disponível encontrado: 40/30/61
✓ PASSOU: Segundo equipamento reservado
✓ PASSOU: Status do equipamento retornou para "disponivel" após cancelamento
✓ PASSOU: reservationData foi limpo
✓ PASSOU: Histórico de cancelamento registrado

========================================
RESULTADO DOS TESTES: 20 passaram, 0 falharam
🎉 TODOS OS REQUISITOS FORAM VALIDADOS COM SUCESSO!
```

---

## 💼 Como Utilizar no Sistema

1. **Acessar como Comercial**:
   - Clique no ícone de perfil no topo (`👷 Carlos Mendes` ➔ `🔐 Perfil`).
   - Clique em **💼 Consultor Comercial** (*Juliana Vasconcelos*).
2. **Reservar um Equipamento**:
   - No painel da frota, localize qualquer máquina com badge verde **DISPONÍVEL**.
   - Clique em **`📑 Reservar`**.
   - No Modal de Reserva Comercial, informe:
     - **Cliente Contratante** (ex: *Vale S.A.*, *Gerdau*, *Usiminas*);
     - **Nº da Proposta/Contrato** (ex: *PROP-BET-2026/042*);
     - **Previsão de Início e Término** (o sistema preenche automaticamente a quantidade de dias);
     - **Local da Operação e Observações**.
   - Clique em **`📑 Confirmar Reserva Comercial`**.
3. **Visualização no Dashboard**:
   - O card da máquina exibirá o badge âmbar **RESERVADA** e um banner:
     *`📑 Reservado p/ Vale S.A. - 01/10/2026 a 15/10/2026 (15 dias)`*.
   - O KPI de **Frotas Reservadas** no topo incrementará o contador.
4. **Iniciar Operação (Transição para Locada)**:
   - Quando a máquina for despachada para o cliente, clique no botão azul **`🚀 Iniciar Operação (Locar)`**.
   - O sistema confirma e transita o status da máquina diretamente para **`LOCADA`**, vinculando o contrato e registrando o início oficial dos trabalhos.
5. **Se o Cliente Cancelar**:
   - Basta clicar em **`✕ Cancelar`** no card reservado; a máquina volta a ficar imediatamente **`DISPONÍVEL`** para novos contratos.
