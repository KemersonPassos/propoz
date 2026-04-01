import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function EditService() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadService() {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (data) {
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price.toString());
        setUnit(data.unit);
        setCategory(data.category);
      }
      setLoading(false);
    }
    loadService();
  }, [id]);

  async function handleUpdate() {
    setSaving(true);
    const { error } = await supabase.from('services')
      .update({
        name, description, 
        price: parseFloat(price.replace(',', '.')), 
        unit, category 
      })
      .eq('id', id);

    if (error) Alert.alert("Erro", error.message);
    else {
      Alert.alert("Sucesso", "Serviço atualizado!");
      router.back();
    }
    setSaving(false);
  }

  async function handleDelete() {
    Alert.alert("Excluir", "Deseja apagar este serviço do catálogo?", [
      { text: "Cancelar" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await supabase.from('services').delete().eq('id', id);
        router.back();
      }}
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1A56DB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.body}>
        <Text style={styles.title}>Editar Serviço</Text>
        
        <Text style={styles.label}>NOME</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>DESCRIÇÃO</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} />

        <Text style={styles.label}>PREÇO (R$)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

        <TouchableOpacity style={styles.btnSave} onPress={handleUpdate} disabled={saving}>
          <Text style={styles.btnSaveText}>{saving ? "Salvando..." : "Salvar Alterações"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
          <Text style={styles.btnDeleteText}>Excluir do Catálogo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#1e293b' },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#f8fafc' },
  btnSave: { backgroundColor: '#1A56DB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  btnSaveText: { color: '#fff', fontWeight: '700' },
  btnDelete: { marginTop: 20, padding: 10, alignItems: 'center' },
  btnDeleteText: { color: '#dc2626', fontWeight: '600' }
});