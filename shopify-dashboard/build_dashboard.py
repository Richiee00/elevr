"""Genera el dashboard de analytics a partir del export de pedidos de Shopify.

Uso:  python3 build_dashboard.py <orders_export.csv> [salida.html]

El HTML resultante solo contiene datos agregados por pedido y por línea
(fecha, país, importes, producto, unidades). No incluye emails ni direcciones.
"""
import csv, json, re, sys, collections
from pathlib import Path

HERE = Path(__file__).resolve().parent
SIZE_RE = re.compile(r"\s*-\s*(XXS|XS|S|M|L|XL|XXL|U|Mini|Midi|Maxi|Mini \(.*\)|Midi \(.*\)|Maxi \(.*\))\s*$", re.I)
NON_PRODUCT = {"return shipping autumn", "test product", "1 eur"}


def num(s):
    s = (s or "").strip()
    if not s:
        return 0.0
    return float(s.replace(",", "."))


def base_product(name):
    n = re.sub(r"\s*-\s*PREORDER\b", "", name, flags=re.I).strip()
    n = SIZE_RE.sub("", n).strip()
    n = re.sub(r"\s+", " ", n)
    # unificar mayúsculas/minúsculas de la primera letra de cada palabra solo para agrupar
    return n[:1].upper() + n[1:]


def main(src, out):
    with open(src, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f, delimiter=";"))

    orders, order_rows = {}, collections.defaultdict(list)
    for r in rows:
        order_rows[r["Name"]].append(r)
        if r["Currency"]:
            orders[r["Name"]] = r

    q = collections.Counter()
    q["rows"] = len(rows)
    q["orders_total"] = len(order_rows)
    currencies = collections.Counter(o["Currency"] for o in orders.values())

    countries, products, variants = [], [], []
    cidx, pidx, vidx = {}, {}, {}

    def idx(table, lookup, key):
        if key not in lookup:
            lookup[key] = len(table)
            table.append(key)
        return lookup[key]

    O, L = [], []
    pkey = {}  # agrupa nombres que solo difieren en mayúsculas
    excluded, nonprod, recon_issues = [], collections.defaultdict(float), []
    for name, o in orders.items():
        lines = order_rows[name]
        gross = sum(num(l["Lineitem quantity"]) * num(l["Lineitem price"]) for l in lines)
        sub, ship, tax, tot = num(o["Subtotal"]), num(o["Shipping"]), num(o["Taxes"]), num(o["Total"])
        disc, ref = num(o["Discount Amount"]), num(o["Refunded Amount"])
        if not o["Paid at"]:
            excluded.append({"name": name, "lines": len(lines), "units": sum(int(num(l["Lineitem quantity"])) for l in lines),
                             "value": round(gross, 2), "discount": disc})
            continue
        pdisc = gross - sub
        ship_net = tot - sub          # Total = Subtotal + envío neto (impuestos incluidos en precio)
        sdisc = ship - ship_net
        if abs(pdisc + sdisc - disc) > 0.05 or ship_net < -0.01 or sdisc < -0.01:
            recon_issues.append(name)
        date = o["Paid at"][:10]
        c = o["Billing Country"].strip() or "—"
        ci = idx(countries, cidx, c)
        oi = len(O)
        units = 0
        factor = sub / gross if gross else 0
        for l in lines:
            qty = int(num(l["Lineitem quantity"]))
            g = qty * num(l["Lineitem price"])
            vname = l["Lineitem name"].strip()
            if vname.lower() in NON_PRODUCT:
                nonprod[vname] += g * factor
                continue
            units += qty
            bp = base_product(vname)
            pi = idx(products, pidx, pkey.setdefault(bp.lower(), bp))
            vi = idx(variants, vidx, vname)
            L.append([oi, pi, vi, qty, round(g, 2), round(g * factor, 2)])
        O.append([date, ci, round(gross, 2), round(sub, 2), round(ship_net, 2), round(sdisc, 2),
                  round(tax, 2), round(tot, 2), round(pdisc, 2), round(ref, 2), units,
                  1 if o["Refunded Amount"] == "" else 0])

    dates = sorted(o[0] for o in O)
    quality = {
        "rows": len(rows),
        "orders_in_file": len(order_rows),
        "orders_paid": len(O),
        "orders_excluded": excluded,
        "currencies": dict(currencies),
        "first_date": dates[0], "last_date": dates[-1],
        "multi_line_orders": sum(1 for n in orders if len(order_rows[n]) > 1),
        "max_lines": max(len(v) for v in order_rows.values()),
        "lines": len(rows),
        "variants": len(variants), "products": len(products),
        "no_country": sum(1 for o in O if countries[o[1]] == "—"),
        "no_country_no_email": sum(1 for n, o in orders.items() if o["Paid at"] and not o["Billing Country"].strip() and not o["Email"].strip()),
        "orders_with_tax": sum(1 for o in O if o[6] > 0),
        "orders_with_refund": sum(1 for o in O if o[9] > 0),
        "refund_blank": sum(o[11] for o in O),
        "orders_with_discount": sum(1 for o in O if o[8] > 0.005 or o[5] > 0.005),
        "orders_ship_discount": sum(1 for o in O if o[5] > 0.005),
        "recon_issues": recon_issues,
        "nonproduct": {k: round(v, 2) for k, v in nonprod.items()},
        "duplicate_rows": len(rows) - len({tuple(r.values()) for r in rows}),
        "tz": sorted({o["Paid at"][-5:] for o in orders.values() if o["Paid at"]}),
    }
    data = {"orders": O, "lines": L, "countries": countries, "products": products,
            "variants": variants, "quality": quality}
    tpl = (HERE / "template.html").read_text(encoding="utf-8")
    page = tpl.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    # Versión autónoma (se abre con doble clic) y fragmento para publicar como Artifact
    standalone = ('<!doctype html><html lang="es"><head><meta charset="utf-8">'
                  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
                  '</head><body>' + page + '</body></html>')
    Path(out).write_text(standalone, encoding="utf-8")
    if len(sys.argv) > 3:
        Path(sys.argv[3]).write_text(page, encoding="utf-8")
    html = page
    print(json.dumps({k: v for k, v in quality.items() if k != "orders_excluded"}, ensure_ascii=False, indent=1))
    print("excluded", len(excluded), "out", out, len(html) // 1024, "KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else str(HERE / "dashboard.html"))
