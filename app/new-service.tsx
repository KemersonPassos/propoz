import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function NewService() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('unidade'); // unidade, metro, hora, serviço
  const [category, setCategory] = useState('CFTV'); // CFTV, Redes, Automação
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name || !price) {
      Alert.alert('Atenção', 'Nome e preço são obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('services')
        .insert([
          {
            user_id: user.id,
            name,
            description,
            price: parseFloat(price.replace(',', '.')),
            unit,
            category,
            is_active: isActive
          }
        ]);

      if (error) throw error;

      Alert.alert('Sucesso', 'Serviço adicionado ao catálogo!');
      router.back(); // Volta para a aba de serviços automaticamente

    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo serviço</Text>
        <Text style={styles.headerSub}>Adicione ao seu catálogo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>NOME</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Câmera IP externa" 
          value={name}
          onChangeText={setName}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>DESCRIÇÃO</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: Instalação unitária" 
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>PREÇO (R$)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="120,00" 
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>UNIDADE</Text>
            {/* Como o React Native não tem <select> nativo simples, usamos um input provisório */}
            <TextInput 
              style={styles.input} 
              placeholder="Ex: unidade, metro..." 
              value={unit}
              onChangeText={setUnit}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <Text style={styles.label}>CATEGORIA</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: CFTV, Redes..." 
          value={category}
          onChangeText={setCategory}
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.switchCard}>
          <View>
            <Text style={styles.switchTitle}>Ativo no catálogo</Text>
            <Text style={styles.switchSub}>Aparece na criação de propostas</Text>
          </View>
          <Switch 
            value={isActive} 
            onValueChange={setIsActive}
            trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
            thumbColor={isActive ? '#1A56DB' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity 
          style={styles.btnPrimary} 
          onPress={handleSave} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Salvar serviço</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#1A56DB', padding: 20, paddingTop: 40, paddingBottom: 20 },
  backBtn: { marginBottom: 10 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  body: { padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, backgroundColor: '#f8fafc', color: '#1e293b' },
  row: { flexDirection: 'row' },
  switchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 16, marginTop: 24, marginBottom: 24 },
  switchTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  btnPrimary: { backgroundColor: '#1A56DB', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});