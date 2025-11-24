### Configurar serviço python(uma vez)
 
>**Necessário** ter o Python previamente instalado

- Criar ambiente virtual(raiz):
   ```bash
   python -m venv .venv
   ```
   
- Ativar o ambiente virtual (bash/zsh):
   ```bash
   source .venv/bin/activate
   ```

- Ativar o ambiente virtual (fish):
   ```bash
   . .venv/bin/activate.fish
   ```
   
- Baixar as dependencias do projeto:
   ```bash
   cd py_service
   pip install -r requirements.txt
   ```

### (Caso necessário) Rodar serviços separadamente 
     
- Ativar o ambiente virtual na raiz em todos os terminais novos(linux):
- (bash/zsh):
   ```bash
   source .venv/bin/activate
   ```

- (fish):
   ```bash
   . .venv/bin/activate.fish
   ```

- Em um terminal, serviço de chat (linux):
   ```bash
   cd py_service
   python chat_service.py
   ```

- Em um terminal, serviço de entrevista (linux):
   ```bash
   cd py_service
   python interview_service.py
   ```

- Rodar o projeto:
   ```bash
   composer dev
   ```