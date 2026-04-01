import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path } from 'react-native-svg';

const C = {
  blue: '#1A56DB', blueBg: '#EFF6FF', ink: '#1e293b', muted: '#64748b', white: '#fff', border: '#E2E8F0'
};

const areas = [
  { id: 'CFTV', title: 'CFTV', desc: 'Câmeras, DVR, NVR, cabeamento', icon: 'camera' },
  { id: 'Redes', title: 'Redes', desc: 'Switch, AP, cabeamento estruturado', icon: 'wifi' },
  { id: 'Automação', title: 'Automação', desc: 'Intelbras, residencial, central', icon: 'home' },
  { id: 'Outro', title: 'Outro', desc: 'Elétrica, interfone, personalizado', icon: 'plus' },
];

export default function OnboardingAreas() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.stepText}>Passo 1 de 2</Text>
        <Text style={s.title}>Qual é sua área?</Text>
        <Text style={s.subtitle}>Selecione uma ou mais áreas para carregar seus serviços</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {areas.map((item) => {
          const isSel = selected.includes(item.id);
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[s.option, isSel && s.optionSelected]} 
              onPress={() => toggle(item.id)}
              activeOpacity={0.8}
            >
              <View style={[s.iconBg, isSel && { backgroundColor: C.blue }]}>
                 <Text style={{fontSize: 20}}>{item.icon === 'camera' ? '📷' : item.icon === 'wifi' ? '🌐' : item.icon === 'home' ? '🏠' : '➕'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.optionTitle, isSel && { color: '#1e3a8a' }]}>{item.title}</Text>
                <Text style={[s.optionDesc, isSel && { color: '#3b82f6' }]}>{item.desc}</Text>
              </View>
              {isSel && (
                <View style={s.checkCircle}>
                  <Path d="M2,6 5,9 10,3" stroke="#fff" strokeWidth={2} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.btnPrimary, selected.length === 0 && { opacity: 0.5 }]} 
          disabled={selected.length === 0}
          onPress={() => router.push({ pathname: '/onboarding/setup-services', params: { areas: selected.join(',') } } as any)}
        >
          <Text style={s.btnText}>Continuar com {selected.length} {selected.length === 1 ? 'área' : 'áreas'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.blue, padding: 25, paddingTop: 40 },
  stepText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
  content: { padding: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, gap: 15 },
  optionSelected: { borderColor: C.blue, backgroundColor: C.blueBg, borderWidth: 2 },
  iconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  optionDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btnPrimary: { backgroundColor: C.blue, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});