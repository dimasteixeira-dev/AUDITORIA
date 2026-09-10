import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid, ListChecks, Bell, Factory, Users, SplitSquareHorizontal,
  Activity, ChevronLeft, Filter, ArrowUpRight, ArrowDownRight, Minus,
  Receipt, AlertCircle, Tag, PhoneCall, History, ClipboardCheck, UploadCloud, CheckCircle2, Download, Loader2, AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import * as api from "./api.js";

/* ────────────────────────────────────────────────────────────────────────
   Plataforma de Auditoria — visual alinhado ao design system interno
   (sidebar escura, acento laranja, cartões brancos com pill de status).
   Mesmo motor de regras das entregas anteriores (Fases 1-8); esta versão
   ajusta só a casca visual e adiciona "Rateio" como fonte de importação.
   ──────────────────────────────────────────────────────────────────────── */

const PARAMS = {
  autonomiaMaximaMeses: 3,
  inadimplenciaCriticaDias: 60,
  eficienciaMinimaPct: 0.85,
  vacanciaMaximaPct: 0.10,
  inadimplenciaPctMax: 0.15,
  coberturaMinimaPct: 0.90,
  healthScoreSaudavel: 80,
  healthScoreAtencao: 50,
  desvioGeracaoAlertaPct: 0.15,
};

const TARIFAS = [
  { distribuidora: "CPFL Piratininga", uf: "SP", fornecida: 0.4733, gd1: 0.8114449, gd2: 0.7073083, autoGd1: 0.8969576, autoGd2: 0.7928211 },
  { distribuidora: "CPFL Paulista", uf: "SP", fornecida: 0.3954, gd1: 0.7774878, gd2: 0.6640823, autoGd1: 0.8671759, autoGd2: 0.7537704 },
  { distribuidora: "CPFL Sul Paulista", uf: "SP", fornecida: 0.3589, gd1: 0.7818116, gd2: 0.6721158, autoGd1: 0.884095, autoGd2: 0.7743993 },
];

const USINAS = [
  { id: "u1", nome: "AAMN INVESTIMENTOS S/A - UFV 1 - INDAIATUBA", numeroUG: "230257403663",
    distribuidora: "CPFL Piratininga", uf: "SP", ucAncora: "4003970090", gd: 2, modalidade: "Compartilhada",
    pctAdmin: 0.10, desconto: 0.20, status: "Ativa", responsavel: "—",
    faturamentoPotencial: 4746.32, mrrRealizado: 845.35, faturamentoBrutoRealizado: 8453.45,
    inadimplenciaMes: 0, inadimplenciaAcumulada: 0, eficienciaRateio: 0.9528, capturasPendentes: 3,
    vacancia: -0.4364, saldoAcumuladoUCs: 0, chamadosAbertos: 1, potenciaMWp: 0.98, emOperacaoDesde: "Fev/2026" },
  { id: "u2", nome: "USE ENERGIA - UFV 4 - CAMPINAS", numeroUG: "230198800110",
    distribuidora: "CPFL Paulista", uf: "SP", ucAncora: "5511200099", gd: 1, modalidade: "Compartilhada",
    pctAdmin: 0.12, desconto: 0.18, status: "Ativa", responsavel: "Marina",
    faturamentoPotencial: 12800, mrrRealizado: 9200, faturamentoBrutoRealizado: 76600,
    inadimplenciaMes: 14200, inadimplenciaAcumulada: 31500, eficienciaRateio: 0.71, capturasPendentes: 0,
    vacancia: 0.03, saldoAcumuladoUCs: 1200, chamadosAbertos: 2, potenciaMWp: 3.4, emOperacaoDesde: "Nov/2024" },
  { id: "u3", nome: "SOLARIS GERADORA - UFV 7 - RIBEIRAO PRETO", numeroUG: "230234411220",
    distribuidora: "CPFL Sul Paulista", uf: "SP", ucAncora: "5511300010", gd: 2, modalidade: "Autoconsumo",
    pctAdmin: 0.10, desconto: 0.15, status: "Ativa", responsavel: "Marina",
    faturamentoPotencial: 6100, mrrRealizado: 5850, faturamentoBrutoRealizado: 58500,
    inadimplenciaMes: 0, inadimplenciaAcumulada: 0, eficienciaRateio: 0.97, capturasPendentes: 0,
    vacancia: 0.05, saldoAcumuladoUCs: 0, chamadosAbertos: 0, potenciaMWp: 1.7, emOperacaoDesde: "Mai/2025" },
];

const UCS = [
  { id: "uc1", usinaId: "u1", numero: "4003278868", apelido: "Golden Village Residence", cnpj: "48.148.169/0001-10",
    consumoCompensavel: 664.46, saldoKwh: 0, vidaUtilSaldoMeses: 0, rateioIdeal: 0.0511, rateioVerificado: 0.0565,
    percentual: 1.105, estimadoVerificado: 734.5, estimadoIdeal: 664.46, deficitMensal: -70.04, autonomiaMeses: 0,
    creditosN: 734.5, creditosN1: 700, creditosN2: 690, capturada: true, diasVencido: 0, valorVencido: 0 },
  { id: "uc2", usinaId: "u1", numero: "4003278866", apelido: "Golden Village Residence", cnpj: "48.148.169/0001-10",
    consumoCompensavel: 3957.0, saldoKwh: 0, vidaUtilSaldoMeses: 0, rateioIdeal: 0.3044, rateioVerificado: 0.3044,
    percentual: 1.0, estimadoVerificado: 3957.2, estimadoIdeal: 3957.0, deficitMensal: -0.2, autonomiaMeses: 0,
    creditosN: 3957.2, creditosN1: 3900, creditosN2: 3890, capturada: false, diasVencido: 0, valorVencido: 0 },
  { id: "uc3", usinaId: "u1", numero: "2095428372", apelido: "G.A.A. Zaparoli LTDA", cnpj: "08.466.194/0001-27",
    consumoCompensavel: 6481.54, saldoKwh: 0, vidaUtilSaldoMeses: 0, rateioIdeal: 0.4986, rateioVerificado: 0.4986,
    percentual: 1.0, estimadoVerificado: 6481.8, estimadoIdeal: 6481.54, deficitMensal: -0.26, autonomiaMeses: 0,
    creditosN: 6481.8, creditosN1: 6400, creditosN2: 6390, capturada: false, diasVencido: 0, valorVencido: 0 },
  { id: "uc4", usinaId: "u1", numero: "4003970090", apelido: "UC Âncora", cnpj: "—",
    consumoCompensavel: 300, saldoKwh: 0, vidaUtilSaldoMeses: 0, rateioIdeal: 0.1459, rateioVerificado: 0.1405,
    percentual: 0.963, estimadoVerificado: 280, estimadoIdeal: 300, deficitMensal: 20, autonomiaMeses: 0,
    creditosN: 280, creditosN1: 270, creditosN2: 260, capturada: false, diasVencido: 0, valorVencido: 0 },
  { id: "uc5", usinaId: "u2", numero: "5511200001", apelido: "Condomínio Vista Verde", cnpj: "22.333.444/0001-55",
    consumoCompensavel: 950, saldoKwh: 14200, vidaUtilSaldoMeses: 14.9, rateioIdeal: 0.18, rateioVerificado: 0.20,
    percentual: 1.11, estimadoVerificado: 1300, estimadoIdeal: 950, deficitMensal: -350, autonomiaMeses: 4.3,
    creditosN: 1300, creditosN1: 1280, creditosN2: 1310, capturada: true, diasVencido: 68, valorVencido: 4200,
    unificada: true, totalSunne: 4200, totalConcessionaria: 0, titular: "Condomínio Vista Verde" },
  { id: "uc6", usinaId: "u2", numero: "5511200002", apelido: "Padaria Bom Pão", cnpj: "11.222.333/0001-44",
    consumoCompensavel: 1100, saldoKwh: 900, vidaUtilSaldoMeses: 0.8, rateioIdeal: 0.20, rateioVerificado: 0.19,
    percentual: 0.95, estimadoVerificado: 1350, estimadoIdeal: 1100, deficitMensal: -250, autonomiaMeses: 0.8,
    creditosN: 1350, creditosN1: 1400, creditosN2: 1380, capturada: true, diasVencido: 0, valorVencido: 0 },
  { id: "uc7", usinaId: "u3", numero: "5511300001", apelido: "Mercado Rio Preto", cnpj: "33.444.555/0001-11",
    consumoCompensavel: 2100, saldoKwh: 150, vidaUtilSaldoMeses: 0.1, rateioIdeal: 0.35, rateioVerificado: 0.35,
    percentual: 1.0, estimadoVerificado: 2130, estimadoIdeal: 2100, deficitMensal: -30, autonomiaMeses: 0.1,
    creditosN: 2130, creditosN1: 2110, creditosN2: 2120, capturada: true, diasVencido: 0, valorVencido: 0 },
];

