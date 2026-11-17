import { useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Ship, TrendingUp, DollarSign, Filter, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Atracacao, CaixaMov, FaturaIMP, Inspeccao } from '../../types';

interface RelatoriosModuleProps {
  movimentos?: CaixaMov[];
  atracacoes?: Atracacao[];
  faturas?: FaturaIMP[];
  inspecoes?: Inspeccao[];
}

const months = [
  { num: '01', name: 'Janeiro' },
  { num: '02', name: 'Fevereiro' },
  { num: '03', name: 'Março' },
  { num: '04', name: 'Abril' },
  { num: '05', name: 'Maio' },
  { num: '06', name: 'Junho' },
  { num: '07', name: 'Julho' },
  { num: '08', name: 'Agosto' },
  { num: '09', name: 'Setembro' },
  { num: '10', name: 'Outubro' },
  { num: '11', name: 'Novembro' },
  { num: '12', name: 'Dezembro' }
];

const getYear = (date?: string) => (date && /^\d{4}/.test(date) ? date.slice(0, 4) : '');
const getMonth = (date?: string) => (date && /^\d{4}-\d{2}/.test(date) ? date.slice(5, 7) : '');

export function RelatoriosModule({
  movimentos = [],
  atracacoes = [],
  faturas = [],
  inspecoes = []
}: RelatoriosModuleProps) {
  const { theme } = useTheme();
  const { tText } = useLanguage();
  const [reportType, setReportType] = useState<'trafego' | 'financeiro' | 'inspeccoes' | 'fluxo_caixa'>('trafego');
  const [downloading, setDownloading] = useState(false);

  const currentYearStr = new Date().getFullYear().toString();

  const availableFluxoYears = useMemo(() => {
    const years = new Set<string>();
    movimentos.forEach((m) => {
      const y = getYear(m.data);
      if (y) years.add(y);
    });
    years.add(currentYearStr);
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [movimentos, currentYearStr]);

  const [fluxoYear, setFluxoYear] = useState(currentYearStr);

  // Tráfego filters
  const [trafegoYear, setTrafegoYear] = useState(currentYearStr);
  const [trafegoMonth, setTrafegoMonth] = useState('todos');
  const [trafegoPorto, setTrafegoPorto] = useState('todos');
  const [trafegoStatus, setTrafegoStatus] = useState('todos');
  const [trafegoSearch, setTrafegoSearch] = useState('');

  // Financeiro filters
  const [finYear, setFinYear] = useState(currentYearStr);
  const [finMonth, setFinMonth] = useState('todos');
  const [finEstado, setFinEstado] = useState('todos');
  const [finSearch, setFinSearch] = useState('');

  // Inspeções/PSC filters
  const [inspYear, setInspYear] = useState(currentYearStr);
  const [inspMonth, setInspMonth] = useState('todos');
  const [inspTipo, setInspTipo] = useState('todos');
  const [inspResultado, setInspResultado] = useState('todos');
  const [inspSearch, setInspSearch] = useState('');

  const isDark = theme === 'dark';
  const cardBase = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm';
  const inputCls = isDark
    ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500'
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400';

  const fluxoYearMovimentos = useMemo(
    () => movimentos.filter((m) => getYear(m.data) === fluxoYear),
    [movimentos, fluxoYear]
  );

  const monthlyFlowData = useMemo(() => {
    return months.map((m) => {
      const monthMovs = fluxoYearMovimentos.filter((mov) => getMonth(mov.data) === m.num);
      const entradas = monthMovs.filter((mov) => mov.tipo === 'entrada').reduce((acc, mov) => acc + (mov.valor || 0), 0);
      const saidas = monthMovs.filter((mov) => mov.tipo === 'saida').reduce((acc, mov) => acc + (mov.valor || 0), 0);
      return {
        mes: m.name,
        entradas,
        saidas,
        saldoLiquido: entradas - saidas,
        totalMovimentos: monthMovs.length
      };
    });
  }, [fluxoYearMovimentos]);

  const totalEntradasAno = monthlyFlowData.reduce((acc, m) => acc + m.entradas, 0);
  const totalSaidasAno = monthlyFlowData.reduce((acc, m) => acc + m.saidas, 0);
  const saldoFinalAno = totalEntradasAno - totalSaidasAno;

  const trafegoYears = useMemo(() => {
    const s = new Set<string>([currentYearStr, trafegoYear]);
    atracacoes.forEach((a) => {
      const y = getYear(a.dataChegadaPrevista || a.dataAtracacaoEfetiva || a.dataSaidaPrevista);
      if (y) s.add(y);
    });
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [atracacoes, currentYearStr, trafegoYear]);

  const trafegoPortos = useMemo(() => Array.from(new Set(atracacoes.map((a) => a.portoNome).filter(Boolean))).sort(), [atracacoes]);
  const trafegoStatuses = useMemo(() => Array.from(new Set(atracacoes.map((a) => a.status).filter(Boolean))), [atracacoes]);

  const filteredAtracacoes = useMemo(() => {
    const q = trafegoSearch.trim().toLowerCase();
    return atracacoes.filter((a) => {
      const baseDate = a.dataChegadaPrevista || a.dataAtracacaoEfetiva || a.dataSaidaPrevista || '';
      if (trafegoYear !== 'todos' && getYear(baseDate) !== trafegoYear) return false;
      if (trafegoMonth !== 'todos' && getMonth(baseDate) !== trafegoMonth) return false;
      if (trafegoPorto !== 'todos' && a.portoNome !== trafegoPorto) return false;
      if (trafegoStatus !== 'todos' && a.status !== trafegoStatus) return false;
      if (q) {
        const hay = `${a.codigoEscala} ${a.embarcacaoNome} ${a.agenciaNome} ${a.portoNome} ${a.caisDesignado}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [atracacoes, trafegoYear, trafegoMonth, trafegoPorto, trafegoStatus, trafegoSearch]);

  const trafegoStats = useMemo(() => {
    const totalEscalas = filteredAtracacoes.length;
    const carga = filteredAtracacoes.reduce((acc, a) => acc + (a.manifestoCarga?.quantidadeToneladas || 0), 0);
    const teus = filteredAtracacoes.reduce((acc, a) => acc + (a.manifestoCarga?.contentoresTEU || 0), 0);
    return { totalEscalas, carga, teus };
  }, [filteredAtracacoes]);

  const finYears = useMemo(() => {
    const s = new Set<string>([currentYearStr, finYear]);
    faturas.forEach((f) => {
      const y = getYear(f.data) || String(f.ano || '');
      if (y) s.add(y);
    });
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [faturas, currentYearStr, finYear]);

  const finEstados = useMemo(() => Array.from(new Set(faturas.map((f) => f.estado).filter(Boolean))), [faturas]);

  const filteredFaturas = useMemo(() => {
    const q = finSearch.trim().toLowerCase();
    return faturas.filter((f) => {
      const y = getYear(f.data) || String(f.ano || '');
      if (finYear !== 'todos' && y !== finYear) return false;
      if (finMonth !== 'todos' && getMonth(f.data) !== finMonth) return false;
      if (finEstado !== 'todos' && f.estado !== finEstado) return false;
      if (q) {
        const hay = `${f.nFatura} ${f.cliente} ${f.nif} ${f.navio} ${f.tipo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [faturas, finYear, finMonth, finEstado, finSearch]);

  const finStats = useMemo(() => {
    const totalFaturado = filteredFaturas.reduce((acc, f) => acc + (f.total || 0), 0);
    const totalPago = filteredFaturas.reduce((acc, f) => acc + (f.saldo_pago || 0), 0);
    const totalPendente = filteredFaturas.reduce((acc, f) => acc + (f.saldo_pendente ?? Math.max(0, (f.total || 0) - (f.saldo_pago || 0))), 0);
    return { totalFaturado, totalPago, totalPendente, count: filteredFaturas.length };
  }, [filteredFaturas]);

  const inspYears = useMemo(() => {
    const s = new Set<string>([currentYearStr, inspYear]);
    inspecoes.forEach((i) => {
      const y = getYear(i.dataInspeccao);
      if (y) s.add(y);
    });
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  }, [inspecoes, currentYearStr, inspYear]);

  const inspTipos = useMemo(() => Array.from(new Set(inspecoes.map((i) => i.tipoVistoria).filter(Boolean))), [inspecoes]);
  const inspResultados = useMemo(() => Array.from(new Set(inspecoes.map((i) => i.resultado).filter(Boolean))), [inspecoes]);

  const filteredInspecoes = useMemo(() => {
    const q = inspSearch.trim().toLowerCase();
    return inspecoes.filter((i) => {
      if (inspYear !== 'todos' && getYear(i.dataInspeccao) !== inspYear) return false;
      if (inspMonth !== 'todos' && getMonth(i.dataInspeccao) !== inspMonth) return false;
      if (inspTipo !== 'todos' && i.tipoVistoria !== inspTipo) return false;
      if (inspResultado !== 'todos' && i.resultado !== inspResultado) return false;
      if (q) {
        const hay = `${i.codigoInspeccao} ${i.embarcacaoNome} ${i.inspectorNome} ${i.observacoes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inspecoes, inspYear, inspMonth, inspTipo, inspResultado, inspSearch]);

  const inspStats = useMemo(() => {
    const total = filteredInspecoes.length;
    const aprovadas = filteredInspecoes.filter((i) => i.resultado === 'Aprovado').length;
    const recomendacoes = filteredInspecoes.filter((i) => i.resultado === 'Aprovado com Recomendações').length;
    const retidas = filteredInspecoes.filter((i) => i.resultado === 'Retido / Impedido').length;
    return { total, aprovadas, recomendacoes, retidas };
  }, [filteredInspecoes]);

  const selectedFluxoYearLabel = fluxoYear;
  const reportYearLabel = reportType === 'fluxo_caixa' ? fluxoYear : reportType === 'trafego' ? trafegoYear : reportType === 'financeiro' ? finYear : inspYear;

  const downloadCsv = (rows: string[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (format: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      if (format === 'pdf') {
        window.print();
        return;
      }
      if (reportType === 'fluxo_caixa') {
        const rows = [['Mês', 'Entradas (XOF)', 'Saídas (XOF)', 'Saldo Líquido (XOF)', 'Nº Movimentos']];
        monthlyFlowData.forEach((r) => rows.push([`${r.mes} ${fluxoYear}`, String(r.entradas), String(r.saidas), String(r.saldoLiquido), String(r.totalMovimentos)]));
        downloadCsv(rows, `fluxo_de_caixa_mensal_${fluxoYear}.csv`);
        return;
      }
      if (reportType === 'trafego') {
        const rows = [['Código Escala', 'Embarcação', 'Agência', 'Porto', 'Cais', 'ETA', 'ETD', 'Status', 'Toneladas', 'TEUs']];
        filteredAtracacoes.forEach((a) => rows.push([a.codigoEscala, a.embarcacaoNome, a.agenciaNome, a.portoNome, a.caisDesignado, a.dataChegadaPrevista, a.dataSaidaPrevista, a.status, String(a.manifestoCarga?.quantidadeToneladas || 0), String(a.manifestoCarga?.contentoresTEU || 0)]));
        downloadCsv(rows, `trafego_navios_${trafegoYear}.csv`);
        return;
      }
      if (reportType === 'financeiro') {
        const rows = [['Nº Fatura', 'Data', 'Cliente', 'NIF', 'Navio', 'Tipo', 'Estado', 'Total', 'Pago', 'Pendente']];
        filteredFaturas.forEach((f) => rows.push([f.nFatura, f.data, f.cliente, f.nif, f.navio, f.tipo, f.estado, String(f.total || 0), String(f.saldo_pago || 0), String(f.saldo_pendente ?? Math.max(0, (f.total || 0) - (f.saldo_pago || 0)))]));
        downloadCsv(rows, `balancete_financeiro_${finYear}.csv`);
        return;
      }
      const rows = [['Código', 'Embarcação', 'Data', 'Inspetor', 'Tipo Vistoria', 'Resultado', 'Validade (meses)', 'Observações']];
      filteredInspecoes.forEach((i) => rows.push([i.codigoInspeccao, i.embarcacaoNome, i.dataInspeccao, i.inspectorNome, i.tipoVistoria, i.resultado, String(i.validadeMeses), i.observacoes || '']));
      downloadCsv(rows, `auditoria_seguranca_psc_${inspYear}.csv`);
    }, 400);
  };

  return (
    <div id="relatorios-module" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <BarChart3 className="w-5 h-5 text-blue-500" />
            {tText('Relatórios Marítimos, Estatísticas & Execução Financeira')}
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {tText('Geração de mapas oficiais de tráfego de navios, arrecadação de taxas e fluxo de caixa para o Ministério dos Transportes')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { id: 'trafego', icon: Ship, color: 'text-blue-500', title: 'Tráfego de Navios', sub: 'Escalas nos portos e TEUs' },
          { id: 'financeiro', icon: TrendingUp, color: 'text-emerald-500', title: 'Arrecadação de Receitas', sub: 'Taxas portuárias e licenças' },
          { id: 'fluxo_caixa', icon: DollarSign, color: 'text-amber-500', title: 'Fluxo de Caixa Mensal', sub: `Entradas, saídas e saldo (${selectedFluxoYearLabel})` },
          { id: 'inspeccoes', icon: BarChart3, color: 'text-purple-500', title: 'Segurança & PSC', sub: 'Vistorias e conformidade MARPOL' }
        ] as const).map((item) => {
          const Icon = item.icon;
          const active = reportType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setReportType(item.id)}
              className={`p-5 rounded-2xl text-left border transition-all ${
                active
                  ? isDark
                    ? 'bg-blue-600/20 text-white border-blue-500/50 shadow-lg shadow-blue-600/10'
                    : 'bg-blue-50/90 text-blue-900 border-blue-400 shadow-sm font-semibold'
                  : isDark
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 shadow-sm'
              }`}
            >
              <Icon className={`w-6 h-6 ${item.color} mb-2`} />
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.sub}</p>
            </button>
          );
        })}
      </div>

      <div className={`p-6 rounded-2xl border space-y-6 ${cardBase}`}>
        <div className={`flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {reportType === 'trafego' && `Relatório Detalhado de Tráfego Marítimo (${trafegoYear})`}
              {reportType === 'financeiro' && `Balancete Financeiro & Arrecadação de Taxas IMP (${finYear})`}
              {reportType === 'fluxo_caixa' && `Fluxo de Caixa Mensal Consolidado — Ano Fiscal ${fluxoYear}`}
              {reportType === 'inspeccoes' && `Relatório de Auditoria de Segurança & Vistorias PSC (${inspYear})`}
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Período de Análise: {reportYearLabel === 'todos' ? 'Todos os anos disponíveis' : `Ano ${reportYearLabel}`} • Filtro aplicado conforme seleção abaixo
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => handleDownload('pdf')} disabled={downloading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-60">
              <Download className="w-4 h-4" /> {tText('Exportar PDF')}
            </button>
            <button onClick={() => handleDownload('csv')} disabled={downloading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-60">
              <FileSpreadsheet className="w-4 h-4" /> {tText('Exportar CSV')}
            </button>
          </div>
        </div>

        {reportType === 'fluxo_caixa' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Anos disponíveis (histórico)</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableFluxoYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setFluxoYear(y)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      fluxoYear === y
                        ? 'bg-amber-500/20 text-amber-600 border-amber-500/40'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Selecione um ano para visualizar o fluxo de caixa mensal consolidado (inclui anos anteriores registados no sistema).
              </p>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <div><span className="block text-[10px] text-slate-500">TOTAL ENTRADAS ({fluxoYear}):</span><span className="font-bold text-sm text-emerald-500">{totalEntradasAno.toLocaleString('pt-PT')} XOF</span></div>
              <div><span className="block text-[10px] text-slate-500">TOTAL SAÍDAS ({fluxoYear}):</span><span className="font-bold text-sm text-rose-500">{totalSaidasAno.toLocaleString('pt-PT')} XOF</span></div>
              <div><span className="block text-[10px] text-slate-500">SALDO LÍQUIDO ACUMULADO:</span><span className={`font-bold text-sm ${saldoFinalAno >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>{saldoFinalAno.toLocaleString('pt-PT')} XOF</span></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-4">MÊS</th>
                    <th className="py-3 px-4 text-right">ENTRADAS (XOF)</th>
                    <th className="py-3 px-4 text-right">SAÍDAS (XOF)</th>
                    <th className="py-3 px-4 text-right">SALDO LÍQUIDO (XOF)</th>
                    <th className="py-3 px-4 text-center">Nº MOVIMENTOS</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {monthlyFlowData.map((row) => (
                    <tr key={row.mes} className={`hover:bg-blue-500/5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <td className="py-3 px-4 font-bold">{row.mes} {fluxoYear}</td>
                      <td className="py-3 px-4 text-right text-emerald-500 font-semibold">+{row.entradas.toLocaleString('pt-PT')}</td>
                      <td className="py-3 px-4 text-right text-rose-500 font-semibold">-{row.saidas.toLocaleString('pt-PT')}</td>
                      <td className={`py-3 px-4 text-right font-bold ${row.saldoLiquido >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>{row.saldoLiquido.toLocaleString('pt-PT')}</td>
                      <td className="py-3 px-4 text-center">{row.totalMovimentos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'trafego' && (
          <div className="space-y-5">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-blue-500" /><span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Filtros — Tráfego de Navios</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <select value={trafegoYear} onChange={(e) => setTrafegoYear(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os anos</option>
                  {trafegoYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={trafegoMonth} onChange={(e) => setTrafegoMonth(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os meses</option>
                  {months.map((m) => <option key={m.num} value={m.num}>{m.name}</option>)}
                </select>
                <select value={trafegoPorto} onChange={(e) => setTrafegoPorto(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os portos</option>
                  {trafegoPortos.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={trafegoStatus} onChange={(e) => setTrafegoStatus(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os estados</option>
                  {trafegoStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={trafegoSearch} onChange={(e) => setTrafegoSearch(e.target.value)} placeholder="Pesquisar escala, navio, agência..." className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`} />
              </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <div><span className="block text-[10px] text-slate-500">TOTAL ESCALAS:</span><span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{trafegoStats.totalEscalas}</span></div>
              <div><span className="block text-[10px] text-slate-500">CARGA MOVIMENTADA:</span><span className="text-emerald-500 font-bold text-sm">{trafegoStats.carga.toLocaleString('pt-PT')} Ton</span></div>
              <div><span className="block text-[10px] text-slate-500">TOTAL TEUs:</span><span className="text-blue-500 font-bold text-sm">{trafegoStats.teus.toLocaleString('pt-PT')}</span></div>
              <div><span className="block text-[10px] text-slate-500">REGISTOS FILTRADOS:</span><span className="text-amber-500 font-bold text-sm">{filteredAtracacoes.length}</span></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-3">ESCALA</th><th className="py-3 px-3">EMBARCAÇÃO</th><th className="py-3 px-3">AGÊNCIA</th><th className="py-3 px-3">PORTO / CAIS</th><th className="py-3 px-3">ETA</th><th className="py-3 px-3">STATUS</th><th className="py-3 px-3 text-right">TON</th><th className="py-3 px-3 text-right">TEUs</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredAtracacoes.map((a) => (
                    <tr key={a.id} className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      <td className="py-2.5 px-3 font-bold">{a.codigoEscala}</td>
                      <td className="py-2.5 px-3">{a.embarcacaoNome}</td>
                      <td className="py-2.5 px-3">{a.agenciaNome}</td>
                      <td className="py-2.5 px-3">{a.portoNome} / {a.caisDesignado}</td>
                      <td className="py-2.5 px-3">{a.dataChegadaPrevista}</td>
                      <td className="py-2.5 px-3">{a.status}</td>
                      <td className="py-2.5 px-3 text-right">{(a.manifestoCarga?.quantidadeToneladas || 0).toLocaleString('pt-PT')}</td>
                      <td className="py-2.5 px-3 text-right">{(a.manifestoCarga?.contentoresTEU || 0).toLocaleString('pt-PT')}</td>
                    </tr>
                  ))}
                  {filteredAtracacoes.length === 0 && (
                    <tr><td colSpan={8} className={`py-6 px-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Sem registos para os filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'financeiro' && (
          <div className="space-y-5">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-emerald-500" /><span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Filtros — Balancete Financeiro & Arrecadação</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select value={finYear} onChange={(e) => setFinYear(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os anos</option>
                  {finYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={finMonth} onChange={(e) => setFinMonth(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os meses</option>
                  {months.map((m) => <option key={m.num} value={m.num}>{m.name}</option>)}
                </select>
                <select value={finEstado} onChange={(e) => setFinEstado(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os estados</option>
                  {finEstados.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={finSearch} onChange={(e) => setFinSearch(e.target.value)} placeholder="Pesquisar fatura, cliente, NIF, navio..." className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`} />
              </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <div><span className="block text-[10px] text-slate-500">FATURAS:</span><span className="font-bold text-sm">{finStats.count}</span></div>
              <div><span className="block text-[10px] text-slate-500">TOTAL FATURADO:</span><span className="text-blue-500 font-bold text-sm">{finStats.totalFaturado.toLocaleString('pt-PT')} XOF</span></div>
              <div><span className="block text-[10px] text-slate-500">TOTAL ARRECADADO:</span><span className="text-emerald-500 font-bold text-sm">{finStats.totalPago.toLocaleString('pt-PT')} XOF</span></div>
              <div><span className="block text-[10px] text-slate-500">SALDO PENDENTE:</span><span className="text-amber-500 font-bold text-sm">{finStats.totalPendente.toLocaleString('pt-PT')} XOF</span></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-3">FATURA</th><th className="py-3 px-3">DATA</th><th className="py-3 px-3">CLIENTE</th><th className="py-3 px-3">NAVIO</th><th className="py-3 px-3">ESTADO</th><th className="py-3 px-3 text-right">TOTAL</th><th className="py-3 px-3 text-right">PAGO</th><th className="py-3 px-3 text-right">PENDENTE</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredFaturas.map((f) => {
                    const pago = f.saldo_pago || 0;
                    const pend = f.saldo_pendente ?? Math.max(0, (f.total || 0) - pago);
                    return (
                      <tr key={f.id} className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        <td className="py-2.5 px-3 font-bold">{f.nFatura}</td>
                        <td className="py-2.5 px-3">{f.data}</td>
                        <td className="py-2.5 px-3">{f.cliente}</td>
                        <td className="py-2.5 px-3">{f.navio}</td>
                        <td className="py-2.5 px-3">{f.estado}</td>
                        <td className="py-2.5 px-3 text-right">{(f.total || 0).toLocaleString('pt-PT')}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-500">{pago.toLocaleString('pt-PT')}</td>
                        <td className="py-2.5 px-3 text-right text-amber-500">{pend.toLocaleString('pt-PT')}</td>
                      </tr>
                    );
                  })}
                  {filteredFaturas.length === 0 && (
                    <tr><td colSpan={8} className={`py-6 px-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Sem registos para os filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'inspeccoes' && (
          <div className="space-y-5">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4 text-purple-500" /><span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Filtros — Auditoria de Segurança & Vistorias PSC</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <select value={inspYear} onChange={(e) => setInspYear(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os anos</option>
                  {inspYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={inspMonth} onChange={(e) => setInspMonth(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os meses</option>
                  {months.map((m) => <option key={m.num} value={m.num}>{m.name}</option>)}
                </select>
                <select value={inspTipo} onChange={(e) => setInspTipo(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os tipos</option>
                  {inspTipos.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={inspResultado} onChange={(e) => setInspResultado(e.target.value)} className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`}>
                  <option value="todos">Todos os resultados</option>
                  {inspResultados.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input value={inspSearch} onChange={(e) => setInspSearch(e.target.value)} placeholder="Pesquisar código, navio, inspetor..." className={`px-3 py-2 rounded-lg border text-xs ${inputCls}`} />
              </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <div><span className="block text-[10px] text-slate-500">TOTAL VISTORIAS:</span><span className="font-bold text-sm">{inspStats.total}</span></div>
              <div><span className="block text-[10px] text-slate-500">APROVADAS:</span><span className="text-emerald-500 font-bold text-sm">{inspStats.aprovadas}</span></div>
              <div><span className="block text-[10px] text-slate-500">COM RECOMENDAÇÕES:</span><span className="text-amber-500 font-bold text-sm">{inspStats.recomendacoes}</span></div>
              <div><span className="block text-[10px] text-slate-500">RETIDAS / IMPEDIDAS:</span><span className="text-rose-500 font-bold text-sm">{inspStats.retidas}</span></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-3">CÓDIGO</th><th className="py-3 px-3">EMBARCAÇÃO</th><th className="py-3 px-3">DATA</th><th className="py-3 px-3">INSPETOR</th><th className="py-3 px-3">TIPO</th><th className="py-3 px-3">RESULTADO</th><th className="py-3 px-3">OBSERVAÇÕES</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredInspecoes.map((i) => (
                    <tr key={i.id} className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      <td className="py-2.5 px-3 font-bold">{i.codigoInspeccao}</td>
                      <td className="py-2.5 px-3">{i.embarcacaoNome}</td>
                      <td className="py-2.5 px-3">{i.dataInspeccao}</td>
                      <td className="py-2.5 px-3">{i.inspectorNome}</td>
                      <td className="py-2.5 px-3">{i.tipoVistoria}</td>
                      <td className="py-2.5 px-3">{i.resultado}</td>
                      <td className="py-2.5 px-3">{i.observacoes || '-'}</td>
                    </tr>
                  ))}
                  {filteredInspecoes.length === 0 && (
                    <tr><td colSpan={7} className={`py-6 px-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Sem registos para os filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
