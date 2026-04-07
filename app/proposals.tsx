import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect
} from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';
import BottomNav from '../components/BottomNav';

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



// ─────────────────────────────────────────
// ÍCONES SVG
// ─────────────────────────────────────────
const IconPlus = ({ color = '#fff', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const IconClock = ({ color = C.blue }) => (
  <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
    <Circle cx={8} cy={8} r={6} stroke={color} strokeWidth={2} />
    <Path d="M8 5v3l2 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconDoc = ({ size = 24, color = C.blue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1={16} y1={13} x2={8} y2={13} />
    <Line x1={16} y1={17} x2={8} y2={17} />
    <Line x1={10} y1={9} x2={8} y2={9} />
  </Svg>
);



// ─────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────

export default function ProposalsTab() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');

  async function fetchProposals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca o plano do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (profile) setUserPlan(profile.plan || 'free');

      // 2. Busca as propostas
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (proposalsData) setProposals(proposalsData);
    } catch (error: any) {
      console.log('Erro ao carregar:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchProposals();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProposals();
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleNewProposal = () => {
    if (userPlan !== 'pro') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const propostasEsteMes = proposals.filter(p => new Date(p.created_at) >= startOfMonth).length;

      if (propostasEsteMes >= 5) {
        Alert.alert(
          "Limite Atingido",
          "Você atingiu o limite de 5 propostas mensais do plano Free. Faça o upgrade para continuar enviando.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Ver Planos", onPress: () => router.push('/upgrade' as any) }
          ]
        );
        return;
      }
    }

    // Se passou na checagem ou é Pro, vai para a tela de criação
    router.push('/new-proposal' as any);
  };

  const totalEnviadas = proposals.length;
  const totalAprovadas = proposals.filter(p => p.status === 'fechada').length;
  const totalVisualizadas = proposals.filter(p => p.status === 'visualizada').length;

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      enviada: 'Enviada',
      visualizada: 'Visualizada',
      fechada: 'Aprovada',
      recusada: 'Recusada',
      aguardando: 'Aguardando',
    };
    return map[status] ?? 'Enviada';
  }

  function getTagStyle(status: string) {
    if (status === 'fechada') return { bg: styles.tagGreen, text: styles.tagTextGreen };
    if (status === 'visualizada') return { bg: styles.tagBlue, text: styles.tagTextBlue };
    if (status === 'recusada') return { bg: styles.tagRed, text: styles.tagTextRed };
    if (status === 'aguardando') return { bg: styles.tagOrange, text: styles.tagTextOrange };
    return { bg: styles.tagGray, text: styles.tagTextGray };
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Minhas propostas</Text>
          <TouchableOpacity style={styles.btnNew} onPress={handleNewProposal} activeOpacity={0.8}>
            <Text style={styles.btnNewText}>+ Nova</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={proposals.length === 0 ? styles.emptyBodyContent : styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator color={C.blue} style={{ marginVertical: 30 }} />
        ) : proposals.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCard}>
              <IconDoc size={32} />
            </View>
            <Text style={styles.emptyStateTitle}>Nenhuma proposta ainda</Text>
            <Text style={styles.emptyStateSub}>Crie sua primeira proposta em menos de 4 minutos e envie direto pelo WhatsApp.</Text>

            <View style={styles.howItWorksCard}>
              <Text style={styles.howItWorksTitle}>COMO FUNCIONA</Text>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumTxt}>1</Text></View>
                <Text style={styles.stepText}>Selecione os serviços do seu catálogo</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumTxt}>2</Text></View>
                <Text style={styles.stepText}>Digite o nome do cliente</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumTxt}>3</Text></View>
                <Text style={styles.stepText}>Envie pelo WhatsApp em 1 toque</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumTxt}>4</Text></View>
                <Text style={styles.stepText}>Saiba quando o cliente abriu e feche mais</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimaryLarge} onPress={handleNewProposal} activeOpacity={0.85}>
              <IconPlus color={C.white} size={20} />
              <Text style={styles.btnPrimaryLargeText}>Criar primeira proposta</Text>
            </TouchableOpacity>

            <View style={styles.freeAlert}>
              <IconClock color={C.blue} />
              <Text style={styles.freeAlertText}>Você tem <Text style={{ fontWeight: '700' }}>{userPlan === 'pro' ? 'propostas ilimitadas' : '5 propostas grátis'}</Text> este mês.</Text>
            </View>
          </View>
        ) : (
          <>
            {proposals.map((item) => {
              const tagStyle = getTagStyle(item.status);
              const isExpanded = expandedId === item.id;
              const isVisualizada = item.status === 'visualizada';
              const isAprovada = item.status === 'fechada';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.proposalCard, isExpanded && styles.proposalCardActive]}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.proposalHead}>
                    <View style={styles.proposalTopRow}>
                      <Text style={styles.proposalClient} numberOfLines={1}>{item.client_name}</Text>
                      <View style={[styles.tag, tagStyle.bg]}>
                        <Text style={[styles.tagText, tagStyle.text]}>{getStatusLabel(item.status)}</Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        {isVisualizada && (
                          <View style={styles.followupAlert}>
                            <IconClock color={C.blue} />
                            <Text style={styles.followupAlertText}>Aberta recentemente — agir agora!</Text>
                          </View>
                        )}

                        <View style={styles.detailsRow}>
                          <Text style={styles.detailsText}>💳 {item.payment_method || 'Pix / À vista'}</Text>
                          <Text style={styles.detailsText}>📅 Validade: {item.validity || '7 dias'}</Text>
                        </View>

                        <View style={styles.itemsList}>
                          <Text style={styles.itemsTitle}>ITENS COBRADOS:</Text>
                          {item.items?.map((sub: any, i: number) => (
                            <View key={i} style={styles.itemLine}>
                              <Text style={styles.itemLineName}>{sub.qty}x {sub.name}</Text>
                              <Text style={styles.itemLinePrice}>R$ {(sub.price * sub.qty).toLocaleString('pt-BR')}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.followupBox}>
                          <Text style={styles.followupBoxTitle}>Sugestão de mensagem:</Text>
                          <Text style={styles.followupBoxMsg}>"Oi, vi que você recebeu minha proposta. Posso tirar alguma dúvida sobre os serviços?"</Text>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.btnSmGreen}
                            activeOpacity={0.8}
                            onPress={() => Linking.openURL(`whatsapp://send?text=Olá, ${item.client_name}!`)}
                          >
                            <Text style={styles.btnSmGreenText}>Enviar no WhatsApp</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {!isExpanded && (
                      <View style={styles.proposalBottomRow}>
                        <Text style={styles.proposalMeta} numberOfLines={1}>
                          <Text style={styles.totalValueGreenList}>
                            R$ {Number(item.value).toLocaleString('pt-BR')}
                          </Text>
                          <Text style={{ color: C.subtle }}> · {item.service_type ?? 'Serviço'}</Text>
                        </Text>
                        <Text style={styles.proposalStatusSub}>
                          {isAprovada ? <Text style={{ color: C.greenText, fontWeight: '600' }}>Fechado!</Text> : 'há pouco'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {isExpanded && (
                    <View style={styles.proposalFoot}>
                      <Text style={styles.footTextMain}>
                        <Text style={styles.totalLabel}>Total: </Text>
                        <Text style={styles.totalValueGreen}>
                          R$ {Number(item.value).toLocaleString('pt-BR')}
                        </Text>
                      </Text>
                      <Text style={styles.footTextSub}>vence em 6 dias</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          </>
        )}
      </ScrollView>

      {/* ── RODAPÉ FIXO (INDICADORES) ── */}
      <View style={styles.metricsFooter}>
        <View style={styles.metricFooterItem}>
          <Text style={styles.metricFooterVal}>{totalEnviadas}</Text>
          <Text style={styles.metricFooterLbl}>enviadas</Text>
        </View>
        <View style={styles.metricFooterDivider} />
        <View style={styles.metricFooterItem}>
          <Text style={[styles.metricFooterVal, { color: C.blue }]}>{totalVisualizadas}</Text>
          <Text style={styles.metricFooterLbl}>visualizadas</Text>
        </View>
        <View style={styles.metricFooterDivider} />
        <View style={styles.metricFooterItem}>
          <Text style={[styles.metricFooterVal, { color: C.greenText }]}>{totalAprovadas}</Text>
          <Text style={styles.metricFooterLbl}>aprovadas</Text>
        </View>
      </View>

      <BottomNav active="proposals" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  header: { backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.white, letterSpacing: -0.5 },
  btnNew: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnNewText: { color: C.white, fontSize: 13, fontWeight: '600' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },
  emptyBodyContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  emptyStateContainer: { alignItems: 'center', paddingBottom: 40 },
  emptyIconCard: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: '800', color: C.ink, marginBottom: 8 },
  emptyStateSub: { fontSize: 14, color: C.muted, lineHeight: 22, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  howItWorksCard: { width: '100%', backgroundColor: C.white, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  howItWorksTitle: { fontSize: 11, fontWeight: '900', color: C.muted, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { color: C.white, fontSize: 11, fontWeight: '800' },
  stepText: { fontSize: 13, color: '#475569', fontWeight: '600', flex: 1 },
  btnPrimaryLarge: { width: '100%', backgroundColor: C.blue, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: C.blue, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnPrimaryLargeText: { color: C.white, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  freeAlert: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, backgroundColor: C.blueBg, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, width: '100%' },
  freeAlertText: { fontSize: 12, color: C.blue, fontWeight: '500' },
  proposalCard: { borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.white, marginBottom: 12, overflow: 'hidden' },
  proposalCardActive: { borderWidth: 2, borderColor: C.blue, elevation: 4 },
  proposalHead: { paddingVertical: 14, paddingHorizontal: 16 },
  proposalTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  proposalClient: { fontSize: 16, fontWeight: '700', color: C.ink, flex: 1, paddingRight: 10 },
  expandedContent: { marginTop: 4 },
  followupAlert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  followupAlertText: { fontSize: 12, color: C.blue, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, backgroundColor: C.surface, padding: 8, borderRadius: 8 },
  detailsText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  itemsList: { marginBottom: 12, borderTopWidth: 1, borderTopColor: C.bgLight, paddingTop: 10 },
  itemsTitle: { fontSize: 10, fontWeight: '800', color: C.muted, marginBottom: 8, textTransform: 'uppercase' },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemLineName: { fontSize: 13, color: C.ink, flex: 1 },
  itemLinePrice: { fontSize: 13, fontWeight: '700', color: C.ink },
  followupBox: { backgroundColor: C.blueBg, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  followupBoxTitle: { fontWeight: '700', color: C.blueText, fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  followupBoxMsg: { color: C.blueLink, fontSize: 12, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  btnSmGreen: { flex: 1, backgroundColor: C.greenWa, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnSmGreenText: { color: C.white, fontSize: 13, fontWeight: '700' },
  btnSmOutline: { flex: 1, backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBdr, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnSmOutlineText: { color: C.greenText, fontSize: 13, fontWeight: '700' },
  proposalBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proposalMeta: { fontSize: 14 },
  totalValueGreenList: { color: C.greenText, fontWeight: '700' },
  proposalStatusSub: { fontSize: 12, color: C.subtle },
  proposalFoot: { backgroundColor: C.blueBg, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footTextMain: { fontSize: 13, flex: 1 },
  totalLabel: { color: C.blueText, fontWeight: '600' },
  totalValueGreen: { color: C.greenText, fontWeight: '800', fontSize: 15 },
  footTextSub: { fontSize: 12, color: C.blueLink, fontWeight: '600' },
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tagBlue: { backgroundColor: C.blueBg }, tagTextBlue: { color: C.blueText },
  tagGreen: { backgroundColor: C.greenBg }, tagTextGreen: { color: C.greenText },
  tagGray: { backgroundColor: C.bgLight }, tagTextGray: { color: C.muted },
  tagOrange: { backgroundColor: C.orangeBg }, tagTextOrange: { color: C.orange },
  tagRed: { backgroundColor: C.bgLight }, tagTextRed: { color: C.muted },
  metricsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  metricFooterItem: { alignItems: 'center', flex: 1 },
  metricFooterVal: { fontSize: 22, fontWeight: '700', color: C.ink },
  metricFooterLbl: { fontSize: 10, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricFooterDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 5 },
});