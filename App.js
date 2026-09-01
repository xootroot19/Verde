import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  Easing,
  Share,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 0, fade: false });

const GREEN = "#49AD3C";
const GREEN_CARD = "#138C15";
const GREEN_DARK = "#087B15";
const GREEN_BUTTON = "#04750F";
const BLUE = "#078DAE";
const WHITE = "#FFFFFF";
const TEXT = "#272727";
const MUTED = "#737373";
const BG = "#F4F5F6";
const BORDER = "#DADDE0";
const YELLOW = "#FFD918";

const STORAGE = {
  balance: "@verdepay_demo_balance",
  transactions: "@verdepay_demo_transactions",
};

const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const nowBR = () =>
  new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function parseBRL(input) {
  if (!input) return 0;
  let value = String(input).trim().replace(/[^\d,.-]/g, "");
  if (value.includes(",")) {
    value = value.replace(/\./g, "").replace(",", ".");
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function ScalePressable({ children, style, onPress, disabled = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 2,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function Header({ refreshing }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (refreshing) {
      spin.setValue(0);
      loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
    return () => loop?.stop();
  }, [refreshing, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <View style={styles.logoBlue} />
          <View style={styles.logoYellow} />
          <View style={styles.logoWhite} />
        </View>
        <Text style={styles.logoText}>VerdePay</Text>
      </View>

      <View style={styles.headerRight}>
        {refreshing ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="refresh" size={29} color={WHITE} />
          </Animated.View>
        ) : (
          <Ionicons name="lock-closed-outline" size={29} color={WHITE} />
        )}

        <View>
          <Ionicons name="notifications-outline" size={30} color={WHITE} />
          <View style={styles.notification}>
            <Text style={styles.notificationText}>2</Text>
          </View>
        </View>

        <Ionicons name="person-circle-outline" size={38} color={WHITE} />
      </View>
    </View>
  );
}

function ActionTile({ icon, label, badge, disabled = false, onPress }) {
  return (
    <ScalePressable style={styles.tile} onPress={onPress}>
      <View style={styles.tileInside}>
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={disabled ? "#737373" : BLUE}
        />

        <Text style={[styles.tileText, disabled && { color: "#666" }]}>
          {label}
        </Text>
      </View>
    </ScalePressable>
  );
}

function BottomButton({ icon, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.bottomButton}>
      <MaterialCommunityIcons
        name={icon}
        size={29}
        color={active ? GREEN : "#555"}
      />
      <Text style={[styles.bottomText, active && { color: GREEN }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function BottomNavigation({ active, setActive }) {
  return (
    <View style={styles.bottomNavigation}>
      <BottomButton
        icon="home"
        label="Início"
        active={active === "home"}
        onPress={() => setActive("home")}
      />
      <BottomButton
        icon="format-list-bulleted"
        label="Extrato"
        active={active === "statement"}
        onPress={() => setActive("statement")}
      />
      <BottomButton
        icon="storefront"
        label="Vendas"
        active={active === "sales"}
        onPress={() => setActive("sales")}
      />
      <BottomButton
        icon="credit-card"
        label="Cartões"
        active={active === "cards"}
        onPress={() => setActive("cards")}
      />
    </View>
  );
}

function Home({
  balance,
  hidden,
  setHidden,
  openBalanceEditor,
  openPix,
  goStatement,
  refreshing,
  onRefresh,
  lastUpdated,
}) {
  const demoAlert = () => {
    Alert.alert("Demonstração", "Este recurso faz parte apenas do mockup.");
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 110 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={WHITE}
          colors={[GREEN_BUTTON]}
          progressBackgroundColor={WHITE}
        />
      }
    >
      <View style={styles.greenArea}>
        <Header refreshing={refreshing} />

        {refreshing && (
          <View style={styles.refreshPill}>
            <ActivityIndicator size="small" color={GREEN_BUTTON} />
            <Text style={styles.refreshPillText}>Atualizando dados...</Text>
          </View>
        )}

        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Saldo</Text>
              <View style={styles.balanceActions}>
                <Pressable hitSlop={14} onPress={openBalanceEditor}>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={24}
                    color="#EAE7C7"
                  />
                </Pressable>
                <Pressable hitSlop={14} onPress={() => setHidden(!hidden)}>
                  <Feather
                    name={hidden ? "eye-off" : "eye"}
                    size={27}
                    color="#EAE7C7"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={openBalanceEditor}>
              <Text style={styles.balance}>
                {hidden ? "••••••" : money(balance)}
              </Text>
            </Pressable>

            <Text style={styles.editHint}>Toque no saldo para editar</Text>
          </View>

          <Pressable style={styles.saveButton} onPress={demoAlert}>
            <Text style={styles.saveText}>Guardar</Text>
          </Pressable>
        </View>

        <View style={styles.salesCard}>
          <Text style={styles.salesLabel}>Vendas a receber</Text>
          <Text style={styles.salesValue}>R$ 0,00</Text>
        </View>

        <Pressable style={styles.detailsButton} onPress={goStatement}>
          <Text style={styles.detailsText}>Ver detalhes do saldo</Text>
        </Pressable>

        <Pressable style={styles.banner} onPress={demoAlert}>
          <View style={styles.bannerIcon}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={41}
              color="#242424"
            />
          </View>

          <Text style={styles.bannerText}>
            Falta pouco! Complete as etapas e libere todos os serviços gratuitos.
            <Text style={styles.bannerLink}> Saiba mais</Text>
          </Text>
        </Pressable>

        {!!lastUpdated && (
          <Text style={styles.updatedText}>Atualizado às {lastUpdated}</Text>
        )}
      </View>

      <View style={styles.services}>
        <View style={styles.topTabs}>
          <View style={[styles.topTab, styles.topTabSelected]}>
            <Text style={styles.topTabSelectedText}>Principais</Text>
            <View style={styles.activeLine} />
          </View>

          <Pressable style={styles.topTab} onPress={demoAlert}>
            <Text style={styles.topTabText}>Produtos{"\n"}e Serviços</Text>
          </Pressable>

          <Pressable style={styles.topTab} onPress={demoAlert}>
            <Text style={styles.topTabText}>Investimentos</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <ActionTile icon="qrcode-scan" label="Pix/QR Code" onPress={openPix} />
          <ActionTile
            icon="swap-horizontal"
            label="Transferências"
            onPress={demoAlert}
          />
          <ActionTile
            icon="credit-card-outline"
            label="Cartões"
            badge="TEM CRÉDITO"
            onPress={demoAlert}
          />
          <ActionTile
            icon="barcode-scan"
            label={"Pagar\nContas"}
            badge="PAGUE SEU IPVA"
            disabled
            onPress={demoAlert}
          />
          <ActionTile
            icon="cellphone-key"
            label={"Recargas e\nGift Cards"}
            disabled
            onPress={demoAlert}
          />
          <ActionTile
            icon="briefcase-plus-outline"
            label={"Antecipar\nFGTS"}
            badge="MENORES TAXAS"
            disabled
            onPress={demoAlert}
          />
        </View>
      </View>

      <View style={styles.advantages}>
        <Text style={styles.advantagesTitle}>Vantagens do VerdePay para você</Text>
        <Pressable style={styles.advantageCard} onPress={demoAlert}>
          <View style={styles.tealStripe} />
          <View style={styles.advantageTextArea}>
            <Text style={styles.advantageMain}>Vendeu, recebeu</Text>
            <Text style={styles.advantageSub}>Benefícios para sua conta.</Text>
          </View>
          <MaterialCommunityIcons name="cash-fast" size={45} color={GREEN} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function BalanceEditor({ visible, balance, onClose, onSave, onReset }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (visible) {
      setValue(
        Number(balance).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  }, [visible, balance]);

  const save = () => {
    const parsed = parseBRL(value);
    onSave(parsed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.centerModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.editBalanceCard}>
          <View style={styles.editBalanceHeader}>
            <View>
              <Text style={styles.editBalanceTitle}>Editar saldo</Text>
              <Text style={styles.editBalanceSub}>
                Valor fictício salvo neste aparelho.
              </Text>
            </View>
            <Pressable hitSlop={14} onPress={onClose}>
              <Ionicons name="close" size={28} color={TEXT} />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Novo saldo</Text>

          <View style={styles.moneyInputBox}>
            <Text style={styles.moneyPrefix}>R$</Text>
            <TextInput
              autoFocus
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor="#999"
              style={styles.moneyInput}
              selectTextOnFocus
            />
          </View>

          <Pressable style={styles.balanceSaveButton} onPress={save}>
            <Text style={styles.balanceSaveText}>Salvar saldo</Text>
          </Pressable>

          <Pressable style={styles.resetButton} onPress={onReset}>
            <MaterialCommunityIcons name="restore" size={20} color={GREEN_BUTTON} />
            <Text style={styles.resetText}>Restaurar R$ 5,00</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PixModal({ visible, close, balance, complete }) {
  const [step, setStep] = useState(1);
  const [pixKey, setPixKey] = useState("");
  const [value, setValue] = useState("");
  const fade = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setPixKey("");
      setValue("");
      fade.setValue(1);
      translate.setValue(0);
    }
  }, [visible, fade, translate]);

  const amount = useMemo(() => parseBRL(value), [value]);

  const animateTo = (nextStep) => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 15,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      fade.setValue(0);
      translate.setValue(15);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const keyNext = () => {
    if (pixKey.trim().length < 3) {
      Alert.alert("Chave inválida", "Digite uma chave fictícia para continuar.");
      return;
    }
    animateTo(2);
  };

  const amountNext = () => {
    if (amount <= 0) {
      Alert.alert("Valor inválido", "Informe um valor maior que zero.");
      return;
    }
    if (amount > balance) {
      Alert.alert("Saldo insuficiente", "O saldo fictício não é suficiente.");
      return;
    }
    animateTo(3);
  };

  const confirm = () => {
    complete({
      id: String(Date.now()),
      key: pixKey.trim(),
      amount,
      date: nowBR(),
      auth: "SIM-" + String(Date.now()).slice(-9),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.pixSheet}>
          <View style={styles.handle} />

          <View style={styles.pixHeader}>
            <Pressable
              hitSlop={15}
              onPress={() => (step === 1 ? close() : animateTo(step - 1))}
            >
              <Ionicons
                name={step === 1 ? "close" : "arrow-back"}
                size={29}
                color={TEXT}
              />
            </Pressable>
            <Text style={styles.pixHeaderTitle}>Pix</Text>
            <View style={{ width: 29 }} />
          </View>

          <Animated.View
            style={[
              styles.pixContent,
              { opacity: fade, transform: [{ translateY: translate }] },
            ]}
          >
            {step === 1 && (
              <>
                <View style={styles.demoTag}>
                  <Text style={styles.demoTagText}>SIMULAÇÃO</Text>
                </View>

                <View style={styles.pixBigIcon}>
                  <MaterialCommunityIcons name="pix" size={44} color={BLUE} />
                </View>

                <Text style={styles.pixTitle}>Para quem você quer enviar?</Text>
                <Text style={styles.pixSubtitle}>
                  Digite uma chave fictícia. Nenhuma transferência real será realizada.
                </Text>

                <Text style={styles.inputLabel}>Chave Pix</Text>
                <TextInput
                  value={pixKey}
                  onChangeText={setPixKey}
                  placeholder="exemplo@teste.com"
                  placeholderTextColor="#9A9A9A"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <Pressable style={styles.pixContinue} onPress={keyNext}>
                  <Text style={styles.pixContinueText}>Continuar</Text>
                </Pressable>
              </>
            )}

            {step === 2 && (
              <>
                <View style={styles.pixBigIcon}>
                  <MaterialCommunityIcons name="cash" size={45} color={BLUE} />
                </View>

                <Text style={styles.pixTitle}>Qual é o valor?</Text>
                <Text style={styles.pixSubtitle}>
                  Saldo fictício disponível: {money(balance)}
                </Text>

                <Text style={styles.inputLabel}>Valor</Text>
                <View style={styles.moneyInputBox}>
                  <Text style={styles.moneyPrefix}>R$</Text>
                  <TextInput
                    value={value}
                    onChangeText={setValue}
                    keyboardType="decimal-pad"
                    placeholder="0,00"
                    placeholderTextColor="#999"
                    style={styles.moneyInput}
                  />
                </View>

                <Pressable style={styles.pixContinue} onPress={amountNext}>
                  <Text style={styles.pixContinueText}>Continuar</Text>
                </Pressable>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.pixTitle}>Confira os dados</Text>
                <Text style={styles.pixSubtitle}>
                  Revise antes de concluir a simulação.
                </Text>

                <View style={styles.review}>
                  <Text style={styles.reviewSmall}>Valor</Text>
                  <Text style={styles.reviewAmount}>{money(amount)}</Text>
                  <View style={styles.divider} />

                  <Text style={styles.reviewSmall}>Para</Text>
                  <Text style={styles.reviewNormal}>{pixKey}</Text>

                  <Text style={styles.reviewSmall}>Tipo</Text>
                  <Text style={styles.reviewNormal}>Pix fictício</Text>
                </View>

                <View style={styles.demoWarning}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#806000"
                  />
                  <Text style={styles.demoWarningText}>
                    Essa operação existe somente dentro do protótipo.
                  </Text>
                </View>

                <Pressable style={styles.pixContinue} onPress={confirm}>
                  <Text style={styles.pixContinueText}>Confirmar simulação</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Receipt({ transaction, close }) {
  if (!transaction) return null;

  const share = async () => {
    const message = `
VERDEPAY

COMPROVANTE DE SIMULAÇÃO
SEM VALOR FINANCEIRO

Pix simulado

Valor:
${money(transaction.amount)}

Chave fictícia:
${transaction.key}

Data:
${transaction.date}

Código:
${transaction.auth}

Este documento pertence a um protótipo e não comprova pagamento, transferência ou movimentação financeira real.
    `.trim();

    try {
      await Share.share({ message });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar.");
    }
  };

  return (
    <Modal
      visible={!!transaction}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.receiptOverlay}>
        <ScrollView contentContainerStyle={styles.receiptScroll}>
          <View style={styles.receipt}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={39} color={WHITE} />
            </View>

            <Text style={styles.receiptStatus}>Pix simulado concluído</Text>
            <Text style={styles.receiptValue}>{money(transaction.amount)}</Text>

            <View style={styles.fakeStamp}>
              <Text style={styles.fakeStampBig}>SIMULAÇÃO</Text>
              <Text style={styles.fakeStampSmall}>SEM VALOR FINANCEIRO</Text>
            </View>

            <View style={styles.receiptDetails}>
              <Text style={styles.receiptLabel}>Chave fictícia</Text>
              <Text style={styles.receiptData}>{transaction.key}</Text>

              <Text style={styles.receiptLabel}>Data e hora</Text>
              <Text style={styles.receiptData}>{transaction.date}</Text>

              <Text style={styles.receiptLabel}>Código da simulação</Text>
              <Text style={styles.receiptData}>{transaction.auth}</Text>
            </View>

            <Text style={styles.receiptLegal}>
              Este comprovante pertence a um protótipo. Ele não representa uma
              operação bancária real.
            </Text>

            <Pressable style={styles.shareButton} onPress={share}>
              <MaterialCommunityIcons
                name="share-variant"
                size={21}
                color={WHITE}
              />
              <Text style={styles.shareText}>Compartilhar demonstração</Text>
            </Pressable>

            <Pressable style={styles.closeReceipt} onPress={close}>
              <Text style={styles.closeReceiptText}>Voltar ao início</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Statement({ transactions }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Extrato</Text>
      <Text style={styles.screenSubtitle}>Movimentações simuladas</Text>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={55}
            color="#888"
          />
          <Text style={styles.emptyTitle}>Nenhuma movimentação</Text>
          <Text style={styles.emptyText}>
            Faça um Pix simulado para aparecer aqui.
          </Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <View style={styles.transaction} key={tx.id}>
            <View style={styles.transactionIcon}>
              <MaterialCommunityIcons name="pix" size={27} color={BLUE} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.transactionTitle}>Pix enviado</Text>
              <Text style={styles.transactionDemo}>SIMULAÇÃO</Text>
              <Text style={styles.transactionInfo}>{tx.key}</Text>
              <Text style={styles.transactionDate}>{tx.date}</Text>
            </View>

            <Text style={styles.transactionValue}>- {money(tx.amount)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Placeholder({ title, icon }) {
  return (
    <View style={styles.placeholder}>
      <MaterialCommunityIcons name={icon} size={72} color={GREEN} />
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderText}>
        Área demonstrativa do protótipo.
      </Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [balance, setBalance] = useState(5);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [balanceEditor, setBalanceEditor] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [storedBalance, storedTransactions] = await Promise.all([
          AsyncStorage.getItem(STORAGE.balance),
          AsyncStorage.getItem(STORAGE.transactions),
        ]);

        if (storedBalance !== null) {
          const parsed = Number(storedBalance);
          if (Number.isFinite(parsed)) setBalance(parsed);
        }

        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          if (Array.isArray(parsed)) setTransactions(parsed);
        }
      } catch {
        // Mantém valores padrão se o armazenamento estiver indisponível.
      } finally {
        setReady(true);
        requestAnimationFrame(() => {
          SplashScreen.hideAsync().catch(() => {});
        });
      }
    })();
  }, []);

  const persistBalance = async (next) => {
    setBalance(next);
    try {
      await AsyncStorage.setItem(STORAGE.balance, String(next));
    } catch {}
  };

  const persistTransactions = async (next) => {
    setTransactions(next);
    try {
      await AsyncStorage.setItem(STORAGE.transactions, JSON.stringify(next));
    } catch {}
  };

  const saveBalance = async (next) => {
    await persistBalance(next);
    setBalanceEditor(false);
  };

  const resetBalance = async () => {
    await persistBalance(5);
    setBalanceEditor(false);
  };

  const finishPix = async (transaction) => {
    const nextBalance = Math.max(0, balance - transaction.amount);
    const nextTransactions = [transaction, ...transactions];

    await Promise.all([
      persistBalance(nextBalance),
      persistTransactions(nextTransactions),
    ]);

    setPixOpen(false);
    setTimeout(() => setReceipt(transaction), 220);
  };

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 900);
  };

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: GREEN }} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      <View style={styles.app}>
        {tab === "home" && (
          <Home
            balance={balance}
            hidden={balanceHidden}
            setHidden={setBalanceHidden}
            openBalanceEditor={() => setBalanceEditor(true)}
            openPix={() => setPixOpen(true)}
            goStatement={() => setTab("statement")}
            refreshing={refreshing}
            onRefresh={refresh}
            lastUpdated={lastUpdated}
          />
        )}

        {tab === "statement" && <Statement transactions={transactions} />}

        {tab === "sales" && (
          <Placeholder title="Vendas" icon="storefront-outline" />
        )}

        {tab === "cards" && (
          <Placeholder title="Cartões" icon="credit-card-outline" />
        )}

        <BottomNavigation active={tab} setActive={setTab} />
      </View>

      <BalanceEditor
        visible={balanceEditor}
        balance={balance}
        onClose={() => setBalanceEditor(false)}
        onSave={saveBalance}
        onReset={resetBalance}
      />

      <PixModal
        visible={pixOpen}
        close={() => setPixOpen(false)}
        balance={balance}
        complete={finishPix}
      />

      <Receipt
        transaction={receipt}
        close={() => {
          setReceipt(null);
          setTab("home");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN },
  app: { flex: 1, backgroundColor: BG },

  greenArea: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },

  header: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoRow: { flexDirection: "row", alignItems: "center" },

  logo: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "#F9FAF7",
    borderWidth: 2,
    borderColor: "#1F3427",
    overflow: "hidden",
    marginRight: 9,
  },

  logoBlue: {
    position: "absolute",
    width: 31,
    height: 31,
    borderRadius: 18,
    backgroundColor: "#A5E0EC",
    left: 2,
    top: 3,
  },

  logoYellow: {
    position: "absolute",
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: "#FFDE3D",
    right: 2,
    top: 10,
    borderWidth: 1.5,
    borderColor: "#273B2C",
  },

  logoWhite: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 11,
    backgroundColor: "#ECF8EC",
    left: 5,
    bottom: 2,
  },

  logoText: {
    color: WHITE,
    fontSize: 25,
    fontWeight: "900",
    fontStyle: "italic",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },

  notification: {
    position: "absolute",
    top: -7,
    right: -8,
    minWidth: 21,
    height: 21,
    borderRadius: 12,
    backgroundColor: "#F31E24",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationText: { color: WHITE, fontWeight: "900", fontSize: 12 },

  refreshPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: -4,
    marginBottom: 9,
  },

  refreshPillText: {
    color: GREEN_BUTTON,
    fontWeight: "800",
    fontSize: 12,
  },

  balanceCard: {
    backgroundColor: GREEN_CARD,
    borderRadius: 20,
    minHeight: 160,
    padding: 24,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  balanceLeft: { flex: 1 },

  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },

  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  balanceLabel: { color: WHITE, fontSize: 28, fontWeight: "500" },

  balance: {
    color: WHITE,
    fontSize: 41,
    fontWeight: "900",
    marginTop: 7,
  },

  editHint: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    marginTop: 1,
  },

  saveButton: {
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 30,
    marginLeft: 10,
  },

  saveText: { color: WHITE, fontSize: 19, fontWeight: "800" },

  salesCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 24,
    backgroundColor: GREEN_CARD,
  },

  salesLabel: { color: WHITE, fontSize: 22 },
  salesValue: { color: WHITE, fontSize: 29, fontWeight: "900", marginTop: 2 },

  detailsButton: {
    marginTop: 14,
    borderRadius: 35,
    backgroundColor: GREEN_BUTTON,
    alignItems: "center",
    paddingVertical: 18,
  },

  detailsText: { color: "#EFEFD8", fontSize: 20, fontWeight: "900" },

  banner: {
    marginTop: 22,
    minHeight: 92,
    borderRadius: 17,
    backgroundColor: WHITE,
    flexDirection: "row",
    overflow: "hidden",
  },

  bannerIcon: {
    width: 87,
    backgroundColor: "#B9E5EB",
    alignItems: "center",
    justifyContent: "center",
  },

  bannerText: {
    flex: 1,
    paddingHorizontal: 13,
    alignSelf: "center",
    color: TEXT,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },

  bannerLink: { color: "#078E9D" },

  updatedText: {
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    fontSize: 10,
    marginTop: 10,
    marginBottom: -6,
  },

  services: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 31,
    borderTopRightRadius: 31,
    overflow: "hidden",
  },

  topTabs: {
    flexDirection: "row",
    height: 92,
    backgroundColor: "#E8F4F8",
  },

  topTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  topTabSelected: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 31,
  },

  topTabText: {
    color: "#141414",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20,
  },

  topTabSelectedText: {
    color: BLUE,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
  },

  activeLine: {
    position: "absolute",
    bottom: 0,
    width: 116,
    height: 4,
    backgroundColor: BLUE,
    borderRadius: 3,
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },

  tile: {
    width: "33.333%",
    height: 176,
    backgroundColor: WHITE,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },

  tileInside: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },

  badge: {
    position: "absolute",
    top: 16,
    backgroundColor: YELLOW,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  badgeText: { color: "#45400C", fontSize: 10, fontWeight: "900" },

  tileText: {
    marginTop: 14,
    color: TEXT,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 22,
  },

  advantages: { backgroundColor: BG, padding: 20 },

  advantagesTitle: {
    color: "#525252",
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 18,
  },

  advantageCard: {
    minHeight: 123,
    borderRadius: 17,
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
    overflow: "hidden",
  },

  tealStripe: {
    width: 15,
    alignSelf: "stretch",
    backgroundColor: "#21B89B",
    marginRight: 19,
  },

  advantageTextArea: { flex: 1 },
  advantageMain: { color: TEXT, fontSize: 22, fontWeight: "800" },
  advantageSub: { color: MUTED, fontSize: 14, marginTop: 5 },

  bottomNavigation: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 91,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 15 : 8,
    backgroundColor: WHITE,
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E7E7E7",
  },

  bottomButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  bottomText: { color: "#555", fontSize: 12, marginTop: 3 },

  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  editBalanceCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 22,
  },

  editBalanceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  editBalanceTitle: {
    color: TEXT,
    fontSize: 25,
    fontWeight: "900",
  },

  editBalanceSub: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
  },

  balanceSaveButton: {
    minHeight: 56,
    backgroundColor: GREEN_BUTTON,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  balanceSaveText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "900",
  },

  resetButton: {
    minHeight: 48,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  resetText: {
    color: GREEN_BUTTON,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.40)",
  },

  pixSheet: {
    height: "88%",
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
    backgroundColor: WHITE,
    overflow: "hidden",
  },

  handle: {
    width: 46,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#D5D5D5",
    alignSelf: "center",
    marginTop: 10,
  },

  pixHeader: {
    minHeight: 66,
    paddingHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#EFEFEF",
  },

  pixHeaderTitle: { color: TEXT, fontWeight: "900", fontSize: 19 },
  pixContent: { flex: 1, padding: 23 },

  demoTag: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1C7",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 9,
    marginBottom: 17,
  },

  demoTagText: { color: "#805B00", fontWeight: "900", fontSize: 11 },

  pixBigIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F7FA",
    marginBottom: 20,
  },

  pixTitle: { color: TEXT, fontWeight: "900", fontSize: 29, lineHeight: 35 },

  pixSubtitle: {
    color: MUTED,
    marginTop: 8,
    marginBottom: 27,
    fontSize: 15,
    lineHeight: 22,
  },

  inputLabel: {
    color: "#454545",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
  },

  input: {
    height: 59,
    borderWidth: 1.5,
    borderColor: "#D6D8DA",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
    color: TEXT,
  },

  moneyInputBox: {
    height: 68,
    borderWidth: 1.5,
    borderColor: "#D6D8DA",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  moneyPrefix: {
    fontSize: 21,
    fontWeight: "900",
    marginRight: 9,
    color: TEXT,
  },

  moneyInput: {
    flex: 1,
    color: TEXT,
    fontSize: 28,
    fontWeight: "800",
  },

  pixContinue: {
    marginTop: "auto",
    minHeight: 59,
    borderRadius: 30,
    backgroundColor: GREEN_BUTTON,
    alignItems: "center",
    justifyContent: "center",
  },

  pixContinueText: { color: WHITE, fontSize: 17, fontWeight: "900" },

  review: {
    marginTop: 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 18,
    padding: 20,
  },

  reviewSmall: {
    color: MUTED,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
  },

  reviewAmount: {
    color: TEXT,
    fontWeight: "900",
    fontSize: 32,
    marginTop: 4,
  },

  reviewNormal: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 3,
    marginBottom: 14,
  },

  divider: { height: 1, backgroundColor: "#DDD", marginVertical: 16 },

  demoWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#FFF5D4",
    padding: 13,
    marginTop: 15,
  },

  demoWarningText: {
    flex: 1,
    color: "#705500",
    fontSize: 13,
    lineHeight: 18,
  },

  receiptOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },

  receiptScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },

  receipt: {
    backgroundColor: WHITE,
    borderRadius: 25,
    padding: 23,
    alignItems: "center",
  },

  checkCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: GREEN_BUTTON,
    alignItems: "center",
    justifyContent: "center",
  },

  receiptStatus: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 14,
  },

  receiptValue: {
    color: TEXT,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 5,
  },

  fakeStamp: {
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#B87900",
    backgroundColor: "#FFF6D8",
    paddingVertical: 11,
    borderRadius: 13,
    marginTop: 17,
  },

  fakeStampBig: {
    color: "#A36900",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },

  fakeStampSmall: {
    color: "#A36900",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
  },

  receiptDetails: { width: "100%", marginTop: 20 },
  receiptLabel: { color: MUTED, fontSize: 11, fontWeight: "800", marginTop: 11 },
  receiptData: { color: TEXT, fontSize: 15, fontWeight: "800", marginTop: 3 },

  receiptLegal: {
    color: "#737373",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 20,
  },

  shareButton: {
    width: "100%",
    minHeight: 57,
    borderRadius: 29,
    backgroundColor: GREEN_BUTTON,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 17,
  },

  shareText: { color: WHITE, fontSize: 16, fontWeight: "900" },

  closeReceipt: {
    width: "100%",
    minHeight: 53,
    borderWidth: 1.5,
    borderColor: GREEN_BUTTON,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  closeReceiptText: { color: GREEN_BUTTON, fontSize: 16, fontWeight: "900" },

  screenTitle: {
    color: TEXT,
    fontSize: 31,
    fontWeight: "900",
    marginTop: 15,
  },

  screenSubtitle: {
    color: MUTED,
    fontSize: 15,
    marginTop: 5,
    marginBottom: 20,
  },

  transaction: {
    backgroundColor: WHITE,
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  transactionIcon: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: "#E8F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  transactionTitle: { color: TEXT, fontSize: 15, fontWeight: "900" },

  transactionDemo: {
    alignSelf: "flex-start",
    color: "#8B6300",
    fontSize: 9,
    fontWeight: "900",
    backgroundColor: "#FFF0C4",
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginTop: 3,
  },

  transactionInfo: { color: MUTED, fontSize: 12, marginTop: 5 },
  transactionDate: { color: "#999", fontSize: 11, marginTop: 2 },
  transactionValue: { color: "#A42D2D", fontWeight: "900", marginLeft: 10 },

  empty: {
    marginTop: 30,
    backgroundColor: WHITE,
    borderRadius: 19,
    padding: 32,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 14,
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },

  emptyText: { marginTop: 6, color: MUTED, textAlign: "center" },

  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
    backgroundColor: BG,
  },

  placeholderTitle: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 18,
  },

  placeholderText: { color: MUTED, fontSize: 15, marginTop: 7 },
});
