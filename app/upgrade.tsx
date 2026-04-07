import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking
} from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  blue: '#1A56DB',
  blueBg: '#EFF6FF',
  dark: '#0D1626',
  ink: '#1e293b',
  muted: '#64748b',
  subtle: '#94a3b8',
  white: '#ffffff',
  green: '#16a34a',
  greenBg: '#F0FDF4',
};

// ─────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────
const IconClose = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1={18} y1={6} x2={6} y2={18} stroke={C.white} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} stroke={C.white} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const IconClock = ({ color = C.muted }) => (
  <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2.5} />
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

const IconCheckCircle = ({ color = C.blue }) => (
  <View style={[styles.iconBox, { backgroundColor: color === C.blue ? C.blueBg : C.greenBg }]}>
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function ProactiveUpgradeScreen() {
  const router = useRouter();
  const [userPlan, setUserPlan] = React.useState('free');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data, error }) => {
          if (data && !error) setUserPlan(data.plan || 'free');
        });
      }
    });
  }, []);

  const benefits = [
    { text: "Orçamentos e propostas ilimitadas", isSoon: false },
    { text: "Aviso de leitura em tempo real", isSoon: false },
    { text: "Sugestão de follow-up inteligente", isSoon: false },
    { text: "Suporte prioritário", isSoon: false },
    { text: "Templates profissionais", isSoon: true }
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={C.dark} barStyle="light-content" translucent={false} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} bounces={false}>
        {/* BIG PRO CARD */}
        <View style={styles.proCard}>
          <SafeAreaView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <IconClose />
            </TouchableOpacity>
            
            <View style={styles.proCardContent}>
              <View style={styles.tagWrap}>
                <Text style={styles.tagText}>PROPOZ PRO</Text>
              </View>
              <Text style={styles.cardTitle}>Eleve o nível do seu negócio</Text>
              <Text style={styles.cardSub}>Ferramentas criadas para ajudar você a fechar muito mais propostas. Eleve a confiança dos seus clientes.</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* BENEFITS SECTION */}
        <View style={styles.benefitsWrapper}>
          <Text style={styles.benefitsIntroText}>O que você leva no plano Pro:</Text>
          {benefits.map((item, index) => (
            <View key={index} style={[styles.benefitRow, item.isSoon && { opacity: 0.6 }]}>
              {item.isSoon ? <IconClock color={C.muted} /> : <IconCheckCircle color={C.blue} />}
              <Text style={[styles.benefitText, item.isSoon && { color: C.subtle }]}>
                {item.text}
              </Text>
              {item.isSoon && (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>EM BREVE</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* PRICING CALLOUT */}
        <View style={styles.pricingBox}>
          <Text style={styles.pricingVal}>R$ 19,90<Text style={styles.pricingPeriod}> /mês</Text></Text>
          <Text style={styles.pricingSub}>Menos de R$ 1 por dia. Sem taxas surpresas.</Text>
        </View>

      </ScrollView>

      {/* FOOTER CTA */}
      <View style={styles.footer}>
        {userPlan === 'pro' ? (
          <>
            <View style={[styles.btnPrimary, { backgroundColor: C.greenBg, elevation: 0, shadowOpacity: 0 }]}>
              <Text style={[styles.btnPrimaryTxt, { color: C.green }]}>Esse é o seu plano atual</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/5551992731667?text=Ol%C3%A1%2C%20gostaria%20de%20cancelar%20minha%20assinatura%20Pro')}>
              <Text style={[styles.cancelTxt, { color: '#ef4444', textDecorationLine: 'underline', marginTop: 4 }]}>Solicitar cancelamento da assinatura</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.8} onPress={async () => {
              // Busca o e-mail do usuário para auto-preencher lá no Abacate Pay se for possível via URL
              const { data: { user } } = await supabase.auth.getUser();
              
              // COLE SEU LINK DO ABACATE PAY AQUI NAS ASPAS ABAIXO:
              const abacatePayUrl = 'https://abacatepay.com/pay/prod_CHdPy16wq0cf3mZ4K1Py23JG' + (user?.email ? `?email=${user.email}` : '');
              
              Linking.openURL(abacatePayUrl);
            }}>
              <Text style={styles.btnPrimaryTxt}>Assinar Plano Pro</Text>
            </TouchableOpacity>
            <Text style={styles.cancelTxt}>Cancele quando quiser</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
  },
  proCard: {
    backgroundColor: C.dark,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  proCardContent: {
    paddingRight: 10,
  },
  tagWrap: {
    backgroundColor: C.blue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  tagText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTitle: {
    color: C.white,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
  },
  cardSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 24,
  },
  benefitsWrapper: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  benefitsIntroText: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Use flex-start specifically because texts strings could wrap to 2 lines
    marginBottom: 20,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: -2, 
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: C.ink,
    fontWeight: '600',
    lineHeight: 22,
  },
  soonBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  soonText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.muted,
  },
  pricingBox: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: C.blueBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    marginTop: 10,
  },
  pricingVal: {
    fontSize: 36,
    fontWeight: '900',
    color: C.blue,
  },
  pricingPeriod: {
    fontSize: 18,
    fontWeight: '500',
    color: C.blue,
  },
  pricingSub: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 6,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnPrimary: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 12,
  },
  btnPrimaryTxt: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },
  cancelTxt: {
    color: C.subtle,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  }
});