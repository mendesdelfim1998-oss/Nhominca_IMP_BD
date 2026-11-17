import React, { useState, FormEvent, useMemo, useRef } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Landmark,
  FileCheck2,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X,
  CreditCard,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  FileMinus,
  Upload,
  Paperclip,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Percent,
  Check,
  RefreshCw,
  Download,
  Award,
  Ship,
  Compass,
  Building2,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  FaturaIMP,
  ReciboIMP,
  CaixaMov,
  Utilizador,
  IMP_INSTITUTIONAL
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { valorPorExtensoXOF } from '../../utils/moedaExtenso';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { DualA4Document } from '../common/DualA4Document';
import { GuineBissauCoatOfArms, IMPOfficialHelmEmblem } from '../common/OfficialEmblems';
import { VisaoGeralModal } from '../common/VisaoGeralModal';

interface TesourariaModuleProps {
  faturas: FaturaIMP[];
  recibos: ReciboIMP[];
  movimentos: CaixaMov[];
  currentUser: Utilizador;
  onLiquidateFatura: (faturaId: string, recibo: ReciboIMP, mov: CaixaMov) => void;
  onAddMovimento: (mov: CaixaMov) => void;
}

type PeriodFilter = 'dia' | 'semana' | 'mes' | 'ano' | 'tudo';
type DevedorFilter = 'todos_pendentes' | 'parciais' | 'integrais' | 'liquidadas';

