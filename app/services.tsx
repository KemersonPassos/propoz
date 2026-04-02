import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Line, Path, Rect, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';
import BottomNav from '../components/BottomNav';



// ─────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────
const IconPlus = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
    <Line x1={12} y1={5} x2={12} y2={19}/><Line x1={5} y1={12} x2={19} y2={12}/>
  </Svg>
);


// ─────────────────────────────────────────
// HELPERS
function fmtPrice(price: number): string {
  if (price === 0) return '—';
  return price % 1 === 0
    ? `R$ ${price.toLocaleString('pt-BR')}`
    : `R$ ${price.toFixed(2).replace('.', ',')}`;
}

function getServiceIcon(name: string, category: string) {
  const n = name.toLowerCase();
  if (n.includes('câmera') || n.includes('camera')) {
    return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Line x1={18} y1={2} x2={22} y2={6}/><Path d="M14.5 9.5L12 12M22 12h-4M6 12H2M12 2v4M12 18v4"/><Circle cx={12} cy={12} r={3}/></Svg>;
  }
  if (n.includes('dvr') || n.includes('nvr') || n.includes('gravador')) {
    return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Rect x={2} y={7} width={20} height={15} rx={2}/><Path d="M17 2L12 7L7 2"/></Svg>;
  }
  if (n.includes('cabo') || n.includes('cabeamento') || n.includes('metro')) {
    return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Line x1={5} y1={12} x2={19} y2={12}/></Svg>;
  }
  if (n.includes('wi-fi') || n.includes('wifi') || n.includes('access point') || n.includes('ap')) {
    return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Rect x={2} y={3} width={20} height={14} rx={2}/><Path d="M8 21h8M12 17v4"/></Svg>;
  }
  if (n.includes('switch') || n.includes('rede') || n.includes('ponto')) {
    return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Rect x={2} y={5} width={20} height={14} rx={2}/><Path d="M6 12h.01M10 12h.01M14 12h.018"/></Svg>;
  }
  
  const c = category.toUpperCase();
  if (c === 'CFTV') return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Circle cx={12} cy={12} r={3}/><Path d="M22 12h-4M6 12H2M12 2v4"/></Svg>;
  if (c === 'REDES') return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Rect x={2} y={3} width={20} height={14} rx={2}/><Path d="M8 21h8"/></Svg>;

  // Fallback icon tools
  return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}><Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Svg>;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface SectionData {
  title: string;
  data: ServiceItem[];
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function ServicesScreen() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [])
  );

  async function fetchServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch user profile (select * to avoid schema-cache misses on new columns)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) console.log('Profile fetch error in services:', profileError);

      let selectedCategories: string[] = [];
      const rawCats = profile?.service_category;
      if (rawCats && typeof rawCats === 'string' && rawCats.length > 0) {
        selectedCategories = rawCats
          .split(',')
          .map((c: string) => c.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
          .filter(Boolean);
      }

      console.log('Services screen — selected categories:', selectedCategories);

      // 2. Fetch all active services for this user
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
        .order('name');

      if (data) {
        const map: Record<string, ServiceItem[]> = {};
        const hasFilter = selectedCategories.length > 0;

        data.forEach((svc: any) => {
          const rawCat = (svc.category || 'GERAL');
          const normalizedCat = rawCat.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

          // If user has categories selected, filter. Otherwise show all.
          if (!hasFilter || selectedCategories.includes(normalizedCat)) {
            const displayKey = rawCat.trim().toUpperCase();
            if (!map[displayKey]) map[displayKey] = [];
            map[displayKey].push({
              id: svc.id,
              name: svc.name,
              price: Number(svc.price) || 0,
              category: rawCat,
              description: svc.description || '',
            });
          }
        });
        const sectionList: SectionData[] = Object.keys(map)
          .sort()
          .map(key => ({ title: key, data: map[key] }));
        setSections(sectionList);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !price) return Alert.alert('Ops', 'Preencha o nome e o preço.');

    if (!category) return Alert.alert('Ops', 'Preencha a categoria.');

    setSaving(true);
    const payload = {
      name,
      price: parseFloat(price.replace(',', '.')),
      category: category,
      description,
      is_active: true,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (id) {
        await supabase.from('services').update(payload).eq('id', id).eq('user_id', user.id);
      } else {
        await supabase.from('services').insert([{ ...payload, user_id: user.id }]);
      }
      setModalVisible(false);
      resetForm();
      fetchServices();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o serviço.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(serviceId: string) {
    Alert.alert('Excluir', 'Deseja remover este serviço do catálogo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('services').delete().eq('id', serviceId).eq('user_id', user.id);
            fetchServices();
          }
        }
      }
    ]);
  }

  const resetForm = () => {
    setId(null); setName(''); setPrice(''); setCategory(''); setDescription('');
  };

  const openEdit = (item: ServiceItem) => {
    setId(item.id);
    setName(item.name);
    setPrice(item.price > 0 ? item.price.toString() : '');
    setCategory(item.category || 'Geral');
    setDescription(item.description || '');
    setModalVisible(true);
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false}/>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
          <View>
            <Text style={s.headerTitle}>Meus serviços</Text>
            <Text style={s.headerSub}>Usados na criação de propostas</Text>
          </View>
          </View>
          <TouchableOpacity style={s.btnNew} onPress={() => { resetForm(); setModalVisible(true); }}>
            <IconPlus />
            <Text style={s.btnNewText}>Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SECTION LIST ── */}
      {loading ? (
        <ActivityIndicator color={C.blue} style={{ marginTop: 40 }} />
      ) : sections.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyTxt}>Seu catálogo está vazio para as categorias selecionadas no seu perfil.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.title} style={{ marginBottom: 14 }}>
              <Text style={s.sectionLabel}>{section.title}</Text>
              <View style={s.cardGroup}>
                {section.data.map((item, idx, arr) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[s.serviceRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]} 
                    onPress={() => openEdit(item)} 
                    activeOpacity={0.7}
                  >
                    <View style={s.serviceIconSm}>
                      {getServiceIcon(item.name, item.category)}
                    </View>
                    <View style={s.serviceInfo}>
                      <Text style={s.serviceName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.serviceDesc} numberOfLines={1}>{item.description || 'serviço'}</Text>
                    </View>
                    <View style={s.servicePriceBox}>
                      <Text style={s.servicePrice}>{fmtPrice(item.price)}</Text>
                      <Text style={s.serviceUnit}>/ unidade</Text>
                    </View>
                    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="#CBD5E1" strokeWidth={2} style={{ marginLeft: 8 }}>
                      <Path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <TouchableOpacity style={s.btnGhost} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Text style={s.btnGhostText}>+ Adicionar novo serviço</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── EDIT/NEW MODAL ── */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bgLight }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{id ? 'Editar Serviço' : 'Novo Serviço'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={s.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={s.label}>NOME DO SERVIÇO</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Câmera IP externa"
                placeholderTextColor={C.subtle}
              />

              <Text style={s.label}>DESCRIÇÃO CURTA</Text>
              <TextInput
                style={s.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: instalação unitária"
                placeholderTextColor={C.subtle}
              />

              <Text style={s.label}>PREÇO PADRÃO (R$)</Text>
              <TextInput
                style={s.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.subtle}
              />

              <Text style={s.label}>CATEGORIA</Text>
              <TextInput
                style={s.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Ex: CFTV, Redes..."
                placeholderTextColor={C.subtle}
                autoCapitalize="characters"
              />

              <TouchableOpacity style={s.btnSave} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnSaveTxt}>Salvar no Catálogo</Text>}
              </TouchableOpacity>

              {id && (
                <TouchableOpacity style={s.btnDel} onPress={() => handleDelete(id)}>
                  <Text style={s.btnDelTxt}>Excluir serviço</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNav active="services" />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bgLight },
  header:          { backgroundColor: C.blue, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingBottom: 24 },
  headerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:     { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  btnNew:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.blueA15, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
  btnNewText:      { color: '#fff', fontWeight: '700', fontSize: 14 },

  listContent:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionLabel:    { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 8, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardGroup:       { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, backgroundColor: C.white },
  serviceRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  serviceIconSm:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  serviceInfo:     { flex: 1, paddingRight: 8 },
  serviceName:     { fontSize: 13, fontWeight: '600', color: C.ink },
  serviceDesc:     { fontSize: 11, color: C.muted, marginTop: 1 },
  servicePriceBox: { alignItems: 'flex-end' },
  servicePrice:    { fontSize: 13, fontWeight: '600', color: C.blue },
  serviceUnit:     { fontSize: 10, color: C.muted, marginTop: 1 },
  emptyBox:        { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:        { color: C.muted, fontSize: 14, textAlign: 'center' },
  btnGhost:        { width: '100%', padding: 14, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', marginTop: 10 },
  btnGhostText:    { color: C.muted, fontSize: 13, fontWeight: '600' },

  // Modal
  modalHeader:     { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.borderDark },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: C.ink },
  cancelTxt:       { color: C.muted, fontWeight: '700' },
  label:           { fontSize: 11, fontWeight: '800', color: C.muted, marginBottom: 8, marginTop: 20, letterSpacing: 0.5 },
  input:           { backgroundColor: '#fff', borderWidth: 1, borderColor: C.borderDark, borderRadius: 12, padding: 14, fontSize: 16, color: C.ink },
  btnSave:         { backgroundColor: C.blue, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 30 },
  btnSaveTxt:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDel:          { padding: 16, alignItems: 'center', marginTop: 10 },
  btnDelTxt:       { color: C.redText, fontWeight: '600', fontSize: 14 },
});