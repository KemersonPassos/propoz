import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Rect, Line, Defs, ClipPath, Polygon } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const C = {
  blue: '#1A56DB', // Cor principal do HTML
  dark: '#0D1626', // Cor do texto 'propo'
  gray: '#94A3B8'  // Cor da tagline
};

// Logo idêntica à variação 'Fundo azul' do brandbook HTML
const LogoPropozOficialBlue = () => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {/* NOVO SVG COM RAIO (Fundo Azul) */}
      <Svg width={64} height={64} viewBox="0 0 56 56" fill="none">
        <Defs>
          <ClipPath id="B-bot"><Polygon points="20,6 48,6 48,44 20,44 20,29 41,23 20,23" /></ClipPath>
          <ClipPath id="B-top"><Polygon points="20,6 48,6 48,23 41,23 20,29 20,6" /></ClipPath>
          <ClipPath id="B-lin"><Polygon points="20,29 48,23 48,44 20,44" /></ClipPath>
        </Defs>
        
        {/* Folhas de trás */}
        <Rect x="7" y="14" width="26" height="32" rx="5" fill="rgba(255,255,255,0.15)"/>
        <Rect x="13" y="10" width="26" height="32" rx="5" fill="rgba(255,255,255,0.22)"/>
        
        {/* Folha da frente com recortes para o raio */}
        <Rect x="20" y="6" width="28" height="38" rx="5" fill="rgba(255,255,255,0.9)" clipPath="url(#B-bot)"/>
        <Rect x="20" y="6" width="28" height="38" rx="5" fill="rgba(255,255,255,0.9)" clipPath="url(#B-top)"/>
        
        {/* Linhas (itens do orçamento) */}
        <Line x1="26" y1="31" x2="43" y2="31" stroke="rgba(26,86,219,0.3)" strokeWidth="2" strokeLinecap="round" clipPath="url(#B-lin)"/>
        <Line x1="26" y1="36" x2="38" y2="36" stroke="rgba(26,86,219,0.3)" strokeWidth="2" strokeLinecap="round" clipPath="url(#B-lin)"/>
        
        {/* O Raio */}
        <Polygon points="37,3 25,27 34,27 22,53 45,22 36,22" fill="#1A56DB"/>
      </Svg>
      
      {/* WORDMARK */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ fontSize: 42, fontWeight: '700', color: '#ffffff', letterSpacing: -2 }}>propo</Text>
        <Text style={{ fontSize: 42, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: -2 }}>z</Text>
      </View>
    </View>
    
    {/* TAGLINE */}
    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '400', marginTop: 8, letterSpacing: 0.5 }}>
      propostas que fecham negócios
    </Text>
  </View>
);

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Função auxiliar para decidir para onde mandar o usuário logado
  async function checkOnboardingAndRedirect(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Se o perfil tem a flag, ou se já existem serviços salvos no banco, o onboarding acabou!
      if ((profile && profile.onboarding_completed) || (servicesCount && servicesCount > 0)) {
        router.replace('/home');
      } else {
        router.replace('/onboarding/areas');
      }
    } catch (e) {
      // Caso ocorra erro severo, manda para Onboarding
      router.replace('/onboarding/areas');
    }
  }

  // Função para Entrar
  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Erro', error.message);
    } else if (data.user) {
      // Checa o status do onboarding antes de entrar
      await checkOnboardingAndRedirect(data.user.id);
      setLoading(false);
    }
  }

  // Função para Criar Conta
  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Erro', error.message);
    } else if (data.user) {
      // Criar o perfil inicial manualmente caso a trigger do banco falhe ou não exista
      await supabase.from('profiles').upsert({
        id: data.user.id,
        onboarding_completed: false
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/onboarding/areas');
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar backgroundColor={C.blue} barStyle="light-content" translucent={false} />

      {/* CABEÇALHO AZUL NO TOPO (Estendido e com curvas) */}
      <View style={{
        height: 250, // Aumentado para segurar o logo
        backgroundColor: C.blue,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        justifyContent: 'center', // Centraliza o logo verticalmente
        alignItems: 'center', // Centraliza o logo horizontalmente
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
      }}>
        {/* LOGOTIPO BRANCO DENTRO DA ÁREA AZUL */}
        <LogoPropozOficialBlue />
      </View>

      {/* ÁREA BRANCA DO FORMULÁRIO */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>

        <Text style={styles.sectionLabel}>ENTRAR COM</Text>

        <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.7}>
          <Text style={styles.btnGoogleText}>G  Continuar com Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou use seu e-mail</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.inputField}
          placeholder="Seu e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.inputField}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity onPress={handleSignIn} disabled={loading} activeOpacity={0.8}>
          <View style={[styles.btnPrimary, loading && { opacity: 0.7 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Entrar</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.8} style={{ marginTop: 12 }}>
          <View style={styles.btnCreateAccount}>
            <Text style={styles.btnCreateAccountText}>Criar conta grátis</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 },
  btnGoogle: {
    width: '100%',
    backgroundColor: '#fff',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  btnGoogleText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 12, color: '#94a3b8', paddingHorizontal: 12 },
  inputField: {
    width: '100%',
    fontSize: 14,
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    color: '#1e293b',
    marginBottom: 12
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#1A56DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnCreateAccount: {
    width: '100%',
    padding: 15,
    borderColor: '#1A56DB',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  btnCreateAccountText: {
    color: '#1A56DB',
    fontSize: 15,
    fontWeight: '700'
  }
});