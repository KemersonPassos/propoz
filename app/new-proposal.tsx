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

      if (shouldShare) {
        const shareUrl = `https://propoz-xdbm.vercel.app/view/${data.share_id || data.id}`;
        await Share.share({
          message: `Olá! Segue a proposta de Node Tech para ${clientName}.\n*Total: R$ ${total.toLocaleString('pt-BR')}*\n\nDetalhes aqui: ${shareUrl}`,
        });
      }

      setShowPreview(false);
      router.replace('/proposals');
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
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

              <TouchableOpacity style={s.btnSend} onPress={() => handleSave(true)} disabled={loading}>
                <Text style={s.btnSendTxt}>{loading ? 'Salvando...' : 'Salvar e Enviar Proposta'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.btnSaveOnly} onPress={() => handleSave(false)} disabled={loading}>
                <Text style={s.btnSaveOnlyTxt}>Apenas Salvar no Sistema</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
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
  btnSend: { backgroundColor: C.greenWa, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnSendTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSaveOnly: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  btnSaveOnlyTxt: { color: C.muted, fontSize: 14, fontWeight: '600' }
});