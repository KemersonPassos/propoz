import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from '../../lib/supabase';

// Tokens de design Premium
const C = {
  blue: '#1A56DB',
  ink: '#1e293b',
  muted: '#64748b',
  borderLight: '#F1F5F9',
  bgLight: '#f4f6f8',
  greenWa: '#25D366',
  white: '#ffffff',
};

const NodeLogo = () => (
  <View style={s.logoContainer}>
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke="#fff" strokeWidth={2}/>
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  </View>
);

export default function ViewProposal() {
  const { shareId } = useLocalSearchParams();
  const [proposal, setProposal] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [approving, setApproving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      loadProposal();
    }
  }, [shareId]);

  async function loadProposal() {
    try {
      setLoading(true);
      
      const { data: propData, error: propError } = await supabase
        .from('proposals')
        .select('*')
        .or(`share_id.eq.${shareId},id.eq.${shareId}`)
        .single();

      if (propError || !propData) {
         setFetchError(propError?.message || "Erro desconhecido");
         throw propError || new Error("Proposta não encontrada");
      }
      
      const pureProposal = { ...propData };
      
      // Busca manual do perfil (fallback à falta de foreign key no supabase)
      if (pureProposal.user_id) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', pureProposal.user_id)
          .single();
        setVendor(profData || {});
      } else {
        setVendor({});
      }

      // Rastreamento (Tracking)
      if (pureProposal.status === 'aguardando' || pureProposal.status === 'enviada') {
        const { error: updateError } = await supabase
          .from('proposals')
          .update({ status: 'visualizada' })
          .eq('id', pureProposal.id);
        
        if (updateError) {
          console.error("ERRO NO UPDATE:", updateError);
        } else {
          pureProposal.status = 'visualizada';
        }
      }

      setProposal(pureProposal);

    } catch (error) {
      console.log('Erro ao carregar proposta (view):', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true);
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'fechada' })
        .eq('id', proposal.id);

      if (error) throw error;
      
      setProposal({ ...proposal, status: 'fechada' });
      setShowConfetti(true);
    } catch (e) {
      alert('Não foi possível aprovar a proposta. Tente novamente mais tarde.');
    } finally {
      setApproving(false);
    }
  };

  const handleWhatsApp = () => {
    const phoneToUse = vendor?.phone || vendor?.whatsapp;
    
    if (!phoneToUse) {
      alert('O consultor ainda não cadastrou um número de WhatsApp.');
      return;
    }
    
    const number = String(phoneToUse).replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Estou vendo a proposta e gostaria de tirar dúvidas ou falar com o consultor.`);
    
    Linking.openURL(`https://wa.me/55${number}?text=${message}`).catch(() => {
        alert('Não foi possível abrir o WhatsApp. Tente instalar o aplicativo.');
    });
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  if (!proposal) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ ...s.paperBrand, color: C.ink }}>Proposta não encontrada</Text>
        {fetchError && <Text style={{ color: 'red', marginTop: 10 }}>{fetchError}</Text>}
      </View>
    );
  }

  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const createdAt = proposal.created_at ? new Date(proposal.created_at).toLocaleDateString('pt-BR') : '';

  const hasExecution = proposal.execution_time && proposal.execution_time.trim() !== '';
  const hasWarranty = proposal.warranty && proposal.warranty.trim() !== '';
  const hasPayment = proposal.payment_method && proposal.payment_method.trim() !== '';
  const hasFooterValues = hasExecution || hasWarranty || hasPayment;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.blue} />
      
      <View style={s.blueHeader}>
        <Text style={s.previewTitleTop}>Proposta Comercial</Text>
      </View>

      <ScrollView style={s.scrollArea} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.proposalPaper}>
          <View style={s.paperHeader}>
            {vendor?.logo_url ? (
              <Image source={{ uri: vendor.logo_url }} style={s.logoContainer} />
            ) : (
              <NodeLogo />
            )}
            <View>
              <Text style={s.paperBrand}>{vendor?.company_name || vendor?.owner_name || 'Node Tech'}</Text>
              <Text style={s.paperSubBrand}>{vendor?.city || 'Segurança e Tecnologia'}</Text>
            </View>
          </View>

          <View style={s.paperGreeting}>
            <Text style={s.greetingTitle}>Olá, {proposal.client_name}!</Text>
            <Text style={s.greetingText}>Aqui está a proposta comercial para o seu projeto.</Text>
          </View>

          <View style={s.paperMetaRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.paperLabel}>DATA DA PROPOSTA</Text>
              <Text style={s.paperValue}>{createdAt}</Text>
            </View>
          </View>

          <View style={s.paperItems}>
            {items.map((item: any, idx: number) => (
              <View key={item.id || idx} style={s.paperItemLine}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.paperItemName}>{item.qty}x {item.name}</Text>
                </View>
                <Text style={s.paperItemPrice}>
                  R$ {((item.price || 0) * (item.qty || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>

          {proposal.notes && proposal.notes.trim() !== '' && (
            <View style={s.paperNotesBox}>
              <Text style={s.paperLabel}>OBSERVAÇÕES</Text>
              <Text style={s.paperNotesText}>{proposal.notes}</Text>
            </View>
          )}

          <View style={s.paperTotalRow}>
            <Text style={s.paperTotalLbl}>Total Geral</Text>
            <Text style={s.paperTotalVal}>
              R$ {(proposal.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {hasFooterValues && (
            <View style={s.paperFooterGrid}>
              <View style={s.gridRow}>
                {hasExecution && (
                  <View style={s.gridItem}>
                    <Text style={s.gridLbl}>Execução</Text>
                    <Text style={s.gridVal}>{proposal.execution_time}</Text>
                  </View>
                )}
                {hasWarranty && (
                  <View style={s.gridItem}>
                    <Text style={s.gridLbl}>Garantia</Text>
                    <Text style={s.gridVal}>{proposal.warranty}</Text>
                  </View>
                )}
              </View>
              {hasPayment && (
                <View style={[s.gridItem, { marginTop: 10 }]}>
                  <Text style={s.gridLbl}>Pagamento</Text>
                  <Text style={s.gridVal}>{proposal.payment_method}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={s.fixedFooter}>
        {proposal.status !== 'fechada' && (
          <TouchableOpacity 
            style={[s.btnSend, { backgroundColor: C.blue }]} 
            activeOpacity={0.8} 
            onPress={handleApprove}
            disabled={approving}
          >
            {approving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnSendTxt}>Aprovar Orçamento</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={proposal.status === 'fechada' ? s.btnSend : s.btnSendOutline} 
          activeOpacity={0.8} 
          onPress={handleWhatsApp}
        >
          <Text style={proposal.status === 'fechada' ? s.btnSendTxt : s.btnSendOutlineTxt}>
            Falar com Consultor
          </Text>
        </TouchableOpacity>
      </View>

      {showConfetti && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
          <ConfettiCannon 
            count={200} 
            origin={{ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height }} 
            autoStart={true}
            fadeOut={true}
            fallSpeed={3500}
            explosionSpeed={500}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgLight },
  blueHeader: { 
    backgroundColor: C.blue, 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  previewTitleTop: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollArea: { flex: 1, marginTop: -20 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  proposalPaper: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20
  },
  paperHeader: { backgroundColor: C.blue, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  paperBrand: { color: '#fff', fontSize: 17, fontWeight: '700' },
  paperSubBrand: { color: '#fff', fontSize: 11, opacity: 0.8 },
  paperGreeting: { padding: 20, paddingBottom: 0 },
  greetingTitle: { fontSize: 18, fontWeight: '800', color: C.ink, marginBottom: 4 },
  greetingText: { fontSize: 14, color: C.muted, lineHeight: 20 },
  paperMetaRow: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderColor: C.borderLight },
  paperLabel: { fontSize: 9, color: C.muted, fontWeight: '800', marginBottom: 4 },
  paperValue: { fontSize: 14, fontWeight: '700', color: C.ink },
  paperItems: { padding: 20 },
  paperItemLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  paperItemName: { fontSize: 14, color: C.ink, lineHeight: 20 },
  paperItemPrice: { fontSize: 14, fontWeight: '700', color: C.ink },
  paperNotesBox: { padding: 20, paddingTop: 0 },
  paperNotesText: { fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 20 },
  paperTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderColor: C.borderLight, backgroundColor: '#FAFAFA' },
  paperTotalLbl: { fontSize: 15, fontWeight: '600', color: C.ink },
  paperTotalVal: { fontSize: 19, fontWeight: '900', color: C.blue },
  paperFooterGrid: { flexDirection: 'column', backgroundColor: '#F9FAFB', padding: 15, borderTopWidth: 1, borderColor: C.borderLight },
  gridRow: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1 },
  gridLbl: { fontSize: 8, color: C.muted, fontWeight: '700', marginBottom: 2 },
  gridVal: { fontSize: 11, fontWeight: '700', color: C.ink },
  fixedFooter: { 
    padding: 16, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: C.borderLight, 
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    gap: 12
  },
  btnSend: { 
    backgroundColor: C.greenWa, 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  btnSendTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSendOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.greenWa,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  btnSendOutlineTxt: { color: C.greenWa, fontSize: 16, fontWeight: '700' }
});
