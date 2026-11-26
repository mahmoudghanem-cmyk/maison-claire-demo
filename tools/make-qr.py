#!/usr/bin/env python3
"""
Make a QR code (PNG + SVG) for the store link, with no extra install.

    python3 tools/make-qr.py                       # bare store link
    python3 tools/make-qr.py --ask-passcode        # prompts (hidden) for DEMO_PASSCODE and adds ?passcode=
    python3 tools/make-qr.py --url "https://..." --out my-qr

Files are written as <out>.png and <out>.svg (default: qr-store). qr-*.png / qr-*.svg are
gitignored: a QR code with the passcode in it must never be committed to this public repo.

Byte-mode QR, error correction level M, versions 1 to 10. The encoder follows the
QR Code standard (ISO/IEC 18004) the same way Project Nayuki's reference code does.
"""
import argparse, getpass, struct, sys, urllib.parse, zlib

# (total codewords, ec codewords per block, number of blocks) for level M, versions 1..10
M_TABLE = {1: (26, 10, 1), 2: (44, 16, 1), 3: (70, 26, 1), 4: (100, 18, 2), 5: (134, 24, 2),
           6: (172, 16, 4), 7: (196, 18, 4), 8: (242, 22, 4), 9: (292, 22, 5), 10: (346, 26, 5)}
ALIGN = {1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
         7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]}


def gf_mul(x, y):
    z = 0
    for i in range(7, -1, -1):
        z = (z << 1) ^ ((z >> 7) * 0x11D)
        z ^= ((y >> i) & 1) * x
    return z


def rs_divisor(degree):
    result = [0] * (degree - 1) + [1]
    root = 1
    for _ in range(degree):
        for j in range(len(result)):
            result[j] = gf_mul(result[j], root)
            if j + 1 < len(result):
                result[j] ^= result[j + 1]
        root = gf_mul(root, 0x02)
    return result


def rs_remainder(data, divisor):
    result = [0] * len(divisor)
    for b in data:
        factor = b ^ result.pop(0)
        result.append(0)
        for i, coef in enumerate(divisor):
            result[i] ^= gf_mul(coef, factor)
    return result


def data_capacity(ver):
    total, ec, blocks = M_TABLE[ver]
    return total - ec * blocks


