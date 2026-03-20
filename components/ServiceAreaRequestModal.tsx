import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ServiceAreaRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onNotifyMe: () => void;
  onChooseServiceableArea: () => void;
  /** When true, show "Continue browsing anyway" link (e.g. for current location). When false, only Notify Me + Choose Serviceable Area (e.g. for pin flow). */
  showContinueBrowsing?: boolean;
  /** Optional custom description (e.g. pin vs current location). */
  description?: string;
}

const DEFAULT_DESCRIPTION =
  "Your current location is outside our delivery area. You can move the pin to a nearby serviceable location to continue.";

const ServiceAreaRequestModal: React.FC<ServiceAreaRequestModalProps> = ({
  visible,
  onClose,
  onNotifyMe,
  onChooseServiceableArea,
  showContinueBrowsing = true,
  description = DEFAULT_DESCRIPTION,
}) => {
  const handleNotifyMe = () => {
    onClose();
    onNotifyMe();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="location-outline" size={48} color="#48479B" />
            <Text style={styles.modalTitle}>Area Not Serviceable</Text>
          </View>

          <Text style={styles.modalDescription}>{description}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.notifyButton]}
              onPress={handleNotifyMe}
            >
              <Ionicons name="notifications-outline" size={18} color="#48479B" />
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => {
                onClose();
                onChooseServiceableArea();
              }}
            >
              <Text style={styles.primaryButtonText}>
                Choose Serviceable Area
              </Text>
            </TouchableOpacity>
          </View>

          {showContinueBrowsing && (
            <TouchableOpacity
              style={styles.continueLink}
              onPress={onClose}
            >
              <Text style={styles.continueLinkText}>
                Continue browsing anyway
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  notifyButton: {
    backgroundColor: "#F8F9FF",
    borderWidth: 1.5,
    borderColor: "#48479B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#48479B",
  },
  continueLink: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  continueLinkText: {
    fontSize: 14,
    color: "#8E8E93",
    textDecorationLine: "underline",
  },
});

export default ServiceAreaRequestModal;
