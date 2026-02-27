#TESTA EXTRACAO DE TEXTO COM DOCLING
from docling.document_converter import DocumentConverter

source = "./Dissertacao_Bleno_VersaoFinal.pdf"  # file path or URL
converter = DocumentConverter()
doc = converter.convert(source).document

print(doc.export_to_markdown())  # output: "### Docling Technical Report[...]"