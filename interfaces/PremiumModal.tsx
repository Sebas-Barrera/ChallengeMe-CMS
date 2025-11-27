import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BrandColors } from "../../constants/Colors";
import { Body2, BodySemiBold, Caption, Subtitle1 } from "../common/Typography";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}

export default function PremiumModal({
  visible,
  onClose,
  onSubscribe,
}: PremiumModalProps) {
  const { t } = useTranslation();
  const [scaleAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const features = [
    {
      icon: "flash" as keyof typeof Ionicons.glyphMap,
      title: "Todos los retos y pláticas",
      description: "Acceso completo a todos los retos y pláticas profundas",
      color: BrandColors.neon.yellow,
    },
    {
      icon: "heart" as keyof typeof Ionicons.glyphMap,
      title: "Tips para ligar",
      description: "Acceso exclusivo cuando estén disponibles",
      color: BrandColors.neon.pink,
    },
    {
      icon: "beer" as keyof typeof Ionicons.glyphMap,
      title: "Juegos de shots",
      description: "Acceso completo cuando estén disponibles",
      color: BrandColors.neon.orange,
    },
    {
      icon: "rocket" as keyof typeof Ionicons.glyphMap,
      title: "Actualizaciones constantes",
      description: "Contenido nuevo cada mes incluido",
      color: BrandColors.neon.purple,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Fondo con blur */}
      <BlurView intensity={40} style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.header}>
                {/* Botón cerrar */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#BDF522" />
                </TouchableOpacity>

                {/* Ícono premium */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="diamond"
                    size={48}
                    color={BrandColors.neon.yellow}
                  />
                </View>

                <Subtitle1 color="#FFFFFF" style={styles.headerTitle}>
                  Desbloquea Premium
                </Subtitle1>
                <Caption color="#999" style={styles.headerSubtitle}>
                  Acceso completo a todo el contenido
                </Caption>
              </View>

              {/* Contenido */}
              <View style={styles.content}>
                {/* Precio */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceCard}>
                    <Caption color="#999" style={styles.priceLabel}>
                      MENSUAL
                    </Caption>
                    <View style={styles.priceRow}>
                      <Subtitle1 color="#FFFFFF" style={styles.priceAmount}>
                        $70
                      </Subtitle1>
                      <Body2 color="#FFFFFF" style={styles.priceCurrency}>
                        MXN/mes
                      </Body2>
                    </View>
                    <Caption color="#666" style={styles.priceNote}>
                      Se renueva cada mes
                    </Caption>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View
                        style={[
                          styles.featureIconContainer,
                          { backgroundColor: `${feature.color}33` },
                        ]}
                      >
                        <Ionicons
                          name={feature.icon}
                          size={20}
                          color={feature.color}
                        />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <BodySemiBold color="#FFFFFF" style={styles.featureTitle}>
                          {feature.title}
                        </BodySemiBold>
                        <Caption color="#999" style={styles.featureDescription}>
                          {feature.description}
                        </Caption>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Botones */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.subscribeButton}
                    activeOpacity={0.85}
                    onPress={onSubscribe}
                  >
                    <BodySemiBold color="#000000" style={styles.subscribeText}>
                      Obtener Premium
                    </BodySemiBold>
                    <Ionicons name="arrow-forward" size={20} color="#000000" />
                  </TouchableOpacity>

                  {/* <Caption color="#666" style={styles.disclaimer}>
                    Pago seguro
                  </Caption> */}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 420,
    maxHeight: screenHeight * 0.85,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },

  // Header
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(189, 245, 34, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(189, 245, 34, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(189, 245, 34, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(189, 245, 34, 0.3)",
  },
  headerTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    textAlign: "center",
  },

  // Content
  content: {
    padding: 20,
  },

  // Price
  priceContainer: {
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.neon.yellow,
  },
  priceLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: "bold",
    lineHeight: 48,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
    marginBottom: 6,
  },
  priceNote: {
    fontSize: 11,
    textAlign: "center",
  },

  // Features
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Action
  actionContainer: {
    alignItems: "center",
  },
  subscribeButton: {
    backgroundColor: BrandColors.neon.yellow,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BrandColors.neon.yellow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeText: {
    fontSize: 16,
    marginRight: 8,
  },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});
