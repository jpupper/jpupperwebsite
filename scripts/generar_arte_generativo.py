#!/usr/bin/env python3
"""Genera public/data/arte-generativo.json (el índice de la sección "Arte generativo").

Fuente: el dump del archivo de NFTs ya normalizado
(`carloskernel/jpupper-nft-archive/data/proyectos.json`, bajado de objkt GraphQL).
Corta ese archivo en las TRES categorías que se muestran en la portada:
  ketitaki        -> wallet de KetiTaki (todo)
  jpupper-hen     -> obras de JPupper en HIC ET NUNC
  jpupper-fxhash  -> obras de JPupper en fxhash (v1, v2, fx(params)) + colectivas

Uso:  python scripts/generar_arte_generativo.py [ruta_al_proyectos.json]
Si el archivo de objkt cambió (obras nuevas), primero hay que regenerar ese dump con
la consulta GraphQL del skill `objkt-nft-archive` y después correr este script.
"""
import json
import os
import sys
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
DUMP = sys.argv[1] if len(sys.argv) > 1 else \
    r"D:\Programacion\carloskernel\jpupper-nft-archive\data\proyectos.json"
SALIDA = os.path.join(AQUI, "..", "public", "data", "arte-generativo.json")


# Pedidos del usuario sobre qué entra en cada colección:
#  - HEN: fuera estas piezas (no son obras de la colección)
HEN_EXCLUIR = {"please contact me", "kinect shader madness"}
#  - fxhash: SOLO los contratos de fxhash. Las colectivas de otros contratos
#    (Versum, Newtro's, VUELAPELUCAS 3000, Interactive generative works) NO son fxhash
#    y quedan afuera, aunque sean generativas.
CONTRATOS_FXHASH = {
    "KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE",   # fxhash v1 (Genesis)
    "KT1U6EHmNxJTkvaWJ4ThczG4FSDaHC21ssvi",   # fxhash v2
    "KT1EfsNuqwLAWDd3o4pvfUx1CAh5GMdTrRvr",   # fx(params)
}


def slim(p, artista):
    sem = p.get("semillas") or []
    out = {
        "n": p.get("nombre", ""),
        "pl": p.get("plataforma", ""),
        "e": p.get("ediciones", 1) or 1,
        "f": (p.get("fecha") or "")[:4],
        "t": p.get("thumb") or "",
        "g": p.get("generador") or "",
        "s": sem[:3],          # semillas de ejemplo para el visor
        "a": artista,
    }
    if p.get("contrato"):
        out["c"] = p["contrato"]
    toks = p.get("tokens") or []
    if toks:
        out["tok"] = toks[0].get("id")
        if p.get("plataforma") == "HEN":
            out["art"] = toks[0].get("artefacto") or ""
    return out


def orden(x):
    return (x.get("f") or "0000", x["n"].lower())


def main():
    d = json.load(open(DUMP, encoding="utf-8"))
    art = {a["nombre"]: a for a in d["artistas"]}
    jp, kt = art["JPupper"], art["KetiTaki"]

    hen = [slim(p, "JPupper") for p in jp["proyectos"]
           if p.get("plataforma") == "HEN" and p.get("nombre", "").strip().lower() not in HEN_EXCLUIR]
    fx = [slim(p, "JPupper") for p in jp["proyectos"]
          if (p.get("contrato") or "") in CONTRATOS_FXHASH]
    ket = [slim(p, "KetiTaki") for p in kt["proyectos"]]
    for lista in (hen, fx, ket):
        lista.sort(key=orden, reverse=True)

    data = {
        "generado": d.get("generado"),
        "fuente": "objkt.com GraphQL + CDN assets.objkt.media",
        "categorias": [
            {"id": "ketitaki", "nombre": "KetiTaki", "wallet": kt["wallet"], "proyectos": ket},
            {"id": "jpupper-hen", "nombre": "JPupper \u00b7 HEN", "wallet": jp["wallet"], "proyectos": hen},
            {"id": "jpupper-fxhash", "nombre": "JPupper \u00b7 fxhash", "wallet": jp["wallet"], "proyectos": fx},
        ],
    }

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))

    print("escrito", os.path.abspath(SALIDA), os.path.getsize(SALIDA), "bytes")
    for c in data["categorias"]:
        print(" ", c["id"], len(c["proyectos"]), "proyectos",
              Counter(p["pl"] for p in c["proyectos"]).most_common())


if __name__ == "__main__":
    main()
