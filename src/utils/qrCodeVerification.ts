import QRCode from 'qrcode';

export interface DocumentVerificationData {
  documentId: string;
  documentType: 'recibo' | 'licenca' | 'cedula' | 'saida_canoa' | 'outro';
  documentTitle: string;
  payerName: string;
  amount: number | string;
  amountInWords?: string;
  issueDate: string;
  validityDate: string;
  paymentReference?: string;
  bank?: string;
  vesselName?: string;
  issuerName?: string;
  observations?: string;
  verificationCode?: string;
}

/**
 * Builds the official URL that gets encoded into the verification QR Code.
 * When scanned by a phone or opened in a browser, it opens the verification portal.
 */
export function buildVerificationUrl(data: DocumentVerificationData): string {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://imp.gw';
  const params = new URLSearchParams({
    validar: data.documentId,
    tipo: data.documentType,
    titulo: data.documentTitle,
    titular: data.payerName,
    valor: String(data.amount),
    validade: data.validityDate || 'Quitação Definitiva',
    data: data.issueDate,
    ref: data.paymentReference || '',
    banco: data.bank || 'ORABANK',
    navio: data.vesselName || '',
    emissor: data.issuerName || 'Tesouraria Central do IMP'
  });

  return `${origin}/?${params.toString()}`;
}

/**
 * Generates an SVG/DataURL QR code for print and screen rendering.
 */
export async function generateVerificationQRCode(data: DocumentVerificationData): Promise<string> {
  const url = buildVerificationUrl(data);
  try {
    return await QRCode.toDataURL(url, {
      width: 130,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#082B59',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.warn('Erro ao gerar QRCode de verificação:', err);
    return '';
  }
}

/**
 * Parses query params from URL if someone visits or scans the QR code.
 */
export function parseVerificationFromUrl(): DocumentVerificationData | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const docId = params.get('validar') || params.get('docId') || params.get('id');

  if (!docId) return null;

  return {
    documentId: docId,
    documentType: (params.get('tipo') as any) || 'outro',
    documentTitle: params.get('titulo') || 'Documento Oficial IMP',
    payerName: params.get('titular') || params.get('p') || 'Titular Registado no IMP',
    amount: params.get('valor') || '0',
    validityDate: params.get('validade') || 'Quitação Definitiva',
    issueDate: params.get('data') || new Date().toISOString().slice(0, 10),
    paymentReference: params.get('ref') || '',
    bank: params.get('banco') || 'Tesouraria IMP',
    vesselName: params.get('navio') || '',
    issuerName: params.get('emissor') || 'Tesouraria Central do IMP',
    verificationCode: `IMP-VAL-${docId.replace(/\D/g, '').padStart(4, '0')}-2026`
  };
}
