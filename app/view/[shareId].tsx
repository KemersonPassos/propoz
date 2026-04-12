import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import * as Print from 'expo-print';
import { supabase } from '../../lib/supabase';
import { generateProposalPdfHtml } from '../../lib/pdfTemplate';

// Tokens
const C = {
  blue: '#1A56DB',
  blueDk: '#1344B0',
  blueLt: '#93C5FD',
  navy: '#0D1626',
  green: '#25D366',
  greenDk: '#1DA851',
  ink: '#1E293B',
  slate: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  bg: '#F8FAFC',
};

// SVG Components from HTML
const IconCalendar = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2}>
    <Rect x={3} y={4} width={18} height={18} rx={2} />
    <Line x1={16} y1={2} x2={16} y2={6} />
    <Line x1={8} y1={2} x2={8} y2={6} />
    <Line x1={3} y1={10} x2={21} y2={10} />
  </Svg>
);

const IconClock = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2}>
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12,6 12,12 16,14" />
  </Svg>
);

const IconObs = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2}>
    <Circle cx={12} cy={12} r={10} />
    <Line x1={12} y1={8} x2={12} y2={12} />
    <Line x1={12} y1={16} x2={12.01} y2={16} />
  </Svg>
);

const IconAssinatura = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth={2}>
    <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <Polyline points="22,4 12,14.01 9,11.01" />
  </Svg>
);

