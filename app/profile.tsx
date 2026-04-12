import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth={2}>
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

const IconEdit = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </Svg>
);



// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

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
        setLogoUrl(data.logo_url || null);
      }
    } catch (error) {
      console.log('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePickLogo() {
    try {
      // Solicita permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para adicionar o logo.');
        return;
      }

      // Abre a galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Erro', 'Não foi possível processar a imagem.');
        return;
      }

      if (!userId) return;

      setUploadingLogo(true);

      // Converte base64 → ArrayBuffer para o upload
      const base64 = asset.base64;
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      const fileName = `logo_${userId}_${Date.now()}.jpg`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, byteArray.buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.log('Erro upload:', uploadError);
        Alert.alert('Erro no upload', uploadError.message);
        return;
      }

      // Pega a URL pública
      const { data: publicUrlData } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Salva no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        Alert.alert('Erro', updateError.message);
        return;
      }

      setLogoUrl(publicUrl);
      Alert.alert('✅ Logo atualizado!', 'O logo da sua empresa foi salvo com sucesso.');
    } catch (error: any) {
      console.log('Erro ao fazer upload do logo:', error);
      Alert.alert('Erro', 'Não foi possível enviar o logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
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
            {/* Logo Upload */}
            <TouchableOpacity
              style={s.avatarUpload}
              activeOpacity={0.8}
              onPress={handlePickLogo}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <ActivityIndicator color="#93C5FD" />
              ) : logoUrl ? (
                <>
                  <Image source={{ uri: logoUrl }} style={s.logoImage} resizeMode="contain" />
                  {/* Botão editar sobreposto */}
                  <View style={s.editBadge}>
                    <IconEdit />
                  </View>
                </>
              ) : (
                <>
                  <IconCamera />
                  <Text style={s.avatarText}>Adicionar logo</Text>
                </>
              )}
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
    width: 110, height: 110, borderRadius: 20, 
    backgroundColor: C.blueBg, borderStyle: 'dashed', 
    borderWidth: 2, borderColor: '#93C5FD', 
    alignSelf: 'center', alignItems: 'center', 
    justifyContent: 'center', marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 18,
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: C.blue,
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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