package com.abwcurious.restaurant.inventory;

import com.abwcurious.restaurant.menu.MenuItem;
import com.abwcurious.restaurant.menu.Recipe;
import com.abwcurious.restaurant.menu.RecipeRepository;
import com.abwcurious.restaurant.order.Order;
import com.abwcurious.restaurant.order.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final RecipeRepository recipeRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final IngredientRepository ingredientRepository;
    private final StockLedgerRepository stockLedgerRepository;

    @Transactional
    public void deductStockForOrder(Order order) {
        log.info("Deducting stock for Order ID: {} - Number: {}", order.getId(), order.getOrderNumber());

        for (OrderItem item : order.getItems()) {
            MenuItem menuItem = item.getMenuItem();
            Long variantId = item.getVariant() != null ? item.getVariant().getId() : null;

            // Find recipe for this item (or item + variant)
            Optional<Recipe> recipeOpt = variantId != null 
                    ? recipeRepository.findByMenuItemIdAndVariantId(menuItem.getId(), variantId)
                    : recipeRepository.findByMenuItemIdAndVariantIdIsNull(menuItem.getId());

            // Fallback to basic menu item recipe if variant recipe is not found
            if (recipeOpt.isEmpty() && variantId != null) {
                recipeOpt = recipeRepository.findByMenuItemIdAndVariantIdIsNull(menuItem.getId());
            }

            if (recipeOpt.isPresent()) {
                Recipe recipe = recipeOpt.get();
                List<RecipeItem> recipeItems = recipeItemRepository.findByRecipeId(recipe.getId());

                for (RecipeItem recipeItem : recipeItems) {
                    Ingredient ingredient = recipeItem.getIngredient();
                    BigDecimal deductionQty = recipeItem.getQuantity()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));

                    // Deduct stock
                    BigDecimal newStock = ingredient.getCurrentStock().subtract(deductionQty);
                    ingredient.setCurrentStock(newStock);
                    ingredientRepository.save(ingredient);

                    // Create ledger entry
                    StockLedger ledgerEntry = StockLedger.builder()
                            .uuid(UUID.randomUUID().toString())
                            .outlet(order.getOutlet())
                            .ingredient(ingredient)
                            .transactionType("SALE_DEDUCTION")
                            .quantity(deductionQty.negate()) // Ledger takes negative value for deduction
                            .referenceId(order.getId())
                            .notes("Sale deduction for Order: " + order.getOrderNumber())
                            .createdAt(LocalDateTime.now())
                            .build();

                    stockLedgerRepository.save(ledgerEntry);

                    // Check low stock
                    if (newStock.compareTo(ingredient.getMinStockLevel()) < 0) {
                        log.warn("ALERT: Ingredient {} is low in stock! Current: {}, Min Threshold: {}", 
                                ingredient.getName(), newStock, ingredient.getMinStockLevel());
                    }
                }
            } else {
                log.info("No recipe mapped for Menu Item: {} (SKU: {}). Skipping stock deduction.", 
                        menuItem.getName(), menuItem.getSku());
            }
        }
    }

    @Transactional
    public void receiveInventory(Long purchaseOrderId, List<PurchaseItem> items, Long outletId) {
        log.info("Processing receiving inventory for PO: {}", purchaseOrderId);
        for (PurchaseItem item : items) {
            Ingredient ingredient = item.getIngredient();
            BigDecimal receivedQty = item.getQuantity();

            BigDecimal newStock = ingredient.getCurrentStock().add(receivedQty);
            ingredient.setCurrentStock(newStock);
            ingredientRepository.save(ingredient);

            StockLedger ledgerEntry = StockLedger.builder()
                    .uuid(UUID.randomUUID().toString())
                    .outlet(ingredient.getOutlet())
                    .ingredient(ingredient)
                    .transactionType("PURCHASE")
                    .quantity(receivedQty)
                    .unitPrice(item.getUnitPrice())
                    .referenceId(purchaseOrderId)
                    .notes("Purchase Order Received ID: " + purchaseOrderId)
                    .createdAt(LocalDateTime.now())
                    .build();

            stockLedgerRepository.save(ledgerEntry);
        }
    }
}
