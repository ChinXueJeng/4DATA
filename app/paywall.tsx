import { useSubscription } from "@/contexts/SubscriptionContext";
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Paywall() {
  const { handleSubscriptionChange } = useSubscription();
  const router = useRouter();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
          const annual = offerings.current.availablePackages.find(
            p => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL
          );
          setSelectedPackage(annual || offerings.current.availablePackages[0]);
        }
      } catch (e) {
        console.error("Error fetching offerings", e);
        Alert.alert("Error", "Could not fetch subscription plans.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
        await handleSubscriptionChange();
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Purchase Failed", e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
        await handleSubscriptionChange();
        Alert.alert("Success", "Your purchases have been restored.");
        router.back();
      } else {
        Alert.alert("No Subscriptions", "We could not find any active premium subscriptions for this account.");
      }
    } catch (e: any) {
      Alert.alert("Restore Failed", e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>4Data Premium</Text>
          <Text style={styles.subtitle}>
            Complete analysis of all numbers and more{'\n'}detailed prediction data. Cancel anytime.
          </Text>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/paywall.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>

          {/* Plan Cards */}
          <View style={styles.plansContainer}>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#e00000"
                style={{ marginVertical: 30, alignSelf: 'center', flex: 1 }}
              />
            ) : packages.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 30, flex: 1, color: '#444' }}>
                No subscription plans found.
              </Text>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const isAnnual = pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL;
                const displayTitle = isAnnual ? 'ANNUAL' : 'MONTHLY';

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.planCard,
                      isSelected ? styles.planCardSelected : styles.planCardUnselected,
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                    activeOpacity={0.8}
                  >
                    {/* BEST VALUE badge — only on annual */}
                    {isAnnual && (
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </View>
                    )}

                    {/* Title + checkmark row */}
                    <View style={styles.planHeaderRow}>
                      <Text style={[
                        styles.planTitle,
                        isSelected ? styles.planTitleSelected : styles.planTitleUnselected,
                      ]}>
                        {displayTitle}
                      </Text>

                      {isSelected ? (
                        <View style={styles.checkCircleActive}>
                          <Ionicons name="checkmark" size={15} color="white" />
                        </View>
                      ) : (
                        <View style={styles.checkCircleInactive} />
                      )}
                    </View>

                    {/* Price */}
                    <Text style={styles.planPrice}>
                      {pkg.product.priceString}
                    </Text>

                    {/* Description */}
                    <Text style={styles.planSubtext}>
                      {pkg.product.description}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, isPurchasing && { opacity: 0.7 }]}
            onPress={handlePurchase}
            disabled={isPurchasing || packages.length === 0 || !selectedPackage}
            activeOpacity={0.85}
          >
            {isPurchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {selectedPackage?.product.introPrice
                  ? "Try Free For 7 Days"
                  : "Subscribe Now"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
              <Text style={styles.footerLinkText}>Restore Purchases</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            >
              <Text style={styles.footerLinkText}>Terms and conditions</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── Image ── */
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  /* ── Bottom ── */
  bottomSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },

  /* ── Plan Cards ── */
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    paddingTop: 20,       // extra top padding so badge doesn't overlap text
    position: 'relative',
    minHeight: 120,
  },
  planCardSelected: {
    borderColor: '#e00000',
    backgroundColor: '#ffffff',
  },
  planCardUnselected: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f7f7f7',
  },

  /* ── BEST VALUE badge ── */
  bestValueBadge: {
    position: 'absolute',
    top: -13,
    left: 12,
    backgroundColor: '#e00000',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    zIndex: 2,
  },
  bestValueText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* ── Plan header row ── */
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planTitleSelected: {
    color: '#000000',
  },
  planTitleUnselected: {
    color: '#222222',
  },

  /* ── Checkmark circles ── */
  checkCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e00000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cccccc',
    backgroundColor: 'transparent',
  },

  /* ── Price & subtext ── */
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  planSubtext: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
  },

  /* ── CTA Button ── */
  ctaButton: {
    backgroundColor: '#e00000',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#e00000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* ── Footer ── */
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '700',
  },
});