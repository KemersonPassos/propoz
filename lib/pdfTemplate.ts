export function generateProposalPdfHtml(proposalData: any, profileData: any): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Proposta Comercial — ${profileData?.owner_name || 'Node Tech'}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --blue:#1A56DB;
  --blue-dk:#1344B0;
  --blue-lt:#93C5FD;
  --navy:#0D1626;
  --green:#25D366;
  --green-dk:#1DA851;
  --ink:#1E293B;
  --slate:#475569;
  --muted:#94A3B8;
  --border:#E2E8F0;
  --bg:#F8FAFC;
}
@media print {
  body { -webkit-print-color-adjust: exact; }
}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;}
.header{background:var(--blue);padding:0 20px;position:relative;overflow:hidden;}
.header::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:24px;background:var(--bg);border-radius:24px 24px 0 0;}
.header-inner{max-width:480px;margin:0 auto;padding:28px 0 40px;position:relative;z-index:1;}
.status-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:600;color:#fff;margin-bottom:20px;}
.status-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.25);}
.empresa-row{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
.empresa-logo{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
.empresa-logo img{width:100%;height:100%;object-fit:cover;border-radius:12px;}
.empresa-nome{font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px;}
.empresa-local{font-size:13px;color:rgba(255,255,255,.6);margin-top:2px;display:flex;align-items:center;gap:4px;}
.para-label{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;}
.para-nome{font-size:26px;font-weight:700;color:#fff;letter-spacing:-.5px;line-height:1.1;}
.validade-row{display:flex;align-items:center;gap:8px;margin-top:14px;}
.validade-pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:5px 12px;font-size:12px;color:rgba(255,255,255,.75);font-weight:500;}
.body{max-width:480px;margin:0 auto;padding:24px 20px 120px;}
.card{background:#fff;border-radius:16px;border:1px solid var(--border);overflow:hidden;margin-bottom:12px;}
.sec-label{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;padding:14px 18px 10px;border-bottom:1px solid var(--bg);}
.item-row{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--bg);gap:12px;}
.item-row:last-child{border-bottom:none;}
.item-left{flex:1;}
.item-qty{display:inline-block;background:var(--bg);border:1px solid var(--border);color:var(--blue);font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;margin-bottom:4px;letter-spacing:.02em;}
.item-nome{font-size:15px;font-weight:600;color:var(--ink);line-height:1.3;}
.item-desc{font-size:12px;color:var(--muted);margin-top:2px;}
.item-valor{font-family:'DM Mono',monospace;font-size:15px;font-weight:500;color:var(--ink);white-space:nowrap;margin-top:2px;}
.total-row{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#F0FDF4;}
.total-label{font-size:14px;font-weight:700;color:#166534;}
.total-valor{font-family:'DM Mono',monospace;font-size:24px;font-weight:500;color:#15803D;letter-spacing:-.5px;}
.obs-box{padding:14px 18px;display:flex;align-items:flex-start;gap:10px;}
.obs-icon{width:28px;height:28px;flex-shrink:0;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-top:1px;}
.obs-label{font-size:11px;font-weight:700;color:#92400E;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em;}
.obs-text{font-size:13px;color:#78350F;line-height:1.55;font-style:italic;}
.cond-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--bg);}
.cond-item{background:#fff;padding:14px 18px;}
.cond-label{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
.cond-val{font-size:15px;font-weight:600;color:var(--ink);}
.cond-grid .cond-item:last-child{grid-column:1/-1;}
.assinatura-card{background:#fff;border-radius:16px;border:1px solid var(--border);padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:14px;}
.ass-icon{width:44px;height:44px;border-radius:12px;background:#EFF6FF;border:1px solid #BFDBFE;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ass-title{font-size:14px;font-weight:700;color:var(--ink);}
.ass-sub{font-size:12px;color:var(--muted);margin-top:2px;line-height:1.4;}
.sticky-footer{position:fixed;bottom:0;left:0;right:0;padding:12px 20px 28px;background:linear-gradient(to top, var(--bg) 70%, transparent);z-index:100;}
.btn-wpp{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:480px;margin:0 auto;background:var(--green);color:#fff;border:none;border-radius:14px;padding:16px 24px;font-size:16px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 4px 24px rgba(37,211,102,.35);transition:background .2s, transform .15s;text-decoration:none;}
.propoz-footer{text-align:center;padding:16px 20px 24px;display:flex;align-items:center;justify-content:center;gap:8px;}
.propoz-footer-icon{width:20px;height:20px;border-radius:5px;background:var(--blue);display:flex;align-items:center;justify-content:center;}
.propoz-footer-text{font-size:12px;color:var(--muted);}
.propoz-footer-text strong{color:var(--blue);font-weight:700;}
.divider{height:1px;background:var(--border);margin:4px 0;}
</style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <div class="status-badge"><div class="status-dot"></div>Proposta válida</div>
    <div class="empresa-row">
      <div class="empresa-logo">
        ${profileData?.logo_url ? `<img src="${profileData.logo_url}" alt="Logo"/>` : `
        <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
          <defs><clipPath id="H-bot"><polygon points="20,6 48,6 48,44 20,44 20,29 41,23 20,23"/></clipPath><clipPath id="H-top"><polygon points="20,6 48,6 48,23 41,23 20,29 20,6"/></clipPath><clipPath id="H-lin"><polygon points="20,29 48,23 48,44 20,44"/></clipPath></defs>
          <rect x="7" y="14" width="26" height="32" rx="5" fill="rgba(255,255,255,.2)"/><rect x="13" y="10" width="26" height="32" rx="5" fill="rgba(255,255,255,.3)"/><rect x="20" y="6" width="28" height="38" rx="5" fill="rgba(255,255,255,.9)" clip-path="url(#H-bot)"/><rect x="20" y="6" width="28" height="38" rx="5" fill="rgba(255,255,255,.9)" clip-path="url(#H-top)"/><line x1="26" y1="31" x2="43" y2="31" stroke="rgba(26,86,219,.3)" stroke-width="2.5" stroke-linecap="round" clip-path="url(#H-lin)"/><line x1="26" y1="36" x2="38" y2="36" stroke="rgba(26,86,219,.3)" stroke-width="2.5" stroke-linecap="round" clip-path="url(#H-lin)"/><polygon points="37,3 25,27 34,27 22,53 45,22 36,22" fill="#1A56DB"/>
        </svg>
        `}
      </div>
      <div>
        <div class="empresa-nome">${profileData?.owner_name || 'Node Tech'}</div>
        <div class="empresa-local"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Brasil</div>
      </div>
    </div>
    <div class="para-label">Proposta para</div>
    <div class="para-nome">${proposalData.client_name}</div>
    <div class="validade-row">
      <div class="validade-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${proposalData.created_at ? new Date(proposalData.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div>
      <div class="validade-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>Válida por ${proposalData.validity || '7 dias'}</div>
    </div>
  </div>
</div>

<div class="body">
  <div class="card">
    <div class="sec-label">Serviços e materiais</div>
    ${proposalData.items.map((item: any) => `
    <div class="item-row">
      <div class="item-left">
        <div class="item-qty">${item.qty}×</div>
        <div class="item-nome">${item.name}</div>
        <div class="item-desc">${item.desc || ''}</div>
      </div>
      <div class="item-valor">R$ ${((item.price || 0) * (item.qty || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    `).join('')}
    <div class="divider"></div>
    <div class="total-row">
      <div class="total-label">Total Geral</div>
      <div class="total-valor">R$ ${Number(proposalData.value || proposalData.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>

  ${proposalData.notes ? `
  <div class="card">
    <div class="obs-box">
      <div class="obs-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
      <div><div class="obs-label">Observações</div><div class="obs-text">${proposalData.notes}</div></div>
    </div>
  </div>
  ` : ''}

  <div class="card">
    <div class="sec-label">Condições</div>
    <div class="cond-grid">
      <div class="cond-item"><div class="cond-label">Execução</div><div class="cond-val">${proposalData.execution_time || 'Imediato'}</div></div>
      ${proposalData.warranty ? `<div class="cond-item"><div class="cond-label">Garantia</div><div class="cond-val">${proposalData.warranty}</div></div>` : ''}
      <div class="cond-item"><div class="cond-label">Pagamento</div><div class="cond-val">${proposalData.payment_method || 'PIX / À vista'}</div></div>
    </div>
  </div>

</div>

</body>
</html>
`;
}
