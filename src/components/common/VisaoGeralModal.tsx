import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  FaturaIMP,
  ReciboIMP,
  CaixaMov,
  Utilizador,
  IMP_INSTITUTIONAL
} from '../../types';
import {
  X,
  Search,
  Receipt,
  Wallet,
  FileText,
  Ship,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Filter,
  Eye,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';

interface VisaoGeralModalProps {
  faturas: FaturaIMP[];
  recibos: ReciboIMP[];
  movimentos: CaixaMov[];
  currentUser?: Utilizador;
  onClose: () => void;
  onViewFatura?: (fat: FaturaIMP) => void;
  onViewRecibo?: (rec: ReciboIMP) => void;
}

type PeriodoFiltro = 'dia' | 'ontem' | 'semana' | 'semana_passada' | 'mes' | 'mes_passado' | 'ano' | 'custom' | 'todos';

export function VisaoGeralModal({
  faturas,
  recibos,
  movimentos,
  currentUser,
  onClose,
  onViewFatura,
  onViewRecibo
}: VisaoGeralModalProps) {
  const { tText } = useLanguage();
  // Determine user role and segregation of duties
  const role = (currentUser?.role || currentUser?.funcao || '').toLowerCase();
  const userCargo = (currentUser?.cargo || '').toLowerCase();
  const userName = currentUser?.nome || '';
  const userEmail = currentUser?.email || '';

  const isAdminOrDG =
    role === 'admin' ||
    role === 'superadmin' ||
    userCargo.includes('pca') ||
    userCargo.includes('diret') ||
    userCargo.includes('presidente') ||
    userCargo.includes('engenheiro');

  const isFaturacao = !isAdminOrDG && (role === 'faturacao' || userCargo.includes('fatura'));
  const isCaixa = !isAdminOrDG && (role === 'caixa' || userCargo.includes('caixa') || userCargo.includes('tesouraria'));

  // Filter States
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFaturaFilter, setStatusFaturaFilter] = useState<string>('todos');
  const [operatorFilter, setOperatorFilter] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'todos' | 'faturas' | 'recibos' | 'caixa'>('todos');
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');

  // Update real-time clock indicator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTimestamp(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper date filtering function based on computer system clock (new Date())
  const matchesPeriodo = (dateStr: string) => {
    if (!dateStr || periodo === 'todos') return true;
    const cleanDate = dateStr.trim().split(' ')[0]; // YYYY-MM-DD

    const parts = cleanDate.split('-');
    if (parts.length < 3) return true;
    const rYear = parseInt(parts[0], 10);
    const rMonth = parseInt(parts[1], 10);
    const rDay = parseInt(parts[2], 10);
    if (isNaN(rYear) || isNaN(rMonth) || isNaN(rDay)) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recordDate = new Date(rYear, rMonth - 1, rDay);

    const diffDays = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

    if (periodo === 'dia') {
      // Exactly today based on computer date
      return diffDays === 0;
    }

    if (periodo === 'ontem') {
      // Exactly 1 day ago
      return diffDays === 1;
    }

    if (periodo === 'semana') {
      // Current week (from Monday up to today)
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...
      const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return diffDays >= 0 && diffDays <= mondayDiff;
    }

    if (periodo === 'semana_passada') {
      // Last week (Monday of last week to Sunday of last week)
      const dayOfWeek = today.getDay();
      const mondayDiff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startLastWeek = mondayDiff + 7;
      const endLastWeek = mondayDiff + 1;
      return diffDays >= endLastWeek && diffDays <= startLastWeek;
    }

    if (periodo === 'mes') {
      // Same month & same year as computer clock
      return recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth();
    }

    if (periodo === 'mes_passado') {
      // Previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return recordDate.getFullYear() === prevMonth.getFullYear() && recordDate.getMonth() === prevMonth.getMonth();
    }

    if (periodo === 'ano') {
      // Current year
      return recordDate.getFullYear() === today.getFullYear();
    }

    if (periodo === 'custom') {
      // User picked exact date
      return cleanDate === customDate;
    }

    return true;
  };

  // Helper operator matcher
  const isCreatedByCurrentUser = (author?: string) => {
    if (!author) return false;
    const authLower = author.toLowerCase();
    const nameLower = userName.toLowerCase();
    const emailLower = userEmail.toLowerCase();
    return (
      (nameLower && authLower.includes(nameLower)) ||
      (emailLower && authLower.includes(emailLower)) ||
      authLower.includes('okica') ||
      authLower.includes('fatura')
    );
  };

  const isEmittedByCurrentCaixa = (author?: string) => {
    if (!author) return false;
    const authLower = author.toLowerCase();
    const nameLower = userName.toLowerCase();
    const emailLower = userEmail.toLowerCase();
    return (
      (nameLower && authLower.includes(nameLower)) ||
      (emailLower && authLower.includes(emailLower)) ||
      authLower.includes('álvaro') ||
      authLower.includes('alvaro') ||
      authLower.includes('caixa') ||
      authLower.includes('tesouraria')
    );
  };

  // 1. Filtered Invoices (Faturas)
  const scopedFaturas = useMemo(() => {
    if (isCaixa) return []; // Caixa operator has no access to faturas view (strict SoD)

    return faturas.filter((fat) => {
      // Operator filter: if user is Faturação profile, ONLY see his own
      if (isFaturacao) {
        const matchesUser =
          isCreatedByCurrentUser(fat.criado_por) ||
          (fat.criado_por && fat.criado_por.includes('Okica')) ||
          (fat.criado_por && fat.criado_por.includes('Faturação'));
        if (!matchesUser && !isAdminOrDG) return false;
      } else if (isAdminOrDG && operatorFilter !== 'todos') {
        const author = (fat.criado_por || '').toLowerCase();
        if (operatorFilter === 'Álvaro') {
          // If Álvaro is selected: show invoices settled/collected by Álvaro
          const hasAlvaroReceipt = recibos.some(
            (r) =>
              (r.nFatura === fat.nFatura || fat.recibos?.includes(r.id)) &&
              ((r.emissor || '').toLowerCase().includes('álvaro') || (r.emissor || '').toLowerCase().includes('alvaro'))
          );
          if (!hasAlvaroReceipt && fat.estado !== 'paga' && fat.estado !== 'parcial') return false;
        } else if (operatorFilter === 'SuperAdministrador') {
          // Superadmin supervises all invoices in the system
          // Allow all invoices during superadmin selection
        } else if (!author.includes(operatorFilter.toLowerCase())) {
          return false;
        }
      }

      // Period filter
      if (!matchesPeriodo(fat.data)) return false;

      // Status filter
      if (statusFaturaFilter !== 'todos' && fat.estado !== statusFaturaFilter) return false;

      return true;
    });
  }, [faturas, recibos, isCaixa, isFaturacao, isAdminOrDG, periodo, statusFaturaFilter, operatorFilter, userName, userEmail]);

  // 2. Filtered Receipts (Recibos)
  const scopedRecibos = useMemo(() => {
    if (isFaturacao) return []; // Faturação operator cannot see Caixa/Recibos (strict SoD)

    return recibos.filter((rec) => {
      // Operator filter: if user is Caixa profile, ONLY see his own
      if (isCaixa) {
        const matchesUser =
          isEmittedByCurrentCaixa(rec.emissor) ||
          (rec.emissor && rec.emissor.includes('Álvaro')) ||
          (rec.emissor && rec.emissor.includes('Caixa'));
        if (!matchesUser && !isAdminOrDG) return false;
      } else if (isAdminOrDG && operatorFilter !== 'todos') {
        const author = (rec.emissor || '').toLowerCase();
        if (operatorFilter === 'Okica') {
          // Okica is billing: show receipts generated for his invoices
          const relatedFat = faturas.find((f) => f.nFatura === rec.nFatura);
          if (!relatedFat || !(relatedFat.criado_por || '').toLowerCase().includes('okica')) return false;
        } else if (operatorFilter === 'Álvaro') {
          if (!author.includes('álvaro') && !author.includes('alvaro') && !author.includes('caixa')) return false;
        } else if (operatorFilter === 'SuperAdministrador') {
          // SuperAdmin oversees all receipts
          return true;
        } else if (!author.includes(operatorFilter.toLowerCase())) {
          return false;
        }
      }

      // Period filter
      return matchesPeriodo(rec.data);
    });
  }, [recibos, faturas, isFaturacao, isCaixa, isAdminOrDG, periodo, operatorFilter, userName, userEmail]);

  // 3. Filtered Cash Movements (Movimentos de Caixa: Entradas & Saídas da Tesouraria)
  const scopedMovimentos = useMemo(() => {
    if (isFaturacao) return []; // Faturação operator cannot see Caixa movements

    return movimentos.filter((mov) => {
      if (isCaixa) {
        const matchesUser =
          isEmittedByCurrentCaixa(mov.criado_por) ||
          (mov.criado_por && mov.criado_por.includes('Álvaro')) ||
          (mov.criado_por && mov.criado_por.includes('Tesouraria'));
        if (!matchesUser && !isAdminOrDG) return false;
      } else if (isAdminOrDG && operatorFilter !== 'todos') {
        const author = (mov.criado_por || '').toLowerCase();
        const authorized = (mov.autorizado_por || '').toLowerCase();
        if (operatorFilter === 'Okica') {
          // Okica is billing: does not operate treasury exits or entries
          return false;
        } else if (operatorFilter === 'Álvaro') {
          // Alvaro executed these movements (both entradas and saídas)
          if (!author.includes('álvaro') && !author.includes('alvaro') && !author.includes('caixa') && !author.includes('tesouraria')) return false;
        } else if (operatorFilter === 'SuperAdministrador') {
          // Superadmin authorized the exits or supervised operations
          if (!author.includes('super') && !authorized.includes('super')) return false;
        } else if (!author.includes(operatorFilter.toLowerCase()) && !authorized.includes(operatorFilter.toLowerCase())) {
          return false;
        }
      }

      return matchesPeriodo(mov.data);
    });
  }, [movimentos, isFaturacao, isCaixa, isAdminOrDG, periodo, operatorFilter, userName, userEmail]);

  // Faturação-specific status breakdown
  const faturasBreakdown = useMemo(() => {
    const totalCount = scopedFaturas.length;
    const rascunhos = scopedFaturas.filter((f) => f.estado === 'rascunho');
    const confirmadas = scopedFaturas.filter((f) => f.estado === 'confirmada');
    const parciais = scopedFaturas.filter((f) => f.estado === 'parcial');
    const pagas = scopedFaturas.filter((f) => f.estado === 'paga');
    const anuladas = scopedFaturas.filter((f) => f.estado === 'anulada');

    const totalValor = scopedFaturas
      .filter((f) => f.estado !== 'anulada')
      .reduce((sum, f) => sum + (f.total || 0), 0);

    const valorPago = scopedFaturas
      .filter((f) => f.estado !== 'anulada')
      .reduce((sum, f) => sum + (f.saldo_pago || 0), 0);

    const valorPendente = scopedFaturas
      .filter((f) => f.estado !== 'anulada')
      .reduce((sum, f) => sum + (f.saldo_pendente || f.total || 0), 0);

    return {
      totalCount,
      totalValor,
      valorPago,
      valorPendente,
      rascunhosCount: rascunhos.length,
      rascunhosValor: rascunhos.reduce((s, f) => s + f.total, 0),
      confirmadasCount: confirmadas.length,
      confirmadasValor: confirmadas.reduce((s, f) => s + f.total, 0),
      parciaisCount: parciais.length,
      parciaisValor: parciais.reduce((s, f) => s + f.total, 0),
      pagasCount: pagas.length,
      pagasValor: pagas.reduce((s, f) => s + f.total, 0),
      anuladasCount: anuladas.length,
      anuladasValor: anuladas.reduce((s, f) => s + f.total, 0)
    };
  }, [scopedFaturas]);

  // Caixa-specific breakdown
  const caixaBreakdown = useMemo(() => {
    const totalRecibosCount = scopedRecibos.length;
    const totalRecibosValor = scopedRecibos.reduce((sum, r) => sum + (r.valor || 0), 0);

    const totalEntradas = scopedMovimentos
      .filter((m) => m.tipo === 'entrada')
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    const totalSaidas = scopedMovimentos
      .filter((m) => m.tipo === 'saida')
      .reduce((sum, m) => sum + (m.valor || 0), 0);

    const saldoSessao = totalEntradas - totalSaidas;

    return {
      totalRecibosCount,
      totalRecibosValor,
      totalEntradas,
      totalSaidas,
      saldoSessao
    };
  }, [scopedRecibos, scopedMovimentos]);

  // Unified unified items list for table presentation
  const unifiedTableList = useMemo(() => {
    const items: Array<{
      id: string;
      rawDate: string;
      dataFormatted: string;
      tipoModulo: 'fatura' | 'recibo' | 'caixa';
      codigo: string;
      descricao: string;
      cliente: string;
      vessel?: string;
      categoria: string;
      valorEntrada: number;
      valorSaida: number;
      estadoOuBanco: string;
      operador: string;
      originalRef: FaturaIMP | ReciboIMP | CaixaMov;
    }> = [];

    // 1. Add Invoices (if user permitted)
    if (!isCaixa) {
      scopedFaturas.forEach((f) => {
        items.push({
          id: `FAT-${f.id}`,
          rawDate: f.data,
          dataFormatted: f.data,
          tipoModulo: 'fatura',
          codigo: f.nFatura,
          descricao: `Fatura Portuária • GT ${f.gross_tonnage || 0}`,
          cliente: f.cliente,
          vessel: f.navio,
          categoria: 'Faturação',
          valorEntrada: f.total,
          valorSaida: 0,
          estadoOuBanco: f.estado,
          operador: f.criado_por || 'Operador Faturação',
          originalRef: f
        });
      });
    }

    // 2. Add Receipts (if user permitted)
    if (!isFaturacao) {
      scopedRecibos.forEach((r) => {
        items.push({
          id: `REC-${r.id}`,
          rawDate: r.data,
          dataFormatted: `${r.data} ${r.hora || ''}`,
          tipoModulo: 'recibo',
          codigo: r.nRecibo,
          descricao: `Recibo de Quitação • Fat: ${r.nFatura}`,
          cliente: r.cliente,
          vessel: r.navio,
          categoria: 'Recibo Caixa',
          valorEntrada: r.valor,
          valorSaida: 0,
          estadoOuBanco: `${r.banco} (${r.talao || ''})`,
          operador: r.emissor || 'Operador Caixa',
          originalRef: r
        });
      });
    }

    // 3. Add Movements (if user permitted)
    if (!isFaturacao) {
      scopedMovimentos.forEach((m) => {
        if (!m.descricao.startsWith('Amortização/Liquidação da Fatura') && !m.descricao.startsWith('Liquidação Integral')) {
          items.push({
            id: `MOV-${m.id}`,
            rawDate: m.data,
            dataFormatted: `${m.data} ${m.hora || ''}`,
            tipoModulo: 'caixa',
            codigo: m.talao || m.id,
            descricao: m.descricao,
            cliente: m.beneficiario || m.criado_por || 'IMP',
            categoria: m.categoria || 'Caixa',
            valorEntrada: m.tipo === 'entrada' ? m.valor : 0,
            valorSaida: m.tipo === 'saida' ? m.valor : 0,
            estadoOuBanco: m.banco || 'Caixa Geral',
            operador: m.criado_por || 'Tesouraria',
            originalRef: m
          });
        }
      });
    }

    // Filter by tab
    let result = items;
    if (activeTab === 'faturas') result = result.filter((i) => i.tipoModulo === 'fatura');
    if (activeTab === 'recibos') result = result.filter((i) => i.tipoModulo === 'recibo');
    if (activeTab === 'caixa') result = result.filter((i) => i.tipoModulo === 'caixa');

    // Filter by text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.codigo.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q) ||
          i.cliente.toLowerCase().includes(q) ||
          (i.vessel && i.vessel.toLowerCase().includes(q)) ||
          i.categoria.toLowerCase().includes(q) ||
          i.operador.toLowerCase().includes(q) ||
          i.estadoOuBanco.toLowerCase().includes(q)
      );
    }

    // Sort descending by rawDate
    return result.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [scopedFaturas, scopedRecibos, scopedMovimentos, isCaixa, isFaturacao, activeTab, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-[98vw] xl:max-w-7xl 2xl:max-w-[1400px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[96vh] flex flex-col transition-all">
        
        {/* ====================================================================
            HEADER INSTITUCIONAL COM IDENTIFICAÇÃO DE PERFIL E TEMPO REAL
            ==================================================================== */}
        <div className="bg-[#082B59] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center p-2 border border-white/20 shadow-inner">
              <BarChart3 className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-cyan-300" />
                  {isAdminOrDG ? tText('Direção Geral • Painel Executivo') : isFaturacao ? tText('Operador de Faturação') : tText('Operador de Caixa / Tesouraria')}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ● {tText('Tempo Real')} • {liveTimestamp || tText('Sincronizado')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white mt-1">
                {isAdminOrDG
                  ? tText('Monitor Consolidado de Operações • Faturação & Caixa')
                  : isFaturacao
                  ? `${tText('Minhas Faturas Emitidas')} • ${userName || tText('Operador de Faturação')}`
                  : `${tText('Minhas Ações de Caixa & Recibos')} • ${userName || tText('Operador de Caixa')}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              title="Imprimir Relatório Oficial (.printable-document)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ====================================================================
            BARRA DE FILTROS TEMPORAIS (HOJE, ONTEM, SEMANA, MÊS, ANO, DIA PERSONALIZADO, TODOS)
            ==================================================================== */}
        <div className="bg-slate-100 dark:bg-slate-950/80 p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono uppercase mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Período:
            </span>
            <button
              type="button"
              onClick={() => setPeriodo('dia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'dia'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Hoje (Dia)')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('ontem')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'ontem'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Ontem')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'semana'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Esta Semana')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('semana_passada')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'semana_passada'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Semana Passada')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'mes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Este Mês')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('mes_passado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'mes_passado'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Mês Passado')}
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('ano')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'ano'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Exercício (Ano)')}
            </button>

            {/* Custom Date Picker Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl px-2 py-0.5 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPeriodo('custom')}
                className={`text-xs font-bold transition-all cursor-pointer ${
                  periodo === 'custom' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tText('Escolher Dia')}:
              </button>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setPeriodo('custom');
                }}
                className={`text-xs font-mono bg-transparent font-bold focus:outline-none cursor-pointer ${
                  periodo === 'custom' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => setPeriodo('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodo === 'todos'
                  ? 'bg-[#082B59] text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tText('Todo o Histórico')}
            </button>
          </div>

          {/* If Admin / DG, allow filtering by specific operator */}
          {isAdminOrDG && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 font-mono">{tText('Operador')}:</span>
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium focus:outline-none"
              >
                <option value="todos">{tText('Todos os Operadores')}</option>
                <option value="Okica">{tText('Sr. António Okica de Sá (Faturação)')}</option>
                <option value="Álvaro">{tText('Dr. Álvaro Luís Da Silva (Caixa)')}</option>
                <option value="SuperAdministrador">{tText('Eng. SuperAdministrador')}</option>
              </select>
            </div>
          )}
        </div>

        {/* ====================================================================
            CARDS DE RESUMO & KPIS ESPECÍFICOS POR PERFIL (SOD)
            ==================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
          
          {/* CASO 1: PERFIL FATURAÇÃO */}
          {isFaturacao && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{tText('Emitidas por Si')}</span>
                <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {faturasBreakdown.totalCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {faturasBreakdown.totalValor.toLocaleString('pt-PT')} XOF
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">{tText('Totalmente Pagas')}</span>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {faturasBreakdown.pagasCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {faturasBreakdown.pagasValor.toLocaleString('pt-PT')} XOF
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">{tText('Amortização Parcial')}</span>
                <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {faturasBreakdown.parciaisCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {faturasBreakdown.parciaisValor.toLocaleString('pt-PT')} XOF
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">{tText('Confirmadas')}</span>
                <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                  {faturasBreakdown.confirmadasCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {tText('Aguardam Caixa')}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{tText('Rascunhos')}</span>
                <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1">
                  {faturasBreakdown.rascunhosCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {tText('Em preparação')}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xs">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">{tText('Anuladas')}</span>
                <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                  {faturasBreakdown.anuladasCount}
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block truncate">
                  {tText('Sem efeito fiscal')}
                </span>
              </div>
            </div>
          )}

          {/* CASO 2: PERFIL CAIXA / TESOURARIA */}
          {isCaixa && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Recibos Emitidos por Si</span>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {caixaBreakdown.totalRecibosCount} Recibos
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Total Quitado: {caixaBreakdown.totalRecibosValor.toLocaleString('pt-PT')} XOF
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Total Entradas (Caixa)</span>
                <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                  +{caixaBreakdown.totalEntradas.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Arrecadações Diretas & Depósitos
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xs">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Total Saídas Registadas</span>
                <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                  -{caixaBreakdown.totalSaidas.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  Despesas e Pagamentos Autorizados
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#082B59] to-[#0f3d7a] text-white rounded-2xl shadow-md">
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider block">Saldo da Sua Sessão</span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {caixaBreakdown.saldoSessao.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[10px] text-blue-200 font-mono mt-0.5 block">
                  Responsabilidade Operacional Direta
                </span>
              </div>
            </div>
          )}

          {/* CASO 3: ADMIN / SUPERADMIN / DG (VISÃO GLOBAL CONSOLIDADA) */}
          {isAdminOrDG && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {operatorFilter === 'Álvaro' ? tText('Total Liquidado') : tText('TOTAL FATURADO')}
                </span>
                <div className="text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {(operatorFilter === 'Álvaro' ? caixaBreakdown.totalRecibosValor : faturasBreakdown.totalValor).toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {operatorFilter === 'Álvaro'
                    ? `${caixaBreakdown.totalRecibosCount} ${tText('Recibos liquidados')}`
                    : `${faturasBreakdown.totalCount} ${tText('Faturas no período')}`}
                </span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">{tText('ARRECADADO EM CAIXA')}</span>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  +{caixaBreakdown.totalEntradas.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {caixaBreakdown.totalRecibosCount} {tText('Recibos emitidos')}
                </span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-xs">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">{tText('SAÍDAS DA TESOURARIA')}</span>
                <div className="text-lg sm:text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                  -{caixaBreakdown.totalSaidas.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {tText('Despesas autorizadas')}
                </span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900 shadow-xs">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">{tText('SALDO PENDENTE FATURAÇÃO')}</span>
                <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {faturasBreakdown.valorPendente.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[9.5px] text-slate-500 font-mono block">
                  {tText('Aguardam cobrança')}
                </span>
              </div>

              <div className="p-3.5 bg-gradient-to-br from-[#082B59] to-[#0f3d7a] text-white rounded-2xl shadow-md col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider block">{tText('SALDO EM CAIXA ATUAL')}</span>
                <div className="text-lg sm:text-xl font-black font-mono text-white mt-1">
                  {caixaBreakdown.saldoSessao.toLocaleString('pt-PT')} XOF
                </div>
                <span className="text-[9.5px] text-blue-200 font-mono block">
                  {tText('Disponibilidade Imediata')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            GRÁFICO VISUAL EM TEMPO REAL (SIMPLES, DIRETO E FÁCIL DE ENTENDER)
            ==================================================================== */}
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {isFaturacao
                  ? tText('DISTRIBUIÇÃO VISUAL DE FATURAS POR ESTADO (TEMPO REAL)')
                  : isCaixa
                  ? tText('Balanço Visual de Operações de Caixa (Tempo Real)')
                  : tText('Balanço Consolidado: Faturação vs Cobrança em Caixa')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {tText('Período Ativo')}: {periodo.toUpperCase()}
            </span>
          </div>

          {/* Visual Progress Bar Chart */}
          {isFaturacao && (
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                {faturasBreakdown.totalCount > 0 ? (
                  <>
                    <div
                      style={{ width: `${(faturasBreakdown.pagasCount / faturasBreakdown.totalCount) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`${tText('Totalmente Pagas')}: ${faturasBreakdown.pagasCount}`}
                    />
                    <div
                      style={{ width: `${(faturasBreakdown.parciaisCount / faturasBreakdown.totalCount) * 100}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`${tText('Amortização Parcial')}: ${faturasBreakdown.parciaisCount}`}
                    />
                    <div
                      style={{ width: `${(faturasBreakdown.confirmadasCount / faturasBreakdown.totalCount) * 100}%` }}
                      className="bg-blue-500 transition-all duration-500"
                      title={`${tText('Confirmadas')}: ${faturasBreakdown.confirmadasCount}`}
                    />
                    <div
                      style={{ width: `${(faturasBreakdown.rascunhosCount / faturasBreakdown.totalCount) * 100}%` }}
                      className="bg-slate-400 transition-all duration-500"
                      title={`${tText('Rascunhos')}: ${faturasBreakdown.rascunhosCount}`}
                    />
                    <div
                      style={{ width: `${(faturasBreakdown.anuladasCount / faturasBreakdown.totalCount) * 100}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`${tText('Anuladas')}: ${faturasBreakdown.anuladasCount}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-500">
                    Sem faturas emitidas neste período
                  </div>
                )}
              </div>

              {/* Legend with exact numbers */}
              <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-2 text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{tText('Pagas')} ({faturasBreakdown.pagasCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span>{tText('Parciais')} ({faturasBreakdown.parciaisCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span>{tText('Confirmadas')} ({faturasBreakdown.confirmadasCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
                  <span>{tText('Rascunhos')} ({faturasBreakdown.rascunhosCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>{tText('Anuladas')} ({faturasBreakdown.anuladasCount})</span>
                </div>
              </div>
            </div>
          )}

          {isCaixa && (
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                {caixaBreakdown.totalEntradas + caixaBreakdown.totalSaidas > 0 ? (
                  <>
                    <div
                      style={{
                        width: `${
                          (caixaBreakdown.totalEntradas /
                            (caixaBreakdown.totalEntradas + caixaBreakdown.totalSaidas || 1)) *
                          100
                        }%`
                      }}
                      className="bg-emerald-500 transition-all duration-500"
                      title="Entradas em Caixa"
                    />
                    <div
                      style={{
                        width: `${
                          (caixaBreakdown.totalSaidas /
                            (caixaBreakdown.totalEntradas + caixaBreakdown.totalSaidas || 1)) *
                          100
                        }%`
                      }}
                      className="bg-rose-500 transition-all duration-500"
                      title="Saídas / Despesas"
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-500">
                    Sem movimentos no período selecionado
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Entradas: +{caixaBreakdown.totalEntradas.toLocaleString('pt-PT')} XOF</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Saídas: -{caixaBreakdown.totalSaidas.toLocaleString('pt-PT')} XOF</span>
                </div>
                <div className="font-bold text-slate-800 dark:text-white">
                  Saldo Líquido: {caixaBreakdown.saldoSessao.toLocaleString('pt-PT')} XOF
                </div>
              </div>
            </div>
          )}

          {isAdminOrDG && (
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                {faturasBreakdown.totalValor > 0 ? (
                  <>
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (faturasBreakdown.valorPago / (faturasBreakdown.totalValor || 1)) * 100
                        )}%`
                      }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Cobrado em Caixa: ${faturasBreakdown.valorPago.toLocaleString('pt-PT')} XOF`}
                    />
                    <div
                      style={{
                        width: `${Math.max(
                          0,
                          100 - (faturasBreakdown.valorPago / (faturasBreakdown.totalValor || 1)) * 100
                        )}%`
                      }}
                      className="bg-amber-400 transition-all duration-500"
                      title={`Pendente: ${faturasBreakdown.valorPendente.toLocaleString('pt-PT')} XOF`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-500">
                    A aguardar faturação para cálculo do índice
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300 pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{tText('Cobrado:')} {faturasBreakdown.valorPago.toLocaleString('pt-PT')} XOF ({faturasBreakdown.totalValor > 0 ? Math.round((faturasBreakdown.valorPago / faturasBreakdown.totalValor) * 100) : 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                  <span>{tText('Pendente de Cobrança:')} {faturasBreakdown.valorPendente.toLocaleString('pt-PT')} XOF</span>
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  {tText('Total Emitido:')} {faturasBreakdown.totalValor.toLocaleString('pt-PT')} XOF
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            CONTROLOS DE PESQUISA E TABELAS
            ==================================================================== */}
        <div className="p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950/60 space-y-3">
          {/* Secção de registos para operador de caixa */}
          {isCaixa ? (
            <div className="flex items-center gap-2 pt-1">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {tText('Registos de Movimentação em Caixa & Recibos Emitidos')}
              </h4>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Sub-tabs if Admin */}
              {isAdminOrDG ? (
                <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('todos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'todos'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tText('Todos')} ({unifiedTableList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('faturas')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'faturas'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tText('Faturas')} ({scopedFaturas.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recibos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'recibos'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tText('Recibos')} ({scopedRecibos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('caixa')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'caixa'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tText('Caixa')} ({scopedMovimentos.length})
                  </button>
                </div>
              ) : isFaturacao ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 font-mono">{tText('Filtrar por Estado:')}</span>
                  <select
                    value={statusFaturaFilter}
                    onChange={(e) => setStatusFaturaFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium focus:outline-none"
                  >
                    <option value="todos">{tText('Todos os Estados')}</option>
                    <option value="rascunho">{tText('Rascunho')}</option>
                    <option value="confirmada">{tText('Confirmada')}</option>
                    <option value="parcial">{tText('Amortização Parcial')}</option>
                    <option value="paga">{tText('Totalmente Paga')}</option>
                    <option value="anulada">{tText('Anulada')}</option>
                  </select>
                </div>
              ) : null}

              {/* Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={tText('Buscar por código, cliente, navio...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* ====================================================================
            TABELA DE OPERAÇÕES COM BOTÕES DE IMPRESSÃO (SÓ ÍCONE DA IMPRESSORA)
            ==================================================================== */}
        <div className="overflow-y-auto overflow-x-hidden p-3 sm:p-4 flex-1">
          <table className="w-full text-xs text-left table-fixed">
            <thead className={`bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-700 ${isCaixa ? '' : 'sticky top-0 z-10'}`}>
              <tr>
                <th className="p-2 sm:p-3 w-[92px]">{tText('DATA')}</th>
                <th className="p-2 sm:p-3 w-[130px]">{tText('CÓDIGO')}</th>
                <th className="p-2 sm:p-3">{tText('DESCRIÇÃO / DETALHE')}</th>
                <th className="p-2 sm:p-3 w-[180px]">{tText('CLIENTE / ENTIDADE / NAVIO')}</th>
                <th className="p-2 sm:p-3 w-[130px] text-right">{tText('VALOR')}</th>
                <th className="p-2 sm:p-3 w-[120px]">{tText('ESTADO / BANCO')}</th>
                <th className="p-2 sm:p-3 w-[120px]">{tText('OPERADOR')}</th>
                <th className="p-2 sm:p-3 w-[72px] text-center">{tText('AÇÕES')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {unifiedTableList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-mono text-xs">
                    Nenhum registo encontrado com os critérios selecionados para este período.
                  </td>
                </tr>
              ) : (
                unifiedTableList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-2 sm:p-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.dataFormatted}
                    </td>

                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {item.codigo}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                          item.tipoModulo === 'fatura'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                            : item.tipoModulo === 'recibo'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        }`}
                      >
                        {item.categoria}
                      </span>
                    </td>

                    <td className="p-2 sm:p-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {item.descricao}
                      </span>
                    </td>

                    <td className="p-2 sm:p-3">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.cliente}
                      </div>
                      {item.vessel && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Ship className="w-3 h-3 inline" />
                          <span>{item.vessel}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-2 sm:p-3 text-right font-mono font-bold whitespace-nowrap">
                      {item.valorEntrada > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{item.valorEntrada.toLocaleString('pt-PT')} XOF
                        </span>
                      ) : item.valorSaida > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          -{item.valorSaida.toLocaleString('pt-PT')} XOF
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.estadoOuBanco === 'paga'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.estadoOuBanco === 'parcial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : item.estadoOuBanco === 'confirmada'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : item.estadoOuBanco === 'anulada'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.estadoOuBanco.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {item.operador}
                    </td>

                    {/* ONLY PRINTER ICON AS EXPLICITLY REQUESTED */}
                    <td className="p-2 sm:p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.tipoModulo === 'fatura' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewFatura) onViewFatura(item.originalRef as FaturaIMP);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              title={`Visualizar Detalhes da Fatura ${item.codigo}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewFatura) onViewFatura(item.originalRef as FaturaIMP);
                                setTimeout(() => window.print(), 300);
                              }}
                              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              title={`Imprimir Fatura ${item.codigo}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {item.tipoModulo === 'recibo' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewRecibo) onViewRecibo(item.originalRef as ReciboIMP);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              title={`Visualizar Recibo ${item.codigo}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onViewRecibo) onViewRecibo(item.originalRef as ReciboIMP);
                                setTimeout(() => window.print(), 300);
                              }}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              title={`Imprimir Recibo ${item.codigo}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {item.tipoModulo === 'caixa' && (
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                            title={`Imprimir Comprovativo do Movimento ${item.codigo}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================================
            FOOTER COM RESUMO DE AUDITORIA E EXPORTAÇÃO
            ==================================================================== */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono shrink-0 gap-2">
          <span>
            {tText('Exibindo')} {unifiedTableList.length} {tText('registos')} • {tText('Instituto Marítimo Portuário da Guiné-Bissau (IMP)')}
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {tText('Segregação de Funções SoD Ativa & Auditoria Integrada')}
          </span>
        </div>
      </div>
    </div>
  );
}