def encode_data(text):
    data = text.encode("utf-8")
    for ver in M_TABLE:
        count_bits = 8 if ver <= 9 else 16
        if 4 + count_bits + 8 * len(data) <= data_capacity(ver) * 8:
            break
    else:
        sys.exit("Link too long for this script (max version 10).")
    bits = []
    def put(val, n):
        bits.extend((val >> i) & 1 for i in range(n - 1, -1, -1))
    put(0b0100, 4)
    put(len(data), count_bits)
    for b in data:
        put(b, 8)
    cap = data_capacity(ver) * 8
    put(0, min(4, cap - len(bits)))
    put(0, (-len(bits)) % 8)
    pad = 0xEC
    while len(bits) < cap:
        put(pad, 8)
        pad ^= 0xEC ^ 0x11
    codewords = [int("".join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]
    return ver, codewords


def add_ecc_and_interleave(ver, data):
    total, ec, nblocks = M_TABLE[ver]
    short_len = total // nblocks          # full block length (data + ec) of the short blocks
    num_short = nblocks - total % nblocks
    div = rs_divisor(ec)
    blocks, k = [], 0
    for i in range(nblocks):
        dlen = short_len - ec + (0 if i < num_short else 1)
        dat = data[k:k + dlen]
        k += dlen
        blk = dat + rs_remainder(dat, div)
        if i < num_short:
            blk.insert(short_len - ec, None)  # placeholder so columns line up
        blocks.append(blk)
    out = []
    for i in range(len(blocks[0])):
        for blk in blocks:
            if blk[i] is not None:
                out.append(blk[i])
    return out


class Matrix:
    def __init__(self, ver):
        self.ver = ver
        self.size = ver * 4 + 17
        self.mod = [[False] * self.size for _ in range(self.size)]
        self.func = [[False] * self.size for _ in range(self.size)]

    def set_func(self, x, y, dark):
        self.mod[y][x] = dark
        self.func[y][x] = True

    def draw_function_patterns(self):
        s = self.size
        for i in range(s):
            self.set_func(6, i, i % 2 == 0)
            self.set_func(i, 6, i % 2 == 0)
        for cx, cy in ((3, 3), (s - 4, 3), (3, s - 4)):
            for dy in range(-4, 5):
                for dx in range(-4, 5):
                    x, y = cx + dx, cy + dy
                    if 0 <= x < s and 0 <= y < s:
                        self.set_func(x, y, max(abs(dx), abs(dy)) not in (2, 4))
        pos = ALIGN[self.ver]
        n = len(pos)
        for i in range(n):
            for j in range(n):
                if (i == 0 and j == 0) or (i == 0 and j == n - 1) or (i == n - 1 and j == 0):
                    continue
                for dy in range(-2, 3):
                    for dx in range(-2, 3):
                        self.set_func(pos[i] + dx, pos[j] + dy, max(abs(dx), abs(dy)) != 1)
        self.draw_format(0)
        self.draw_version()

    def draw_format(self, mask):
        data = (0 << 3) | mask  # level M = 0b00
        rem = data
        for _ in range(10):
            rem = (rem << 1) ^ ((rem >> 9) * 0x537)
        bits = ((data << 10) | rem) ^ 0x5412
        b = lambda i: (bits >> i) & 1 == 1
        s = self.size
        for i in range(6):
            self.set_func(8, i, b(i))
        self.set_func(8, 7, b(6))
        self.set_func(8, 8, b(7))
        self.set_func(7, 8, b(8))
        for i in range(9, 15):
            self.set_func(14 - i, 8, b(i))
        for i in range(8):
            self.set_func(s - 1 - i, 8, b(i))
        for i in range(8, 15):
            self.set_func(8, s - 15 + i, b(i))
        self.set_func(8, s - 8, True)

    def draw_version(self):
        if self.ver < 7:
            return
        rem = self.ver
        for _ in range(12):
            rem = (rem << 1) ^ ((rem >> 11) * 0x1F25)
        bits = (self.ver << 12) | rem
        for i in range(18):
            bit = (bits >> i) & 1 == 1
            a, c = self.size - 11 + i % 3, i // 3
            self.set_func(a, c, bit)
            self.set_func(c, a, bit)

    def draw_codewords(self, data):
        s, i = self.size, 0
        right = s - 1
        while right >= 1:
            if right == 6:
                right = 5
            for vert in range(s):
                for j in range(2):
                    x = right - j
                    upward = ((right + 1) & 2) == 0
                    y = s - 1 - vert if upward else vert
                    if not self.func[y][x] and i < len(data) * 8:
                        self.mod[y][x] = (data[i >> 3] >> (7 - (i & 7))) & 1 == 1
                        i += 1
            right -= 2

    def apply_mask(self, mask):
        f = [lambda x, y: (x + y) % 2 == 0, lambda x, y: y % 2 == 0, lambda x, y: x % 3 == 0,
             lambda x, y: (x + y) % 3 == 0, lambda x, y: (x // 3 + y // 2) % 2 == 0,
             lambda x, y: x * y % 2 + x * y % 3 == 0, lambda x, y: (x * y % 2 + x * y % 3) % 2 == 0,
             lambda x, y: ((x + y) % 2 + x * y % 3) % 2 == 0][mask]
        for y in range(self.size):
            for x in range(self.size):
                if not self.func[y][x] and f(x, y):
                    self.mod[y][x] = not self.mod[y][x]

    def penalty(self):
        s, m, score = self.size, self.mod, 0
        lines = [m[y] for y in range(s)] + [[m[y][x] for y in range(s)] for x in range(s)]
        for line in lines:                       # rule 1: runs of 5+
            run, prev = 0, None
            for v in line + [None]:
                if v == prev:
                    run += 1
                else:
                    if run >= 5:
                        score += run - 2
                    run, prev = 1, v
            txt = "".join("1" if v else "0" for v in line)   # rule 3: finder-like patterns
            for pat in ("10111010000", "00001011101"):
                start = txt.find(pat)
                while start != -1:
                    score += 40
                    start = txt.find(pat, start + 1)
        for y in range(s - 1):                   # rule 2: 2x2 blocks
            for x in range(s - 1):
                if m[y][x] == m[y][x + 1] == m[y + 1][x] == m[y + 1][x + 1]:
                    score += 3
        dark = sum(sum(r) for r in m)            # rule 4: dark/light balance
        score += (abs(dark * 20 - s * s * 10) + s * s - 1) // (s * s) * 10
        return score


def make_qr(text):
    ver, data = encode_data(text)
    words = add_ecc_and_interleave(ver, data)
    best = None
    for mask in range(8):
        q = Matrix(ver)
        q.draw_function_patterns()
        q.draw_codewords(words)
        q.apply_mask(mask)
        q.draw_format(mask)
        p = q.penalty()
        if best is None or p < best[0]:
            best = (p, q)
    return best[1]


def write_png(q, path, scale=24, quiet=4):
    n = (q.size + quiet * 2) * scale
    rows = []
    for py in range(n):
        y = py // scale - quiet
        row = bytearray([0])
        for px in range(n):
            x = px // scale - quiet
            dark = 0 <= x < q.size and 0 <= y < q.size and q.mod[y][x]
            row.append(0 if dark else 255)
        rows.append(bytes(row))
    def chunk(tag, body):
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 0, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


def write_svg(q, path, quiet=4):
    s = q.size + quiet * 2
    d = "".join(f"M{x + quiet} {y + quiet}h1v1h-1z" for y in range(q.size) for x in range(q.size) if q.mod[y][x])
    with open(path, "w") as fh:
        fh.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}" width="1000" height="1000" '
                 f'shape-rendering="crispEdges"><rect width="{s}" height="{s}" fill="#fff"/>'
                 f'<path d="{d}" fill="#000"/></svg>\n')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default="https://mahmoudghanem-cmyk.github.io/maison-claire-demo/")
    ap.add_argument("--ask-passcode", action="store_true", help="prompt (hidden) for the passcode and add it to the link")
    ap.add_argument("--lang", choices=["en", "fr"], help="open the store in this language")
    ap.add_argument("--out", default="qr-store", help="output name without extension (keep the qr- prefix)")
    a = ap.parse_args()
    url = a.url
    params = {}
    if a.ask_passcode:
        code = getpass.getpass("Passcode (hidden): ").strip()
        if not code:
            sys.exit("No passcode entered.")
        params["passcode"] = code
    if a.lang:
        params["lang"] = a.lang
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    q = make_qr(url)
    write_png(q, a.out + ".png")
    write_svg(q, a.out + ".svg")
    shown = url if not a.ask_passcode else url.replace(urllib.parse.quote_plus(params["passcode"]), "******")
    print(f"QR version {q.ver} for {shown}\nWrote {a.out}.png and {a.out}.svg")


if __name__ == "__main__":
    main()
