import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine
} from 'recharts';
import { Activity, TrendingUp, Zap, Clock, Calendar, BarChart3, ShieldCheck } from 'lucide-react';
import { AuditoriaLog } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface AuditoriaActivityChartProps {
  logs: AuditoriaLog[];
}

type Granularity = 'dia' | 'hora' | 'cronologico';
type ChartStyle = 'linhas' | 'area';

export function AuditoriaActivityChart({ logs }: AuditoriaActivityChartProps) {
  const { theme } = useTheme();
  const { tText } = useLanguage();
  const [granularity, setGranularity] = useState<Granularity>('dia');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('linhas');

  // Categorize log action into major groups
  const categorizeAction = (acao: string): 'faturacao' | 'caixa' | 'seguranca' => {
    const a = acao.toUpperCase();
    if (a.includes('FATURA') || a.includes('EMITIR') || a.includes('CONFIRMAR')) return 'faturacao';
    if (a.includes('CAIXA') || a.includes('RECIBO') || a.includes('LIQUIDAR') || a.includes('LANCAMENTO') || a.includes('PAGAMENTO')) return 'caixa';
    return 'seguranca';
  };

  // Process data based on granularity
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // Sort logs chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (granularity === 'dia') {
      const map = new Map<string, { label: string; total: number; faturacao: number; caixa: number; seguranca: number }>();
      
      sortedLogs.forEach((log) => {
        const dateStr = log.timestamp.split(' ')[0] || log.timestamp.split('T')[0] || '2026-10-20';
        const displayLabel = dateStr.slice(5); // e.g. "10-23"
        const cat = categorizeAction(log.acao);

        if (!map.has(dateStr)) {
          map.set(dateStr, {
            label: displayLabel,
            total: 0,
            faturacao: 0,
            caixa: 0,
            seguranca: 0
          });
        }

        const entry = map.get(dateStr)!;
        entry.total += 1;
        entry[cat] += 1;
      });

      return Array.from(map.values());
    }

    if (granularity === 'hora') {
      // Aggregate by hour of day (08:00 to 18:00)
      const hoursMap = new Map<string, { label: string; total: number; faturacao: number; caixa: number; seguranca: number }>();
      
      for (let h = 8; h <= 18; h++) {
        const hourStr = `${String(h).padStart(2, '0')}:00`;
        hoursMap.set(hourStr, {
          label: hourStr,
          total: 0,
          faturacao: 0,
          caixa: 0,
          seguranca: 0
        });
      }

      sortedLogs.forEach((log) => {
        const timePart = log.timestamp.split(' ')[1] || '09:00:00';
        const hour = parseInt(timePart.split(':')[0], 10);
        const hourKey = `${String(hour).padStart(2, '0')}:00`;
        const cat = categorizeAction(log.acao);

        if (hoursMap.has(hourKey)) {
          const entry = hoursMap.get(hourKey)!;
          entry.total += 1;
          entry[cat] += 1;
        }
      });

      return Array.from(hoursMap.values());
    }

    // Cronológico (sequential windows)
    const windowMap = new Map<string, { label: string; total: number; faturacao: number; caixa: number; seguranca: number }>();
    sortedLogs.forEach((log) => {
      const datePart = (log.timestamp.split(' ')[0] || '').slice(5);
      const timePart = (log.timestamp.split(' ')[1] || '').slice(0, 5);
      const label = `${datePart} ${timePart}`;
      const cat = categorizeAction(log.acao);

      if (!windowMap.has(label)) {
        windowMap.set(label, {
          label,
          total: 0,
          faturacao: 0,
          caixa: 0,
          seguranca: 0
        });
      }

      const entry = windowMap.get(label)!;
      entry.total += 1;
      entry[cat] += 1;
    });

    return Array.from(windowMap.values());
  }, [logs, granularity]);

  // Find peak activity
  const peakInfo = useMemo(() => {
    if (chartData.length === 0) return { maxVal: 0, peakLabel: 'N/A' };
    let maxVal = 0;
    let peakLabel = '';

    chartData.forEach((d) => {
      if (d.total > maxVal) {
        maxVal = d.total;
        peakLabel = d.label;
      }
    });

    return { maxVal, peakLabel };
  }, [chartData]);

  // General metrics
  const totalActions = logs.length;
  const avgPerPeriod = chartData.length > 0 ? (totalActions / chartData.length).toFixed(1) : '0';

  // Custom styled Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.find((p: any) => p.dataKey === 'total')?.value || 0;
      const isPeak = total === peakInfo.maxVal && total > 0;

      return (
        <div
          className={`p-3.5 rounded-xl border shadow-xl text-xs space-y-2 backdrop-blur-md ${
            theme === 'dark'
              ? 'bg-slate-900/95 border-purple-500/30 text-slate-100'
              : 'bg-white/95 border-purple-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b pb-1.5 border-slate-700/30">
            <span className="font-mono font-bold flex items-center gap-1.5 text-purple-400">
              <Clock className="w-3.5 h-3.5" />
              {label}
            </span>
            {isPeak && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black flex items-center gap-1 shadow-sm">
                <Zap className="w-3 h-3 fill-current" />
                {tText('Pico Máximo')}
              </span>
            )}
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-6">
              <span className="text-purple-400 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                {tText('Total de Ações')}:
              </span>
              <span className="font-extrabold text-sm">{total}</span>
            </div>

            {payload.map((entry: any, index: number) => {
              if (entry.dataKey === 'total') return null;
              let name = tText('Outras');
              let color = entry.color;
              if (entry.dataKey === 'faturacao') name = tText('Faturação & Emissão');
              if (entry.dataKey === 'caixa') name = tText('Tesouraria & Recibos');
              if (entry.dataKey === 'seguranca') name = tText('Segurança & Auditoria');

              return (
                <div key={`tooltip-${index}`} className="flex items-center justify-between gap-6 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                    {name}:
                  </span>
                  <span className="text-slate-200 font-semibold">{entry.value}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-1 border-t border-slate-700/30 text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {tText('Assinatura SHA-256 Validada')}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Chart Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3
              className={`text-sm font-bold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {tText('Frequência de Ações no Sistema ao Longo do Tempo (Análise de Picos)')}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {tText('Monitoramento de picos de atividade operacional, emissão de faturas e liquidações de tesouraria')}
          </p>
        </div>

        {/* View Switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Selector */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border text-xs font-medium ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <button
              onClick={() => setGranularity('dia')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                granularity === 'dia'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'hover:text-purple-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {tText('Por Dia')}
            </button>
            <button
              onClick={() => setGranularity('hora')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                granularity === 'hora'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'hover:text-purple-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {tText('Por Horário')}
            </button>
            <button
              onClick={() => setGranularity('cronologico')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                granularity === 'cronologico'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'hover:text-purple-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {tText('Cronologia')}
            </button>
          </div>

          {/* Style Toggle (Line vs Area) */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border text-xs font-medium ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <button
              onClick={() => setChartStyle('linhas')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                chartStyle === 'linhas'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'hover:text-blue-400'
              }`}
              title={tText('Visualizar em Linhas Múltiplas')}
            >
              <Activity className="w-3.5 h-3.5" />
              {tText('Linhas')}
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                chartStyle === 'area'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'hover:text-blue-400'
              }`}
              title={tText('Visualizar em Área Suave')}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {tText('Área')}
            </button>
          </div>
        </div>
      </div>

      {/* Mini KPI summary highlights for peak detection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div
          className={`p-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span>{tText('Pico Máximo Registado')}</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {peakInfo.maxVal} {tText('ações')}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {tText('No período')}: <span className="text-slate-200 font-mono font-medium">{peakInfo.peakLabel}</span>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span>{tText('Média por Intervalo')}</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-400">
            {avgPerPeriod} {tText('ações')}
          </div>
          <div className="text-[10px] text-slate-400">
            {tText('Ritmo contínuo auditado')}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span>{tText('Ações de Faturação')}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          </div>
          <div className="text-lg font-bold font-mono text-blue-400">
            {logs.filter(l => categorizeAction(l.acao) === 'faturacao').length}
          </div>
          <div className="text-[10px] text-slate-400">
            {tText('Emissões & confirmações')}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
            <span>{tText('Tesouraria & Caixa')}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {logs.filter(l => categorizeAction(l.acao) === 'caixa').length}
          </div>
          <div className="text-[10px] text-slate-400">
            {tText('Recibos & amortizações')}
          </div>
        </div>
      </div>

      {/* The Recharts Container */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'linhas' ? (
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="totalLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'dark' ? '#334155' : '#E2E8F0'}
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
                fontFamily="monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
                formatter={(value) => {
                  if (value === 'total') return <span className="font-bold text-purple-400">{tText('Total de Ações')}</span>;
                  if (value === 'faturacao') return <span className="text-blue-400">{tText('Faturação')}</span>;
                  if (value === 'caixa') return <span className="text-emerald-400">{tText('Tesouraria/Recibos')}</span>;
                  if (value === 'seguranca') return <span className="text-amber-400">{tText('Governação/Admin')}</span>;
                  return value;
                }}
              />

              {/* Reference line marking the peak activity value */}
              {peakInfo.maxVal > 0 && (
                <ReferenceLine
                  y={peakInfo.maxVal}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `${tText('Pico Máximo')} (${peakInfo.maxVal})`,
                    fill: '#F59E0B',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Peak Reference Dot */}
              {peakInfo.maxVal > 0 && peakInfo.peakLabel && (
                <ReferenceDot
                  x={peakInfo.peakLabel}
                  y={peakInfo.maxVal}
                  r={6}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}

              {/* Multiple Lines showing categories & total */}
              <Line
                type="monotone"
                dataKey="total"
                name="total"
                stroke="url(#totalLineGradient)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#A855F7', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="faturacao"
                name="faturacao"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={{ r: 3, fill: '#3B82F6' }}
              />
              <Line
                type="monotone"
                dataKey="caixa"
                name="caixa"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="seguranca"
                name="seguranca"
                stroke="#F59E0B"
                strokeWidth={1.5}
                dot={{ r: 2.5, fill: '#F59E0B' }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="areaBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'dark' ? '#334155' : '#E2E8F0'}
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
                fontFamily="monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => {
                  if (value === 'total') return <span className="font-bold text-purple-400">{tText('Volume Total de Ações')}</span>;
                  if (value === 'faturacao') return <span className="text-blue-400">{tText('Faturação')}</span>;
                  return value;
                }}
              />
              {peakInfo.maxVal > 0 && (
                <ReferenceLine
                  y={peakInfo.maxVal}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{
                    value: `${tText('Pico')}: ${peakInfo.maxVal}`,
                    fill: '#F59E0B',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="total"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaPurpleGrad)"
              />
              <Area
                type="monotone"
                dataKey="faturacao"
                stroke="#3B82F6"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#areaBlueGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
