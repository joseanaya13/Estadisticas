// src/stores/useAppStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store global de la aplicación usando Zustand
 * Maneja datos principales, filtros y estado de UI
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      // === DATOS PRINCIPALES ===
      data: {
        ventas: null,
        compras: null,
        contactos: null,
        usuarios: null,
        empresas: null,
        formasPago: null,
        // Nuevos datos
        articulos: null,
        proveedores: null,
        marcas: null,
        lineasVentas: null,
        stock: null,
        lastUpdate: null
      },

      // === ESTADO DE CARGA ===
      loading: {
        global: false,
        ventas: false,
        compras: false,
        maestros: false
      },

      // === ERRORES ===
      errors: {
        global: null,
        ventas: null,
        compras: null,
        maestros: null
      },

      // === FILTROS GLOBALES (PERSISTENTES) ===
      filters: {
        // Filtros temporales
        dateRange: {
          from: null,
          to: null
        },
        selectedYear: new Date().getFullYear().toString(),
        selectedMonth: 'todos',
        
        // Filtros de entidades
        selectedStore: 'todas',
        selectedVendedor: 'todos',
        selectedCliente: 'todos',
        selectedProveedor: 'todos',
        selectedMarca: 'todas',
        
        // Filtros específicos
        soloVentasPositivas: true,
        incluirDevoluciones: true
      },

      // === CONFIGURACIÓN DE UI ===
      ui: {
        theme: 'light',
        sidebarCollapsed: false,
        exportFormat: 'excel',
        chartsHeight: 300,
        tablePageSize: 50,
        notifications: true
      },

      // === MAPAS DE NOMBRES (CACHE) ===
      nameMaps: {
        contactos: {},
        usuarios: {},
        empresas: {},
        formasPago: {},
        proveedores: {},
        marcas: {},
        articulos: {}
      },

      // === ACTIONS ===

      // Setear datos
      setData: (dataType, data) => set((state) => ({
        data: {
          ...state.data,
          [dataType]: data,
          lastUpdate: new Date().toISOString()
        }
      })),

      // Setear múltiples datos
      setMultipleData: (dataUpdates) => set((state) => ({
        data: {
          ...state.data,
          ...dataUpdates,
          lastUpdate: new Date().toISOString()
        }
      })),

      // Setear loading
      setLoading: (loadingType, isLoading) => set((state) => ({
        loading: {
          ...state.loading,
          [loadingType]: isLoading
        }
      })),

      // Setear error
      setError: (errorType, error) => set((state) => ({
        errors: {
          ...state.errors,
          [errorType]: error
        }
      })),

      // Limpiar error
      clearError: (errorType) => set((state) => ({
        errors: {
          ...state.errors,
          [errorType]: null
        }
      })),

      // Limpiar todos los errores
      clearAllErrors: () => set((state) => ({
        errors: {
          global: null,
          ventas: null,
          compras: null,
          maestros: null
        }
      })),

      // Actualizar filtros
      updateFilters: (newFilters) => set((state) => ({
        filters: {
          ...state.filters,
          ...newFilters
        }
      })),

      // Resetear filtros
      resetFilters: () => set(() => ({
        filters: {
          dateRange: { from: null, to: null },
          selectedYear: new Date().getFullYear().toString(),
          selectedMonth: 'todos',
          selectedStore: 'todas',
          selectedVendedor: 'todos',
          selectedCliente: 'todos',
          selectedProveedor: 'todos',
          selectedMarca: 'todas',
          soloVentasPositivas: true,
          incluirDevoluciones: true
        }
      })),

      // Actualizar configuración UI
      updateUI: (uiUpdates) => set((state) => ({
        ui: {
          ...state.ui,
          ...uiUpdates
        }
      })),

      // Actualizar mapas de nombres
      updateNameMaps: (mapType, newMap) => set((state) => ({
        nameMaps: {
          ...state.nameMaps,
          [mapType]: newMap
        }
      })),

      // === SELECTORS (funciones derivadas) ===

      // Obtener datos filtrados de ventas
      getFilteredVentas: () => {
        const { data, filters } = get();
        if (!data.ventas?.fac_t) return [];

        let filtered = [...data.ventas.fac_t];

        // Filtrar por año
        if (filters.selectedYear !== 'todos') {
          const year = parseInt(filters.selectedYear);
          filtered = filtered.filter(item => item.eje === year);
        }

        // Filtrar por mes
        if (filters.selectedMonth !== 'todos') {
          const month = parseInt(filters.selectedMonth);
          filtered = filtered.filter(item => item.mes === month);
        }

        // Filtrar por vendedor
        if (filters.selectedVendedor !== 'todos') {
          filtered = filtered.filter(item => 
            item.alt_usr?.toString() === filters.selectedVendedor
          );
        }

        // Filtrar por cliente
        if (filters.selectedCliente !== 'todos') {
          filtered = filtered.filter(item => 
            item.clt?.toString() === filters.selectedCliente
          );
        }

        // Filtrar por tienda
        if (filters.selectedStore !== 'todas') {
          filtered = filtered.filter(item => 
            item.emp?.toString() === filters.selectedStore ||
            item.emp_div?.toString() === filters.selectedStore
          );
        }

        // Filtrar por rango de fechas
        if (filters.dateRange.from) {
          const fromDate = new Date(filters.dateRange.from);
          filtered = filtered.filter(item => 
            new Date(item.fch) >= fromDate
          );
        }

        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          filtered = filtered.filter(item => 
            new Date(item.fch) <= toDate
          );
        }

        // Filtrar solo ventas positivas si está activado
        if (filters.soloVentasPositivas) {
          filtered = filtered.filter(item => (item.tot || 0) > 0);
        }

        return filtered;
      },

      // Verificar si hay filtros activos
      hasActiveFilters: () => {
        const { filters } = get();
        const currentYear = new Date().getFullYear().toString();
        
        return (
          filters.selectedYear !== currentYear ||
          filters.selectedMonth !== 'todos' ||
          filters.selectedStore !== 'todas' ||
          filters.selectedVendedor !== 'todos' ||
          filters.selectedCliente !== 'todos' ||
          filters.selectedProveedor !== 'todos' ||
          filters.selectedMarca !== 'todas' ||
          filters.dateRange.from ||
          filters.dateRange.to ||
          !filters.soloVentasPositivas ||
          !filters.incluirDevoluciones
        );
      },

      // Obtener información de filtros activos
      getActiveFiltersInfo: () => {
        const { filters, nameMaps } = get();
        const info = [];
        const currentYear = new Date().getFullYear().toString();
        
        if (filters.selectedYear !== currentYear) {
          info.push(`Año: ${filters.selectedYear}`);
        }
        
        if (filters.selectedMonth !== 'todos') {
          const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          info.push(`Mes: ${monthNames[parseInt(filters.selectedMonth) - 1]}`);
        }

        if (filters.selectedVendedor !== 'todos') {
          const nombre = nameMaps.usuarios[filters.selectedVendedor] || 
                        `Vendedor ${filters.selectedVendedor}`;
          info.push(`Vendedor: ${nombre}`);
        }

        if (filters.selectedCliente !== 'todos') {
          const nombre = nameMaps.contactos[filters.selectedCliente] || 
                        `Cliente ${filters.selectedCliente}`;
          info.push(`Cliente: ${nombre}`);
        }

        if (filters.selectedStore !== 'todas') {
          const nombre = nameMaps.empresas[filters.selectedStore] || 
                        `Tienda ${filters.selectedStore}`;
          info.push(`Tienda: ${nombre}`);
        }

        if (filters.dateRange.from && filters.dateRange.to) {
          info.push(`${filters.dateRange.from} - ${filters.dateRange.to}`);
        } else if (filters.dateRange.from) {
          info.push(`Desde: ${filters.dateRange.from}`);
        } else if (filters.dateRange.to) {
          info.push(`Hasta: ${filters.dateRange.to}`);
        }

        return info;
      },

      // Obtener estado de carga global
      isLoading: () => {
        const { loading } = get();
        return Object.values(loading).some(Boolean);
      },

      // Obtener errores activos
      getActiveErrors: () => {
        const { errors } = get();
        return Object.entries(errors)
          .filter(([_, error]) => error !== null)
          .map(([type, error]) => ({ type, error }));
      },

      // Verificar si los datos están cargados
      isDataLoaded: () => {
        const { data } = get();
        return !!(data.ventas && data.compras && data.contactos && data.usuarios);
      },

      // === UTILIDADES ===

      // Limpiar caché
      clearCache: () => set((state) => ({
        data: {
          ventas: null,
          compras: null,
          contactos: null,
          usuarios: null,
          empresas: null,
          formasPago: null,
          articulos: null,
          proveedores: null,
          marcas: null,
          lineasVentas: null,
          stock: null,
          lastUpdate: null
        },
        nameMaps: {
          contactos: {},
          usuarios: {},
          empresas: {},
          formasPago: {},
          proveedores: {},
          marcas: {},
          articulos: {}
        }
      })),

      // Debug: obtener estado completo
      getDebugInfo: () => {
        const state = get();
        return {
          dataLoaded: Object.entries(state.data)
            .filter(([key, value]) => key !== 'lastUpdate')
            .map(([key, value]) => ({ [key]: !!value })),
          filtersActive: state.hasActiveFilters(),
          errorsCount: state.getActiveErrors().length,
          lastUpdate: state.data.lastUpdate
        };
      }
    }),
    {
      name: 'bardina-app-store',
      partialize: (state) => ({
        // Solo persistir filtros y configuración UI
        filters: state.filters,
        ui: state.ui
      })
    }
  )
);

export default useAppStore;