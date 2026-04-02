import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import ConfettiCannon from 'react-native-confetti-cannon';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import BottomNav from '../components/BottomNav';
import { C } from '../constants/colors';
import { supabase } from '../lib/supabase';



// ─────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────
const IconEye = () => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#fff" strokeWidth={2.2} />
    <Circle cx={12} cy={12} r={3} stroke="#fff" strokeWidth={2.2} />
  </Svg>
);

const IconPlus = ({ color = '#fff', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const IconArrow = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Polyline points="6,4 10,8 6,12" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconCheck = ({ color = C.green }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Polyline points="20,6 9,17 4,12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconSend = ({ color = C.subtle }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Line x1={22} y1={2} x2={11} y2={13} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Polygon points="22,2 15,22 11,13 2,9" stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);
const IconEyeSm = ({ color = C.blue }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={2} />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
  </Svg>
);
const IconLock = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2}>
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
    <Path d="M7 11V7a5 5 0 0110 0v4" />
  </Svg>
);
const IconClose = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={2.5}>
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);
const IconBriefcase = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={2} y={7} width={20} height={14} rx={2} ry={2} />
    <Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <Line x1={12} y1={12} x2={12} y2={12} />
  </Svg>
);
const IconPencil = ({ color = '#fff', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const IconTrash = ({ color = C.redText, size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
    <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </Svg>
);
const IconXSmall = ({ color = C.muted }: { color?: string }) => (
  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);
const IconSettings = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
    <Circle cx={12} cy={12} r={3} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);
const IconImage = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
    <Circle cx={8.5} cy={8.5} r={1.5} />
    <Polyline points="21 15 16 10 5 21" />
  </Svg>
);
const IconArchive = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2}>
    <Polyline points="21 8 21 21 3 21 3 8" />
    <Rect x={1} y={3} width={22} height={5} />
    <Line x1={10} y1={12} x2={14} y2={12} />
  </Svg>
);
const IconCheckCircle = ({ color = C.green }: { color?: string }) => (
  <View style={[s.checkCircle, { backgroundColor: color === C.green ? C.greenBg : '#F1F5F9' }]}>
    <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
      <Polyline points="2,6 5,9 10,3" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);



// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
}
function fmtCurrency(v: number): string {
  return v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.', ',')}k` : `R$${v}`;
}
function startOfMonth(): string {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function tagKey(status: string) {
  if (status === 'fechada') return 'green';
  if (status === 'visualizada') return 'blue';
  if (status === 'recusada') return 'red';
  if (status === 'aguardando') return 'orange';
  return 'gray';
}
function tagLabel(status: string): string {
  return ({ enviada: 'Enviada', visualizada: 'Visualizada', fechada: 'Aprovada', recusada: 'Recusada', aguardando: 'Aguardando' })[status] ?? 'Enviada';
}
function iconBg(status: string): string {
  if (status === 'fechada') return C.greenBg;
  if (status === 'visualizada') return C.blueBg;
  return C.surface;
}
function statusIcon(status: string) {
  if (status === 'fechada') return <IconCheck color={C.green} />;
  if (status === 'visualizada') return <IconEyeSm color={C.blue} />;
  return <IconSend color={C.subtle} />;
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function Home() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [lastViewed, setLastViewed] = useState<any>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsType, setDetailsType] = useState<'enviadas' | 'aguardando' | 'fechadas' | null>(null);
  const [totalCreated, setTotalCreated] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryServicesMap, setCategoryServicesMap] = useState<Record<string, { id: string; name: string; price: number }[]>>({});

  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [managingCategory, setManagingCategory] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [addingService, setAddingService] = useState(false);

  const openedRowRef = useRef<any>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const closeSwipeables = () => {
    if (openedRowRef.current) {
      openedRowRef.current.close();
      openedRowRef.current = null;
      setActiveSwipeId(null);
    }
  };

  const getFilteredProposals = () => {
    if (!detailsType) return [];
    if (detailsType === 'enviadas') return proposals; // já filtrado de excluídas/arquivadas no fetchData
    if (detailsType === 'aguardando') return proposals.filter(p => ['aguardando', 'visualizada'].includes(p.status));
    if (detailsType === 'fechadas') return proposals.filter(p => p.status === 'fechada');
    return [];
  };

  const filteredProposals = getFilteredProposals();

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');

      // CONSULTA DO PERFIL
      let { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (!prof) {
        // Se o banco não tem a linha do perfil ainda (erro PGRST116 na trigger), nós criamos agora:
        const { data: newProf } = await supabase.from('profiles').upsert({ id: user.id }).select('*').single();
        prof = newProf;
      }

      setProfile(prof);
      if (prof?.owner_name) setUserName(prof.owner_name.split(' ')[0]);
      else if (user.email) setUserName(user.email.split('@')[0]);

      // CONSULTA DE PROPOSTAS (apenas não arquivadas)
      const { data: rows } = await supabase
        .from('proposals').select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false) // FILTRO ADICIONADO AQUI
        .gte('created_at', startOfMonth())
        .order('created_at', { ascending: false });
      if (rows) setProposals(rows);

      // ÚLTIMA VISUALIZADA
      const { data: viewed } = await supabase
        .from('proposals').select('*')
        .eq('user_id', user.id)
        .eq('status', 'visualizada')
        .order('updated_at', { ascending: false }).limit(1).maybeSingle();
      setLastViewed(viewed ?? null);

      // TRUE TOTAL CRIADAS NO MÊS
      const { count } = await supabase
        .from('proposals').select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth());
      setTotalCreated(count || 0);

      // MAPA DE SERVIÇOS POR CATEGORIA (com id e preço)
      const { data: svcs } = await supabase
        .from('services')
        .select('id, name, price, category')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (svcs) {
        const map: Record<string, { id: string; name: string; price: number }[]> = {};
        svcs.forEach((svc: any) => {
          const key = (svc.category || 'GERAL').toUpperCase().trim();
          if (!map[key]) map[key] = [];
          map[key].push({ id: svc.id, name: svc.name, price: Number(svc.price) || 0 });
        });
        setCategoryServicesMap(map);
      }
    } catch (e: any) {
      console.log('home fetch error:', e.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Helper: re-fetch apenas o mapa de serviços (sem recarregar tudo) ──
  async function refreshServicesMap() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: svcs } = await supabase
        .from('services')
        .select('id, name, price, category')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (svcs) {
        const map: Record<string, { id: string; name: string; price: number }[]> = {};
        svcs.forEach((svc: any) => {
          const key = (svc.category || 'GERAL').toUpperCase().trim();
          if (!map[key]) map[key] = [];
          map[key].push({ id: svc.id, name: svc.name, price: Number(svc.price) || 0 });
        });
        setCategoryServicesMap(map);
      }
    } catch (e: any) {
      console.log('refreshServicesMap error:', e.message);
    }
  }

  async function handleAddService(catLabel: string) {
    const trimmed = newServiceName.trim();
    if (!trimmed) return;
    const parsedPrice = parseFloat(newServicePrice.replace(',', '.')) || 0;
    setAddingService(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('services').insert([{
        user_id: user.id,
        name: trimmed,
        category: catLabel,
        price: parsedPrice,
        is_active: true,
      }]);
      setNewServiceName('');
      setNewServicePrice('');
      await refreshServicesMap();
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível adicionar o serviço.');
    } finally {
      setAddingService(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('services').delete().eq('id', serviceId).eq('user_id', user.id);
      await refreshServicesMap();
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível remover o serviço.');
    }
  }

  const handleUploadLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Atenção', 'Você precisa dar permissão para acessar a galeria.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled) return;

    try {
      setUploadingLogo(true);
      const asset = pickerResult.assets[0];

      // Redimensionamento e Compressão Otimizada
      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: 'base64' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileName = `${user.id}-logo.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, decode(base64), { 
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);

      // Atualiza profiles com parâmetro de cache busting pra forçar atualização da imagem
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: finalUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, logo_url: finalUrl });
    } catch (e: any) {
      Alert.alert('Erro ao fazer upload', e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = async () => {
    setShowAccountModal(false);
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleArchive = async (id: string) => {
    const backup = proposals;
    setProposals(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('proposals').update({ is_archived: true }).eq('id', id);
    if (error) { setProposals(backup); Alert.alert('Erro', 'Não foi possível arquivar.'); }
  };

  const handleDelete = async (id: string) => {
    const backup = proposals;
    setProposals(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('proposals').update({ status: 'excluida', is_archived: true }).eq('id', id);
    if (error) { setProposals(backup); Alert.alert('Erro', 'Não foi possível excluir.'); }
  };

  const handleApprove = async (id: string) => {
    const backup = proposals;
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'fechada' } : p));
    const { error } = await supabase.from('proposals').update({ status: 'fechada' }).eq('id', id);
    if (error) {
      setProposals(backup);
      Alert.alert('Erro', 'Não foi possível aprovar.');
      return;
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const openOptions = (item: any) => {
    setSelectedProposal(item);
    setOptionsModalVisible(true);
    closeSwipeables();
  };

  const renderRightActions = (item: any) => (
    <TouchableOpacity style={s.swipeBtn} onPress={() => openOptions(item)} activeOpacity={0.8}>
      <IconSettings />
    </TouchableOpacity>
  );

  const total = proposals.length;
  const aguardando = proposals.filter(p => ['aguardando', 'enviada', 'visualizada'].includes(p.status)).length;
  const aprovadas = proposals.filter(p => p.status === 'fechada').length;
  const fechado = proposals.filter(p => p.status === 'fechada').reduce((s, p) => s + (Number(p.total_value ?? p.value) || 0), 0);
  const taxa = totalCreated > 0 ? Math.round((aprovadas / totalCreated) * 100) : 0;
  const restantes = Math.max(0, 5 - totalCreated);

  return (
    <TouchableWithoutFeedback onPress={closeSwipeables}>
      <GestureHandlerRootView style={s.container}>
        <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false} />

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greetLabel}>{greeting()}</Text>
              <Text style={s.greetName}>{userName || 'Técnico'}</Text>
            </View>
            <TouchableOpacity
              style={s.avatar}
              activeOpacity={0.7}
              onPress={() => setShowAccountModal(true)}
            >
              {profile?.logo_url ? (
                <Image source={{ uri: profile.logo_url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
              ) : (
                <Text style={s.avatarTxt}>{userName ? userName.substring(0, 1).toUpperCase() : 'U'}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={s.metricsRow}>
            <TouchableOpacity
              style={s.metricCard}
              activeOpacity={0.8}
              onPress={() => { setDetailsType('enviadas'); setDetailsModalVisible(true); }}
            >
              <Text style={s.metricVal}>{total}</Text>
              <Text style={s.metricLbl}>enviadas{'\n'}esse mês</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.metricCard}
              activeOpacity={0.8}
              onPress={() => { setDetailsType('aguardando'); setDetailsModalVisible(true); }}
            >
              <Text style={s.metricVal}>{aguardando}</Text>
              <Text style={s.metricLbl}>aguardando{'\n'}resposta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.metricCard, s.metricLast]}
              activeOpacity={0.8}
              onPress={() => { setDetailsType('fechadas'); setDetailsModalVisible(true); }}
            >
              <Text style={s.metricVal}>{fmtCurrency(fechado)}</Text>
              <Text style={s.metricLbl}>fechado{'\n'}no mês</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SCROLL ── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
          onScrollBeginDrag={closeSwipeables}
        >
          {lastViewed && (
            <TouchableOpacity style={s.alertCard} onPress={() => {
              if (activeSwipeId) { closeSwipeables(); return; }
              router.push(`/proposal/${lastViewed.id}` as any);
            }} activeOpacity={0.8}>
              <View style={s.alertIcon}><IconEye /></View>
              <View style={s.alertBody}>
                <Text style={s.alertTitle} numberOfLines={1}>{lastViewed.client_name} abriu sua proposta</Text>
                <Text style={s.alertSub}>há pouco · R$ {Number(lastViewed.total_value ?? lastViewed.value).toLocaleString('pt-BR')} · Hora de agir!</Text>
              </View>
              <IconArrow />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.btnPrimary} onPress={() => {
            if (activeSwipeId) { closeSwipeables(); return; }
            router.push('/new-proposal');
          }} activeOpacity={0.85}>
            <IconPlus color={C.white} size={18} />
            <Text style={s.btnPrimaryTxt}>Nova proposta</Text>
          </TouchableOpacity>

          <Text style={s.sectionLbl}>Recentes</Text>

          {loading && !refreshing ? (
            <ActivityIndicator color={C.blue} style={{ marginVertical: 24 }} />
          ) : proposals.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyTxt}>Nenhuma proposta este mês.</Text>
            </View>
          ) : (
            <View style={s.recentList}>
              {/* LIMITADO PARA EXIBIR APENAS AS 4 PRIMEIRAS */}
              {proposals.slice(0, 4).map(item => {
                const tk = tagKey(item.status);
                return (
                  <View key={item.id} style={s.swipeWrap}>
                    <Swipeable
                      ref={(ref) => { item.swipeableRef = ref; }}
                      onSwipeableWillOpen={() => {
                        if (openedRowRef.current && openedRowRef.current !== item.swipeableRef) {
                          openedRowRef.current.close();
                        }
                        openedRowRef.current = item.swipeableRef;
                        setActiveSwipeId(item.id);
                      }}
                      onSwipeableWillClose={() => {
                        if (openedRowRef.current === item.swipeableRef) {
                          setActiveSwipeId(null);
                          openedRowRef.current = null;
                        }
                      }}
                      renderRightActions={() => renderRightActions(item)}
                    >
                      <TouchableOpacity style={s.recentRow}
                        onPress={() => {
                          if (activeSwipeId && activeSwipeId !== item.id) {
                            closeSwipeables();
                            return;
                          }
                          router.push(`/proposal/${item.id}` as any);
                        }} activeOpacity={1}>
                        <View style={s.recentInner}>
                          <View style={[s.recentIconWrap, { backgroundColor: iconBg(item.status) }]}>
                            {statusIcon(item.status)}
                          </View>
                          <View style={s.recentInfo}>
                            <Text style={s.recentName} numberOfLines={1}>{item.client_name}</Text>
                            <Text style={s.recentMeta} numberOfLines={1}>
                              {item.service_type ?? 'Serviço'} · R$ {Number(item.total_value ?? item.value).toLocaleString('pt-BR')}
                            </Text>
                          </View>
                          <View style={[s.tag, s[`tag_${tk}` as keyof typeof s] as any]}>
                            <Text style={[s.tagTxt, s[`tagC_${tk}` as keyof typeof s] as any]}>{tagLabel(item.status)}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>
                  </View>
                );
              })}
            </View>
          )}

          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statLbl}>Taxa fechamento</Text>
              <Text style={s.statVal}>{taxa}%</Text>
              <Text style={s.statSub}>{aprovadas} de {totalCreated} propostas</Text>
            </View>
            <TouchableOpacity style={[s.statCard, s.statLast]} activeOpacity={0.7} onPress={() => router.push('/upgrade' as any)}>
              <Text style={s.statLbl}>Propostas restantes</Text>
              <Text style={[s.statVal, { color: C.orange }]}>
                {profile?.plan === 'pro' ? '∞' : restantes}<Text style={s.statSlash}> {profile?.plan === 'pro' ? '' : '/ 5'}</Text>
              </Text>
              <Text style={[s.statSub, { color: C.orange }]}>
                {profile?.plan === 'pro' ? 'Plano Pro Ativo' : 'Free · Fazer upgrade'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomNav active="home" />

        {/* ── MODAL MINHA CONTA (CONTA E PLANOS) ── */}
        <Modal
          visible={showAccountModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAccountModal(false)}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Minha Conta</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)} style={s.closeBtn}>
                <IconClose />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={s.accountBox}>
                <View style={[s.accountRow, { alignItems: 'center' }]}>
                  <TouchableOpacity 
                    style={[s.accountIconBg, { overflow: 'hidden', position: 'relative' }]} 
                    activeOpacity={0.7} 
                    onPress={handleUploadLogo}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <ActivityIndicator color={C.blue} />
                    ) : profile?.logo_url ? (
                      <Image source={{ uri: profile.logo_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                    <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', paddingVertical: 2, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>EDITAR</Text>
                    </View>
                  </TouchableOpacity>
                  <View>
                    <Text style={s.accountName}>{profile?.company_name || profile?.owner_name || 'Nome não definido'}</Text>
                    <Text style={s.accountEmail}>{userEmail}</Text>
                  </View>
                </View>
                <View style={s.divider} />

                <TouchableOpacity style={s.actionRow} onPress={async () => {
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
                    if (error) throw error;
                    Alert.alert('Sucesso', 'Link de redefinição enviado ao e-mail!');
                  } catch (e: any) {
                    Alert.alert('Erro', e.message || 'Não foi possível enviar o link.');
                  }
                }}>
                  <IconLock />
                  <Text style={s.actionRowText}>Alterar senha de acesso</Text>
                  <Text style={{ color: C.blue, fontWeight: '700' }}>Alterar</Text>
                </TouchableOpacity>

                <View style={[s.divider, { marginVertical: 14 }]} />

                <TouchableOpacity style={s.actionRow} onPress={handleUploadLogo} disabled={uploadingLogo}>
                  <IconImage />
                  <Text style={s.actionRowText}>Importar Logotipo</Text>
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color={C.blue} />
                  ) : (
                    <Text style={{ color: C.blue, fontWeight: '700' }}>Alterar</Text>
                  )}
                </TouchableOpacity>

                <View style={[s.divider, { marginVertical: 14 }]} />

                <TouchableOpacity
                  style={s.actionRow}
                  onPress={() => {
                    const current = profile?.service_category;
                    const parsed: string[] = Array.isArray(current)
                      ? current
                      : (typeof current === 'string' && current.length > 0)
                        ? current.split(',').map((c: string) => c.trim())
                        : [];
                    setSelectedCategories(parsed);
                    setCategoryModalVisible(true);
                  }}
                >
                  <IconBriefcase />
                  <Text style={s.actionRowText}>Categoria de Serviços</Text>
                  <Text style={{ color: C.blue, fontWeight: '700' }}>Alterar</Text>
                </TouchableOpacity>

                <View style={[s.divider, { marginVertical: 14 }]} />

                <TouchableOpacity style={s.actionRow} onPress={() => { setShowAccountModal(false); router.push('/archived' as any); }}>
                  <IconArchive />
                  <Text style={s.actionRowText}>Propostas Arquivadas</Text>
                  <IconArrow />
                </TouchableOpacity>
              </View>

              <Text style={s.sectionLblModal}>Seu Plano Atual</Text>

              {/* CARD PLANO FREE */}
              <View style={[s.planCard, profile?.plan === 'pro' && { opacity: 0.6 }]}>
                <Text style={s.planNameLabel}>Free</Text>
                <Text style={s.planPrice}>R$ 0<Text style={s.planPeriod}>/mês</Text></Text>
                <View style={s.featureList}>
                  <View style={s.featureRow}><IconCheckCircle color={C.subtle} /><Text style={s.featureTextDisabled}>5 propostas por mês</Text></View>
                  <View style={s.featureRow}><IconCheckCircle color={C.subtle} /><Text style={s.featureTextDisabled}>Sem rastreamento</Text></View>
                  <View style={s.featureRow}><IconCheckCircle color={C.subtle} /><Text style={s.featureTextDisabled}>Sem notificações</Text></View>
                </View>
              </View>

              {/* CARD PLANO PRO */}
              <View style={[s.planCard, s.planCardPro]}>
                <View style={s.recommendedBadge}><Text style={s.badgeText}>RECOMENDADO</Text></View>
                <Text style={s.planNameLabel}>Pro</Text>
                <Text style={[s.planPrice, { color: C.blue }]}>R$ 29<Text style={s.planPeriod}>/mês</Text></Text>
                <View style={s.featureList}>
                  <View style={s.featureRow}><IconCheckCircle /><Text style={s.featureText}>Propostas ilimitadas</Text></View>
                  <View style={s.featureRow}><IconCheckCircle /><Text style={s.featureText}>Rastreamento de abertura</Text></View>
                  <View style={s.featureRow}><IconCheckCircle /><Text style={s.featureText}>Notificação em tempo real</Text></View>
                  <View style={s.featureRow}><IconCheckCircle /><Text style={s.featureText}>Sugestão de follow-up</Text></View>
                  <View style={s.featureRow}><IconCheckCircle /><Text style={s.featureText}>Todos os templates</Text></View>
                </View>

                {profile?.plan !== 'pro' && (
                  <TouchableOpacity style={s.btnUpgrade} onPress={() => { setShowAccountModal(false); router.push('/upgrade' as any); }}>
                    <Text style={s.btnUpgradeTxt}>Assinar Pro — R$ 29/mês</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={s.btnLogOut} onPress={handleLogout}>
                <Text style={s.btnLogOutTxt}>Sair da conta</Text>
              </TouchableOpacity>
              <Text style={s.versionText}>Propoz v1.0.4 — Node Tech</Text>
            </ScrollView>
          </View>
        </Modal>

        {/* ── MODAL DETALHES DE ESTATÍSTICAS (BOTTOM SHEET) ── */}
        <Modal
          visible={detailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={s.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetailsModalVisible(false)} />
            <View style={s.bottomSheetContainer}>
              <View style={s.bottomSheetHeader}>
                <Text style={s.bottomSheetTitle}>
                  {detailsType === 'enviadas' ? 'Propostas Enviadas' :
                    detailsType === 'aguardando' ? 'Aguardando Resposta' :
                      'Orçamentos Fechados'}
                </Text>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={s.closeBtnSheet}>
                  <IconClose />
                </TouchableOpacity>
              </View>

              {detailsType === 'fechadas' && (
                <View style={s.summaryBox}>
                  <Text style={s.summaryLabel}>Total Fechado no Mês</Text>
                  <Text style={s.summaryValue}>
                    R$ {filteredProposals.reduce((sum, p) => sum + (Number(p.total_value ?? p.value) || 0), 0).toLocaleString('pt-BR')}
                  </Text>
                </View>
              )}

              <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {filteredProposals.length === 0 ? (
                  <Text style={s.emptyDetailsTxt}>Nenhuma proposta encontrada.</Text>
                ) : (
                  filteredProposals.map((item) => {
                    const val = Number(item.total_value ?? item.value) || 0;
                    const isFechada = item.status === 'fechada';
                    return (
                      <View key={item.id} style={s.detailRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.detailName} numberOfLines={1}>{item.client_name}</Text>
                          <Text style={s.detailStatus}>{tagLabel(item.status)}</Text>
                        </View>
                        <Text style={[s.detailValue, isFechada && { color: C.green, fontWeight: '800' }]}>
                          R$ {val.toLocaleString('pt-BR')}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── MODAL OPÇÕES DA PROPOSTA (BOTTOM SHEET) ── */}
        <Modal
          visible={optionsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setOptionsModalVisible(false)}
        >
          <View style={s.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOptionsModalVisible(false)} />
            <View style={[s.bottomSheetContainer, { minHeight: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, padding: 16 }]}>
              <View style={{ marginBottom: 16, alignItems: 'center' }}>
                <View style={{ width: 40, height: 4, backgroundColor: C.borderDark, borderRadius: 2 }} />
              </View>

              <TouchableOpacity style={s.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleApprove(selectedProposal.id); }}>
                <Text style={[s.optionText, { color: C.greenText }]}>Marcar aprovada</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) router.push(`/edit-proposal/${selectedProposal.id}` as any); }}>
                <Text style={s.optionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) router.push(`/public/${selectedProposal.id}` as any); }}>
                <Text style={s.optionText}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleArchive(selectedProposal.id); }}>
                <Text style={s.optionText}>Arquivar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.optionRow} onPress={() => { setOptionsModalVisible(false); if (selectedProposal) handleDelete(selectedProposal.id); }}>
                <Text style={[s.optionText, { color: C.redText }]}>Excluir</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: C.borderDark, marginVertical: 8 }} />

              <TouchableOpacity style={s.optionRow} onPress={() => setOptionsModalVisible(false)}>
                <Text style={[s.optionText, { color: '#94A3B8', textAlign: 'center', width: '100%' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── MODAL CATEGORIA DE SERVIÇOS (BOTTOM SHEET) ── */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={s.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setCategoryModalVisible(false)} />
            <View style={[s.bottomSheetContainer, { minHeight: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, padding: 24, maxHeight: '85%' }]}>
              <View style={s.bottomSheetHeader}>
                <Text style={s.bottomSheetTitle}>Categoria de Serviços</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={s.closeBtnSheet}>
                  <IconClose />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                  Selecione as categorias que melhor descrevem seus serviços.
                </Text>

                <View style={{ marginBottom: 28 }}>
                  {Array.from(new Set([
                    'CFTV', 'REDES', 'AUTOMAÇÃO', 'ELÉTRICA',
                    ...Object.keys(categoryServicesMap),
                    ...selectedCategories,
                    'CATEGORIA CUSTOMIZADA'
                  ])).map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    // normalise key for lookup: 'AUTOMAÇÃO' may be stored as 'AUTOMAÇÃO' or 'Automação' etc.
                    const mapKey = Object.keys(categoryServicesMap).find(
                      k => k.normalize('NFD').replace(/\p{Mn}/gu, '').toUpperCase() ===
                        cat.normalize('NFD').replace(/\p{Mn}/gu, '').toUpperCase()
                    );
                    const serviceNames: { id: string; name: string; price: number }[] = mapKey ? categoryServicesMap[mapKey] : [];
                    return (
                      <View key={cat} style={{ marginBottom: 10 }}>
                        {/* ── CATEGORY CHIP ROW (chip + edit pencil when selected) ── */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            activeOpacity={0.75}
                            style={[
                              s.categoryChip,
                              isSelected ? s.categoryChipSelected : s.categoryChipUnselected,
                            ]}
                            onPress={() => {
                              setSelectedCategories(prev =>
                                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                              );
                            }}
                          >
                            <Text style={[s.categoryChipTxt, isSelected ? s.categoryChipTxtSelected : s.categoryChipTxtUnselected]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>

                          {/* edit button — only visible when selected */}
                          {isSelected && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={s.catEditBtn}
                              onPress={() => {
                                setManagingCategory(cat);
                                setNewServiceName('');
                                setNewServicePrice('');
                                setManageModalVisible(true);
                              }}
                            >
                              <IconPencil color={C.blue} size={13} />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* ── SERVICE SUB-CHIPS with quick-delete × ── */}
                        {isSelected && serviceNames.length > 0 && (
                          <View style={s.serviceSubRow}>
                            {serviceNames.map((svc) => (
                              <View key={svc.id} style={s.serviceSubChip}>
                                <Text style={s.serviceSubChipTxt} numberOfLines={1}>{svc.name}</Text>
                                {svc.price > 0 && (
                                  <Text style={[s.serviceSubChipTxt, { color: C.blue, marginLeft: 4 }]}>
                                    · R${svc.price % 1 === 0 ? svc.price : svc.price.toFixed(2).replace('.', ',')}
                                  </Text>
                                )}
                                <TouchableOpacity
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  onPress={() => handleDeleteService(svc.id)}
                                  style={{ marginLeft: 5 }}
                                >
                                  <IconXSmall color={C.muted} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, { marginBottom: 0 }]}
                  onPress={async () => {
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return Alert.alert('Erro', 'Usuário não logado.');
                      const categoryValue = selectedCategories.join(', ');

                      // Se já tiver profile local, fazemos update. Senão, tenta update no ID do user.
                      const { error } = await supabase
                        .from('profiles')
                        .update({ service_category: categoryValue })
                        .eq('id', profile?.id || user.id);

                      if (error) throw error;

                      if (profile) setProfile({ ...profile, service_category: categoryValue });
                      setCategoryModalVisible(false);
                    } catch (e: any) {
                      console.log('Update category error:', e);
                      Alert.alert('Erro detalhado', e.message || JSON.stringify(e) || 'Não foi possível atualizar.');
                    }
                  }}
                >
                  <Text style={s.btnPrimaryTxt}>Salvar</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── MODAL GERENCIAR SERVIÇOS DA CATEGORIA (BOTTOM SHEET) ── */}
        <Modal
          visible={manageModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setManageModalVisible(false)}
        >
          <View style={s.bottomSheetOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setManageModalVisible(false)} />
            <View style={[s.bottomSheetContainer, { minHeight: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 24, padding: 24, maxHeight: '75%' }]}>
              {/* Header */}
              <View style={s.bottomSheetHeader}>
                <Text style={s.bottomSheetTitle}>Gerenciar {managingCategory}</Text>
                <TouchableOpacity onPress={() => setManageModalVisible(false)} style={s.closeBtnSheet}>
                  <IconClose />
                </TouchableOpacity>
              </View>

              {/* ── ADD INPUT ROW: name + price side-by-side ── */}
              <View style={{ marginBottom: 4 }}>
                <View style={s.svcInputRow}>
                  <TextInput
                    style={[s.svcInputField, { flex: 2 }]}
                    placeholder="Ex: Instalação de Câmera IP"
                    placeholderTextColor={C.subtle}
                    value={newServiceName}
                    onChangeText={setNewServiceName}
                    returnKeyType="next"
                  />
                  <TextInput
                    style={[s.svcInputField, { flex: 1 }]}
                    placeholder="Preço (R$)"
                    placeholderTextColor={C.subtle}
                    value={newServicePrice}
                    onChangeText={setNewServicePrice}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddService(managingCategory)}
                  />
                  <TouchableOpacity
                    style={s.svcAddBtn}
                    activeOpacity={0.8}
                    onPress={() => handleAddService(managingCategory)}
                    disabled={addingService}
                  >
                    {addingService
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <IconPlus color="#fff" size={18} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── SERVICE LIST ── */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                {(() => {
                  const mapKey = Object.keys(categoryServicesMap).find(
                    k => k.normalize('NFD').replace(/\p{Mn}/gu, '').toUpperCase() ===
                      managingCategory.normalize('NFD').replace(/\p{Mn}/gu, '').toUpperCase()
                  );
                  const items = mapKey ? categoryServicesMap[mapKey] : [];
                  if (items.length === 0) {
                    return (
                      <Text style={{ color: C.subtle, fontSize: 13, textAlign: 'center', marginTop: 20 }}>
                        Nenhum serviço cadastrado nesta categoria.
                      </Text>
                    );
                  }
                  return items.map((svc, idx) => (
                    <View key={svc.id} style={[s.svcListRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.svcListName} numberOfLines={1}>{svc.name}</Text>
                        {svc.price > 0 && (
                          <Text style={{ fontSize: 12, color: C.blue, fontWeight: '700', marginTop: 1 }}>
                            R$ {svc.price % 1 === 0
                              ? svc.price.toLocaleString('pt-BR')
                              : svc.price.toFixed(2).replace('.', ',')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={s.svcTrashBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          Alert.alert(
                            'Remover serviço',
                            `Deseja remover "${svc.name}"?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Remover', style: 'destructive', onPress: () => handleDeleteService(svc.id) },
                            ]
                          );
                        }}
                      >
                        <IconTrash color={C.redText} size={17} />
                      </TouchableOpacity>
                    </View>
                  ));
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {showConfetti && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
            <ConfettiCannon count={200} origin={{ x: Dimensions.get('window').width / 2, y: -20 }} fallSpeed={2500} autoStart={true} fadeOut={true} />
          </View>
        )}
      </GestureHandlerRootView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  header: { backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greetLabel: { fontSize: 11, color: C.blueA65, marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '700' },
  greetName: { fontSize: 22, fontWeight: '800', color: C.white },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.blueA20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.blueA20 },
  avatarTxt: { fontSize: 16, fontWeight: '800', color: C.white },
  metricsRow: { flexDirection: 'row' },
  metricCard: { flex: 1, backgroundColor: C.blueA12, borderRadius: 12, padding: 12, marginRight: 8 },
  metricLast: { marginRight: 0 },
  metricVal: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 4 },
  metricLbl: { fontSize: 11, color: C.blueA65, lineHeight: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.orangeBg, borderWidth: 1, borderColor: C.orangeBdr, borderRadius: 12, padding: 12, marginBottom: 16 },
  alertIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  alertBody: { flex: 1, marginRight: 6 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: C.orangeTitle },
  alertSub: { fontSize: 12, color: C.orangeSub, marginTop: 2 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue, borderRadius: 12, paddingVertical: 16, marginBottom: 20, elevation: 5 },
  btnPrimaryTxt: { fontSize: 16, fontWeight: '700', color: C.white, marginLeft: 8 },
  sectionLbl: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  recentList: { marginBottom: 16 },
  swipeWrap: { marginBottom: 8, overflow: 'hidden', borderRadius: 12 },
  recentRow: { borderWidth: 1, borderColor: C.borderDark, borderRadius: 12, backgroundColor: C.white },
  recentInner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  recentIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '700', color: C.ink },
  recentMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  tagTxt: { fontSize: 11, fontWeight: '700' },
  tag_blue: { backgroundColor: C.blueBg }, tagC_blue: { color: C.blueText },
  tag_green: { backgroundColor: C.greenBg }, tagC_green: { color: C.greenText },
  tag_gray: { backgroundColor: C.grayBg }, tagC_gray: { color: C.grayText },
  tag_orange: { backgroundColor: C.orangeBg }, tagC_orange: { color: C.orangeTitle },
  tag_red: { backgroundColor: C.redBg }, tagC_red: { color: C.redText },

  swipeBtn: { backgroundColor: C.blue, width: 65, height: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },

  statsRow: { flexDirection: 'row', marginTop: 8 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, marginRight: 8, borderWidth: 1, borderColor: C.borderDark },
  statLast: { marginRight: 0 },
  statLbl: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontWeight: '700' },
  statVal: { fontSize: 22, fontWeight: '800', color: C.ink },
  statSlash: { fontSize: 13, color: C.subtle, fontWeight: '500' },
  statSub: { fontSize: 11, color: C.muted, marginTop: 4 },


  // MODAL STYLES
  modalContent: { flex: 1, backgroundColor: C.bgLight, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  closeBtn: { padding: 4 },
  accountBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.borderDark, marginBottom: 30 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountIconBg: { width: 45, height: 45, borderRadius: 23, backgroundColor: C.blueBg, justifyContent: 'center', alignItems: 'center' },
  accountName: { fontSize: 16, fontWeight: '700', color: C.ink },
  accountEmail: { fontSize: 13, color: C.muted },
  divider: { height: 1, backgroundColor: C.borderDark, marginVertical: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRowText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: '600' },
  sectionLblModal: { fontSize: 11, fontWeight: '900', color: C.muted, textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },

  planCard: { padding: 20, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.borderDark, marginBottom: 15 },
  planCardPro: { backgroundColor: C.blueBg, borderColor: C.blue, borderWidth: 2, position: 'relative', marginTop: 10 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planNameLabel: { fontSize: 14, fontWeight: '700', color: C.muted, marginBottom: 5 },
  recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: C.blue, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  planPrice: { fontSize: 32, fontWeight: '900', color: C.ink },
  planPeriod: { fontSize: 14, fontWeight: '400', color: C.muted },
  featureList: { marginTop: 15, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: C.ink, fontWeight: '600' },
  featureTextDisabled: { fontSize: 14, color: C.subtle, fontWeight: '500' },
  btnUpgrade: { backgroundColor: C.blue, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnUpgradeTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnLogOut: { padding: 15, alignItems: 'center', marginTop: 10 },
  btnLogOutTxt: { color: C.redText, fontWeight: '700', fontSize: 15 },
  versionText: { textAlign: 'center', color: C.subtle, fontSize: 11, marginTop: 10, marginBottom: 30 },
  emptyWrap: { paddingVertical: 20, alignItems: 'center' },
  emptyTxt: { color: C.muted, fontSize: 14 },

  // MODAL DETALHES DE ESTATÍSTICAS (BOTTOM SHEET)
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContainer: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', minHeight: '50%' },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bottomSheetTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  closeBtnSheet: { padding: 4, backgroundColor: C.border, borderRadius: 20 },
  emptyDetailsTxt: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderDark },
  detailName: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 2 },
  detailStatus: { fontSize: 12, color: C.muted, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '600', color: C.ink },
  summaryBox: { backgroundColor: C.greenBg, padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: C.greenText, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: C.green },

  // OPÇÕES DO MODAL CUSTOMIZADO
  optionRow: { paddingVertical: 16, paddingHorizontal: 12 },
  optionText: { fontSize: 16, fontWeight: '600', color: C.ink },

  // CATEGORY CHIPS
  categoryChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  categoryChipSelected: { backgroundColor: C.blue, borderColor: C.blue },
  categoryChipUnselected: { backgroundColor: C.white, borderColor: C.borderDark },
  categoryChipTxt: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  categoryChipTxtSelected: { color: C.white },
  categoryChipTxtUnselected: { color: C.ink },

  // SERVICE SUB-CHIPS (hierarquia visual abaixo da categoria selecionada)
  serviceSubRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingLeft: 16 },
  serviceSubChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: C.borderDark },
  serviceSubChipTxt: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  // CATEGORY EDIT BTN
  catEditBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.blueBg, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },

  // MANAGE SERVICES MODAL
  svcInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  svcInputField: { flex: 1, borderWidth: 1, borderColor: C.borderDark, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.ink, backgroundColor: C.surface },
  svcAddBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  svcListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.borderDark },
  svcListName: { fontSize: 14, fontWeight: '600', color: C.ink },
  svcTrashBtn: { padding: 6, borderRadius: 8, backgroundColor: C.redBg },
});