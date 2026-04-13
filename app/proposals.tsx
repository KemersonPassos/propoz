import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect
} from 'react-native-svg';
import BottomNav from '../components/BottomNav';
import { C } from '../constants/colors';
import { supabase } from '../lib/supabase';

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

const IconLock = ({ color = C.muted, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
    <Path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);

const IconSettings = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
    <Circle cx={12} cy={12} r={3} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);

const IconClose = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.5}>
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
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
  const [profile, setProfile] = useState<any>(null);

  // Swipe / opções
  const openedRowRef = useRef<any>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  // Filtro
  const [filterMode, setFilterMode] = useState<'geral' | 'clients'>('geral');

  const closeSwipeables = () => {
    if (openedRowRef.current) {
      openedRowRef.current.close();
      openedRowRef.current = null;
      setActiveSwipeId(null);
    }
  };

  async function fetchProposals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca os dados do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setUserPlan(profileData.plan || 'free');
        setProfile(profileData);
      }

      // 2. Busca as propostas (não arquivadas)
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'excluida')
        .eq('is_archived', false)
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
    if (activeSwipeId) { closeSwipeables(); return; }
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

    router.push('/new-proposal' as any);
  };

  // ── Ações das propostas ──
  const handleArchive = async (id: string) => {
    const backup = proposals;
    setProposals(prev => prev.filter(p => p.id !== id));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProposals(backup); return; }
    const { error } = await supabase.from('proposals').update({ is_archived: true }).eq('id', id).eq('user_id', user.id);
    if (error) { setProposals(backup); Alert.alert('Erro', 'Não foi possível arquivar.'); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Excluir proposta',
      'Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive', onPress: async () => {
            const backup = proposals;
            setProposals(prev => prev.filter(p => p.id !== id));
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setProposals(backup); return; }
            const { error } = await supabase.from('proposals').update({ status: 'excluida', is_archived: true }).eq('id', id).eq('user_id', user.id);
            if (error) { setProposals(backup); Alert.alert('Erro', 'Não foi possível excluir.'); }
          }
        }
      ]
    );
  };

  const handleApprove = async (id: string) => {
    const backup = proposals;
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'fechada' } : p));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProposals(backup); return; }
    const { error } = await supabase.from('proposals').update({ status: 'fechada' }).eq('id', id).eq('user_id', user.id);
    if (error) { setProposals(backup); Alert.alert('Erro', 'Não foi possível aprovar.'); }
    else Alert.alert('🎉 Aprovada!', 'Proposta marcada como aprovada com sucesso.');
  };

  const openOptions = (item: any) => {
    setSelectedProposal(item);
    setOptionsModalVisible(true);
    closeSwipeables();
  };

  const renderRightActions = (item: any) => (
    <TouchableOpacity style={styles.swipeBtn} onPress={() => openOptions(item)} activeOpacity={0.8}>
      <IconSettings />
    </TouchableOpacity>
  );

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

  const getFollowUpStage = (item: any) => {
    const baseDate = item?.updated_at || item?.created_at;
    if (!baseDate) return { key: 'now', hoursSince: 0 };

    const diffMs = Date.now() - new Date(baseDate).getTime();
    const hoursSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

    if (hoursSince < 6) return { key: 'now', hoursSince };
    if (hoursSince < 24) return { key: 'today', hoursSince };
    if (hoursSince < 72) return { key: 'soon', hoursSince };
    return { key: 'late', hoursSince };
  };

  const getFollowUpMeta = (item: any) => {
    const { key, hoursSince } = getFollowUpStage(item);

    if (key === 'now') {
      return {
        alertText: 'Visualizada há pouco — aguarde um pouco antes de cobrar.',
        urgencyLabel: 'Aguardando momento ideal',
        suggestion:
          'Oi, tudo bem? Vi que você recebeu minha proposta 😊 Se quiser, te explico rapidamente os itens e as opções para avançarmos.',
        footerHint: 'Melhor janela: em algumas horas',
      };
    }

    if (key === 'today') {
      return {
        alertText: `Visualizada há ${hoursSince}h — bom momento para retomar.`,
        urgencyLabel: 'Cobrar hoje',
        suggestion:
          'Oi! Passando para saber se conseguiu analisar a proposta. Posso te ajudar com qualquer dúvida para facilitar sua decisão?',
        footerHint: 'Janela recomendada: agora',
      };
    }

    if (key === 'soon') {
      return {
        alertText: `Sem retorno há ${Math.floor(hoursSince / 24)} dia(s) — follow-up recomendado.`,
        urgencyLabel: 'Cobrar agora',
        suggestion:
          'Oi! Retomando nosso contato sobre a proposta. Se fizer sentido, posso ajustar algum item para encaixar melhor no que você precisa.',
        footerHint: 'Prioridade alta',
      };
    }

    return {
      alertText: `Sem retorno há ${Math.floor(hoursSince / 24)}+ dias — alto risco de esfriar.`,
      urgencyLabel: 'Urgente',
      suggestion:
        'Oi! Último lembrete sobre a proposta 😊 Ainda tenho disponibilidade para te atender. Quer que eu reserve essa condição para você?',
      footerHint: 'Ação imediata',
    };
  };

  const sendWhatsApp = (item: any) => {
    const nomeEmpresa = profile?.company_name || "Nossa Empresa";
    const nomeDono = profile?.owner_name || "Consultor";
    const isVisualizada = item?.status === 'visualizada';
    const followUp = getFollowUpMeta(item);

    let message = `Olá, *${item.client_name}*!\n`;

    if (isVisualizada) {
      message += `${followUp.suggestion}\n\n`;
    } else {
      message += `Segue a proposta da *${nomeEmpresa}*:\n\n`;
    }

    if (item.items && item.items.length > 0) {
      item.items.forEach((sub: any) => {
        message += `✔️ ${sub.qty}x ${sub.name} - R$ ${(sub.price * sub.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      });
      message += '\n';
    }

    message += `*Valor Total:* R$ ${Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    message += `🔗 Veja o detalhamento completo aqui: https://propoz.pages.dev/view/${item.share_id || item.id}\n\n`;
    message += `Fico à disposição para qualquer dúvida!\nAtt, *${nomeDono}*`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'WhatsApp não instalado.'));
  };

  return (
    <TouchableWithoutFeedback onPress={closeSwipeables}>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Minhas propostas</Text>
            <TouchableOpacity style={styles.btnNew} onPress={handleNewProposal} activeOpacity={0.8}>
              <Text style={styles.btnNewText}>+ Nova</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterBtn, filterMode === 'geral' && styles.filterBtnActive]}
              onPress={() => setFilterMode('geral')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnTxt, filterMode === 'geral' && styles.filterBtnTxtActive]}>Geral</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filterMode === 'clients' && styles.filterBtnActive]}
              onPress={() => setFilterMode('clients')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnTxt, filterMode === 'clients' && styles.filterBtnTxtActive]}>Por Cliente</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={proposals.length === 0 ? styles.emptyBodyContent : styles.bodyContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeSwipeables}
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
          ) : filterMode === 'clients' ? (
            <>
              {(() => {
                const grouped: Record<string, any[]> = {};
                proposals.forEach(p => {
                  const key = p.client_name || 'Sem nome';
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(p);
                });
                const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
                return sortedKeys.map(clientKey => (
                  <View key={clientKey} style={{ marginBottom: 20 }}>
                    <View style={styles.clientGroupHeader}>
                      <View style={styles.clientGroupAvatar}>
                        <Text style={styles.clientGroupAvatarTxt}>{clientKey.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.clientGroupName}>{clientKey}</Text>
                      <View style={styles.clientGroupBadge}>
                        <Text style={styles.clientGroupBadgeTxt}>{grouped[clientKey].length}</Text>
                      </View>
                    </View>
                    {grouped[clientKey].map((item) => {
                      const tagStyle = getTagStyle(item.status);
                      const isAprovada = item.status === 'fechada';
                      return (
                        <View key={item.id} style={styles.swipeWrap}>
                          <TouchableOpacity
                            style={styles.proposalCard}
                            onPress={() => {
                              if (activeSwipeId) { closeSwipeables(); return; }
                              router.push(`/proposal/${item.id}` as any);
                            }}
                            activeOpacity={0.9}
                          >
                            <View style={styles.proposalHead}>
                              <View style={styles.proposalTopRow}>
                                <Text style={styles.proposalClient} numberOfLines={1}>{item.client_name}</Text>
                                <View style={[styles.tag, tagStyle.bg]}>
                                  <Text style={[styles.tagText, tagStyle.text]}>{getStatusLabel(item.status)}</Text>
                                </View>
                              </View>
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
                            </View>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ));
              })()}
            </>
          ) : (
            <>
              {proposals.map((item) => {
                const tagStyle = getTagStyle(item.status);
                const isExpanded = expandedId === item.id;
                const isVisualizada = item.status === 'visualizada';
                const isAprovada = item.status === 'fechada';

                return (
                  <View key={item.id} style={styles.swipeWrap}>
                    <Swipeable
                      ref={(ref) => { item.swipeableRef = ref; }}
                      onSwipeableWillOpen={() => {
                        if (openedRowRef.current && openedRowRef.current !== item.swipeableRef) {
                          openedRowRef.current.close();
                        }
                        openedRowRef.current = item.swipeableRef;
                        setActiveSwipeId(item.id);
                        if (expandedId === item.id) {
                          setExpandedId(null);
                        }
                      }}
                      onSwipeableWillClose={() => {
                        if (openedRowRef.current === item.swipeableRef) {
                          setActiveSwipeId(null);
                          openedRowRef.current = null;
                        }
                      }}
                      renderRightActions={() => renderRightActions(item)}
                    >
                      <TouchableOpacity
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
                              {isVisualizada && userPlan === 'pro' && (
                                <View style={styles.followupAlert}>
                                  <IconClock color={C.blue} />
                                  <Text style={styles.followupAlertText}>{getFollowUpMeta(item).alertText}</Text>
                                </View>
                              )}
                              {isVisualizada && userPlan !== 'pro' && (
                                <TouchableOpacity style={[styles.followupAlert, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', borderWidth: 1, padding: 8, borderRadius: 8 }]} activeOpacity={0.8} onPress={() => router.push('/upgrade' as any)}>
                                  <IconLock color={C.muted} size={16} />
                                  <Text style={[styles.followupAlertText, { color: C.muted }]}>Alerta de visualização exclusivo PRO</Text>
                                </TouchableOpacity>
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

                              {userPlan === 'pro' ? (
                                <View style={styles.followupBox}>
                                  <Text style={styles.followupBoxTitle}>
                                    {getFollowUpMeta(item).urgencyLabel} · Sugestão de mensagem:
                                  </Text>
                                  <Text style={styles.followupBoxMsg}>{getFollowUpMeta(item).suggestion}</Text>
                                  <Text style={styles.followupHint}>{getFollowUpMeta(item).footerHint}</Text>
                                </View>
                              ) : (
                                <TouchableOpacity style={[styles.followupBox, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]} activeOpacity={0.9} onPress={() => router.push('/upgrade' as any)}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <IconLock color={C.muted} size={14} />
                                    <Text style={[styles.followupBoxTitle, { color: C.muted, marginBottom: 0 }]}>SUGESTÃO INTELIGENTE</Text>
                                  </View>
                                  <Text style={[styles.followupBoxMsg, { color: C.muted }]}>Assine o plano PRO para ter roteiros de mensagens exatos para fechamento.</Text>
                                </TouchableOpacity>
                              )}

                              <View style={styles.actionRow}>
                                <TouchableOpacity
                                  style={styles.btnSmGreen}
                                  activeOpacity={0.8}
                                  onPress={() => sendWhatsApp(item)}
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
                    </Swipeable>
                  </View>
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

        {/* ── MODAL DE OPÇÕES (BOTTOM SHEET) ── */}
        <Modal
          visible={optionsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setOptionsModalVisible(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOptionsModalVisible(false)} />
            <View style={[styles.bottomSheetContainer, { minHeight: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, padding: 16 }]}>
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2 }} />
              </View>

              <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleApprove(selectedProposal.id); }}>
                <Text style={[styles.optionText, { color: C.greenText }]}>Marcar aprovada</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) router.push(`/edit-proposal/${selectedProposal.id}` as any); }}>
                <Text style={styles.optionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => {
                setOptionsModalVisible(false);
                if (selectedProposal) {
                  const sId = selectedProposal.share_id || selectedProposal.id;
                  const total = Number(selectedProposal.total_value ?? selectedProposal.value) || 0;
                  Share.share({
                    message: `Olá! Segue a proposta de Node Tech para ${selectedProposal.client_name}.\n*Total: R$ ${total.toLocaleString('pt-BR')}*\n\nDetalhes aqui: https://propoz.pages.dev/view/${sId}`,
                  });
                }
              }}>
                <Text style={styles.optionText}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleArchive(selectedProposal.id); }}>
                <Text style={styles.optionText}>Arquivar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleDelete(selectedProposal.id); }}>
                <Text style={[styles.optionText, { color: C.redText }]}>Excluir</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />

              <TouchableOpacity style={styles.optionRow} onPress={() => setOptionsModalVisible(false)}>
                <Text style={[styles.optionText, { color: '#94A3B8', textAlign: 'center', width: '100%' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </GestureHandlerRootView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  header: { backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.white, letterSpacing: -0.5 },
  btnNew: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnNewText: { color: C.white, fontSize: 13, fontWeight: '600' },
  filterBar: { flexDirection: 'row', marginTop: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#fff' },
  filterBtnTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  filterBtnTxtActive: { color: C.blue },
  clientGroupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10, paddingHorizontal: 4 },
  clientGroupAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center' },
  clientGroupAvatarTxt: { fontSize: 13, fontWeight: '700', color: C.blue },
  clientGroupName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink },
  clientGroupBadge: { backgroundColor: C.blueBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  clientGroupBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.blue },
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

  // Swipe
  swipeWrap: { marginBottom: 12, overflow: 'hidden', borderRadius: 16 },
  swipeBtn: { backgroundColor: C.blue, width: 65, height: '100%', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },

  proposalCard: { borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.white, overflow: 'hidden' },
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
  followupHint: { marginTop: 6, fontSize: 11, color: C.blueText, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  btnSmGreen: { flex: 1, backgroundColor: C.greenWa, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnSmGreenText: { color: C.white, fontSize: 13, fontWeight: '700' },
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

  // Modal de opções
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContainer: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetClientName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  optionRow: { paddingVertical: 14, paddingHorizontal: 12 },
  optionText: { fontSize: 16, fontWeight: '600', color: C.ink },
});