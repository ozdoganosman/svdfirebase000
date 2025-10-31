/**
 * Combo Discount Calculator
 *
 * Calculates combination discounts for products in the cart.
 * Example: When a customer buys "başlık" (cap) and "şişe" (bottle) with matching neck size,
 * they get a discount on both items up to the minimum quantity.
 */

/**
 * Find combo matches in cart items
 * @param {Array} cartItems - Cart items with product details
 * @param {Object} comboSettings - Combo discount settings
 * @returns {Array} Array of combo matches
 */
export function findComboMatches(cartItems, comboSettings) {
  if (!comboSettings || !comboSettings.isActive) {
    return [];
  }

  const { applicableTypes, requireSameNeckSize, minQuantity } = comboSettings;

  // Group items by productType and neckSize
  const groupedItems = {};

  cartItems.forEach((item, index) => {
    const { productType, neckSize } = item;

    // Skip items without required fields
    if (!productType || !applicableTypes.includes(productType)) {
      return;
    }

    // Create grouping key
    const key = requireSameNeckSize && neckSize ? `${neckSize}` : 'all';

    if (!groupedItems[key]) {
      groupedItems[key] = {};
    }

    if (!groupedItems[key][productType]) {
      groupedItems[key][productType] = [];
    }

    // Calculate total quantity for this item (considering packageInfo)
    const totalQuantity = item.packageInfo
      ? item.quantity * item.packageInfo.itemsPerBox
      : item.quantity;

    groupedItems[key][productType].push({
      ...item,
      totalQuantity,
      cartIndex: index,
    });
  });

  // Find matches within each neck size group
  const matches = [];

  Object.entries(groupedItems).forEach(([neckSizeKey, typeGroups]) => {
    const types = Object.keys(typeGroups);

    // Need at least 2 different types for a combo
    if (types.length < 2) {
      return;
    }

    // Find all possible combinations
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const type1 = types[i];
        const type2 = types[j];

        let items1 = typeGroups[type1];
        let items2 = typeGroups[type2];

        // Sort items by price (cheapest first) - ucuz olanlara öncelik
        // This ensures combo discount is applied to cheaper items first for maximum savings
        items1 = items1.sort((a, b) => {
          const priceA = a.comboPriceUSD ?? a.priceUSD ?? 0;
          const priceB = b.comboPriceUSD ?? b.priceUSD ?? 0;
          return priceA - priceB; // Ascending: cheapest first
        });

        items2 = items2.sort((a, b) => {
          const priceA = a.comboPriceUSD ?? a.priceUSD ?? 0;
          const priceB = b.comboPriceUSD ?? b.priceUSD ?? 0;
          return priceA - priceB; // Ascending: cheapest first
        });

        // Calculate total quantities for each type
        const totalQty1 = items1.reduce((sum, item) => sum + item.totalQuantity, 0);
        const totalQty2 = items2.reduce((sum, item) => sum + item.totalQuantity, 0);

        // Minimum quantity determines combo quantity
        const comboQty = Math.min(totalQty1, totalQty2);

        // Check if combo quantity meets minimum requirement
        if (comboQty < minQuantity) {
          continue;
        }

        matches.push({
          neckSize: neckSizeKey === 'all' ? null : neckSizeKey,
          type1,
          type2,
          items1,
          items2,
          totalQty1,
          totalQty2,
          comboQty,
          remainingQty1: totalQty1 - comboQty,
          remainingQty2: totalQty2 - comboQty,
        });
      }
    }
  });

  return matches;
}

/**
 * Calculate combo discount for a cart item
 * @param {Object} item - Cart item
 * @param {number} comboQty - Quantity eligible for combo discount
 * @param {Object} comboSettings - Combo settings
 * @param {number} exchangeRate - Current USD to TRY exchange rate
 * @returns {Object} Discount calculation result
 */
export function calculateItemComboDiscount(item, comboQty, comboSettings, exchangeRate = 34.0) {
  const { discountType, discountValue } = comboSettings;

  // Get base price (USD)
  const basePrice = item.comboPriceUSD ?? item.priceUSD ?? 0;

  if (basePrice === 0) {
    return {
      comboQty: 0,
      discountPerUnit: 0,
      totalDiscount: 0,
      comboPriceUSD: basePrice,
      comboPriceTRY: 0,
    };
  }

  let comboPriceUSD = basePrice;

  // Apply discount based on type
  if (discountType === 'percentage') {
    comboPriceUSD = basePrice * (1 - discountValue / 100);
  } else if (discountType === 'fixed') {
    comboPriceUSD = Math.max(0, basePrice - discountValue);
  }

  const discountPerUnit = basePrice - comboPriceUSD;
  const totalDiscount = discountPerUnit * comboQty;

  return {
    comboQty,
    discountPerUnit,
    totalDiscount,
    comboPriceUSD,
    comboPriceTRY: comboPriceUSD * exchangeRate,
  };
}

