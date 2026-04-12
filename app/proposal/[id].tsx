import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  blue:        '#1A56DB',
  blueBg:      '#EFF6FF',
  blueText:    '#1e3a8a',
  blueLink:    '#3b82f6',
  greenWa:     '#25D366',
  greenBg:     '#F0FDF4',
  greenText:   '#166534',
  greenBdr:    '#86EFAC',
  redBg:       '#FEF2F2',
  redText:     '#DC2626',
  redBdr:      '#FECACA',
  ink:         '#1e293b',
  muted:       '#64748b',
  subtle:      '#94a3b8',
  border:      '#E2E8F0',
  surface:     '#F8FAFC', // <--- Token adicionado para corrigir o erro
  white:       '#ffffff',
  bgLight:     '#F0F4F8',
};

// ─────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────
const IconArrowLeft = () => (
  <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
    <Polyline points="10,4 6,8 10,12" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconShare = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={18} cy={5} r={3} stroke="#fff" strokeWidth={2}/>
    <Circle cx={6} cy={12} r={3} stroke="#fff" strokeWidth={2}/>
    <Circle cx={18} cy={19} r={3} stroke="#fff" strokeWidth={2}/>
    <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} stroke="#fff" strokeWidth={2}/>
    <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} stroke="#fff" strokeWidth={2}/>
  </Svg>
);

const IconEyeTime = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Circle cx={8} cy={8} r={6} stroke={C.blue} strokeWidth={2}/>
    <Path d="M8 5v3l2 2" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function ProposalDetails() {
  const { id } = useLocalSearchParams();
  const [proposal, setProposal] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Acesso negado");

        const { data: proposalData, error: propError } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (propError) throw propError;
        setProposal(proposalData);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) setProfile(profileData);
      } catch (error: any) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const sendWhatsApp = () => {
    const nomeEmpresa = profile?.company_name || "Nossa Empresa";
    const nomeDono = profile?.owner_name || "Consultor";
    let message = `Olá, *${proposal?.client_name}*!\nSegue a proposta da *${nomeEmpresa}*:\n\n`;

    if (proposal?.items && proposal.items.length > 0) {
      proposal.items.forEach((item: any) => {
        message += `✔️ ${item.qty}x ${item.name} - R$ ${(item.price * item.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      message += '\n';
    }

    message += `*Valor Total:* R$ ${Number(proposal?.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    message += `🔗 Veja o detalhamento completo aqui: https://propoz.kemersoncardozo.workers.dev/view/${proposal.share_id || proposal.id}\n\n`;
    message += `Fico à disposição para qualquer dúvida!\nAtt, *${nomeDono}*`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'WhatsApp não instalado.'));
  };

  const copyLink = () => {
    const url = `https://propoz.kemersoncardozo.workers.dev/view/${proposal?.share_id || id}`;
    Clipboard.setString(url);
    Alert.alert('Link copiado', 'O link da proposta foi copiado para a área de transferência.');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  if (!proposal) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const isVisualizada = proposal?.status === 'visualizada';

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false}/>
      
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBox} activeOpacity={0.7}>
            <IconArrowLeft />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push(`/edit-proposal/${id}` as any)} style={styles.iconBox} activeOpacity={0.7}>
              <IconEdit />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBox} onPress={() => router.push(`/public/${id}` as any)} activeOpacity={0.7}>
              <IconShare />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerBottomRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.clientName} numberOfLines={1}>{proposal.client_name}</Text>
            <Text style={styles.createdDate}>Criada em {formatDate(proposal.created_at)}</Text>
          </View>
          <View style={styles.statusBadgeTop}>
            <Text style={styles.statusBadgeTextTop}>{proposal.status || 'Enviada'}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        
        {isVisualizada && (
          <View style={styles.viewedAlert}>
            <IconEyeTime />
            <View>
              <Text style={styles.viewedAlertTitle}>Aberta recentemente</Text>
              <Text style={styles.viewedAlertSub}>Hora de fazer o follow-up!</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>ITENS</Text>
        <View style={styles.itemsCard}>
          {proposal.items && proposal.items.length > 0 ? (
            proposal.items.map((item: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.qty} {item.unit} × R$ {Number(item.price).toLocaleString('pt-BR')}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {(item.price * item.qty).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 16 }}><Text style={{ color: C.muted, fontSize: 13 }}>Sem itens adicionados.</Text></View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {Number(proposal.value).toLocaleString('pt-BR')}</Text>
          </View>
        </View>

        <View style={styles.statusButtonsRow}>
          <TouchableOpacity 
            style={[styles.btnStatus, { backgroundColor: C.blue, flex: 2 }]} 
            onPress={sendWhatsApp}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnStatusText, { color: C.white }]}>Enviar para o cliente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
             style={[styles.btnStatus, { backgroundColor: 'transparent', borderColor: C.blue, borderWidth: 1, flex: 1.2 }]} 
             onPress={() => router.push(`/edit-proposal/${id}` as any)}
             activeOpacity={0.8}
          >
             <Text style={[styles.btnStatusText, { color: C.blue }]}>Editar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnGhost} onPress={copyLink} activeOpacity={0.8}>
          <Text style={styles.btnGhostText}>Copiar link da proposta</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  header: {
    backgroundColor: C.blue,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 24,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.white, marginLeft: 12, flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clientName: { fontSize: 18, fontWeight: '700', color: C.white },
  createdDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statusBadgeTop: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusBadgeTextTop: { fontSize: 11, fontWeight: '700', color: C.white, textTransform: 'uppercase' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },
  viewedAlert: {
    backgroundColor: C.blueBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewedAlertTitle: { fontSize: 13, fontWeight: '700', color: C.blueText },
  viewedAlertSub: { fontSize: 12, color: C.blueLink, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemsCard: { borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.white, paddingHorizontal: 14, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemName: { fontSize: 14, fontWeight: '600', color: C.ink },
  itemDesc: { fontSize: 12, color: C.muted, marginTop: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: C.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.ink },
  totalValue: { fontSize: 22, fontWeight: '800', color: C.blue },
  statusButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btnStatus: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnStatusText: { fontSize: 13, fontWeight: '700' },
  btnGhost: { width: '100%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnGhostText: { color: C.muted, fontSize: 14, fontWeight: '600' }
});