import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView, ScrollView,
  Share,
  StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image
} from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  blue: '#1A56DB',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
  blueText: '#1e3a8a',
  ink: '#1e293b',
  muted: '#64748b',
  subtle: '#94a3b8',
  border: '#CBD5E1',
  borderLight: '#F1F5F9',
  white: '#ffffff',
  bgLight: '#F8FAFC',
  greenBg: '#F0FDF4',
  greenText: '#166534',
  greenValue: '#15803d',
  greenWa: '#25D366',
};

// ─────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────
const IconArrowLeft = () => (
  <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
    <Polyline points="10,4 6,8 10,12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconCheck = () => (
  <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
    <Polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconCheckLarge = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
    <Polyline points="5,12 10,17 19,7" stroke="#15803d" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const NodeLogo = () => (
  <View style={s.logoContainer}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke="#fff" strokeWidth={2} />
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  </View>
);

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function NewProposal() {
  const [clientName, setClientName] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedProposalData, setSavedProposalData] = useState<any>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Campos de Configuração
  const [validade, setValidade] = useState('7 dias');
  const [pagamento, setPagamento] = useState('PIX / À vista');
  const [prazo, setPrazo] = useState('Imediato');
  const [garantia, setGarantia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 1. Carregar perfil para checar plano
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingCatalog(false);
        return;
      }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(prof);

      // 2. Carregar catálogo APENAS do usuário logado
      const { data, error } = await supabase
        .from('services').select('*').eq('user_id', user.id).eq('is_active', true).order('category', { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar dados iniciais.');
    } finally {
      setLoadingCatalog(false);
    }
  }

  // FUNÇÃO PARA CHECAR LIMITE DE 5 ORÇAMENTOS
  const checkLimit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (userProfile?.plan === 'pro') return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (error) return true; // Se der erro, deixa passar por precaução

    // Se for plano free e já tiver 5 ou mais, bloqueia
    if (count !== null && count >= 5) {
      Alert.alert(
        'Limite de Propostas Atingido',
        'Você usou todas as 5 propostas gratuitas do mês. Faça o upgrade para criar de forma ilimitada!',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Upgrade', onPress: () => router.push('/upgrade' as any) }
        ]
      );
      return false;
    }
    return true;
  };

  const updateQuantity = (service: any, amount: number) => {
    setSelectedItems((prev: any) => {
      const currentQty = prev[service.id]?.qty || 0;
      const newQty = Math.max(0, currentQty + amount);
      if (newQty === 0) {
        const newState = { ...prev };
        delete newState[service.id];
        return newState;
      }
      return { ...prev, [service.id]: { ...service, qty: newQty } };
    });
  };

  const calculateTotal = () => Object.values(selectedItems).reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);

  const handleSave = async (shouldShare: boolean) => {
    setLoading(true);

    // Verifica limite novamente no momento de salvar
    const canSave = await checkLimit();
    if (!canSave) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const itemsArray = Object.values(selectedItems);
      const total = calculateTotal();

      const { data, error } = await supabase.from('proposals').insert([{
        client_name: clientName,
        value: total,
        user_id: user?.id,
        items: itemsArray,
        status: 'enviada',
        payment_method: pagamento,
        warranty: garantia,
        execution_time: prazo,
        notes: observacoes
      }]).select('id, share_id').single();

      if (error) throw error;

      setShowPreview(false);

      if (shouldShare) {
        setSavedProposalData({
          ...data,
          client_name: clientName,
          value: total,
          items: itemsArray,
          payment_method: pagamento,
          warranty: garantia,
          execution_time: prazo,
          notes: observacoes
        });
        
        // Aguarda a animação do Modal de Preview fechar para abrir o Modal de Sucesso no RN (iOS/Android bug fix)
        setTimeout(() => {
          setShowSuccess(true);
        }, 500);
      } else {
        router.replace('/proposals');
      }
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportProposalToPDF = async (proposalData: any, profileData: any) => {
    try {
      setLoading(true);
      const htmlTemplate = `
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
      <div class="validade-pill"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${new Date().toLocaleDateString('pt-BR')}</div>
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
      <div class="item-valor">R$ ${(item.price * item.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
    `).join('')}
    <div class="divider"></div>
    <div class="total-row">
      <div class="total-label">Total Geral</div>
      <div class="total-valor">R$ ${Number(proposalData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
      const { uri } = await Print.printToFileAsync({ html: htmlTemplate });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Proposta' });
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao gerar o PDF da proposta. ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!clientName) return Alert.alert("Ops", "Informe o nome do cliente.");
    if (calculateTotal() === 0) return Alert.alert("Ops", "Selecione um serviço.");

    setLoading(true);
    const canContinue = await checkLimit();
    setLoading(false);

    if (canContinue) {
      setShowPreview(true);
    }
  };

  const handleExportPDFPreview = async () => {
    const pseudoProposal = {
      client_name: clientName,
      validity: validade,
      items: Object.values(selectedItems),
      value: calculateTotal(),
      notes: observacoes,
      execution_time: prazo,
      warranty: garantia,
      payment_method: pagamento
    };
    await exportProposalToPDF(pseudoProposal, profile);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={s.container}>
        <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false} />

        <View style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtnBox} activeOpacity={0.7}>
              <IconArrowLeft />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Nova proposta</Text>
          </View>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>CLIENTE</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Condomínio Solar"
            value={clientName}
            onChangeText={setClientName}
            placeholderTextColor={C.subtle}
          />

          <Text style={s.sectionLabel}>SERVIÇOS DISPONÍVEIS</Text>
          {loadingCatalog ? <ActivityIndicator color={C.blue} /> : (
            <View style={s.servicesCard}>
              {services.map((item, idx) => {
                const qty = selectedItems[item.id]?.qty || 0;
                const isSelected = qty > 0;
                return (
                  <View key={item.id} style={[s.serviceRow, isSelected && s.serviceRowActive, idx === services.length - 1 && { borderBottomWidth: 0 }]}>
                    <TouchableOpacity style={s.serviceLeft} onPress={() => updateQuantity(item, isSelected ? -qty : 1)} activeOpacity={0.7}>
                      <View style={[s.checkbox, isSelected && s.checkboxActive]}>{isSelected && <IconCheck />}</View>
                      <Text style={[s.serviceName, isSelected && { color: C.blueText }]}>{item.name}</Text>
                    </TouchableOpacity>
                    <View style={s.stepper}>
                      <TouchableOpacity onPress={() => updateQuantity(item, -1)} style={s.stepBtn}><Text style={s.stepText}>-</Text></TouchableOpacity>
                      <Text style={s.qtyText}>{qty || '0'}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item, 1)} style={[s.stepBtn, { backgroundColor: C.blue }]}><Text style={[s.stepText, { color: isSelected ? '#fff' : C.blue }]}>+</Text></TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={s.fixedFooter}>
          <TouchableOpacity style={s.btnGhost} activeOpacity={0.7} onPress={() => router.push('/services')}>
            <Text style={s.btnGhostText}>+ Adicionar outro serviço no catálogo</Text>
          </TouchableOpacity>

          <View style={s.gridRow}>
            <View style={s.gridCol}>
              <Text style={s.miniLabel}>VALIDADE</Text>
              <TextInput style={s.inputSmall} value={validade} onChangeText={setValidade} />
            </View>
            <View style={s.gridCol}>
              <Text style={s.miniLabel}>PAGAMENTO</Text>
              <TextInput style={s.inputSmall} value={pagamento} onChangeText={setPagamento} />
            </View>
          </View>

          <View style={s.gridRow}>
            <View style={s.gridCol}>
              <Text style={s.miniLabel}>PRAZO</Text>
              <TextInput style={s.inputSmall} value={prazo} onChangeText={setPrazo} />
            </View>
            <View style={s.gridCol}>
              <Text style={s.miniLabel}>GARANTIA</Text>
              <TextInput style={s.inputSmall} value={garantia} onChangeText={setGarantia} placeholder="Opcional" placeholderTextColor={C.subtle} />
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={s.miniLabel}>OBSERVAÇÕES</Text>
            <TextInput
              style={s.inputObs}
              placeholder="Ex: Materiais inclusos..."
              value={observacoes}
              onChangeText={setObservacoes}
              placeholderTextColor={C.subtle}
            />
          </View>

          <View style={s.totalBox}>
            <View>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalValue}>R$ {calculateTotal().toLocaleString('pt-BR')}</Text>
            </View>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={handleOpenPreview}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryTxt}>Ver proposta</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={showPreview} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: C.blue }}>
            <View style={s.previewHeader}>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={s.backBtnBox}><IconArrowLeft /></TouchableOpacity>
              <Text style={s.previewTitleTop}>Preview da Proposta</Text>
              <View style={s.previewPill}><Text style={s.previewPillTxt}>Online</Text></View>
            </View>

            <ScrollView style={s.previewScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <View style={s.proposalPaper}>
                <View style={s.paperHeader}>
                  {profile?.logo_url ? (
                    <Image source={{ uri: profile.logo_url }} style={s.logoContainer} />
                  ) : (
                    <NodeLogo />
                  )}
                  <View>
                    <Text style={s.paperBrand}>{profile?.owner_name || 'Minha Empresa'}</Text>
                    <Text style={s.paperSubBrand}>Proposta Comercial</Text>
                  </View>
                </View>

                <View style={s.paperMetaRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.paperLabel}>PROPOSTA PARA</Text>
                    <Text style={s.paperValue}>{clientName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.paperLabel}>DATA</Text>
                    <Text style={s.paperValue}>{new Date().toLocaleDateString('pt-BR')}</Text>
                  </View>
                </View>

                <View style={s.paperItems}>
                  {Object.values(selectedItems).map((item: any) => (
                    <View key={item.id} style={s.paperItemLine}>
                      <Text style={s.paperItemName}>{item.qty}x {item.name}</Text>
                      <Text style={s.paperItemPrice}>R$ {(item.price * item.qty).toLocaleString('pt-BR')}</Text>
                    </View>
                  ))}
                </View>

                {observacoes.length > 0 && (
                  <View style={s.paperNotesBox}>
                    <Text style={s.paperLabel}>OBSERVAÇÕES</Text>
                    <Text style={s.paperNotesText}>{observacoes}</Text>
                  </View>
                )}

                <View style={s.paperTotalRow}>
                  <Text style={s.paperTotalLbl}>Total</Text>
                  <Text style={s.paperTotalVal}>R$ {calculateTotal().toLocaleString('pt-BR')}</Text>
                </View>

                <View style={s.paperFooterGrid}>
                  <View style={s.gridItem}>
                    <Text style={s.gridLbl}>Execução</Text>
                    <Text style={s.gridVal}>{prazo}</Text>
                  </View>
                  {garantia.length > 0 && (
                    <View style={s.gridItem}>
                      <Text style={s.gridLbl}>Garantia</Text>
                      <Text style={s.gridVal}>{garantia}</Text>
                    </View>
                  )}
                  <View style={s.gridItem}>
                    <Text style={s.gridLbl}>Pagamento</Text>
                    <Text style={s.gridVal}>{pagamento}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={s.btnPdf} onPress={handleExportPDFPreview} disabled={loading}>
                <Text style={s.btnPdfTxt}>{loading ? 'Processando...' : 'Exportar para PDF'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnSend} onPress={() => handleSave(true)} disabled={loading}>
                <Text style={s.btnSendTxt}>{loading ? 'Salvando...' : 'Salvar e Enviar Proposta'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnSaveOnly} onPress={() => handleSave(false)} disabled={loading}>
                <Text style={s.btnSaveOnlyTxt}>Apenas Salvar no Sistema</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Modal de Sucesso */}
        <Modal visible={showSuccess} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.greenBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <IconCheckLarge />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: C.ink, marginBottom: 8 }}>Proposta Criada!</Text>
              <Text style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>Sua proposta foi salva com sucesso. Escolha como compartilhar com o cliente.</Text>
              
              <TouchableOpacity
                style={[s.btnPrimary, { width: '100%', marginBottom: 12, alignItems: 'center', paddingVertical: 14 }]}
                onPress={async () => {
                  const shareUrl = `https://propoz-xdbm.vercel.app/view/${savedProposalData?.share_id || savedProposalData?.id}`;
                  await Share.share({
                    message: `Olá! Segue a proposta de Node Tech para ${savedProposalData?.client_name}.\n*Total: R$ ${Number(savedProposalData?.value).toLocaleString('pt-BR')}*\n\nDetalhes aqui: ${shareUrl}`,
                  });
                }}
              >
                <Text style={s.btnPrimaryTxt}>Compartilhar link da Vercel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btnSaveOnly, { width: '100%', marginTop: 0, alignItems: 'center', paddingVertical: 14 }]}
                onPress={() => exportProposalToPDF(savedProposalData, profile)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={C.blueText} />
                ) : (
                  <Text style={[s.btnSaveOnlyTxt, { color: C.blueText }]}>Exportar PDF</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 16, marginTop: 10, width: '100%', alignItems: 'center' }}
                onPress={() => {
                  setShowSuccess(false);
                  router.replace('/proposals');
                }}
              >
                <Text style={{ color: C.muted, fontWeight: '700', fontSize: 15 }}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtnBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  body: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  miniLabel: { fontSize: 9, fontWeight: '700', color: C.muted, marginBottom: 4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 15, color: C.ink, marginBottom: 20 },
  inputSmall: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 8, fontSize: 13, color: C.ink, backgroundColor: C.bgLight },
  inputObs: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, fontSize: 13, color: C.ink, backgroundColor: C.bgLight },
  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  gridCol: { flex: 1 },
  servicesCard: { borderWidth: 1, borderColor: C.borderLight, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  serviceRowActive: { backgroundColor: C.blueBg },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: C.blue, borderColor: C.blue },
  serviceName: { fontSize: 14, fontWeight: '600', color: C.ink, flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: C.blue, fontSize: 16, fontWeight: '600' },
  qtyText: { minWidth: 18, textAlign: 'center', fontSize: 14, fontWeight: '700', color: C.blueText },
  fixedFooter: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: C.borderLight, paddingBottom: Platform.OS === 'ios' ? 34 : 20, elevation: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
  btnGhost: { width: '100%', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginBottom: 12 },
  btnGhostText: { color: C.muted, fontSize: 12, fontWeight: '600' },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.greenBg, padding: 12, borderRadius: 12 },
  totalLabel: { fontSize: 10, color: C.greenText, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.greenValue },
  btnPrimary: { backgroundColor: C.blue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  previewTitleTop: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 12, flex: 1 },
  previewPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  previewPillTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  previewScroll: { flex: 1, backgroundColor: '#f4f6f8', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  proposalPaper: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 4, shadowOpacity: 0.1, shadowRadius: 10, marginTop: 10 },
  paperHeader: { backgroundColor: C.blue, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  paperBrand: { color: '#fff', fontSize: 17, fontWeight: '700' },
  paperSubBrand: { color: '#fff', fontSize: 11, opacity: 0.8 },
  paperMetaRow: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderColor: C.borderLight },
  paperLabel: { fontSize: 9, color: C.muted, fontWeight: '800', marginBottom: 4 },
  paperValue: { fontSize: 14, fontWeight: '700', color: C.ink },
  paperItems: { padding: 20 },
  paperItemLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  paperItemName: { fontSize: 14, color: C.ink, flex: 1 },
  paperItemPrice: { fontSize: 14, fontWeight: '700', color: C.ink },
  paperNotesBox: { padding: 20, paddingTop: 0 },
  paperNotesText: { fontSize: 13, color: C.muted, fontStyle: 'italic' },
  paperTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderColor: C.borderLight },
  paperTotalLbl: { fontSize: 15, fontWeight: '600', color: C.ink },
  paperTotalVal: { fontSize: 19, fontWeight: '900', color: C.blue },
  paperFooterGrid: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 15, borderTopWidth: 1, borderColor: C.borderLight },
  gridItem: { flex: 1 },
  gridLbl: { fontSize: 8, color: C.muted, fontWeight: '700', marginBottom: 2 },
  gridVal: { fontSize: 11, fontWeight: '700', color: C.ink },
  btnPdf: { backgroundColor: C.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnPdfTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSend: { backgroundColor: C.greenWa, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  btnSendTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSaveOnly: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  btnSaveOnlyTxt: { color: C.muted, fontSize: 14, fontWeight: '600' }
});