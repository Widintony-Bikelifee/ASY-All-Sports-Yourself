from pathlib import Path
import re

keyword_map = {
    'banner': ('Home banner layout and overlay styling', 'Diseño del banner de inicio y estilo de superposición'),
    'auth__': ('Authentication section appearance and branding', 'Apariencia y estilo de la sección de autenticación'),
    'input-group-text': ('Input icon wrapper styling', 'Estilo del contenedor de iconos de entrada'),
    'form-control': ('Base styling for form fields and transitions', 'Estilo base para campos de formulario y transiciones'),
    'reserva-item': ('Reservation item layout and hover state styling', 'Diseño del elemento de reserva y estilo hover'),
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
    selector = re.sub(r'/\*.*?\*/', '', selector)
    primary = selector.split(',')[0].strip()
    primary = re.sub(r':[:]?\w+.*$', '', primary).strip()
    if primary.startswith('.'): name = primary[1:]
    elif primary.startswith('#'): name = primary[1:]
    else:
        parts = re.split(r'\s+', primary)
        name = parts[-1]
    for key, desc in keyword_map.items():
        if key == name or key in name:
            return desc
    readable = name.replace('-', ' ').replace('_', ' ')
    if not readable:
        readable = primary
    return f'Styles for {readable}.', f'Estilos para {readable}.'


def has_comment_before(out, start_index):
    j = start_index - 1
    while j >= 0 and out[j].strip() == '':
        j -= 1
    if j < 0:
        return False
    return out[j].strip().startswith('/*')


def process_file(path: Path):
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    out = []
    changed = False
    selector_lines = []
    in_selector = False
    in_comment_block = False
    brace_depth = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if in_comment_block:
            out.append(line)
            if '*/' in stripped:
                in_comment_block = False
            i += 1
            continue
        if in_selector:
            selector_lines.append(line)
            if '{' in stripped:
                full_selector = ' '.join(l.strip() for l in selector_lines)
                sel = full_selector[:full_selector.index('{')].strip()
                if not has_comment_before(out, len(out)):
                    desc = describe_selector(sel)
                    out.append(f'/* {desc[0]} / {desc[1]} */')
                    changed = True
                out.extend(selector_lines)
                in_selector = False
                brace_depth += stripped.count('{') - stripped.count('}')
        elif brace_depth == 0:
            if stripped == '':
                out.append(line)
            elif stripped.startswith('/*'):
                out.append(line)
                if '*/' not in stripped:
                    in_comment_block = True
            elif stripped.startswith('@'):
                out.append(line)
            elif '{' in stripped:
                sel = stripped[:stripped.index('{')].strip()
                if not has_comment_before(out, len(out)):
                    desc = describe_selector(sel)
                    out.append(f'/* {desc[0]} / {desc[1]} */')
                    changed = True
                out.append(line)
                brace_depth += stripped.count('{') - stripped.count('}')
            else:
                selector_lines = [line]
                in_selector = True
        else:
            out.append(line)
            brace_depth += stripped.count('{') - stripped.count('}')
        i += 1
    if changed:
        path.write_text('\n'.join(out) + '\n', encoding='utf-8')
    return changed


def main():
    css_files = sorted(Path('assets/css').rglob('*.css'))
    updated = 0
    for path in css_files:
        if process_file(path):
            updated += 1
            print('Updated', path)
    print('CSS files updated:', updated)

if __name__ == '__main__':
    main()
