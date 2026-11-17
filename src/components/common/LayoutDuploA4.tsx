import { useState, useEffect } from 'react';
import { IMP_INSTITUTIONAL } from '../../types';
import { GuineBissauCoatOfArms, IMPOfficialHelmEmblem } from './OfficialEmblems';
import {
  DocumentVerificationData,
  generateVerificationQRCode
} from '../../utils/qrCodeVerification';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { ShieldCheck, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface LayoutDuploA4Props {
  title: string;
  documentNumber: string;
  date: string;
  payerName: string;
  amount: number | string;
  amountInWords: string;
  description: string;
  paymentReference?: string;
  bank?: string;
  treasuryOfficial?: string;
  documentType?: 'recibo' | 'licenca' | 'cedula' | 'saida_canoa' | 'outro';
  validityDate?: string;
  vesselName?: string;
}

export function LayoutDuploA4({
  title,
  documentNumber,
  date,
  payerName,
  amount,
  amountInWords,
  description,
  paymentReference = 'ORABANK-818406',
  bank = 'ORABANK',
  treasuryOfficial = 'Álvaro Luis Da Silva',
  documentType = 'recibo',
  validityDate,
  vesselName
}: LayoutDuploA4Props) {
  const { tText, language } = useLanguage();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);

  const docYear = new Date(date || Date.now()).getFullYear() || 2026;
  const validationCode = `IMP-VAL-${(documentNumber || '0001').replace(/\D/g, '').padStart(4, '0')}-${docYear}`;

  const resolvedValidity =
    validityDate ||
    (documentType === 'licenca'
      ? tText('Válido por 1 Ano (Expirável)')
      : documentType === 'cedula'
      ? tText('Válido por 2 Anos (Registo Marítimo)')
      : documentType === 'saida_canoa'
      ? tText('Válido por 24 Horas (Travessia Portuária)')
      : tText('Quitação Definitiva (Sem Expiração)'));

  const verificationData: DocumentVerificationData = {
    documentId: documentNumber || '0001',
    documentType,
    documentTitle: title,
    payerName,
    amount,
    amountInWords,
    issueDate: date,
    validityDate: resolvedValidity,
    paymentReference,
    bank,
    vesselName,
    issuerName: treasuryOfficial,
    verificationCode: validationCode
  };

  useEffect(() => {
    generateVerificationQRCode(verificationData)
      .then(setQrCodeUrl)
      .catch((err) => {
        console.warn('Erro ao gerar QRCode de validação:', err);
      });
  }, [documentNumber, title, amount, paymentReference, validationCode, resolvedValidity, payerName]);

  const renderHalf = (copyType: 'CONTRIBUINTE' | 'IMPERIAL_ARQUIVO') => (
    <div
      className="p-4 border-2 border-slate-900 rounded-xl bg-white text-slate-950 space-y-2 relative shadow-xs flex flex-col justify-between"
      style={{
        height: 'calc(50% - 14px)',
        maxHeight: 'calc(50% - 14px)',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Tag for Copy Type */}
      <div className="absolute top-2 right-3 text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 z-10">
        {copyType === 'CONTRIBUINTE'
          ? tText('1ª VIA — CONTRIBUINTE (Quem Paga)')
          : tText('2ª VIA — IMP / ARQUIVO (Serviço)')}
      </div>

      {/* Official Institutional Header with Forced Vertical Center Alignment */}
      <div className="border-2 border-slate-900 p-2 rounded-lg flex items-center justify-between bg-slate-50/70 shrink-0 gap-3 min-h-[70px]">
        {/* Left: Enlarged IMP Nautical Helm Logo */}
        <div className="helm-emblem-container flex items-center justify-center shrink-0">
          <IMPOfficialHelmEmblem className="w-16 h-16 sm:w-18 sm:h-18 object-contain" />
        </div>

        {/* Center: Official State Text & Centered Coat of Arms */}
        <div className="flex-1 text-center px-1 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-900">
              {tText('REPÚBLICA DA')}
            </span>
            <div className="republic-emblem-container w-8 h-8 flex items-center justify-center shrink-0">
              <GuineBissauCoatOfArms className="w-7 h-7 object-contain inline-block" />
            </div>
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-900">
              {tText('GUINÉ-BISSAU')}
            </span>
          </div>
          <p className="text-[8.5px] font-bold uppercase text-slate-700 tracking-tight">
            {tText('MINISTÉRIO DOS TRANSPORTES, TELECOMUNICAÇÕES E ECONOMIA DIGITAL')}
          </p>
          <p className="text-[12px] font-black uppercase text-[#082B59] mt-0.5 tracking-tight">
            {IMP_INSTITUTIONAL.entity}
          </p>
          <p className="text-[8px] font-mono font-bold text-slate-500">
            NIF: {IMP_INSTITUTIONAL.nif} • {tText('Tesouraria Central, Porto de Bissau')}
          </p>
        </div>

        {/* Right: Real Verification QR Code */}
        <div
          onClick={() => setShowVerificationModal(true)}
          className="flex flex-col items-center justify-center shrink-0 pl-2 border-l border-slate-300 cursor-pointer group"
          title={tText('Clique para testar verificação pública e consultar detalhes da transação')}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={tText('QR Code de Validação Oficial')}
              className="w-13 h-13 object-contain border border-slate-300 rounded p-0.5 bg-white group-hover:ring-2 group-hover:ring-blue-500 transition-all"
            />
          ) : (
            <div className="w-13 h-13 bg-slate-100 rounded border border-slate-300 flex items-center justify-center font-mono text-[8px] text-slate-500">
              QR IMP
            </div>
          )}
          <span className="text-[7.5px] font-mono font-black text-blue-900 uppercase tracking-tighter mt-0.5 group-hover:underline">
            {tText('VALIDAÇÃO IMP')} 🔍
          </span>
          <span className="text-[6.5px] font-mono text-slate-500">
            {validationCode}
          </span>
        </div>
      </div>

      {/* Document Number, Title & Validity Ribbon */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <h3 className="font-mono font-black text-xs sm:text-sm tracking-wide text-slate-900 uppercase">
          {title} — Nº {documentNumber}
        </h3>
        <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-900 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold">
          <Calendar className="w-3 h-3 text-blue-600" />
          <span>{tText('Validade')}: {resolvedValidity}</span>
        </div>
      </div>

      {/* Narrative Description matching official IMP standard */}
      <div className="text-[11px] space-y-1 text-slate-900 leading-relaxed font-sans px-2 shrink-0">
        <p className="text-justify">
          {tText('Eu,')} <strong className="underline font-bold">{treasuryOfficial}</strong>
          , {tText('Responsável Principal da Tesouraria do IMP, recebi de')}{' '}
          <strong className="underline font-bold uppercase">
            {payerName || tText('[Nome do Requerente / Entidade]')}
          </strong>{' '}
          {tText('a Importância de')}{' '}
          <strong className="underline font-mono font-bold">
            {typeof amount === 'number'
              ? amount.toLocaleString(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'pt-PT')
              : amount}{' '}
            {tText('Francos Cfa')}
          </strong>{' '}
          <span className="font-serif italic">({amountInWords})</span> {tText('Ref. Pag. de')}{' '}
          <span className="font-mono font-bold">
            {paymentReference} ({bank})
          </span>{' '}
          {tText('referente a')}: <span className="font-bold underline">{description}</span>.
        </p>
      </div>

      {/* Date, Official Verification & Signatures */}
      <div className="flex items-end justify-between pt-1.5 px-2 text-xs shrink-0 mt-auto border-t border-slate-100">
        <div className="space-y-0.5">
          <div className="font-mono text-[10px] text-slate-700 font-semibold">
            {tText('Bissau')}, {date}
          </div>
          <div className="text-[8px] font-mono text-slate-500 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
            <span>{tText('Autenticado na Base de Dados Central do IMP')}</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[9px] font-bold uppercase text-slate-600 mb-2">
            {tText('Atentamente')}
            <br />
            {tText('O Chefe de Serviço de Tesouraria')}
          </div>
          <div className="border-t border-slate-900 pt-0.5 w-44 font-bold text-[10.5px] font-mono text-slate-900">
            {treasuryOfficial}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className="printable-dual-sheet printable-document printable-area bg-white p-2.5 w-full max-w-[198mm] h-[285mm] max-h-[285mm] mx-auto flex flex-col justify-between text-slate-950 font-sans box-border overflow-hidden"
        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
      >
        {/* TOP HALF */}
        {renderHalf('CONTRIBUINTE')}

        {/* CENTRAL CUT LINE (Borda Tracejada / Picotado Central) */}
        <div className="flex items-center gap-2 py-0.5 no-print-hide shrink-0 h-[22px] my-auto">
          <div className="flex-1 border-t-2 border-dashed border-rose-600"></div>
          <div className="text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-3 py-0.5 rounded-full border border-rose-300 shadow-xs uppercase tracking-wider whitespace-nowrap">
            {tText('✂️ LINHA DE CORTE CENTRAL (DESTACÁVEL) — QUEM PAGA LEVA A 1ª VIA / IMP FICA COM A 2ª VIA ✂️')}
          </div>
          <div className="flex-1 border-t-2 border-dashed border-rose-600"></div>
        </div>

        {/* BOTTOM HALF */}
        {renderHalf('IMPERIAL_ARQUIVO')}
      </div>

      {/* Screen Verification Modal (Triggered on QR Code Click or scan) */}
      {showVerificationModal && (
        <DocumentVerificationModal
          data={verificationData}
          onClose={() => setShowVerificationModal(false)}
        />
      )}
    </>
  );
}
