import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Meal, Plan } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '@/db';

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cartData = await AsyncStorage.getItem('cart');
      if (cartData) {
        setItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const saveCart = useCallback(async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      setError(null);
    } catch (error) {
      console.error('Error saving cart:', error);
      setError('Failed to save cart');
      throw error;
    }
  }, []);

  const addToCart = useCallback(async (
    meal: Meal,
    plan?: Plan,
    addOns: string[] = [],
    mealType: 'veg' | 'nonveg' | 'egg' = 'veg',
    quantity: number = 1
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartItem: CartItem = {
        id: Date.now().toString(),
        type: plan ? 'subscription' : 'meal',
        mealId: meal.id,
        planId: plan?.id,
        quantity,
        addOns,
        mealType,
        price: plan ? meal.price * plan.days * (1 - plan.discount / 100) : meal.price,
      };

      const newItems = [...items, cartItem];
      setItems(newItems);
      await saveCart(newItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  }, [items, saveCart]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setError(null);
      const newItems = items.filter(item => item.id !== itemId);
      setItems(newItems);
      await saveCart(newItems);
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item from cart');
    }
  }, [items, saveCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setError(null);
      
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const newItems = items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setItems(newItems);
      await saveCart(newItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update item quantity');
    }
  }, [items, removeFromCart, saveCart]);

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      setItems([]);
      await AsyncStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    }
  }, []);

  const getCartTotal = useCallback(async () => {
    try {
      let total = 0;
      
      for (const item of items) {
        const meal = await db.getMealById(item.mealId);
        if (meal) {
          let itemPrice = meal.price * item.quantity;
          
          if (item.planId) {
            const plan = await db.getPlanById(item.planId);
            if (plan) {
              itemPrice = meal.price * plan.days * (1 - plan.discount / 100) * item.quantity;
            }
          }

          for (const addOnId of item.addOns) {
            const addOn = await db.getAddOnById(addOnId);
            if (addOn) {
              itemPrice += addOn.price * item.quantity;
            }
          }

          total += itemPrice;
        }
      }
      
      return total;
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    items,
    isLoading,
    error,
    itemCount,
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    clearError,
  }), [items, isLoading, error, itemCount, loadCart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, clearError]);
});