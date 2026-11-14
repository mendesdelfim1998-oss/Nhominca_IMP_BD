import { db, isDatabaseConfigured } from './index.ts';
import { users, faturas, recibos, caixaMovs, auditoriaLogs, embarcacoes, agencias, armadores, atracacoes } from './schema.ts';
import { desc, eq } from 'drizzle-orm';
import { mockUtilizadores, mockFaturasIMP, mockRecibosIMP, mockCaixaMovs, mockAuditoriaLogs, mockEmbarcacoes, mockAgencias, mockArmadores, mockAtracacoes } from '../mock/data.ts';

// ---------------- USER QUERIES ----------------
export async function getUsers() {
  if (!isDatabaseConfigured() || !db) return mockUtilizadores;
  try {
    const res = await db.select().from(users);
    if (res && res.length > 0) return res;
    return mockUtilizadores;
  } catch (error) {
    console.warn('PostgreSQL fetch users warning, falling back to initial data:', error);
    return mockUtilizadores;
  }
}

export async function upsertUser(userData: any) {
  if (!isDatabaseConfigured() || !db) return { ...userData, uid: userData.id || userData.uid };
  try {
    const existing = await db.select().from(users).where(eq(users.uid, userData.id || userData.uid)).limit(1);
    if (existing.length > 0) {
      const updated = await db.update(users).set({
        nome: userData.nome,
        email: userData.email,
        cargo: userData.cargo,
        funcao: userData.funcao,
        role: userData.role || userData.funcao,
        departamento: userData.departamento || 'Operações Marítimas',
        status: userData.status || 'Ativo',
        active: userData.active !== undefined ? userData.active : true,
        avatar: userData.avatar,
        fotoUrl: userData.fotoUrl || userData.avatar,
        telefone: userData.telefone,
        senha: userData.senha,
        ultimoAcesso: userData.ultimoAcesso || new Date().toISOString()
      }).where(eq(users.uid, userData.id || userData.uid)).returning();
      return updated[0];
    } else {
      const inserted = await db.insert(users).values({
        uid: userData.id || userData.uid || `USR-${Date.now()}`,
        nome: userData.nome,
        email: userData.email,
        cargo: userData.cargo,
        funcao: userData.funcao,
        role: userData.role || userData.funcao,
        departamento: userData.departamento || 'Operações Marítimas',
        status: userData.status || 'Ativo',
        active: userData.active !== undefined ? userData.active : true,
        avatar: userData.avatar,
        fotoUrl: userData.fotoUrl || userData.avatar,
        telefone: userData.telefone,
        senha: userData.senha || 'imp123',
        ultimoAcesso: userData.ultimoAcesso || new Date().toISOString()
      }).returning();
      return inserted[0];
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    return { ...userData, uid: userData.id || userData.uid };
  }
}

// ---------------- FATURAS QUERIES ----------------
export async function getFaturas() {
  if (!isDatabaseConfigured() || !db) {
    return mockFaturasIMP.map(f => ({
      id: f.id, faturaUid: f.id, ano: f.ano, seq: f.seq, nFatura: f.nFatura, data: f.data, cliente: f.cliente, nif: f.nif, navio: f.navio, tipo: f.tipo, grossTonnage: f.gross_tonnage, itens: f.itens, subtotal: f.subtotal, iva: f.iva, total: f.total, saldoPago: f.saldo_pago, saldoPendente: f.saldo_pendente, recibos: f.recibos, estado: f.estado, criadoPor: f.criado_por, justificativaAnulacao: f.justificativaAnulacao, anuladoPor: f.anulado_por, dataAnulacao: f.data_anulacao
    }));
  }
  try {
    const res = await db.select().from(faturas).orderBy(desc(faturas.id));
    if (res && res.length > 0) return res;
    return mockFaturasIMP.map(f => ({
      id: f.id,
      faturaUid: f.id,
      ano: f.ano,
      seq: f.seq,
      nFatura: f.nFatura,
      data: f.data,
      cliente: f.cliente,
      nif: f.nif,
      navio: f.navio,
      tipo: f.tipo,
      grossTonnage: f.gross_tonnage,
      itens: f.itens,
      subtotal: f.subtotal,
      iva: f.iva,
      total: f.total,
      saldoPago: f.saldo_pago,
      saldoPendente: f.saldo_pendente,
      recibos: f.recibos,
      estado: f.estado,
      criadoPor: f.criado_por,
      justificativaAnulacao: f.justificativaAnulacao,
      anuladoPor: f.anulado_por,
      dataAnulacao: f.data_anulacao
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch faturas warning, falling back to initial data:', error);
    return mockFaturasIMP.map(f => ({
      id: f.id,
      faturaUid: f.id,
      ano: f.ano,
      seq: f.seq,
      nFatura: f.nFatura,
      data: f.data,
      cliente: f.cliente,
      nif: f.nif,
      navio: f.navio,
      tipo: f.tipo,
      grossTonnage: f.gross_tonnage,
      itens: f.itens,
      subtotal: f.subtotal,
      iva: f.iva,
      total: f.total,
      saldoPago: f.saldo_pago,
      saldoPendente: f.saldo_pendente,
      recibos: f.recibos,
      estado: f.estado,
      criadoPor: f.criado_por,
      justificativaAnulacao: f.justificativaAnulacao,
      anuladoPor: f.anulado_por,
      dataAnulacao: f.data_anulacao
    }));
  }
}

export async function insertFatura(faturaData: any) {
  if (!isDatabaseConfigured() || !db) return { ...faturaData, faturaUid: faturaData.id || faturaData.nFatura };
  try {
    const inserted = await db.insert(faturas).values({
      faturaUid: faturaData.id || faturaData.nFatura,
      ano: faturaData.ano || 2026,
      seq: faturaData.seq || 1,
      nFatura: faturaData.nFatura,
      data: faturaData.data,
      cliente: faturaData.cliente,
      nif: faturaData.nif,
      navio: faturaData.navio,
      tipo: faturaData.tipo || 'Pesqueiro',
      grossTonnage: Number(faturaData.gross_tonnage || 0),
      itens: faturaData.itens || [],
      subtotal: Number(faturaData.subtotal || 0),
      iva: Number(faturaData.iva || 0),
      total: Number(faturaData.total || 0),
      saldoPago: Number(faturaData.saldo_pago || 0),
      saldoPendente: Number(faturaData.saldo_pendente || faturaData.total || 0),
      recibos: faturaData.recibos || [],
      estado: faturaData.estado || 'rascunho',
      criadoPor: faturaData.criado_por || 'Sistema IMP',
      justificativaAnulacao: faturaData.justificativaAnulacao || null,
      anuladoPor: faturaData.anulado_por || null,
      dataAnulacao: faturaData.data_anulacao || null
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting fatura into PostgreSQL:', error);
    return { ...faturaData, faturaUid: faturaData.id || faturaData.nFatura };
  }
}

export async function updateFatura(faturaUid: string, updates: any) {
  if (!isDatabaseConfigured() || !db) return { faturaUid, ...updates };
  try {
    const fieldsToUpdate: any = {};
    if (updates.estado !== undefined) fieldsToUpdate.estado = updates.estado;
    if (updates.saldo_pago !== undefined) fieldsToUpdate.saldoPago = updates.saldo_pago;
    if (updates.saldoPago !== undefined) fieldsToUpdate.saldoPago = updates.saldoPago;
    if (updates.saldo_pendente !== undefined) fieldsToUpdate.saldoPendente = updates.saldo_pendente;
    if (updates.saldoPendente !== undefined) fieldsToUpdate.saldoPendente = updates.saldoPendente;
    if (updates.recibos !== undefined) fieldsToUpdate.recibos = updates.recibos;
    if (updates.itens !== undefined) fieldsToUpdate.itens = updates.itens;
    if (updates.subtotal !== undefined) fieldsToUpdate.subtotal = updates.subtotal;
    if (updates.iva !== undefined) fieldsToUpdate.iva = updates.iva;
    if (updates.total !== undefined) fieldsToUpdate.total = updates.total;
    if (updates.justificativaAnulacao !== undefined) fieldsToUpdate.justificativaAnulacao = updates.justificativaAnulacao;
    if (updates.anulado_por !== undefined) fieldsToUpdate.anuladoPor = updates.anulado_por;
    if (updates.data_anulacao !== undefined) fieldsToUpdate.dataAnulacao = updates.data_anulacao;

    const updated = await db.update(faturas)
      .set(fieldsToUpdate)
      .where(eq(faturas.faturaUid, faturaUid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Error updating fatura in PostgreSQL:', error);
    return { faturaUid, ...updates };
  }
}

// ---------------- RECIBOS QUERIES ----------------
export async function getRecibos() {
  if (!isDatabaseConfigured() || !db) {
    return mockRecibosIMP.map(r => ({
      ...r,
      reciboUid: r.id,
      faturaId: r.fatura_id,
      valorAnteriorPago: r.valorAnteriorPago,
      saldoRestante: r.saldoRestante,
      isLiquidacaoTotal: r.isLiquidacaoTotal
    }));
  }
  try {
    const res = await db.select().from(recibos).orderBy(desc(recibos.id));
    if (res && res.length > 0) return res;
    return mockRecibosIMP.map(r => ({
      ...r,
      reciboUid: r.id,
      faturaId: r.fatura_id,
      valorAnteriorPago: r.valorAnteriorPago,
      saldoRestante: r.saldoRestante,
      isLiquidacaoTotal: r.isLiquidacaoTotal
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch recibos warning, falling back to initial data:', error);
    return mockRecibosIMP.map(r => ({
      ...r,
      reciboUid: r.id,
      faturaId: r.fatura_id,
      valorAnteriorPago: r.valorAnteriorPago,
      saldoRestante: r.saldoRestante,
      isLiquidacaoTotal: r.isLiquidacaoTotal
    }));
  }
}

export async function insertRecibo(reciboData: any) {
  if (!isDatabaseConfigured() || !db) return { ...reciboData, reciboUid: reciboData.id || reciboData.nRecibo };
  try {
    const inserted = await db.insert(recibos).values({
      reciboUid: reciboData.id || reciboData.nRecibo,
      nRecibo: reciboData.nRecibo,
      faturaId: reciboData.fatura_id,
      nFatura: reciboData.nFatura,
      totalFatura: Number(reciboData.totalFatura || 0),
      valorAnteriorPago: Number(reciboData.valorAnteriorPago || 0),
      valor: Number(reciboData.valor || 0),
      saldoRestante: Number(reciboData.saldoRestante || 0),
      isLiquidacaoTotal: Boolean(reciboData.isLiquidacaoTotal),
      banco: reciboData.banco || 'CORIS BANK',
      talao: reciboData.talao || '',
      data: reciboData.data,
      hora: reciboData.hora,
      emissor: reciboData.emissor,
      cliente: reciboData.cliente,
      navio: reciboData.navio || '',
      observacoes: reciboData.observacoes || ''
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting recibo into PostgreSQL:', error);
    return { ...reciboData, reciboUid: reciboData.id || reciboData.nRecibo };
  }
}

// ---------------- CAIXA QUERIES ----------------
export async function getCaixaMovs() {
  if (!isDatabaseConfigured() || !db) {
    return mockCaixaMovs.map(m => ({
      ...m,
      movUid: m.id,
      saldoApos: m.saldoApos,
      criadoPor: m.criado_por,
      documentoComprovativo: m.documentoComprovativo,
      autorizadoPor: m.autorizado_por,
      comprovativoAnexo: m.comprovativoAnexo
    }));
  }
  try {
    const res = await db.select().from(caixaMovs).orderBy(desc(caixaMovs.id));
    if (res && res.length > 0) return res;
    return mockCaixaMovs.map(m => ({
      ...m,
      movUid: m.id,
      saldoApos: m.saldoApos,
      criadoPor: m.criado_por,
      documentoComprovativo: m.documentoComprovativo,
      autorizadoPor: m.autorizado_por,
      comprovativoAnexo: m.comprovativoAnexo
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch caixa movements warning, falling back to initial data:', error);
    return mockCaixaMovs.map(m => ({
      ...m,
      movUid: m.id,
      saldoApos: m.saldoApos,
      criadoPor: m.criado_por,
      documentoComprovativo: m.documentoComprovativo,
      autorizadoPor: m.autorizado_por,
      comprovativoAnexo: m.comprovativoAnexo
    }));
  }
}

export async function insertCaixaMov(movData: any) {
  if (!isDatabaseConfigured() || !db) return { ...movData, movUid: movData.id || `MOV-${Date.now()}` };
  try {
    const inserted = await db.insert(caixaMovs).values({
      movUid: movData.id || `MOV-${Date.now()}`,
      data: movData.data,
      hora: movData.hora,
      descricao: movData.descricao,
      tipo: movData.tipo,
      valor: Number(movData.valor || 0),
      saldoApos: Number(movData.saldoApos || 0),
      criadoPor: movData.criado_por || 'Tesouraria',
      categoria: movData.categoria,
      talao: movData.talao || null,
      banco: movData.banco || null,
      documentoComprovativo: movData.documentoComprovativo || null,
      beneficiario: movData.beneficiario || null,
      autorizadoPor: movData.autorizado_por || null,
      justificativa: movData.justificativa || null,
      comprovativoAnexo: movData.comprovativoAnexo || null
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting caixa mov into PostgreSQL:', error);
    return { ...movData, movUid: movData.id || `MOV-${Date.now()}` };
  }
}

// ---------------- AUDITORIA QUERIES ----------------
export async function getAuditoriaLogs() {
  if (!isDatabaseConfigured() || !db) {
    return mockAuditoriaLogs.map(l => ({
      ...l,
      logUid: l.id,
      userId: l.user_id,
      userEmail: l.user_email,
      payloadJson: l.payload_json,
      hashSha256: l.hash_sha256,
      prevHash: l.prev_hash
    }));
  }
  try {
    const res = await db.select().from(auditoriaLogs).orderBy(desc(auditoriaLogs.id));
    if (res && res.length > 0) return res;
    return mockAuditoriaLogs.map(l => ({
      ...l,
      logUid: l.id,
      userId: l.user_id,
      userEmail: l.user_email,
      payloadJson: l.payload_json,
      hashSha256: l.hash_sha256,
      prevHash: l.prev_hash
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch auditoria logs warning, falling back to initial data:', error);
    return mockAuditoriaLogs.map(l => ({
      ...l,
      logUid: l.id,
      userId: l.user_id,
      userEmail: l.user_email,
      payloadJson: l.payload_json,
      hashSha256: l.hash_sha256,
      prevHash: l.prev_hash
    }));
  }
}

export async function insertAuditoriaLog(logData: any) {
  if (!isDatabaseConfigured() || !db) return { ...logData, logUid: logData.id || `AUD-${Date.now()}` };
  try {
    const inserted = await db.insert(auditoriaLogs).values({
      logUid: logData.id || `AUD-${Date.now()}`,
      timestamp: logData.timestamp,
      userId: logData.user_id,
      userEmail: logData.user_email,
      acao: logData.acao,
      tabela: logData.tabela,
      itemId: logData.item_id,
      payloadJson: logData.payload_json,
      hashSha256: logData.hash_sha256,
      prevHash: logData.prev_hash
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting auditoria log into PostgreSQL:', error);
    return { ...logData, logUid: logData.id || `AUD-${Date.now()}` };
  }
}

// ---------------- EMBARCAÇÕES, AGÊNCIAS, ARMADORES, ATRACAÇÕES ----------------
export async function getEmbarcacoes() {
  if (!isDatabaseConfigured() || !db) {
    return mockEmbarcacoes.map(e => ({
      ...e,
      embarcacaoUid: e.id,
      numeroImo: e.numeroIMO,
      anoConstrucao: e.anoConstrucao
    }));
  }
  try {
    const res = await db.select().from(embarcacoes).orderBy(desc(embarcacoes.id));
    if (res && res.length > 0) return res;
    return mockEmbarcacoes.map(e => ({
      ...e,
      embarcacaoUid: e.id,
      numeroImo: e.numeroIMO,
      anoConstrucao: e.anoConstrucao
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch embarcacoes warning, falling back to initial data:', error);
    return mockEmbarcacoes.map(e => ({
      ...e,
      embarcacaoUid: e.id,
      numeroImo: e.numeroIMO,
      anoConstrucao: e.anoConstrucao
    }));
  }
}

export async function insertEmbarcacao(embData: any) {
  if (!isDatabaseConfigured() || !db) return { ...embData, embarcacaoUid: embData.id || `EMB-${Date.now()}` };
  try {
    const inserted = await db.insert(embarcacoes).values({
      embarcacaoUid: embData.id || `EMB-${Date.now()}`,
      nome: embData.nome,
      numeroImo: embData.numeroIMO || embData.numeroImo,
      indicativoChamada: embData.indicativoChamada,
      bandeira: embData.bandeira,
      portoRegisto: embData.portoRegisto,
      tipo: embData.tipo,
      tonelagemBruta: Number(embData.tonelagemBruta || 0),
      comprimentoForaFora: Number(embData.comprimentoForaFora || 0),
      caladoMaximo: Number(embData.caladoMaximo || 0),
      anoConstrucao: Number(embData.anoConstrucao || 2020),
      armadorId: embData.armadorId,
      armadorNome: embData.armadorNome,
      agenciaId: embData.agenciaId,
      agenciaNome: embData.agenciaNome,
      statusCertificacao: embData.statusCertificacao || 'Válida'
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting embarcacao into PostgreSQL:', error);
    return { ...embData, embarcacaoUid: embData.id || `EMB-${Date.now()}` };
  }
}

export async function getAgencias() {
  if (!isDatabaseConfigured() || !db) {
    return mockAgencias.map(a => ({
      ...a,
      agenciaUid: a.id,
      nomeComercial: a.nomeComercial,
      licencaAtividade: a.licencaAtividade,
      responsavelLegal: a.responsavelLegal,
      embarcacoesRepresentadas: a.embarcacoesRepresentadas
    }));
  }
  try {
    const res = await db.select().from(agencias).orderBy(desc(agencias.id));
    if (res && res.length > 0) return res;
    return mockAgencias.map(a => ({
      ...a,
      agenciaUid: a.id,
      nomeComercial: a.nomeComercial,
      licencaAtividade: a.licencaAtividade,
      responsavelLegal: a.responsavelLegal,
      embarcacoesRepresentadas: a.embarcacoesRepresentadas
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch agencias warning, falling back to initial data:', error);
    return mockAgencias.map(a => ({
      ...a,
      agenciaUid: a.id,
      nomeComercial: a.nomeComercial,
      licencaAtividade: a.licencaAtividade,
      responsavelLegal: a.responsavelLegal,
      embarcacoesRepresentadas: a.embarcacoesRepresentadas
    }));
  }
}

export async function insertAgencia(agData: any) {
  if (!isDatabaseConfigured() || !db) return { ...agData, agenciaUid: agData.id || `AG-${Date.now()}` };
  try {
    const inserted = await db.insert(agencias).values({
      agenciaUid: agData.id || `AG-${Date.now()}`,
      nomeComercial: agData.nomeComercial,
      nif: agData.nif,
      licencaAtividade: agData.licencaAtividade,
      responsavelLegal: agData.responsavelLegal,
      telefone: agData.telefone,
      email: agData.email,
      endereco: agData.endereco,
      embarcacoesRepresentadas: Number(agData.embarcacoesRepresentadas || 0),
      status: agData.status || 'Ativa'
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting agencia into PostgreSQL:', error);
    return { ...agData, agenciaUid: agData.id || `AG-${Date.now()}` };
  }
}

export async function getArmadores() {
  if (!isDatabaseConfigured() || !db) {
    return mockArmadores.map(arm => ({
      ...arm,
      armadorUid: arm.id,
      nomeRazaoSocial: arm.nomeRazaoSocial,
      paisOrigem: arm.paisOrigem,
      tipoEntidade: arm.tipoEntidade,
      contactoOficial: arm.contactoOficial,
      frotaContada: arm.frotaContada
    }));
  }
  try {
    const res = await db.select().from(armadores).orderBy(desc(armadores.id));
    if (res && res.length > 0) return res;
    return mockArmadores.map(arm => ({
      ...arm,
      armadorUid: arm.id,
      nomeRazaoSocial: arm.nomeRazaoSocial,
      paisOrigem: arm.paisOrigem,
      tipoEntidade: arm.tipoEntidade,
      contactoOficial: arm.contactoOficial,
      frotaContada: arm.frotaContada
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch armadores warning, falling back to initial data:', error);
    return mockArmadores.map(arm => ({
      ...arm,
      armadorUid: arm.id,
      nomeRazaoSocial: arm.nomeRazaoSocial,
      paisOrigem: arm.paisOrigem,
      tipoEntidade: arm.tipoEntidade,
      contactoOficial: arm.contactoOficial,
      frotaContada: arm.frotaContada
    }));
  }
}

export async function insertArmador(armData: any) {
  if (!isDatabaseConfigured() || !db) return { ...armData, armadorUid: armData.id || `ARM-${Date.now()}` };
  try {
    const inserted = await db.insert(armadores).values({
      armadorUid: armData.id || `ARM-${Date.now()}`,
      nomeRazaoSocial: armData.nomeRazaoSocial,
      paisOrigem: armData.paisOrigem,
      tipoEntidade: armData.tipoEntidade || 'Nacional',
      contactoOficial: armData.contactoOficial,
      email: armData.email,
      frotaContada: Number(armData.frotaContada || 0)
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting armador into PostgreSQL:', error);
    return { ...armData, armadorUid: armData.id || `ARM-${Date.now()}` };
  }
}

export async function getAtracacoes() {
  if (!isDatabaseConfigured() || !db) {
    return mockAtracacoes.map(atr => ({
      ...atr,
      atracacaoUid: atr.id,
      codigoEscala: atr.codigoEscala,
      embarcacaoId: atr.embarcacaoId,
      embarcacaoNome: atr.embarcacaoNome,
      agenciaNome: atr.agenciaNome,
      portoNome: atr.portoNome,
      caisDesignado: atr.caisDesignado,
      dataChegadaPrevista: atr.dataChegadaPrevista,
      dataAtracacaoEfetiva: atr.dataAtracacaoEfetiva,
      dataSaidaPrevista: atr.dataSaidaPrevista,
      servicosSolicitados: atr.servicosSolicitados,
      manifestoCarga: atr.manifestoCarga
    }));
  }
  try {
    const res = await db.select().from(atracacoes).orderBy(desc(atracacoes.id));
    if (res && res.length > 0) return res;
    return mockAtracacoes.map(atr => ({
      ...atr,
      atracacaoUid: atr.id,
      codigoEscala: atr.codigoEscala,
      embarcacaoId: atr.embarcacaoId,
      embarcacaoNome: atr.embarcacaoNome,
      agenciaNome: atr.agenciaNome,
      portoNome: atr.portoNome,
      caisDesignado: atr.caisDesignado,
      dataChegadaPrevista: atr.dataChegadaPrevista,
      dataAtracacaoEfetiva: atr.dataAtracacaoEfetiva,
      dataSaidaPrevista: atr.dataSaidaPrevista,
      servicosSolicitados: atr.servicosSolicitados,
      manifestoCarga: atr.manifestoCarga
    }));
  } catch (error) {
    console.warn('PostgreSQL fetch atracacoes warning, falling back to initial data:', error);
    return mockAtracacoes.map(atr => ({
      ...atr,
      atracacaoUid: atr.id,
      codigoEscala: atr.codigoEscala,
      embarcacaoId: atr.embarcacaoId,
      embarcacaoNome: atr.embarcacaoNome,
      agenciaNome: atr.agenciaNome,
      portoNome: atr.portoNome,
      caisDesignado: atr.caisDesignado,
      dataChegadaPrevista: atr.dataChegadaPrevista,
      dataAtracacaoEfetiva: atr.dataAtracacaoEfetiva,
      dataSaidaPrevista: atr.dataSaidaPrevista,
      servicosSolicitados: atr.servicosSolicitados,
      manifestoCarga: atr.manifestoCarga
    }));
  }
}

export async function insertAtracacao(atracData: any) {
  if (!isDatabaseConfigured() || !db) return { ...atracData, atracacaoUid: atracData.id || `ATR-${Date.now()}` };
  try {
    const inserted = await db.insert(atracacoes).values({
      atracacaoUid: atracData.id || `ATR-${Date.now()}`,
      codigoEscala: atracData.codigoEscala,
      embarcacaoId: atracData.embarcacaoId,
      embarcacaoNome: atracData.embarcacaoNome,
      agenciaNome: atracData.agenciaNome,
      portoNome: atracData.portoNome,
      caisDesignado: atracData.caisDesignado,
      dataChegadaPrevista: atracData.dataChegadaPrevista,
      dataAtracacaoEfetiva: atracData.dataAtracacaoEfetiva || null,
      dataSaidaPrevista: atracData.dataSaidaPrevista,
      status: atracData.status || 'Anunciada',
      servicosSolicitados: atracData.servicosSolicitados || [],
      manifestoCarga: atracData.manifestoCarga || {}
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error('Error inserting atracacao into PostgreSQL:', error);
    return { ...atracData, atracacaoUid: atracData.id || `ATR-${Date.now()}` };
  }
}

// ---------------- SEED DATABASE IF EMPTY ----------------
export async function seedDatabaseIfEmpty() {
  if (!isDatabaseConfigured() || !db) {
    console.log('Database not configured; skipping seed and using mock data.');
    return { success: true, seeded: false, reason: 'database_not_configured' };
  }
  try {
    const currentUsers = await db.select().from(users).limit(1);
    if (currentUsers.length === 0) {
      console.log('Seeding initial IMP users to PostgreSQL...');
      for (const u of mockUtilizadores) {
        await upsertUser(u);
      }
    }

    const currentFaturas = await db.select().from(faturas).limit(1);
    if (currentFaturas.length === 0) {
      console.log('Seeding initial IMP faturas to PostgreSQL...');
      for (const f of mockFaturasIMP) {
        await insertFatura(f);
      }
    }

    const currentRecibos = await db.select().from(recibos).limit(1);
    if (currentRecibos.length === 0) {
      for (const r of mockRecibosIMP) {
        await insertRecibo(r);
      }
    }

    const currentCaixa = await db.select().from(caixaMovs).limit(1);
    if (currentCaixa.length === 0) {
      for (const m of mockCaixaMovs) {
        await insertCaixaMov(m);
      }
    }

    const currentLogs = await db.select().from(auditoriaLogs).limit(1);
    if (currentLogs.length === 0) {
      for (const l of mockAuditoriaLogs) {
        await insertAuditoriaLog(l);
      }
    }

    const currentEmbarcacoes = await db.select().from(embarcacoes).limit(1);
    if (currentEmbarcacoes.length === 0) {
      for (const e of mockEmbarcacoes) {
        await insertEmbarcacao(e);
      }
    }

    const currentAgencias = await db.select().from(agencias).limit(1);
    if (currentAgencias.length === 0) {
      for (const a of mockAgencias) {
        await insertAgencia(a);
      }
    }

    const currentArmadores = await db.select().from(armadores).limit(1);
    if (currentArmadores.length === 0) {
      for (const arm of mockArmadores) {
        await insertArmador(arm);
      }
    }

    const currentAtracacoes = await db.select().from(atracacoes).limit(1);
    if (currentAtracacoes.length === 0) {
      for (const atr of mockAtracacoes) {
        await insertAtracacao(atr);
      }
    }

    console.log('Database seeding complete.');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}