/**
 * Calculate total cart savings from combo discounts
 * @param {Array} matches - Combo matches
 * @param {Object} comboSettings - Combo settings
 * @param {number} exchangeRate - Current exchange rate
 * @returns {Object} Total savings calculation
 */
export function calculateTotalComboSavings(matches, comboSettings, exchangeRate = 34.0) {
  let totalSavingsUSD = 0;

  matches.forEach((match) => {
    // Calculate discount for type1 items
    match.items1.forEach((item) => {
      const itemComboQty = Math.min(item.totalQuantity, match.comboQty);
      const { totalDiscount } = calculateItemComboDiscount(
        item,
        itemComboQty,
        comboSettings,
        exchangeRate
      );
      totalSavingsUSD += totalDiscount;
    });

    // Calculate discount for type2 items
    match.items2.forEach((item) => {
      const itemComboQty = Math.min(item.totalQuantity, match.comboQty);
      const { totalDiscount } = calculateItemComboDiscount(
        item,
        itemComboQty,
        comboSettings,
        exchangeRate
      );
      totalSavingsUSD += totalDiscount;
    });
  });

  return {
    totalSavingsUSD,
    totalSavingsTRY: totalSavingsUSD * exchangeRate,
  };
}

/**
 * Apply combo discount to cart items
 * @param {Array} cartItems - Cart items
 * @param {Object} comboSettings - Combo settings
 * @param {number} exchangeRate - Current exchange rate
 * @returns {Object} Updated cart with combo discounts applied
 */
export function applyComboDiscounts(cartItems, comboSettings, exchangeRate = 34.0) {
  // Find combo matches
  const matches = findComboMatches(cartItems, comboSettings);

  if (matches.length === 0) {
    return {
      items: cartItems,
      matches: [],
      totalSavings: {
        totalSavingsUSD: 0,
        totalSavingsTRY: 0,
      },
    };
  }

  // Create a map to track combo quantities for each item
  const itemComboQtyMap = new Map();

  matches.forEach((match) => {
    // Distribute combo quantity across items
    let remainingComboQty1 = match.comboQty;
    let remainingComboQty2 = match.comboQty;

    match.items1.forEach((item) => {
      const itemComboQty = Math.min(item.totalQuantity, remainingComboQty1);
      itemComboQtyMap.set(item.cartIndex, (itemComboQtyMap.get(item.cartIndex) || 0) + itemComboQty);
      remainingComboQty1 -= itemComboQty;
    });

    match.items2.forEach((item) => {
      const itemComboQty = Math.min(item.totalQuantity, remainingComboQty2);
      itemComboQtyMap.set(item.cartIndex, (itemComboQtyMap.get(item.cartIndex) || 0) + itemComboQty);
      remainingComboQty2 -= itemComboQty;
    });
  });

  // Calculate total savings
  const totalSavings = calculateTotalComboSavings(matches, comboSettings, exchangeRate);

  return {
    items: cartItems.map((item, index) => ({
      ...item,
      comboQty: itemComboQtyMap.get(index) || 0,
    })),
    matches,
    totalSavings,
  };
}

/**
 * Format combo discount message for display
 * @param {Object} match - Combo match
 * @param {Object} comboSettings - Combo settings
 * @returns {string} Formatted message
 */
export function formatComboMessage(match, comboSettings) {
  const { neckSize, type1, type2, comboQty } = match;
  const { discountType, discountValue } = comboSettings;

  let discountText = '';
  if (discountType === 'percentage') {
    discountText = `%${discountValue} indirim`;
  } else if (discountType === 'fixed') {
    discountText = `$${discountValue.toFixed(2)} indirim`;
  }

  const neckSizeText = neckSize ? ` (Ağız Ölçüsü: ${neckSize})` : '';

  return `🔄 ${type1.toUpperCase()}-${type2.toUpperCase()} KOMBİNASYONU${neckSizeText}\n` +
    `Eşleşen Miktar: ${comboQty.toLocaleString('tr-TR')} adet\n` +
    `Kombo ${discountText} uygulandı!`;
}