const GERACAO = {
  u1: [{ comp: "02/2026", injetada: 7900 }, { comp: "03/2026", injetada: 8100 }, { comp: "04/2026", injetada: 8400 },
       { comp: "05/2026", injetada: 9020 }, { comp: "06/2026", injetada: 9320 }, { comp: "07/2026", injetada: 8520 }],
  u2: [{ comp: "02/2026", injetada: 41000 }, { comp: "03/2026", injetada: 43500 }, { comp: "04/2026", injetada: 45200 },
       { comp: "05/2026", injetada: 47800 }, { comp: "06/2026", injetada: 49100 }, { comp: "07/2026", injetada: 44600 }],
  u3: [{ comp: "02/2026", injetada: 21500 }, { comp: "03/2026", injetada: 22100 }, { comp: "04/2026", injetada: 22900 },
       { comp: "05/2026", injetada: 23600 }, { comp: "06/2026", injetada: 24100 }, { comp: "07/2026", injetada: 23800 }],
};
const CREDITOS_UTILIZADOS_M1 = {
  u1: [7600, 8000, 8300, 8700, 9050, 9179],
  u2: [39500, 42000, 43700, 46100, 47600, 45810],
  u3: [21000, 21700, 22400, 23100, 23700, 23070],
};

const CHAMADOS_SEED = [
  { id: "c1", usinaId: "u1", tipo: "Captura de Fatura", descricao: "Captura de fatura de competência 07/2026", ucs: "4003278866", qtdUcs: 1, dataAbertura: "14/08/2026", status: "Aberto", impactoMrr: 65 },
  { id: "c2", usinaId: "u2", tipo: "Inadimplência", descricao: "Cobrança condomínio Vista Verde", ucs: "5511200001", qtdUcs: 1, dataAbertura: "10/08/2026", status: "Em andamento", impactoMrr: 504 },
  { id: "c3", usinaId: "u2", tipo: "Rateio", descricao: "Rebalanceamento de rateio", ucs: "5511200001", qtdUcs: 1, dataAbertura: "05/08/2026", status: "Aberto", impactoMrr: 0 },
  { id: "c4", usinaId: "u1", tipo: "Cadastro", descricao: "Divergência de nome de usina no extrato", ucs: "—", qtdUcs: 0, dataAbertura: "02/08/2026", status: "Resolvido", impactoMrr: 0 },
];

const AUDITORIAS_U1 = [
  { comp: "04/2026", healthScore: 58, eficiencia: 0.79, vacancia: -0.10, capturasPendentes: 4, status: "CRITICO" },
  { comp: "05/2026", healthScore: 63, eficiencia: 0.85, vacancia: -0.22, capturasPendentes: 3, status: "ATENCAO" },
  { comp: "06/2026", healthScore: 67, eficiencia: 0.90, vacancia: -0.30, capturasPendentes: 3, status: "ATENCAO" },
  { comp: "07/2026", healthScore: 70, eficiencia: 0.9528, vacancia: -0.4364, capturasPendentes: 3, status: "ATENCAO" },
];
const HISTORICO = [
  { data: "14/08/2026", usina: "AAMN – UFV 1", categoria: "Rateio", texto: "Eficiência de rateio: 95%. Status: Atenção. Ação: abrir chamados de captura." },
  { data: "10/08/2026", usina: "USE ENERGIA – UFV 4", categoria: "Inadimplência", texto: "Condomínio Vista Verde vencido há 68 dias — chamado de cobrança aberto." },
  { data: "02/08/2026", usina: "AAMN – UFV 1", categoria: "Cadastro", texto: "Divergência de nome de usina no extrato corrigida no sistema." },
  { data: "18/07/2026", usina: "SOLARIS – UFV 7", categoria: "Geração", texto: "Geração dentro da média histórica — sem ação necessária." },
];

// ---------------- Motor de regras ----------------
function healthScore(u) {
  const gapNeg = Math.max(0, -(u.mrrRealizado - u.faturamentoPotencial));
  const p1 = 30 * (1 - Math.min(1, Math.max(0, gapNeg / Math.max(u.faturamentoPotencial, 1))));
  const p2 = 25 * (1 - Math.min(1, Math.max(0, u.inadimplenciaMes / Math.max(u.faturamentoBrutoRealizado, 1))));
  const p3 = 20 * Math.min(1, Math.max(0, u.eficienciaRateio));
  const p4 = 15 * (1 - Math.min(1, Math.max(0, u.capturasPendentes) / 10));
  const p5 = 10 * (1 - Math.min(1, Math.max(0, u.vacancia)));
  return Math.max(0, Math.min(100, p1 + p2 + p3 + p4 + p5));
}
function statusFromScore(score) {
  if (score >= PARAMS.healthScoreSaudavel) return "SAUDAVEL";
  if (score >= PARAMS.healthScoreAtencao) return "ATENCAO";
  return "CRITICO";
}
function diagnostico(u) {
  const bits = [];
  if (u.chamadosAbertos > 0) bits.push(`${u.chamadosAbertos} chamado(s) aberto(s)`);
  const pctInad = u.inadimplenciaMes / Math.max(u.faturamentoBrutoRealizado, 1);
  if (pctInad > PARAMS.inadimplenciaPctMax) bits.push(`Inadimplência do mês alta (${(pctInad * 100).toFixed(0)}% do bruto)`);
  if (u.capturasPendentes > 0) bits.push(`${u.capturasPendentes} UC(s) com fatura não capturada`);
  if (u.eficienciaRateio < PARAMS.eficienciaMinimaPct) bits.push(`Eficiência de rateio baixa (${(u.eficienciaRateio * 100).toFixed(0)}%)`);
  if (u.vacancia > PARAMS.vacanciaMaximaPct) bits.push(`Vacância alta (${(u.vacancia * 100).toFixed(0)}%, energia sem cliente)`);
  if (u.saldoAcumuladoUCs > 0) bits.push(`Saldo acumulado nas UCs (${u.saldoAcumuladoUCs.toLocaleString("pt-BR")} kWh) — rebalancear`);
  return bits.length ? bits.join("; ") : "Sem ponto de atenção identificado";
}
function ucSaldoAlerta(uc) { return uc.autonomiaMeses > PARAMS.autonomiaMaximaMeses ? `Saldo alto — rebalancear (autonomia ${uc.autonomiaMeses.toFixed(1)} meses)` : "OK"; }
function ucConsumoAlerta(uc) {
  if (!uc.creditosN || !uc.creditosN1 || !uc.creditosN2) return "Aguardar — falta captura nos 3 meses";
  if (uc.creditosN > uc.consumoCompensavel && uc.creditosN1 > uc.consumoCompensavel && uc.creditosN2 > uc.consumoCompensavel) return "Recebendo mais do que precisa há 3 meses";
  if (uc.creditosN < uc.consumoCompensavel && uc.creditosN1 < uc.consumoCompensavel && uc.creditosN2 < uc.consumoCompensavel) return "Recebendo menos do que precisa há 3 meses";
  return "OK";
}
function ucInadimplenciaAlerta(uc) { return uc.diasVencido > PARAMS.inadimplenciaCriticaDias ? `Retirar do rateio — vencido há ${uc.diasVencido} dias` : "OK"; }
function valorRealAPagar(uc) { return uc.unificada ? uc.totalSunne - uc.totalConcessionaria : uc.totalSunne; }
function tendenciaGeracao(serie) {
  if (serie.length < 2) return { desvio: 0, tendencia: "estavel", media: serie[0]?.injetada ?? 0 };
  const atual = serie[serie.length - 1].injetada;
  const media = serie.slice(0, -1).reduce((s, x) => s + x.injetada, 0) / (serie.length - 1);
  const desvio = (atual - media) / media;
  return { desvio, tendencia: desvio > PARAMS.desvioGeracaoAlertaPct ? "acima" : desvio < -PARAMS.desvioGeracaoAlertaPct ? "abaixo" : "estavel", media };
}
function tarifaRetorno(usina) {
  const t = TARIFAS.find((x) => x.distribuidora === usina.distribuidora);
  if (!t) return 0;
  const bruta = usina.modalidade === "Autoconsumo" ? (usina.gd === 2 ? t.autoGd2 : t.autoGd1) : (usina.gd === 2 ? t.gd2 : t.gd1);
  return bruta * (1 - usina.desconto) * (1 - usina.pctAdmin);
}

