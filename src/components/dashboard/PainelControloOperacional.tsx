import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FaturaIMP, ReciboIMP, CaixaMov, Utilizador } from '../../types';
import { Calendar, Filter, BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface PainelControloOperacionalProps {
  faturas: FaturaIMP[];
  recibos: ReciboIMP[];
  movimentos: CaixaMov[];
  currentUser?: Utilizador;
  periodoInicial?: 'diario' | 'semana' | 'mes' | 'ano';
}

export function PainelControloOperacional({
  faturas,
  recibos,
  movimentos,
  currentUser,
  periodoInicial = 'mes'
}: PainelControloOperacionalProps) {
  const { theme } = useTheme();
  const { tText, language } = useLanguage();
  const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'pt-PT';
  const [periodo, setPeriodo] = useState<'diario' | 'semana' | 'mes' | 'ano'>(periodoInicial);

  const role = (currentUser?.role || currentUser?.funcao || '').toLowerCase();
  const userCargo = (currentUser?.cargo || '').toLowerCase();
  const isAdminOrDG = role === 'admin' || role === 'superadmin' || userCargo.includes('pca') || userCargo.includes('diret');
  const isFaturacao = !isAdminOrDG && (role === 'faturacao' || userCargo.includes('fatura'));
  const isCaixa = !isAdminOrDG && (role === 'caixa' || userCargo.includes('caixa'));

  // SoD Scoped datasets
  const scopedFaturas = useMemo(() => {
    if (isCaixa) return [];
    if (isFaturacao) return faturas.filter(f => (f.criado_por || '').includes(currentUser?.nome || ''));
    return faturas;
  }, [faturas, isCaixa, isFaturacao, currentUser]);

  const scopedMovimentos = useMemo(() => {
    if (isFaturacao) return [];
    if (isCaixa) return movimentos.filter(m => (m.criado_por || '').includes(currentUser?.nome || ''));
    return movimentos;
  }, [movimentos, isFaturacao, isCaixa, currentUser]);

  // Real-time time-series data aggregation based on selected period
  const { chartData, estadoData, totalFaturado, totalEntradas } = useMemo(() => {
    const buckets: Record<string, { label: string; faturas: number; entradas: number; saidas: number }> = {};
    const monthNames =
      language === 'fr'
        ? ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
        : language === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const getBucketInfo = (dateStr: string) => {
      const cleanDate = (dateStr || '').split(' ')[0];
      if (!cleanDate || cleanDate.length < 4) {
        return { key: 'outro', label: tText('Outro') };
      }

      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        if (periodo === 'diario') {
          return { key: cleanDate, label: `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}` };
        }
        if (periodo === 'semana') {
          const d = new Date(year, month, day);
          const firstDay = new Date(year, 0, 1);
          const pastDays = (d.getTime() - firstDay.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
          return { key: `${year}-W${weekNum}`, label: `${tText('Sem')} ${weekNum}` };
        }
        if (periodo === 'mes') {
          return { key: `${year}-${String(month + 1).padStart(2, '0')}`, label: `${monthNames[month] || parts[1]} ${year}` };
        }
        return { key: `${year}`, label: `${year}` };
      }

      return { key: cleanDate, label: cleanDate };
    };

    let sumFaturas = 0;
    let sumEntradas = 0;

    scopedFaturas.forEach(f => {
      if (f.estado === 'anulada') return;
      const { key, label } = getBucketInfo(f.data);
      if (!buckets[key]) buckets[key] = { label, faturas: 0, entradas: 0, saidas: 0 };
      const val = Number(f.total) || 0;
      buckets[key].faturas += val;
      sumFaturas += val;
    });

    scopedMovimentos.forEach(m => {
      const { key, label } = getBucketInfo(m.data);
      if (!buckets[key]) buckets[key] = { label, faturas: 0, entradas: 0, saidas: 0 };
      const val = Number(m.valor) || 0;
      if (m.tipo === 'entrada') {
        buckets[key].entradas += val;
        sumEntradas += val;
      } else {
        buckets[key].saidas += val;
      }
    });

    const sortedBuckets = Object.entries(buckets)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([_, v]) => v);

    // Invoice status counts
    const counts = { rascunho: 0, confirmada: 0, paga: 0, anulada: 0 };
    scopedFaturas.forEach(f => {
      if (counts.hasOwnProperty(f.estado)) {
        counts[f.estado as keyof typeof counts]++;
      }
    });

    const estadoChart = [
      { name: tText('Rascunho'), label: tText('Rascunho'), value: counts.rascunho, color: '#94a3b8' },
      { name: tText('Confirmada'), label: tText('Confirmada'), value: counts.confirmada, color: '#3b82f6' },
      { name: tText('Totalmente Paga'), label: tText('Totalmente Paga'), value: counts.paga, color: '#10b981' },
      { name: tText('Anulada'), label: tText('Anulada'), value: counts.anulada, color: '#f43f5e' }
    ];

    return {
      chartData: sortedBuckets.length > 0 ? sortedBuckets : [{ label: tText('Sem dados'), faturas: 0, entradas: 0, saidas: 0 }],
      estadoData: estadoChart,
      totalFaturado: sumFaturas,
      totalEntradas: sumEntradas
    };
  }, [scopedFaturas, scopedMovimentos, periodo, language, tText]);

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#f43f5e'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-mono space-y-1">
          <p className="font-bold text-blue-400 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between gap-4">
              <span style={{ color: entry.color || entry.fill }}>{entry.name}:</span>
              <span className="font-bold">{Number(entry.value).toLocaleString(locale)} XOF</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-6 ${
      theme === 'dark' ? 'bg-[#0B1528] border-slate-800 text-white' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Header with Time Period Controls matching User Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
              {tText('PAINEL DE CONTROLO OPERACIONAL')}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {tText('Faturação e Caixa em tempo real')} • {tText('Período Ativo')}: ({tText(periodo === 'diario' ? 'Diário' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mês' : 'Ano')})
          </p>
        </div>

        {/* Dynamic Period Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setPeriodo('diario')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              periodo === 'diario'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
            }`}
          >
            {tText('Diário')}
          </button>
          <button
            onClick={() => setPeriodo('semana')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              periodo === 'semana'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
            }`}
          >
            {tText('Semana')}
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              periodo === 'mes'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
            }`}
          >
            {tText('Mês')}
          </button>
          <button
            onClick={() => setPeriodo('ano')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              periodo === 'ano'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
            }`}
          >
            {tText('Ano')}
          </button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Faturação por Período */}
        <div className={`p-4 rounded-2xl border space-y-2 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {tText('Faturação por Período (XOF)')}
            </h3>
            <span className="text-xs font-mono font-bold text-blue-500">
              {totalFaturado.toLocaleString(locale)} XOF
            </span>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="label" style={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="faturas" name={tText('Faturado')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Volume de Caixa */}
        <div className={`p-4 rounded-2xl border space-y-2 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {tText('Volume de Caixa (Entradas/Saídas)')}
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-500">
              {totalEntradas.toLocaleString(locale)} XOF
            </span>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="label" style={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="entradas" name={tText('Total Entradas')} stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                <Area type="monotone" dataKey="saidas" name={tText('Total Saídas')} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Estado das Faturas */}
        <div className={`p-4 rounded-2xl border space-y-2 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {tText('Estado das Faturas')}
          </h3>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estadoData} innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {estadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
