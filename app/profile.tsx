import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { C } from '../constants/colors';
import BottomNav from '../components/BottomNav';



// ─────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────
const IconBack = () => (
  <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
    <Polyline points="10,4 6,8 10,12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconCamera = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth={2}>
    <Rect x={3} y={3} width={18} height={18} rx={2}/>
    <Circle cx={8.5} cy={8.5} r={1.5}/>
    <Polyline points="21,15 16,10 5,21"/>
  </Svg>
);

const IconCheckCircle = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Circle cx={8} cy={8} r={7} stroke={C.greenText} strokeWidth={2}/>
    <Polyline points="5,8 7,10 11,6" stroke={C.greenText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);



// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setCompanyName(data.company_name || '');
        setOwnerName(data.owner_name || '');
        setPhone(data.phone || '');
        setCity(data.city || '');
      }
    } catch (error) {
      console.log('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        company_name: companyName,
        owner_name: ownerName,
        phone: phone,
        city: city,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      Alert.alert('Sucesso', 'Informações da empresa atualizadas!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace('/');
  }

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false}/>
      
      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtnBox} activeOpacity={0.7}>
            <IconBack />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Minha empresa</Text>
        </View>
        <Text style={s.headerSub}>Aparece em todas as suas propostas</Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={C.blue} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Logo Upload Placeholder */}
            <TouchableOpacity style={s.avatarUpload} activeOpacity={0.7} onPress={() => Alert.alert("Em Breve", "O upload de imagem estará disponível na próxima atualização.")}>
              <IconCamera />
              <Text style={s.avatarText}>Adicionar logo</Text>
            </TouchableOpacity>

            {/* Campos do Formulário */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Nome da empresa</Text>
              <TextInput 
                style={s.input} 
                value={companyName} 
                onChangeText={setCompanyName} 
                placeholder="Ex: Node Tech"
                placeholderTextColor={C.subtle}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Seu nome (Responsável)</Text>
              <TextInput 
                style={s.input} 
                value={ownerName} 
                onChangeText={setOwnerName} 
                placeholder="Ex: Kemerson"
                placeholderTextColor={C.subtle}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>WhatsApp de contato</Text>
              <TextInput 
                style={s.input} 
                value={phone} 
                onChangeText={setPhone} 
                placeholder="(51) 99999-9999"
                keyboardType="phone-pad"
                placeholderTextColor={C.subtle}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Cidade / UF</Text>
              <TextInput 
                style={s.input} 
                value={city} 
                onChangeText={setCity} 
                placeholder="Ex: Porto Alegre, RS"
                placeholderTextColor={C.subtle}
              />
            </View>

            {/* Aviso Info */}
            <View style={s.infoBox}>
              <IconCheckCircle />
              <Text style={s.infoText}>
                Essas informações aparecem no rodapé de todas as suas propostas.
              </Text>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity 
              style={[s.btnPrimary, saving && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryTxt}>Salvar e continuar</Text>}
            </TouchableOpacity>

            {/* Botão Sair */}
            <TouchableOpacity style={s.btnSignOut} onPress={handleSignOut}>
              <Text style={s.btnSignOutTxt}>Sair da conta</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  
  header: { 
    backgroundColor: C.blue, 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 24 
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtnBox: { 
    width: 32, height: 32, borderRadius: 8, 
    backgroundColor: C.blueA15, alignItems: 'center', justifyContent: 'center' 
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.white },
  headerSub: { fontSize: 13, color: C.white, opacity: 0.8, marginTop: 4 },

  body: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  avatarUpload: { 
    width: 100, height: 100, borderRadius: 20, 
    backgroundColor: C.blueBg, borderStyle: 'dashed', 
    borderWidth: 2, borderColor: '#93C5FD', 
    alignSelf: 'center', alignItems: 'center', 
    justifyContent: 'center', marginBottom: 24 
  },
  avatarText: { fontSize: 11, color: '#93C5FD', fontWeight: '600', marginTop: 4 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { 
    fontSize: 12, fontWeight: '700', color: C.muted, 
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 
  },
  input: { 
    backgroundColor: C.white, borderWidth: 1, 
    borderColor: C.border, borderRadius: 12, 
    paddingHorizontal: 14, paddingVertical: 12, 
    fontSize: 15, color: C.ink 
  },

  infoBox: { 
    backgroundColor: C.greenBg, borderWidth: 1, 
    borderColor: C.greenBdr, borderRadius: 12, 
    padding: 12, flexDirection: 'row', gap: 10, marginVertical: 8 
  },
  infoText: { flex: 1, fontSize: 12, color: C.greenText, lineHeight: 18 },

  btnPrimary: { 
    backgroundColor: C.blue, borderRadius: 12, 
    paddingVertical: 16, alignItems: 'center', 
    justifyContent: 'center', marginTop: 16 
  },
  btnPrimaryTxt: { color: C.white, fontSize: 16, fontWeight: '700' },

  btnSignOut: { marginTop: 24, alignSelf: 'center', padding: 8 },
  btnSignOutTxt: { color: '#DC2626', fontSize: 14, fontWeight: '600' },

});