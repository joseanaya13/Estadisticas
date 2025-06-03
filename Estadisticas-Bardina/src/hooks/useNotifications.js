// src/hooks/useNotifications.js
import { useCallback } from 'react';
import useAppStore from '../stores/useAppStore';

/**
 * Hook para manejar notificaciones usando toast nativo (fallback)
 */
export const useNotifications = () => {
  const { ui } = useAppStore();

  const showNotification = useCallback((message, type = 'success', options = {}) => {
    if (!ui.notifications) return;

    // Fallback sin react-hot-toast para no romper la app
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Si react-hot-toast está disponible, usarlo
    if (typeof window !== 'undefined' && window.toast) {
      switch (type) {
        case 'success':
          window.toast.success(message);
          break;
        case 'error':
          window.toast.error(message);
          break;
        case 'warning':
          window.toast.error(message, { icon: '⚠️' });
          break;
        case 'info':
          window.toast(message, { icon: 'ℹ️' });
          break;
        default:
          window.toast(message);
      }
    } else {
      // Fallback con alert nativo
      if (type === 'error' || type === 'warning') {
        alert(`${type.toUpperCase()}: ${message}`);
      }
    }
  }, [ui.notifications]);

  const showLoadingNotification = useCallback((message) => {
    console.log(`⏳ LOADING: ${message}`);
    return null; // Retorna null como ID falso
  }, []);

  const dismissNotification = useCallback((toastId) => {
    console.log(`❌ Dismissing notification: ${toastId}`);
  }, []);

  return {
    showNotification,
    showLoadingNotification,
    dismissNotification
  };
};