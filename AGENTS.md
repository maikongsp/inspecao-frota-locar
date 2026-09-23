# Diretrizes de Desenvolvimento do Projeto (Locar Guindastes)

## 📌 Atualização Obrigatória do Documento Corporativo (`Sistema de Inspeção & Qualidade de Frota.pptx`)
Sempre que qualquer alteração for realizada no sistema (novas regras de negócio, mudanças no fluxo de inspeção, atualizações de status, melhorias de interface, integrações com PCM, Appwrite, etc.):

- **Regra Mandatória:** O arquivo `Sistema de Inspeção & Qualidade de Frota.pptx` (localizado na raiz do projeto) deve ser imediatamente atualizado.
- **Como atualizar:**
  1. Adequar os slides e conteúdos correspondentes no script `scratch/generate_ppt.py`.
  2. Executar `python scratch/generate_ppt.py` para regenerar a apresentação corporativa.
  3. Validar se `Sistema de Inspeção & Qualidade de Frota.pptx` foi gerado com sucesso na raiz do projeto.
