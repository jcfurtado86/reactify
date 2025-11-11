### Configurar serviço python(uma vez)
 
>**Necessário** ter o Python previamente instalado

- Criar ambiente virtual(raiz):
   ```bash
   python -m venv .venv
   ```
   
- Ativar o ambiente virtual (linux):
   ```bash
   source .venv/bin/activate
   ```
   
- Baixar as dependencias do projeto:
   ```bash
   cd py_service
   pip install -r requirements.txt
   ```

### (Caso necessário) Rodar serviços separadamente 
     
- Ativar o ambiente virtua na raiz em todos os terminais novos(linux):
   ```bash
   source .venv/bin/activate
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