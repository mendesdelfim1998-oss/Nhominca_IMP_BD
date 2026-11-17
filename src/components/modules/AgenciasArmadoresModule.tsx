import { useState } from 'react';
import { Building2, Users, FileText, Plus, Phone, Mail, CheckCircle, ShieldAlert } from 'lucide-react';
import { AgenciaMaritima, Armador } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface AgenciasArmadoresModuleProps {
  agencias: AgenciaMaritima[];
  armadores: Armador[];
}

export function AgenciasArmadoresModule({ agencias, armadores }: AgenciasArmadoresModuleProps) {
  const { theme } = useTheme();
  const { tText } = useLanguage();
  const [activeTab, setActiveTab] = useState<'agencias' | 'armadores'>('agencias');
  const isDark = theme === 'dark';

  return (
    <div id="agencias-armadores-module" className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Building2 className="w-5 h-5 text-blue-500" />
            {tText('Agências Marítimas & Armadores')}
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs`}>{tText('Licenciamento de agentes de navegação, representantes legais e operadores de frota')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('agencias')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'agencias'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          {tText('Agências Marítimas')} ({agencias.length})
        </button>
        <button
          onClick={() => setActiveTab('armadores')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'armadores'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : isDark ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          {tText('Armadores & Frota')} ({armadores.length})
        </button>
      </div>

      {/* Agencias List */}
      {activeTab === 'agencias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agencias.map((ag) => (
            <div key={ag.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'}`}>
              <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{ag.nomeComercial}</h3>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tText('NIF')}: <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{ag.nif}</span></div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {tText(ag.status)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="text-slate-500">{tText('Licença de Actividade IMP')}:</span>
                  <span className="font-mono text-blue-500">{ag.licencaAtividade}</span>
                </div>
                <div className={`flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="text-slate-500">{tText('Responsável Legal')}:</span>
                  <span>{ag.responsavelLegal}</span>
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'} pt-1`}>
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ag.telefone}</span>
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{ag.email}</span>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                <span>{tText('Representação em Bissau')}:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ag.embarcacoesRepresentadas} {tText('embarcações')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Armadores List */}
      {activeTab === 'armadores' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {armadores.map((arm) => (
            <div key={arm.id} className={`p-5 rounded-2xl border space-y-4 transition-all ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'}`}>
              <div className={`border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20">
                  {tText(arm.tipoEntidade)}
                </span>
                <h3 className={`font-bold text-base mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{arm.nomeRazaoSocial}</h3>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tText('País')}: <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{arm.paisOrigem}</span></div>
              </div>

              <div className="space-y-2 text-xs">
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  <span className="text-slate-500 block text-[10px] uppercase">{tText('Contacto Oficial')}</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{arm.contactoOficial}</span>
                </div>
                <div className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  <span className="text-slate-500 block text-[10px] uppercase">{tText('Email Corporativo')}</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{arm.email}</span>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <span className="text-slate-500">{tText('Frota Registada')}:</span>
                <span className="text-emerald-500 font-bold">{arm.frotaContada} {tText('navios')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
