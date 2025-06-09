// pages/EstadisticasVentas.jsx - ADAPTADO AL NUEVO SISTEMA DE FILTROS
import React, { useState, useEffect, useMemo } from "react";
import { LoadingSpinner, ErrorMessage } from "../components/common";
import FilterBar from "../components/common/FilterBar"; // ← CAMBIO: Usar nuevo FilterBar
import {
  VentasResumen,
  VentasGraficos,
  VentasTablaVendedores,
} from "../components/ventas";
import { ProveedoresContainer } from "../components/ventas/proveedores";
import {
  formatDate,
  obtenerNombreMes,
  parseFechaRobusta,
} from "../utils/formatters";
import { empresasService, formasPagoService } from "../services/maestros";
import { analizarDuplicados } from "../utils/usuariosUtils";
import { useAdaptiveFilters } from "../hooks/useAdaptiveFilters";

const EstadisticasVentas = ({ data, contactos, usuarios }) => {
  const [filtros, setFiltros] = useState({
    año: "todos",
    mes: "todos",
    cliente: "todos",
    tienda: "todas",
    vendedor: "todos",
    fechaDesde: "",
    fechaHasta: "",
    // ← CAMBIO: Agregar filtros adicionales para contextos
    formaPago: "todas",
    empresa: "todas",
    proveedor: "todos",
    categoria: "todas",
    marca: "todas",
  });

  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  // Estados para datos de referencia
  const [empresas, setEmpresas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [duplicadosDetectados, setDuplicadosDetectados] = useState([]);

  // ← CAMBIO: Estructura de mapas compatible con nuevo sistema
  const [mapas, setMapas] = useState({
    mapaContactos: {},
    mapaUsuarios: {},
    mapaEmpresas: {},
    mapaFormasPago: {},
  });

  // Cargar datos de referencia al montar el componente
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoadingReferenceData(true);

        // Cargar empresas y formas de pago
        const [empresasData, formasPagoData] = await Promise.all([
          empresasService.getEmpresas(),
          formasPagoService.getFormasPago(),
        ]);

        setEmpresas(empresasData.emp_m || []);
        setFormasPago(formasPagoData.fpg_m || []);

        // Crear mapas de nombres
        const mapaContactosData = {};
        const mapaUsuariosData = {};
        const mapaEmpresasData = {};
        const mapaFormasPagoData = {};

        // Mapa de contactos
        if (contactos?.ent_m) {
          contactos.ent_m.forEach((contacto) => {
            if (contacto.id && contacto.name) {
              mapaContactosData[contacto.id] = contacto.name;
            }
          });
        }

        // Mapa de usuarios (con detección de duplicados)
        if (usuarios?.usr_m) {
          const usuariosList = usuarios.usr_m.filter((u) => u.id && u.name);
          const analisisDuplicados = analizarDuplicados(usuariosList);
          setDuplicadosDetectados(analisisDuplicados.duplicados);

          usuariosList.forEach((usuario) => {
            if (usuario.id && usuario.name) {
              mapaUsuariosData[usuario.id] = usuario.name;
            }
          });
        }

        // Mapa de empresas
        (empresasData.emp_m || []).forEach((empresa) => {
          if (empresa.id && empresa.name) {
            mapaEmpresasData[empresa.id] = empresa.name;
          }
        });

        // Mapa de formas de pago
        (formasPagoData.fpg_m || []).forEach((formaPago) => {
          if (formaPago.id && formaPago.name) {
            mapaFormasPagoData[formaPago.id] = formaPago.name;
          }
        });

        // ← CAMBIO: Actualizar estructura de mapas
        setMapas({
          mapaContactos: mapaContactosData,
          mapaUsuarios: mapaUsuariosData,
          mapaEmpresas: mapaEmpresasData,
          mapaFormasPago: mapaFormasPagoData,
        });
      } catch (err) {
        console.error("Error al cargar datos de referencia:", err);
        setError(err.message || "Error al cargar datos de referencia");
      } finally {
        setLoadingReferenceData(false);
      }
    };

    loadReferenceData();
  }, [contactos, usuarios]);

  // ← CAMBIO: Obtener contexto para filtros según la vista activa
  const getFilterContext = () => {
    const contextMap = {
      dashboard: "ventas",
      graficos: "ventas",
      vendedores: "ventas",
      proveedores: "proveedores",
      marcas: "productos",
      temporadas: "productos",
    };
    return contextMap[activeView] || "ventas";
  };

  // Aplicar filtros a los datos
  useEffect(() => {
    if (!data || !data.fac_t) return;

    setLoading(true);

    try {
      let filtered = [...data.fac_t];

      console.log("Aplicando filtros a ventas:", filtros);
      console.log(`Total registros iniciales: ${filtered.length}`);

      // Función auxiliar para parsear fechas
      const parseFecha = (fechaString) => {
        return parseFechaRobusta(fechaString);
      };

      // Filtrar por año
      if (filtros.año !== "todos") {
        const año = parseInt(filtros.año);
        filtered = filtered.filter((item) => {
          const itemAño =
            typeof item.eje === "string" ? parseInt(item.eje) : item.eje;
          return itemAño === año;
        });
      }

      // Filtrar por mes
      if (filtros.mes !== "todos") {
        const mes = parseInt(filtros.mes);
        filtered = filtered.filter((item) => {
          const itemMes =
            typeof item.mes === "string" ? parseInt(item.mes) : item.mes;
          return itemMes === mes;
        });
      }

      // Filtrar por vendedor
      if (filtros.vendedor !== "todos") {
        const vendedorIdSeleccionado = filtros.vendedor;
        filtered = filtered.filter((item) => {
          const itemVendedor = item.alt_usr;
          if (itemVendedor === undefined || itemVendedor === null) return false;
          return itemVendedor.toString() === vendedorIdSeleccionado;
        });
      }

      // ← CAMBIO: Agregar filtros adicionales según contexto
      const context = getFilterContext();

      if (context === "ventas") {
        // Filtros específicos de ventas
        if (filtros.cliente !== "todos") {
          filtered = filtered.filter((item) => item.cnt === filtros.cliente);
        }

        if (filtros.tienda !== "todas") {
          filtered = filtered.filter((item) => item.emp === filtros.tienda);
        }

        if (filtros.formaPago !== "todas") {
          filtered = filtered.filter((item) => item.fpa === filtros.formaPago);
        }

        if (filtros.empresa !== "todas") {
          filtered = filtered.filter((item) => item.emp === filtros.empresa);
        }
      }

      // Para proveedores y productos, los filtros específicos se aplicarían aquí
      // según la estructura de datos disponible

      // Filtrar por rango de fechas
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);

        filtered = filtered.filter((item) => {
          const fechaItem = parseFecha(item.fch);
          return fechaItem && fechaItem >= fechaDesde;
        });
      }

      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);

        filtered = filtered.filter((item) => {
          const fechaItem = parseFecha(item.fch);
          return fechaItem && fechaItem <= fechaHasta;
        });
      }

      console.log(`Total registros después de filtros: ${filtered.length}`);
      setFilteredData(filtered);
    } catch (err) {
      console.error("Error al filtrar datos:", err);
      setError(err.message || "Error al filtrar los datos");
    } finally {
      setLoading(false);
    }
  }, [data, filtros, activeView]); // ← CAMBIO: Agregar activeView como dependencia

  // Detectar qué filtros están activos
  const filtrosActivos = useMemo(() => {
    const activos = {
      vendedorEspecifico: filtros.vendedor !== "todos",
      mesEspecifico: filtros.mes !== "todos",
      añoEspecifico: filtros.año !== "todos",
      rangoFechas: filtros.fechaDesde || filtros.fechaHasta,
      mesSeleccionado: filtros.mes,
    };

    activos.hayFiltrosActivos = Object.values(activos).some((v) =>
      typeof v === "boolean" ? v : false
    );

    return activos;
  }, [filtros]);

  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    console.log(`Cambiando filtro ventas ${id} a:`, value);
    setFiltros((prev) => ({ ...prev, [id]: value }));
  };

  // ← CAMBIO: Resetear filtros según el contexto
  const handleResetFilters = () => {
    const baseReset = {
      año: "todos",
      mes: "todos",
      fechaDesde: "",
      fechaHasta: "",
    };

    const contextResets = {
      ventas: {
        ...baseReset,
        cliente: "todos",
        tienda: "todas",
        vendedor: "todos",
        formaPago: "todas",
        empresa: "todas",
      },
      proveedores: {
        ...baseReset,
        proveedor: "todos",
        categoria: "todas",
        marca: "todas",
      },
      productos: {
        ...baseReset,
        categoria: "todas",
        marca: "todas",
        proveedor: "todos",
      },
    };

    const context = getFilterContext();
    setFiltros((prev) => ({
      ...prev,
      ...(contextResets[context] || contextResets.ventas),
    }));
  };

  // Cambiar vista activa
  const handleViewChange = (view) => {
    setActiveView(view);
  };

  if (loadingReferenceData) {
    return <LoadingSpinner text="Cargando información de referencia..." />;
  }

  if (!data || !data.fac_t) {
    return <LoadingSpinner text="Cargando datos de ventas..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="estadisticas-ventas-container">
      {/* Header de la página */}
      <div className="page-header">
        <h1>
          <i className="fas fa-shopping-cart"></i>
          Análisis de Ventas
        </h1>
        <p className="page-subtitle">
          Dashboard completo con métricas, gráficos y análisis detallado por
          vendedores y proveedores
        </p>
      </div>

      {/* ← CAMBIO: Nuevo sistema de filtros adaptables */}
      <FilterBar
        context={getFilterContext()}
        data={data}
        mapas={mapas}
        filtros={filtros}
        empresasData={empresas} // ← AGREGAR ESTA LÍNEA
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        showAdvanced={activeView === "proveedores" || activeView === "marcas"}
      />

      {/* Información de filtros activos */}
      {filtrosActivos.hayFiltrosActivos && (
        <div className="filtros-activos-info">
          <i className="fas fa-info-circle"></i>
          <span>Filtros activos:</span>
          {filtros.año !== "todos" && <span>Año: {filtros.año}</span>}
          {filtros.mes !== "todos" && (
            <span>Mes: {obtenerNombreMes(parseInt(filtros.mes))}</span>
          )}
          {filtros.vendedor !== "todos" && (
            <span>
              Vendedor:{" "}
              {mapas.mapaUsuarios[filtros.vendedor] ||
                `Vendedor ${filtros.vendedor}`}
            </span>
          )}
          {filtros.fechaDesde && (
            <span>Desde: {formatDate(filtros.fechaDesde)}</span>
          )}
          {filtros.fechaHasta && (
            <span>Hasta: {formatDate(filtros.fechaHasta)}</span>
          )}
          <span className="filtros-count">
            ({filteredData.length} facturas)
          </span>
        </div>
      )}

      {/* Navegación entre vistas - CON PROVEEDORES HABILITADO */}
      <div className="ventas-navigation">
        <div className="nav-buttons">
          <button
            className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => handleViewChange("dashboard")}
          >
            <i className="fas fa-tachometer-alt"></i>
            Dashboard
          </button>
          <button
            className={`nav-btn ${activeView === "graficos" ? "active" : ""}`}
            onClick={() => handleViewChange("graficos")}
          >
            <i className="fas fa-chart-line"></i>
            Análisis Temporal
          </button>
          <button
            className={`nav-btn ${activeView === "vendedores" ? "active" : ""}`}
            onClick={() => handleViewChange("vendedores")}
          >
            <i className="fas fa-users"></i>
            Ranking Vendedores
          </button>
          <button
            className={`nav-btn ${
              activeView === "proveedores" ? "active" : ""
            }`}
            onClick={() => handleViewChange("proveedores")}
          >
            <i className="fas fa-industry"></i>
            Por Proveedores
          </button>
          <button
            className={`nav-btn ${activeView === "marcas" ? "active" : ""}`}
            onClick={() => handleViewChange("marcas")}
            disabled
            title="Funcionalidad en desarrollo"
          >
            <i className="fas fa-tags"></i>
            Por Marcas
            <span className="badge-desarrollo">PRÓXIMO</span>
          </button>
          <button
            className={`nav-btn ${activeView === "temporadas" ? "active" : ""}`}
            onClick={() => handleViewChange("temporadas")}
            disabled
            title="Funcionalidad en desarrollo"
          >
            <i className="fas fa-calendar-alt"></i>
            Por Temporadas
            <span className="badge-desarrollo">PRÓXIMO</span>
          </button>
        </div>
      </div>

      {/* Contenido según la vista activa */}
      <div className="ventas-content">
        {loading && <LoadingSpinner text="Aplicando filtros..." />}

        {!loading && activeView === "dashboard" && (
          <div className="dashboard-view">
            {/* Resumen principal */}
            <VentasResumen
              ventasData={filteredData}
              mapaContactos={mapas.mapaContactos}
              mapaUsuarios={mapas.mapaUsuarios}
              mapaFormasPago={mapas.mapaFormasPago}
              filtrosActivos={filtrosActivos}
            />

            {/* Vista rápida de gráficos principales */}
            <div className="dashboard-charts">
              <VentasGraficos
                ventasData={filteredData}
                mapaContactos={mapas.mapaContactos}
                mapaUsuarios={mapas.mapaUsuarios}
                mapaFormasPago={mapas.mapaFormasPago}
                mapaEmpresas={mapas.mapaEmpresas}
                filtrosActivos={filtrosActivos}
                filtros={filtros}
                viewMode="dashboard" // Solo mostrar gráficos principales
              />
            </div>
          </div>
        )}

        {!loading && activeView === "graficos" && (
          <div className="graficos-view">
            <VentasGraficos
              ventasData={filteredData}
              mapaContactos={mapas.mapaContactos}
              mapaUsuarios={mapas.mapaUsuarios}
              mapaFormasPago={mapas.mapaFormasPago}
              mapaEmpresas={mapas.mapaEmpresas}
              filtrosActivos={filtrosActivos}
              filtros={filtros}
              viewMode="full" // Mostrar todos los gráficos
            />
          </div>
        )}

        {!loading && activeView === "vendedores" && (
          <div className="vendedores-view">
            <VentasTablaVendedores
              ventasData={filteredData}
              mapaUsuarios={mapas.mapaUsuarios}
              filtros={filtros}
            />
          </div>
        )}

        {!loading && activeView === "proveedores" && (
          <div className="proveedores-view">
            <ProveedoresContainer
              filtros={filtros}
              filtrosActivos={filtrosActivos}
            />
          </div>
        )}

        {/* Secciones pendientes de implementar */}
        {!loading && activeView === "marcas" && (
          <div className="seccion-en-desarrollo">
            <div className="desarrollo-placeholder">
              <i className="fas fa-tags"></i>
              <h3>🏷️ Análisis por Marcas</h3>
              <p>
                Esta funcionalidad permitirá analizar las ventas segmentadas por
                marca de productos.
              </p>
              <div className="desarrollo-features">
                <div className="feature-item">
                  <i className="fas fa-chart-bar"></i>
                  <span>Ventas por marca y categoría</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-star"></i>
                  <span>Marcas más vendidas</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-percentage"></i>
                  <span>Márgenes por marca</span>
                </div>
              </div>
              <div className="desarrollo-nota">
                <i className="fas fa-info-circle"></i>
                <span>
                  Se implementará cuando estén disponibles los datos de líneas
                  de factura y productos
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading && activeView === "temporadas" && (
          <div className="seccion-en-desarrollo">
            <div className="desarrollo-placeholder">
              <i className="fas fa-calendar-alt"></i>
              <h3>🌱 Análisis por Temporadas</h3>
              <p>
                Esta funcionalidad permitirá analizar las ventas según
                temporadas y períodos específicos.
              </p>
              <div className="desarrollo-features">
                <div className="feature-item">
                  <i className="fas fa-chart-area"></i>
                  <span>Comparativa entre temporadas</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-leaf"></i>
                  <span>Productos estacionales</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-clock"></i>
                  <span>Ciclos de venta por temporada</span>
                </div>
              </div>
              <div className="desarrollo-nota">
                <i className="fas fa-info-circle"></i>
                <span>
                  Se implementará cuando estén disponibles los datos de
                  temporadas y clasificación de productos
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadisticasVentas;
