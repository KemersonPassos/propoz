import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  blue: '#1A56DB', 
  ink: '#1e293b', 
  muted: '#64748b', 
  subtle: '#94a3b8',
  border: '#E2E8F0', 
  blueBg: '#EFF6FF', 
  white: '#ffffff', 
  grayBg: '#F8FAFC'
};

const serviceTemplates = [
  { category: 'CFTV', name: 'Câmera IP externa', desc: 'Instalação unitária', price: '120' },
  { category: 'CFTV', name: 'DVR 8 canais', desc: 'Instalação + config', price: '280' },
  { category: 'CFTV', name: 'Cabeamento coaxial', desc: 'Por metro instalado', price: '8' },
  { category: 'Redes', name: 'Ponto de Rede Cat6', desc: 'Passagem + conectorização', price: '85' },
  { category: 'Redes', name: 'Configuração de Roteador', desc: 'Wi-Fi e Segurança', price: '150' },
  { category: 'Redes', name: 'Switch Gerenciável', desc: 'Configuração de VLANs', price: '300' },
  { category: 'Automação', name: 'Interruptor Inteligente', desc: 'Instalação em caixa 4x2', price: '90' },
  { category: 'Automação', name: 'Configuração de Hub/Central', desc: 'Pareamento de dispositivos', price: '200' },
];

