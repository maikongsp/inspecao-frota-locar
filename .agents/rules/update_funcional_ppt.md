# Regra de Manutenção do Documento Sistema de Inspeção & Qualidade de Frota.pptx

Sempre que qualquer funcionalidade, regra de negócio, fluxo de tela, integração ou comportamento do Sistema de Inspeção de Frota Locar for alterado ou adicionado:

1. Atualizar o script de geração em `scratch/generate_ppt.py` refletindo as novas funcionalidades, regras ou telas.
2. Executar `python scratch/generate_ppt.py` para sincronizar e atualizar o arquivo `Sistema de Inspeção & Qualidade de Frota.pptx` na raiz do projeto.
3. Garantir que o documento `Sistema de Inspeção & Qualidade de Frota.pptx` esteja sempre fiel e alinhado com o estado real e operacional do sistema.
