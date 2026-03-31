import { useState } from 'react';
import { ChevronDown, Layers, Settings, LayoutList, X, ArrowLeftRight, Pencil } from 'lucide-react';
import { useOptimizerStore } from '../../hooks/useOptimizerStore';
import { toMM, fromMM, unitLabel } from '../../lib/optimizer/units';

// ── Shared styles ────────────────────────────────────────────
const cellInput = "w-full bg-transparent text-xs px-1.5 py-1 border border-transparent focus:border-blue-400 focus:bg-white rounded outline-none text-center tabular-nums";
const sectionHeaderCls = "flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 cursor-pointer select-none hover:bg-slate-200/60 transition-colors";

function SectionHeader({ icon: Icon, title, open, onToggle }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={sectionHeaderCls} onClick={onToggle}>
      <Icon className="h-4 w-4 text-slate-500 shrink-0" />
      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex-1">{title}</span>
      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
    </div>
  );
}

const MATERIALS = ['Melamina', 'MDF', 'Triplay', 'Aglomerado', 'MDP', 'OSB'];

export function OptimizerSidebar() {
  const store = useOptimizerStore();
  const unit = store.unit;

  const [panelsOpen, setPanelsOpen] = useState(true);
  const [stocksOpen, setStocksOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [remnantsOpen, setRemnantsOpen] = useState(false);

  // ── Inline add row state — Panels ─────────────────────────
  const [pAncho, setPAncho] = useState('');
  const [pAlto, setPAlto] = useState('');
  const [pCant, setPCant] = useState('1');
  const [pNombre, setPNombre] = useState('');
  const [pMat, setPMat] = useState('Melamina');
  const [pGrosor, setPGrosor] = useState('18');
  const [pVeta, setPVeta] = useState(false);

  // ── Inline add row state — Stocks ─────────────────────────
  const [sAncho, setSAncho] = useState('2440');
  const [sAlto, setSAlto] = useState('1220');
  const [sNombre, setSNombre] = useState('');
  const [sCosto, setSCosto] = useState('450');
  const [sSierra, setSSierra] = useState('3.2');

  const uL = unitLabel(unit);

  const addPiece = () => {
    const ancho = toMM(parseFloat(pAncho) || 0, unit);
    const alto = toMM(parseFloat(pAlto) || 0, unit);
    if (!ancho || !alto) return;
    store.addPiece({
      nombre: pNombre, material: pMat,
      grosor: toMM(parseFloat(pGrosor) || 18, unit),
      ancho, alto,
      cantidad: parseInt(pCant) || 1,
      vetaHorizontal: pVeta,
      cubrecanto: { sup: false, inf: false, izq: false, der: false },
    });
    setPAncho(''); setPAlto(''); setPCant('1'); setPNombre('');
  };

  const addStock = () => {
    const ancho = toMM(parseFloat(sAncho) || 0, unit);
    const alto = toMM(parseFloat(sAlto) || 0, unit);
    if (!ancho || !alto) return;
    store.addStock({
      nombre: sNombre || `${sAncho}×${sAlto}`,
      ancho, alto,
      costo: parseFloat(sCosto) || 0,
      sierra: parseFloat(sSierra) || 3.2,
    });
    setSNombre('');
  };

  const handlePieceKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') addPiece(); };
  const handleStockKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') addStock(); };

  // ── Remnant state ─────────────────────────────────────────
  const [remMat, setRemMat] = useState('Melamina');
  const [remGrosor, setRemGrosor] = useState('18');
  const [remAncho, setRemAncho] = useState('800');
  const [remAlto, setRemAlto] = useState('600');

  return (
    <div className="flex-1 overflow-y-auto bg-white">

      {/* ═══ PANELS (Pieces) ════════════════════════════════ */}
      <SectionHeader icon={LayoutList} title="Panels" open={panelsOpen} onToggle={() => setPanelsOpen(v => !v)} />
      {panelsOpen && (
        <div>
          {/* Material / grain row */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
            <select value={pMat} onChange={e => setPMat(e.target.value)}
              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 flex-1">
              {MATERIALS.map(m => <option key={m}>{m}</option>)}
            </select>
            <input value={pGrosor} onChange={e => setPGrosor(e.target.value)} placeholder="18"
              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white text-center w-12"
              title={`Grosor (${uL})`} />
            <label className="flex items-center gap-1 cursor-pointer shrink-0" title="Veta fija">
              <input type="checkbox" checked={pVeta} onChange={e => setPVeta(e.target.checked)}
                className="w-3 h-3 rounded border-slate-300 text-blue-600" />
              <ArrowLeftRight className="h-3 w-3 text-slate-400" />
            </label>
          </div>

          {/* Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-1.5 px-2 text-left font-semibold text-slate-500 w-[30%]">Ancho</th>
                <th className="py-1.5 px-1 text-left font-semibold text-slate-500 w-[30%]">Alto</th>
                <th className="py-1.5 px-1 text-center font-semibold text-slate-500 w-[15%]">Cant.</th>
                <th className="py-1.5 px-1 text-left font-semibold text-slate-500">Nombre</th>
                <th className="py-1.5 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {/* Existing pieces */}
              {store.pieces.map((p, idx) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-blue-50/40 group">
                  <td className="px-2 py-0.5">
                    <span className="text-xs tabular-nums text-slate-700">{parseFloat(fromMM(p.ancho, unit).toFixed(3))}</span>
                  </td>
                  <td className="px-1 py-0.5">
                    <span className="text-xs tabular-nums text-slate-700">{parseFloat(fromMM(p.alto, unit).toFixed(3))}</span>
                  </td>
                  <td className="px-1 py-0.5 text-center">
                    <span className="text-xs font-semibold tabular-nums text-slate-700">{p.cantidad}</span>
                  </td>
                  <td className="px-1 py-0.5 truncate max-w-20">
                    <span className="text-xs text-slate-500">{p.nombre || '—'}</span>
                  </td>
                  <td className="px-0.5 py-0.5">
                    <button onClick={() => store.removePiece(p.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add row */}
              <tr className="bg-green-50/40 border-t border-slate-200">
                <td className="px-1 py-0.5">
                  <input value={pAncho} onChange={e => setPAncho(e.target.value)} onKeyDown={handlePieceKey}
                    placeholder={unit === 'in' ? '24' : '600'} className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={pAlto} onChange={e => setPAlto(e.target.value)} onKeyDown={handlePieceKey}
                    placeholder={unit === 'in' ? '16' : '400'} className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={pCant} onChange={e => setPCant(e.target.value)} onKeyDown={handlePieceKey}
                    className={cellInput} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={pNombre} onChange={e => setPNombre(e.target.value)} onKeyDown={handlePieceKey}
                    placeholder="Nombre" className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <button onClick={addPiece} title="Agregar" disabled={!pAncho || !pAlto}
                    className="text-green-600 hover:text-green-700 disabled:text-slate-300 p-0.5">
                    <Pencil className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            <span>{store.pieces.length} panel{store.pieces.length !== 1 ? 'es' : ''}</span>
            <span>{(store.pieces.reduce((s, p) => s + p.ancho * p.alto * p.cantidad, 0) / 1e6).toFixed(2)} m²</span>
            {store.pieces.length > 0 && (
              <button onClick={() => store.clearPieces()} className="text-red-400 hover:text-red-600 text-xs">Limpiar</button>
            )}
          </div>
        </div>
      )}

      {/* ═══ STOCK SHEETS ═══════════════════════════════════ */}
      <SectionHeader icon={Layers} title="Stock sheets" open={stocksOpen} onToggle={() => setStocksOpen(v => !v)} />
      {stocksOpen && (
        <div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-1.5 px-2 text-left font-semibold text-slate-500">Ancho</th>
                <th className="py-1.5 px-1 text-left font-semibold text-slate-500">Alto</th>
                <th className="py-1.5 px-1 text-center font-semibold text-slate-500">$</th>
                <th className="py-1.5 px-1 text-left font-semibold text-slate-500">Nombre</th>
                <th className="py-1.5 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {store.stocks.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-blue-50/40 group">
                  <td className="px-2 py-0.5 text-xs tabular-nums text-slate-700">{parseFloat(fromMM(s.ancho, unit).toFixed(3))}</td>
                  <td className="px-1 py-0.5 text-xs tabular-nums text-slate-700">{parseFloat(fromMM(s.alto, unit).toFixed(3))}</td>
                  <td className="px-1 py-0.5 text-center text-xs tabular-nums text-slate-700">{s.costo}</td>
                  <td className="px-1 py-0.5 text-xs text-slate-500 truncate max-w-20">{s.nombre}</td>
                  <td className="px-0.5 py-0.5">
                    <button onClick={() => store.removeStock(s.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Add row */}
              <tr className="bg-green-50/40 border-t border-slate-200">
                <td className="px-1 py-0.5">
                  <input value={sAncho} onChange={e => setSAncho(e.target.value)} onKeyDown={handleStockKey}
                    className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={sAlto} onChange={e => setSAlto(e.target.value)} onKeyDown={handleStockKey}
                    className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={sCosto} onChange={e => setSCosto(e.target.value)} onKeyDown={handleStockKey}
                    className={cellInput} />
                </td>
                <td className="px-0.5 py-0.5">
                  <input value={sNombre} onChange={e => setSNombre(e.target.value)} onKeyDown={handleStockKey}
                    placeholder="Nombre" className={cellInput + ' text-left'} />
                </td>
                <td className="px-0.5 py-0.5">
                  <button onClick={addStock} title="Agregar"
                    className="text-green-600 hover:text-green-700 disabled:text-slate-300 p-0.5">
                    <Pencil className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ OPTIONS ═════════════════════════════════════════ */}
      <SectionHeader icon={Settings} title="Options" open={optionsOpen} onToggle={() => setOptionsOpen(v => !v)} />
      {optionsOpen && (
        <div className="px-3 py-2 space-y-2.5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Sierra (mm)</span>
            <input type="number" step="0.1" value={store.globalSierra} onChange={e => store.setGlobalSierra(+e.target.value)}
              className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5 tabular-nums" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Mín. retazo (mm)</span>
            <input type="number" value={store.minOffcut} onChange={e => store.setMinOffcut(+e.target.value)}
              className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5 tabular-nums" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Trim de bordes (mm)
              <span className="ml-1 text-slate-400" title="Franja descartada en cada orilla">ⓘ</span>
            </span>
            <input type="number" min={0} max={50} step={1} value={store.boardTrim}
              onChange={e => store.setBoardTrim(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5 tabular-nums" />
          </div>
        </div>
      )}

      {/* ═══ REMNANTS ════════════════════════════════════════ */}
      <SectionHeader icon={Layers} title="Remnants" open={remnantsOpen} onToggle={() => setRemnantsOpen(v => !v)} />
      {remnantsOpen && (
        <div className="px-3 py-2 space-y-2 border-b border-slate-100">
          <div className="flex gap-1.5">
            <select value={remMat} onChange={e => setRemMat(e.target.value)}
              className="text-xs border border-slate-200 rounded px-1 py-0.5 flex-1">
              {MATERIALS.map(m => <option key={m}>{m}</option>)}
            </select>
            <input value={remGrosor} onChange={e => setRemGrosor(e.target.value)} placeholder="18"
              className="w-12 text-xs text-center border border-slate-200 rounded px-1 py-0.5" title="Grosor" />
          </div>
          <div className="flex gap-1.5">
            <input value={remAncho} onChange={e => setRemAncho(e.target.value)} placeholder="Ancho"
              className="flex-1 text-xs border border-slate-200 rounded px-1.5 py-0.5" />
            <input value={remAlto} onChange={e => setRemAlto(e.target.value)} placeholder="Alto"
              className="flex-1 text-xs border border-slate-200 rounded px-1.5 py-0.5" />
            <button onClick={() => {
              store.addRemnant({
                material: remMat,
                grosor: toMM(parseFloat(remGrosor) || 18, unit),
                ancho: toMM(parseFloat(remAncho) || 0, unit),
                alto: toMM(parseFloat(remAlto) || 0, unit),
              });
            }} className="text-xs text-green-600 hover:text-green-700 font-semibold px-1.5">+</button>
          </div>
          {store.remnants.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              {store.remnants.map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs group">
                  <span className="text-slate-600">{r.material} {parseFloat(fromMM(r.ancho, unit).toFixed(0))}×{parseFloat(fromMM(r.alto, unit).toFixed(0))}</span>
                  <button onClick={() => store.removeRemnant(r.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
