import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CreditCard {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
  cardType: "visa" | "mastercard" | "amex" | "discover";
  bankIssuer?: string;
}

const STORAGE_KEY = "user_payment_cards";

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });

  // Load cards from storage on component mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const storedCards = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedCards) {
        setCards(JSON.parse(storedCards));
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    }
  };

  const saveCards = async (updatedCards: CreditCard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
    } catch (error) {
      console.error("Error saving cards:", error);
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType) {
      case "visa":
        return "card";
      case "mastercard":
        return "card";
      case "amex":
        return "card";
      case "discover":
        return "card";
      default:
        return "card";
    }
  };

  const getCardNetworkLogo = (cardType: string) => {
    // In a real app, you would fetch these from a CDN or API
    // For now, we'll use text-based logos that look realistic
    switch (cardType) {
      case "visa":
        return "VISA";
      case "mastercard":
        return "MASTERCARD";
      case "amex":
        return "AMEX";
      case "discover":
        return "DISCOVER";
      default:
        return "CARD";
    }
  };

  const getBankLogo = (bankIssuer: string) => {
    // In a real app, you would fetch bank logos from an API
    // For now, we'll use text-based bank names
    switch (bankIssuer.toLowerCase()) {
      case "bank of america":
        return "Bank of America";
      case "chase":
        return "Chase";
      case "wells fargo":
        return "Wells Fargo";
      case "citibank":
        return "Citi";
      case "capital one":
        return "Capital One";
      case "american express":
        return "American Express";
      case "discover":
        return "Discover";
      default:
        return bankIssuer;
    }
  };

  const detectBankIssuer = (cardNumber: string) => {
    const firstSix = cardNumber.substring(0, 6);
    const firstFour = cardNumber.substring(0, 4);

    // Bank of America (common BINs)
    if (
      [
        "400000",
        "400001",
        "400002",
        "400003",
        "400004",
        "400005",
        "400006",
        "400007",
        "400008",
        "400009",
      ].includes(firstSix)
    ) {
      return "Bank of America";
    }

    // Chase (common BINs)
    if (
      [
        "400000",
        "400001",
        "400002",
        "400003",
        "400004",
        "400005",
        "400006",
        "400007",
        "400008",
        "400009",
      ].includes(firstSix)
    ) {
      return "Chase";
    }

    // Wells Fargo (common BINs)
    if (
      [
        "400000",
        "400001",
        "400002",
        "400003",
        "400004",
        "400005",
        "400006",
        "400007",
        "400008",
        "400009",
      ].includes(firstSix)
    ) {
      return "Wells Fargo";
    }

    // Citibank (common BINs)
    if (
      [
        "400000",
        "400001",
        "400002",
        "400003",
        "400004",
        "400005",
        "400006",
        "400007",
        "400008",
        "400009",
      ].includes(firstSix)
    ) {
      return "Citibank";
    }

    // Capital One (common BINs)
    if (
      [
        "400000",
        "400001",
        "400002",
        "400003",
        "400004",
        "400005",
        "400006",
        "400007",
        "400008",
        "400009",
      ].includes(firstSix)
    ) {
      return "Capital One";
    }

    // American Express (direct issuer)
    if (firstSix.startsWith("3")) {
      return "American Express";
    }

    // Discover (direct issuer)
    if (firstSix.startsWith("6")) {
      return "Discover";
    }

    // For demo purposes, assign banks based on card number patterns
    const cardNum = parseInt(cardNumber.substring(0, 4));
    if (cardNum >= 4000 && cardNum <= 4999) {
      const banks = [
        "Bank of America",
        "Chase",
        "Wells Fargo",
        "Citibank",
        "Capital One",
      ];
      return banks[cardNum % banks.length];
    }

    // Default based on card type
    switch (cardNumber.charAt(0)) {
      case "4":
        return "Visa";
      case "5":
        return "Mastercard";
      case "3":
        return "American Express";
      case "6":
        return "Discover";
      default:
        return "Credit Card";
    }
  };

  const getBankIssuerText = (card: CreditCard) => {
    if (card.bankIssuer) {
      return card.bankIssuer;
    }
    return detectBankIssuer(card.cardNumber);
  };

  const getBankIssuerColor = (bankIssuer: string) => {
    switch (bankIssuer.toLowerCase()) {
      case "bank of america":
        return "#E31837"; // Bank of America red
      case "chase":
        return "#117ACA"; // Chase blue
      case "wells fargo":
        return "#D71E28"; // Wells Fargo red
      case "citibank":
        return "#0066CC"; // Citi blue
      case "capital one":
        return "#004990"; // Capital One blue
      case "american express":
        return "#006FCF"; // Amex blue
      case "discover":
        return "#FF6000"; // Discover orange
      default:
        return "#2A2D2E"; // Default dark
    }
  };

  const getCardColor = (cardType: string) => {
    switch (cardType) {
      case "visa":
        return "#1A1F71";
      case "mastercard":
        return "#EB001B";
      case "amex":
        return "#006FCF";
      case "discover":
        return "#FF6000";
      default:
        return "#2A2D2E";
    }
  };

  const getCardGradient = (cardType: string) => {
    switch (cardType) {
      case "visa":
        return ["#1A1F71", "#2D3A8C"];
      case "mastercard":
        return ["#EB001B", "#F79E1B"];
      case "amex":
        return ["#006FCF", "#00A3E0"];
      case "discover":
        return ["#FF6000", "#FF8C00"];
      default:
        return ["#2A2D2E", "#3A3D3E"];
    }
  };

  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const maskCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.length < 4) return number;
    const lastFour = cleaned.slice(-4);
    const masked = "•".repeat(cleaned.length - 4);
    return `${masked} ${lastFour}`;
  };

  const validateCard = () => {
    if (!newCard.cardNumber || newCard.cardNumber.length < 16) {
      Alert.alert("Error", "Please enter a valid card number");
      return false;
    }
    if (!newCard.cardholderName) {
      Alert.alert("Error", "Please enter cardholder name");
      return false;
    }
    if (!newCard.expiryMonth || !newCard.expiryYear) {
      Alert.alert("Error", "Please enter expiry date");
      return false;
    }
    if (!newCard.cvv || newCard.cvv.length < 3) {
      Alert.alert("Error", "Please enter a valid CVV");
      return false;
    }
    return true;
  };

  const addCard = async () => {
    if (!validateCard()) return;

    const cardType = newCard.cardNumber.startsWith("4")
      ? "visa"
      : newCard.cardNumber.startsWith("5")
      ? "mastercard"
      : newCard.cardNumber.startsWith("3")
      ? "amex"
      : "discover";

    const card: CreditCard = {
      id: Date.now().toString(),
      cardNumber: newCard.cardNumber,
      cardholderName: newCard.cardholderName,
      expiryMonth: newCard.expiryMonth,
      expiryYear: newCard.expiryYear,
      cvv: newCard.cvv,
      isDefault: cards.length === 0,
      cardType,
      bankIssuer: detectBankIssuer(newCard.cardNumber),
    };

    const updatedCards = [...cards, card];
    setCards(updatedCards);
    await saveCards(updatedCards);

    setNewCard({
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
    });
    setShowAddCard(false);
  };

  const removeCard = async (cardId: string) => {
    Alert.alert("Remove Card", "Are you sure you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updatedCards = cards.filter((card) => card.id !== cardId);
          // If we're removing the default card and there are other cards, make the first one default
          if (
            cards.find((c) => c.id === cardId)?.isDefault &&
            updatedCards.length > 0
          ) {
            updatedCards[0].isDefault = true;
          }
          setCards(updatedCards);
          await saveCards(updatedCards);
        },
      },
    ]);
  };

  const setDefaultCard = async (cardId: string) => {
    const updatedCards = cards.map((card) => ({
      ...card,
      isDefault: card.id === cardId,
    }));
    setCards(updatedCards);
    await saveCards(updatedCards);
  };

  const CardItem = ({ card }: { card: CreditCard }) => {
    const [showActions, setShowActions] = useState(false);

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          onPress={() => setShowActions(!showActions)}
          activeOpacity={0.9}
        >
          <View style={styles.amazonCard}>
            {/* Card Header */}
            <View style={styles.amazonCardHeader}>
              <View style={styles.amazonCardLeft}>
                <View
                  style={[
                    styles.amazonCardIcon,
                    { backgroundColor: getCardColor(card.cardType) },
                  ]}
                >
                  <ThemedText style={styles.cardNetworkText}>
                    {getCardNetworkLogo(card.cardType)}
                  </ThemedText>
                </View>
                <View style={styles.amazonCardInfo}>
                  <ThemedText style={styles.amazonCardType}>
                    {getBankLogo(getBankIssuerText(card))}{" "}
                    {getCardNetworkLogo(card.cardType)} ending in{" "}
                    {card.cardNumber.slice(-4)}
                  </ThemedText>
                  <ThemedText style={styles.amazonCardName}>
                    {card.cardholderName}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.amazonCardRight}>
                {card.isDefault && (
                  <View style={styles.amazonDefaultBadge}>
                    <ThemedText style={styles.amazonDefaultText}>
                      Default
                    </ThemedText>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
              </View>
            </View>

            {/* Card Actions Overlay */}
            {showActions && (
              <View style={[styles.cardActionsOverlay, { opacity: 1 }]}>
                <View style={styles.actionsContainer}>
                  {!card.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setDefaultCard(card.id)}
                    >
                      <Ionicons name="star-outline" size={16} color="#fff" />
                      <ThemedText style={styles.actionText}>
                        Set as default
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => removeCard(card.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    <ThemedText style={[styles.actionText, styles.removeText]}>
                      Remove
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.headerRow, { marginBottom: 10 }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.headerTitle}>Payment Methods</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color="#8A9196" />
              <ThemedText style={styles.emptyTitle}>
                No payment methods
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Add a credit or debit card to make payments faster
              </ThemedText>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {cards.map((card) => (
                <CardItem key={card.id} card={card} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddCard(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <ThemedText style={styles.addButtonText}>Add Payment Method</ThemedText>
      </TouchableOpacity>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCard(false)}
      >
        <ThemedView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddCard(false)}
              style={styles.cancelButton}
            >
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>
              Add Payment Method
            </ThemedText>
            <TouchableOpacity onPress={addCard} style={styles.saveButton}>
              <ThemedText style={styles.saveText}>Save</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Card Number</ThemedText>
              <TextInput
                style={styles.input}
                value={newCard.cardNumber}
                onChangeText={(text) =>
                  setNewCard({
                    ...newCard,
                    cardNumber: text.replace(/\s/g, "").slice(0, 16),
                  })
                }
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Cardholder Name</ThemedText>
              <TextInput
                style={styles.input}
                value={newCard.cardholderName}
                onChangeText={(text) =>
                  setNewCard({ ...newCard, cardholderName: text })
                }
                placeholder="John Doe"
                placeholderTextColor="#9BA1A6"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <ThemedText style={styles.inputLabel}>Expiry Month</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newCard.expiryMonth}
                  onChangeText={(text) =>
                    setNewCard({
                      ...newCard,
                      expiryMonth: text.replace(/\D/g, "").slice(0, 2),
                    })
                  }
                  placeholder="MM"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <ThemedText style={styles.inputLabel}>Expiry Year</ThemedText>
                <TextInput
                  style={styles.input}
                  value={newCard.expiryYear}
                  onChangeText={(text) =>
                    setNewCard({
                      ...newCard,
                      expiryYear: text.replace(/\D/g, "").slice(0, 2),
                    })
                  }
                  placeholder="YY"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>CVV</ThemedText>
              <TextInput
                style={styles.input}
                value={newCard.cvv}
                onChangeText={(text) =>
                  setNewCard({
                    ...newCard,
                    cvv: text.replace(/\D/g, "").slice(0, 4),
                  })
                }
                placeholder="123"
                placeholderTextColor="#9BA1A6"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151718",
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerSide: {
    width: 64,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#E6E8EB",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#9BA1A6",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  cardsList: {
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  amazonCard: {
    backgroundColor: "#1A1D1E",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2D2E",
  },
  amazonCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amazonCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  amazonCardIcon: {
    width: 50,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardNetworkText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amazonCardInfo: {
    flex: 1,
  },
  amazonCardType: {
    color: "#E6E8EB",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  amazonCardName: {
    color: "#9BA1A6",
    fontSize: 14,
  },
  amazonCardRight: {
    alignItems: "flex-end",
  },
  amazonDefaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  amazonDefaultText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  chipContainer: {
    marginRight: 16,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: "#FFD700",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#B8860B",
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIssuerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardNumberContainer: {
    marginBottom: 24,
  },
  cardMiddleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  validThruContainer: {
    alignItems: "flex-start",
  },
  validThruLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  validThruDate: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cvvContainer: {
    alignItems: "flex-end",
  },
  cvvLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  cvvValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  cardNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardNetworkLogo: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardholderContainer: {
    flex: 1,
  },
  cardholderLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardholderName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  expiryContainer: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  expiryDate: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  defaultBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  defaultText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardActionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  removeText: {
    color: "#FF6B6B",
  },
  addButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#151718",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#151718",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D2E",
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    color: "#9BA1A6",
    fontSize: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 8,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#9BA1A6",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(230,232,235,0.14)",
  },
  row: {
    flexDirection: "row",
  },
});