const IconWpp = ({ width = 20, height = 20, fill = '#fff' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill={fill}>
    <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133-.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
  </Svg>
);

const NodePropozLogo = () => (
  <Svg width={12} height={12} viewBox="0 0 56 56" fill="none">
    <Rect x={13} y={10} width={26} height={32} rx={5} fill="rgba(255,255,255,.3)" />
    <Rect x={20} y={6} width={28} height={38} rx={5} fill="rgba(255,255,255,.85)" />
    <Polygon points="37,3 25,27 34,27 22,53 45,22 36,22" fill="white" />
  </Svg>
);

const NodeDefaultLogo = () => (
  <View style={s.empresaLogoFallback}>
    <Svg width={30} height={30} viewBox="0 0 56 56" fill="none">
      <Rect x={7} y={14} width={26} height={32} rx={5} fill="rgba(255,255,255,.2)" />
      <Rect x={13} y={10} width={26} height={32} rx={5} fill="rgba(255,255,255,.3)" />
      <Rect x={20} y={6} width={28} height={38} rx={5} fill="rgba(255,255,255,.9)" />
      <Polygon points="37,3 25,27 34,27 22,53 45,22 36,22" fill="#1A56DB" />
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
  const [printing, setPrinting] = useState(false);
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

  const confirmApprove = () => {
    Alert.alert(
      "Aprovar Proposta",
      "Tem certeza que deseja aprovar esta proposta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aprovar", onPress: handleApprove }
      ]
    );
  };

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
      Alert.alert('Erro', 'Não foi possível aprovar a proposta. Tente novamente mais tarde.');
    } finally {
      setApproving(false);
    }
  };

  const handleWhatsApp = () => {
    const phoneToUse = vendor?.phone || vendor?.whatsapp;

    if (!phoneToUse) {
      Alert.alert('WhatsApp indisponível', 'O consultor ainda não cadastrou um número de telefone.');
      return;
    }

    const number = String(phoneToUse).replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${vendor?.owner_name?.split(' ')[0] || ''}, recebi a proposta do ${proposal.client_name}`);

    Linking.openURL(`https://wa.me/55${number}?text=${message}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Tente instalar o aplicativo.');
    });
  };

  const handleExportPDFClient = async () => {
    const html = generateProposalPdfHtml(proposal, vendor);

    // ── WEB: gera PDF real via html2pdf.js (sem popup, sem window.print) ──
    if (Platform.OS === 'web') {
      try {
        setPrinting(true);

        // Injeta html2pdf.js dinamicamente se ainda não estiver carregado
        await new Promise<void>((resolve, reject) => {
          if ((window as any).html2pdf) { resolve(); return; }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar html2pdf.js'));
          document.head.appendChild(script);
        });

        // Cria container oculto com o HTML da proposta
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        container.innerHTML = html;
        document.body.appendChild(container);

        const clientName = proposal?.client_name?.replace(/\s+/g, '_') || 'proposta';
        const fileName = `proposta_${clientName}.pdf`;

        await (window as any).html2pdf()
          .set({
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#F8FAFC',
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          })
          .from(container)
          .save();

        document.body.removeChild(container);
      } catch (e: any) {
        Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
        console.log('PDF error:', e);
      } finally {
        setPrinting(false);
      }
      return;
    }

    // ── NATIVO (app mobile): usa expo-print igual ao fluxo do app ──
    try {
      setPrinting(true);
      await Print.printAsync({ html });
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao preparar o PDF. ' + e.message);
    } finally {
      setPrinting(false);
    }
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
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>Proposta não encontrada</Text>
        {fetchError && <Text style={{ color: 'red', marginTop: 10 }}>{fetchError}</Text>}
      </View>
    );
  }

  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const createdAt = proposal.created_at ? new Date(proposal.created_at).toLocaleDateString('pt-BR') : '';

  const hasExecution = proposal.execution_time && proposal.execution_time.trim() !== '';
  const hasWarranty = proposal.warranty && proposal.warranty.trim() !== '';
  const hasPayment = proposal.payment_method && proposal.payment_method.trim() !== '';
  const totalValue = proposal.total_value ?? proposal.value ?? 0;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.blue} translucent={false} />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerInner}>

            {/* Status Badge */}
            <View style={s.statusBadge}>
              <View style={s.statusDotRing}>
                <View style={s.statusDot} />
              </View>
              <Text style={s.statusBadgeText}>
                {proposal.status === 'fechada' ? 'Proposta Aprovada' : 'Proposta Válida'}
              </Text>
            </View>

            {/* Empresa Row */}
            <View style={s.empresaRow}>
              <View style={s.empresaLogoWrapper}>
                {vendor?.logo_url ? (
                  <Image source={{ uri: vendor.logo_url }} style={s.empresaLogoImg} />
                ) : (
                  <NodeDefaultLogo />
                )}
              </View>
              <View>
                <Text style={s.empresaNome}>{vendor?.company_name || vendor?.owner_name || 'Node Tech'}</Text>
                <View style={s.empresaLocal}>
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={2}>
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <Circle cx={12} cy={10} r={3} />
                  </Svg>
                  <Text style={s.empresaLocalTxt}>{vendor?.city || 'Brasil'}</Text>
                </View>
              </View>
            </View>

            <Text style={s.paraLabel}>PROPOSTA PARA</Text>
            <Text style={s.paraNome}>{proposal.client_name}</Text>

            <View style={s.validadeRow}>
              <View style={s.validadePill}>
                <IconCalendar />
                <Text style={s.validadePillTxt}>{createdAt}</Text>
              </View>
              <View style={s.validadePill}>
                <IconClock />
                <Text style={s.validadePillTxt}>Válida por 7 dias</Text>
              </View>
            </View>

          </View>
          <View style={s.headerCurve} />
        </View>

        {/* BODY */}
        <View style={s.bodyPadding}>

          {/* ITENS E TOTAL */}
          <View style={s.card}>
            <Text style={s.secLabel}>SERVIÇOS E MATERIAIS</Text>
            
            {items.map((item: any, idx: number) => (
              <View key={item.id || idx} style={[s.itemRow, idx === items.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.itemLeft}>
                  <View style={s.itemQty}><Text style={s.itemQtyTxt}>{item.qty}×</Text></View>
                  <Text style={s.itemNome}>{item.name}</Text>
                </View>
                <Text style={s.itemValor}>
                  R$ {((item.price || 0) * (item.qty || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total Geral</Text>
              <Text style={s.totalValor}>
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* OBSERVAÇÕES */}
          {proposal.notes && proposal.notes.trim() !== '' && (
            <View style={s.card}>
              <View style={s.obsBox}>
                <View style={s.obsIconOut}>
                  <IconObs />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.obsLabel}>OBSERVAÇÕES</Text>
                  <Text style={s.obsText}>{proposal.notes}</Text>
                </View>
              </View>
            </View>
          )}

          {/* CONDIÇÕES */}
          {(hasExecution || hasWarranty || hasPayment) && (
            <View style={s.card}>
              <Text style={s.secLabel}>CONDIÇÕES</Text>
              <View style={s.condGrid}>
                {hasExecution && (
                  <View style={s.condItemHalf}>
                    <Text style={s.condLabel}>EXECUÇÃO</Text>
                    <Text style={s.condVal}>{proposal.execution_time}</Text>
                  </View>
                )}
                {hasWarranty && (
                  <View style={s.condItemHalf}>
                    <Text style={s.condLabel}>GARANTIA</Text>
                    <Text style={s.condVal}>{proposal.warranty}</Text>
                  </View>
                )}
                {hasPayment && (
                  <View style={s.condItemLine}>
                    <Text style={s.condLabel}>PAGAMENTO</Text>
                    <Text style={s.condVal}>{proposal.payment_method}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* APROVAR (INFORMATIVO) */}
          {proposal.status !== 'fechada' && (
            <View style={s.assinaturaCard}>
              <View style={s.assIcon}>
                <IconAssinatura />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.assTitle}>Aprovar proposta</Text>
                <Text style={s.assSub}>
                  Clique em "Aprovar Proposta" abaixo para confirmar o aceite.
                </Text>
              </View>
            </View>
          )}

          {/* PROPOZ FOOTER */}
          <View style={s.propozFooter}>
            <View style={s.propozFooterIcon}>
              <NodePropozLogo />
            </View>
            <Text style={s.propozFooterText}>
              Proposta criada com <Text style={s.propozFooterTextBold}>propoz</Text>
            </Text>
          </View>

        </View>

      </ScrollView>

      {/* FOOTER FIXO */}
      <View style={s.stickyFooter}>
        {proposal.status !== 'fechada' && (
          <TouchableOpacity style={s.btnAprovar} activeOpacity={0.8} onPress={confirmApprove} disabled={approving}>
            {approving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnAprovarTxt}>Aprovar Proposta</Text>}
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[s.btnWppOutline, { flex: 1, paddingHorizontal: 0 }]} activeOpacity={0.8} onPress={handleWhatsApp}>
            <IconWpp fill={C.ink} width={18} height={18} />
            <Text style={[s.btnWppOutlineTxt, { fontSize: 13 }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnDownloadPdf, { flex: 1.5, paddingHorizontal: 0 }]} activeOpacity={0.8} onPress={handleExportPDFClient} disabled={printing}>
            <Text style={[s.btnDownloadPdfTxt, { fontSize: 13 }]}>{printing ? 'Processando...' : 'Baixar PDF'}</Text>
          </TouchableOpacity>
        </View>
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
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 160 },
  header: {
    backgroundColor: C.blue,
    position: 'relative',
  },
  headerInner: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    zIndex: 1,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1, left: 0, right: 0,
    height: 24,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusDotRing: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  statusDot: {
    width: '100%', height: '100%',
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  empresaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  empresaLogoWrapper: {
    width: 52, height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empresaLogoFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  empresaLogoImg: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 12 },
  empresaNome: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  empresaLocal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  empresaLocalTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  paraLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  paraNome: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5, lineHeight: 28 },

  validadeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  validadePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
  },
  validadePillTxt: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  bodyPadding: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  secLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingTop: 14, paddingHorizontal: 18, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: C.bg,
  },
  itemLeft: { flex: 1, paddingRight: 12 },
  itemQty: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7,
    marginBottom: 4,
  },
  itemQtyTxt: { color: C.blue, fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  itemNome: { fontSize: 15, fontWeight: '600', color: C.ink, lineHeight: 20 },
  itemDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  itemValor: { fontSize: 15, fontWeight: '500', color: C.ink, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18,
    backgroundColor: '#F0FDF4',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#166534' },
  totalValor: { fontSize: 24, fontWeight: '500', color: '#15803D', letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  obsBox: { paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  obsIconOut: {
    width: 28, height: 28,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  obsLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  obsText: { fontSize: 13, color: '#78350F', lineHeight: 20, fontStyle: 'italic' },

  condGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: C.bg,
    gap: 1,
  },
  condItemLine: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 14, paddingHorizontal: 18,
    marginTop: -1, // collapse gap
  },
  condItemHalf: {
    width: '49.8%',
    backgroundColor: '#fff',
    paddingVertical: 14, paddingHorizontal: 18,
    flexGrow: 1,
  },
  condLabel: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  condVal: { fontSize: 15, fontWeight: '600', color: C.ink },

  assinaturaCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  assIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    alignItems: 'center', justifyContent: 'center',
  },
  assTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  assSub: { fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 16 },

  propozFooter: { alignItems: 'center', paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  propozFooterIcon: { width: 20, height: 20, borderRadius: 5, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  propozFooterText: { fontSize: 12, color: C.muted },
  propozFooterTextBold: { color: C.blue, fontWeight: '700' },

  stickyFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderColor: C.border,
    gap: 12,
    elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -4 },
  },
  btnAprovar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.green,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
  },
  btnAprovarTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'sans-serif' },
  btnWppOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.2, borderColor: C.ink,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
  },
  btnWppOutlineTxt: { fontSize: 16, fontWeight: '700', color: C.ink, fontFamily: 'sans-serif' },
  btnDownloadPdf: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.blue,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
  },
  btnDownloadPdfTxt: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'sans-serif' },
});