const PRIORITY_META = {
  critico: { label: "Crítico", dot: "#C6392E", text: "#7A2721" },
  atencao: { label: "Atenção", dot: "#D97C1F", text: "#8A501C" },
  medio: { label: "Médio", dot: "#B99423", text: "#8C7622" },
  info: { label: "Informativo", dot: "#3D6E8C", text: "#294C61" },
};
// Tokens do design system (inspirados no portal interno)
const T = {
  ink: "#12141A",        // sidebar
  inkSoft: "#1B1E26",    // hover/active na sidebar
  bg: "#EEF0F3",         // fundo do conteúdo
  card: "#FFFFFF",
  border: "#E1E4E9",
  textMuted: "#6B6F76",
  accent: "#F2542D",     // laranja de marca
};

function buildAlerts() {
  const alerts = []; let seq = 1;
  USINAS.forEach((u) => {
    const status = statusFromScore(healthScore(u));
    if (status !== "SAUDAVEL") {
      const pctInad = u.inadimplenciaMes / Math.max(u.faturamentoBrutoRealizado, 1);
      if (pctInad > PARAMS.inadimplenciaPctMax) alerts.push({ id: `A${seq++}`, categoria: "Inadimplência", prioridade: "critico", usina: u.nome, uc: null, problema: `Inadimplência do mês em ${(pctInad * 100).toFixed(0)}% do bruto`, indicador: "Inadimplência do mês", valorAtual: `R$ ${u.inadimplenciaMes.toLocaleString("pt-BR")}`, valorEsperado: `< ${(PARAMS.inadimplenciaPctMax * 100).toFixed(0)}%`, acao: "Acionar cliente / revisar carteira", status: "Pendente" });
      if (u.eficienciaRateio < PARAMS.eficienciaMinimaPct) alerts.push({ id: `A${seq++}`, categoria: "Eficiência", prioridade: "atencao", usina: u.nome, uc: null, problema: `Eficiência de rateio em ${(u.eficienciaRateio * 100).toFixed(0)}%`, indicador: "Eficiência de Rateio", valorAtual: `${(u.eficienciaRateio * 100).toFixed(0)}%`, valorEsperado: `≥ ${(PARAMS.eficienciaMinimaPct * 100).toFixed(0)}%`, acao: "Investigar UCs com baixa utilização de crédito", status: "Pendente" });
      if (u.vacancia > PARAMS.vacanciaMaximaPct) alerts.push({ id: `A${seq++}`, categoria: "Vacância", prioridade: "atencao", usina: u.nome, uc: null, problema: `Vacância em ${(u.vacancia * 100).toFixed(0)}%`, indicador: "Vacância", valorAtual: `${(u.vacancia * 100).toFixed(0)}%`, valorEsperado: `≤ ${(PARAMS.vacanciaMaximaPct * 100).toFixed(0)}%`, acao: "Verificar disponibilidade de consumidores / âncora", status: "Pendente" });
    }
    if (u.capturasPendentes > 0) alerts.push({ id: `A${seq++}`, categoria: "Captura de Fatura", prioridade: "critico", usina: u.nome, uc: null, problema: `${u.capturasPendentes} UC(s) do rateio sem fatura na competência`, indicador: "Capturas Pendentes", valorAtual: `${u.capturasPendentes}`, valorEsperado: "0", acao: "Abrir chamado de captura no HubSpot", status: "Pendente" });
    const { tendencia, desvio } = tendenciaGeracao(GERACAO[u.id]);
    if (tendencia !== "estavel") alerts.push({ id: `A${seq++}`, categoria: "Geração", prioridade: tendencia === "abaixo" ? "atencao" : "info", usina: u.nome, uc: null, problema: `Geração ${tendencia === "abaixo" ? "abaixo" : "acima"} da média (${(desvio * 100).toFixed(0)}%)`, indicador: "Desvio de geração", valorAtual: `${(desvio * 100).toFixed(0)}%`, valorEsperado: `± ${(PARAMS.desvioGeracaoAlertaPct * 100).toFixed(0)}%`, acao: "Verificar performance da usina / manutenção", status: "Pendente" });
  });
  UCS.forEach((uc) => {
    const usina = USINAS.find((u) => u.id === uc.usinaId);
    const s = ucSaldoAlerta(uc); if (s !== "OK") alerts.push({ id: `A${seq++}`, categoria: "Saldo", prioridade: "atencao", usina: usina.nome, uc: uc.numero, problema: s, indicador: "Autonomia", valorAtual: `${uc.autonomiaMeses.toFixed(1)} meses`, valorEsperado: `≤ ${PARAMS.autonomiaMaximaMeses} meses`, acao: "Avaliar rebalanceamento de rateio", status: "Pendente" });
    const c = ucConsumoAlerta(uc); if (c !== "OK") alerts.push({ id: `A${seq++}`, categoria: "Rateio", prioridade: c.startsWith("Aguardar") ? "info" : "medio", usina: usina.nome, uc: uc.numero, problema: c, indicador: "Créditos x Consumo (3 meses)", valorAtual: "—", valorEsperado: "—", acao: c.startsWith("Aguardar") ? "Aguardar captura" : "Ajustar alocação de rateio", status: "Pendente" });
    const i = ucInadimplenciaAlerta(uc); if (i !== "OK") alerts.push({ id: `A${seq++}`, categoria: "Inadimplência", prioridade: "critico", usina: usina.nome, uc: uc.numero, problema: i, indicador: "Dias vencido", valorAtual: `${uc.diasVencido} dias`, valorEsperado: `≤ ${PARAMS.inadimplenciaCriticaDias} dias`, acao: "Retirar UC do rateio", status: "Pendente" });
  });
  CHAMADOS_SEED.filter((c) => !["Resolvido", "Encerrado"].includes(c.status)).forEach((c) => {
    const usina = USINAS.find((u) => u.id === c.usinaId);
    alerts.push({ id: `A${seq++}`, categoria: "Chamados", prioridade: "medio", usina: usina.nome, uc: null, problema: `${c.tipo}: ${c.descricao}`, indicador: "Status do chamado", valorAtual: c.status, valorEsperado: "Resolvido", acao: "Cobrar retorno / atualizar status", status: "Pendente" });
  });
  const order = { critico: 0, atencao: 1, medio: 2, info: 3 };
  return alerts.sort((a, b) => order[a.prioridade] - order[b.prioridade]);
}

