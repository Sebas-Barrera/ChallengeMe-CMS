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
import { Body2, BodySemiBold, Caption, Title2 } from "../common/Typography";

const { width: screenWidth } = Dimensions.get("window");

interface WelcomePremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WelcomePremiumModal({
  visible,
  onClose,
}: WelcomePremiumModalProps) {
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

              {/* Header simple y elegante */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("../../../assets/images/adaptive-icon.png")}
                    style={styles.iconImage}
                  />
                </View>

                <Title2 color="#FFFFFF" style={styles.headerTitle}>
                  ¡Bienvenido!
                </Title2>
                <Caption color="#BDF522" style={styles.welcomeText}>
                  Ahora eres miembro ChallengeMe.
                </Caption>
              </View>

              {/* Mensaje de agradecimiento del equipo */}
              <View style={styles.content}>
                <View style={styles.thankYouBox}>
                  <Body2 color="#CCCCCC" style={styles.thankYouText}>
                    Gracias por confiar en <BodySemiBold color="#FFFFFF">ChallengeMe</BodySemiBold>. Ahora tienes acceso completo para llevar tus reuniones, fiestas y momentos con amigos al siguiente nivel.
                  </Body2>
                  <Body2 color="#CCCCCC" style={styles.thankYouText}>
                    ¡A crear recuerdos inolvidables! 🚀
                  </Body2>
                  <Body2 color="#999" style={styles.signatureText}>
                    - El equipo de ChallengeMe
                  </Body2>
                </View>

                {/* Separador sutil */}
                <View style={styles.divider} />

                {/* Recordatorio simple */}
                <View style={styles.reminderBox}>
                  <Caption color="#999" style={styles.reminderText}>
                    Ahora tienes acceso completo a todos los retos, pláticas profundas y contenido exclusivo.
                  </Caption>
                </View>

                {/* Botón simple */}
                <TouchableOpacity
                  style={styles.continueButton}
                  activeOpacity={0.85}
                  onPress={onClose}
                >
                  <BodySemiBold color="#000000" style={styles.continueButtonText}>
                    Continuar
                  </BodySemiBold>
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
  },

  // Content
  content: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },

  // Thank You Box
  thankYouBox: {
    marginBottom: 24,
  },
  thankYouText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 16,
  },
  signatureText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#444444",
    marginBottom: 24,
  },

  // Reminder Box
  reminderBox: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333333",
    borderLeftWidth: 4,
    borderLeftColor: BrandColors.neon.yellow,
  },
  reminderText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  // Continue Button
  continueButton: {
    backgroundColor: BrandColors.neon.yellow,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: BrandColors.neon.yellow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 15,
    color: "#000000",
  },
});
