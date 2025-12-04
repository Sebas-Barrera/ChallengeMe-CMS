import { useAuth } from "@/src/contexts/AuthContext";
import { useDailyTip } from "@/src/hooks/useDailyTip";
import { useGameModes } from "@/src/hooks/useGameModes";
import { activityService } from "@/src/services";
import { GameModeLocalized, RecentActivity } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Body2,
  BodySemiBold,
  Caption,
  Subtitle1,
  Subtitle2,
  Subtitle3,
  Title2,
} from "../../src/components/common/Typography";
import { DiscountModal, WelcomePremiumModal } from "../../src/components/modals";
import { BrandColors } from "../../src/constants/Colors";

export default function HomeScreen() {
  const { user } = useAuth();
  const { gameModes, loading: gameModesLoading } = useGameModes();
  const { tipOfTheDay, loading: dailyTipLoading } = useDailyTip();
  const { t } = useTranslation();

  const userName = user?.name?.split(" ")[0] || t('home.champion');

  // Estado para el modal de bienvenida premium (TEST)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Estado para el modal de descuento (TEST)
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('home.today');
    if (diffDays === 1) return t('home.yesterday');
    if (diffDays < 7) return t('home.daysAgo', { days: diffDays });
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  // Estados para la data
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Cargar data al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar actividades recientes desde la BD
        if (user?.id) {
          const activities = await activityService.getActivities({
            user_id: user.id,
            limit: 5
          });
          console.log('[Home] Actividades cargadas:', activities);
          setRecentActivity(activities);
        }
      } catch (error) {
        console.error("Error loading home data:", error);
      }
    };

    loadData();
  }, [user?.id]);

  // Loading state
  if (gameModesLoading || dailyTipLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Body2 color="#FFFFFF">{t('home.loading')}</Body2>
        </View>
      </SafeAreaView>
    );
  }

  const handleCardPress = (gameMode: GameModeLocalized) => {
    if (gameMode.route) {
      // Pass game_mode_id as parameter to the route
      router.push({
        pathname: gameMode.route as any,
        params: { game_mode_id: gameMode.id }
      });
    } else {
      alert(`${gameMode.title} próximamente! 🚀`);
    }
  };

  const handleQuickPlay = () => {
    // Find the "Challenges" game mode (first one or specific one)
    const challengesGameMode = gameModes.find(gm => gm.route === "/(main)/(challenges)/challenges");

    if (challengesGameMode) {
      router.push({
        pathname: "/(main)/(challenges)/challenges",
        params: { game_mode_id: challengesGameMode.id }
      });
    } else {
      // Fallback if not found
      router.push("/(main)/(challenges)/challenges");
    }
  };

  const renderCard = (gameMode: GameModeLocalized) => {
    return (
      <TouchableOpacity
        key={gameMode.id}
        style={[
          styles.gameCard,
          {
            backgroundColor: gameMode.color,
            shadowColor: gameMode.color,
          },
        ]}
        activeOpacity={0.85}
        onPress={() => handleCardPress(gameMode)}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={gameMode.icon as any}
              size={38}
              color={gameMode.text_color}
            />
          </View>
          <View style={styles.cardInfo}>
            <BodySemiBold color={gameMode.text_color} style={{ marginBottom: 6, fontSize: 17 }}>
              {gameMode.title}
            </BodySemiBold>
            <Caption
              color={gameMode.text_color}
              style={{ lineHeight: 17, opacity: 0.85, fontSize: 13 }}
            >
              {gameMode.subtitle}
            </Caption>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.spacer} />
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push("/(main)/profile")}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#BDF522"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push("/(main)/settings")}
              >
                <Ionicons name="settings-outline" size={24} color="#BDF522" />
              </TouchableOpacity>
              {/* Botón de prueba para modal de bienvenida premium */}
              <TouchableOpacity
                style={[styles.headerButton, styles.testButton]}
                onPress={() => setShowWelcomeModal(true)}
              >
                <Ionicons name="star" size={24} color="#000000" />
              </TouchableOpacity>
              {/* Botón de prueba para modal de descuento */}
              <TouchableOpacity
                style={[styles.headerButton, styles.discountButton]}
                onPress={() => setShowDiscountModal(true)}
              >
                <Ionicons name="pricetag" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greeting}>
            <Title2 color="#999" style={{ marginBottom: 8 }}>
              {t('home.greeting', { name: userName })}
            </Title2>
            <Subtitle3 color="#FFFFFF" style={{ fontWeight: "bold" }}>
              {t('home.howWouldYouLike')}
            </Subtitle3>
            <Subtitle1 color="#FFFFFF" style={{ fontWeight: "bold" }}>
              {t('home.toHaveFunToday')}
            </Subtitle1>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Subtitle2
            color="#FFFFFF"
            style={{ fontWeight: "bold", marginBottom: 16 }}
          >
            {t('home.quickActions')}
          </Subtitle2>

          <TouchableOpacity
            style={styles.quickPlayButton}
            activeOpacity={0.85}
            onPress={handleQuickPlay}
          >
            <View style={styles.quickPlayContent}>
              <View style={styles.quickPlayLeft}>
                <Ionicons name="play-circle" size={32} color="#000000" />
                <View style={styles.quickPlayText}>
                  <BodySemiBold color="#000000">{t('home.quickPlay')}</BodySemiBold>
                  <Caption color="#333">{t('home.quickPlaySubtitle')}</Caption>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#000000" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Game Modes Grid */}
        <View style={styles.gameModesSection}>
          <Subtitle2
            color="#FFFFFF"
            style={{ fontWeight: "bold", marginBottom: 16 }}
          >
            {t('home.gameModes')}
          </Subtitle2>

          <View style={styles.cardsGrid}>
            {gameModes.map((gameMode) => renderCard(gameMode))}
          </View>
        </View>

        {/* Daily Tip */}
        <View style={styles.tipSection}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color="#FD8616" />
            <Subtitle2
              color="#FFFFFF"
              style={{ fontWeight: "bold", marginLeft: 8 }}
            >
              {t('home.dailyTip')}
            </Subtitle2>
          </View>

          <View style={styles.tipCard}>
            <Body2 color="#CCCCCC" style={{ lineHeight: 20 }}>
              {tipOfTheDay?.text || t('home.noTipAvailable')}
            </Body2>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Subtitle2
            color="#FFFFFF"
            style={{ fontWeight: "bold", marginBottom: 16 }}
          >
            {t('home.recentActivity')}
          </Subtitle2>

          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <View key={activity.id || index} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="game-controller" size={16} color="#7B46F8" />
                  </View>
                  <View style={styles.activityText}>
                    <BodySemiBold color="#FFFFFF" style={{ fontSize: 14 }}>
                      {activity.game}
                    </BodySemiBold>
                    <Caption color="#999">
                      {activity.players} {activity.players === 1 ? t('home.player') : t('home.players')} • {formatDate(activity.activity_date)}
                    </Caption>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            ))
          ) : (
            <View style={styles.emptyActivityContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#666" />
              <Caption color="#666" style={{ marginTop: 8, textAlign: 'center' }}>
                {t('home.noRecentActivity')}
              </Caption>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de bienvenida premium (TEST) */}
      <WelcomePremiumModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />

      {/* Modal de descuento (TEST) */}
      <DiscountModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        influencerName="JuanPerez"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  spacer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(189, 245, 34, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(189, 245, 34, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#BDF522",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  testButton: {
    backgroundColor: BrandColors.neon.yellow,
    borderColor: BrandColors.neon.yellow,
    shadowColor: BrandColors.neon.yellow,
  },
  discountButton: {
    backgroundColor: BrandColors.neon.pink,
    borderColor: BrandColors.neon.pink,
    shadowColor: BrandColors.neon.pink,
  },
  greeting: {
    marginLeft: 4,
  },
  // Featured Section
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featuredCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333333",
  },
  featuredContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredLeft: {
    flex: 1,
    paddingRight: 16,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickPlayButton: {
    backgroundColor: "#BDF522",
    borderRadius: 16,
    padding: 16,
  },
  quickPlayContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickPlayLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickPlayText: {
    marginLeft: 12,
  },

  // Game Modes Section
  gameModesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gameCard: {
    width: "48%",
    aspectRatio: 1.1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    justifyContent: "space-between",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardInfo: {
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "flex-end",
  },

  // Daily Tip Section
  tipSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FD8616",
    borderWidth: 1,
    borderColor: "#333333",
  },

  // Recent Activity Section
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(123, 70, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  emptyActivityContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "#333333",
  },
});