import zipfile
import xml.etree.ElementTree as ET
import os
import sys

def get_docx_text(path):
    try:
        if not os.path.exists(path):
            return f"Error: File not found at {path}"
            
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.fromstring(xml_content)
        
        paragraphs = []
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        for paragraph in tree.findall('.//w:p', ns):
            texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
            if texts:
                paragraphs.append("".join(texts))
        
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python read_docx.py <input_docx> <output_txt>")
        sys.exit(1)
        
    docx_path = sys.argv[1]
    output_path = sys.argv[2]
    text = get_docx_text(docx_path)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Text extracted to {output_path}")
