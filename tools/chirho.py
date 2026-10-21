# emits the Chi-Rho emblem as SVG markup; colours are parameters so the card, header and favicon share it
def chirho(ink="#1F2E5C", gold="#B8892B", red="#A3291C", ring=True, ao=True, sw=9):
    s = []
    if ring:
        s.append(f'<circle cx="60" cy="60" r="55" fill="none" stroke="{gold}" stroke-width="3.2"/>')
        s.append(f'<circle cx="60" cy="60" r="49.5" fill="none" stroke="{gold}" stroke-width="1.2"/>')
        # twelve small dots on the ring, as in penwork roundels
        import math
        for i in range(12):
            a = math.pi * 2 * i / 12
            s.append(f'<circle cx="{60+52.3*math.cos(a):.2f}" cy="{60+52.3*math.sin(a):.2f}" r="1.3" fill="{red}"/>')
    # Chi: two crossing strokes with wedge serifs
    s.append(f'<g stroke="{ink}" stroke-width="{sw}" stroke-linecap="butt"><line x1="33" y1="40" x2="87" y2="94"/><line x1="87" y1="40" x2="33" y2="94"/></g>')
    for (x, y, dx, dy) in [(33, 40, 1, -1), (87, 94, 1, -1), (87, 40, 1, 1), (33, 94, 1, 1)]:
        k = 6.5
        s.append(f'<line x1="{x-dx*k:.1f}" y1="{y-dy*k:.1f}" x2="{x+dx*k:.1f}" y2="{y+dy*k:.1f}" stroke="{ink}" stroke-width="3"/>')
    # Rho: stem and bowl, in vermilion so it reads over the Chi
    s.append(f'<path d="M60 16 V104" stroke="{red}" stroke-width="{sw}" fill="none"/>')
    s.append(f'<path d="M60 20.5 H66 A14.5 14.5 0 0 1 66 49.5 H60" stroke="{red}" stroke-width="{sw-1}" fill="none"/>')
    s.append(f'<line x1="53" y1="104" x2="67" y2="104" stroke="{red}" stroke-width="3"/>')
    if ao:
        s.append(f'<text x="26" y="75" font-family="Uncial Antiqua, serif" font-size="17" fill="{gold}" text-anchor="middle">A</text>')
        s.append(f'<text x="94" y="75" font-family="Uncial Antiqua, serif" font-size="17" fill="{gold}" text-anchor="middle">ω</text>')
    return "".join(s)
if __name__ == "__main__":
    open("chirho.svg", "w").write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' + chirho() + "</svg>")
