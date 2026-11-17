import { useState, useMemo } from 'react';
import {
  X,
  Search,
  Printer,
  FileText,
  Receipt,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { FaturaIMP, ReciboIMP, IMP_INSTITUTIONAL } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface HistoricoContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteNome: string;
  clienteNif?: string;
  faturas: FaturaIMP[];
  recibos: ReciboIMP[];
}

interface MovimentoConta {
  id: string;
  data: string;
  tipoDoc: 'FATURA' | 'RECIBO';
  codigoDoc: string;
  navio: string;
  descricao: string;
  debito: number; // Montante faturado (+)
  credito: number; // Montante pago (-)
  saldoRestanteDoc?: number;
  estado: string;
}

export function HistoricoContaModal({
  isOpen,
  onClose,
  clienteNome,
  clienteNif,
  faturas,
  recibos
}: HistoricoContaModalProps) {
  const { theme } = useTheme();
  const { tText, language } = useLanguage();
  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'pt-PT';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'faturas' | 'recibos'>('todos');

  // Filter and build combined chronological ledger for this client
  const { movimentos, totalFacturado, totalPago, saldoDevedor } = useMemo(() => {
    const termLower = clienteNome.toLowerCase().trim();

    // Match invoices for this client
    const clientFaturas = faturas.filter((f) => {
      const c = (f.cliente || '').toLowerCase();
      return c.includes(termLower) || termLower.includes(c);
    });

    // Match receipts for this client
    const clientRecibos = recibos.filter((r) => {
      const c = (r.cliente || '').toLowerCase();
      return c.includes(termLower) || termLower.includes(c);
    });

    // Map into standard MovimentoConta items
    const listFat: MovimentoConta[] = clientFaturas.map((f) => ({
      id: f.id,
      data: f.data,
      tipoDoc: 'FATURA',
      codigoDoc: f.nFatura,
      navio: f.navio || 'N/D',
      descricao: f.itens && f.itens.length > 0 ? f.itens[0].descricao : tText('Emissão de Fatura Portuária'),
      debito: f.estado === 'anulada' ? 0 : f.total,
      credito: 0,
      saldoRestanteDoc: f.saldo_pendente,
      estado: f.estado
    }));

    const listRec: MovimentoConta[] = clientRecibos.map((r) => ({
      id: r.id,
      data: r.data,
      tipoDoc: 'RECIBO',
      codigoDoc: r.nRecibo,
      navio: r.navio || 'N/D',
      descricao: `${tText('Liquidação / Amortização de')} ${r.nFatura} (${r.banco} • ${tText('Talão')} #${r.talao})`,
      debito: 0,
      credito: r.valor,
      saldoRestanteDoc: r.saldoRestante,
      estado: r.isLiquidacaoTotal ? 'total' : 'parcial'
    }));

    // Combine and sort by date descending
    const combined = [...listFat, ...listRec].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    // Calculate overall totals
    const totalFacturedSum = clientFaturas
      .filter((f) => f.estado !== 'anulada')
      .reduce((sum, f) => sum + f.total, 0);

    const totalPaidSum = clientRecibos.reduce((sum, r) => sum + r.valor, 0);

    const outstandingSum = Math.max(0, totalFacturedSum - totalPaidSum);

    return {
      movimentos: combined,
      totalFacturado: totalFacturedSum,
      totalPago: totalPaidSum,
      saldoDevedor: outstandingSum
    };
  }, [clienteNome, faturas, recibos]);

  // Apply search and tab filters
  const filteredMovimentos = useMemo(() => {
    return movimentos.filter((m) => {
      if (filterTipo === 'faturas' && m.tipoDoc !== 'FATURA') return false;
      if (filterTipo === 'recibos' && m.tipoDoc !== 'RECIBO') return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          m.codigoDoc.toLowerCase().includes(term) ||
          m.navio.toLowerCase().includes(term) ||
          m.descricao.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [movimentos, filterTipo, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {tText('Histórico de Conta Corrente')}
                </span>
                {clienteNif && (
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {tText('NIF')}: {clienteNif}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                {clienteNome}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{tText('Imprimir Extrato')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* KPI Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Facturado (Débitos) */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{tText('Total Facturado (Débitos)')}</span>
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-mono">
                {totalFacturado.toLocaleString(locale)} <span className="text-xs font-normal">XOF</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">{tText('Faturas oficiais homologadas')}</span>
            </div>

            {/* Total Pago (Créditos) */}
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{tText('Total Pago (Créditos)')}</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                {totalPago.toLocaleString(locale)} <span className="text-xs font-normal">XOF</span>
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">{tText('Recibos de caixa emitidos')}</span>
            </div>

            {/* Saldo Devedor Restante */}
            <div className={`p-4 rounded-2xl border ${
              saldoDevedor > 0
                ? theme === 'dark' ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-200'
                : theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={saldoDevedor > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {tText('Saldo Devedor Actual')}
                </span>
                {saldoDevedor > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <p className={`text-xl sm:text-2xl font-black mt-2 font-mono ${
                saldoDevedor > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {saldoDevedor.toLocaleString(locale)} <span className="text-xs font-normal">XOF</span>
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                {saldoDevedor > 0 ? tText('Valor pendente de cobrança') : tText('Conta totalmente regularizada')}
              </span>
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterTipo('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTipo === 'todos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tText('Todos os Movimentos')} ({movimentos.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTipo('faturas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTipo === 'faturas'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tText('Faturas (Débitos)')}
              </button>
              <button
                type="button"
                onClick={() => setFilterTipo('recibos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterTipo === 'recibos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tText('Recibos (Créditos)')}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={tText('Pesquisar por nº doc ou navio...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Movimentos Ledger Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`font-mono text-[11px] uppercase tracking-wider border-b ${
                  theme === 'dark' ? 'bg-slate-800/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="py-3 px-4 font-bold">{tText('Data')}</th>
                    <th className="py-3 px-4 font-bold">{tText('Documento')}</th>
                    <th className="py-3 px-4 font-bold">{tText('Navio / Descrição')}</th>
                    <th className="py-3 px-4 font-bold text-right text-blue-600 dark:text-blue-400">{tText('Débito (+)')}</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">{tText('Crédito (-)')}</th>
                    <th className="py-3 px-4 font-bold text-right">{tText('Saldo Pendente')}</th>
                    <th className="py-3 px-4 font-bold text-center">{tText('Estado')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredMovimentos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {tText('Nenhum documento encontrado no histórico de conta deste cliente.')}
                      </td>
                    </tr>
                  ) : (
                    filteredMovimentos.map((m) => {
                      const isFat = m.tipoDoc === 'FATURA';

                      return (
                        <tr
                          key={`${m.tipoDoc}-${m.id}`}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            m.estado === 'anulada' ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {m.data}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 font-mono font-bold px-2 py-0.5 rounded-lg ${
                              isFat
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                              {isFat ? <FileText className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                              {m.codigoDoc}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{m.navio}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.descricao}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {m.debito > 0 ? `+ ${m.debito.toLocaleString(locale)} XOF` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {m.credito > 0 ? `- ${m.credito.toLocaleString(locale)} XOF` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                            {m.saldoRestanteDoc !== undefined
                              ? `${m.saldoRestanteDoc.toLocaleString(locale)} XOF`
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              m.estado === 'paga' || m.estado === 'total'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : m.estado === 'parcial'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : m.estado === 'confirmada'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : m.estado === 'anulada'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {tText(
                                m.estado === 'paga' ? 'Totalmente Paga' :
                                m.estado === 'parcial' ? 'Amortização Parcial' :
                                m.estado === 'confirmada' ? 'Confirmada' :
                                m.estado === 'anulada' ? 'Anulada' :
                                m.estado === 'total' ? 'Liquidado Totalmente' :
                                m.estado === 'rascunho' ? 'Rascunho' :
                                m.estado
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>{tText('Extrato Oficial emitido pelo Instituto Marítimo Portuário (IMP)')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {tText('Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}
