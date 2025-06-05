// pages/EstadisticasVentas.jsx - Corregido y actualizado
import React, { useState, useEffect, useMemo } from "react";
import { LoadingSpinner, ErrorMessage, FilterBar } from "../components/common";
import { VentasResumen, VentasGraficos, VentasTablaVendedores } from "../components/ventas";
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
  const [activeView, setActiveView] = useState("resumen"); // resumen, graficos, tabla

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

        // Cargar empresas y formas de pago (los contactos y usuarios ya vienen como props)
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

          // Analizar duplicados
          const analisisDuplicados = analizarDuplicados(usuariosList);
          setDuplicadosDetectados(analisisDuplicados.duplicados);

          // Crear mapa consolidado
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

  // Opciones para filtros
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

  const opcionesTienda = useMemo(() => {
    if (!empresas.length)
      return [{ value: "todas", label: "Cargando tiendas..." }];

    const opciones = [{ value: "todas", label: "Todas las tiendas" }];

    empresas
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((empresa) => {
        const prefijo = empresa.es_emp ? "🏢" : "🏪";
        opciones.push({
          value: empresa.id.toString(),
          label: `${prefijo} ${empresa.name}`,
        });
      });

    return opciones;
  }, [empresas]);

  const opcionesCliente = useMemo(() => {
    if (!data || !data.fac_t || !Object.keys(mapaContactos).length) {
      return [{ value: "todos", label: "Cargando clientes..." }];
    }

    const clientesEnVentas = new Set();
    data.fac_t.forEach((item) => {
      if (item.clt) clientesEnVentas.add(item.clt);
    });

    const opciones = [{ value: "todos", label: "Todos los clientes" }];

    Array.from(clientesEnVentas)
      .sort((a, b) => {
        const nombreA = mapaContactos[a] || `Cliente ${a}`;
        const nombreB = mapaContactos[b] || `Cliente ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .forEach((clienteId) => {
        const nombreCliente =
          mapaContactos[clienteId] || `Cliente ${clienteId}`;
        opciones.push({
          value: clienteId.toString(),
          label: nombreCliente,
        });
      });

    return opciones;
  }, [data, mapaContactos]);

  // Construcción de las opciones del selector de vendedores
  const opcionesVendedor = useMemo(() => {
    if (!data || !data.fac_t || !Object.keys(mapaUsuarios).length) {
      return [{ value: "todos", label: "Cargando vendedores..." }];
    }

    // Primero calcular totales de ventas por vendedor
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

    // Filtrar solo vendedores con ventas totales > 0
    const vendedoresConVentasPositivas = Object.keys(ventasPorVendedor).filter(
      (vendedorId) => ventasPorVendedor[vendedorId] > 0
    );

    const opciones = [{ value: "todos", label: "Todos los vendedores" }];
    const nombresUsados = new Set(); // Para evitar duplicados por nombre

    vendedoresConVentasPositivas
      .sort((a, b) => {
        const nombreA = mapaUsuarios[a] || `Vendedor ${a}`;
        const nombreB = mapaUsuarios[b] || `Vendedor ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .forEach((vendedorId) => {
        const nombreVendedor =
          mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`;

        // Solo agregar si el nombre no ha sido usado antes
        if (!nombresUsados.has(nombreVendedor)) {
          nombresUsados.add(nombreVendedor);
          opciones.push({
            value: vendedorId,
            label: nombreVendedor,
          });
        }
      });

    console.log(
      "Opciones de vendedores (solo ventas > 0, sin duplicados):",
      opciones
    );
    return opciones;
  }, [data, mapaUsuarios]);

  // Configuración de filtros
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
      id: "tienda",
      label: "Tienda",
      type: "select",
      value: filtros.tienda,
      options: opcionesTienda,
    },
    {
      id: "cliente",
      label: "Cliente",
      type: "select",
      value: filtros.cliente,
      options: opcionesCliente,
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

      // Función auxiliar para parsear fechas de forma robusta
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
        console.log(
          `Después de filtro año ${año}: ${filtered.length} registros`
        );
      }

      // Filtrar por mes
      if (filtros.mes !== "todos") {
        const mes = parseInt(filtros.mes);
        filtered = filtered.filter((item) => {
          const itemMes =
            typeof item.mes === "string" ? parseInt(item.mes) : item.mes;
          return itemMes === mes;
        });
        console.log(
          `Después de filtro mes ${mes}: ${filtered.length} registros`
        );
      }

      // Filtrar por tienda
      if (filtros.tienda !== "todas") {
        const tiendaId = filtros.tienda;
        filtered = filtered.filter((item) => {
          return (
            item.emp?.toString() === tiendaId ||
            item.emp_div?.toString() === tiendaId
          );
        });
        console.log(
          `Después de filtro tienda ${tiendaId}: ${filtered.length} registros`
        );
      }

      // Filtrar por cliente
      if (filtros.cliente !== "todos") {
        const clienteId = filtros.cliente;
        filtered = filtered.filter((item) => {
          return item.clt?.toString() === clienteId;
        });
        console.log(
          `Después de filtro cliente ${clienteId}: ${filtered.length} registros`
        );
      }

      // Filtrar por vendedor
      if (filtros.vendedor !== "todos") {
        const vendedorIdSeleccionado = filtros.vendedor;

        filtered = filtered.filter((item) => {
          const itemVendedor = item.alt_usr;
          if (itemVendedor === undefined || itemVendedor === null) return false;

          // Comparar directamente por ID (string)
          return itemVendedor.toString() === vendedorIdSeleccionado;
        });
        console.log(
          `Después de filtro vendedor ${vendedorIdSeleccionado}: ${filtered.length} registros`
        );
      }

      // Filtrar por rango de fechas - VERSIÓN MEJORADA
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);

        console.log("Aplicando filtro fechaDesde:", fechaDesde);

        const filteredCount = filtered.length;
        filtered = filtered.filter((item) => {
          const fechaItem = parseFecha(item.fch);
          if (!fechaItem) {
            console.log("Fecha inválida encontrada:", item.fch);
            return false;
          }

          const cumpleFiltro = fechaItem >= fechaDesde;
          if (!cumpleFiltro) {
            console.log(
              "Fecha excluida:",
              fechaItem,
              "es menor que",
              fechaDesde
            );
          }

          return cumpleFiltro;
        });

        console.log(
          `Filtro fechaDesde: ${filteredCount} -> ${filtered.length} registros`
        );
      }

      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);

        console.log("Aplicando filtro fechaHasta:", fechaHasta);

        const filteredCount = filtered.length;
        filtered = filtered.filter((item) => {
          const fechaItem = parseFecha(item.fch);
          if (!fechaItem) {
            console.log("Fecha inválida encontrada:", item.fch);
            return false;
          }

          const cumpleFiltro = fechaItem <= fechaHasta;
          if (!cumpleFiltro) {
            console.log(
              "Fecha excluida:",
              fechaItem,
              "es mayor que",
              fechaHasta
            );
          }

          return cumpleFiltro;
        });

        console.log(
          `Filtro fechaHasta: ${filteredCount} -> ${filtered.length} registros`
        );
      }

      console.log(
        `Total registros después de todos los filtros: ${filtered.length}`
      );

      // Mostrar algunas fechas de ejemplo para debug
      if (filtered.length > 0) {
        console.log("Ejemplos de fechas en datos filtrados:");
        filtered.slice(0, 3).forEach((item, idx) => {
          console.log(`  ${idx + 1}:`, item.fch, "->", parseFecha(item.fch));
        });
      }

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
      tiendaEspecifica: filtros.tienda !== "todas",
      clienteEspecifico: filtros.cliente !== "todos",
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
      <LoadingSpinner text="Cargando información de referencia (tiendas, formas de pago)..." />
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
          {filtros.tienda !== "todas" && (
            <span>
              Tienda:{" "}
              {mapaEmpresas[filtros.tienda] || `Tienda ${filtros.tienda}`}
            </span>
          )}
          {filtros.cliente !== "todos" && (
            <span>
              Cliente:{" "}
              {mapaContactos[filtros.cliente] || `Cliente ${filtros.cliente}`}
            </span>
          )}
          {filtros.vendedor !== "todos" && (
            <span>
              Vendedor:{" "}
              {mapaUsuarios[filtros.vendedor] || `Vendedor ${filtros.vendedor}`}
            </span>
          )}
          {filtros.fechaDesde && (
            <span>Desde: {formatDate(filtros.fechaDesde)}</span>
          )}
          {filtros.fechaHasta && (
            <span>Hasta: {formatDate(filtros.fechaHasta)}</span>
          )}
          <span className="filtros-count">
            ({filteredData.length} facturas filtradas)
          </span>
        </div>
      )}

      {/* Navegación entre vistas */}
      <div className="navigation">
        <div className="nav-buttons">
          <button
            className={`nav-btn ${activeView === "resumen" ? "active" : ""}`}
            onClick={() => handleViewChange("resumen")}
          >
            <i className="fas fa-chart-pie"></i>
            Resumen
          </button>
          <button
            className={`nav-btn ${activeView === "graficos" ? "active" : ""}`}
            onClick={() => handleViewChange("graficos")}
          >
            <i className="fas fa-chart-bar"></i>
            Gráficos
          </button>
          <button
            className={`nav-btn ${activeView === "tabla" ? "active" : ""}`}
            onClick={() => handleViewChange("tabla")}
          >
            <i className="fas fa-table"></i>
            Vendedores
          </button>
        </div>
      </div>

      {/* Contenido según la vista activa */}
      <div className="ventas-content">
        {loading && <LoadingSpinner text="Aplicando filtros..." />}

        {!loading && activeView === "resumen" && (
          <VentasResumen
            ventasData={filteredData}
            mapaContactos={mapaContactos}
            mapaUsuarios={mapaUsuarios}
            mapaFormasPago={mapaFormasPago}
            filtrosActivos={filtrosActivos}
          />
        )}

        {!loading && activeView === "graficos" && (
          <VentasGraficos
            ventasData={filteredData}
            mapaContactos={mapaContactos}
            mapaUsuarios={mapaUsuarios}
            mapaFormasPago={mapaFormasPago}
            mapaEmpresas={mapaEmpresas} // Add this line
            filtrosActivos={filtrosActivos}
            filtros={filtros} // Add this line
          />
        )}

        {!loading && activeView === "tabla" && (
          <VentasTablaVendedores
            ventasData={filteredData}
            mapaUsuarios={mapaUsuarios}
            filtros={filtros}
          />
        )}
      </div>
    </div>
  );
};

export default EstadisticasVentas;
