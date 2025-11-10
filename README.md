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

### Antes de rodar o projeto
     
- Ativar o ambiente virtua na raiz (linux):
   ```bash
   source .venv/bin/activate
   ```

- Rodar o projeto:
   ```bash
   composer dev
   ```