// ---------------- UI base ----------------
const fmtR$ = (v) => `R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
const fmtKwh = (v) => `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh`;

function Pill({ tone = "neutro", children }) {
  const tones = {
    verde: { bg: "#E3F3E7", fg: "#1F7A43" },
    ambar: { bg: "#FBEAD3", fg: "#9A5B12" },
    vermelho: { bg: "#FBE1DE", fg: "#B23A2F" },
    neutro: { bg: "#EEF0F3", fg: "#5B5F66" },
  };
  const t = tones[tone] || tones.neutro;
  return <span className="text-[12px] px-2.5 py-1 rounded-full inline-block" style={{ background: t.bg, color: t.fg }}>{children}</span>;
}
function KpiCard({ label, value, sub, pillLabel, pillTone, badge }) {
  return (
    <div className="bg-white border rounded-xl px-5 py-4 flex flex-col gap-2" style={{ borderColor: T.border }}>
      <div className="flex items-center gap-1.5 text-[13px]" style={{ color: T.textMuted }}>
        {label}
        {badge && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{ background: "#F2E4DC", color: T.accent }}>{badge}</span>}
      </div>
      <div className="text-[26px] leading-none text-[#161821]">{value}</div>
      {sub && <p className="text-[12.5px] leading-snug" style={{ color: T.textMuted }}>{sub}</p>}
      {pillLabel && <div className="mt-1"><Pill tone={pillTone}>{pillLabel}</Pill></div>}
    </div>
  );
}
function PriorityDot({ p }) { return <span style={{ background: PRIORITY_META[p].dot }} className="inline-block h-2.5 w-2.5 rounded-full shrink-0" />; }
function StatusPill({ status }) {
  const map = { SAUDAVEL: { tone: "verde", label: "Saudável" }, ATENCAO: { tone: "ambar", label: "Atenção" }, CRITICO: { tone: "vermelho", label: "Crítico" } };
  const m = map[status];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}
function ChamadoPill({ status }) {
  const map = { "Aberto": "vermelho", "Em andamento": "ambar", "Aguardando retorno": "neutro", "Resolvido": "verde", "Encerrado": "neutro" };
  return <Pill tone={map[status] || "neutro"}>{status}</Pill>;
}
function SinalTag({ texto }) {
  if (texto === "OK") return <Pill tone="verde">OK</Pill>;
  return <Pill tone={texto.startsWith("Retirar") ? "vermelho" : "ambar"}>{texto}</Pill>;
}
function Th({ children }) { return <th className="py-2.5 px-4 font-normal whitespace-nowrap">{children}</th>; }
function Td({ children, className = "" }) { return <td className={`py-3 px-4 ${className}`}>{children}</td>; }
function Table({ children }) { return <div className="bg-white border rounded-xl overflow-x-auto" style={{ borderColor: T.border }}><table className="w-full text-[13px] min-w-[760px]">{children}</table></div>; }
function TrendIcon({ tendencia }) {
  if (tendencia === "acima") return <ArrowUpRight size={14} className="text-[#1F7A43]" />;
  if (tendencia === "abaixo") return <ArrowDownRight size={14} className="text-[#B23A2F]" />;
  return <Minus size={14} style={{ color: T.textMuted }} />;
}
function EmptyRow({ texto }) { return <div className="border border-dashed rounded-xl px-5 py-6 text-center text-[13px]" style={{ borderColor: T.border, color: T.textMuted }}>{texto}</div>; }
function SectionTitle({ children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] text-[#161821]">{children}</h2>
      {sub && <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>{sub}</p>}
    </div>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-[13px] border rounded-lg px-3 py-2 bg-white" style={{ borderColor: T.border }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function MockBanner({ children }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] px-4 py-2.5 rounded-lg" style={{ background: "#FBEAD3", color: "#8A501C" }}>
      <AlertTriangle size={13} /> {children || "Esta tela ainda mostra dados de exemplo — a conexão com o backend real chega numa próxima etapa."}
    </div>
  );
}
function LoadingBlock() {
  return <div className="flex items-center gap-2 text-[13px] py-10 justify-center" style={{ color: T.textMuted }}><Loader2 size={16} className="animate-spin" /> Carregando dados reais do backend...</div>;
}
function ErrorBlock({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 text-[13px] py-10 text-center" style={{ color: "#B23A2F" }}>
      <AlertTriangle size={18} />
      <p>Não consegui falar com o backend.<br />{String(error?.message || error)}</p>
      <p className="text-[12px]" style={{ color: T.textMuted }}>
        Se o backend está no Render, a primeira chamada pode levar 30-50s para "acordar" — tente de novo em instantes.
      </p>
      {onRetry && <button onClick={onRetry} className="text-[12px] px-3 py-1.5 rounded-lg text-white" style={{ background: T.ink }}>Tentar de novo</button>}
    </div>
  );
}

// ================= DASHBOARD (estilo "Placar") =================
function DashboardView({ dashboard, usinasMeta, competencia, onChangeCompetencia, onOpenUsina }) {
  const [usinaFiltro, setUsinaFiltro] = useState("todas");
  const linhas = usinaFiltro === "todas" ? dashboard.usinas : dashboard.usinas.filter((r) => r.usina_id === Number(usinaFiltro));
  const metaById = useMemo(() => Object.fromEntries(usinasMeta.map((u) => [u.id, u])), [usinasMeta]);

  const totals = useMemo(() => {
    const fatPotencial = linhas.reduce((s, r) => s + r.faturamento_potencial, 0);
    const mrrReal = linhas.reduce((s, r) => s + r.mrr_realizado, 0);
    const inad = linhas.reduce((s, r) => s + r.inadimplencia_mes, 0);
    const capturas = linhas.reduce((s, r) => s + r.capturas_pendentes, 0);
    const chamadosAbertos = linhas.reduce((s, r) => s + r.chamados_abertos, 0);
    return { fatPotencial, mrrReal, gap: mrrReal - fatPotencial, inad, capturas, chamadosAbertos };
  }, [linhas]);

  const pctRealizado = totals.fatPotencial ? totals.mrrReal / totals.fatPotencial : 0;
  const heroMeta = usinaFiltro === "todas" ? null : metaById[Number(usinaFiltro)];
  const heroInd = usinaFiltro === "todas" ? null : dashboard.usinas.find((r) => r.usina_id === Number(usinaFiltro));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[13px]" style={{ color: T.textMuted }}>Usina</span>
        <Select value={usinaFiltro} onChange={setUsinaFiltro}
          options={[{ value: "todas", label: `Todas · ${usinasMeta.length} usina(s)` }, ...usinasMeta.map((u) => ({ value: String(u.id), label: u.nome }))]} />
        <span className="text-[13px] ml-4" style={{ color: T.textMuted }}>Competência</span>
        <input type="month" value={competencia.slice(0, 7)} onChange={(e) => onChangeCompetencia(`${e.target.value}-01`)}
          className="text-[13px] border rounded-lg px-3 py-2 bg-white" style={{ borderColor: T.border }} />
      </div>

      {heroMeta && heroInd && (
        <div className="bg-white rounded-xl px-6 py-5 flex items-start justify-between flex-wrap gap-4" style={{ borderLeft: `4px solid ${T.accent}`, boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}>
          <div>
            <p className="text-[11px] tracking-wide" style={{ color: T.textMuted }}>PLACAR DA USINA</p>
            <h2 className="text-[19px] text-[#161821] mt-1">{heroMeta.nome}</h2>
            <p className="text-[13px] mt-1" style={{ color: T.textMuted }}>{heroMeta.distribuidora} · GD{heroMeta.gd} · {heroMeta.modalidade}</p>
          </div>
          <StatusPill status={heroInd.status} />
        </div>
      )}

      <div>
        <SectionTitle>Esperado × realizado</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <KpiCard label="Faturamento potencial" value={fmtR$(totals.fatPotencial)}
            sub="Tarifa líquida × energia injetada do mês anterior"
            pillLabel={`${(pctRealizado * 100).toFixed(0)}% realizado`} pillTone={pctRealizado >= 0.95 ? "verde" : "ambar"} />
          <KpiCard label="MRR realizado" value={fmtR$(totals.mrrReal)} sub="Visão de caixa × % de administração"
            pillLabel={totals.gap >= 0 ? "acima do potencial" : "abaixo do potencial"} pillTone={totals.gap >= 0 ? "verde" : "ambar"} />
          <KpiCard label="Gap de faturamento" value={fmtR$(totals.gap)} sub="MRR realizado − faturamento potencial"
            pillLabel={totals.gap >= 0 ? "dentro da meta" : "atenção"} pillTone={totals.gap >= 0 ? "verde" : "vermelho"} />
          <KpiCard label="Inadimplência do mês" value={fmtR$(totals.inad)} sub="Faturas vencidas no mês de análise"
            pillLabel={totals.inad > 0 ? "acima do limite" : "sem inadimplência"} pillTone={totals.inad > 0 ? "vermelho" : "verde"} />
          <KpiCard label="Capturas pendentes" value={totals.capturas} sub="UCs do rateio sem fatura na competência"
            pillLabel={totals.capturas > 0 ? "abrir chamados" : "tudo capturado"} pillTone={totals.capturas > 0 ? "vermelho" : "verde"} />
          <KpiCard label="Chamados abertos" value={totals.chamadosAbertos} sub="Abertos ou em andamento"
            pillLabel={totals.chamadosAbertos > 0 ? "acompanhar" : "sem pendências"} pillTone={totals.chamadosAbertos > 0 ? "ambar" : "verde"} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[15px] text-[#161821]">Saúde da carteira, por usina</h2>
        </div>
        <Table>
          <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Usina</Th><Th>Health score</Th><Th>Status</Th><Th>Efic. rateio</Th><Th>Vacância</Th><Th>Capturas pend.</Th><Th>Inad. mês</Th><Th>Diagnóstico</Th></tr></thead>
          <tbody>
            {dashboard.usinas.map((r) => (
              <tr key={r.usina_id} className="border-b last:border-0 align-top cursor-pointer hover:bg-[#FAFAFB]" style={{ borderColor: "#F1F2F4" }} onClick={() => onOpenUsina(r.usina_id)}>
                <Td className="max-w-[220px] text-[#161821]">{r.nome}</Td>
                <Td className="tabular-nums">{r.health_score.toFixed(0)}</Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td className="tabular-nums">{(r.eficiencia_rateio * 100).toFixed(0)}%</Td>
                <Td className="tabular-nums">{(r.vacancia * 100).toFixed(0)}%</Td>
                <Td className="tabular-nums">{r.capturas_pendentes}</Td>
                <Td className="tabular-nums">{fmtR$(r.inadimplencia_mes)}</Td>
                <Td className="max-w-[300px]" style={{ color: T.textMuted }}>{r.diagnostico}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

// ================= ROTINA / ALERTAS =================
function RotinaView({ alerts, usinasMeta, ucsMeta }) {
  const nomeUsina = (id) => usinasMeta.find((u) => u.id === id)?.nome || `Usina #${id}`;
  const numeroUc = (id) => id ? (ucsMeta.find((u) => u.id === id)?.numero) : null;
  const groups = ["critico", "atencao", "medio", "info"];
  const counts = Object.fromEntries(groups.map((g) => [g, alerts.filter((a) => a.prioridade === g).length]));
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border rounded-xl px-6 py-5" style={{ borderColor: T.border }}>
        <p className="text-[15px] text-[#161821]">Bom dia. Hoje você tem {alerts.length} pontos para olhar.</p>
        <div className="flex gap-6 mt-3 text-[13px]" style={{ color: T.textMuted }}>{groups.map((g) => <div key={g} className="flex items-center gap-2"><PriorityDot p={g} /> {counts[g]} {PRIORITY_META[g].label.toLowerCase()}</div>)}</div>
      </div>
      <div className="flex flex-col gap-3">
        {alerts.map((a, i) => (
          <div key={a.id} className="flex gap-4 bg-white border rounded-xl px-5 py-4" style={{ borderColor: T.border }}>
            <div className="flex flex-col items-center pt-1"><PriorityDot p={a.prioridade} /><span className="text-[11px] mt-1" style={{ color: T.textMuted }}>#{i + 1}</span></div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] text-[#161821]">{nomeUsina(a.usina_id)}</span>
                {numeroUc(a.uc_id) && <span className="text-[12px]" style={{ color: T.textMuted }}>UC {numeroUc(a.uc_id)}</span>}
                <Pill>{a.categoria}</Pill>
              </div>
              <p className="text-[13px] text-[#33353C] mt-1">{a.problema_identificado}</p>
              <p className="text-[12.5px] mt-1" style={{ color: PRIORITY_META[a.prioridade].text }}>Ação: {a.acao_recomendada}</p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && <EmptyRow texto="Nenhum alerta para esta competência. 🎉" />}
      </div>
    </div>
  );
}
function AlertasView({ alerts, usinasMeta, ucsMeta }) {
  const nomeUsina = (id) => usinasMeta.find((u) => u.id === id)?.nome || `Usina #${id}`;
  const numeroUc = (id) => id ? (ucsMeta.find((u) => u.id === id)?.numero) : null;
  const [fc, setFc] = useState("Todas"); const [fp, setFp] = useState("Todas");
  const categorias = ["Todas", ...Array.from(new Set(alerts.map((a) => a.categoria)))];
  const filtered = alerts.filter((a) => (fc === "Todas" || a.categoria === fc) && (fp === "Todas" || a.prioridade === fp));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} style={{ color: T.textMuted }} />
        <Select value={fc} onChange={setFc} options={categorias.map((c) => ({ value: c, label: c }))} />
        <Select value={fp} onChange={setFp} options={["Todas", "critico", "atencao", "medio", "info"].map((p) => ({ value: p, label: p === "Todas" ? "Todas as prioridades" : PRIORITY_META[p].label }))} />
        <span className="text-[12px]" style={{ color: T.textMuted }}>{filtered.length} alerta(s)</span>
      </div>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Prioridade</Th><Th>Categoria</Th><Th>Usina / UC</Th><Th>Problema</Th><Th>Atual → Esperado</Th><Th>Ação recomendada</Th><Th>Status</Th></tr></thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a.id} className="border-b last:border-0 align-top" style={{ borderColor: "#F1F2F4" }}>
              <Td><div className="flex items-center gap-2"><PriorityDot p={a.prioridade} />{PRIORITY_META[a.prioridade].label}</div></Td>
              <Td>{a.categoria}</Td><Td>{nomeUsina(a.usina_id)}{numeroUc(a.uc_id) ? ` · UC ${numeroUc(a.uc_id)}` : ""}</Td>
              <Td className="max-w-[260px] text-[#33353C]">{a.problema_identificado}</Td>
              <Td className="tabular-nums" style={{ color: T.textMuted }}>{a.valor_atual} → {a.valor_esperado}</Td>
              <Td className="text-[#33353C]">{a.acao_recomendada}</Td>
              <Td><Pill>{a.status}</Pill></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

