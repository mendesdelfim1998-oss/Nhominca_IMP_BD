import { useState, FormEvent } from 'react';
import { FileCheck2, Plus, Search, Printer, X, ShieldCheck, Award, Building2 } from 'lucide-react';
import { LicencaNavegacao, IMP_INSTITUTIONAL } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { GuineBissauCoatOfArms } from '../common/OfficialEmblems';
import { DualA4Document } from '../common/DualA4Document';

interface LicencasModuleProps {
  licencas: LicencaNavegacao[];
  onAddLicenca: (licenca: LicencaNavegacao) => void;
}

type EmissionType = 'licenca' | 'cedula' | 'dominio';

export function LicencasModule({ licencas, onAddLicenca }: LicencasModuleProps) {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titular: '',
    tipoActividade: 'Transporte de Passageiros' as LicencaNavegacao['tipoActividade']
  });

  // Dual-Copy Document Emission Modal States
  const [activeEmissionType, setActiveEmissionType] = useState<EmissionType | null>(null);
  const [emissionForm, setEmissionForm] = useState({
    requerente: '',
    nif: '500987654',
    referenciaPagamento: 'ORABANK-818406',
    importanciaXOF: '40.100',
    descricao: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    responsavelTesouraria: 'Álvaro Luis Da Silva'
  });
  const [showEmissionPreview, setShowEmissionPreview] = useState(false);

  const filtered = licencas.filter(l =>
    l.numeroLicenca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.titular.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().split('T')[0];
    const exp = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    onAddLicenca({
      id: `LIC-${Date.now().toString().slice(-4)}`,
      numeroLicenca: `LIC-NAV-2026/${(licencas.length + 10).toString().padStart(3, '0')}`,
      titular: formData.titular || 'Empresa Marítima Guineense',
      tipoActividade: formData.tipoActividade,
      dataConcessao: now,
      dataValidade: exp,
      status: 'Válida'
    });
    setShowModal(false);
  };

  const handleOpenEmission = (type: EmissionType) => {
    setActiveEmissionType(type);
    let defaultDesc = '';
    if (type === 'licenca') defaultDesc = 'Licença de Actividade de Navegação / Cabotagem';
    if (type === 'cedula') defaultDesc = 'Cédula de Inscrição Marítima';
    if (type === 'dominio') defaultDesc = 'Espaço no Domínio Público Marítimo';

    setEmissionForm({
      requerente: '',
      nif: '500987654',
      referenciaPagamento: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      importanciaXOF: '50.000',
      descricao: defaultDesc,
      dataEmissao: new Date().toISOString().split('T')[0],
      responsavelTesouraria: 'Álvaro Luis Da Silva'
    });
    setShowEmissionPreview(true);
  };

  const getEmissionTitle = () => {
    if (activeEmissionType === 'licenca') return 'EMISSÃO DE LICENÇA (Duplo A4)';
    if (activeEmissionType === 'cedula') return 'EMISSÃO DE CÉDULA MARÍTIMA (Duplo A4)';
    if (activeEmissionType === 'dominio') return 'EMISSÃO DE DOMÍNIO PÚBLICO (Duplo A4)';
    return 'Emissão Oficial';
  };

  return (
    <div id="licencas-module" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <FileCheck2 className="w-5 h-5 text-blue-500" />
            Licenças de Navegação, Cédulas & Domínio Público
          </h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Emissão de licenças, cédulas marítimas e concessões de domínio público em formato duplo (com linha de corte)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenEmission('licenca')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Award className="w-4 h-4" />
            EMISSÃO DE LICENÇA
          </button>
          <button
            onClick={() => handleOpenEmission('cedula')}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20"
          >
            <ShieldCheck className="w-4 h-4" />
            EMISSÃO DE CÉDULA MARÍTIMA
          </button>
          <button
            onClick={() => handleOpenEmission('dominio')}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Building2 className="w-4 h-4" />
            DOMÍNIO PÚBLICO
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
        theme === 'dark'
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por número da licença ou empresa titular..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`bg-transparent text-xs focus:outline-none w-full ${
            theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((lic) => (
          <div
            key={lic.id}
            className={`p-5 rounded-2xl border space-y-4 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200/90 hover:border-blue-300 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                  {lic.numeroLicenca}
                </span>
                <h3 className={`font-bold text-base mt-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>{lic.titular}</h3>
                <p className={`text-xs font-semibold mt-0.5 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>Actividade: {lic.tipoActividade}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                lic.status === 'Válida'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                {lic.status}
              </span>
            </div>

            <div className={`space-y-1.5 text-xs font-mono p-3 rounded-xl border ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>DATA CONCESSÃO:</span>
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{lic.dataConcessao}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>DATA VALIDADE:</span>
                <span className="text-blue-500 font-bold">{lic.dataValidade}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Emissão Licença Tradicional */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Emitir Licença de Navegação
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Empresa / Titular Requerente
                </label>
                <input
                  type="text"
                  required
                  value={formData.titular}
                  onChange={e => setFormData({ ...formData, titular: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="Ex: Companhia Fluvial das Bijagós"
                />
              </div>
              <div>
                <label className={`block mb-1 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Tipo de Actividade Marítima
                </label>
                <select
                  value={formData.tipoActividade}
                  onChange={e => setFormData({ ...formData, tipoActividade: e.target.value as any })}
                  className={`w-full rounded-xl px-3 py-2 border outline-none ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Transporte de Passageiros">Transporte de Passageiros e Ferry</option>
                  <option value="Pesca Comercial">Pesca Comercial Nacional</option>
                  <option value="Tráfego Local / Cabotagem">Tráfego Local / Cabotagem Fluvial</option>
                  <option value="Serviços Portuários">Serviços Portuários e Rebocadores</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20"
                >
                  Conceder Licença
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Emissão Duplo A4 (Licença, Cédula ou Domínio Público) com Linha de Corte */}
      {showEmissionPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 border rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            {/* Header com botões de fechar e imprimir */}
            <div className="flex items-center justify-between pb-3 border-b no-print">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider">
                  Formato Oficial Duplo A4 (Picotado / Cortável)
                </span>
                <h3 className="text-lg font-bold text-slate-900">{getEmissionTitle()}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Duplo (A4)
                </button>
                <button
                  onClick={() => setShowEmissionPreview(false)}
                  className="w-8 h-8 rounded-lg bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formulário de Configuração Rápida (Não aparece na impressão) */}
            <div className="p-3 bg-slate-50 border rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs no-print">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nome do Titular / Requerente</label>
                <input
                  type="text"
                  value={emissionForm.requerente}
                  onChange={(e) => setEmissionForm({ ...emissionForm, requerente: e.target.value })}
                  placeholder="Ex: Gueye Maissa / Ana Lúcia"
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Valor (XOF / Francos Cfa)</label>
                <input
                  type="text"
                  value={emissionForm.importanciaXOF}
                  onChange={(e) => setEmissionForm({ ...emissionForm, importanciaXOF: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Referência / Banco</label>
                <input
                  type="text"
                  value={emissionForm.referenciaPagamento}
                  onChange={(e) => setEmissionForm({ ...emissionForm, referenciaPagamento: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            {/* PRINTABLE DUAL A4 SHEET CONTAINER */}
            <div className="printable-dual-sheet bg-white p-4 border rounded-xl shadow-inner font-sans">
              <DualA4Document
                title={
                  activeEmissionType === 'licenca'
                    ? 'LICENÇA DE ACTIVIDADE MARÍTIMA'
                    : activeEmissionType === 'cedula'
                    ? 'CÉDULA DE INSCRIÇÃO MARÍTIMA'
                    : 'CONCESSÃO DE DOMÍNIO PÚBLICO MARÍTIMO'
                }
                documentNumber={String(Math.floor(1000 + Math.random() * 9000))}
                date={emissionForm.dataEmissao}
                payerName={emissionForm.requerente}
                amount={emissionForm.importanciaXOF}
                amountInWords="Cinquenta Mil Francos Cfa"
                description={emissionForm.descricao}
                paymentReference={emissionForm.referenciaPagamento}
                bank="ORABANK / CORIS"
                treasuryOfficial={emissionForm.responsavelTesouraria}
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-3 border-t no-print">
              <button
                onClick={() => setShowEmissionPreview(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Concluir / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
