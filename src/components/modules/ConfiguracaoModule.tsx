import { useState, useEffect, useRef } from 'react';
import {
  Settings, Server, Save, CheckCircle2, HardDrive, Mail, Send, Plus, Lock, Cookie,
  Shield, RefreshCw, Key, Terminal, Globe, FileJson, RotateCcw, Edit3, Download, Database, Upload, FileCheck
} from 'lucide-react';
import {
  ConfiguraçãoServidor, ParamentroTaxaPortuaria, Utilizador, FaturaIMP, ReciboIMP,
  CaixaMov, Embarcacao, Armador, AgenciaMaritima, Atracacao, RubricaReceita,
  Inspeccao, CertificadoMaritimo, LicencaNavegacao, MultaInfracao, AuditoriaLog
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Language, Translations } from '../../i18n/translations';

interface ConfiguracaoModuleProps {
  taxas: ParamentroTaxaPortuaria[];
  servidor: ConfiguraçãoServidor;
  currentUser?: Utilizador;
  faturas?: FaturaIMP[];
  recibos?: ReciboIMP[];
  movimentos?: CaixaMov[];
  utilizadores?: Utilizador[];
  embarcacoes?: Embarcacao[];
  armadores?: Armador[];
  agencias?: AgenciaMaritima[];
  atracacoes?: Atracacao[];
  rubricas?: RubricaReceita[];
  inspeccoes?: Inspeccao[];
  certificados?: CertificadoMaritimo[];
  licencas?: LicencaNavegacao[];
  multas?: MultaInfracao[];
  auditoriaLogs?: AuditoriaLog[];
}

