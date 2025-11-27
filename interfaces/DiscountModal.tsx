import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BrandColors } from "../../constants/Colors";
import { Body2, BodySemiBold, Caption, Subtitle1, Title2 } from "../common/Typography";

const { width: screenWidth } = Dimensions.get("window");

interface DiscountModalProps {
  visible: boolean;
  onClose: () => void;
  influencerName?: string; // Nombre del influencer que comparte el descuento
}

export default function DiscountModal({
  visible,
  onClose,
  influencerName,
}: DiscountModalProps) {
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
  }, [visible, scaleAnim]);

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
              {/* Botón cerrar */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color="#BDF522" />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("../../../assets/images/adaptive-icon.png")}
                    style={styles.iconImage}
                  />
                </View>

                <Title2 color="#FFFFFF" style={styles.headerTitle}>
                  ¡Descuento Aplicado!
                </Title2>
                <Caption color="#BDF522" style={styles.welcomeText}>
                  {influencerName
                    ? `Has obtenido el descuento de ${influencerName}, ¡que lo disfrutes!`
                    : "Has obtenido un descuento especial, ¡que lo disfrutes!"
                  }
                </Caption>
              </View>

              {/* Contenido */}
              <View style={styles.content}>
                {/* Precio con descuento */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceCard}>
                    <View style={styles.discountBadge}>
                      <Caption color="#000000" style={styles.discountBadgeText}>
                        40% OFF
                      </Caption>
                    </View>

                    <Caption color="#999" style={styles.priceLabel}>
                      MENSUAL
                    </Caption>

                    {/* Precio anterior tachado */}
                    <View style={styles.oldPriceRow}>
                      <Body2 color="#666" style={styles.oldPrice}>
                        $75
                      </Body2>
                      <View style={styles.strikethrough} />
                    </View>

                    {/* Nuevo precio */}
                    <View style={styles.priceRow}>
                      <Subtitle1 color="#BDF522" style={styles.priceAmount}>
                        $45
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

                {/* Mensaje motivacional */}
                <View style={styles.messageBox}>
                  <Body2 color="#CCCCCC" style={styles.messageText}>
                    Aprovecha este descuento exclusivo y desbloquea todo el contenido de <BodySemiBold color="#FFFFFF">ChallengeMe</BodySemiBold> para llevar tus reuniones al siguiente nivel.
                  </Body2>
                </View>

                {/* Advertencia de urgencia */}
                <View style={styles.warningBox}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="alert-circle" size={18} color="#FD8616" />
                    <Caption color="#FD8616" style={styles.warningTitle}>
                      ¡Importante!
                    </Caption>
                  </View>
                  <Caption color="#CCCCCC" style={styles.warningText}>
                    Esta es la única vez que podrás usar el descuento. Si cierras esta ventana, el descuento se perderá.
                  </Caption>
                </View>

                {/* Separador */}
                <View style={styles.divider} />

                {/* Features rápidos */}
                <View style={styles.quickFeatures}>
                  <View style={styles.quickFeatureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#BDF522" />
                    <Caption color="#CCCCCC" style={styles.quickFeatureText}>
                      Todos los retos desbloqueados
                    </Caption>
                  </View>
                  <View style={styles.quickFeatureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#BDF522" />
                    <Caption color="#CCCCCC" style={styles.quickFeatureText}>
                      Pláticas profundas ilimitadas
                    </Caption>
                  </View>
                  <View style={styles.quickFeatureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#BDF522" />
                    <Caption color="#CCCCCC" style={styles.quickFeatureText}>
                      Contenido exclusivo premium
                    </Caption>
                  </View>
                </View>

                {/* Botón de acción */}
                <TouchableOpacity
                  style={styles.subscribeButton}
                  activeOpacity={0.85}
                  onPress={onClose}
                >
                  <BodySemiBold color="#000000" style={styles.subscribeText}>
                    Obtener con Descuento
                  </BodySemiBold>
                  <Ionicons name="arrow-forward" size={20} color="#000000" />
                </TouchableOpacity>
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
    maxWidth: 400,
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
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(189, 245, 34, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(189, 245, 34, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 32,
    alignItems: "center",
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
    overflow: "hidden",
  },
  iconImage: {
    width: 64,
    height: 64,
  },
  headerTitle: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 24,
    marginBottom: 8,
  },
  welcomeText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Content
  content: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },

  // Price
  priceContainer: {
    marginBottom: 20,
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
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: BrandColors.neon.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  priceLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  oldPriceRow: {
    position: "relative",
    marginBottom: 4,
  },
  oldPrice: {
    fontSize: 20,
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
    textDecorationColor: "#666",
  },
  strikethrough: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FF4444",
    transform: [{ rotate: "-5deg" }],
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

  // Message Box
  messageBox: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Warning Box
  warningBox: {
    backgroundColor: "rgba(253, 134, 22, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(253, 134, 22, 0.3)",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#333333",
    marginBottom: 20,
  },

  // Quick Features
  quickFeatures: {
    marginBottom: 24,
    gap: 10,
  },
  quickFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickFeatureText: {
    fontSize: 13,
    flex: 1,
  },

  // Subscribe Button
  subscribeButton: {
    backgroundColor: BrandColors.neon.yellow,
    borderRadius: 12,
    padding: 16,
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
    fontSize: 15,
    marginRight: 8,
  },
});