const IconCheck = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function SetupServices() {
  const { areas } = useLocalSearchParams<{ areas: string }>();
  const selectedAreas = areas ? areas.split(',') : [];
  
  const [loading, setLoading] = useState(false);
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [customModalVisible, setCustomModalVisible] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCat, setCustomCat] = useState(selectedAreas[0] || 'Geral');

  useEffect(() => {
    const initialList = serviceTemplates
      .filter(s => selectedAreas.includes(s.category))
      .map((s, index) => ({ ...s, tempId: Date.now() + index, selected: true }));
    setLocalServices(initialList);
  }, []);

  const toggleSelect = (tempId: number) => {
    setLocalServices(prev => prev.map(s => s.tempId === tempId ? { ...s, selected: !s.selected } : s));
  };

  const updatePrice = (tempId: number, val: string) => {
    setLocalServices(prev => prev.map(s => s.tempId === tempId ? { ...s, price: val } : s));
  };

  const addCustomService = () => {
    if (!customName || !customPrice) return Alert.alert("Atenção", "Preencha o nome e o preço.");
    const newSvc = {
      tempId: Date.now(),
      category: customCat,
      name: customName,
      desc: customDesc || 'Serviço personalizado',
      price: customPrice,
      selected: true
    };
    setLocalServices(prev => [...prev, newSvc]);
    setCustomName(''); setCustomDesc(''); setCustomPrice(''); setCustomModalVisible(false);
  };

  const handleFinalize = async () => {
    const toInsert = localServices.filter(s => s.selected);
    if (toInsert.length === 0) return Alert.alert("Ops", "Selecione ao menos um serviço para começar.");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const finalData = toInsert.map(s => ({
        user_id: user.id,
        name: s.name,
        description: s.desc,
        price: parseFloat(s.price.replace(',', '.')) || 0,
        category: s.category,
        is_active: true
      }));

      // 1. Salva os serviços selecionados
      const { error: svcError } = await supabase.from('services').insert(finalData);
      if (svcError) throw svcError;

      // 2. Tenta marcar o onboarding como concluído no perfil
      const { error: profError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          service_category: selectedAreas.join(',')
        })
        .eq('id', user.id);

      // Se der erro aqui, é quase certeza que falta a Policy de UPDATE no Supabase
      if (profError) {
        console.error('Erro ao atualizar perfil:', profError.message);
        throw new Error("Não foi possível salvar seu progresso. Verifique a segurança do banco.");
      }

      // 3. Só redireciona se tudo der certo
      router.replace('/home');
    } catch (e: any) {
      Alert.alert("Erro ao finalizar", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar backgroundColor={C.blue} barStyle="light-content" />
        
        <View style={s.header}>
          <Text style={s.stepText}>Passo 2 de 2</Text>
          <Text style={s.title}>Seus serviços</Text>
          <Text style={s.subtitle}>Ajuste os preços e selecione o que você oferece</Text>
        </View>

        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {selectedAreas.map(area => (
            <View key={area} style={{ marginBottom: 25 }}>
              <Text style={s.categoryLabel}>{area.toUpperCase()}</Text>
              <View style={s.cardGroup}>
                {localServices.filter(s => s.category === area).map((svc, idx, arr) => (
                  <View key={svc.tempId} style={[s.svcRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                    <TouchableOpacity 
                      style={[s.checkbox, svc.selected && s.checkboxActive]} 
                      onPress={() => toggleSelect(svc.tempId)}
                    >
                      {svc.selected && <IconCheck />}
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1, opacity: svc.selected ? 1 : 0.4 }}>
                      <Text style={s.svcName}>{svc.name}</Text>
                      <Text style={s.svcDesc}>{svc.desc}</Text>
                    </View>

                    <View style={[s.priceInputWrap, !svc.selected && { opacity: 0.3 }]}>
                      <Text style={s.currency}>R$</Text>
                      <TextInput 
                        style={s.input} 
                        value={svc.price} 
                        onChangeText={(v) => updatePrice(svc.tempId, v)}
                        keyboardType="numeric"
                        editable={svc.selected}
                        selectTextOnFocus
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.btnGhost} onPress={() => setCustomModalVisible(true)}>
            <Text style={s.btnGhostText}>+ Adicionar serviço personalizado</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity 
            style={[s.btnPrimary, (loading || localServices.filter(s=>s.selected).length === 0) && { opacity: 0.6 }]} 
            onPress={handleFinalize}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Finalizar e Começar</Text>}
          </TouchableOpacity>
        </View>

        <Modal visible={customModalVisible} animationType="slide" transparent>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Novo Serviço</Text>
              
              <Text style={s.label}>NOME DO SERVIÇO</Text>
              <TextInput style={s.modalInput} value={customName} onChangeText={setCustomName} placeholder="Ex: Instalação de Fechadura" placeholderTextColor={C.subtle} />

              <Text style={s.label}>DESCRIÇÃO / OBSERVAÇÃO</Text>
              <TextInput style={s.modalInput} value={customDesc} onChangeText={setCustomDesc} placeholder="Ex: Inclui configuração no app" placeholderTextColor={C.subtle} />

              <Text style={s.label}>PREÇO (R$)</Text>
              <TextInput style={s.modalInput} value={customPrice} onChangeText={setCustomPrice} keyboardType="numeric" placeholder="0,00" placeholderTextColor={C.subtle} />

              <View style={s.modalActions}>
                <TouchableOpacity style={s.btnCancel} onPress={() => setCustomModalVisible(false)}>
                  <Text style={s.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnConfirm} onPress={addCustomService}>
                  <Text style={s.btnConfirmText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.blue, padding: 25, paddingTop: Platform.OS === 'ios' ? 20 : 40 },
  stepText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
  content: { padding: 20 },
  categoryLabel: { fontSize: 12, fontWeight: '800', color: C.muted, marginBottom: 10, letterSpacing: 1 },
  cardGroup: { borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', backgroundColor: '#fff' },
  svcRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.blue, borderColor: C.blue },
  svcName: { fontSize: 14, fontWeight: '700', color: C.ink },
  svcDesc: { fontSize: 11, color: C.muted, marginTop: 2 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 8 },
  currency: { fontSize: 11, color: C.muted, marginRight: 4 },
  input: { width: 55, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: C.blue, textAlign: 'right' },
  btnGhost: { width: '100%', padding: 15, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  btnGhostText: { color: C.muted, fontSize: 14, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btnPrimary: { backgroundColor: C.blue, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 8, marginTop: 15 },
  modalInput: { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 16, color: C.ink },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 30 },
  btnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  btnCancelText: { color: C.muted, fontWeight: '600' },
  btnConfirm: { flex: 1, backgroundColor: C.blue, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '700' }
});