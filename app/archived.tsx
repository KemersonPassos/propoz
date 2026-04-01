import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';

// ─────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────
const IconArrowLeft = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1={19} y1={12} x2={5} y2={12} stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="12 19 5 12 12 5" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconCheckRotate = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="3 3 3 8 8 8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconTrash = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconSend = ({ color=C.subtle }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Line x1={22} y1={2} x2={11} y2={13} stroke={color} strokeWidth={2} strokeLinecap="round"/>
    <Polygon points="22,2 15,22 11,13 2,9" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
  </Svg>
);
const IconEyeSm = ({ color=C.blue }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={2}/>
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2}/>
  </Svg>
);
const IconCheck = ({ color=C.green }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Polyline points="20,6 9,17 4,12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function tagKey(status: string) {
  if (status==='fechada') return 'green';
  if (status==='visualizada') return 'blue';
  if (status==='recusada') return 'red';
  if (status==='aguardando') return 'orange';
  return 'gray';
}
function tagLabel(status: string): string {
  return ({enviada:'Enviada',visualizada:'Visualizada',fechada:'Aprovada',recusada:'Recusada',aguardando:'Aguardando'})[status] ?? 'Enviada';
}
function iconBg(status: string): string {
  if (status==='fechada') return C.greenBg;
  if (status==='visualizada') return C.blueBg;
  return C.surface;
}
function statusIcon(status: string) {
  if (status==='fechada') return <IconCheck color={C.green}/>;
  if (status==='visualizada') return <IconEyeSm color={C.blue}/>;
  return <IconSend color={C.subtle}/>;
}

export default function ArchivedProposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const openedRowRef = useRef<any>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const closeSwipeables = () => {
    if (openedRowRef.current) {
      openedRowRef.current.close();
      openedRowRef.current = null;
      setActiveSwipeId(null);
    }
  };

  async function fetchArchivedProposals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        // .eq('is_deleted', false) <- Não incluído se hard delete for usado, 
        // mas adicionado caso exista, ignoramos se crashar?
        // Vou omitir pois home.tsx usa delete() na linha 250: await supabase.from('proposals').delete().eq('id', id);
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (e: any) {
      console.log('Error fetching archived proposals:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchArchivedProposals(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchArchivedProposals(); };

  const handleUnarchive = async (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('proposals').update({ is_archived: false }).eq('id', id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível desarquivar a proposta.');
      fetchArchivedProposals();
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Atenção', 'Tem certeza que deseja excluir esta proposta arquivada? Ela não poderá ser recuperada.', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          setProposals(prev => prev.filter(p => p.id !== id));
          const { error } = await supabase.from('proposals').delete().eq('id', id);
          if (error) {
            Alert.alert('Erro', 'Não foi possível excluir a proposta.');
            fetchArchivedProposals(); 
          }
        }
      }
    ]);
  };

  const renderRightActions = (item: any) => (
    <View style={s.swipeActionsContainer}>
      <TouchableOpacity style={s.swipeBtnUnarchive} onPress={() => handleUnarchive(item.id)} activeOpacity={0.8}>
        <IconCheckRotate />
      </TouchableOpacity>
      <TouchableOpacity style={s.swipeBtnDelete} onPress={() => handleDelete(item.id)} activeOpacity={0.8}>
        <IconTrash />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={closeSwipeables}>
      <GestureHandlerRootView style={s.container}>
        <StatusBar backgroundColor={C.white} barStyle="dark-content" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <IconArrowLeft />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Propostas Arquivadas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* LIST */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
        onScrollBeginDrag={closeSwipeables}
      >
        {loading && !refreshing ? (
          <ActivityIndicator color={C.blue} style={{ marginVertical: 40 }} />
        ) : proposals.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTxt}>Nenhuma proposta arquivada.</Text>
          </View>
        ) : (
          proposals.map(item => {
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
                  <View style={s.recentRow}>
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
                  </View>
                </Swipeable>
              </View>
            );
          })
        )}
      </ScrollView>
    </GestureHandlerRootView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 20,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderDark
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyTxt: { color: C.muted, fontSize: 14 },
  
  swipeWrap: { marginBottom: 12, overflow: 'hidden', borderRadius: 12 },
  recentRow: { borderWidth: 1, borderColor: C.borderDark, borderRadius: 12, backgroundColor: C.white },
  recentInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  recentIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 15, fontWeight: '700', color: C.ink },
  recentMeta: { fontSize: 13, color: C.muted, marginTop: 4 },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  tagTxt: { fontSize: 11, fontWeight: '700' },
  tag_blue: { backgroundColor: C.blueBg },    tagC_blue: { color: C.blueText },
  tag_green: { backgroundColor: C.greenBg },  tagC_green: { color: C.greenText },
  tag_gray: { backgroundColor: C.grayBg },    tagC_gray: { color: C.grayText },
  tag_orange: { backgroundColor: C.orangeBg },tagC_orange: { color: C.orangeTitle },
  tag_red: { backgroundColor: C.redBg },      tagC_red: { color: C.redText },

  swipeActionsContainer: { flexDirection: 'row', marginLeft: 10 },
  swipeBtnUnarchive: { backgroundColor: C.blue, width: 65, height: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  swipeBtnDelete: { backgroundColor: C.redText, width: 65, height: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
