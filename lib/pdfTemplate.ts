export function generateProposalPdfHtml(proposalData: any, profileData: any): string {
  const totalValue = Number(proposalData.total_value ?? proposalData.value ?? 0);
  const createdDate = proposalData.created_at
    ? new Date(proposalData.created_at).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const validity = proposalData.validity || '7 dias';
  const companyName = profileData?.company_name || profileData?.owner_name || 'Empresa';
  const ownerName = profileData?.owner_name || '';
  const city = profileData?.city || '';
  const logoUrl = profileData?.logo_url || '';
  const phone = profileData?.phone || '';
  const items: any[] = Array.isArray(proposalData.items) ? proposalData.items : [];

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Proposta — ${companyName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    background: #F8FAFC;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── HEADER ── */
  .header {
    background: #1A56DB;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 36px 28px 52px;
    position: relative;
  }
  .header-curve {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 28px;
    background: #F8FAFC;
    border-radius: 28px 28px 0 0;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 24px;
    background: rgba(255,255,255,0.15);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .badge-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #4ade80;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .empresa-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .logo-box {
    width: 56px; height: 56px;
    border-radius: 14px;
    background: rgba(255,255,255,0.2);
    border: 1.5px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .logo-box img { width: 100%; height: 100%; object-fit: cover; }
  .logo-initials {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
  }
  .empresa-nome {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
  }
  .empresa-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    margin-top: 3px;
  }

  .para-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .para-nome {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.15;
  }

  .pills {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .pill {
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    font-weight: 500;
    background: rgba(255,255,255,0.12);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── BODY ── */
  .body { padding: 8px 28px 40px; }

  /* ── CARD ── */
  .card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    margin-bottom: 14px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    page-break-inside: avoid;
  }
  .card-title {
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 14px 20px 10px;
    border-bottom: 1px solid #F8FAFC;
    background: #fff;
  }

  /* ── ITENS ── */
  .item-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #F8FAFC;
    gap: 16px;
  }
  .item-row:last-of-type { border-bottom: none; }
  .item-left { flex: 1; }
  .item-qty {
    display: inline-block;
    background: #F8FAFC;
    border: 1px solid #e2e8f0;
    color: #1A56DB;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    margin-bottom: 5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .item-name {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.3;
  }
  .item-desc { font-size: 12px; color: #94A3B8; margin-top: 2px; }
  .item-price {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
  }

  /* ── TOTAL ── */
  .total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #f0fdf4;
    border-top: 1px solid #bbf7d0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .total-label { font-size: 14px; font-weight: 700; color: #166534; }
  .total-value { font-size: 26px; font-weight: 800; color: #15803d; letter-spacing: -0.5px; }

  /* ── OBSERVAÇÕES ── */
  .obs-box {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
  }
  .obs-icon {
    width: 32px; height: 32px;
    flex-shrink: 0;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .obs-label { font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  .obs-text { font-size: 13px; color: #78350f; line-height: 1.6; font-style: italic; }

  /* ── CONDIÇÕES ── */
  .cond-grid { display: flex; flex-wrap: wrap; gap: 1px; background: #F8FAFC; }
  .cond-item { background: #fff; padding: 14px 20px; flex: 1; min-width: 45%; }
  .cond-item.full { min-width: 100%; width: 100%; }
  .cond-label { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .cond-val { font-size: 15px; font-weight: 600; color: #0f172a; }

  /* ── CONSULTOR ── */
  .vendor-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 16px 20px;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    page-break-inside: avoid;
  }
  .vendor-avatar {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    color: #1A56DB;
    flex-shrink: 0;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .vendor-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .vendor-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .vendor-meta { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.5; }

  /* ── FOOTER ── */
  .footer { text-align: center; padding: 20px; color: #94A3B8; font-size: 12px; }
  .footer strong { color: #1A56DB; font-weight: 700; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 0; }
    .card { page-break-inside: avoid; }
    .vendor-card { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="badge">
    <div class="badge-dot"></div>
    Proposta Comercial
  </div>

  <div class="empresa-row">
    <div class="logo-box">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="Logo"/>`
        : `<span class="logo-initials">${companyName.substring(0, 1).toUpperCase()}</span>`
      }
    </div>
    <div>
      <div class="empresa-nome">${companyName}</div>
      <div class="empresa-sub">${[ownerName !== companyName ? ownerName : '', city].filter(Boolean).join(' · ')}</div>
    </div>
  </div>

  <div class="para-label">Proposta para</div>
  <div class="para-nome">${proposalData.client_name}</div>

  <div class="pills">
    <div class="pill">📅 ${createdDate}</div>
    <div class="pill">⏱ Válida por ${validity}</div>
  </div>

  <div class="header-curve"></div>
</div>

<!-- BODY -->
<div class="body">

  <!-- SERVIÇOS E MATERIAIS -->
  <div class="card">
    <div class="card-title">Serviços e Materiais</div>
    ${items.map((item: any) => `
    <div class="item-row">
      <div class="item-left">
        <div class="item-qty">${item.qty}×</div>
        <div class="item-name">${item.name}</div>
        ${item.desc ? `<div class="item-desc">${item.desc}</div>` : ''}
      </div>
      <div class="item-price">R$ ${fmtBRL((item.price || 0) * (item.qty || 1))}</div>
    </div>
    `).join('')}
    <div class="total-row">
      <div class="total-label">Total Geral</div>
      <div class="total-value">R$ ${fmtBRL(totalValue)}</div>
    </div>
  </div>

  <!-- OBSERVAÇÕES -->
  ${proposalData.notes && proposalData.notes.trim() !== '' ? `
  <div class="card">
    <div class="obs-box">
      <div class="obs-icon">⚠️</div>
      <div>
        <div class="obs-label">Observações</div>
        <div class="obs-text">${proposalData.notes}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- CONDIÇÕES -->
  ${(proposalData.execution_time || proposalData.warranty || proposalData.payment_method) ? `
  <div class="card">
    <div class="card-title">Condições Comerciais</div>
    <div class="cond-grid">
      ${proposalData.execution_time ? `
      <div class="cond-item">
        <div class="cond-label">Execução</div>
        <div class="cond-val">${proposalData.execution_time}</div>
      </div>` : ''}
      ${proposalData.warranty ? `
      <div class="cond-item">
        <div class="cond-label">Garantia</div>
        <div class="cond-val">${proposalData.warranty}</div>
      </div>` : ''}
      ${proposalData.payment_method ? `
      <div class="cond-item full">
        <div class="cond-label">Forma de Pagamento</div>
        <div class="cond-val">${proposalData.payment_method}</div>
      </div>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- DADOS DO CONSULTOR -->
  ${(ownerName || phone || city) ? `
  <div class="vendor-card">
    <div class="vendor-avatar">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="logo"/>`
        : companyName.substring(0, 1).toUpperCase()
      }
    </div>
    <div>
      <div class="vendor-name">${ownerName || companyName}</div>
      <div class="vendor-meta">
        ${phone ? `📱 ${phone}` : ''}
        ${phone && city ? '<br/>' : ''}
        ${city ? `📍 ${city}` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- RODAPÉ -->
  <div class="footer">
    Proposta gerada com <strong>Propoz</strong> · propoz.pages.dev
  </div>

</div>
</body>
</html>`;
}
