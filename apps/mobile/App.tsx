import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>React Native + Expo</Text>
        <Text style={styles.title}>Base mobile pronta para o projeto REMA</Text>
        <Text style={styles.description}>
          Este app ja esta preparado para evoluir por features e conversar com a
          API Django via variavel de ambiente.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API configurada</Text>
          <Text style={styles.cardValue}>{apiUrl}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proximo passo</Text>
          <Text style={styles.cardDescription}>
            Definir autenticacao, navegacao e os primeiros fluxos do produto.
          </Text>
        </View>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  description: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 26,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4f0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600',
  },
  cardValue: {
    color: '#1d4ed8',
    fontSize: 15,
    lineHeight: 22,
  },
  cardDescription: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 24,
  },
});
