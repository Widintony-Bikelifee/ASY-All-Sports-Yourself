from pathlib import Path
import re

keyword_map = {
    'banner': ('Home banner layout and overlay styling', 'Diseño del banner de inicio y estilo de superposición'),
    'auth__': ('Authentication section appearance and branding', 'Apariencia y estilo de la sección de autenticación'),
    'input-group-text': ('Input icon wrapper styling', 'Estilo del contenedor de iconos de entrada'),
    'form-control': ('Base styling for form fields and transitions', 'Estilo base para campos de formulario y transiciones'),
    'reserva-item': ('Reservation item layout and hover state styling', 'Diseño del elemento de reserva y estilo de hover'),
    'navbar': ('Navigation bar layout and responsive styling', 'Diseño de la barra de navegación y estilo responsivo'),
    'card': ('Card component styling for panels and containers', 'Estilo del componente tarjeta para paneles y contenedores'),
    'badge': ('Badge label styling for status and tags', 'Estilo de etiquetas badge para estados y tags'),
    'btn': ('Button styling including spacing and hover states', 'Estilo de botones incluyendo espaciado y estados hover'),
    'toast': ('Toast notification appearance and positioning', 'Apariencia y posicionamiento de notificaciones toast'),
    'sidebar': ('Sidebar layout and panel styling', 'Diseño y estilo del sidebar'),
    'footer': ('Footer area styling', 'Estilo del área de pie de página'),
    'hero': ('Hero section layout and typography', 'Diseño de la sección hero y tipografía'),
    'banner-welcome': ('Welcome banner container and overlay styling', 'Estilo del contenedor del banner de bienvenida y superposición'),
    'auth__left-bg': ('Background layer for login left panel', 'Capa de fondo del panel izquierdo de login'),
    'auth__spotlight': ('Spotlight effect in the authentication panel', 'Efecto spotlight en el panel de autenticación'),
    'auth__spotlight-2': ('Second spotlight visual effect', 'Segundo efecto visual de spotlight'),
}


def describe_selector(selector):
    selector = selector.strip()
    primary = selector.split(',')[0].strip()
    # remove pseudo classes and combinators
    primary = re.sub(r':[:]?\w+.*$', '', primary).strip()
    # get class or id name
    if primary.startswith('.'): 
        name = primary[1:]
    elif primary.startswith('#'):
        name = primary[1:]
    else:
        parts = re.split(r'\s+', primary)
        name = parts[-1]
    if name in keyword_map:
        return keyword_map[name]
    for key, desc in keyword_map.items():
        if key in name:
            return desc
    readable = name.replace('-', ' ').replace('_', ' ')
    english = f'Styles for {readable}.'
    spanish = f'Estilos para {readable}.'
    return english, spanish


def process_file(path: Path):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    out = []
    changed = False
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped and stripped.startswith('@'):
            out.append(line)
            i += 1
            continue
        if '{' in stripped and not stripped.startswith('/*') and not stripped.startswith('//'):
            # check if it's a selector opening line or media rule line
            if stripped.endswith('{'):
                # find previous non-empty non-comment line
                j = len(out) - 1
                while j >= 0 and not out[j].strip():
                    j -= 1
                if j < 0 or not out[j].strip().startswith('/*'):
                    desc = describe_selector(stripped[:-1])
                    out.append(f'/* {desc[0]} / {desc[1]} */')
                    changed = True
        out.append(line)
        i += 1
    if changed:
        path.write_text('\n'.join(out) + '\n', encoding='utf-8')
    return changed


def main():
    files = sorted(Path('assets/css').rglob('*.css'))
    updated = 0
    for path in files:
        if process_file(path):
            updated += 1
            print('Updated', path)
    print('CSS files updated:', updated)

if __name__ == '__main__':
    main()
