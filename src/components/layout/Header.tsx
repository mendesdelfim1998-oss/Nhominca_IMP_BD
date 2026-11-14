import { useState, useRef, useEffect } from 'react';
import {
  Anchor,
  Globe,
  Search,
  Shield,
  User,
  Check,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Menu,
  Ship,
  Building2,
  FileText,
  X,
  ExternalLink
} from 'lucide-react';
import { Utilizador, IMP_INSTITUTIONAL, Embarcacao, Armador, FaturaIMP } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../i18n/translations';
import { useTheme } from '../../context/ThemeContext';
import { FlagIcon } from '../common/FlagIcon';

interface HeaderProps {
  currentUser: Utilizador;
  onSelectUserRole: (role: string) => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  onOpenMobileMenu?: () => void;
  embarcacoes?: Embarcacao[];
  armadores?: Armador[];
  faturas?: FaturaIMP[];
  onNavigate?: (moduleKey: string) => void;
}

export function Header({
  currentUser,
  onSelectUserRole,
  onLogout,
  onOpenProfile,
  onOpenMobileMenu,
  embarcacoes = [],
  armadores = [],
  faturas = [],
  onNavigate
}: HeaderProps) {
  const { language, setLanguage, t, tText } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter logic across Embarcações, Armadores, and Faturas
  const cleanQuery = searchQuery.trim().toLowerCase();

  const filteredEmbarcacoes = cleanQuery
    ? embarcacoes.filter(
        (e) =>
          e.nome?.toLowerCase().includes(cleanQuery) ||
          e.numeroIMO?.toLowerCase().includes(cleanQuery) ||
          e.bandeira?.toLowerCase().includes(cleanQuery) ||
          e.tipo?.toLowerCase().includes(cleanQuery) ||
          e.id?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredArmadores = cleanQuery
    ? armadores.filter(
        (a) =>
          a.nomeRazaoSocial?.toLowerCase().includes(cleanQuery) ||
          (a as any).nif?.toLowerCase().includes(cleanQuery) ||
          a.paisOrigem?.toLowerCase().includes(cleanQuery) ||
          a.contactoOficial?.toLowerCase().includes(cleanQuery) ||
          a.id?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredFaturas = cleanQuery
    ? faturas.filter(
        (f) =>
          f.nFatura?.toLowerCase().includes(cleanQuery) ||
          f.cliente?.toLowerCase().includes(cleanQuery) ||
          f.navio?.toLowerCase().includes(cleanQuery) ||
          f.nif?.toLowerCase().includes(cleanQuery) ||
          f.id?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = filteredEmbarcacoes.length + filteredArmadores.length + filteredFaturas.length;

  const handleSelectResult = (targetModule: string) => {
    if (onNavigate) {
      onNavigate(targetModule);
    }
    setIsSearchOpen(false);
  };

  const languages: { code: Language; label: string; short: string }[] = [
    { code: 'pt', label: 'Português', short: 'PT' },
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'en', label: 'English', short: 'EN' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr?.toLowerCase()) {
      case 'superadmin':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/30 font-bold">
            {tText('SUPERADMIN (DEV)')}
          </span>
        );
      case 'admin':
      case 'admin_imp':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30 font-bold">
            {tText('DIRETOR GERAL / PCA')}
          </span>
        );
      case 'faturacao':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold">
            {tText('FATURAÇÃO')}
          </span>
        );
      case 'caixa':
      case 'tesouraria':
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold">
            {tText('CAIXA')} / {tText('Tesouraria')}
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 border border-slate-500/30 font-bold">
            {roleStr?.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <header
      id="nhominca-header"
      className={`h-16 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors border-b w-full max-w-full ${
        theme === 'dark'
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Toggle Button - Placed at the very left on mobile for easy one-hand reach */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className={`p-2 rounded-xl lg:hidden border transition-all shrink-0 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Abrir Menu de Navegação"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div id="nhominca-brand" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Official Golden IMP Ship Helm Logo */}
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center p-0.5 shadow-md border shrink-0 ${
            theme === 'dark'
              ? 'bg-slate-900 border-blue-500/30 shadow-blue-900/30'
              : 'bg-white border-blue-200 shadow-slate-200'
          }`}>
            <img
              src="/assets/aistudio/images__2__12a47efd.jpg"
              alt="NHOMINCA - IMP Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span className={theme === 'dark' ? 'text-white' : 'text-slate-900 font-extrabold'}>
                NHOMINCA
              </span>
              <span className={`text-[9px] sm:text-[10px] uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded font-bold border shrink-0 ${
                theme === 'dark'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                V1.0 • IMP
              </span>
            </h1>
            <p className={`text-[10px] sm:text-[11px] truncate hidden md:block ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              República da Guiné-Bissau • NIF: 910005508
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

        {/* Global Interactive Search Bar with Floating Dropdown */}
        <div ref={searchContainerRef} className="relative hidden lg:block w-64 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder={t.header.searchPlaceholder || 'Pesquisar navios, armadores, faturas...'}
            className={`w-full rounded-xl pl-9 pr-8 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 border transition-all ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
            }`}
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer z-10"
              title="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Floating Dropdown Results */}
          {isSearchOpen && cleanQuery.length > 0 && (
            <div
              className={`absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl border p-2.5 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono font-bold uppercase border-b mb-2 border-slate-200 dark:border-slate-800 text-slate-400">
                <span>Resultados ({totalResults})</span>
                <span className="text-blue-500">Filtrado em Tempo Real</span>
              </div>

              {totalResults === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Category 1: Embarcações */}
                  {filteredEmbarcacoes.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-blue-500 uppercase font-mono">
                        <Ship className="w-3.5 h-3.5" />
                        <span>Embarcações ({filteredEmbarcacoes.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {filteredEmbarcacoes.slice(0, 4).map((emb) => (
                          <button
                            key={emb.id}
                            onClick={() => handleSelectResult('embarcacoes')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold truncate text-slate-900 dark:text-slate-100">
                                {emb.nome}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                <span>IMO: {emb.numeroIMO || 'N/D'}</span>
                                <span>•</span>
                                <span>{emb.tipo || 'Navio'}</span>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400">{emb.bandeira}</span>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Armadores */}
                  {filteredArmadores.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-purple-500 uppercase font-mono">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Armadores ({filteredArmadores.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {filteredArmadores.slice(0, 4).map((arm) => (
                          <button
                            key={arm.id}
                            onClick={() => handleSelectResult('armadores')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold truncate text-slate-900 dark:text-slate-100">
                                {arm.nomeRazaoSocial}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                <span>Origem: {arm.paisOrigem || 'Guiné-Bissau'}</span>
                                <span>•</span>
                                <span>{arm.tipoEntidade || 'Entidade'}</span>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Faturas */}
                  {filteredFaturas.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-emerald-500 uppercase font-mono">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Faturas IMP ({filteredFaturas.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {filteredFaturas.slice(0, 4).map((fat) => (
                          <button
                            key={fat.id}
                            onClick={() => handleSelectResult(currentUser?.role === 'caixa' ? 'tesouraria' : 'facturacao')}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-mono font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                                <span>{fat.nFatura}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                                  fat.estado === 'paga'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : fat.estado === 'confirmada'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                  {fat.estado}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                {fat.cliente} • {Number(fat.total).toLocaleString('pt-PT')} XOF
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-1.5 sm:p-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
            theme === 'dark'
              ? 'bg-slate-800/80 border-slate-700/80 text-yellow-400 hover:border-slate-600'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-blue-400'
          }`}
          title={theme === 'dark' ? 'Mudar para Tema Claro IMP' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Language Selector Dropdown with Official SVG Flags (Visible on all screens) */}
        <div className="relative shrink-0">
          <button
            id="btn-language-selector"
            type="button"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm border cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title={tText('Idioma')}
          >
            <FlagIcon language={language} className="w-5 h-3.5 shadow-xs" />
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">{currentLangObj.short}</span>
          </button>

          {langDropdownOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 border ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className={`px-2 py-1 text-[10px] font-mono font-semibold uppercase border-b mb-1 ${
                theme === 'dark' ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
              }`}>
                {tText('Idioma')} / Language
              </div>
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    language === item.code
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <FlagIcon language={item.code} className="w-5 h-3.5 shadow-xs" />
                    <span className="font-semibold text-xs">{item.label}</span>
                  </span>
                  {language === item.code && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Info & Click-to-Profile Avatar */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-3 border-l shrink-0 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {/* User Name on top, Role/Função below */}
          <div className="text-right hidden md:block">
            <div
              className={`text-xs font-bold leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              {currentUser?.nome || 'Sr. António Okica de Sá'}
            </div>
            <div className="mt-0.5 flex justify-end">
              {getRoleBadge(currentUser?.role || currentUser?.funcao || 'faturacao')}
            </div>
          </div>

          {/* User Avatar Button: Clicking opens Profile Modal */}
          <button
            id="user-avatar-btn"
            type="button"
            onClick={onOpenProfile}
            title="Clique para abrir e gerir o seu Perfil & Senha"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all overflow-hidden relative border cursor-pointer hover:ring-2 hover:ring-blue-500 shadow-sm shrink-0 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {currentUser?.fotoUrl || currentUser?.avatar ? (
              <img
                src={currentUser.avatar || currentUser.fotoUrl}
                alt={currentUser.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold">{(currentUser?.nome || 'S').charAt(0).toUpperCase()}</span>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border-2 ${
                theme === 'dark' ? 'border-slate-900' : 'border-white'
              } ${currentUser?.status === 'Inativo' ? 'bg-rose-500' : 'bg-emerald-500'}`}
              title={currentUser?.status === 'Inativo' ? 'Inativo' : 'Sessão Ativa'}
            />
          </button>

          {/* Dedicated Logout Button (Fechar Conta) */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Terminar Sessão (Fechar Conta)"
              className={`p-1.5 sm:p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer ${
                theme === 'dark'
                  ? 'text-rose-400 hover:text-white hover:bg-rose-600/20 border border-slate-800'
                  : 'bg-[#e01e37] hover:bg-rose-600 text-white border border-rose-600 shadow-rose-600/20'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
