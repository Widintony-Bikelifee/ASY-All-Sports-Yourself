from pathlib import Path

for path in sorted(Path('assets/css').rglob('*.css')):
    lines = path.read_text(encoding='utf-8').splitlines()
    out = []
    changed = False
    header_done = False
    in_header_comment = False
    for line in lines:
        stripped = line.strip()
        if not header_done:
            if stripped == '':
                out.append(line)
                continue
            if in_header_comment or stripped.startswith('/*'):
                out.append(line)
                if '*/' in stripped:
                    in_header_comment = False
                elif stripped.startswith('/*'):
                    in_header_comment = True
                continue
            header_done = True
        if stripped.startswith('/*'):
            changed = True
            if '*/' not in stripped:
                in_header_comment = True
            continue
        if in_header_comment:
            changed = True
            if '*/' in stripped:
                in_header_comment = False
            continue
        out.append(line)
    if changed:
        path.write_text('\n'.join(out) + '\n', encoding='utf-8')
        print('Cleaned', path)