export function TesourariaModule({
  faturas,
  recibos,
  movimentos,
  currentUser,
  onLiquidateFatura,
  onAddMovimento
}: TesourariaModuleProps) {
  const { theme } = useTheme();
  const { t, tText, language } = useLanguage();
  const locale = language === 'pt' ? 'pt-PT' : language === 'fr' ? 'fr-FR' : 'en-GB';

  // Active Tab: 'liquidacao' | 'devedores' | 'recibos' | 'saidas' | 'folha'
  const [activeTab, setActiveTab] = useState<'liquidacao' | 'devedores' | 'recibos' | 'saidas' | 'folha'>('liquidacao');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [reciboSearchTerm, setReciboSearchTerm] = useState('');
  const [codigoBuscaRapida, setCodigoBuscaRapida] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('mes');
  const [devedorFilter, setDevedorFilter] = useState<DevedorFilter>('todos_pendentes');

  // Modals
  const [faturaParaLiquidar, setFaturaParaLiquidar] = useState<FaturaIMP | null>(null);
  const [viewingRecibo, setViewingRecibo] = useState<ReciboIMP | null>(null);
  const [showNovaSaidaModal, setShowNovaSaidaModal] = useState(false);
  const [viewingSaidaDoc, setViewingSaidaDoc] = useState<CaixaMov | null>(null);
  const [showFechoFolhaModal, setShowFechoFolhaModal] = useState(false);
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Quick Action Modals for Caixa: Emitir Cédula Marítima, Emitir Licença, Domínio Público, Saída de Canoa
  const [showEmitirCedulaModal, setShowEmitirCedulaModal] = useState(false);
  const [showEmitirLicencaModal, setShowEmitirLicencaModal] = useState(false);
  const [showDominioPublicoModal, setShowDominioPublicoModal] = useState(false);
  const [showSaidaCanoaModal, setShowSaidaCanoaModal] = useState(false);
  const [showVisaoGeralModal, setShowVisaoGeralModal] = useState(false);

  // Forms State
  const [cedulaForm, setCedulaForm] = useState({
    nomeMaritimo: '',
    categoriaMaritima: 'Mestre Costeiro',
    embarcacaoPorto: 'Porto de Bissau',
    valorTaxa: 15000,
    validadeAnos: 2,
    banco: 'BAO',
    numeroTalao: '',
    observacoes: 'Emissão de Cédula de Inscrição Marítima no Caixa'
  });

  const [licencaForm, setLicencaForm] = useState({
    titular: '',
    embarcacao: '',
    tipoLicenca: 'Licença de Navegação e Tráfego',
    valorTaxa: 50000,
    validadeAnos: 1,
    banco: 'ORABANK',
    numeroTalao: '',
    observacoes: 'Concessão de Licença de Atividade Marítima'
  });

  const [dominioPublicoForm, setDominioPublicoForm] = useState({
    concessionario: '',
    zonaPortuaria: 'Cais de Pidjiguiti / Zona Portuária de Bissau',
    areaM2: 150,
    tipoOcupacao: 'Ocupação de Cais e Armazém Portuário',
    valorTaxa: 125000,
    validadeMeses: 12,
    banco: 'BAO',
    numeroTalao: '',
    observacoes: 'Taxa Oficial de Concessão e Ocupação do Domínio Público Marítimo-Portuário'
  });

  const [saidaCanoaForm, setSaidaCanoaForm] = useState({
    nomeCanoa: '',
    mestreCanoa: '',
    portoDestino: 'Ilha de Bubaque',
    numPassageiros: 16,
    cargaDeclarada: 'Mercadorias gerais e víveres',
    taxaDespacho: 5000,
    banco: 'Caixa Geral IMP',
    numeroTalao: '',
    observacoes: 'Despacho de largada e travessia portuária'
  });

  // Dual A4 document view state for quick issuances
  const [viewingEmissaoDoc, setViewingEmissaoDoc] = useState<{
    title: string;
    documentNumber: string;
    date: string;
    payerName: string;
    amount: number;
    amountInWords: string;
    description: string;
    paymentReference: string;
    bank: string;
    treasuryOfficial: string;
    documentType: 'recibo' | 'licenca' | 'cedula' | 'saida_canoa' | 'outro';
    validityDate: string;
    vesselName?: string;
  } | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async (filename: string) => {
    if (!documentRef.current) return;
    setIsExportingPDF(true);
    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.warn('html2canvas rendering fallback to native print:', err);
      // Fallback: Aciona impressão nativa direta para PDF
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Liquidation Form State
  const [bancoSelecionado, setBancoSelecionado] = useState<'CORIS BANK' | 'BANQUE ATLANTIQUE' | 'BAO'>('BAO');
  const [numeroTalao, setNumeroTalao] = useState('');
  const [dataLiquidacao, setDataLiquidacao] = useState(new Date().toISOString().slice(0, 10));
  const [obsLiquidacao, setObsLiquidacao] = useState('');
  const [valorPagamentoInput, setValorPagamentoInput] = useState<number>(0);
  const [talaoDuplicadoError, setTalaoDuplicadoError] = useState<string>('');

  // Nova Saída de Caixa (Profissional com Comprovativo Obrigatório) Form State
  const [saidaForm, setSaidaForm] = useState({
    descricao: '',
    valor: 250000,
    categoria: 'Combustível Embarcações' as CaixaMov['categoria'],
    documentoComprovativo: '',
    beneficiario: '',
    autorizado_por: 'Dr. Mamadu Djaló (Diretor Geral / PCA)',
    justificativa: '',
    anexoNome: ''
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Current physical cash balance
  const saldoAtualEmCaixa = movimentos.length > 0 ? movimentos[movimentos.length - 1].saldoApos : 0;

  // Invoices ready for payment in Cashier (confirmed or partial with pending balance)
  const faturasParaCobrar = useMemo(() => {
    return faturas.filter((f) => {
      const saldoPendente = f.saldo_pendente ?? (f.estado === 'paga' ? 0 : f.total - (f.saldo_pago || 0));
      return (f.estado === 'confirmada' || f.estado === 'parcial') && saldoPendente > 0;
    });
  }, [faturas]);

  // Universal Code Search Result (Search by FAT- or REC- or client/ship)
  const buscaRapidaResultado = useMemo(() => {
    const q = codigoBuscaRapida.trim().toLowerCase();
    if (!q) return null;

    // Search matching invoices
    const matchedFaturas = faturas.filter(
      (f) =>
        f.nFatura.toLowerCase().includes(q) ||
        f.cliente.toLowerCase().includes(q) ||
        f.navio.toLowerCase().includes(q)
    );

    // Search matching receipts
    const matchedRecibos = recibos.filter(
      (r) =>
        r.nRecibo.toLowerCase().includes(q) ||
        r.nFatura.toLowerCase().includes(q) ||
        r.talao.toLowerCase().includes(q) ||
        r.cliente.toLowerCase().includes(q)
    );

    return {
      faturas: matchedFaturas,
      recibos: matchedRecibos
    };
  }, [codigoBuscaRapida, faturas, recibos]);

  // Filtered receipts for Consulta de Pagamentos / Recibos
  const filteredRecibos = useMemo(() => {
    const q = reciboSearchTerm.trim().toLowerCase();
    if (!q) return recibos;
    return recibos.filter(
      (r) =>
        r.nRecibo.toLowerCase().includes(q) ||
        r.nFatura.toLowerCase().includes(q) ||
        r.cliente.toLowerCase().includes(q) ||
        (r.navio && r.navio.toLowerCase().includes(q)) ||
        r.talao.toLowerCase().includes(q) ||
        r.banco.toLowerCase().includes(q) ||
        r.emissor.toLowerCase().includes(q)
    );
  }, [recibos, reciboSearchTerm]);

  // Open Liquidation Modal
  const handleOpenLiquidar = (fat: FaturaIMP) => {
    const saldoPendente = fat.saldo_pendente ?? (fat.total - (fat.saldo_pago || 0));
    setFaturaParaLiquidar(fat);
    setValorPagamentoInput(saldoPendente);
    setBancoSelecionado('BAO');
    setNumeroTalao(`TAL-BAO-${Math.floor(100000 + Math.random() * 900000)}`);
    setDataLiquidacao(new Date().toISOString().slice(0, 10));
    setObsLiquidacao(
      fat.saldo_pago && fat.saldo_pago > 0
        ? `Liquidação de saldo remanescente da fatura ${fat.nFatura} (${fat.navio})`
        : `Pagamento de fatura ${fat.nFatura} referente a ${fat.navio}`
    );
    setTalaoDuplicadoError('');
  };

  // Submit Liquidation with Overpayment Block & Partial Amortization
  const handleSubmitLiquidacao = async (e: FormEvent) => {
    e.preventDefault();
    if (!faturaParaLiquidar || !numeroTalao.trim()) return;

    const saldoPendenteAtual =
      faturaParaLiquidar.saldo_pendente ??
      (faturaParaLiquidar.total - (faturaParaLiquidar.saldo_pago || 0));

    // STRICT VALIDATION: OVERPAYMENT BLOCK
    if (valorPagamentoInput > saldoPendenteAtual) {
      alert(
        `${tText('BLOQUEIO DE SEGURANÇA')}: ${tText('O valor digitado')} (${valorPagamentoInput.toLocaleString(
          locale
        )} XOF) ${tText('é superior ao saldo pendente da fatura')} (${saldoPendenteAtual.toLocaleString(
          locale
        )} XOF). ${tText('O sistema não aceita sobrefaturação ou sobrepagamento.')}`
      );
      return;
    }

    if (valorPagamentoInput <= 0) {
      alert(tText('O valor a pagar deve ser superior a zero.'));
      return;
    }

    // CHECK FOR DUPLICATE BANK SLIP NUMBER
    const cleanTalao = numeroTalao.trim();
    const talaoJaExiste = recibos.some(
      (r) => r.talao.toLowerCase() === cleanTalao.toLowerCase() && r.banco === bancoSelecionado
    );
    if (talaoJaExiste) {
      setTalaoDuplicadoError(`${tText('O número de talão')} ${cleanTalao} ${tText('já foi utilizado no banco')} ${bancoSelecionado}. ${tText('Insira um comprovativo único.')}`);
      return;
    }

    const currentYear = new Date().getFullYear();
    const nextReciboSeq = recibos.length + 1;
    const nRec = `REC-${currentYear}-${String(nextReciboSeq).padStart(4, '0')}`;

    const valorPagoAnterior = faturaParaLiquidar.saldo_pago || 0;
    const novoSaldoRestante = Math.max(0, saldoPendenteAtual - valorPagamentoInput);
    const isLiquidacaoTotal = novoSaldoRestante === 0;

    const novoRecibo: ReciboIMP = {
      id: nRec,
      nRecibo: nRec,
      fatura_id: faturaParaLiquidar.id,
      nFatura: faturaParaLiquidar.nFatura,
      totalFatura: faturaParaLiquidar.total,
      valorAnteriorPago: valorPagoAnterior,
      valor: valorPagamentoInput,
      saldoRestante: novoSaldoRestante,
      isLiquidacaoTotal,
      banco: bancoSelecionado,
      talao: cleanTalao,
      data: dataLiquidacao,
      hora: new Date().toTimeString().slice(0, 5),
      emissor: currentUser.nome,
      cliente: faturaParaLiquidar.cliente,
      navio: faturaParaLiquidar.navio,
      observacoes: obsLiquidacao.trim()
    };

    const novoSaldoCaixa = saldoAtualEmCaixa + valorPagamentoInput;

    const novoMov: CaixaMov = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      data: dataLiquidacao,
      hora: new Date().toTimeString().slice(0, 5),
      descricao: `Recebimento ${isLiquidacaoTotal ? 'Integral' : 'Parcial'} Fatura ${
        faturaParaLiquidar.nFatura
      } (${faturaParaLiquidar.navio}) - Talão ${cleanTalao}`,
      tipo: 'entrada',
      valor: valorPagamentoInput,
      saldoApos: novoSaldoCaixa,
      criado_por: currentUser.nome,
      categoria: 'Recibo Faturação',
      talao: cleanTalao,
      banco: bancoSelecionado,
      documentoComprovativo: faturaParaLiquidar.nFatura
    };

    try {
      await Promise.resolve(onLiquidateFatura(faturaParaLiquidar.id, novoRecibo, novoMov));
      setFaturaParaLiquidar(null);
      setViewingRecibo(novoRecibo);
    } catch (err) {
      console.error('Optimistic UI write error (Liquidation), forcing server re-validation:', err);
      alert(tText('Erro de gravação no servidor Supabase/PostgreSQL. O estado foi resincronizado com sucesso.'));
      window.location.reload();
    }
  };

  // Submit Professional Cash Outflow (Saída de Caixa com Comprovativo)
  const handleSubmitNovaSaida = async (e: FormEvent) => {
    e.preventDefault();
    if (!saidaForm.descricao.trim() || saidaForm.valor <= 0) return;
    if (!saidaForm.documentoComprovativo.trim()) {
      alert(tText('O número do Documento Comprovativo (Fatura de Fornecedor, Recibo ou Ordem de Saída) é obrigatório por normas de auditoria.'));
      return;
    }
    if (!saidaForm.beneficiario.trim()) {
      alert(tText('Identifique a entidade ou pessoa beneficiária do pagamento.'));
      return;
    }

    // CASH BALANCE DEFENSE: CANNOT WITHDRAW MORE THAN AVAILABLE CASH
    if (saidaForm.valor > saldoAtualEmCaixa) {
      alert(
        `${tText('BLOQUEIO DE SEGURANÇA')}: ${tText('Saldo em caixa insuficiente')} (${saldoAtualEmCaixa.toLocaleString(
          locale
        )} XOF). ${tText('Não é permitida a saída de')} ${saidaForm.valor.toLocaleString(
          locale
        )} XOF ${tText('sem prévio suprimento de caixa.')}`
      );
      return;
    }

    const val = Math.round(Number(saidaForm.valor) || 0);
    const novoSaldo = saldoAtualEmCaixa - val;

    const novaSaida: CaixaMov = {
      id: `MOV-${Date.now().toString().slice(-5)}`,
      data: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      descricao: saidaForm.descricao.trim(),
      tipo: 'saida',
      valor: val,
      saldoApos: novoSaldo,
      criado_por: currentUser.nome,
      categoria: saidaForm.categoria,
      documentoComprovativo: saidaForm.documentoComprovativo.trim(),
      beneficiario: saidaForm.beneficiario.trim(),
      autorizado_por: saidaForm.autorizado_por.trim(),
      justificativa: saidaForm.justificativa.trim(),
      comprovativoAnexo: saidaForm.anexoNome ? saidaForm.anexoNome : undefined
    };

    try {
      await Promise.resolve(onAddMovimento(novaSaida));
      setShowNovaSaidaModal(false);
      setViewingSaidaDoc(novaSaida);
      setSaidaForm({
        descricao: '',
        valor: 250000,
        categoria: 'Combustível Embarcações',
        documentoComprovativo: '',
        beneficiario: '',
        autorizado_por: 'Dr. Mamadu Djaló (Diretor Geral / PCA)',
        justificativa: '',
        anexoNome: ''
      });
    } catch (err) {
      console.error('Optimistic UI write error (Cash Outflow), forcing server re-validation:', err);
      alert(tText('Erro de gravação da saída de caixa no Supabase. O estado foi sincronizado.'));
      window.location.reload();
    }
  };

  // Handler for Emitir Cédula Marítima
  const handleSubmitCedula = (e: FormEvent) => {
    e.preventDefault();
    if (!cedulaForm.nomeMaritimo.trim()) {
      alert(tText('Por favor, informe o nome completo do marítimo.'));
      return;
    }
    const currentYear = new Date().getFullYear();
    const docNum = `CED-${currentYear}-${String(movimentos.length + 101).padStart(4, '0')}`;
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + (cedulaForm.validadeAnos || 2));
    const expDateStr = expDate.toLocaleDateString(locale);
    const valor = Number(cedulaForm.valorTaxa) || 15000;
    const tal = cedulaForm.numeroTalao.trim() || `TAL-${cedulaForm.banco}-${Math.floor(100000 + Math.random() * 900000)}`;

    const novoMov: CaixaMov = {
      id: `MOV-CED-${Date.now().toString().slice(-6)}`,
      data: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      descricao: `Emissão de Cédula Marítima ${docNum} - ${cedulaForm.nomeMaritimo} (${cedulaForm.categoriaMaritima})`,
      tipo: 'entrada',
      valor,
      saldoApos: (movimentos.length > 0 ? movimentos[0].saldoApos : 0) + valor,
      criado_por: currentUser.nome,
      categoria: 'Cédula Marítima',
      banco: cedulaForm.banco,
      talao: tal
    };

    onAddMovimento(novoMov);
    setShowEmitirCedulaModal(false);

    setViewingEmissaoDoc({
      title: 'CÉDULA DE INSCRIÇÃO MARÍTIMA',
      documentNumber: docNum,
      date: new Date().toLocaleDateString(locale),
      payerName: `${cedulaForm.nomeMaritimo} (${cedulaForm.categoriaMaritima})`,
      amount: valor,
      amountInWords: valorPorExtensoXOF(valor),
      description: `Taxa Oficial de Registo e Emissão de Cédula Marítima sob nº ${docNum} para exercício de atividade em ${cedulaForm.embarcacaoPorto}`,
      paymentReference: tal,
      bank: cedulaForm.banco,
      treasuryOfficial: currentUser.nome,
      documentType: 'cedula',
      validityDate: `Válido até ${expDateStr} (${cedulaForm.validadeAnos} Anos)`,
      vesselName: cedulaForm.embarcacaoPorto
    });

    setCedulaForm({
      nomeMaritimo: '',
      categoriaMaritima: 'Mestre Costeiro',
      embarcacaoPorto: 'Porto de Bissau',
      valorTaxa: 15000,
      validadeAnos: 2,
      banco: 'BAO',
      numeroTalao: '',
      observacoes: 'Emissão de Cédula de Inscrição Marítima no Caixa'
    });
  };

  // Handler for Emitir Licença
  const handleSubmitLicenca = (e: FormEvent) => {
    e.preventDefault();
    if (!licencaForm.titular.trim()) {
      alert(tText('Por favor, informe o nome do titular ou armador.'));
      return;
    }
    const currentYear = new Date().getFullYear();
    const docNum = `LIC-${currentYear}-${String(movimentos.length + 201).padStart(4, '0')}`;
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + (licencaForm.validadeAnos || 1));
    const expDateStr = expDate.toLocaleDateString(locale);
    const valor = Number(licencaForm.valorTaxa) || 50000;
    const tal = licencaForm.numeroTalao.trim() || `TAL-${licencaForm.banco}-${Math.floor(100000 + Math.random() * 900000)}`;

    const novoMov: CaixaMov = {
      id: `MOV-LIC-${Date.now().toString().slice(-6)}`,
      data: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      descricao: `Emissão de ${licencaForm.tipoLicenca} ${docNum} - ${licencaForm.titular}`,
      tipo: 'entrada',
      valor,
      saldoApos: (movimentos.length > 0 ? movimentos[0].saldoApos : 0) + valor,
      criado_por: currentUser.nome,
      categoria: 'Licença de Atividade',
      banco: licencaForm.banco,
      talao: tal
    };

    onAddMovimento(novoMov);
    setShowEmitirLicencaModal(false);

    setViewingEmissaoDoc({
      title: 'LICENÇA DE ACTIVIDADE MARÍTIMA',
      documentNumber: docNum,
      date: new Date().toLocaleDateString(locale),
      payerName: `${licencaForm.titular}${licencaForm.embarcacao ? ` (Embarcação: ${licencaForm.embarcacao})` : ''}`,
      amount: valor,
      amountInWords: valorPorExtensoXOF(valor),
      description: `Taxa Institucional de Concessão de ${licencaForm.tipoLicenca} sob o processo nº ${docNum}`,
      paymentReference: tal,
      bank: licencaForm.banco,
      treasuryOfficial: currentUser.nome,
      documentType: 'licenca',
      validityDate: `Válido até ${expDateStr} (${licencaForm.validadeAnos} Ano)`,
      vesselName: licencaForm.embarcacao
    });

    setLicencaForm({
      titular: '',
      embarcacao: '',
      tipoLicenca: 'Licença de Navegação e Tráfego',
      valorTaxa: 50000,
      validadeAnos: 1,
      banco: 'ORABANK',
      numeroTalao: '',
      observacoes: 'Concessão de Licença de Atividade Marítima'
    });
  };

  // Handler for Saída de Canoa
  const handleSubmitSaidaCanoa = (e: FormEvent) => {
    e.preventDefault();
    if (!saidaCanoaForm.nomeCanoa.trim() || !saidaCanoaForm.mestreCanoa.trim()) {
      alert(tText('Por favor, informe o nome da canoa e do mestre responsável.'));
      return;
    }
    const currentYear = new Date().getFullYear();
    const docNum = `CAN-${currentYear}-${String(movimentos.length + 301).padStart(4, '0')}`;
    const valor = Number(saidaCanoaForm.taxaDespacho) || 5000;
    const tal = saidaCanoaForm.numeroTalao.trim() || `DESP-CAN-${Math.floor(1000 + Math.random() * 9000)}`;

    const novoMov: CaixaMov = {
      id: `MOV-CAN-${Date.now().toString().slice(-6)}`,
      data: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      descricao: `Despacho de Saída de Canoa ${docNum} - ${saidaCanoaForm.nomeCanoa} -> ${saidaCanoaForm.portoDestino} (Mestre: ${saidaCanoaForm.mestreCanoa})`,
      tipo: 'entrada',
      valor,
      saldoApos: (movimentos.length > 0 ? movimentos[0].saldoApos : 0) + valor,
      criado_por: currentUser.nome,
      categoria: 'Saída de Canoa',
      banco: saidaCanoaForm.banco,
      talao: tal
    };

    onAddMovimento(novoMov);
    setShowSaidaCanoaModal(false);

    setViewingEmissaoDoc({
      title: 'GUIA OFICIAL DE DESPACHO E SAÍDA DE CANOA',
      documentNumber: docNum,
      date: new Date().toLocaleDateString(locale),
      payerName: `Mestre ${saidaCanoaForm.mestreCanoa} (Canoa: ${saidaCanoaForm.nomeCanoa})`,
      amount: valor,
      amountInWords: valorPorExtensoXOF(valor),
      description: `Taxa Portuária de Largada e Despacho de Canoa Tradicional para ${saidaCanoaForm.portoDestino} com ${saidaCanoaForm.numPassageiros} passageiros e carga (${saidaCanoaForm.cargaDeclarada})`,
      paymentReference: tal,
      bank: saidaCanoaForm.banco,
      treasuryOfficial: currentUser.nome,
      documentType: 'saida_canoa',
      validityDate: 'Válido por 24 Horas para Travessia Marítima',
      vesselName: saidaCanoaForm.nomeCanoa
    });

    setSaidaCanoaForm({
      nomeCanoa: '',
      mestreCanoa: '',
      portoDestino: 'Ilha de Bubaque',
      numPassageiros: 16,
      cargaDeclarada: 'Mercadorias gerais e víveres',
      taxaDespacho: 5000,
      banco: 'Caixa Geral IMP',
      numeroTalao: '',
      observacoes: 'Despacho de largada e travessia portuária'
    });
  };

  // Handler for Emitir Domínio Público
  const handleSubmitDominioPublico = (e: FormEvent) => {
    e.preventDefault();
    if (!dominioPublicoForm.concessionario.trim()) {
      alert(tText('Por favor, informe o concessionário ou requerente da ocupação.'));
      return;
    }
    const currentYear = new Date().getFullYear();
    const docNum = `DOM-${currentYear}-${String(movimentos.length + 401).padStart(4, '0')}`;
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + (dominioPublicoForm.validadeMeses || 12));
    const expDateStr = expDate.toLocaleDateString(locale);
    const valor = Number(dominioPublicoForm.valorTaxa) || 125000;
    const tal = dominioPublicoForm.numeroTalao.trim() || `DOM-${dominioPublicoForm.banco}-${Math.floor(100000 + Math.random() * 900000)}`;

    const novoMov: CaixaMov = {
      id: `MOV-DOM-${Date.now().toString().slice(-6)}`,
      data: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 5),
      descricao: `Taxa de Ocupação de Domínio Público Marítimo ${docNum} - ${dominioPublicoForm.concessionario} (${dominioPublicoForm.zonaPortuaria})`,
      tipo: 'entrada',
      valor,
      saldoApos: (movimentos.length > 0 ? movimentos[0].saldoApos : 0) + valor,
      criado_por: currentUser.nome,
      categoria: 'Domínio Público',
      banco: dominioPublicoForm.banco,
      talao: tal
    };

    onAddMovimento(novoMov);
    setShowDominioPublicoModal(false);

    setViewingEmissaoDoc({
      title: 'TÍTULO DE OCUPAÇÃO DO DOMÍNIO PÚBLICO MARÍTIMO',
      documentNumber: docNum,
      date: new Date().toLocaleDateString(locale),
      payerName: `${dominioPublicoForm.concessionario} (Zona: ${dominioPublicoForm.zonaPortuaria})`,
      amount: valor,
      amountInWords: valorPorExtensoXOF(valor),
      description: `Taxa Oficial de Concessão e Ocupação do Domínio Público Marítimo (${dominioPublicoForm.tipoOcupacao}) com área de ${dominioPublicoForm.areaM2} m² situada em ${dominioPublicoForm.zonaPortuaria}`,
      paymentReference: tal,
      bank: dominioPublicoForm.banco,
      treasuryOfficial: currentUser.nome,
      documentType: 'outro',
      validityDate: `Válido até ${expDateStr} (${dominioPublicoForm.validadeMeses} Meses)`,
      vesselName: dominioPublicoForm.zonaPortuaria
    });

    setDominioPublicoForm({
      concessionario: '',
      zonaPortuaria: 'Cais de Pidjiguiti / Zona Portuária de Bissau',
      areaM2: 150,
      tipoOcupacao: 'Ocupação de Cais e Armazém Portuário',
      valorTaxa: 125000,
      validadeMeses: 12,
      banco: 'BAO',
      numeroTalao: '',
      observacoes: 'Taxa Oficial de Concessão e Ocupação do Domínio Público Marítimo-Portuário'
    });
  };

  // Filtered movements calculation based on Period and Search
  const { filteredMovimentos, totalEntradasPeriodo, totalSaidasPeriodo, saldoFinal } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const list = movimentos.filter((m) => {
      // Period filter
      if (periodFilter === 'dia') {
        if (m.data !== todayStr) return false;
      } else if (periodFilter === 'semana') {
        const movDate = new Date(m.data);
        const diffDays = Math.abs((now.getTime() - movDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 7) return false;
      } else if (periodFilter === 'mes') {
        const curMonth = todayStr.slice(0, 7);
        if (!m.data.startsWith(curMonth)) return false;
      } else if (periodFilter === 'ano') {
        const curYear = todayStr.slice(0, 4);
        if (!m.data.startsWith(curYear)) return false;
      }

      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          m.descricao.toLowerCase().includes(query) ||
          m.categoria.toLowerCase().includes(query) ||
          (m.documentoComprovativo && m.documentoComprovativo.toLowerCase().includes(query)) ||
          (m.beneficiario && m.beneficiario.toLowerCase().includes(query)) ||
          (m.talao && m.talao.toLowerCase().includes(query)) ||
          (m.banco && m.banco.toLowerCase().includes(query))
        );
      }
      return true;
    });

    let entradas = 0;
    let saidas = 0;
    list.forEach((m) => {
      if (m.tipo === 'entrada') entradas += m.valor;
      else saidas += m.valor;
    });

    const saldo = movimentos.length > 0 ? movimentos[movimentos.length - 1].saldoApos : 0;

    return {
      filteredMovimentos: list,
      totalEntradasPeriodo: entradas,
      totalSaidasPeriodo: saidas,
      saldoFinal: saldo
    };
  }, [movimentos, periodFilter, searchTerm]);

  // Debtors & Outstanding Balances Dashboard metrics
  const devedoresData = useMemo(() => {
    const validFaturas = faturas.filter((f) => f.estado !== 'anulada');

    let totalDividaPendente = 0;
    let totalJaAmortizado = 0;
    let qtdParciais = 0;
    let qtdPendentesIntegrais = 0;
    let qtdLiquidadas = 0;

    validFaturas.forEach((f) => {
      const pago = f.saldo_pago || (f.estado === 'paga' ? f.total : 0);
      const pendente = f.saldo_pendente ?? (f.estado === 'paga' ? 0 : f.total - pago);

      totalDividaPendente += pendente;
      totalJaAmortizado += pago;

      if (f.estado === 'paga') qtdLiquidadas++;
      else if (f.estado === 'parcial' || (pago > 0 && pendente > 0)) qtdParciais++;
      else if (f.estado === 'confirmada' && pago === 0) qtdPendentesIntegrais++;
    });

    const filtered = validFaturas.filter((f) => {
      const pago = f.saldo_pago || (f.estado === 'paga' ? f.total : 0);
      const pendente = f.saldo_pendente ?? (f.estado === 'paga' ? 0 : f.total - pago);

      if (devedorFilter === 'todos_pendentes') return pendente > 0;
      if (devedorFilter === 'parciais') return f.estado === 'parcial' || (pago > 0 && pendente > 0);
      if (devedorFilter === 'integrais') return (f.estado === 'confirmada' || f.estado === 'rascunho') && pago === 0;
      if (devedorFilter === 'liquidadas') return f.estado === 'paga' || pendente === 0;
      return true;
    });

    return {
      totalDividaPendente,
      totalJaAmortizado,
      qtdParciais,
      qtdPendentesIntegrais,
      qtdLiquidadas,
      filtered
    };
  }, [faturas, devedorFilter]);

  // Outflows list
  const saidasMovimentos = useMemo(() => {
    return movimentos.filter((m) => m.tipo === 'saida');
  }, [movimentos]);

  return (
    <div id="tesouraria-module" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                theme === 'dark'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {tText('Tesouraria & Caixa Central')}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {tText('Bancos Autorizados')}: BAO • CORIS BANK • BANQUE ATLANTIQUE
            </span>
          </div>
          <h2
            className={`text-xl font-bold tracking-tight mt-1 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Wallet className="w-5 h-5 text-emerald-500" />
            {tText('Caixa Profissional, Amortizações, Recibos & Controlo de Saídas')}
          </h2>
          <p className={theme === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
            {tText('Segregação de Funções (SoD): O Caixa recebe pagamentos (integrais ou parciais), emite Recibos Oficiais e fiscaliza saídas justificadas.')}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Botão 'Emitir Cédula Marítima' (Pill Blue) */}
          <button
            type="button"
            onClick={() => setShowEmitirCedulaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer"
            title={tText('Emitir nova Cédula de Inscrição Marítima no Caixa')}
          >
            <Award className="w-4 h-4 text-blue-100" />
            <span>{tText('Emitir Cédula Marítima')}</span>
          </button>

          {/* Botão 'Emitir Licença' (Pill Green) */}
          <button
            type="button"
            onClick={() => setShowEmitirLicencaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009A52] hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer"
            title={tText('Emitir Licença Marítima Oficial no Caixa')}
          >
            <FileText className="w-4 h-4 text-emerald-100" />
            <span>{tText('Emitir Licença')}</span>
          </button>

          {/* Botão 'Domínio Público' (Pill Purple) */}
          <button
            type="button"
            onClick={() => setShowDominioPublicoModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6B46FF] hover:bg-indigo-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
            title={tText('Concessão e Ocupação do Domínio Público Marítimo')}
          >
            <Compass className="w-4 h-4 text-indigo-100" />
            <span>{tText('Domínio Público')}</span>
          </button>

          {/* Botão 'Saída de Canoa' (Pill Orange) */}
          <button
            type="button"
            onClick={() => setShowSaidaCanoaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97700] hover:bg-amber-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-amber-600/30 active:scale-95 cursor-pointer"
            title={tText('Registar e Emitir Despacho de Saída de Canoa Tradicional')}
          >
            <Ship className="w-4 h-4 text-amber-100" />
            <span>{tText('Saída de Canoa')}</span>
          </button>

          {/* Botão 'Saída de Caixa' (Pill Red) */}
          <button
            type="button"
            onClick={() => setShowNovaSaidaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-rose-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer"
            title={tText('Registar despesa ou saída de caixa')}
          >
            <FileMinus className="w-4 h-4 text-rose-100" />
            <span>{tText('Saída de Caixa')}</span>
          </button>

          {/* Botão 'Fecho Diário' (Pill Navy) */}
          <button
            type="button"
            onClick={() => setShowFechoFolhaModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-slate-900/30 active:scale-95 cursor-pointer"
            title={tText('Emitir balancete de fecho de caixa diário')}
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>{tText('Fecho Diário')}</span>
          </button>

          {/* PAINEL CONSOLIDADO / MONITOR DE OPERAÇÕES */}
          <button
            type="button"
            onClick={() => setShowVisaoGeralModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#082B59] hover:bg-blue-900 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-blue-900/40 border border-blue-400/30 active:scale-95 cursor-pointer ring-2 ring-blue-500/20"
            title={tText('Abrir Painel Consolidado de Operações & Prestação de Contas (Tempo Real)')}
          >
            <BarChart3 className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>{tText('Painel de Operações')}</span>
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS BANNER: 4 ATALHOS NA INTERFACE DA CAIXA */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800'
            : 'bg-gradient-to-r from-blue-50/70 via-emerald-50/70 via-indigo-50/70 to-amber-50/70 border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {tText('Atalhos Rápidos de Emissão na Caixa (Duplo A4 com QR Code)')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {tText('Arrecadação Direta & Validação por QR Code Autêntico')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Emitir Cédula Marítima */}
          <button
            type="button"
            onClick={() => setShowEmitirCedulaModal(true)}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group hover:shadow-md ${
              theme === 'dark'
                ? 'bg-slate-950 border-blue-900/40 hover:border-blue-500'
                : 'bg-white border-blue-200 hover:border-blue-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1">
                <span>{tText('Emitir Cédula Marítima')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tText('Registo de marinheiros e pescadores')}
              </p>
            </div>
          </button>

          {/* 2. Emitir Licença */}
          <button
            type="button"
            onClick={() => setShowEmitirLicencaModal(true)}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group hover:shadow-md ${
              theme === 'dark'
                ? 'bg-slate-950 border-emerald-900/40 hover:border-emerald-500'
                : 'bg-white border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1">
                <span>{tText('Emitir Licença')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tText('Navegação e tráfego portuário')}
              </p>
            </div>
          </button>

          {/* 3. Domínio Público */}
          <button
            type="button"
            onClick={() => setShowDominioPublicoModal(true)}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group hover:shadow-md ${
              theme === 'dark'
                ? 'bg-slate-950 border-indigo-900/40 hover:border-indigo-500'
                : 'bg-white border-indigo-200 hover:border-indigo-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1">
                <span>{tText('Domínio Público')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tText('Ocupação de cais e zona marítima')}
              </p>
            </div>
          </button>

          {/* 4. Saída de Canoa */}
          <button
            type="button"
            onClick={() => setShowSaidaCanoaModal(true)}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer group hover:shadow-md ${
              theme === 'dark'
                ? 'bg-slate-950 border-amber-900/40 hover:border-amber-500'
                : 'bg-white border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1">
                <span>{tText('Saída de Canoa')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tText('Despacho e taxa de largada de pirogas')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* QUICK UNIVERSAL SEARCH BAR: LOOKUP BY INVOICE OR RECEIPT CODE */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase font-mono whitespace-nowrap">
            <Search className="w-4 h-4 text-emerald-500" />
            <span>{tText('Consulta Rápida por Código:')}</span>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={tText('Digite o código da fatura (ex: FAT-2026-0001) ou recibo (ex: REC-2026-0001)...')}
              value={codigoBuscaRapida}
              onChange={(e) => setCodigoBuscaRapida(e.target.value)}
              className={`w-full rounded-xl px-4 py-2.5 text-xs font-mono border focus:outline-none focus:border-emerald-500 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {codigoBuscaRapida && (
              <button
                onClick={() => setCodigoBuscaRapida('')}
                className="absolute right-3 top-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Card Overlay */}
        {buscaRapidaResultado && (buscaRapidaResultado.faturas.length > 0 || buscaRapidaResultado.recibos.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {tText('Resultados Localizados')} ({buscaRapidaResultado.faturas.length} {tText('Fatura(s)')} • {buscaRapidaResultado.recibos.length} {tText('Recibo(s)')})
              </span>
              <button
                onClick={() => setCodigoBuscaRapida('')}
                className="text-[11px] text-slate-500 hover:underline"
              >
                {tText('Fechar Consulta')}
              </button>
            </div>

            {/* Matched Invoices Breakdown */}
            {buscaRapidaResultado.faturas.map((fat) => {
              const pago = fat.saldo_pago || (fat.estado === 'paga' ? fat.total : 0);
              const pendente = fat.saldo_pendente ?? (fat.estado === 'paga' ? 0 : fat.total - pago);
              const percPago = fat.total > 0 ? Math.min(100, Math.round((pago / fat.total) * 100)) : 0;
              const fRecibos = recibos.filter((r) => r.fatura_id === fat.id || r.nFatura === fat.nFatura);

              return (
                <div
                  key={fat.id}
                  className={`p-4 rounded-xl border text-xs space-y-3 ${
                    theme === 'dark'
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        {fat.nFatura}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">({fat.data})</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          fat.estado === 'paga'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : fat.estado === 'parcial'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        }`}
                      >
                        {fat.estado}
                      </span>
                    </div>

                    {pendente > 0 && (fat.estado === 'confirmada' || fat.estado === 'parcial') && (
                      <button
                        onClick={() => handleOpenLiquidar(fat)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {tText('Cobrar Saldo')} ({pendente.toLocaleString(locale)} XOF)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">{tText('Cliente / Agência:')}</span>
                      <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">{fat.cliente}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">{tText('Navio:')}</span>
                      <span className="font-sans text-slate-700 dark:text-slate-300">{fat.navio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">{tText('Total Faturado (X):')}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{fat.total.toLocaleString(locale)} XOF</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">{tText('Saldo Devedor (Z):')}</span>
                      <span className={`font-bold ${pendente > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {pendente.toLocaleString(locale)} XOF
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500">{tText('Amortização da Fatura:')} {percPago}% {tText('pago')}</span>
                      <span className="text-emerald-600 font-bold">{pago.toLocaleString(locale)} {tText('de')} {fat.total.toLocaleString(locale)} XOF</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percPago}%` }} />
                      <div className="bg-amber-500/60 h-full transition-all" style={{ width: `${100 - percPago}%` }} />
                    </div>
                  </div>

                  {/* Associated Receipts */}
                  {fRecibos.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                        {tText('Recibos Emitidos para esta Fatura')} ({fRecibos.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fRecibos.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <div>
                              <span className="font-bold font-mono text-emerald-600">{rec.nRecibo}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {rec.data} • {rec.banco} ({rec.talao})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-600">
                                {rec.valor.toLocaleString(locale)} XOF
                              </span>
                              <button
                                onClick={() => setViewingRecibo(rec)}
                                className="px-2 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1"
                                title={tText('Imprimir Recibo Oficial')}
                              >
                                <Printer className="w-3 h-3" />
                                <span>{tText('Imprimir')}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Matched Receipts Breakdown */}
            {buscaRapidaResultado.recibos.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-emerald-50/50 border-emerald-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        {rec.nRecibo}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase font-bold">
                        {tText('Recibo Pago')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {tText('Fatura:')} <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{rec.nFatura}</span> • 
                      {tText('Cliente:')} <span className="font-semibold text-slate-700 dark:text-slate-300">{rec.cliente}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{tText('Valor Pago:')}</div>
                    <div className="text-sm font-black text-emerald-600">
                      {rec.valor.toLocaleString(locale)} XOF
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingRecibo(rec)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title={tText('Imprimir Recibo')}
                  >
                    <Printer className="w-4 h-4" />
                    <span>{tText('Imprimir Recibo')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">{tText('Saldo Físico em Caixa')}</span>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
            {saldoFinal.toLocaleString(locale)} XOF
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{tText('Disponibilidade líquida conferida')}</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">{tText('Recebimentos no Período')}</span>
          <div className="text-2xl font-bold font-mono text-blue-500 mt-1 flex items-center gap-1.5">
            <ArrowUpRight className="w-5 h-5 text-blue-500" />
            {totalEntradasPeriodo.toLocaleString(locale)} XOF
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{tText('Depósitos bancários & taxas recebidas')}</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">{tText('Saídas Justificadas')}</span>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1 flex items-center gap-1.5">
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
            {totalSaidasPeriodo.toLocaleString(locale)} XOF
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{tText('Com comprovativo documental e autorização')}</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">{tText('Faturas Prontas para Cobrança')}</span>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {faturasParaCobrar.length} {tText('Aguardando')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{tText('Confirmadas pelo setor de Faturação')}</span>
        </div>
      </div>

      {/* Tabs Switcher: Liquidação vs Devedores vs Recibos vs Saídas vs Folha de Caixa */}
      <div
        className={`flex border-b gap-4 lg:gap-6 text-xs font-semibold overflow-x-auto ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveTab('liquidacao')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'liquidacao'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{tText('Faturas a Cobrar no Caixa')} ({faturasParaCobrar.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('devedores')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'devedores'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>{tText('Controlo de Saldos & Histórico de Pendentes')} ({devedoresData.filtered.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recibos')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'recibos'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{tText('Recibos Oficiais Emitidos')} ({recibos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saidas')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'saidas'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileMinus className="w-4 h-4" />
          <span>{tText('Saídas de Caixa & Comprovativos')} ({saidasMovimentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('folha')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'folha'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : theme === 'dark'
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{tText('Folha Diária de Caixa & Balancete')}</span>
        </button>
      </div>

      {/* TAB 1: LIQUIDAÇÃO DE FATURAS CONFIRMADAS / PARCIAIS */}
      {activeTab === 'liquidacao' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={theme === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
              {tText('Faturas confirmadas pelo setor de Faturação prontas para cobrança (integral ou amortização parcial):')}
            </span>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-mono text-[10px] border-b ${
                    theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-3.5">{tText('Nº Fatura & Data')}</th>
                    <th className="p-3.5">{tText('Cliente / Agência Marítima')}</th>
                    <th className="p-3.5">{tText('Navio & Tonelagem (GT)')}</th>
                    <th className="p-3.5 text-right">{tText('Total Faturado')}</th>
                    <th className="p-3.5 text-right">{tText('Pago')}</th>
                    <th className="p-3.5 text-right">{tText('Saldo Pendente')} (XOF)</th>
                    <th className="p-3.5">{tText('ESTADO')}</th>
                    <th className="p-3.5 text-right">{tText('AÇÕES')}</th>
                  </tr>
                </thead>
                <tbody className={theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}>
                  {faturasParaCobrar.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                        {tText('Não existem faturas pendentes de liquidação no momento.')}
                      </td>
                    </tr>
                  ) : (
                    faturasParaCobrar.map((fat) => {
                      const pago = fat.saldo_pago || 0;
                      const pendente = fat.saldo_pendente ?? (fat.total - pago);

                      return (
                        <tr
                          key={fat.id}
                          className={`transition-colors ${
                            theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3.5 whitespace-nowrap">
                            <div className={`font-mono font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {fat.nFatura}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{fat.data}</span>
                          </td>
                          <td className="p-3.5">
                            <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                              {fat.cliente}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{tText('NIF:')} {fat.nif}</span>
                          </td>
                          <td className={`p-3.5 whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {fat.navio} <span className="text-slate-400 font-mono">({fat.tipo})</span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap font-mono text-slate-500">
                            {fat.total.toLocaleString(locale)} XOF
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap font-mono text-emerald-600 font-semibold">
                            {pago.toLocaleString(locale)} XOF
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-sm text-emerald-500">
                              {pendente.toLocaleString(locale)} XOF
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                fat.estado === 'parcial'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              }`}
                            >
                              {fat.estado === 'parcial' ? tText('Parcial') : tText('Confirmada')}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenLiquidar(fat)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{tText('Registar Pagamento & Recibo')}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROLO DE SALDOS & HISTÓRICO DE DEVEDORES ("Pago e Não Acabado") */}
      {activeTab === 'devedores' && (
        <div className="space-y-4">
          {/* Sub-KPIs for Aging & Balance Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Total em Dívida Pendente (Z)</span>
              <div className="text-xl font-bold font-mono text-amber-500 mt-1">
                {devedoresData.totalDividaPendente.toLocaleString(locale)} XOF
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Valor global a liquidar por agências</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Total Já Arrecadado (A + Y)</span>
              <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
                {devedoresData.totalJaAmortizado.toLocaleString(locale)} XOF
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Total liquidado em recibos de tesouraria</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Faturas "Pago e Não Acabado"</span>
              <div className="text-xl font-bold font-mono text-blue-500 mt-1">
                {devedoresData.qtdParciais} Parciais
              </div>
              <span className="text-[10px] text-slate-500 font-sans">Com amortização parcial e saldo pendente</span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Totalmente Quitadas</span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                {devedoresData.qtdLiquidadas} Faturas
              </div>
              <span className="text-[10px] text-slate-500 font-sans">100% liquidadas sem dívida restante</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'todos_pendentes', label: `Todos os Devedores (${faturas.filter(f => (f.saldo_pendente ?? f.total) > 0 && f.estado !== 'anulada').length})` },
              { id: 'parciais', label: `Histórico de Parciais - "Pago e Não Acabado" (${devedoresData.qtdParciais})` },
              { id: 'integrais', label: `Dívida Integral (Sem Amortização) (${devedoresData.qtdPendentesIntegrais})` },
              { id: 'liquidadas', label: `Totalmente Liquidadas (${devedoresData.qtdLiquidadas})` }
            ].map((fil) => (
              <button
                key={fil.id}
                onClick={() => setDevedorFilter(fil.id as DevedorFilter)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  devedorFilter === fil.id
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                    : theme === 'dark'
                    ? 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                {fil.label}
              </button>
            ))}
          </div>

          {/* Debtors List Table with History Toggle */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-mono text-[10px] border-b ${
                    theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-3.5">{tText('Identificação Fatura')}</th>
                    <th className="p-3.5">{tText('Cliente (Agência Marítima)')}</th>
                    <th className="p-3.5">{tText('Navio / Embarcação')}</th>
                    <th className="p-3.5 text-right">{tText('Faturado (X)')}</th>
                    <th className="p-3.5 text-right">{tText('Amortizado (A+Y)')}</th>
                    <th className="p-3.5 text-right">{tText('Dívida Atual (Z)')}</th>
                    <th className="p-3.5 min-w-[140px]">{tText('% Pago')}</th>
                    <th className="p-3.5 text-right">{tText('Ação')}</th>
                  </tr>
                </thead>
                <tbody className={theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}>
                  {devedoresData.filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 text-xs font-sans italic">
                        {tText('Nenhum registo localizado para o filtro selecionado.')}
                      </td>
                    </tr>
                  ) : (
                    devedoresData.filtered.map((fat) => {
                      const pago = fat.saldo_pago || (fat.estado === 'paga' ? fat.total : 0);
                      const pendente = fat.saldo_pendente ?? (fat.estado === 'paga' ? 0 : fat.total - pago);
                      const perc = fat.total > 0 ? Math.min(100, Math.round((pago / fat.total) * 100)) : 0;
                      const isExpanded = expandedFaturaId === fat.id;
                      const fRecibos = recibos.filter((r) => r.fatura_id === fat.id || r.nFatura === fat.nFatura);

                      return (
                        <React.Fragment key={fat.id}>
                          <tr
                            className={`transition-colors ${
                              theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-3.5 whitespace-nowrap">
                              <div className={`font-mono font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {fat.nFatura}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{fat.data}</span>
                            </td>
                            <td className="p-3.5">
                              <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                {fat.cliente}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{tText('NIF:')} {fat.nif}</span>
                            </td>
                            <td className={`p-3.5 whitespace-nowrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {fat.navio} <span className="text-slate-400 font-mono text-[10px]">({fat.tipo})</span>
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap font-mono text-slate-400">
                              {fat.total.toLocaleString(locale)}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap font-mono text-emerald-600 font-bold">
                              {pago.toLocaleString(locale)}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <span className={`font-mono font-bold text-sm ${pendente > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {pendente.toLocaleString(locale)} XOF
                              </span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">{perc}%</span>
                                  <span className={pendente > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                                    {pendente === 0 ? tText('LIQUIDADA') : tText('PENDENTE')}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${perc}%` }} />
                                  <div className="bg-amber-500/40 h-full" style={{ width: `${100 - perc}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {fRecibos.length > 0 && (
                                  <button
                                    onClick={() => setExpandedFaturaId(isExpanded ? null : fat.id)}
                                    className={`p-1.5 rounded-lg text-[11px] font-bold font-mono flex items-center gap-1 transition-colors ${
                                      isExpanded 
                                        ? 'bg-blue-600 text-white shadow'
                                        : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-blue-600'
                                    }`}
                                    title={tText('Ver Histórico Cronológico de Pagamentos')}
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>{tText('HISTÓRICO')} ({fRecibos.length})</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                {pendente > 0 && (fat.estado === 'confirmada' || fat.estado === 'parcial') && (
                                  <button
                                    onClick={() => handleOpenLiquidar(fat)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                  >
                                    Cobrar Saldo
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Payment History Row (Professional List) */}
                          {isExpanded && fRecibos.length > 0 && (
                            <tr className={theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-50/80 animate-in slide-in-from-top-2'}>
                              <td colSpan={8} className="p-5 border-b border-slate-200 dark:border-slate-800">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <span className="text-[10px] uppercase font-mono font-black text-slate-500 flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                                      Rastreio de Amortizações (Auditoria IMP) - {fat.nFatura}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono italic">
                                      Total Amortizado: {pago.toLocaleString(locale)} de {fat.total.toLocaleString(locale)} XOF
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {fRecibos.map((rec, rIdx) => (
                                      <div
                                        key={rec.id}
                                        className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-mono flex flex-col justify-between shadow-sm relative group"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <div className="font-black text-emerald-600 flex items-center gap-1.5">
                                              <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[9px]">#{rIdx + 1}</span>
                                              <span>{rec.nRecibo}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">
                                              {rec.data} às {rec.hora}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">{tText('VALOR AMORTIZADO:')}</div>
                                            <span className="font-black text-sm text-emerald-600">
                                              {rec.valor.toLocaleString(locale)} XOF
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                                          <div className="text-[10px] text-slate-500 font-sans italic truncate pr-4">
                                            Via {rec.banco} ({rec.talao})
                                          </div>
                                          <button
                                            onClick={() => setViewingRecibo(rec)}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                                            title={tText('Imprimir Recibo Oficial')}
                                          >
                                            <Printer className="w-3 h-3" />
                                            Imprimir Recibo
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECIBOS OFICIAIS EMITIDOS (CONSULTA DE PAGAMENTOS) */}
      {activeTab === 'recibos' && (
        <div className="space-y-4">
          {/* Search & Statistics Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border flex-1 transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder={tText('Pesquisar recibo por nº REC-, fatura FAT-, cliente, navio, banco ou talão...')}
                value={reciboSearchTerm}
                onChange={(e) => setReciboSearchTerm(e.target.value)}
                className={`bg-transparent text-xs focus:outline-none w-full font-medium ${
                  theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              {reciboSearchTerm && (
                <button
                  onClick={() => setReciboSearchTerm('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick summary badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-3.5 py-2 rounded-2xl border text-xs flex items-center gap-2 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{tText('Total Recibos:')}</span>
                <span className="font-mono font-black text-emerald-500">{filteredRecibos.length}</span>
              </div>
              <div
                className={`px-3.5 py-2 rounded-2xl border text-xs flex items-center gap-2 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{tText('Total Arrecadado:')}</span>
                <span className="font-mono font-black text-emerald-600">
                  {filteredRecibos.reduce((s, r) => s + r.valor, 0).toLocaleString(locale)} XOF
                </span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-mono text-[10px] border-b ${
                    theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-3.5">{tText('Identificação Recibo')}</th>
                    <th className="p-3.5">{tText('Fatura Associada')}</th>
                    <th className="p-3.5">{tText('Cliente / Agência')}</th>
                    <th className="p-3.5">{tText('Banco & Talão')}</th>
                    <th className="p-3.5 text-right">{tText('Valor Pago (Y)')}</th>
                    <th className="p-3.5 text-right">{tText('Saldo Restante (Z)')}</th>
                    <th className="p-3.5">{tText('Natureza Quitação')}</th>
                    <th className="p-3.5">{tText('Operador do Caixa')}</th>
                    <th className="p-3.5 text-right">{tText('Ação / Impressão')}</th>
                  </tr>
                </thead>
                <tbody className={theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}>
                  {filteredRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500 text-xs italic">
                        {reciboSearchTerm
                          ? `Nenhum recibo oficial encontrado para "${reciboSearchTerm}".`
                          : 'Nenhum recibo oficial emitido até o momento.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecibos.map((rec) => (
                      <tr
                        key={rec.id}
                        className={`transition-colors ${
                          theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5" />
                            {rec.nRecibo}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rec.data} às {rec.hora}
                          </span>
                        </td>
                        <td
                          className={`p-3.5 whitespace-nowrap font-mono font-bold ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {rec.nFatura}
                        </td>
                        <td className="p-3.5">
                          <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {rec.cliente}
                          </div>
                          {rec.navio && <span className="text-[10px] text-slate-400 font-mono">{rec.navio}</span>}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] border font-mono font-bold ${
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-blue-400'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                          >
                            {rec.banco}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.talao}</div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <span className="font-mono font-black text-sm text-emerald-600">
                            {rec.valor.toLocaleString(locale)}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap font-mono font-bold">
                          <span className={rec.saldoRestante && rec.saldoRestante > 0 ? 'text-amber-500' : 'text-slate-400'}>
                            {rec.saldoRestante !== undefined ? rec.saldoRestante.toLocaleString(locale) : '0'}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              rec.isLiquidacaoTotal
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            }`}
                          >
                            {rec.isLiquidacaoTotal ? tText('QUITAÇÃO TOTAL') : tText('AMORTIZAÇÃO PARCIAL')}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-400 text-[11px] font-medium italic">
                          {rec.emissor}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setViewingRecibo(rec)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/25 flex items-center gap-1.5 ml-auto active:scale-95 cursor-pointer"
                            title={tText('Visualizar e Imprimir Recibo Oficial de Quitação')}
                          >
                            <Printer className="w-4 h-4" />
                            <span>{tText('Imprimir Recibo')}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SAÍDAS DE CAIXA PROFISSIONAIS & COMPROVATIVOS JUSTIFICADOS */}
      {activeTab === 'saidas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border bg-rose-500/5 border-rose-500/20 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-rose-700 dark:text-rose-300 text-base">
                    Controlo de Excluxão de Numerário (Saídas de Caixa)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white">
                    AUDITORIA RIGOROSA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Norma IMP/DAF: Saídas apenas para despesas operacionais urgentes, combustíveis de lanchas ou expediente. <span className="font-bold underline">Exige documento de fornecedor</span> e autorização prévia da Direção.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNovaSaidaModal(true)}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 whitespace-nowrap self-start sm:self-center uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" />
              Registar Saída
            </button>
          </div>

          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-mono text-[10px] border-b ${
                    theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-3.5">{tText('Data & Hora')}</th>
                    <th className="p-3.5">{tText('Natureza da Despesa')}</th>
                    <th className="p-3.5">{tText('Beneficiário')}</th>
                    <th className="p-3.5">{tText('Doc. Comprovativo')}</th>
                    <th className="p-3.5">{tText('Autorizado Por')}</th>
                    <th className="p-3.5 text-right">{tText('Montante (-)')}</th>
                    <th className="p-3.5 text-right">{tText('Justificativo')}</th>
                  </tr>
                </thead>
                <tbody className={theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}>
                  {saidasMovimentos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 text-xs italic">
                        {tText('Nenhuma saída de numerário registada no período.')}
                      </td>
                    </tr>
                  ) : (
                    saidasMovimentos.map((saida) => (
                      <tr
                        key={saida.id}
                        className={`transition-colors ${
                          theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          <div className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                            {saida.data}
                          </div>
                          <span className="text-[10px] text-slate-400">{saida.hora}</span>
                        </td>
                        <td className="p-3.5">
                          <div className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {saida.descricao}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 mt-1 inline-block">
                            {saida.categoria}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-black uppercase text-slate-700 dark:text-slate-300">
                          {saida.beneficiario}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            {saida.documentoComprovativo}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-500 text-[11px] font-bold">
                          {saida.autorizado_por}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap font-mono font-black text-rose-600 text-sm">
                          -{saida.valor.toLocaleString(locale)} XOF
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setViewingSaidaDoc(saida)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-black transition-all border border-rose-200 flex items-center gap-1.5 ml-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            VER GUIA
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FOLHA DE CAIXA COM FILTROS DE TEMPO */}
      {activeTab === 'folha' && (
        <div className="space-y-4">
          {/* Period Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div
              className={`flex flex-wrap items-center gap-1 p-1 rounded-2xl border text-xs ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {(['dia', 'semana', 'mes', 'ano', 'tudo'] as PeriodFilter[]).map((p) => {
                const labels: Record<PeriodFilter, string> = {
                  dia: tText('Hoje'),
                  semana: tText('Esta Semana'),
                  mes: tText('Este Mês'),
                  ano: tText('Este Ano'),
                  tudo: tText('Todo o Histórico')
                };
                return (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      periodFilter === p
                        ? 'bg-emerald-600 text-white shadow-md'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border flex-1 sm:max-w-xs transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <Search className="w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder={tText('Pesquisar movimento, talão, banco...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent text-xs focus:outline-none w-full font-medium ${
                  theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title={tText('Imprimir Folha Diária / Balancete de Caixa')}
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{tText('Imprimir Balancete')}</span>
            </button>
          </div>

          {/* Movements Ledger Table */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-mono text-[10px] border-b ${
                    theme === 'dark'
                      ? 'bg-slate-950 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="p-3.5">{tText('Data & Hora')}</th>
                    <th className="p-3.5">{tText('Descrição do Lançamento')}</th>
                    <th className="p-3.5">{tText('Categoria & Documento')}</th>
                    <th className="p-3.5 text-right">{tText('Crédito (+)')}</th>
                    <th className="p-3.5 text-right">{tText('Débito (-)')}</th>
                    <th className="p-3.5 text-right">{tText('Saldo Progressivo')}</th>
                    <th className="p-3.5">{tText('Operador')}</th>
                    <th className="p-3.5 text-right">{tText('Comprovativo / Recibo')}</th>
                  </tr>
                </thead>
                <tbody className={`font-mono ${theme === 'dark' ? 'divide-y divide-slate-800/60' : 'divide-y divide-slate-100'}`}>
                  {filteredMovimentos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500 text-xs italic font-sans">
                        {tText('Nenhum movimento registado no balancete para este período.')}
                      </td>
                    </tr>
                  ) : (
                    filteredMovimentos.map((mov) => (
                      <tr
                        key={mov.id}
                        className={`transition-colors ${
                          theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3.5 whitespace-nowrap">
                          <div className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                            {mov.data}
                          </div>
                          <span className="text-[10px] text-slate-400">{mov.hora}</span>
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className={`font-sans font-bold text-slate-800 dark:text-slate-200 leading-snug`}>
                            {mov.descricao}
                          </div>
                          {mov.beneficiario && (
                            <span className="text-[10px] font-sans text-slate-500 block mt-0.5">
                              Entidade: {mov.beneficiario}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] border font-bold ${
                              mov.tipo === 'entrada'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800'
                            }`}
                          >
                            {mov.categoria}
                          </span>
                          {(mov.talao || mov.documentoComprovativo) && (
                            <div className="text-[10px] text-slate-400 mt-1 font-bold">
                              {mov.banco ? `${mov.banco} • ` : ''}
                              {mov.documentoComprovativo || mov.talao}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {mov.tipo === 'entrada' ? (
                            <span className="text-emerald-600 font-black">
                              +{mov.valor.toLocaleString(locale)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-800">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {mov.tipo === 'saida' ? (
                            <span className="text-rose-600 font-black">
                              -{mov.valor.toLocaleString(locale)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-800">-</span>
                          )}
                        </td>
                        <td
                          className={`p-3.5 text-right whitespace-nowrap font-black text-sm ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {mov.saldoApos.toLocaleString(locale)} XOF
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-400 font-sans text-[11px] font-medium">
                          {mov.criado_por}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {mov.tipo === 'entrada' ? (
                            <button
                              onClick={() => {
                                const found = recibos.find(
                                  (r) =>
                                    r.talao === mov.talao ||
                                    (mov.documentoComprovativo && r.nFatura === mov.documentoComprovativo)
                                );
                                if (found) {
                                  setViewingRecibo(found);
                                } else {
                                  setViewingRecibo({
                                    id: `REC-${mov.id}`,
                                    nRecibo: `REC-CX-${mov.id.replace('MOV-', '')}`,
                                    fatura_id: mov.documentoComprovativo || 'FAT-AVULSO',
                                    nFatura: mov.documentoComprovativo || 'PAGAMENTO CAIXA',
                                    totalFatura: mov.valor,
                                    valorAnteriorPago: 0,
                                    valor: mov.valor,
                                    saldoRestante: 0,
                                    isLiquidacaoTotal: true,
                                    banco: (mov.banco as any) || 'BAO',
                                    talao: mov.talao || mov.documentoComprovativo || 'TAL-CX-001',
                                    data: mov.data,
                                    hora: mov.hora,
                                    emissor: mov.criado_por,
                                    cliente: mov.beneficiario || 'Armador / Utente Portuário',
                                    observacoes: mov.descricao
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition-all shadow-sm active:scale-95 cursor-pointer"
                              title={tText('Imprimir Recibo Oficial deste recebimento')}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{tText('Imprimir Recibo')}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setViewingSaidaDoc(mov)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition-all shadow-sm active:scale-95 cursor-pointer"
                              title={tText('Imprimir Guia de Saída de Caixa')}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{tText('Imprimir Guia')}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LIQUIDATION / AMORTIZATION PAYMENT MODAL (WITH STRICT OVERPAYMENT DEFENSE) */}
      {faturaParaLiquidar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#072652]/80 backdrop-blur-md animate-in fade-in">
          <div
            className={`w-full max-w-xl rounded-[32px] border shadow-2xl p-8 space-y-6 transform transition-all ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-black text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0B2B59]'}`}>
                    Recebimento & Quitação
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{faturaParaLiquidar.nFatura}</span>
                    <span className="text-xs text-slate-400 font-medium">| {faturaParaLiquidar.cliente}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFaturaParaLiquidar(null)}
                className={`p-2 rounded-xl transition-all hover:rotate-90 ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Invoice Formula Card */}
            {(() => {
              const saldoPendenteAtual =
                faturaParaLiquidar.saldo_pendente ??
                (faturaParaLiquidar.total - (faturaParaLiquidar.saldo_pago || 0));
              const pagoAnterior = faturaParaLiquidar.saldo_pago || 0;
              const novoRestante = Math.max(0, saldoPendenteAtual - valorPagamentoInput);
              const isOverpayment = valorPagamentoInput > saldoPendenteAtual;

              return (
                <div className="space-y-4">
                  <div
                    className={`p-5 rounded-3xl border text-[13px] space-y-3 font-mono shadow-inner ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-[#F8FAFC] border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-slate-500 text-[11px] font-bold">1. VALOR TOTAL EMITIDO (X):</span>
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {faturaParaLiquidar.total.toLocaleString(locale)} XOF
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-slate-500 text-[11px] font-bold">2. JÁ AMORTIZADO ANTERIOR (A):</span>
                      <span className="font-black text-emerald-600">
                        {pagoAnterior.toLocaleString(locale)} XOF
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-black">
                        3. SALDO ATUAL DEVEDOR (Z = X - A):
                      </span>
                      <span className="font-black text-amber-500 text-xl">
                        {saldoPendenteAtual.toLocaleString(locale)} XOF
                      </span>
                    </div>
                  </div>

                  {/* Overpayment Warning & Defense */}
                  {isOverpayment && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3 animate-bounce">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black block uppercase text-sm mb-1">Bloqueio de Sobrefaturação</span>
                        <p className="leading-relaxed">
                          O valor digitado <span className="font-black underline">({valorPagamentoInput.toLocaleString(locale)} XOF)</span> excede a dívida real da fatura. O sistema IMP não permite arrecadar valores superiores ao faturado. Por favor, corrija o montante.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitLiquidacao} className="space-y-5">
                    {/* Amount to pay */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                          Valor a Liquidar agora (Y):
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setValorPagamentoInput(saldoPendenteAtual)}
                            className="px-2.5 py-1 text-[10px] font-black font-mono bg-emerald-600 text-white rounded-lg shadow-sm hover:scale-105 transition-transform"
                          >
                            LIQUIDAR 100%
                          </button>
                          {saldoPendenteAtual > 10000 && (
                            <button
                              type="button"
                              onClick={() => setValorPagamentoInput(Math.round(saldoPendenteAtual / 2))}
                              className="px-2.5 py-1 text-[10px] font-black font-mono bg-amber-500 text-white rounded-lg shadow-sm hover:scale-105 transition-transform"
                            >
                              PARCIAL 50%
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max={saldoPendenteAtual}
                          value={valorPagamentoInput}
                          onChange={(e) => setValorPagamentoInput(Number(e.target.value) || 0)}
                          className={`w-full rounded-2xl px-5 py-4 text-xl font-black font-mono border-2 focus:outline-none focus:border-emerald-500 transition-all ${
                            isOverpayment
                              ? 'border-rose-500 bg-rose-50 text-rose-600'
                              : theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-white'
                              : 'bg-white border-slate-200 text-[#0B2B59]'
                          }`}
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">XOF</span>
                      </div>
                      
                      {/* Interactive Status Display */}
                      {!isOverpayment && valorPagamentoInput > 0 && (
                        <div className={`p-3.5 rounded-2xl flex items-center gap-3 transition-all ${
                          novoRestante === 0 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : 'bg-blue-50 border border-blue-200 text-blue-800'
                        }`}>
                          {novoRestante === 0 ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          <div className="text-xs font-bold leading-snug">
                            {novoRestante === 0 
                              ? `${tText('QUITAÇÃO TOTAL')}: ${tText('Esta operação liquidará permanentemente a dívida desta fatura.')}` 
                              : `${tText('AMORTIZAÇÃO PARCIAL')}: ${tText('Ficará um saldo devedor de')} ${novoRestante.toLocaleString(locale)} XOF ${tText('a pagar futuramente.')}`}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Bank selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Banco de Depósito:</label>
                        <select
                          value={bancoSelecionado}
                          onChange={(e) => setBancoSelecionado(e.target.value as any)}
                          className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold border focus:outline-none focus:border-emerald-500 ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-900'
                          }`}
                        >
                          {IMP_INSTITUTIONAL.officialBanks.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bank Slip (Talão) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Nº Talão / Comprovativo:</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: TAL-BAO-998822"
                          value={numeroTalao}
                          onChange={(e) => {
                            setNumeroTalao(e.target.value);
                            setTalaoDuplicadoError('');
                          }}
                          className={`w-full rounded-xl px-3 py-2.5 text-xs font-black font-mono border focus:outline-none focus:border-emerald-500 ${
                            talaoDuplicadoError ? 'border-rose-500' : ''
                          } ${
                            theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className={`flex justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => setFaturaParaLiquidar(null)}
                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
                          theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        disabled={isOverpayment || valorPagamentoInput <= 0}
                        className={`px-8 py-3 text-white rounded-2xl text-xs font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 ${
                          isOverpayment || valorPagamentoInput <= 0
                            ? 'bg-slate-400 cursor-not-allowed opacity-50'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        }`}
                      >
                        <FileCheck2 className="w-4 h-4" />
                        CONFIRMAR PAGAMENTO & EMITIR RECIBO
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW / PRINT OFFICIAL RECEIPT MODAL (A4 & THERMAL FORMATS) */}
      {viewingRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col transition-all duration-300">
            {/* Top Bar for Actions (no-print) */}
            <div className="no-print bg-[#065F46] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                  Recibo Oficial de Quitação • IMP / NHOMINCA
                </span>
                <span className="text-sm font-mono font-bold">{viewingRecibo.nRecibo}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Official A4 Exclusive Badge */}
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Formato Oficial A4 (Duplo)
                </div>

                {/* Primary: Imprimir Recibo */}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-400/25 transition-all active:scale-95 cursor-pointer"
                  title={tText('Enviar documento para a impressora')}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Recibo</span>
                </button>

                {/* Secondary: Baixar PDF */}
                <button
                  onClick={() => handleDownloadPDF(viewingRecibo.nRecibo)}
                  disabled={isExportingPDF}
                  className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={tText('Descarregar ficheiro PDF')}
                >
                  {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{isExportingPDF ? 'Gerando...' : 'PDF'}</span>
                </button>

                <button
                  onClick={() => setViewingRecibo(null)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title={tText('Fechar')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (Dual A4 Printable styling with central cut line) */}
            <div className="p-0 overflow-y-auto bg-slate-100 flex justify-center py-6">
              <div
                id="printable-document"
                ref={documentRef}
                className="bg-white shadow-xl origin-top pdf-export-container printable-document printable-area text-slate-950 w-[210mm] min-h-[297mm] p-6"
              >
                <DualA4Document
                  title={`RECIBO DE QUITAÇÃO`}
                  documentNumber={viewingRecibo.nRecibo}
                  date={viewingRecibo.data}
                  payerName={viewingRecibo.cliente + (viewingRecibo.navio ? ` (Navio: ${viewingRecibo.navio})` : '')}
                  amount={viewingRecibo.valor}
                  amountInWords={valorPorExtensoXOF(viewingRecibo.valor)}
                  description={`Pagamento da Fatura N.º ${viewingRecibo.nFatura} (Talão ${viewingRecibo.talao})`}
                  paymentReference={viewingRecibo.talao}
                  bank={viewingRecibo.banco}
                  treasuryOfficial={viewingRecibo.emissor}
                />

                {/* Action button inside document bottom for operator convenience (hidden in print) */}
                <div className="no-print mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3 px-6">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{tText('Imprimir Recibo Duplo (A4)')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / PRINT OFFICIAL CASH OUTFLOW VOUCHER MODAL */}
      {viewingSaidaDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col transition-all duration-300">
            {/* Top Bar for Actions */}
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                  Guia de Saída de Caixa
                </span>
                <span className="text-sm font-mono font-bold">{viewingSaidaDoc.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-400/40 text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  Formato Oficial A4
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all active:scale-95 cursor-pointer"
                  title={tText('Enviar guia para a impressora')}
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Imprimir Guia')}</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF(`IMP_SAIDA_${viewingSaidaDoc.id}`)}
                  disabled={isExportingPDF}
                  className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{isExportingPDF ? 'Gerando...' : 'PDF'}</span>
                </button>
                <button
                  onClick={() => setViewingSaidaDoc(null)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-0 overflow-y-auto bg-slate-100 flex justify-center py-8">
              <div
                id="printable-document"
                ref={documentRef}
                className="bg-white shadow-xl origin-top pdf-export-container printable-document printable-area w-[210mm] min-h-[297mm] p-12 text-slate-900"
              >
                {/* Institutional Header */}
                <div className="text-center space-y-2 mb-8 document-header">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="font-black text-xs sm:text-sm tracking-widest uppercase text-slate-800">
                      REPÚBLICA DA
                    </span>
                    <div className="republic-emblem-container inline-flex items-center justify-center">
                      <GuineBissauCoatOfArms className="w-8 h-8 inline-block shrink-0" />
                    </div>
                    <span className="font-black text-xs sm:text-sm tracking-widest uppercase text-slate-800">
                      GUINÉ-BISSAU
                    </span>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                    MINISTÉRIO DOS TRANSPORTES, TELECOMUNICAÇÕES E ECONOMIA DIGITAL
                  </div>
                  <div className="font-black text-xl text-rose-900 uppercase leading-tight">
                    {IMP_INSTITUTIONAL.entity}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono font-bold">
                    NIF: {IMP_INSTITUTIONAL.nif} • ORDEM DE DESPESA INTERNA
                  </div>
                </div>

                <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-2xl mb-8 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 block mb-1">COMPROVATIVO DE SAÍDA Nº:</span>
                    <div className="text-2xl font-mono font-black text-rose-900">{viewingSaidaDoc.id}</div>
                    <div className="text-[11px] text-rose-600 font-bold mt-1">Data: {viewingSaidaDoc.data} • {viewingSaidaDoc.hora}</div>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-xl border-2 border-rose-300 flex items-center justify-center text-rose-700 shadow-sm">
                    <QrCode className="w-10 h-10" />
                  </div>
                </div>

                <div className="space-y-6 mb-10 text-xs">
                  <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Beneficiário:</span>
                      <div className="font-black text-slate-900 uppercase">{viewingSaidaDoc.beneficiario}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Categoria:</span>
                      <div className="font-bold text-rose-700">{viewingSaidaDoc.categoria}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b pb-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Doc. Comprovativo:</span>
                      <div className="font-mono font-bold text-slate-700">{viewingSaidaDoc.documentoComprovativo}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Autorizado por:</span>
                      <div className="font-bold text-slate-900">{viewingSaidaDoc.autorizado_por}</div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Descrição da Despesa:</span>
                    <div className="text-slate-800 leading-relaxed italic font-medium">
                      "{viewingSaidaDoc.justificativa || viewingSaidaDoc.descricao}"
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-rose-900 text-white rounded-2xl shadow-xl shadow-rose-900/20">
                    <span className="font-black text-sm uppercase tracking-widest">Valor do Desembolso:</span>
                    <span className="text-3xl font-black font-mono">-{viewingSaidaDoc.valor.toLocaleString(locale)} XOF</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-200">
                  <div className="text-center space-y-10">
                    <div className="text-[9px] font-bold uppercase text-slate-400">O Beneficiário</div>
                    <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500">_________________</div>
                  </div>
                  <div className="text-center space-y-10">
                    <div className="text-[9px] font-bold uppercase text-slate-400">Operador Caixa</div>
                    <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 font-mono">{viewingSaidaDoc.criado_por}</div>
                  </div>
                  <div className="text-center space-y-10">
                    <div className="text-[9px] font-bold uppercase text-slate-400">Direcção Geral</div>
                    <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 font-mono">Visto & Homologado</div>
                  </div>
                </div>

                <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-mono text-slate-300 uppercase">
                  <span>Voucher ID: {viewingSaidaDoc.id}</span>
                  <span>IMP Guiné-Bissau • Tesouraria Central</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTAR NOVA SAÍDA DE CAIXA MODAL (COM PROVAS & COMPROVATIVO OBRIGATÓRIO) */}
      {showNovaSaidaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <FileMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Lançamento de Saída Justificada de Caixa
                  </h3>
                  <span className="text-xs text-slate-500">{tText('Exige comprovativo documental institucional')}</span>
                </div>
              </div>
              <button
                onClick={() => setShowNovaSaidaModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-between font-mono text-xs">
              <span className="text-slate-500">Saldo Atual Disponível em Caixa:</span>
              <span className="font-bold text-emerald-500 text-sm">
                {saldoAtualEmCaixa.toLocaleString(locale)} XOF
              </span>
            </div>

            {/* Cash Insufficiency Warning */}
            {saidaForm.valor > saldoAtualEmCaixa && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">SALDO INSUFICIENTE EM CAIXA</span>
                  O valor da saída solicitada ({saidaForm.valor.toLocaleString(locale)} XOF) excede o saldo físico existente em caixa ({saldoAtualEmCaixa.toLocaleString(locale)} XOF). Não é permitida saída sem suprimento prévio.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitNovaSaida} className="space-y-3.5 text-xs">
              {/* Beneficiary & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Beneficiário / Entidade Credora:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Petroguine SARL ou Comandante Geba"
                    value={saidaForm.beneficiario}
                    onChange={(e) => setSaidaForm({ ...saidaForm, beneficiario: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-rose-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Categoria da Despesa:</label>
                  <select
                    value={saidaForm.categoria}
                    onChange={(e) => setSaidaForm({ ...saidaForm, categoria: e.target.value as any })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-rose-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Combustível Embarcações">Combustível Lanchas/Rebocadores</option>
                    <option value="Despesa Operacional">Despesa Operacional Portuária</option>
                    <option value="Manutenção & Faróis">Manutenção de Faróis & Balizamento</option>
                    <option value="Expediente & Material">Expediente de Escritório & Material</option>
                    <option value="Sangria Bancária">Sangria / Depósito Bancário da Receita</option>
                    <option value="Suprimento Caixa">Suprimento de Fundo de Maneio</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Valor da Saída em XOF (Franco CFA):</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={saldoAtualEmCaixa}
                  step="500"
                  value={saidaForm.valor}
                  onChange={(e) => setSaidaForm({ ...saidaForm, valor: Number(e.target.value) || 0 })}
                  className={`w-full rounded-xl px-3 py-2 font-mono font-bold text-sm border focus:outline-none focus:border-rose-500 ${
                    saidaForm.valor > saldoAtualEmCaixa
                      ? 'border-rose-500 bg-rose-50/20 text-rose-600'
                      : theme === 'dark'
                      ? 'bg-slate-950 border-slate-800 text-rose-400'
                      : 'bg-slate-50 border-slate-200 text-rose-600'
                  }`}
                />
              </div>

              {/* Document Proof & Authorizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">
                    Nº Doc. Comprovativo (Fatura/Recibo):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: FAT-FORN-2026-081"
                    value={saidaForm.documentoComprovativo}
                    onChange={(e) => setSaidaForm({ ...saidaForm, documentoComprovativo: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 font-mono border focus:outline-none focus:border-rose-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 block">Autorizado Superiormente Por:</label>
                  <input
                    type="text"
                    required
                    value={saidaForm.autorizado_por}
                    onChange={(e) => setSaidaForm({ ...saidaForm, autorizado_por: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-rose-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Description & Justification */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Descrição Resumida do Movimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Aquisição de 450L gasóleo para lancha de pilotagem Geba"
                  value={saidaForm.descricao}
                  onChange={(e) => setSaidaForm({ ...saidaForm, descricao: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-rose-500 ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Justificativa da Necessidade Operacional:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalhes que justificam o pagamento urgente pelo caixa..."
                  value={saidaForm.justificativa}
                  onChange={(e) => setSaidaForm({ ...saidaForm, justificativa: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-rose-500 resize-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Upload Proof Document (Simulation) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Anexo de Prova / Fatura Escaneada (Opcional):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSaidaForm({ ...saidaForm, anexoNome: file.name });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>{saidaForm.anexoNome ? saidaForm.anexoNome : 'Carregar Comprovativo Digital (PDF/JPG)'}</span>
                  </button>
                  {saidaForm.anexoNome && (
                    <button
                      type="button"
                      onClick={() => setSaidaForm({ ...saidaForm, anexoNome: '' })}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowNovaSaidaModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saidaForm.valor > saldoAtualEmCaixa || saidaForm.valor <= 0}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all ${
                    saidaForm.valor > saldoAtualEmCaixa || saidaForm.valor <= 0
                      ? 'bg-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  <FileMinus className="w-4 h-4" />
                  Homologar Saída de Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAILY CLOSING STATEMENT MODAL (FOLHA DE FECHO DE CAIXA) */}
      {showFechoFolhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="no-print bg-[#0B2B59] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                  Balancete de Fecho Diário
                </span>
                <span className="text-sm font-mono font-bold">Folha de Caixa • {new Date().toLocaleDateString(locale)}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Official A4 Exclusive Badge */}
                <div className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-400/40 text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Formato Oficial A4
                </div>

                {/* Primary: Imprimir Balancete */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                  title={tText('Enviar balancete para a impressora')}
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Imprimir Balancete')}</span>
                </button>

                {/* Secondary: Baixar PDF Oficial */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(`IMP_FECHO_CAIXA_${new Date().toISOString().slice(0,10)}`)}
                  disabled={isExportingPDF}
                  className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={tText('Descarregar ficheiro PDF oficial')}
                >
                  {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{isExportingPDF ? 'Gerando...' : 'Baixar PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFechoFolhaModal(false)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title={tText('Fechar')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-0 overflow-y-auto bg-slate-100 flex justify-center py-8">
              <div
                id="printable-document"
                ref={documentRef}
                className="bg-white shadow-xl origin-top pdf-export-container printable-document printable-area w-[210mm] min-h-[297mm] p-12 text-slate-900"
              >
                {/* Institutional Header with Helm Logo on Left and Coat of Arms in Middle */}
                <div className="mb-8 pb-6 border-b-2 border-slate-200 document-header">
                  <div className="flex items-center justify-between gap-4">
                    {/* Enlarged IMP Nautical Helm Logo on Left */}
                    <div className="shrink-0 flex items-center justify-center">
                      <IMPOfficialHelmEmblem className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                    </div>

                    {/* State Text & Centered Coat of Arms */}
                    <div className="flex-1 text-center space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-black text-sm tracking-widest uppercase text-slate-800">
                          REPÚBLICA DA
                        </span>
                        <div className="republic-emblem-container inline-flex items-center justify-center">
                          <GuineBissauCoatOfArms className="w-8 h-8 inline-block shrink-0" />
                        </div>
                        <span className="font-black text-sm tracking-widest uppercase text-slate-800">
                          GUINÉ-BISSAU
                        </span>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">
                        MINISTÉRIO DOS TRANSPORTES, TELECOMUNICAÇÕES E ECONOMIA DIGITAL
                      </div>
                      <div className="font-black text-xl text-[#0B2B59] uppercase">
                        {IMP_INSTITUTIONAL.entity}
                      </div>
                      <div className="text-xs text-slate-500 font-mono font-bold">
                        BALANCETE DIÁRIO DE TESOURARIA • DIRECÇÃO DE ADMINISTRAÇÃO E FINANÇAS
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                        DOCUMENTO DE AUDITORIA DGCI • EXERCÍCIO 2026
                      </div>
                    </div>

                    {/* QR Code / Audit Badge on Right */}
                    <div className="shrink-0 flex flex-col items-center justify-center border-l border-slate-200 pl-4">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center text-slate-700">
                        <QrCode className="w-9 h-9" />
                      </div>
                      <span className="text-[8px] font-mono font-black text-blue-900 mt-1 uppercase">
                        AUDITORIA IMP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-4 mb-10">
                  <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Saldo Inicial:</span>
                    <div className="text-lg font-black text-slate-900 font-mono">
                      {(movimentos.length > 0 ? movimentos[0].valor : 0).toLocaleString(locale)}
                    </div>
                  </div>
                  <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                    <span className="text-[9px] font-black text-emerald-600 uppercase block mb-1">Total Entradas:</span>
                    <div className="text-lg font-black text-emerald-700 font-mono">
                      +{totalEntradasPeriodo.toLocaleString(locale)}
                    </div>
                  </div>
                  <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-2xl">
                    <span className="text-[9px] font-black text-rose-600 uppercase block mb-1">Total Saídas:</span>
                    <div className="text-lg font-black text-rose-700 font-mono">
                      -{totalSaidasPeriodo.toLocaleString(locale)}
                    </div>
                  </div>
                  <div className="p-5 bg-blue-900 text-white rounded-2xl shadow-xl shadow-blue-900/20">
                    <span className="text-[9px] font-black text-blue-200 uppercase block mb-1">Saldo Final:</span>
                    <div className="text-xl font-black font-mono">
                      {saldoFinal.toLocaleString(locale)}
                    </div>
                  </div>
                </div>

                {/* Detailed Movements Table */}
                <div className="mb-12">
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    Extrato de Movimentos do Período ({new Date().toLocaleDateString(locale)})
                  </h4>
                  <table className="w-full text-[10px] border-collapse">
                    <thead className="bg-slate-100 font-black uppercase text-slate-500 border-y-2 border-slate-200">
                      <tr>
                        <th className="p-3 text-left">Hora</th>
                        <th className="p-3 text-left">Descrição do Lançamento</th>
                        <th className="p-3 text-left">Categoria</th>
                        <th className="p-3 text-right">Entrada</th>
                        <th className="p-3 text-right">Saída</th>
                        <th className="p-3 text-right">Saldo Acum.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {filteredMovimentos.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-500">{m.hora}</td>
                          <td className="p-3 font-sans font-bold text-slate-800">
                            {m.descricao}
                            {m.talao && <span className="block text-[8px] text-blue-500 mt-0.5">TALAO: {m.talao} ({m.banco})</span>}
                            {m.documentoComprovativo && <span className="block text-[8px] text-rose-500 mt-0.5">DOC: {m.documentoComprovativo}</span>}
                          </td>
                          <td className="p-3 text-slate-400">{m.categoria}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">
                            {m.tipo === 'entrada' ? m.valor.toLocaleString(locale) : ''}
                          </td>
                          <td className="p-3 text-right text-rose-600 font-bold">
                            {m.tipo === 'saida' ? m.valor.toLocaleString(locale) : ''}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">
                            {m.saldoApos.toLocaleString(locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Audit & Signatures */}
                <div className="mt-auto">
                  <div className="grid grid-cols-2 gap-20 pt-16 border-t-2 border-slate-100">
                    <div className="text-center space-y-12">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">O Operador de Caixa</div>
                      <div className="flex flex-col items-center">
                        <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                        <span className="text-[10px] font-bold text-slate-800">{currentUser.nome}</span>
                        <span className="text-[9px] text-slate-400">Responsável pela Tesouraria</span>
                      </div>
                    </div>
                    <div className="text-center space-y-12">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Controlo Financeiro (DAF)</div>
                      <div className="flex flex-col items-center">
                        <div className="w-48 border-b-2 border-slate-300 mb-2"></div>
                        <span className="text-[10px] font-bold text-slate-800">Visto e Conferido</span>
                        <span className="text-[9px] text-slate-400">Direcção de Administração e Finanças</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-16 flex justify-between items-center text-[8px] font-mono text-slate-300 uppercase">
                    <span>Gerado em: {new Date().toLocaleString(locale)}</span>
                    <span>Página 1 de 1 • Sistema ERP IMP</span>
                    <span>HASH: {Math.random().toString(36).substring(2, 15).toUpperCase()}</span>
                  </div>

                  {/* Operator convenience action bar (hidden during physical print) */}
                  <div className="no-print mt-8 pt-6 border-t-2 border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{tText('Imprimir Balancete (A4)')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: EMITIR CÉDULA MARÍTIMA */}
      {showEmitirCedulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0B2B59] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Emitir Cédula Marítima • Caixa IMP
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    Registo profissional e liquidação direta da taxa oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmitirCedulaModal(false)}
                className="p-1.5 text-slate-300 hover:text-white bg-blue-900/60 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCedula} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                A emissão gera automaticamente a <strong>Cédula de Inscrição Marítima Oficial</strong> em <strong>Duas Vias A4</strong> com <strong>QR Code de Validação</strong> e regista a entrada de receita na Caixa Central.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome Completo do Marítimo / Requerente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bacar Sanhá / Manuel Gomes Té"
                  value={cedulaForm.nomeMaritimo}
                  onChange={(e) => setCedulaForm({ ...cedulaForm, nomeMaritimo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Categoria Profissional
                  </label>
                  <select
                    value={cedulaForm.categoriaMaritima}
                    onChange={(e) => setCedulaForm({ ...cedulaForm, categoriaMaritima: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Mestre Costeiro">Mestre Costeiro</option>
                    <option value="Marinheiro de 1ª Classe">Marinheiro de 1ª Classe</option>
                    <option value="Marinheiro de 2ª Classe">Marinheiro de 2ª Classe</option>
                    <option value="Motorista Marítimo">Motorista Marítimo</option>
                    <option value="Pescador Artesanal">Pescador Artesanal</option>
                    <option value="Moço de Convés">Moço de Convés</option>
                    <option value="Eletricista Naval">Eletricista Naval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Embarcação Base / Porto
                  </label>
                  <input
                    type="text"
                    value={cedulaForm.embarcacaoPorto}
                    onChange={(e) => setCedulaForm({ ...cedulaForm, embarcacaoPorto: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Valor Taxa (XOF)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={cedulaForm.valorTaxa}
                    onChange={(e) => setCedulaForm({ ...cedulaForm, valorTaxa: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Validade (Anos)
                  </label>
                  <select
                    value={cedulaForm.validadeAnos}
                    onChange={(e) => setCedulaForm({ ...cedulaForm, validadeAnos: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={1}>1 Ano</option>
                    <option value={2}>2 Anos (Padrão)</option>
                    <option value={3}>3 Anos</option>
                    <option value={5}>5 Anos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banco de Depósito
                  </label>
                  <select
                    value={cedulaForm.banco}
                    onChange={(e) => setCedulaForm({ ...cedulaForm, banco: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="BAO">BAO</option>
                    <option value="BDU">BDU</option>
                    <option value="ORABANK">ORABANK</option>
                    <option value="ECOBANK">ECOBANK</option>
                    <option value="CORIS">CORIS</option>
                    <option value="Caixa Geral IMP">Caixa Geral IMP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nº Talão Bancário / Comprovativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: TAL-BAO-918231 (deixe em branco para gerar auto)"
                  value={cedulaForm.numeroTalao}
                  onChange={(e) => setCedulaForm({ ...cedulaForm, numeroTalao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEmitirCedulaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Concluir & Emitir Cédula (Duplo A4)')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMITIR LICENÇA */}
      {showEmitirLicencaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#065F46] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Emitir Licença • Caixa IMP
                  </h3>
                  <p className="text-[10px] text-emerald-200">
                    Concessão oficial de licença de navegação, pesca e atividade portuária
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmitirLicencaModal(false)}
                className="p-1.5 text-slate-300 hover:text-white bg-emerald-950/60 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLicenca} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome do Titular / Armador / Entidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Armadores Unidos de Bolama / Sociedade de Pesca"
                  value={licencaForm.titular}
                  onChange={(e) => setLicencaForm({ ...licencaForm, titular: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Licença
                  </label>
                  <select
                    value={licencaForm.tipoLicenca}
                    onChange={(e) => setLicencaForm({ ...licencaForm, tipoLicenca: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Licença de Navegação e Tráfego">Licença de Navegação e Tráfego</option>
                    <option value="Licença de Pesca Artesanal">Licença de Pesca Artesanal</option>
                    <option value="Licença de Transporte de Cabotagem">Licença de Transporte de Cabotagem</option>
                    <option value="Licença Especial Portuária">Licença Especial Portuária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Embarcação Associada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lancha Bijagós 01 / Rio Geba"
                    value={licencaForm.embarcacao}
                    onChange={(e) => setLicencaForm({ ...licencaForm, embarcacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Valor Taxa (XOF)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={licencaForm.valorTaxa}
                    onChange={(e) => setLicencaForm({ ...licencaForm, valorTaxa: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Validade
                  </label>
                  <select
                    value={licencaForm.validadeAnos}
                    onChange={(e) => setLicencaForm({ ...licencaForm, validadeAnos: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={1}>1 Ano (Padrão)</option>
                    <option value={2}>2 Anos</option>
                    <option value={3}>3 Anos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banco de Liquidação
                  </label>
                  <select
                    value={licencaForm.banco}
                    onChange={(e) => setLicencaForm({ ...licencaForm, banco: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="ORABANK">ORABANK</option>
                    <option value="BAO">BAO</option>
                    <option value="BDU">BDU</option>
                    <option value="ECOBANK">ECOBANK</option>
                    <option value="CORIS">CORIS</option>
                    <option value="Caixa Geral IMP">Caixa Geral IMP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nº Talão Bancário / Comprovativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: TAL-ORA-871920 (deixe em branco para gerar auto)"
                  value={licencaForm.numeroTalao}
                  onChange={(e) => setLicencaForm({ ...licencaForm, numeroTalao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEmitirLicencaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Concluir & Emitir Licença (Duplo A4)')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAÍDA DE CANOA */}
      {showSaidaCanoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#9A3412] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Despacho de Saída de Canoa • Caixa IMP
                  </h3>
                  <p className="text-[10px] text-amber-200">
                    Registo de largada, controlo de passageiros e cobrança de taxa portuária
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaidaCanoaModal(false)}
                className="p-1.5 text-slate-300 hover:text-white bg-amber-950/60 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSaidaCanoa} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome da Canoa / Piroga *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Menina de Bubaque / Estrela do Geba"
                    value={saidaCanoaForm.nomeCanoa}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, nomeCanoa: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Mestre / Condutor da Canoa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mestre Bacar Camará"
                    value={saidaCanoaForm.mestreCanoa}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, mestreCanoa: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Porto / Destino da Travessia
                  </label>
                  <select
                    value={saidaCanoaForm.portoDestino}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, portoDestino: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Ilha de Bubaque">Ilha de Bubaque</option>
                    <option value="Bolama">Bolama</option>
                    <option value="Enxudé">Enxudé</option>
                    <option value="Cacheu">Cacheu</option>
                    <option value="Quinhamel">Quinhamel</option>
                    <option value="Farim">Farim</option>
                    <option value="Bafatá">Bafatá</option>
                    <option value="Caravela">Caravela</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nº de Passageiros a Bordo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={saidaCanoaForm.numPassageiros}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, numPassageiros: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Taxa de Despacho (XOF)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={saidaCanoaForm.taxaDespacho}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, taxaDespacho: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Carga Declarada
                  </label>
                  <input
                    type="text"
                    value={saidaCanoaForm.cargaDeclarada}
                    onChange={(e) => setSaidaCanoaForm({ ...saidaCanoaForm, cargaDeclarada: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                A autorização de largada é válida por <strong>24 Horas para Travessia Marítima</strong> e inclui o código QR de fiscalização para a Capitania dos Portos e Guarda Costeira.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSaidaCanoaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Concluir & Emitir Saída de Canoa (Duplo A4)')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOMÍNIO PÚBLICO MARÍTIMO */}
      {showDominioPublicoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#1E1B4B] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Concessão de Domínio Público Marítimo • Caixa IMP
                  </h3>
                  <p className="text-[10px] text-indigo-200">
                    Registo de ocupação de cais, parcelas portuárias e cobrança de taxas de uso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDominioPublicoModal(false)}
                className="p-1.5 text-slate-300 hover:text-white bg-indigo-950/60 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDominioPublico} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Concessionário / Entidade Ocupante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Guiné Logística Portuária Lda / Armazéns do Pidjiguiti"
                  value={dominioPublicoForm.concessionario}
                  onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, concessionario: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Zona Portuária / Localização
                  </label>
                  <select
                    value={dominioPublicoForm.zonaPortuaria}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, zonaPortuaria: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Cais de Pidjiguiti / Zona Portuária de Bissau">Cais de Pidjiguiti (Bissau)</option>
                    <option value="Porto Comercial de Bissau (Cais Velho)">Porto Comercial (Cais Velho)</option>
                    <option value="Terminal de Cabotagem de Biombo">Terminal de Biombo</option>
                    <option value="Zona Portuária de Cacheu">Zona Portuária de Cacheu</option>
                    <option value="Cais de Bubaque / Arquipélago">Cais de Bubaque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Área Ocupada (m²)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dominioPublicoForm.areaM2}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, areaM2: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo de Ocupação / Uso
                  </label>
                  <select
                    value={dominioPublicoForm.tipoOcupacao}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, tipoOcupacao: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Ocupação de Cais e Armazém Portuário">Ocupação de Cais e Armazém</option>
                    <option value="Estaleiro Naval e Reparação">Estaleiro Naval e Reparação</option>
                    <option value="Posto de Abastecimento Marítimo">Posto de Abastecimento Marítimo</option>
                    <option value="Cais de Descarga de Pescado">Cais de Descarga de Pescado</option>
                    <option value="Pontão de Atracação Temporária">Pontão de Atracação Temporária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Período de Validade
                  </label>
                  <select
                    value={dominioPublicoForm.validadeMeses}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, validadeMeses: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value={3}>3 Meses (Trimestral)</option>
                    <option value={6}>6 Meses (Semestral)</option>
                    <option value={12}>12 Meses (1 Ano - Padrão)</option>
                    <option value={24}>24 Meses (2 Anos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Valor da Taxa Oficial (XOF) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={dominioPublicoForm.valorTaxa}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, valorTaxa: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white font-mono font-bold text-indigo-700"
                  />
                  <span className="text-[10px] text-slate-500 font-serif italic mt-0.5 block">
                    {valorPorExtensoXOF(dominioPublicoForm.valorTaxa)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banco de Liquidação
                  </label>
                  <select
                    value={dominioPublicoForm.banco}
                    onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, banco: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="BAO">BAO (Banco da África Ocidental)</option>
                    <option value="CORIS BANK">CORIS BANK International</option>
                    <option value="BANQUE ATLANTIQUE">BANQUE ATLANTIQUE</option>
                    <option value="ORABANK">ORABANK Guiné-Bissau</option>
                    <option value="Caixa Geral IMP">Caixa Geral IMP (Numerário)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nº do Talão / Comprovativo Bancário
                </label>
                <input
                  type="text"
                  placeholder="Ex: TAL-BAO-492817 (Deixe em branco para gerar automático)"
                  value={dominioPublicoForm.numeroTalao}
                  onChange={(e) => setDominioPublicoForm({ ...dominioPublicoForm, numeroTalao: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-[11px]">
                O Título de Ocupação de Domínio Público é emitido em <strong>Duplo A4 oficial</strong> (1ª via Concessionário e 2ª via IMP Arquivo) com QR Code autenticado pela base de dados central.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDominioPublicoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{tText('Concluir & Emitir Domínio Público (Duplo A4)')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO DUPLO A4: CÉDULAS, LICENÇAS E SAÍDAS DE CANOA */}
      {viewingEmissaoDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl border border-slate-300 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col transition-all duration-300">
            {/* Top Bar for Actions (no-print) */}
            <div className="no-print bg-[#082B59] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                  {viewingEmissaoDoc.title} • IMP OFICIAL
                </span>
                <span className="text-sm font-mono font-bold">{viewingEmissaoDoc.documentNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Official A4 Exclusive Badge */}
                <div className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-400/40 text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Formato Oficial A4 (Duplo)
                </div>

                {/* Primary: Imprimir */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                  title={tText('Enviar documento para a impressora')}
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento</span>
                </button>

                {/* Secondary: Baixar PDF */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(viewingEmissaoDoc.documentNumber)}
                  disabled={isExportingPDF}
                  className={`px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={tText('Descarregar ficheiro PDF')}
                >
                  {isExportingPDF ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{isExportingPDF ? 'Gerando...' : 'PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingEmissaoDoc(null)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title={tText('Fechar')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (Dual A4 Printable styling with central cut line) */}
            <div className="p-0 overflow-y-auto bg-slate-100 flex justify-center py-6">
              <div
                id="printable-document"
                ref={documentRef}
                className="bg-white shadow-xl origin-top pdf-export-container printable-document printable-area text-slate-950 w-[210mm] min-h-[297mm] p-6"
              >
                <DualA4Document
                  title={viewingEmissaoDoc.title}
                  documentNumber={viewingEmissaoDoc.documentNumber}
                  date={viewingEmissaoDoc.date}
                  payerName={viewingEmissaoDoc.payerName}
                  amount={viewingEmissaoDoc.amount}
                  amountInWords={viewingEmissaoDoc.amountInWords}
                  description={viewingEmissaoDoc.description}
                  paymentReference={viewingEmissaoDoc.paymentReference}
                  bank={viewingEmissaoDoc.bank}
                  treasuryOfficial={viewingEmissaoDoc.treasuryOfficial}
                  documentType={viewingEmissaoDoc.documentType}
                  validityDate={viewingEmissaoDoc.validityDate}
                  vesselName={viewingEmissaoDoc.vesselName}
                />

                {/* Operator convenience action button */}
                <div className="no-print mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3 px-6">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{tText('Imprimir Duplo (A4)')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MASTER UNIFIED AUDIT MODAL (FATURAÇÃO + CAIXA) */}
      {showVisaoGeralModal && (
        <VisaoGeralModal
          faturas={faturas}
          recibos={recibos}
          movimentos={movimentos}
          currentUser={currentUser}
          onClose={() => setShowVisaoGeralModal(false)}
          onViewFatura={(fat) => {
            setShowVisaoGeralModal(false);
          }}
          onViewRecibo={(rec) => {
            setShowVisaoGeralModal(false);
            setViewingRecibo(rec);
          }}
        />
      )}
    </div>
  );
}
