import {
  CheckCircle2,
  ShieldCheck,
  X,
  Copy,
  Check,
  Printer,
  Calendar,
  CreditCard,
  User,
  Ship,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { DocumentVerificationData, buildVerificationUrl } from '../../utils/qrCodeVerification';
import { GuineBissauCoatOfArms, IMPOfficialHelmEmblem } from './OfficialEmblems';
import { IMP_INSTITUTIONAL } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface DocumentVerificationModalProps {
  data: DocumentVerificationData;
  onClose: () => void;
}

export function DocumentVerificationModal({ data, onClose }: DocumentVerificationModalProps) {
  const { tText } = useLanguage();
  const [copied, setCopied] = useState(false);
  const verificationUrl = buildVerificationUrl(data);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedAmount =
    typeof data.amount === 'number'
      ? data.amount.toLocaleString('pt-PT')
      : Number(data.amount).toLocaleString('pt-PT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Institucional */}
        <div className="bg-[#082B59] text-white p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <IMPOfficialHelmEmblem className="w-12 h-12 object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                  REPÚBLICA DA
                </span>
                <GuineBissauCoatOfArms className="w-5 h-5 object-contain" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                  GUINÉ-BISSAU
                </span>
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight text-white mt-0.5">
                {IMP_INSTITUTIONAL.entity}
              </h2>
              <p className="text-[10px] text-blue-300 font-mono">
                {tText('Portal Oficial de Validação e Autenticidade Digital')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-blue-900/60 hover:bg-blue-800 rounded-xl transition-colors cursor-pointer"
            title={tText('Fechar')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status de Autenticação */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                {tText('Documento Autêntico e Válido')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono text-[9px] font-bold">
                {tText('REGISTO OFICIAL IMP')}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              {tText('Certificado autêntico verificado na Base de Dados Central da Tesouraria e Capitania do IMP.')}
            </p>
          </div>
        </div>

        {/* Detalhes Completos da Transação */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] bg-slate-50/50">
          {/* Cartão de Título e ID */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                {tText('Tipo & Número do Documento')}
              </span>
              <div className="text-sm font-black text-slate-900 uppercase mt-0.5">
                {data.documentTitle}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                {tText('Identificador Único')}
              </span>
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-mono font-black text-xs rounded-lg inline-block mt-0.5">
                {data.documentId}
              </span>
            </div>
          </div>

          {/* Grid de Informações Chave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Quem Pagou */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{tText('Quem Pagou / Titular')}:</span>
              </div>
              <div className="font-black text-slate-900 text-sm uppercase">
                {data.payerName}
              </div>
              {data.vesselName && (
                <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
                  <Ship className="w-3 h-3 text-slate-400" />
                  <span>{tText('Embarcação/Canoa')}: <strong>{data.vesselName}</strong></span>
                </div>
              )}
            </div>

            {/* Quanto Pagou */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tText('Quanto Pagou (Valor Liquidado)')}:</span>
              </div>
              <div className="font-mono font-black text-emerald-700 text-base">
                {formattedAmount} XOF
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {tText('Francos CFA (Moeda Oficial)')}
              </div>
            </div>

            {/* Validade */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{tText('Validade do Documento')}:</span>
              </div>
              <div className="font-bold text-slate-900 text-xs">
                {data.validityDate}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {tText('Emitido em')}: {data.issueDate}
              </div>
            </div>

            {/* Banco e Referência */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>{tText('Comprovativo / Banco')}:</span>
              </div>
              <div className="font-mono font-bold text-slate-900 text-xs truncate">
                {data.paymentReference || 'TESOURARIA-IMP'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {tText('Banco')}: {data.bank || 'ORABANK'}
              </div>
            </div>
          </div>

          {/* Código de Verificação e Carimbo Criptográfico */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-[10px]">
            <div>
              <span className="text-slate-400 uppercase block text-[8px]">{tText('Hash / Código de Validação')}:</span>
              <span className="text-slate-800 font-bold">
                {data.verificationCode || `IMP-AUTH-${data.documentId}-SEC2026`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase block text-[8px]">{tText('Responsável')}:</span>
              <span className="text-slate-700 font-bold">{data.issuerName || tText('Tesouraria IMP')}</span>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? tText('Link Copiado!') : tText('Copiar Link de Verificação')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#082B59] hover:bg-[#061e3f] text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {tText('Concluir & Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}
