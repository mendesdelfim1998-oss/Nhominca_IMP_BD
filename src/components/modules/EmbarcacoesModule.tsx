import { useState, FormEvent } from 'react';
import {
  Ship,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  ArrowRight,
  Anchor,
  FileText,
  ShieldCheck,
  Receipt,
  X,
  Compass,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Embarcacao } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const TIPOS_EMBARCACAO_MARITIMA: string[] = [
  'Carga Geral',
  'Porta-Contentores',
  'Petroleiro',
  'Petroleiro / Químico',
  'Granelero',
  'Passageiros / Ferry',
  'Passageiros / Ferry / Catamarã',
  'Pesqueiro Industrial',
  'Pesqueiro Artesanal',
  'Pesqueiro',
  'Rebocador',
  'Rebocador / Apoio Portuário',
  'Ro-Ro / Carga Rolante',
  'Navio Gaseiro (GPL / GNL)',
  'Navio Frigorífico',
  'Barcaça / Pontão',
  'Navio Científico / Pesquisa',
  'Patrulha / Guarda Costeira',
  'Iate / Embarcação de Recreio',
  'Lancha de Serviço',
  'Outro (Especificar)'
];

interface EmbarcacoesModuleProps {
  embarcacoes: Embarcacao[];
  onAddEmbarcacao: (emb: Embarcacao) => void;
  onNavigate?: (module: string) => void;
}