// ================= USINAS =================
function UsinasListView({ usinasMeta, onOpen }) {
  return (
    <Table>
      <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Usina</Th><Th>Distribuidora</Th><Th>UF</Th><Th>UC âncora</Th><Th>GD</Th><Th>Modalidade</Th><Th>% Admin</Th><Th>Desconto</Th><Th>Status</Th><Th>Responsável</Th></tr></thead>
      <tbody>
        {usinasMeta.map((u) => (
          <tr key={u.id} className="border-b last:border-0 cursor-pointer hover:bg-[#FAFAFB]" style={{ borderColor: "#F1F2F4" }} onClick={() => onOpen(u.id)}>
            <Td className="text-[#161821]">{u.nome}</Td><Td>{u.distribuidora}</Td><Td>{u.uf}</Td><Td>{u.uc_ancora_numero || "—"}</Td>
            <Td>GD{u.gd}</Td><Td>{u.modalidade}</Td><Td className="tabular-nums">{(u.pct_administracao * 100).toFixed(0)}%</Td>
            <Td className="tabular-nums">{(u.desconto_cliente * 100).toFixed(0)}%</Td><Td>{u.status}</Td><Td>{u.responsavel || "—"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
function UsinaDetailView({ usinaId, usinasMeta, indicadores, ucsMeta, onBack }) {
  const meta = usinasMeta.find((x) => x.id === usinaId);
  const ind = indicadores.find((x) => x.usina_id === usinaId);
  const ucs = ucsMeta.filter((x) => x.usina_id === usinaId);
  if (!meta || !ind) return <EmptyRow texto="Sem dados para esta usina nesta competência." />;
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] w-fit" style={{ color: T.textMuted }}><ChevronLeft size={14} /> Voltar para Usinas</button>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div><h2 className="text-[17px] text-[#161821]">{meta.nome}</h2><p className="text-[13px] mt-1" style={{ color: T.textMuted }}>{meta.distribuidora} · {meta.uf} · GD{meta.gd} · {meta.modalidade}</p></div>
        <StatusPill status={ind.status} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Health score" value={ind.health_score.toFixed(0)} />
        <KpiCard label="Eficiência de rateio" value={`${(ind.eficiencia_rateio * 100).toFixed(0)}%`} />
        <KpiCard label="Vacância" value={`${(ind.vacancia * 100).toFixed(0)}%`} />
        <KpiCard label="Saldo acumulado UCs" value={fmtKwh(ind.saldo_acumulado_kwh)} />
        <KpiCard label="Inadimplência do mês" value={fmtR$(ind.inadimplencia_mes)} pillLabel={ind.inadimplencia_mes > 0 ? "acima do limite" : "em dia"} pillTone={ind.inadimplencia_mes > 0 ? "vermelho" : "verde"} />
        <KpiCard label="Faturamento bruto" value={fmtR$(ind.faturamento_bruto_realizado)} />
        <KpiCard label="Chamados abertos" value={ind.chamados_abertos} />
        <KpiCard label="Capturas pendentes" value={ind.capturas_pendentes} pillLabel={ind.capturas_pendentes > 0 ? "abrir chamados" : "ok"} pillTone={ind.capturas_pendentes > 0 ? "vermelho" : "verde"} />
      </div>
      <div>
        <h3 className="text-[14px] text-[#161821] mb-3">Diagnóstico</h3>
        <div className="bg-white border rounded-xl px-5 py-4 text-[13px]" style={{ borderColor: T.border, color: "#33353C" }}>{ind.diagnostico}</div>
      </div>
      <div>
        <h3 className="text-[14px] text-[#161821] mb-3">UCs do rateio ({ucs.length})</h3>
        <Table>
          <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>UC</Th><Th>Apelido</Th><Th>Rateio verificado</Th><Th>Saldo</Th><Th>Autonomia</Th></tr></thead>
          <tbody>{ucs.map((uc) => (
            <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
              <Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td>
              <Td className="tabular-nums">{uc.rateio_verificado_pct != null ? `${(uc.rateio_verificado_pct * 100).toFixed(1)}%` : "—"}</Td>
              <Td className="tabular-nums">{fmtKwh(uc.saldo_kwh)}</Td><Td className="tabular-nums">{uc.autonomia_meses.toFixed(1)} meses</Td>
            </tr>
          ))}</tbody>
        </Table>
      </div>
    </div>
  );
}

// ================= UCs =================
function UCsListView({ ucsMeta, onOpen }) {
  return (
    <Table>
      <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>UC</Th><Th>Apelido</Th><Th>Usina</Th><Th>Consumo médio</Th><Th>Saldo</Th><Th>Autonomia</Th></tr></thead>
      <tbody>
        {ucsMeta.map((uc) => (
          <tr key={uc.id} className="border-b last:border-0 cursor-pointer hover:bg-[#FAFAFB]" style={{ borderColor: "#F1F2F4" }} onClick={() => onOpen(uc.id)}>
            <Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td><Td className="max-w-[220px]">{uc.usina_nome}</Td>
            <Td className="tabular-nums">{fmtKwh(uc.consumo_compensavel_kwh)}</Td><Td className="tabular-nums">{fmtKwh(uc.saldo_kwh)}</Td>
            <Td className="tabular-nums">{uc.autonomia_meses.toFixed(1)} meses</Td>
          </tr>
        ))}
        {ucsMeta.length === 0 && <tr><Td className="text-center" style={{ color: T.textMuted }}>Nenhuma UC importada ainda.</Td></tr>}
      </tbody>
    </Table>
  );
}
function UCDetailView({ ucId, ucsMeta, onBack }) {
  const uc = ucsMeta.find((x) => x.id === ucId);
  if (!uc) return <EmptyRow texto="UC não encontrada." />;
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] w-fit" style={{ color: T.textMuted }}><ChevronLeft size={14} /> Voltar para UCs</button>
      <div><h2 className="text-[17px] text-[#161821]">UC {uc.numero} · {uc.apelido}</h2><p className="text-[13px] mt-1" style={{ color: T.textMuted }}>{uc.usina_nome}</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard label="Consumo compensável" value={fmtKwh(uc.consumo_compensavel_kwh)} />
        <KpiCard label="Saldo atual" value={fmtKwh(uc.saldo_kwh)} />
        <KpiCard label="Autonomia" value={`${uc.autonomia_meses.toFixed(1)} meses`} />
        <KpiCard label="Rateio ideal" value={uc.rateio_ideal_pct != null ? `${(uc.rateio_ideal_pct * 100).toFixed(1)}%` : "—"} />
        <KpiCard label="Rateio verificado" value={uc.rateio_verificado_pct != null ? `${(uc.rateio_verificado_pct * 100).toFixed(1)}%` : "—"} />
      </div>
      <MockBanner>O histórico de créditos utilizados (últimos 3 meses) ainda não tem um endpoint próprio no backend — próxima extensão natural da API.</MockBanner>
    </div>
  );
}

// ================= RATEIO =================
function RateioView() {
  const saldoAlto = UCS.filter((uc) => uc.autonomiaMeses > PARAMS.autonomiaMaximaMeses);
  const alteracaoConsumo = UCS.filter((uc) => ucConsumoAlerta(uc) !== "OK");
  const inadimplentes = UCS.filter((uc) => uc.diasVencido > PARAMS.inadimplenciaCriticaDias);
  return (
    <div className="flex flex-col gap-8">
      <MockBanner />
      <div>
        <SectionTitle>Rateio — todas as UCs</SectionTitle>
        <Table>
          <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Usina</Th><Th>UC</Th><Th>Apelido</Th><Th>Consumo compens.</Th><Th>Saldo</Th><Th>Rateio ideal</Th><Th>Rateio verificado</Th><Th>Autonomia</Th><Th>Sinal. saldo</Th><Th>Sinal. consumo</Th><Th>Sinal. inadimpl.</Th></tr></thead>
          <tbody>{UCS.map((uc) => {
            const usina = USINAS.find((u) => u.id === uc.usinaId);
            return (
              <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
                <Td className="max-w-[180px]">{usina.nome}</Td><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td>
                <Td className="tabular-nums">{fmtKwh(uc.consumoCompensavel)}</Td><Td className="tabular-nums">{fmtKwh(uc.saldoKwh)}</Td>
                <Td className="tabular-nums">{(uc.rateioIdeal * 100).toFixed(1)}%</Td><Td className="tabular-nums">{(uc.rateioVerificado * 100).toFixed(1)}%</Td>
                <Td className="tabular-nums">{uc.autonomiaMeses.toFixed(1)}m</Td>
                <Td><SinalTag texto={ucSaldoAlerta(uc)} /></Td><Td><SinalTag texto={ucConsumoAlerta(uc)} /></Td><Td><SinalTag texto={ucInadimplenciaAlerta(uc)} /></Td>
              </tr>
            );
          })}</tbody>
        </Table>
      </div>
      <div>
        <SectionTitle sub={`${saldoAlto.length} UC(s) sinalizada(s)`}>⚡ Saldo alto — rebalancear (autonomia &gt; {PARAMS.autonomiaMaximaMeses} meses)</SectionTitle>
        {saldoAlto.length === 0 ? <EmptyRow texto="Nenhuma UC com saldo acima do limite." /> : (
          <Table><thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>UC</Th><Th>Apelido</Th><Th>Saldo</Th><Th>Autonomia</Th></tr></thead>
            <tbody>{saldoAlto.map((uc) => <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td><Td className="tabular-nums">{fmtKwh(uc.saldoKwh)}</Td><Td className="tabular-nums">{uc.autonomiaMeses.toFixed(1)} meses</Td></tr>)}</tbody>
          </Table>
        )}
      </div>
      <div>
        <SectionTitle sub={`${alteracaoConsumo.length} UC(s) sinalizada(s)`}>📊 Alteração de consumo — 3 meses consecutivos</SectionTitle>
        {alteracaoConsumo.length === 0 ? <EmptyRow texto="Nenhuma UC sinalizada." /> : (
          <Table><thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>UC</Th><Th>Apelido</Th><Th>Créditos N</Th><Th>Créditos N-1</Th><Th>Créditos N-2</Th><Th>Sinalização</Th></tr></thead>
            <tbody>{alteracaoConsumo.map((uc) => <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td><Td className="tabular-nums">{fmtKwh(uc.creditosN)}</Td><Td className="tabular-nums">{fmtKwh(uc.creditosN1)}</Td><Td className="tabular-nums">{fmtKwh(uc.creditosN2)}</Td><Td><SinalTag texto={ucConsumoAlerta(uc)} /></Td></tr>)}</tbody>
          </Table>
        )}
      </div>
      <div>
        <SectionTitle sub={`${inadimplentes.length} UC(s) sinalizada(s)`}>🚨 Inadimplência &gt; {PARAMS.inadimplenciaCriticaDias} dias — retirar do rateio</SectionTitle>
        {inadimplentes.length === 0 ? <EmptyRow texto="Nenhuma UC ultrapassou o limite de dias em aberto." /> : (
          <Table><thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>UC</Th><Th>Apelido</Th><Th>Dias vencido</Th><Th>Valor vencido</Th></tr></thead>
            <tbody>{inadimplentes.map((uc) => <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td><Td className="tabular-nums">{uc.diasVencido}</Td><Td className="tabular-nums">{fmtR$(uc.valorVencido)}</Td></tr>)}</tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ================= GERAÇÃO =================
function GeracaoView() {
  return (
    <div className="flex flex-col gap-10">
      <MockBanner />
      {USINAS.map((u) => {
        const serie = GERACAO[u.id];
        const { desvio, tendencia, media } = tendenciaGeracao(serie);
        const atual = serie[serie.length - 1].injetada;
        const creditosM1 = CREDITOS_UTILIZADOS_M1[u.id];
        const flut = serie.map((s, i) => ({ comp: s.comp, geracao: s.injetada, creditos: creditosM1[i] }));
        return (
          <div key={u.id} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-[15px] text-[#161821]">{u.nome}</h2>
              <div className="flex items-center gap-2 text-[13px]" style={{ color: T.textMuted }}><TrendIcon tendencia={tendencia} /> {fmtKwh(atual)} atual · média {fmtKwh(media)} · desvio {(desvio * 100).toFixed(0)}%</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-xl px-4 py-4" style={{ borderColor: T.border, height: 220 }}>
                <p className="text-[12px] mb-2" style={{ color: T.textMuted }}>Energia injetada — histórico</p>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={serie}>
                    <CartesianGrid stroke="#F1F2F4" vertical={false} />
                    <XAxis dataKey="comp" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => fmtKwh(v)} />
                    <Line type="monotone" dataKey="injetada" stroke={T.accent} strokeWidth={2} dot={{ r: 3 }} name="Injetada" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-xl px-4 py-4" style={{ borderColor: T.border, height: 220 }}>
                <p className="text-[12px] mb-2" style={{ color: T.textMuted }}>Geração (M) × Créditos utilizados (M+1)</p>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={flut}>
                    <CartesianGrid stroke="#F1F2F4" vertical={false} />
                    <XAxis dataKey="comp" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => fmtKwh(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="geracao" fill="#C6A93B" radius={[3, 3, 0, 0]} name="Geração (M)" />
                    <Bar dataKey="creditos" fill="#3D6E8C" radius={[3, 3, 0, 0]} name="Créditos (M+1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-[12px]" style={{ color: T.textMuted }}>Alerta de desvio de geração usa limite de ±{(PARAMS.desvioGeracaoAlertaPct * 100).toFixed(0)}% — valor assumido, ajustável em Configurações.</p>
    </div>
  );
}

// ================= FATURAMENTO =================
function FaturamentoView() {
  const pendentes = UCS.filter((uc) => !uc.capturada).map((uc) => {
    const usina = USINAS.find((u) => u.id === uc.usinaId);
    const tarifa = tarifaRetorno(usina);
    const perdido = uc.consumoCompensavel * tarifa;
    return { uc, usina, tarifa, perdido };
  });
  const totalPerdido = pendentes.reduce((s, p) => s + p.perdido, 0);
  return (
    <div className="flex flex-col gap-6">
      <MockBanner />
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <KpiCard label="UCs sem captura" value={pendentes.length} pillLabel={pendentes.length > 0 ? "abrir chamados" : "tudo capturado"} pillTone={pendentes.length > 0 ? "vermelho" : "verde"} />
        <KpiCard label="Faturamento potencial perdido" value={fmtR$(totalPerdido)} pillLabel={totalPerdido > 0 ? "impacto no mês" : "sem perdas"} pillTone={totalPerdido > 0 ? "vermelho" : "verde"} />
      </div>
      <SectionTitle sub="UCs cadastradas no Rateio sem fatura no Extrato na competência de análise">Captura de faturas pendentes</SectionTitle>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Usina</Th><Th>UC</Th><Th>Apelido</Th><Th>Consumo médio</Th><Th>Tarifa média de retorno</Th><Th>Faturamento perdido</Th><Th>Ação</Th></tr></thead>
        <tbody>
          {pendentes.map(({ uc, usina, tarifa, perdido }) => (
            <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
              <Td className="max-w-[180px]">{usina.nome}</Td><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.apelido}</Td>
              <Td className="tabular-nums">{fmtKwh(uc.consumoCompensavel)}</Td><Td className="tabular-nums">R$ {tarifa.toFixed(4)}/kWh</Td>
              <Td className="tabular-nums" style={{ color: "#B23A2F" }}>{fmtR$(perdido)}</Td>
              <Td><button className="text-[12px] px-2.5 py-1.5 rounded-lg text-white" style={{ background: T.ink }}>Registrar chamado</button></Td>
            </tr>
          ))}
          {pendentes.length === 0 && <tr><Td className="text-center" style={{ color: T.textMuted }}>Todas as UCs capturadas nesta competência.</Td></tr>}
        </tbody>
      </Table>
    </div>
  );
}

// ================= INADIMPLÊNCIA =================
function InadimplenciaView() {
  const vencidas = UCS.filter((uc) => uc.diasVencido > 0);
  const totalVencido = vencidas.reduce((s, uc) => s + (uc.unificada ? valorRealAPagar(uc) : uc.valorVencido), 0);
  return (
    <div className="flex flex-col gap-6">
      <MockBanner />
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <KpiCard label="UCs em atraso" value={vencidas.length} pillLabel={vencidas.length > 0 ? "acompanhar" : "em dia"} pillTone={vencidas.length > 0 ? "vermelho" : "verde"} />
        <KpiCard label="Total em aberto" value={fmtR$(totalVencido)} />
        <KpiCard label="% da carteira" value={`${((vencidas.length / UCS.length) * 100).toFixed(0)}%`} />
      </div>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Usina</Th><Th>UC</Th><Th>Titular</Th><Th>Unificada</Th><Th>Total Sunne</Th><Th>Total concessionária</Th><Th>Valor real a pagar</Th><Th>Dias vencido</Th><Th>Ação</Th></tr></thead>
        <tbody>
          {vencidas.map((uc) => {
            const usina = USINAS.find((u) => u.id === uc.usinaId);
            return (
              <tr key={uc.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
                <Td className="max-w-[160px]">{usina.nome}</Td><Td className="tabular-nums">{uc.numero}</Td><Td>{uc.titular || uc.apelido}</Td>
                <Td>{uc.unificada ? "Sim" : "Não"}</Td><Td className="tabular-nums">{fmtR$(uc.totalSunne ?? uc.valorVencido)}</Td>
                <Td className="tabular-nums">{fmtR$(uc.totalConcessionaria ?? 0)}</Td>
                <Td className="tabular-nums" style={{ color: "#B23A2F" }}>{fmtR$(uc.unificada ? valorRealAPagar(uc) : uc.valorVencido)}</Td>
                <Td className="tabular-nums">{uc.diasVencido}{uc.diasVencido > PARAMS.inadimplenciaCriticaDias ? " ⚠" : ""}</Td>
                <Td><button className="text-[12px] px-2.5 py-1.5 rounded-lg text-white" style={{ background: T.ink }}>Acionar cliente</button></Td>
              </tr>
            );
          })}
          {vencidas.length === 0 && <tr><Td className="text-center" style={{ color: T.textMuted }}>Nenhuma fatura vencida na carteira.</Td></tr>}
        </tbody>
      </Table>
    </div>
  );
}

// ================= TARIFAS =================
function TarifasView({ tarifas }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionTitle sub="Tarifa de retorno usada no cálculo do faturamento potencial (MRR). Alterações geram novo registro — histórico nunca é sobrescrito.">Tarifas por distribuidora</SectionTitle>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Distribuidora</Th><Th>UF</Th><Th>Tarifa fornecida</Th><Th>Injetada GD1</Th><Th>Injetada GD2</Th><Th>Autoconsumo GD1</Th><Th>Autoconsumo GD2</Th></tr></thead>
        <tbody>{tarifas.map((t) => (
          <tr key={t.distribuidora} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
            <Td>{t.distribuidora}</Td><Td>{t.uf}</Td>
            <Td className="tabular-nums">R$ {t.tarifa_fornecida.toFixed(4)}</Td><Td className="tabular-nums">R$ {t.tarifa_injetada_gd1.toFixed(4)}</Td>
            <Td className="tabular-nums">R$ {t.tarifa_injetada_gd2.toFixed(4)}</Td><Td className="tabular-nums">R$ {t.tarifa_injetada_autoconsumo_gd1.toFixed(4)}</Td><Td className="tabular-nums">R$ {t.tarifa_injetada_autoconsumo_gd2.toFixed(4)}</Td>
          </tr>
        ))}</tbody>
      </Table>
    </div>
  );
}

// ================= CHAMADOS =================
function ChamadosView({ chamados }) {
  const [status, setStatus] = useState("Todos");
  const opts = ["Todos", "Aberto", "Em andamento", "Aguardando retorno", "Resolvido", "Encerrado"];
  const filtered = chamados.filter((c) => status === "Todos" || c.status === status);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Filter size={14} style={{ color: T.textMuted }} />
        <Select value={status} onChange={setStatus} options={opts.map((o) => ({ value: o, label: o }))} />
        <span className="text-[12px]" style={{ color: T.textMuted }}>{filtered.length} chamado(s)</span>
      </div>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>ID</Th><Th>Usina</Th><Th>Tipo</Th><Th>Descrição</Th><Th>Qtd. UCs</Th><Th>Abertura</Th><Th>Impacto MRR</Th><Th>Status</Th></tr></thead>
        <tbody>{filtered.map((c) => (
          <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
            <Td className="tabular-nums">{c.id}</Td><Td className="max-w-[160px]">{c.usina_nome}</Td><Td>{c.tipo}</Td>
            <Td className="max-w-[240px] text-[#33353C]">{c.descricao}</Td><Td className="tabular-nums">{c.qtd_ucs}</Td>
            <Td>{c.data_abertura || "—"}</Td><Td className="tabular-nums">{fmtR$(c.impacto_mrr)}</Td><Td><ChamadoPill status={c.status} /></Td>
          </tr>
        ))}
        {filtered.length === 0 && <tr><Td className="text-center" style={{ color: T.textMuted }}>Nenhum chamado registrado ainda.</Td></tr>}
        </tbody>
      </Table>
    </div>
  );
}

// ================= AUDITORIAS =================
function AuditoriasView() {
  return (
    <div className="flex flex-col gap-6">
      <MockBanner />
      <SectionTitle sub="Snapshot mensal da usina AAMN – UFV 1, competência a competência (dados reais em 07/2026)">Auditorias — evolução mensal</SectionTitle>
      <div className="bg-white border rounded-xl px-4 py-4" style={{ borderColor: T.border, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={AUDITORIAS_U1}>
            <CartesianGrid stroke="#F1F2F4" vertical={false} />
            <XAxis dataKey="comp" tick={{ fontSize: 12, fill: T.textMuted }} axisLine={{ stroke: T.border }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: T.textMuted }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="healthScore" stroke={T.accent} strokeWidth={2} dot={{ r: 3 }} name="Health Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Table>
        <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Competência</Th><Th>Health score</Th><Th>Status</Th><Th>Eficiência</Th><Th>Vacância</Th><Th>Capturas pend.</Th></tr></thead>
        <tbody>{AUDITORIAS_U1.map((a) => (
          <tr key={a.comp} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}>
            <Td>{a.comp}</Td><Td className="tabular-nums">{a.healthScore}</Td><Td><StatusPill status={a.status} /></Td>
            <Td className="tabular-nums">{(a.eficiencia * 100).toFixed(0)}%</Td><Td className="tabular-nums">{(a.vacancia * 100).toFixed(0)}%</Td><Td className="tabular-nums">{a.capturasPendentes}</Td>
          </tr>
        ))}</tbody>
      </Table>
    </div>
  );
}

// ================= HISTÓRICO =================
function HistoricoView() {
  return (
    <div className="flex flex-col gap-3">
      <MockBanner />
      <SectionTitle sub="Linha do tempo consolidada — alertas resolvidos, auditorias e chamados encerrados">Histórico</SectionTitle>
      {HISTORICO.map((h, i) => (
        <div key={i} className="flex gap-4 bg-white border rounded-xl px-5 py-4" style={{ borderColor: T.border }}>
          <div className="text-[12px] w-[90px] shrink-0 pt-0.5" style={{ color: T.textMuted }}>{h.data}</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 flex-wrap"><span className="text-[13px] text-[#161821]">{h.usina}</span><Pill>{h.categoria}</Pill></div>
            <p className="text-[13px] text-[#33353C] mt-1">{h.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ================= IMPORTAÇÃO =================
function ImportacaoView({ competencia, onImported }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | recalculando | done | error
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  async function handleImportar() {
    if (!file) return;
    setStatus("uploading"); setErro(null);
    try {
      const r = await api.postImportar(file);
      setResultado(r);
      setStatus("recalculando");
      await api.postRecalcular(competencia);
      setStatus("done");
      onImported();
    } catch (e) {
      setErro(e);
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle sub="Envie o mesmo arquivo .xlsx que a operação usa hoje (abas RATEIO, GERACAO, TARIFAS, EXTRATO_DETALHADO, CHAMADOS). Nunca apaga histórico — dados novos são adicionados/atualizados por chave.">Importar dados</SectionTitle>

      <div className="bg-white border rounded-xl px-5 py-5 flex flex-col gap-4" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-[13px]" />
          <button onClick={handleImportar} disabled={!file || status === "uploading" || status === "recalculando"}
            className="text-[12px] px-3 py-2 rounded-lg text-white disabled:opacity-40" style={{ background: T.ink }}>
            {status === "uploading" ? "Enviando arquivo..." : status === "recalculando" ? "Recalculando indicadores..." : "Importar e recalcular"}
          </button>
        </div>

        {status === "done" && resultado && (
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex items-center gap-2" style={{ color: "#1F7A43" }}><CheckCircle2 size={14} /> Importação concluída para a competência {competencia.slice(0, 7)}.</div>
            <Table>
              <thead><tr className="text-left border-b" style={{ color: T.textMuted, borderColor: T.border, background: "#FAFAFB" }}><Th>Fonte</Th><Th>Resultado</Th></tr></thead>
              <tbody>
                {Object.entries(resultado).map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0" style={{ borderColor: "#F1F2F4" }}><Td>{k}</Td><Td className="text-[#33353C]">{JSON.stringify(v)}</Td></tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        {status === "error" && <ErrorBlock error={erro} />}
      </div>
    </div>
  );
}

// ================= APP =================
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [openUsina, setOpenUsina] = useState(null);
  const [openUC, setOpenUC] = useState(null);
  const [competencia, setCompetencia] = useState("2026-07-01");

  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [usinasMeta, setUsinasMeta] = useState([]);
  const [ucsMeta, setUcsMeta] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setLoading(true); setError(null);
      try {
        await api.postRecalcular(competencia);
        const [dash, al, um, uc, ch, tf] = await Promise.all([
          api.getDashboard(competencia), api.getAlertas(competencia),
          api.getUsinas(), api.getUcs(), api.getChamados(), api.getTarifas(),
        ]);
        if (cancelado) return;
        setDashboard(dash); setAlerts(al); setUsinasMeta(um); setUcsMeta(uc); setChamados(ch); setTarifas(tf);
      } catch (e) {
        if (!cancelado) setError(e);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    carregar();
    return () => { cancelado = true; };
  }, [competencia, reloadKey]);

  const nav = [
    { id: "dashboard", label: "Placar", icon: LayoutGrid, badge: "NOVO" },
    { id: "rotina", label: "Minha rotina", icon: ListChecks },
    { id: "alertas", label: "Central de alertas", icon: Bell },
    { id: "usinas", label: "Usinas", icon: Factory },
    { id: "ucs", label: "Carteira de UCs", icon: Users },
    { id: "rateio", label: "Rateios", icon: SplitSquareHorizontal },
    { id: "geracao", label: "Geração", icon: Activity },
    { id: "faturamento", label: "Faturamento", icon: Receipt },
    { id: "inadimplencia", label: "Inadimplência", icon: AlertCircle },
    { id: "tarifas", label: "Tarifas", icon: Tag },
    { id: "chamados", label: "Chamados", icon: PhoneCall },
    { id: "auditorias", label: "Auditorias", icon: ClipboardCheck },
    { id: "historico", label: "Histórico", icon: History },
    { id: "importacao", label: "Importação", icon: UploadCloud, badge: "NOVO" },
  ];

  function goTab(id) { setTab(id); setOpenUsina(null); setOpenUC(null); }

  let content;
  if (loading) content = <LoadingBlock />;
  else if (error) content = <ErrorBlock error={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  else if (tab === "dashboard") content = <DashboardView dashboard={dashboard} usinasMeta={usinasMeta} competencia={competencia} onChangeCompetencia={setCompetencia} onOpenUsina={(id) => { setOpenUsina(id); setTab("usinas"); }} />;
  else if (tab === "rotina") content = <RotinaView alerts={alerts} usinasMeta={usinasMeta} ucsMeta={ucsMeta} />;
  else if (tab === "alertas") content = <AlertasView alerts={alerts} usinasMeta={usinasMeta} ucsMeta={ucsMeta} />;
  else if (tab === "usinas") content = openUsina ? <UsinaDetailView usinaId={openUsina} usinasMeta={usinasMeta} indicadores={dashboard.usinas} ucsMeta={ucsMeta} onBack={() => setOpenUsina(null)} /> : <UsinasListView usinasMeta={usinasMeta} onOpen={setOpenUsina} />;
  else if (tab === "ucs") content = openUC ? <UCDetailView ucId={openUC} ucsMeta={ucsMeta} onBack={() => setOpenUC(null)} /> : <UCsListView ucsMeta={ucsMeta} onOpen={setOpenUC} />;
  else if (tab === "rateio") content = <RateioView />;
  else if (tab === "geracao") content = <GeracaoView />;
  else if (tab === "faturamento") content = <FaturamentoView />;
  else if (tab === "inadimplencia") content = <InadimplenciaView />;
  else if (tab === "tarifas") content = <TarifasView tarifas={tarifas} />;
  else if (tab === "chamados") content = <ChamadosView chamados={chamados} />;
  else if (tab === "auditorias") content = <AuditoriasView />;
  else if (tab === "historico") content = <HistoricoView />;
  else if (tab === "importacao") content = <ImportacaoView competencia={competencia} onImported={() => setReloadKey((k) => k + 1)} />;

  return (
    <div className="min-h-screen w-full flex" style={{ background: T.bg, color: "#161821", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <div className="w-[230px] shrink-0 flex flex-col overflow-y-auto" style={{ background: T.ink, color: "#B7BAC2" }}>
        <div className="px-5 py-6">
          <span className="text-[19px] font-semibold text-white">auditoria<span style={{ color: T.accent }}>.</span></span>
          <p className="text-[11px] mt-0.5" style={{ color: "#7C7F88" }}>Portal do Analista</p>
        </div>
        <div className="flex flex-col gap-0.5 px-3 pb-4 text-[13px]">
          {nav.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => goTab(t.id)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left justify-between"
                style={{ background: active ? T.inkSoft : "transparent" }}>
                <span className="flex items-center gap-2.5" style={{ color: active ? "#fff" : "#B7BAC2" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? T.accent : "#3A3D46" }} />
                  <Icon size={14} /> {t.label}
                </span>
                {t.badge && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#2A2D36", color: "#9FA2AB" }}>{t.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 px-8 py-8 max-w-[1240px] overflow-y-auto">{content}</div>
    </div>
  );
}
