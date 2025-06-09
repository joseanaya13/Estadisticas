// pages/EstadisticasVentas.jsx - ACTUALIZADO CON FILTROS ADAPTABLES
import React, { useState, useEffect, useMemo } from "react";
import { LoadingSpinner, ErrorMessage } from "../components/common";
import FilterBar from "../components/common/FilterBar"; // Componente actualizado
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

const EstadisticasVentas = ({ data, contactos, usuarios }) => {
  // Estados para filtros - Inicialización mejorada
  const [filtros, setFiltros] = useState({
    año: "todos",
    mes: "todos",
    cliente: "todos",
    tienda: "todas",
    vendedor: "todos",
    fechaDesde: "",
    fechaHasta: "",
    formaPago: "todas",
    empresa: "todas"
  });

  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  // Estados para datos de referencia
  const [empresas, setEmpresas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);

  // Mapas para conversión ID -> Nombre
  const [mapas, setMapas] = useState({
    mapaContactos: {},
    mapaUsuarios: {},
    mapaEmpresas: {},
    mapaFormasPago: {}
  });

  // Cargar datos de referencia al montar el componente
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoadingReferenceData(true);

        // Cargar empresas y formas de pago
        const [empresasData, formasPagoData] = await Promise.all([
          empresasService.getEmpresas(),
          formasPagoService.getFormasPago()
        ]);

        setEmpresas(empresasData.emp_m || []);
        setFormasPago(formasPagoData.fpa_m || []);

        // Crear mapas de conversión
        const mapaContactos = {};
        const mapaUsuarios = {};
        const mapaEmpresas = {};
        const mapaFormasPago = {};

        // Procesar contactos
        if (contactos && contactos.cnt_m) {
          contactos.cnt_m.forEach(contacto => {
            mapaContactos[contacto.cnt] = contacto.nom || `Cliente ${contacto.cnt}`;
          });
        }

        // Procesar usuarios
        if (usuarios && usuarios.usr_m) {
          usuarios.usr_m.forEach(usuario => {
            mapaUsuarios[usuario.usr] = usuario.nom || `Usuario ${usuario.usr}`;
          });
        }

        // Procesar empresas
        empresasData.emp_m?.forEach(empresa => {
          mapaEmpresas[empresa.emp] = empresa.nom || `Empresa ${empresa.emp}`;
        });

        // Procesar formas de pago
        formasPagoData.fpa_m?.forEach(forma => {
          mapaFormasPago[forma.fpa] = forma.nom || `Forma ${forma.fpa}`;
        });

        setMapas({
          mapaContactos,
          mapaUsuarios,
          mapaEmpresas,
          mapaFormasPago
        });

      } catch (err) {
        console.error('Error cargando datos de referencia:', err);
        setError('Error al cargar los datos de referencia');
      } finally {
        setLoadingReferenceData(false);
      }
    };

    loadReferenceData();
  }, [contactos, usuarios]);

  // Filtros activos para mostrar información
  const filtrosActivos = useMemo(() => {
    const activos = Object.entries(filtros).filter(([key, value]) => {
      return value !== "todos" && value !== "todas" && value !== "";
    });

    return {
      hayFiltrosActivos: activos.length > 0,
      cantidad: activos.length,
      lista: activos
    };
  }, [filtros]);

  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    console.log(`Cambiando filtro ${activeView} ${id} a:`, value);
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
      formaPago: "todas",
      empresa: "todas"
    });
  };

  // Cambiar vista activa
  const handleViewChange = (view) => {
    setActiveView(view);
    // Los filtros se mantienen pero se adaptan al contexto
  };

  // Aplicar filtros a los datos
  useEffect(() => {
    if (!data || !data.fac_t) return;

    setLoading(true);
    try {
      let filtered = [...data.fac_t];

      console.log("Aplicando filtros:", filtros);
      console.log(`Total registros iniciales: ${filtered.length}`);

      // Aplicar filtros uno por uno
      if (filtros.año !== "todos") {
        const año = parseInt(filtros.año);
        filtered = filtered.filter((item) => {
          const itemAño = typeof item.eje === "string" ? parseInt(item.eje) : item.eje;
          return itemAño === año;
        });
      }

      if (filtros.mes !== "todos") {
        const mes = parseInt(filtros.mes);
        filtered = filtered.filter((item) => {
          const itemMes = typeof item.mes === "string" ? parseInt(item.mes) : item.mes;
          return itemMes === mes;
        });
      }

      if (filtros.vendedor !== "todos") {
        filtered = filtered.filter((item) => item.usr === filtros.vendedor);
      }

      if (filtros.cliente !== "todos") {
        filtered = filtered.filter((item) => item.cnt === filtros.cliente);
      }

      if (filtros.tienda !== "todas") {
        filtered = filtered.filter((item) => item.emp === filtros.tienda);
      }

      if (filtros.formaPago !== "todas") {
        filtered = filtered.filter((item) => item.fpa === filtros.formaPago);
      }

      // Filtros de fecha
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        filtered = filtered.filter((item) => {
          const fechaItem = parseFechaRobusta(item.fec);
          return fechaItem >= fechaDesde;
        });
      }

      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        filtered = filtered.filter((item) => {
          const fechaItem = parseFechaRobusta(item.fec);
          return fechaItem <= fechaHasta;
        });
      }

      console.log(`Total registros filtrados: ${filtered.length}`);
      setFilteredData(filtered);

    } catch (err) {
      console.error('Error aplicando filtros:', err);
      setError('Error al aplicar los filtros');
    } finally {
      setLoading(false);
    }
  }, [data, filtros]);

  // Obtener contexto para filtros según la vista activa
  const getFilterContext = () => {
    const contextMap = {
      dashboard: 'ventas',
      graficos: 'ventas', 
      vendedores: 'ventas',
      proveedores: 'proveedores',
      marcas: 'productos',
      temporadas: 'productos'
    };
    return contextMap[activeView] || 'ventas';
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
          Dashboard completo con métricas, gráficos y análisis detallado
        </p>
      </div>

      {/* Sistema de Filtros Adaptables */}
      <FilterBar
        context={getFilterContext()}
        data={data}
        mapas={mapas}
        filtros={filtros}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        showAdvanced={false}
      />

      {/* Navegación entre vistas */}
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
            Gráficos
          </button>
          <button
            className={`nav-btn ${activeView === "vendedores" ? "active" : ""}`}
            onClick={() => handleViewChange("vendedores")}
          >
            <i className="fas fa-user-tie"></i>
            Vendedores
          </button>
          <button
            className={`nav-btn ${activeView === "proveedores" ? "active" : ""}`}
            onClick={() => handleViewChange("proveedores")}
          >
            <i className="fas fa-industry"></i>
            Proveedores
          </button>
          <button
            className={`nav-btn ${activeView === "marcas" ? "active" : ""}`}
            onClick={() => handleViewChange("marcas")}
          >
            <i className="fas fa-tags"></i>
            Marcas
          </button>
          <button
            className={`nav-btn ${activeView === "temporadas" ? "active" : ""}`}
            onClick={() => handleViewChange("temporadas")}
          >
            <i className="fas fa-calendar-alt"></i>
            Temporadas
          </button>
        </div>
        
        {/* Información contextual */}
        <div className="context-info">
          <span className="context-label">
            Vista: {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </span>
          {filtrosActivos.hayFiltrosActivos && (
            <span className="filters-info">
              {filtrosActivos.cantidad} filtro{filtrosActivos.cantidad !== 1 ? 's' : ''} | 
              {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Contenido de vistas */}
      {!loading && (
        <div className="view-content">
          {activeView === "dashboard" && (
            <div className="dashboard-view">
              <VentasResumen
                ventasData={filteredData}
                mapaContactos={mapas.mapaContactos}
                mapaUsuarios={mapas.mapaUsuarios}
                mapaFormasPago={mapas.mapaFormasPago}
                mapaEmpresas={mapas.mapaEmpresas}
                filtrosActivos={filtrosActivos}
                loading={loading}
              />
            </div>
          )}

          {activeView === "graficos" && (
            <div className="graficos-view">
              <VentasGraficos
                ventasData={filteredData}
                mapaContactos={mapas.mapaContactos}
                mapaUsuarios={mapas.mapaUsuarios}
                mapaFormasPago={mapas.mapaFormasPago}
                mapaEmpresas={mapas.mapaEmpresas}
                filtrosActivos={filtrosActivos}
                filtros={filtros}
                viewMode="full"
              />
            </div>
          )}

          {activeView === "vendedores" && (
            <div className="vendedores-view">
              <VentasTablaVendedores
                ventasData={filteredData}
                mapaUsuarios={mapas.mapaUsuarios}
                filtros={filtros}
              />
            </div>
          )}

          {activeView === "proveedores" && (
            <div className="proveedores-view">
              <ProveedoresContainer
                filtros={filtros}
                filtrosActivos={filtrosActivos}
              />
            </div>
          )}

          {/* Vistas en desarrollo */}
          {(activeView === "marcas" || activeView === "temporadas") && (
            <div className="seccion-en-desarrollo">
              <div className="desarrollo-placeholder">
                <i className={`fas fa-${activeView === 'marcas' ? 'tags' : 'calendar-alt'}`}></i>
                <h3>🚧 Sección en Desarrollo</h3>
                <p>
                  La vista de {activeView} estará disponible próximamente con filtros 
                  específicos adaptados a este contexto.
                </p>
                <div className="context-preview">
                  <h4>Filtros que incluirá:</h4>
                  <ul>
                    {activeView === 'marcas' && (
                      <>
                        <li>📦 Categoría de productos</li>
                        <li>🏷️ Marca específica</li>
                        <li>🏭 Proveedor</li>
                        <li>📊 Nivel de ventas</li>
                      </>
                    )}
                    {activeView === 'temporadas' && (
                      <>
                        <li>🗓️ Temporada (Primavera, Verano, etc.)</li>
                        <li>📅 Año de temporada</li>
                        <li>🏷️ Colección</li>
                        <li>💰 Rango de precios</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="loading-overlay">
          <LoadingSpinner text="Aplicando filtros..." />
        </div>
      )}
    </div>
  );
};

export default EstadisticasVentas;
