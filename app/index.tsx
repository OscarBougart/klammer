/**
 * Home — E5.4 will make this real (today's session, streak, current tier).
 * For now it proves the scaffold: correct ground, correct faces, umlauts and ß
 * at every weight.
 */
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-schiefer px-lg justify-center gap-xl">
      <View className="gap-sm">
        <Text className="font-display-semibold text-display text-kreide">Klammer</Text>
        <Text className="font-text text-body text-grau">
          Deutsche Wortstellung, Satz für Satz.
        </Text>
      </View>

      {/* Scaffold check — every weight, umlauts and ß, both families. */}
      <View className="gap-xs">
        <Text className="font-display-semibold text-tile text-kreide">
          Ich hole meine Schwester ab — Größe, Käse, Fußball
        </Text>
        <Text className="font-text text-body text-kreide">
          Übermäßig schöne Sätze mit Umlauten: ä ö ü Ä Ö Ü ß
        </Text>
      </View>

      <Link
        href="/(game)/session"
        className="font-display-semibold text-bodyLarge text-messing"
        accessibilityRole="link"
      >
        Sitzung starten
      </Link>
    </View>
  );
}
