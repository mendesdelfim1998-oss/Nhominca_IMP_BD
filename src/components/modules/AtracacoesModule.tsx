import { useState, FormEvent } from 'react';
import { Anchor, Plus, Clock, RefreshCw } from 'lucide-react';
import { Atracacao, Embarcacao, PortoTerminal } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const getComputerCurrentDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getComputerFutureDateTime = (hoursAhead = 48) => {
  const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

interface AtracacoesModuleProps {
  atracacoes: Atracacao[];
  embarcacoes: Embarcacao[];
  portos: PortoTerminal[];
  onAddAtracacao: (atracacao: Atracacao) => void;
  onUpdateStatus: (id: string, newStatus: any) => void;
}

export function AtracacoesModule({ atracacoes, embarcacoes, portos, onAddAtracacao, onUpdateStatus }: AtracacoesModuleProps) {
  const { theme } = useTheme();
  const { tText, language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedEmbId, setSelectedEmbId] = useState(embarcacoes[0]?.id || '');
  const [selectedPortoId, setSelectedPortoId] = useState(portos[0]?.id || '');
  const [caisInput, setCaisInput] = useState(tText('Cais Principal - Posto 02'));
  const [etaInput, setEtaInput] = useState(() => getComputerCurrentDateTime());
  const [etdInput, setEtdInput] = useState(() => getComputerFutureDateTime(48));
  const [cargaInput, setCargaInput] = useState(tText('Contentores & Carga Geral'));
  const [toneladasInput, setToneladasInput] = useState(5000);

  const locale = language === 'pt' ? 'pt-PT' : language === 'fr' ? 'fr-FR' : 'en-US';
  const formatToneladas = (value: number) => new Intl.NumberFormat(locale).format(value);
  const formatDateTime = (value: string) => {
    const date = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleOpenModal = () => {
    // Sincroniza automaticamente com a data e hora atual do computador
    setEtaInput(getComputerCurrentDateTime());
    setEtdInput(getComputerFutureDateTime(48));
    setShowModal(true);
  };

  const handleCreateAtracacao = (evt: FormEvent) => {
    evt.preventDefault();
    const emb = embarcacoes.find(e => e.id === selectedEmbId);
    const porto = portos.find(p => p.id === selectedPortoId);

    if (!emb || !porto) return;

    const newAtr: Atracacao = {
      id: `ATR-${Date.now()}`,
      codigoEscala: `ESC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      embarcacaoId: emb.id,
      embarcacaoNome: emb.nome,
      agenciaNome: emb.agenciaNome,
      portoNome: porto.nomePorto,
      caisDesignado: caisInput,
      dataChegadaPrevista: etaInput,
      dataSaidaPrevista: etdInput,
      status: 'Anunciada',
      servicosSolicitados: ['Pilotagem', 'Rebocador', 'Amarraçao'],
      manifestoCarga: {
        tipoCarga: cargaInput,
        quantidadeToneladas: Number(toneladasInput),
        operacao: 'Descarga'
      }
    };

    onAddAtracacao(newAtr);
    setShowModal(false);
  };

  return (
    <div id="atracacoes-module" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Anchor className="w-5 h-5 text-blue-500" />
            {tText('Gestão de Escalas, Atracações & Pilotagem')}
          </h2>
          <p className={theme === 'dark' ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>
            {tText('Controle de manifesto de carga, entrada/saída de navios e alocação de cais')}
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          {tText('Anunciar Nova Chegada (ETA)')}
        </button>
      </div>

      {/* Escalas Grid / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {atracacoes.map((atr) => (
          <div
            key={atr.id}
            className={`p-5 rounded-2xl border space-y-4 transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-3 ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {atr.embarcacaoNome}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                      theme === 'dark'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {atr.codigoEscala}
                  </span>
                </div>
                <div className={`text-xs mt-1 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{atr.agenciaNome}</span>
                  <span>•</span>
                  <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{atr.portoNome}</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  atr.status === 'Em Operação'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : atr.status === 'Anunciada'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                }`}
              >
                {tText(atr.status)}
              </span>
            </div>

            <div
              className={`grid grid-cols-2 gap-3 text-xs font-mono p-3 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">{tText('Posto / Cais Alocado')}</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {atr.caisDesignado}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">{tText('Carga & Movimentação')}</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {formatToneladas(atr.manifestoCarga.quantidadeToneladas)} {tText('Ton')} ({tText(atr.manifestoCarga.operacao)})
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">{tText('ETA (Chegada)')}</span>
                <span className="text-emerald-500 font-bold">{formatDateTime(atr.dataChegadaPrevista)}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">{tText('ETD (Saída)')}</span>
                <span className="text-rose-500 font-bold">{formatDateTime(atr.dataSaidaPrevista)}</span>
              </div>
            </div>

            {/* Services badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 font-medium mr-1">{tText('Serviços')}:</span>
              {atr.servicosSolicitados.map((srv, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded border ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {tText(srv)}
                </span>
              ))}
            </div>

            {/* Quick Status Action Controls */}
            <div
              className={`pt-2 border-t flex items-center justify-between text-xs ${
                theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'
              }`}
            >
              <span className="text-slate-500">{tText('Alterar Estado Operacional')}:</span>
              <div className="flex items-center gap-1.5">
                {atr.status === 'Anunciada' && (
                  <button
                    onClick={() => onUpdateStatus(atr.id, 'Em Operação')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                  >
                    {tText('Confirmar Atracação')}
                  </button>
                )}
                {atr.status === 'Em Operação' && (
                  <button
                    onClick={() => onUpdateStatus(atr.id, 'Desatracada')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                  >
                    {tText('Registar Desatracação (Saída)')}
                  </button>
                )}
                {atr.status === 'Desatracada' && (
                  <span className="text-emerald-500 font-mono text-[11px] font-bold">{tText('Escala Concluída')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Anúncio de Escala */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Anchor className="w-5 h-5 text-blue-500" />
              {tText('Registar Anúncio de Chegada (ETA)')}
            </h3>

            <form onSubmit={handleCreateAtracacao} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">{tText('Selecionar Embarcação')}</label>
                <select
                  value={selectedEmbId}
                  onChange={(e) => setSelectedEmbId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {embarcacoes.map(e => (
                    <option key={e.id} value={e.id}>{e.nome} ({e.numeroIMO}) - {tText('Agência')}: {e.agenciaNome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">{tText('Porto de Destino')}</label>
                  <select
                    value={selectedPortoId}
                    onChange={(e) => setSelectedPortoId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {portos.map(p => (
                      <option key={p.id} value={p.id}>{p.nomePorto}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">{tText('Cais Designado')}</label>
                  <input
                    type="text"
                    value={caisInput}
                    onChange={(e) => setCaisInput(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-medium text-xs">
                      {tText('Data/Hora ETA (Chegada)')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setEtaInput(getComputerCurrentDateTime())}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      title={tText('Sincronizar com a data e hora atual do computador')}
                    >
                      <Clock className="w-3 h-3 text-blue-500" />
                      {tText('Agora (Computador)')}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={etaInput}
                    onChange={(e) => setEtaInput(e.target.value)}
                    placeholder={tText('YYYY-MM-DD HH:mm')}
                    className={`w-full rounded-xl px-3 py-2 border font-mono text-xs focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    {tText('Data atual do computador')}: {etaInput}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-medium text-xs">
                      {tText('Data/Hora ETD (Saída)')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setEtdInput(getComputerFutureDateTime(48))}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      title={tText('Calcular previsão de 48h a partir do computador')}
                    >
                      +48h
                    </button>
                  </div>
                  <input
                    type="text"
                    value={etdInput}
                    onChange={(e) => setEtdInput(e.target.value)}
                    placeholder={tText('YYYY-MM-DD HH:mm')}
                    className={`w-full rounded-xl px-3 py-2 border font-mono text-xs focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    {tText('Previsão de desatracação')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">{tText('Descrição Carga')}</label>
                  <input
                    type="text"
                    value={cargaInput}
                    onChange={(e) => setCargaInput(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-medium">{tText('Volume (Toneladas)')}</label>
                  <input
                    type="number"
                    value={toneladasInput}
                    onChange={(e) => setToneladasInput(Number(e.target.value))}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tText('Cancelar')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20"
                >
                  {tText('Submeter Anúncio de Escala')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
