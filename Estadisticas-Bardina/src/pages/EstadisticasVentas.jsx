// pages/EstadisticasVentas.jsx - CON PROVEEDORES INTEGRADO
import React, { useState, useEffect, useMemo } from "react";
import { LoadingSpinner, ErrorMessage, FilterBar } from "../components/common";
import { VentasResumen, VentasGraficos, VentasTablaVendedores } from "../components/ventas";
import { ProveedoresContainer } from "../components/ventas/proveedores";
import {
  formatDate,
  obtenerNombreMes,
  parseFechaRobusta,
} from "../utils/formatters";
import {
  empresasService,
  formasPagoService,
} from "../services/maestros";
import { analizarDuplicados } from "../utils/usuariosUtils";

const EstadisticasVentas = ({ data, contactos, usuarios }) => {
  const [filtros, setFiltros] = useState({
    año: "todos",
    mes: "todos",
    cliente: "todos",
    tienda: "todas",
    vendedor: "todos",
    fechaDesde: "",
    fechaHasta: "",
  });

  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard"); // dashboard, graficos, vendedores, proveedores, marcas, temporadas

  // Estados para datos de referencia
  const [empresas, setEmpresas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [duplicadosDetectados, setDuplicadosDetectados] = useState([]);

  // Mapas para conversión ID -> Nombre
  const [mapaContactos, setMapaContactos] = useState({});
  const [mapaUsuarios, setMapaUsuarios] = useState({});
  const [mapaEmpresas, setMapaEmpresas] = useState({});
  const [mapaFormasPago, setMapaFormasPago] = useState({});

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

        setMapaContactos(mapaContactosData);
        setMapaUsuarios(mapaUsuariosData);
        setMapaEmpresas(mapaEmpresasData);
        setMapaFormasPago(mapaFormasPagoData);
      } catch (err) {
        console.error("Error al cargar datos de referencia:", err);
        setError(err.message || "Error al cargar datos de referencia");
      } finally {
        setLoadingReferenceData(false);
      }
    };

    loadReferenceData();
  }, [contactos, usuarios]);

  // Obtener años únicos de los datos
  const añosDisponibles = useMemo(() => {
    if (!data || !data.fac_t) return [];

    const años = new Set();
    data.fac_t.forEach((item) => {
      if (item.eje) años.add(item.eje);
    });

    return Array.from(años)
      .sort((a, b) => b - a)
      .map((año) => ({
        value: año.toString(),
        label: año.toString(),
      }));
  }, [data]);

  // Opciones simplificadas para filtros
  const opcionesMes = useMemo(() => {
    if (!data || !data.fac_t) return [];

    const meses = new Set();
    data.fac_t.forEach((item) => {
      if (item.mes) meses.add(item.mes);
    });

    return [
      { value: "todos", label: "Todos los meses" },
      ...Array.from(meses)
        .sort((a, b) => a - b)
        .map((mes) => ({
          value: mes.toString(),
          label: obtenerNombreMes(mes),
        })),
    ];
  }, [data]);

  const opcionesVendedor = useMemo(() => {
    if (!data || !data.fac_t || !Object.keys(mapaUsuarios).length) {
      return [{ value: "todos", label: "Cargando vendedores..." }];
    }

    // Calcular totales de ventas por vendedor
    const ventasPorVendedor = {};
    data.fac_t.forEach((item) => {
      if (item.alt_usr !== undefined && item.alt_usr !== null) {
        const vendedorId = item.alt_usr.toString();
        if (!ventasPorVendedor[vendedorId]) {
          ventasPorVendedor[vendedorId] = 0;
        }
        ventasPorVendedor[vendedorId] += item.tot || 0;
      }
    });

    // Filtrar solo vendedores con ventas > 0
    const vendedoresConVentasPositivas = Object.keys(ventasPorVendedor).filter(
      (vendedorId) => ventasPorVendedor[vendedorId] > 0
    );

    const opciones = [{ value: "todos", label: "Todos los vendedores" }];
    const nombresUsados = new Set();

    vendedoresConVentasPositivas
      .sort((a, b) => {
        const nombreA = mapaUsuarios[a] || `Vendedor ${a}`;
        const nombreB = mapaUsuarios[b] || `Vendedor ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .forEach((vendedorId) => {
        const nombreVendedor = mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`;

        if (!nombresUsados.has(nombreVendedor)) {
          nombresUsados.add(nombreVendedor);
          opciones.push({
            value: vendedorId,
            label: nombreVendedor,
          });
        }
      });

    return opciones;
  }, [data, mapaUsuarios]);

  // Configuración de filtros simplificada
  const filterConfig = [
    {
      id: "año",
      label: "Año",
      type: "select",
      value: filtros.año,
      options: [
        { value: "todos", label: "Todos los años" },
        ...añosDisponibles,
      ],
    },
    {
      id: "mes",
      label: "Mes",
      type: "select",
      value: filtros.mes,
      options: opcionesMes,
    },
    {
      id: "vendedor",
      label: "Vendedor",
      type: "select",
      value: filtros.vendedor,
      options: opcionesVendedor,
    },
    {
      id: "fechaDesde",
      label: "Desde",
      type: "date",
      value: filtros.fechaDesde,
    },
    {
      id: "fechaHasta",
      label: "Hasta",
      type: "date",
      value: filtros.fechaHasta,
    },
  ];

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
          const itemAño = typeof item.eje === "string" ? parseInt(item.eje) : item.eje;
          return itemAño === año;
        });
      }

      // Filtrar por mes
      if (filtros.mes !== "todos") {
        const mes = parseInt(filtros.mes);
        filtered = filtered.filter((item) => {
          const itemMes = typeof item.mes === "string" ? parseInt(item.mes) : item.mes;
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
  }, [data, filtros]);

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

  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      año: "todos",
      mes: "todos",
      cliente: "todos",
      tienda: "todas",
      vendedor: "todos",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  // Cambiar vista activa
  const handleViewChange = (view) => {
    setActiveView(view);
  };

  if (loadingReferenceData) {
    return (
      <LoadingSpinner text="Cargando información de referencia..." />
    );
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
          Dashboard completo con métricas, gráficos y análisis detallado por vendedores y proveedores
        </p>
      </div>

      {/* Filtros */}
      <FilterBar
        filters={filterConfig}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
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
              Vendedor: {mapaUsuarios[filtros.vendedor] || `Vendedor ${filtros.vendedor}`}
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
            className={`nav-btn ${activeView === "proveedores" ? "active" : ""}`}
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
              mapaContactos={mapaContactos}
              mapaUsuarios={mapaUsuarios}
              mapaFormasPago={mapaFormasPago}
              filtrosActivos={filtrosActivos}
            />

            {/* Vista rápida de gráficos principales */}
            <div className="dashboard-charts">
              <VentasGraficos
                ventasData={filteredData}
                mapaContactos={mapaContactos}
                mapaUsuarios={mapaUsuarios}
                mapaFormasPago={mapaFormasPago}
                mapaEmpresas={mapaEmpresas}
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
              mapaContactos={mapaContactos}
              mapaUsuarios={mapaUsuarios}
              mapaFormasPago={mapaFormasPago}
              mapaEmpresas={mapaEmpresas}
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
              mapaUsuarios={mapaUsuarios}
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
              <p>Esta funcionalidad permitirá analizar las ventas segmentadas por marca de productos.</p>
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
                <span>Se implementará cuando estén disponibles los datos de líneas de factura y productos</span>
              </div>
            </div>
          </div>
        )}

        {!loading && activeView === "temporadas" && (
          <div className="seccion-en-desarrollo">
            <div className="desarrollo-placeholder">
              <i className="fas fa-calendar-alt"></i>
              <h3>🌱 Análisis por Temporadas</h3>
              <p>Esta funcionalidad permitirá analizar las ventas según temporadas y períodos específicos.</p>
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
                <span>Se implementará cuando estén disponibles los datos de temporadas y clasificación de productos</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EstadisticasVentas;
