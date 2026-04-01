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
import Svg, { Line, Path, Rect } from 'react-native-svg';
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
// ─────────────────────────────────────────
function fmtPrice(price: number): string {
  if (price === 0) return '—';
  return price % 1 === 0
    ? `R$ ${price.toLocaleString('pt-BR')}`
    : `R$ ${price.toFixed(2).replace('.', ',')}`;
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
        .single();

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
            <Text style={s.headerTitle}>Catálogo</Text>
            <Text style={s.headerSub}>Serviços agrupados por categoria</Text>
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
          <Text style={[s.emptyTxt, { fontSize: 12, marginTop: 6 }]}>
            Vá em Início &gt; "Minha Conta" &gt; "Categoria de Serviços" para selecionar suas categorias, ou adicione um novo serviço aqui na mesma categoria.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeaderTxt}>{section.title}</Text>
              <View style={s.sectionHeaderLine} />
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openEdit(item)} activeOpacity={0.75}>
              <View style={s.cardLeft}>
                <Text style={s.itemName}>{item.name}</Text>
                {!!item.description && (
                  <Text style={s.itemDesc} numberOfLines={1}>{item.description}</Text>
                )}
              </View>
              <View style={s.cardRight}>
                <Text style={s.currencyBadge}>{fmtPrice(item.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
          SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
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

  listContent:     { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  // Section headers
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionHeaderTxt:{ fontSize: 11, fontWeight: '900', color: C.inkDark, letterSpacing: 1.2, textTransform: 'uppercase', marginRight: 10 },
  sectionHeaderLine:{ flex: 1, height: 1, backgroundColor: C.borderDark },

  // Cards
  card:            { backgroundColor: C.white, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.borderDark },
  cardLeft:        { flex: 1, marginRight: 12 },
  itemName:        { fontSize: 14, fontWeight: '700', color: C.ink },
  itemDesc:        { fontSize: 11, color: C.muted, marginTop: 2 },
  cardRight:       { alignItems: 'flex-end' },
  currencyBadge:   { fontSize: 13, fontWeight: '800', color: C.blue, backgroundColor: C.blueBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  emptyBox:        { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:        { color: C.muted, fontSize: 14, textAlign: 'center' },

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