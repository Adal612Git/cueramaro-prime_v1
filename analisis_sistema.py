import os
from pathlib import Path

# Nombre del archivo de salida que contendrá toda la información
OUTPUT_FILENAME = "analisis_sistema.txt"

def get_file_content(filepath: Path) -> str:
    """Lee el contenido de un archivo si existe, manejando errores."""
    try:
        if not filepath.exists():
            return f"--- Archivo no encontrado: {filepath.relative_to(Path.cwd())} ---\n"
        
        # Evitar leer archivos binarios o muy grandes por error
        if filepath.stat().st_size > 5 * 1024 * 1024: # Límite de 5MB
             return f"--- Archivo omitido por tamaño: {filepath.relative_to(Path.cwd())} ---\n"
            
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        # Captura errores de decodificación (ej. archivos binarios)
        return f"--- Error al leer {filepath.relative_to(Path.cwd())}: {e} ---\n"

def generate_tree(startpath: Path) -> str:
    """Genera una vista de árbol para un directorio, ignorando carpetas comunes."""
    tree_lines = []
    
    if not startpath.exists() or not startpath.is_dir():
        return f"--- Directorio no encontrado: {startpath.relative_to(Path.cwd())} ---\n"

    for root, dirs, files in os.walk(startpath, topdown=True):
        # --- Carpetas a ignorar ---
        dirs[:] = [
            d for d in dirs 
            if d not in ['node_modules', '.git', 'dist', 'build', '__pycache__', 'test', 'coverage']
        ]
        
        # --- Archivos a ignorar ---
        files = [
            f for f in files 
            if f not in ['.DS_Store'] and not f.endswith(('.log', '.lock'))
        ]

        current_dir = Path(root)
        relative_dir = current_dir.relative_to(startpath.parent)
        level = len(relative_dir.parts) - 1
        indent = ' ' * 4 * level
        
        tree_lines.append(f"{indent}{current_dir.name}/")
        subindent = ' ' * 4 * (level + 1)
        
        for f in files:
            tree_lines.append(f"{subindent}{f}")
            
    return "\n".join(tree_lines)

def main():
    """Función principal para recolectar la información del sistema."""
    project_root = Path.cwd()
    output_data = []

    print(f"Analizando proyecto en: {project_root}")

    output_data.append("INFORME DE ANÁLISIS DEL SISTEMA (Generado por script de Python)\n")
    output_data.append("===============================================================\n\n")

    # --- Advertencia de Seguridad ---
    output_data.append("### ADVERTENCIA DE SEGURIDAD ###\n")
    output_data.append("Este script NO lee el archivo .env. Por favor, NUNCA compartas\n")
    output_data.append("tu archivo .env real, ya que contiene contraseñas y claves secretas.\n")
    
    env_exists = (project_root / ".env").exists()
    output_data.append(f"\nEstado de .env: {'Encontrado (y omitido por seguridad)' if env_exists else 'No encontrado'}\n")
    output_data.append("===============================================================\n\n")

    # --- 1. Archivos Clave de Configuración ---
    output_data.append("### 1. Archivos Clave de Configuración ###\n\n")
    
    files_to_read = [
        "prisma/schema.prisma",
        "package.json",
        "docker-compose.yml",
    ]

    for file_path_str in files_to_read:
        file_path = project_root / file_path_str
        output_data.append(f"--- [ {file_path_str} ] ---\n")
        output_data.append(get_file_content(file_path))
        output_data.append(f"\n\n")

    # --- 2. Estructura de Directorios ---
    output_data.append("### 2. Estructura de Directorios ###\n\n")
    
    dirs_to_tree = ["prisma", "src"]
    for dir_name in dirs_to_tree:
        output_data.append(f"--- [ Árbol de: {dir_name}/ ] ---\n")
        output_data.append(generate_tree(project_root / dir_name))
        output_data.append(f"\n\n")

    # --- 3. Archivos de Código Fuente (Lógica y Datos) ---
    output_data.append("### 3. Archivos de Código Fuente (Lógica y Datos) ###\n\n")
    
    # Lista de archivos mencionados en tu doc + otros relevantes
    source_files_to_find = [
        "prisma/catalog_seed.ts",
        "prisma/user_extra_seed.ts",
        "prisma/history_seed.ts",
        "src/prisma/prisma.service.ts",
        "src/catalogs/catalogs.controller.ts",
        "src/reports/reports.controller.ts",
    ]
    
    # Añadir dinámicamente todos los controladores, servicios y módulos de 'src'
    src_path = project_root / "src"
    if src_path.exists():
        for file_path in src_path.rglob('*.ts'):
            if any(s in file_path.name for s in ['.controller.', '.service.', '.module.']):
                rel_path_str = str(file_path.relative_to(project_root))
                if rel_path_str not in source_files_to_find:
                    source_files_to_find.append(rel_path_str)

    for file_path_str in sorted(list(set(source_files_to_find))):
        file_path = project_root / file_path_str
        output_data.append(f"--- [ {file_path_str} ] ---\n")
        output_data.append(get_file_content(file_path))
        output_data.append(f"\n\n")

    # --- Escribir el archivo de salida ---
    try:
        with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
            f.write("".join(output_data))
        print("\n" + "="*50)
        print(f"✅ ¡Éxito! Se ha generado el archivo '{OUTPUT_FILENAME}'.")
        print("="*50)
        print("\nREVISA EL ARCHIVO: Ábrelo y comprueba que no haya")
        print("información sensible que no quieras compartir (aunque no")
        print("debería haberla, ya que ignoramos el .env).\n")
        print("PASO FINAL: Copia y pega el contenido COMPLETO de")
        print(f"'{OUTPUT_FILENAME}' en nuestro chat para que pueda analizarlo.")
        
    except Exception as e:
        print(f"\n❌ Error al escribir el archivo de salida: {e}")
        print("--- Mostrando salida en consola como alternativa ---")
        print("".join(output_data))

if __name__ == "__main__":
    main()