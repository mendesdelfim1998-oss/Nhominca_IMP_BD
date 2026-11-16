import React, { useEffect, useRef, useState, FormEvent, ChangeEvent } from 'react';
import { X, CheckCircle2, AlertCircle, User, KeyRound, Pencil, Camera } from 'lucide-react';
import { Utilizador } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { resizeAvatarImage } from '../../utils/imageResize';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Utilizador;
  onUpdateUser: (updatedUser: Utilizador) => void;
  initialSection?: 'photo' | 'email' | 'password' | null;
}

export function ProfileModal({ isOpen, onClose, currentUser, onUpdateUser, initialSection = null }: ProfileModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [newPhoto, setNewPhoto] = useState(currentUser.avatar || currentUser.fotoUrl || '');
  const [newName, setNewName] = useState(currentUser.nome || '');
  const [newEmail, setNewEmail] = useState(currentUser.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editEnabled, setEditEnabled] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return;
    setFeedback(null);
    setNewPhoto(currentUser.avatar || currentUser.fotoUrl || '');
    setNewName(currentUser.nome || '');
    setNewEmail(currentUser.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setEditEnabled(false);
    setPasswordEnabled(initialSection === 'password');
  }, [isOpen, initialSection, currentUser]);

  if (!isOpen) return null;

  const shellCls = isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
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
      setFeedback({ type: 'success', message: 'Foto carregada. Clique em "Guardar alterações" para aplicar.' });
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível processar a imagem selecionada.' });
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedName) return setFeedback({ type: 'error', message: 'Introduza o nome.' });
    if (!trimmedEmail || !trimmedEmail.includes('@')) return setFeedback({ type: 'error', message: 'Introduza um e-mail válido.' });

    if (passwordEnabled && (newPassword || confirmPassword)) {
      if (newPassword.length < 6) return setFeedback({ type: 'error', message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
      if (newPassword !== confirmPassword) return setFeedback({ type: 'error', message: 'As palavras-passe não coincidem.' });
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
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' });
      if (passwordEnabled && newPassword) {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordEnabled(false);
      }
      if (editEnabled) setEditEnabled(false);
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível guardar as alterações.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden ${shellCls}`} onClick={(e) => e.stopPropagation()}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <h2 className="text-lg font-bold">Meu Perfil</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {feedback && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-sm ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500' : 'bg-rose-500/10 border-rose-500/25 text-rose-500'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className={`flex items-start gap-4 sm:gap-5 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-blue-500/30 bg-slate-200 flex items-center justify-center shrink-0">
                {newPhoto ? <img src={newPhoto} alt="Foto de perfil" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-500" />}
              </div>
              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'}`}>
                <Camera className="w-3.5 h-3.5" /> Foto
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <div className="min-w-0 pt-1">
              <div className="text-xl sm:text-2xl font-bold leading-tight break-words">{currentUser.nome}</div>
              <div className={`mt-1 text-sm font-medium ${muted}`}>{currentUser.cargo || currentUser.departamento || currentUser.funcao || 'Sem cargo definido'}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Dados da conta</div>
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
                <Pencil className="w-3.5 h-3.5" /> {editEnabled ? 'Alterações ativadas' : 'Ativar alterações'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  readOnly={!editEnabled}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${editEnabled ? inputBase : `${disabledCls} cursor-not-allowed`}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  readOnly={!editEnabled}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 font-mono ${editEnabled ? inputBase : `${disabledCls} cursor-not-allowed`}`}
                />
              </div>
            </div>
            {!editEnabled && <p className={`text-xs ${muted}`}>Nome e email estão visíveis, mas só podem ser modificados após ativar as alterações.</p>}
          </div>

          <div className="space-y-3">
            {!passwordEnabled ? (
              <button
                type="button"
                onClick={() => setPasswordEnabled(true)}
                className={`w-full sm:w-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-50'}`}
              >
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Password</span>
              </button>
            ) : (
              <div className={`rounded-xl border p-4 space-y-3 ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold"><KeyRound className="w-4 h-4 text-amber-500" /> Alterar palavra-passe</div>
                  <button type="button" onClick={() => { setPasswordEnabled(false); setNewPassword(''); setConfirmPassword(''); }} className={`text-xs ${muted}`}>Cancelar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nova palavra-passe</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${inputBase}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Confirmar palavra-passe</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a palavra-passe" className={`w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none focus:ring-4 ${inputBase}`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold">
              Guardar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