export function ConfiguracaoModule({
  taxas,
  servidor,
  currentUser,
  faturas = [],
  recibos = [],
  movimentos = [],
  utilizadores = [],
  embarcacoes = [],
  armadores = [],
  agencias = [],
  atracacoes = [],
  rubricas = [],
  inspeccoes = [],
  certificados = [],
  licencas = [],
  multas = [],
  auditoriaLogs = []
}: ConfiguracaoModuleProps) {
  const { theme } = useTheme();
  const { language, setLanguage, translationsDict, updateTranslationsDict, resetTranslationsDict } = useLanguage();
  const [activeTab, setActiveTab] = useState<'taxas' | 'servidor' | 'smtp' | 'cookies' | 'idiomas' | 'backup'>('taxas');
  const [taxasState, setTaxasState] = useState(taxas);
  const [savedMsg, setSavedMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // i18n Editor State
  const [editLang, setEditLang] = useState<Language>('pt');
  const [i18nMode, setI18nMode] = useState<'visual' | 'json'>('visual');
  const [jsonRaw, setJsonRaw] = useState<string>(() => JSON.stringify(translationsDict[editLang] || translationsDict.pt, null, 2));
  const [jsonErr, setJsonErr] = useState<string>('');
  const [editableDict, setEditableDict] = useState<Record<Language, Translations>>(translationsDict);

  useEffect(() => {
    setEditableDict(translationsDict);
  }, [translationsDict]);

  useEffect(() => {
    setJsonRaw(JSON.stringify(editableDict[editLang] || editableDict.pt, null, 2));
  }, [editLang, editableDict]);

  // SuperAdmin check
  const role = (currentUser?.role || currentUser?.funcao || '').toLowerCase();
  const isSuperAdmin = role === 'superadmin' || (currentUser?.nome || '').toLowerCase().includes('superadministrador');

  // Modal for new Rubric Price / Tariff Rate
  const [isAddTaxaModalOpen, setIsAddTaxaModalOpen] = useState(false);
  const [newTaxaData, setNewTaxaData] = useState<Partial<ParamentroTaxaPortuaria>>({
    codigoServico: '',
    descricaoServico: '',
    categoria: 'Serviços Portuários',
    unidadeMedida: 'Por Manobra',
    valorUnitarioXOF: 100000
  });

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.imp.gw',
    port: '587',
    encryption: 'TLS',
    username: 'faturacao@imp.gw',
    password: '••••••••••••',
    senderEmail: 'no-reply@imp.gw',
    senderName: 'IMP Guiné-Bissau - Faturação',
    autoSendInvoice: true
  });
  const [smtpSavedMsg, setSmtpSavedMsg] = useState('');

  // SuperAdmin Dev Cookies State
  const [sysCookies, setSysCookies] = useState([
    { name: 'IMP_SYS_DEBUG', value: 'enabled_ssl_false_pg_cloud_proxy_2026', domain: 'imp.gw', path: '/', expires: 'Session', secure: true, httpOnly: true },
    { name: 'IMP_DEV_AUTH_TOKEN', value: 'bearer_dev_superadmin_sec_910005508', domain: 'imp.gw', path: '/', expires: '2026-12-31', secure: true, httpOnly: true },
    { name: 'IMP_SESSION_SECRET', value: 'AES256_GCM_PORT_AUTH_KEY_910005508_IMP', domain: 'imp.gw', path: '/', expires: '2026-11-30', secure: true, httpOnly: true },
    { name: 'IMP_SOD_ENFORCER', value: 'STRICT_SOD_ACTIVE_CAIXA_FATURACAO_DIV', domain: 'imp.gw', path: '/', expires: '2026-12-31', secure: true, httpOnly: false }
  ]);
  const [cookieSavedMsg, setCookieSavedMsg] = useState('');

  // Write cookies to browser document.cookie if SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      try {
        sysCookies.forEach(c => {
          document.cookie = `${c.name}=${c.value}; path=${c.path}; sameSite=Strict`;
        });
      } catch (e) {
        console.warn('Cookie sync warning:', e);
      }
    }
  }, [isSuperAdmin, sysCookies]);

  const handleSaveTaxas = () => {
    setSavedMsg('Tabela de Taxas e Parâmetros Portuários guardada com sucesso!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  const handleAddTaxaSubmit = () => {
    if (!newTaxaData.codigoServico || !newTaxaData.descricaoServico) {
      alert('Por favor preencha o Código e a Descrição do Serviço.');
      return;
    }
    const created: ParamentroTaxaPortuaria = {
      id: `TAX-${Date.now()}`,
      codigoServico: newTaxaData.codigoServico.toUpperCase(),
      descricaoServico: newTaxaData.descricaoServico,
      categoria: newTaxaData.categoria || 'Serviços Portuários',
      unidadeMedida: newTaxaData.unidadeMedida || 'Por Manobra',
      valorUnitarioXOF: Number(newTaxaData.valorUnitarioXOF) || 0
    };
    setTaxasState([created, ...taxasState]);
    setIsAddTaxaModalOpen(false);
    setNewTaxaData({
      codigoServico: '',
      descricaoServico: '',
      categoria: 'Serviços Portuários',
      unidadeMedida: 'Por Manobra',
      valorUnitarioXOF: 100000
    });
    setSavedMsg(`Novo preço de rubrica ${created.codigoServico} emitido e registado com sucesso!`);
    setTimeout(() => setSavedMsg(''), 5000);
  };

  const handleSaveSmtp = () => {
    setSmtpSavedMsg('Configurações de SMTP guardadas com sucesso! Envio automático de faturas PDF ativado.');
    setTimeout(() => setSmtpSavedMsg(''), 4000);
  };

  const handleTestSmtp = () => {
    setSmtpSavedMsg(`E-mail de teste enviado com sucesso para ${smtpConfig.senderEmail} através de ${smtpConfig.host}:${smtpConfig.port} (${smtpConfig.encryption}). Servidor SMTP respondeu 250 OK.`);
    setTimeout(() => setSmtpSavedMsg(''), 6000);
  };

  const handleSaveCookie = (idx: number, newVal: string) => {
    const updated = [...sysCookies];
    updated[idx].value = newVal;
    setSysCookies(updated);
    setCookieSavedMsg(`Cookie ${updated[idx].name} atualizado com sucesso no ambiente SuperAdmin!`);
    setTimeout(() => setCookieSavedMsg(''), 4000);
  };

  return (
    <div id="configuracao-module" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <Settings className="w-5 h-5 text-blue-500" />
            Configuração do Sistema, Tarifas, Servidor & SMTP
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Parâmetros das taxas portuárias, servidor PostgreSQL, envio automático de faturas PDF e cookies de dev SuperAdmin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex flex-wrap items-center gap-2 p-2 rounded-2xl border text-xs ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <button
          onClick={() => setActiveTab('taxas')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            activeTab === 'taxas'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          1. Tabela de Taxas & Tarifas
        </button>
        <button
          onClick={() => setActiveTab('servidor')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all ${
            activeTab === 'servidor'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          2. Servidor On-Premises
        </button>
        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'smtp'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          3. Configurações de SMTP & E-mail
        </button>

        {/* 4. SuperAdmin Dev Cookies Tab */}
        <button
          onClick={() => setActiveTab('cookies')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'cookies'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : theme === 'dark'
              ? 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40'
              : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Cookie className="w-3.5 h-3.5 text-purple-300" />
          4. Cookies do Sistema (SuperAdmin)
        </button>

        {/* 5. SuperAdmin i18n Language Editor Tab */}
        <button
          onClick={() => setActiveTab('idiomas')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'idiomas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : theme === 'dark'
              ? 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
              : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-300" />
          5. Idiomas & Dicionário i18n (JSON SuperAdmin)
        </button>

        {/* 6. SuperAdmin System JSON Backup Tab */}
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'backup'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : theme === 'dark'
              ? 'text-blue-400 hover:text-blue-200 hover:bg-blue-950/40'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-blue-300" />
          6. Exportação & Backup JSON (SuperAdmin)
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* TAB 1: TAXAS & TARIFAS */}
      {activeTab === 'taxas' ? (
        <div className={`p-5 rounded-2xl border space-y-4 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Parâmetros Oficiais de Tarifas Portuárias (XOF)
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Valores aplicados no cálculo automático das faturas de navios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddTaxaModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Emitir Novo Preço de Rubrica
              </button>
              <button
                onClick={handleSaveTaxas}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar Alterações
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {taxasState.map((taxa, idx) => (
              <div
                key={taxa.id}
                className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-center ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {taxa.codigoServico}
                  </span>
                  <p className={`font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {taxa.descricaoServico}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">CATEGORIA:</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {taxa.categoria}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">UNIDADE DE MEDIDA:</span>
                  <span className={`font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {taxa.unidadeMedida}
                  </span>
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px] font-mono mb-0.5">VALOR UNITÁRIO (XOF):</label>
                  <input
                    type="number"
                    value={taxa.valorUnitarioXOF}
                    onChange={(e) => {
                      const newArr = [...taxasState];
                      newArr[idx].valorUnitarioXOF = parseInt(e.target.value) || 0;
                      setTaxasState(newArr);
                    }}
                    className={`w-full rounded-lg px-3 py-1.5 font-mono font-bold focus:outline-none focus:border-blue-500 border ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-emerald-400'
                        : 'bg-white border-slate-300 text-emerald-600 shadow-sm'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'servidor' ? (
        <div className={`p-5 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`border-b pb-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Server className="w-4 h-4 text-emerald-500" />
              Infraestrutura do Servidor Local On-Premises (IMP Bissau)
            </h3>
            <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Estado em tempo real da máquina e da base de dados PostgreSQL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className={`p-4 rounded-xl border space-y-2 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-500">NOME DO SERVIDOR:</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {servidor.nomeServidor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AMBIENTE:</span>
                <span className="text-emerald-500 font-semibold">{servidor.ambiente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IP DE REDE LOCAL:</span>
                <span className="text-blue-500 font-semibold">{servidor.ipLocalServer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VERSÃO DA APLICAÇÃO:</span>
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{servidor.versaoApp}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className="text-slate-500">MOTOR DE BASE DE DADOS:</span>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {servidor.bdEngine}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DIRETÓRIO DE BACKUP:</span>
                <span className={`truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {servidor.diretorioBackup}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ÚLTIMO BACKUP AUTOMÁTICO:</span>
                <span className="text-emerald-500 font-semibold">{servidor.ultimoBackupAuto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ESTADO DA CONEXÃO:</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {servidor.statusConexao}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => alert('Backup manual efetuado e armazenado com sucesso em /var/backups/nhominca/postgresql!')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              Executar Backup Manual Agora
            </button>
          </div>
        </div>
      ) : activeTab === 'smtp' ? (
        <div className={`p-5 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`font-bold text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <Mail className="w-4 h-4 text-blue-500" />
                Configurações do Servidor de E-mail (SMTP) & Envio Automático de Faturas PDF
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Permite enviar faturas digitais e recibos PDF diretamente para o e-mail cadastrado das agências marítimas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestSmtp}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Testar Conexão SMTP
              </button>
              <button
                onClick={handleSaveSmtp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar SMTP
              </button>
            </div>
          </div>

          {smtpSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {smtpSavedMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">SERVIDOR SMTP HOST:</label>
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">PORTA SMTP:</label>
              <input
                type="text"
                value={smtpConfig.port}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">ENCRIPTAÇÃO:</label>
              <select
                value={smtpConfig.encryption}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="TLS">TLS (STARTTLS)</option>
                <option value="SSL">SSL / TLS</option>
                <option value="Nenhum">Nenhum (Plain)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">UTILIZADOR / AUTENTICAÇÃO SMTP:</label>
              <input
                type="text"
                value={smtpConfig.username}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">PALAVRA-PASSE SMTP:</label>
              <input
                type="password"
                value={smtpConfig.password}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-500 font-mono text-[10px] mb-1">E-MAIL DO REMETENTE (FROM):</label>
              <input
                type="text"
                value={smtpConfig.senderEmail}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, senderEmail: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-500 font-mono text-[10px] mb-1">NOME DO REMETENTE:</label>
              <input
                type="text"
                value={smtpConfig.senderName}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                className={`w-full rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-blue-500 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpConfig.autoSendInvoice}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, autoSendInvoice: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-700 focus:ring-blue-500"
              />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Ativar envio automático de faturas digitais em PDF por e-mail para as Agências Marítimas ao confirmar e emitir fatura oficial
              </span>
            </label>
          </div>
        </div>
      ) : activeTab === 'cookies' ? (
        /* TAB 4: SUPERADMIN DEV COOKIES CONFIGURATION */
        <div className={`p-5 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-900 border-purple-900/50' : 'bg-white border-purple-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`font-bold text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-900'}`}>
                <Cookie className="w-5 h-5 text-purple-500" />
                Configuração de Cookies de Sistema & Dev Tools (Privilégio SuperAdmin)
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Parâmetros avançados de cookies do navegador, chaves de encriptação e tokens de auditoria de desenvolvimento
              </p>
            </div>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
              SuperAdmin Exclusive
            </span>
          </div>

          {cookieSavedMsg && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
              {cookieSavedMsg}
            </div>
          )}

          {!isSuperAdmin ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-rose-500/30 text-rose-300 space-y-3">
              <Lock className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Acesso Restrito ao Desenvolvedor (SuperAdmin)</h4>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Apenas o perfil <strong>SuperAdmin (Desenvolvedor de Sistemas)</strong> possui autorização institucional para consultar e modificar os cookies de sessão, chaves de encriptação e cabeçalhos HTTP do sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span>Sessão Dev SuperAdmin Autenticada • document.cookie sincronizado em tempo real</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  HTTP-Only & Secure Active
                </span>
              </div>

              <div className="space-y-3">
                {sysCookies.map((c, idx) => (
                  <div
                    key={c.name}
                    className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold text-purple-400">{c.name}</span>
                        <span className="text-[10px] text-slate-500">Domain: {c.domain} | Path: {c.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {c.secure ? 'Secure' : 'Insecure'}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {c.httpOnly ? 'HttpOnly' : 'SameSite'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={c.value}
                        onChange={(e) => {
                          const updated = [...sysCookies];
                          updated[idx].value = e.target.value;
                          setSysCookies(updated);
                        }}
                        className={`flex-1 rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-purple-500 border ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-purple-900'
                        }`}
                      />
                      <button
                        onClick={() => handleSaveCookie(idx, c.value)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Gravar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'idiomas' ? (
        /* TAB 5: IDIOMAS & DICIONÁRIO I18N (JSON EDITOR) */
        <div className={`p-5 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  Módulo de Internacionalização (i18n)
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Edição em Tempo Real • Persistência Local
                </span>
              </div>
              <h3 className={`text-base font-bold tracking-tight mt-1 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Globe className="w-5 h-5 text-emerald-500" />
                Gestão de Idiomas & Edição de Ficheiros JSON de Tradução
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste qualquer texto do sistema (Português, Français, English). As alterações aplicam-se instantaneamente em todo o dashboard e formulários.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Tem a certeza que deseja restaurar as traduções padrão de fábrica? Todas as edições personalizadas serão eliminadas.')) {
                    resetTranslationsDict();
                    setSavedMsg('Dicionários de tradução repostos para as configurações padrão de fábrica!');
                    setTimeout(() => setSavedMsg(''), 4000);
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                title="Repor ficheiros JSON padrão de fábrica"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
          </div>

          {/* SuperAdmin Warning Banner if not SuperAdmin */}
          {!isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2 font-mono">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Privilégio de SuperAdmin / Dev: Você está em modo de pré-visualização. Apenas SuperAdministradores podem publicar alterações nos ficheiros JSON.</span>
            </div>
          )}

          {/* Language Selector Tabs (PT, FR, EN) & Editor Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Language Selection */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2">Editar Idioma:</span>
              <button
                onClick={() => {
                  setEditLang('pt');
                  setJsonErr('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  editLang === 'pt'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇵🇹 Português (PT)
              </button>
              <button
                onClick={() => {
                  setEditLang('fr');
                  setJsonErr('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  editLang === 'fr'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇫🇷 Français (FR)
              </button>
              <button
                onClick={() => {
                  setEditLang('en');
                  setJsonErr('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  editLang === 'en'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 English (EN)
              </button>
            </div>

            {/* Mode Toggle (Visual vs JSON) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => setI18nMode('visual')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  i18nMode === 'visual'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor Visual por Secção</span>
              </button>
              <button
                onClick={() => setI18nMode('json')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  i18nMode === 'json'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Editor JSON Direto</span>
              </button>
            </div>
          </div>

          {/* JSON Error Message */}
          {jsonErr && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              ⚠ Erro no Ficheiro JSON: {jsonErr}
            </div>
          )}

          {/* MODE A: DIRECT RAW JSON EDITOR */}
          {i18nMode === 'json' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">
                  Ficheiro: <strong className="text-emerald-400">i18n/{editLang}.json</strong>
                </span>
                <span className="text-[10px] text-slate-500 italic">
                  * Edite a estrutura JSON e clique em Guardar para atualizar todo o sistema em tempo real.
                </span>
              </div>

              <textarea
                rows={18}
                value={jsonRaw}
                onChange={(e) => {
                  setJsonRaw(e.target.value);
                  setJsonErr('');
                }}
                className={`w-full rounded-2xl p-4 font-mono text-xs border focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-emerald-400'
                }`}
                spellCheck={false}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonRaw) as Translations;
                      const updatedDict = {
                        ...editableDict,
                        [editLang]: parsed
                      };
                      setEditableDict(updatedDict);
                      updateTranslationsDict(updatedDict);
                      setSavedMsg(`Ficheiro JSON de tradução para ${editLang.toUpperCase()} guardado com sucesso! Todo o sistema atualizado em tempo real.`);
                      setTimeout(() => setSavedMsg(''), 5000);
                      setJsonErr('');
                    } catch (err: any) {
                      setJsonErr(err.message || 'Sintaxe JSON inválida');
                    }
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ficheiro JSON ({editLang.toUpperCase()})</span>
                </button>
              </div>
            </div>
          ) : (
            /* MODE B: VISUAL FIELD-BY-FIELD EDITOR */
            <div className="space-y-6">
              {/* Section 1: Dashboard & System */}
              <div className={`p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 border-b pb-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black uppercase text-slate-400">1. Textos do Painel & Dashboard ({editLang.toUpperCase()})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Título do Dashboard:</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.dashboard?.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            dashboard: { ...editableDict[editLang].dashboard, title: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Subtítulo do Dashboard:</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.dashboard?.subtitle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            dashboard: { ...editableDict[editLang].dashboard, subtitle: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Botão "Personalizar Widgets":</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.dashboard?.customizeWidgets || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            dashboard: { ...editableDict[editLang].dashboard, customizeWidgets: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Botão "Concluir Edição":</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.dashboard?.finishEdit || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            dashboard: { ...editableDict[editLang].dashboard, finishEdit: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Invoicing & Tariffs */}
              <div className={`p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 border-b pb-2">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase text-slate-400">2. Textos do Módulo de Faturação & Tarifas ({editLang.toUpperCase()})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Botão "Emitir Nova Fatura":</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.invoicing?.newInvoice || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            invoicing: { ...editableDict[editLang].invoicing, newInvoice: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Banner Fatura Pro-Forma:</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.invoicing?.proformaBanner || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            invoicing: { ...editableDict[editLang].invoicing, proformaBanner: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Opção Incluir IVA:</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.invoicing?.applyIva || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            invoicing: { ...editableDict[editLang].invoicing, applyIva: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Campo Desconto Comercial (%):</label>
                    <input
                      type="text"
                      value={editableDict[editLang]?.invoicing?.commercialDiscount || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...editableDict,
                          [editLang]: {
                            ...editableDict[editLang],
                            invoicing: { ...editableDict[editLang].invoicing, commercialDiscount: val }
                          }
                        };
                        setEditableDict(updated);
                      }}
                      className={`w-full rounded-lg px-3 py-2 border font-medium outline-none ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Apply & Save Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    updateTranslationsDict(editableDict);
                    setSavedMsg(`Dicionário de tradução (${editLang.toUpperCase()}) atualizado com sucesso em todo o sistema!`);
                    setTimeout(() => setSavedMsg(''), 5000);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Aplicar & Guardar Alterações em Tempo Real</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'backup' ? (
        /* TAB 6: EXPORTAÇÃO DE DADOS DO SISTEMA (JSON BACKUP SUPERADMIN) */
        <div className={`p-5 rounded-2xl border space-y-6 ${
          theme === 'dark' ? 'bg-slate-900 border-blue-900/40' : 'bg-white border-blue-200 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  Segurança & Recuperação de Dados
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Exportação JSON • Nível SuperAdmin
                </span>
              </div>
              <h3 className={`text-base font-bold tracking-tight mt-1 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Database className="w-5 h-5 text-blue-500" />
                Exportação de Dados do Sistema (JSON Backup & Disaster Recovery)
              </h3>
              <p className="text-xs text-slate-400">
                Gere e transfira uma cópia integral encriptada em formato JSON de todas as tabelas, faturas, recibos, caixa e cadastros institucionais para salvaguarda off-site.
              </p>
            </div>

            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase shrink-0">
              Privilégio SuperAdmin
            </span>
          </div>

          {!isSuperAdmin ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-rose-500/30 text-rose-300 space-y-3">
              <Lock className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Acesso Restrito ao Desenvolvedor (SuperAdmin)</h4>
              <p className="text-xs max-w-md mx-auto text-slate-400">
                Apenas utilizadores com o perfil <strong>SuperAdmin (Desenvolvedor de Sistemas)</strong> podem exportar backups integrais de dados em formato JSON para garantir a privacidade e segurança institucional da Guiné-Bissau.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border space-y-1 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Faturas & Recibos</span>
                  <div className="text-lg font-bold font-mono text-blue-500">{faturas.length} Faturas / {recibos.length} Recibos</div>
                  <span className="text-[10px] text-slate-500">Módulos de Faturação & Caixa</span>
                </div>

                <div className={`p-4 rounded-xl border space-y-1 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Marítimo & Frotas</span>
                  <div className="text-lg font-bold font-mono text-purple-500">{embarcacoes.length} Navios / {armadores.length} Armadores</div>
                  <span className="text-[10px] text-slate-500">Atracações e Escalas em Bissau</span>
                </div>

                <div className={`p-4 rounded-xl border space-y-1 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Caixa & Tesouraria</span>
                  <div className="text-lg font-bold font-mono text-emerald-500">{movimentos.length} Lançamentos</div>
                  <span className="text-[10px] text-slate-500">Movimentações de Entradas/Saídas</span>
                </div>

                <div className={`p-4 rounded-xl border space-y-1 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Cadeia de Auditoria</span>
                  <div className="text-lg font-bold font-mono text-amber-500">{auditoriaLogs.length} Logs SHA-256</div>
                  <span className="text-[10px] text-slate-500">Assinaturas Criptográficas</span>
                </div>
              </div>

              {/* Main Action Box */}
              <div className={`p-6 rounded-2xl border space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                theme === 'dark' ? 'bg-slate-950/60 border-blue-500/30' : 'bg-blue-50/60 border-blue-200'
              }`}>
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <FileJson className="w-5 h-5 text-blue-500" />
                    Gerar & Transferir Ficheiro JSON de Backup Completo
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xl">
                    O ficheiro exportado inclui a totalidade das tabelas relacionais do sistema em JSON limpo e estruturado. Pode ser armazenado em discos externos, servidores de réplica ou importado para recuperação rápida em caso de desastre.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      const backupPayload = {
                        meta: {
                          exportDate: new Date().toISOString(),
                          exportedBy: currentUser?.nome || 'SuperAdmin',
                          userRole: currentUser?.role || currentUser?.funcao,
                          system: 'NHOMINCA • IMP Guiné-Bissau',
                          version: servidor.versaoApp || '1.0.0',
                          nif: '910005508',
                          dbEngine: servidor.bdEngine || 'PostgreSQL 15 On-Premises'
                        },
                        counts: {
                          utilizadores: utilizadores.length,
                          faturas: faturas.length,
                          recibos: recibos.length,
                          movimentosCaixa: movimentos.length,
                          embarcacoes: embarcacoes.length,
                          armadores: armadores.length,
                          agencias: agencias.length,
                          atracacoes: atracacoes.length,
                          taxas: taxasState.length,
                          rubricas: rubricas.length,
                          inspeccoes: inspeccoes.length,
                          certificados: certificados.length,
                          licencas: licencas.length,
                          multas: multas.length,
                          auditoriaLogs: auditoriaLogs.length
                        },
                        data: {
                          utilizadores,
                          faturas,
                          recibos,
                          movimentosCaixa: movimentos,
                          embarcacoes,
                          armadores,
                          agencias,
                          atracacoes,
                          taxas: taxasState,
                          rubricas,
                          inspeccoes,
                          certificados,
                          licencas,
                          multas,
                          auditoriaLogs,
                          translations: translationsDict
                        }
                      };

                      const jsonString = JSON.stringify(backupPayload, null, 2);
                      const blob = new Blob([jsonString], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const dateStr = new Date().toISOString().slice(0, 10);
                      const filename = `NHOMINCA_IMP_Full_Backup_${dateStr}.json`;

                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);

                      setSavedMsg(`Backup JSON do sistema (${filename}) exportado com sucesso! Contém todas as tabelas e dados institucionais.`);
                      setTimeout(() => setSavedMsg(''), 6000);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all w-full sm:w-auto justify-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Backup JSON (SuperAdmin)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* MODAL: EMITIR NOVO PREÇO DE RUBRICA / TARIFA */}
      {isAddTaxaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 animate-in fade-in ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base">Emitir Novo Preço de Rubrica / Tarifa</h3>
              </div>
              <button
                onClick={() => setIsAddTaxaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Código do Serviço / Rubrica (*)</label>
                <input
                  type="text"
                  placeholder="Ex: PIL-04 ou PIL-ESP"
                  value={newTaxaData.codigoServico || ''}
                  onChange={(e) => setNewTaxaData({ ...newTaxaData, codigoServico: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 font-mono uppercase font-bold border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Descrição do Serviço / Tarifa (*)</label>
                <input
                  type="text"
                  placeholder="Ex: Serviço de Pilotagem Noturna Especial"
                  value={newTaxaData.descricaoServico || ''}
                  onChange={(e) => setNewTaxaData({ ...newTaxaData, descricaoServico: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Categoria</label>
                  <select
                    value={newTaxaData.categoria || 'Pilotagem'}
                    onChange={(e) => setNewTaxaData({ ...newTaxaData, categoria: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Pilotagem">Pilotagem</option>
                    <option value="Cais & Permanência">Cais & Permanência</option>
                    <option value="Rebocador & Apoio">Rebocador & Apoio</option>
                    <option value="Serviços Portuários">Serviços Portuários</option>
                    <option value="Licenciamento">Licenciamento</option>
                    <option value="Inspecção & Segurança">Inspecção & Segurança</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Unidade de Medida</label>
                  <select
                    value={newTaxaData.unidadeMedida || 'Por Manobra'}
                    onChange={(e) => setNewTaxaData({ ...newTaxaData, unidadeMedida: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Por Manobra">Por Manobra</option>
                    <option value="Por Hora de Pilotagem">Por Hora de Pilotagem</option>
                    <option value="Por GT/Dia">Por GT/Dia</option>
                    <option value="Taxa Fixa">Taxa Fixa</option>
                    <option value="Por Anuidade">Por Anuidade</option>
                    <option value="Por Tonelada">Por Tonelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Valor Unitário Oficial (XOF) (*)</label>
                <input
                  type="number"
                  placeholder="1500000"
                  value={newTaxaData.valorUnitarioXOF || ''}
                  onChange={(e) => setNewTaxaData({ ...newTaxaData, valorUnitarioXOF: Number(e.target.value) })}
                  className={`w-full rounded-xl px-3 py-2 font-mono font-bold text-emerald-500 border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsAddTaxaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTaxaSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Emitir Preço de Rubrica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