export function EmbarcacoesModule({
  embarcacoes,
  onAddEmbarcacao,
  onNavigate
}: EmbarcacoesModuleProps) {
  const { theme } = useTheme();
  const { t, tText } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formIMO, setFormIMO] = useState('');
  const [formCallSign, setFormCallSign] = useState('');
  const [formBandeira, setFormBandeira] = useState('Guiné-Bissau');
  const [formTipo, setFormTipo] = useState<string>('Carga Geral');
  const [formTipoOutro, setFormTipoOutro] = useState('');
  const [formGT, setFormGT] = useState<number>(2500);
  const [formComprimento, setFormComprimento] = useState<number>(95.0);
  const [formCalado, setFormCalado] = useState<number>(5.5);
  const [formAno, setFormAno] = useState<number>(2020);
  const [formAgencia, setFormAgencia] = useState('Agência Marítima e Portuária da Guiné (AMPG)');
  const [formArmador, setFormArmador] = useState('Armador Registado IMP');

  // Success and Details Modals
  const [registeredSuccessEmb, setRegisteredSuccessEmb] = useState<Embarcacao | null>(null);
  const [selectedEmbDetalhes, setSelectedEmbDetalhes] = useState<Embarcacao | null>(null);

  const filtered = embarcacoes.filter((e) => {
    const matchSearch =
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.numeroIMO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.indicativoChamada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || e.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const handleCreate = (evt: FormEvent) => {
    evt.preventDefault();
    if (!formNome || !formIMO) return;

    // Resolve final vessel type (use custom text input if 'Outro (Especificar)')
    const tipoFinal =
      formTipo === 'Outro (Especificar)'
        ? (formTipoOutro.trim() || 'Embarcação Especial / Outro')
        : formTipo;

    const newEmb: Embarcacao = {
      id: `EMB-${Date.now().toString().slice(-6)}`,
      nome: formNome.trim(),
      numeroIMO: formIMO.trim().toUpperCase().startsWith('IMO')
        ? formIMO.trim().toUpperCase()
        : `IMO${formIMO.trim().toUpperCase()}`,
      indicativoChamada: (formCallSign.trim() || 'J5NEW').toUpperCase(),
      bandeira: formBandeira,
      portoRegisto: formBandeira === 'Guiné-Bissau' ? 'Porto de Bissau' : 'Estrangeiro',
      tipo: tipoFinal,
      tonelagemBruta: Number(formGT) || 500,
      comprimentoForaFora: Number(formComprimento) || 80.0,
      caladoMaximo: Number(formCalado) || 5.0,
      anoConstrucao: Number(formAno) || 2020,
      armadorId: 'ARM-101',
      armadorNome: formArmador,
      agenciaId: 'AGE-201',
      agenciaNome: formAgencia,
      statusCertificacao: 'Válida'
    };

    onAddEmbarcacao(newEmb);
    setShowModal(false);
    setRegisteredSuccessEmb(newEmb);

    // Reset form
    setFormNome('');
    setFormIMO('');
    setFormCallSign('');
    setFormTipo('Carga Geral');
    setFormTipoOutro('');
    setFormGT(2500);
  };

  return (
    <div id="embarcacoes-module" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Ship className="w-5 h-5 text-blue-500" />
            {tText('Registo Marítimo de Embarcações')}
          </h2>
          <p className={theme === 'dark' ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>
            {tText('Cadastro oficial de navios nacionais e internacionais, IMO, tonelagem e certidões no IMP')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {tText('Registar Nova Embarcação')}
        </button>
      </div>

      {/* Filters Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tText('Buscar por Nome, IMO, Call Sign ou Tipo...')}
            className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs border focus:outline-none focus:border-blue-500 ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-blue-500 w-full sm:w-auto ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="TODOS">{tText('Todos os Tipos de Embarcação')} ({embarcacoes.length})</option>
            {TIPOS_EMBARCACAO_MARITIMA.filter(tp => tp !== 'Outro (Especificar)').map((tipo) => (
              <option key={tipo} value={tipo}>
                {tText(tipo)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vessels Table */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b uppercase font-mono text-[10px] ${
                theme === 'dark'
                  ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <tr>
                <th className="py-3 px-4">{tText('Embarcação / Identificação')}</th>
                <th className="py-3 px-4">{tText('IMO & Call Sign')}</th>
                <th className="py-3 px-4">{tText('Tipo & Bandeira')}</th>
                <th className="py-3 px-4">{tText('Tonelagem (GT)')}</th>
                <th className="py-3 px-4">{tText('Agência Representante')}</th>
                <th className="py-3 px-4">{tText('Certificação')}</th>
                <th className="py-3 px-4 text-right">{tText('Ações')}</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {tText('Nenhuma embarcação encontrada com os filtros selecionados.')}
                  </td>
                </tr>
              ) : (
                filtered.map((emb) => (
                  <tr
                    key={emb.id}
                    className={`transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                          <Ship className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {emb.nome}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tText('ID')}: {emb.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-blue-500 dark:text-blue-400">
                        {emb.numeroIMO}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {tText('Call Sign')}: {emb.indicativoChamada}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {tText(emb.tipo)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tText(emb.bandeira)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {emb.tonelagemBruta?.toLocaleString()} GT
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {emb.agenciaNome}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          emb.statusCertificacao === 'Válida'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : emb.statusCertificacao === 'Pendente'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}
                      >
                        {tText(emb.statusCertificacao)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmbDetalhes(emb)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                          theme === 'dark'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {tText('Ficha Técnica')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Registar Nova Embarcação */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {tText('Registar Embarcação no IMP')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tText('Insira os dados técnicos e certidões conforme o regulamento marítimo')}
                  </p>
                </div>
              </div>

              {/* Botão de Fechar X destacado */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-colors"
                title={tText('Fechar modal')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {tText('Nome da Embarcação')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder={tText('Ex: MV Bissau Star / BAF-DJOLA 2')}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {tText('Número IMO')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formIMO}
                    onChange={(e) => setFormIMO(e.target.value)}
                    placeholder={tText('Ex: 991283 ou IMO991283')}
                    className={`w-full rounded-xl px-3 py-2 border font-mono focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{tText('Indicativo / Call Sign')}</label>
                  <input
                    type="text"
                    value={formCallSign}
                    onChange={(e) => setFormCallSign(e.target.value)}
                    placeholder={tText('Ex: J5AB1')}
                    className={`w-full rounded-xl px-3 py-2 border font-mono uppercase focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{tText('Bandeira / Registo')}</label>
                  <input
                    type="text"
                    value={formBandeira}
                    onChange={(e) => setFormBandeira(e.target.value)}
                    placeholder={tText('Ex: Guiné-Bissau / Panamá')}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{tText('Tonelagem Bruta (GT)')}</label>
                  <input
                    type="number"
                    min={1}
                    value={formGT}
                    onChange={(e) => setFormGT(Number(e.target.value))}
                    className={`w-full rounded-xl px-3 py-2 border font-mono focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Tipo de Embarcação com Lista Completa e Opção 'Outro' */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {tText('Tipo de Embarcação')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {TIPOS_EMBARCACAO_MARITIMA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tText(tipo)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {tText('Selecione o tipo oficial. Se o tipo do navio não constar na lista, escolha "Outro (Especificar)".')}
                </p>
              </div>

              {/* Campo para o utilizador escrever o tipo caso tenha selecionado 'Outro (Especificar)' */}
              {formTipo === 'Outro (Especificar)' && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5 animate-fadeIn">
                  <label className="block text-blue-400 font-semibold text-xs">
                    {tText('Escreva o Tipo de Embarcação Personalizado')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTipoOutro}
                    onChange={(e) => setFormTipoOutro(e.target.value)}
                    placeholder={tText('Ex: Draga de Sucção, Plataforma Offshore, Canoa Auxiliar, Catamarã de Pesquisa...')}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-blue-500/40 text-white placeholder-slate-500'
                        : 'bg-white border-blue-300 text-slate-900 placeholder-slate-400'
                    }`}
                    autoFocus
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{tText('Comprimento Fora a Fora (m)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formComprimento}
                    onChange={(e) => setFormComprimento(Number(e.target.value))}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{tText('Calado Máximo (m)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formCalado}
                    onChange={(e) => setFormCalado(Number(e.target.value))}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl font-medium transition-colors bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  {tText('Sair / Cancelar')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2"
                >
                  <Ship className="w-4 h-4" />
                  {tText('Gravar Registo no IMP')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirmação Profissional de Registo & Próximos Passos Operacionais */}
      {registeredSuccessEmb && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRegisteredSuccessEmb(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header com X de Fechar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-500 font-bold">
                    {tText('Registo Oficial Concluído')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {registeredSuccessEmb.nome}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setRegisteredSuccessEmb(null)}
                className="w-8 h-8 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-colors"
                title={tText('Fechar')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Resumida do Navio */}
            <div
              className={`p-4 rounded-xl border text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 ${
                theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Registo IMP')}</span>
                <span className="font-mono font-bold text-blue-500">{registeredSuccessEmb.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Número IMO')}</span>
                <span className="font-mono font-bold">{registeredSuccessEmb.numeroIMO}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Call Sign')}</span>
                <span className="font-mono font-bold">{registeredSuccessEmb.indicativoChamada}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Tonelagem')}</span>
                <span className="font-mono font-bold">{registeredSuccessEmb.tonelagemBruta.toLocaleString()} GT</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Tipo de Navio')}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{tText(registeredSuccessEmb.tipo)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">{tText('Bandeira / Porto')}</span>
                <span className="font-semibold">{tText(registeredSuccessEmb.bandeira)} ({tText(registeredSuccessEmb.portoRegisto)})</span>
              </div>
            </div>

            {/* O Que Acontece Num Sistema Marítimo Profissional */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <Anchor className="w-3.5 h-3.5 text-blue-500" />
                {tText('Fluxo Operacional Portuário (Próximos Passos)')}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tText('Num sistema profissional da autoridade marítima (IMP), logo após a matrícula do navio, o operador pode avançar diretamente para as seguintes operações:')}
              </p>

              {/* Botões de Ação Direta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {onNavigate ? (
                  <>
                    <button
                      onClick={() => {
                        setRegisteredSuccessEmb(null);
                        onNavigate('atracacoes');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all hover:border-blue-500 hover:scale-[1.02] flex flex-col justify-between group ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1.5">
                          <Anchor className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-500 block uppercase">{tText('1. Operação Portuária')}</span>
                        <span className="text-xs font-bold block text-slate-200 dark:text-white">{tText('Registar Escala / ETA')}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-blue-400 font-semibold gap-1 mt-2">
                        <span>{tText('Atracar')}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setRegisteredSuccessEmb(null);
                        onNavigate('inspeccoes');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all hover:border-amber-500 hover:scale-[1.02] flex flex-col justify-between group ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-500 block uppercase">{tText('2. Vistoria / PSC')}</span>
                        <span className="text-xs font-bold block text-slate-200 dark:text-white">{tText('Inspeção de Segurança')}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-amber-400 font-semibold gap-1 mt-2">
                        <span>{tText('Vistoriar')}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setRegisteredSuccessEmb(null);
                        onNavigate('facturacao');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all hover:border-emerald-500 hover:scale-[1.02] flex flex-col justify-between group ${
                        theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 block uppercase">{tText('3. Finanças & Taxas')}</span>
                        <span className="text-xs font-bold block text-slate-200 dark:text-white">{tText('Emitir Fatura Portuária')}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-emerald-400 font-semibold gap-1 mt-2">
                        <span>{tText('Faturar')}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRegisteredSuccessEmb(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {tText('Permanecer no Registo')}
              </button>
              <button
                type="button"
                onClick={() => setRegisteredSuccessEmb(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20"
              >
                {tText('Concluir Registo')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Ficha Técnica Completa da Embarcação */}
      {selectedEmbDetalhes && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmbDetalhes(null);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {tText('Ficha Técnica Marítima')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tText('Registo Oficial de Matrícula IMP - República da Guiné-Bissau')}
                  </p>
                </div>
              </div>

              {/* Botão de Fechar X destacado */}
              <button
                type="button"
                onClick={() => setSelectedEmbDetalhes(null)}
                className="w-8 h-8 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition-colors"
                title={tText('Fechar ficha')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vessel Data */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div>
                  <span className="text-xs text-blue-400 font-mono block">{tText('Nome Oficial')}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{selectedEmbDetalhes.nome}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  selectedEmbDetalhes.statusCertificacao === 'Válida'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}>
                  {tText(selectedEmbDetalhes.statusCertificacao)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Número IMO')}</span>
                  <span className="font-mono font-bold text-sm text-blue-400">{selectedEmbDetalhes.numeroIMO}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Indicativo (Call Sign)')}</span>
                  <span className="font-mono font-bold text-sm">{selectedEmbDetalhes.indicativoChamada}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Tipo de Navio')}</span>
                  <span className="font-semibold">{tText(selectedEmbDetalhes.tipo)}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Bandeira')}</span>
                  <span className="font-semibold">{tText(selectedEmbDetalhes.bandeira)}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Tonelagem Bruta (GT)')}</span>
                  <span className="font-bold">{selectedEmbDetalhes.tonelagemBruta?.toLocaleString()} GT</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40">
                  <span className="text-[10px] text-slate-400 block font-mono">{tText('Dimensões (LOA / Calado)')}</span>
                  <span className="font-medium">{selectedEmbDetalhes.comprimentoForaFora}m / {selectedEmbDetalhes.caladoMaximo}m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-700/40 bg-slate-950/40 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono">{tText('Agência Marítima Credenciada')}</span>
                <span className="font-semibold">{selectedEmbDetalhes.agenciaNome}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEmbDetalhes(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {tText('Fechar Ficha')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
