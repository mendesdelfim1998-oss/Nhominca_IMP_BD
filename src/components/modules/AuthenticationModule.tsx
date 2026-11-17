import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { KeyRound, User, CheckCircle2, AlertCircle, History, Pencil, Camera, Clock } from 'lucide-react';
import { LogAcessoAutenticacao, Utilizador } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { resizeAvatarImage } from '../../utils/imageResize';

interface AuthenticationModuleProps {
  currentUser: Utilizador;
  logs: LogAcessoAutenticacao[];
  onSwitchUser: (role: string) => void;
  onUpdateUser?: (updated: Utilizador) => void;
  onClearLogs?: () => void;
}

export function AuthenticationModule({ currentUser, logs, onUpdateUser, onClearLogs }: AuthenticationModuleProps) {
  const { theme } = useTheme();
  const { tText } = useLanguage();
  const isDark = theme === 'dark';
  const userRole = (currentUser?.role || currentUser?.funcao || '').toLowerCase();
  const isAdminOrSuper = userRole === 'admin' || userRole === 'admin_imp' || userRole === 'superadmin';

  const [newPhoto, setNewPhoto] = useState(currentUser.avatar || currentUser.fotoUrl || '');
  const [newName, setNewName] = useState(currentUser.nome || '');
  const [newEmail, setNewEmail] = useState(currentUser.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editEnabled, setEditEnabled] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setNewPhoto(currentUser.avatar || currentUser.fotoUrl || '');
    setNewName(currentUser.nome || '');
    setNewEmail(currentUser.email || '');
  }, [currentUser]);

  const inputBase = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-200';
  const disabledCls = isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resizedBase64 = await resizeAvatarImage(file, 300);
      setNewPhoto(resizedBase64);
      setFeedback({ type: 'success', message: tText('Foto carregada. Clique em "Guardar alterações" para aplicar.') });
    } catch {
      setFeedback({ type: 'error', message: tText('Não foi possível processar a imagem selecionada.') });
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!onUpdateUser) return;
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (editEnabled) {
      if (!trimmedName) return setFeedback({ type: 'error', message: tText('Introduza o nome.') });
      if (!trimmedEmail || !trimmedEmail.includes('@')) return setFeedback({ type: 'error', message: tText('Introduza um e-mail válido.') });
    }
    if (passwordEnabled && (newPassword || confirmPassword)) {
      if (newPassword.length < 6) return setFeedback({ type: 'error', message: tText('A palavra-passe deve ter pelo menos 6 caracteres.') });
      if (newPassword !== confirmPassword) return setFeedback({ type: 'error', message: tText('As palavras-passe não coincidem.') });
    }

    const updated: Utilizador = {
      ...currentUser,
      nome: editEnabled ? trimmedName : currentUser.nome,
      email: editEnabled ? trimmedEmail : currentUser.email,
      avatar: newPhoto,
      fotoUrl: newPhoto,
      ...(passwordEnabled && newPassword ? { senha: newPassword } : {}),
    };

    try {
      onUpdateUser(updated);
      setFeedback({ type: 'success', message: tText('Dados atualizados com sucesso.') });
      if (editEnabled) setEditEnabled(false);
      if (passwordEnabled) {
        setPasswordEnabled(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setFeedback({ type: 'error', message: tText('Não foi possível guardar as alterações.') });
    }
  };

  return (
    <div id="authentication-module" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <KeyRound className="w-5 h-5 text-blue-500" />
            {tText('Autenticação, Gestão de Sessão & Controlo de Acesso')}
          </h2>
          <p className={`text-xs ${muted}`}>{tText('Gestão do perfil, sessão e segurança de acesso')}</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <form onSubmit={handleSave} className="space-y-5">
          {feedback && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-sm ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500' : 'bg-rose-500/10 border-rose-500/25 text-rose-500'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 pb-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500/30 bg-slate-200 flex items-center justify-center shrink-0">
                {newPhoto ? <img src={newPhoto} alt={currentUser.nome} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-500" />}
              </div>
              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'}`}>
                <Camera className="w-3.5 h-3.5" /> {tText('Foto')}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <div className="text-2xl font-bold leading-tight break-words">{currentUser.nome}</div>
                <div className={`mt-1 text-sm font-medium ${muted}`}>{currentUser.cargo || currentUser.departamento || currentUser.funcao || tText('Sem cargo definido')}</div>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{tText('Último acesso ao sistema')}:</span>
                <span className="font-mono text-xs sm:text-sm">{currentUser.ultimoAcesso || '—'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{tText('Dados da conta')}</div>
              <button
                type="button"
                onClick={() => {
                  setEditEnabled((v) => !v);
                  if (editEnabled) {
                    setNewName(currentUser.nome || '');
                    setNewEmail(currentUser.email || '');
                  }
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${editEnabled ? 'bg-blue-600 text-white border-blue-600' : isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'}`}
              >
                <Pencil className="w-3.5 h-3.5" /> {editEnabled ? tText('Alterações ativadas') : tText('Ativar alterações')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{tText('Nome')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  readOnly={!editEnabled}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${editEnabled ? inputBase : `${disabledCls} cursor-not-allowed`}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{tText('Email')}</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  readOnly={!editEnabled}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 font-mono ${editEnabled ? inputBase : `${disabledCls} cursor-not-allowed`}`}
                />
              </div>
            </div>
            {!editEnabled && <p className={`text-xs ${muted}`}>{tText('Nome e email estão visíveis, mas só podem ser modificados após ativar as alterações.')}</p>}
          </div>

          <div className="space-y-3">
            {!passwordEnabled ? (
              <button
                type="button"
                onClick={() => setPasswordEnabled(true)}
                className={`w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'}`}
              >
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>{tText('Palavra-passe')}</span>
              </button>
            ) : (
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold"><KeyRound className="w-4 h-4 text-amber-500" /> {tText('Alterar palavra-passe')}</div>
                  <button type="button" onClick={() => { setPasswordEnabled(false); setNewPassword(''); setConfirmPassword(''); }} className={`text-xs ${muted}`}>{tText('Cancelar')}</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{tText('Nova palavra-passe')}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={tText('Mínimo 6 caracteres')} className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${inputBase}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{tText('Confirmar palavra-passe')}</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={tText('Repita a palavra-passe')} className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${inputBase}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-1 flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">
              {tText('Guardar alterações')}
            </button>
          </div>
        </form>
      </div>

      {isAdminOrSuper && (
        <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <History className="w-4 h-4 text-amber-500" />
              {tText('Registos de Acesso & Auditoria (Audit Trail)')}
            </h3>
            {onClearLogs && (
              <button type="button" onClick={onClearLogs} className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/30">
                {tText('Limpar Registos')}
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs max-h-[360px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">{tText('Nenhum registo encontrado.')}</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex items-center justify-between font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{log.utilizadorNome}</span>
                    <span className="text-[10px] font-mono text-emerald-500">{log.acao}</span>
                  </div>
                  <div className={`text-[11px] font-mono flex justify-between ${muted}`}>
                    <span>📅 {log.dataHora}</span>
                    <span>IP: {log.ipOrigem}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{log.dispositivo}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
