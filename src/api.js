// Endereço do backend. Em produção, defina VITE_API_URL nas variáveis de
// ambiente da Vercel apontando para a URL do Render
// (ex.: https://auditoria-backend-cavu.onrender.com).
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

export const getDashboard = (competencia) => req(`/dashboard?competencia=${competencia}`);
export const getAlertas = (competencia) => req(`/alertas?competencia=${competencia}`);
export const getUsinas = () => req(`/usinas`);
export const getUcs = () => req(`/ucs`);
export const getChamados = () => req(`/chamados`);
export const getTarifas = () => req(`/tarifas`);
export const getRateio = (competencia) => req(`/rateio?competencia=${competencia}`);
export const getGeracao = () => req(`/geracao`);
export const getCapturasPendentes = (competencia) => req(`/capturas-pendentes?competencia=${competencia}`);
export const getInadimplencia = () => req(`/inadimplencia`);
export const getAuditorias = (usinaId) => req(`/usinas/${usinaId}/auditorias`);
export const postRecalcular = (competencia) => req(`/recalcular?competencia=${competencia}`, { method: "POST" });
export const postImportar = (file) => {
  const form = new FormData();
  form.append("arquivo", file);
  return req(`/importar`, { method: "POST", body: form });
};
