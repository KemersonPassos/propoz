import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, SafeAreaView, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function EditProposal() {
  const { id } = useLocalSearchParams();
  const [clientName, setClientName] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Busca o catálogo
        const { data: cat } = await supabase.from('services').select('*').eq('is_active', true);
        setServices(cat || []);

        // 2. Busca a proposta atual
        const { data: prop, error } = await supabase.from('proposals').select('*').eq('id', id).single();
        if (error) throw error;

        setClientName(prop.client_name);
        
        // 3. Reconstrói o estado dos itens selecionados
        if (prop?.items) {
          const initialItems: Record<string, any> = {};
          prop.items.forEach((item: any) => {
            initialItems[item.id] = item;
          });
          setSelectedItems(initialItems);
        }

      } catch (error: any) {
        Alert.alert("Erro", "Não foi possível carregar a proposta.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const updateQuantity = (service: any, amount: number) => {
    setSelectedItems((prev: any) => {
      const currentQty = prev[service.id]?.qty || 0;
      const newQty = Math.max(0, currentQty + amount);
      if (newQty === 0) {
        const newState = { ...prev };
        delete newState[service.id];
        return newState;
      }
      return { ...prev, [service.id]: { ...service, qty: newQty } };
    });
  };

  const calculateTotal = () => {
    return Object.values(selectedItems).reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
  };

  async function handleUpdate() {
    if (!clientName.trim() || calculateTotal() === 0) {
      Alert.alert("Atenção", "Preencha o nome e selecione ao menos um item.");
      return;
    }

    setSaving(true);
    try {
      const itemsArray = Object.values(selectedItems);
      const mainService: any = itemsArray.reduce((prev: any, curr: any) => 
        (prev.price * prev.qty > curr.price * curr.qty) ? prev : curr
      );

      const { error } = await supabase
        .from('proposals')
        .update({
          client_name: clientName,
          items: itemsArray,
          value: calculateTotal(),
          service_type: `${mainService.category} · ${itemsArray.length} itens`
        })
        .eq('id', id);

      if (error) throw error;
      Alert.alert("Sucesso", "Orçamento atualizado!");
      router.replace(`/proposal/${id}` as any);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1A56DB" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar Orçamento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>CLIENTE</Text>
        <TextInput style={styles.input} value={clientName} onChangeText={setClientName} />

        <Text style={styles.label}>ITENS DO CATÁLOGO</Text>
        {services.map((item) => {
          const qty = selectedItems[item.id]?.qty || 0;
          return (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>R$ {item.price}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(item, -1)}><Text>-</Text></TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity style={[styles.stepBtn, {backgroundColor: '#1A56DB'}]} onPress={() => updateQuantity(item, 1)}><Text style={{color:'#fff'}}>+</Text></TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL ATUALIZADO</Text>
          <Text style={styles.totalValue}>R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSaveText}>Salvar Alterações</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#1A56DB', padding: 20, paddingTop: 40, paddingBottom: 20 },
  backBtn: { marginBottom: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  body: { padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, marginBottom: 20, backgroundColor: '#fff' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemPrice: { fontSize: 12, color: '#1A56DB' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', justifyContent: 'center', alignItems: 'center' },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  totalBox: { backgroundColor: '#DCFCE7', padding: 16, borderRadius: 12, marginTop: 20, marginBottom: 24 },
  totalLabel: { fontSize: 10, fontWeight: '700', color: '#166534' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#15803d' },
  btnSave: { backgroundColor: '#1A56DB', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});