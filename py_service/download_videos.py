import os
import yt_dlp
from dotenv import load_dotenv

load_dotenv()

# Configurações
LINKS_FILE = "react_m/links.txt"
DOWNLOAD_DIR = "temp_audio" # Pasta onde os arquivos ficarão esperando processamento

os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def download_media(url):
    """
    Baixa o áudio e o arquivo de info (json) para manter metadados.
    Usa o ID do vídeo no nome do arquivo para evitar erros de caracteres no sistema de arquivos.
    """
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
        # Salva como ID.mp3 e ID.info.json
        'outtmpl': f'{DOWNLOAD_DIR}/%(id)s.%(ext)s',
        'writeinfojson': True, # Salva metadados (Titulo, URL, etc)
        'quiet': False,
        'no_warnings': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            print(f"✅ Sucesso: {info.get('title', 'Sem título')}")
    except Exception as e:
        print(f"❌ Erro ao baixar {url}: {e}")

def process_links():
    if not os.path.exists(LINKS_FILE):
        print(f"Arquivo {LINKS_FILE} não encontrado.")
        return

    with open(LINKS_FILE, 'r') as f:
        urls = [line.strip() for line in f.readlines() if line.strip()]

    print(f"---- Iniciando Download de {len(urls)} links ----")
    for url in urls:
        download_media(url)

if __name__ == "__main__":
    process_links()