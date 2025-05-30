// components/EstadisticasVentas.jsx - Actualizado con formas de pago reales
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar } from './index';
import { formatCurrency, formatDate, obtenerNombreMes } from '../utils/formatters';
import { empresasService, contactosService, usuariosService, formasPagoService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const EstadisticasVentas = ({ data }) => {
  const [filtros, setFiltros] = useState({
    año: 'todos',
    mes: 'todos',
    cliente: 'todos',
    tienda: 'todas',
    vendedor: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingContactos, setLoadingContactos] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingFormasPago, setLoadingFormasPago] = useState(true);
  const [mapaContactos, setMapaContactos] = useState({});
  const [mapaUsuarios, setMapaUsuarios] = useState({});
  const [mapaFormasPago, setMapaFormasPago] = useState({});
  
  
  // Cargar empresas, contactos, usuarios y formas de pago al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingEmpresas(true);
        setLoadingContactos(true);
        setLoadingUsuarios(true);
        setLoadingFormasPago(true);
        
        const [empresasData, contactosData, usuariosData, formasPagoData] = await Promise.all([
          empresasService.getEmpresas(),
          contactosService.getContactos(),
          usuariosService.getUsuarios(),
          formasPagoService.getFormasPago()
        ]);
        
        setEmpresas(empresasData.emp_m || []);
        setContactos(contactosData.ent_m || []);
        setUsuarios(usuariosData.usr_m || []);
        setFormasPago(formasPagoData.fpg_m || []);
        
        const mapaContactosData = contactosService.crearMapaNombres(contactosData.ent_m || []);
        const mapaUsuariosData = usuariosService.crearMapaNombres(usuariosData.usr_m || []);
        const mapaFormasPagoData = formasPagoService.crearMapaNombres(formasPagoData.fpg_m || []);
        
        setMapaContactos(mapaContactosData);
        setMapaUsuarios(mapaUsuariosData);
        setMapaFormasPago(mapaFormasPagoData);
        
        console.log('Datos cargados:', {
          empresas: empresasData.emp_m?.length || 0,
          contactos: contactosData.ent_m?.length || 0,
          usuarios: usuariosData.usr_m?.length || 0,
          formasPago: formasPagoData.fpg_m?.length || 0
        });
        
        console.log('Mapa de formas de pago:', mapaFormasPagoData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Error al cargar empresas, contactos, usuarios y formas de pago');
      } finally {
        setLoadingEmpresas(false);
        setLoadingContactos(false);
        setLoadingUsuarios(false);
        setLoadingFormasPago(false);
      }
    };
    
    loadData();
  }, []);
  
  // Obtener años únicos de los datos
  const añosDisponibles = useMemo(() => {
    if (!data || !data.fac_t) return [];
    
    const años = new Set();
    data.fac_t.forEach(item => {
      if (item.eje) años.add(item.eje);
    });
    
    return Array.from(años).sort((a, b) => b - a).map(año => ({
      value: año.toString(),
      label: año.toString()
    }));
  }, [data]);
  
  // Opciones para filtros
  const opcionesMes = useMemo(() => {
    if (!data || !data.fac_t) return [];
    
    const meses = new Set();
    data.fac_t.forEach(item => {
      if (item.mes) {
        meses.add(item.mes);
      }
    });
    
    return [
      { value: 'todos', label: 'Todos los meses' },
      ...Array.from(meses)
        .sort((a, b) => a - b)
        .map(mes => ({
          value: mes.toString(),
          label: obtenerNombreMes(mes)
        }))
    ];
  }, [data]);
  
  const opcionesTienda = useMemo(() => {
    if (!empresas.length) return [{ value: 'todas', label: 'Cargando tiendas...' }];
    
    const tiendas = empresas.filter(emp => !emp.es_emp || emp.es_emp === false);
    const empresasPrincipales = empresas.filter(emp => emp.es_emp === true);
    
    const opciones = [{ value: 'todas', label: 'Todas las tiendas' }];
    
    empresasPrincipales.forEach(emp => {
      opciones.push({
        value: `emp_${emp.id}`,
        label: `🏢 ${emp.name}`
      });
    });
    
    tiendas.forEach(tienda => {
      opciones.push({
        value: `div_${tienda.id}`,
        label: `🏪 ${tienda.name}`
      });
    });
    
    return opciones;
  }, [empresas]);
  
  const opcionesCliente = useMemo(() => {
    if (!data || !data.fac_t || !contactos.length) {
      return [{ value: 'todos', label: 'Cargando clientes...' }];
    }
    
    const clientesEnVentas = new Set();
    data.fac_t.forEach(item => {
      if (item.clt) {
        clientesEnVentas.add(item.clt);
      }
    });
    
    const opciones = [{ value: 'todos', label: 'Todos los clientes' }];
    
    Array.from(clientesEnVentas)
      .sort((a, b) => {
        const nombreA = mapaContactos[a] || `Cliente ${a}`;
        const nombreB = mapaContactos[b] || `Cliente ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .forEach(clienteId => {
        const nombreCliente = mapaContactos[clienteId] || `Cliente ${clienteId}`;
        opciones.push({
          value: clienteId.toString(),
          label: nombreCliente
        });
      });
    
    return opciones;
  }, [data, contactos, mapaContactos]);
  
  const opcionesVendedor = useMemo(() => {
    if (!data || !data.fac_t || !usuarios.length) {
      return [{ value: 'todos', label: 'Cargando vendedores...' }];
    }
    
    const vendedoresEnVentas = new Set();
    data.fac_t.forEach(item => {
      if (item.alt_usr !== undefined && item.alt_usr !== null) {
        vendedoresEnVentas.add(item.alt_usr);
      }
    });
    
    const opciones = [{ value: 'todos', label: 'Todos los vendedores' }];
    
    Array.from(vendedoresEnVentas)
      .sort((a, b) => {
        const nombreA = mapaUsuarios[a] || `Vendedor ${a}`;
        const nombreB = mapaUsuarios[b] || `Vendedor ${b}`;
        return nombreA.localeCompare(nombreB);
      })
      .forEach(vendedorId => {
        const nombreVendedor = mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`;
        opciones.push({
          value: vendedorId.toString(),
          label: nombreVendedor
        });
      });
    
    return opciones;
  }, [data, usuarios, mapaUsuarios]);
  
  // Configuración de filtros
  const filterConfig = [
    {
      id: 'año',
      label: 'Año',
      type: 'select',
      value: filtros.año,
      options: [
        { value: 'todos', label: 'Todos los años' },
        ...añosDisponibles
      ]
    },
    {
      id: 'mes',
      label: 'Mes',
      type: 'select',
      value: filtros.mes,
      options: opcionesMes
    },
    {
      id: 'tienda',
      label: 'Tienda',
      type: 'select',
      value: filtros.tienda,
      options: opcionesTienda
    },
    {
      id: 'cliente',
      label: 'Cliente',
      type: 'select',
      value: filtros.cliente,
      options: opcionesCliente
    },
    {
      id: 'vendedor',
      label: 'Vendedor',
      type: 'select',
      value: filtros.vendedor,
      options: opcionesVendedor
    },
    {
      id: 'fechaDesde',
      label: 'Desde',
      type: 'date',
      value: filtros.fechaDesde
    },
    {
      id: 'fechaHasta',
      label: 'Hasta',
      type: 'date',
      value: filtros.fechaHasta
    }
  ];
  
  // Aplicar filtros a los datos
  useEffect(() => {
    if (!data || !data.fac_t) return;
    
    setLoading(true);
    
    try {
      let filtered = [...data.fac_t];
      
      console.log('Aplicando filtros a ventas:', filtros);
      console.log(`Total registros iniciales: ${filtered.length}`);
      
      // Filtrar por año
      if (filtros.año !== 'todos') {
        const año = parseInt(filtros.año);
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemAño = typeof item.eje === 'string' ? parseInt(item.eje) : item.eje;
          return itemAño === año;
        });
        console.log(`Filtro año ${año}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por mes
      if (filtros.mes !== 'todos') {
        const mes = parseInt(filtros.mes);
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemMes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
          return itemMes === mes;
        });
        console.log(`Filtro mes ${mes}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por tienda/división
      if (filtros.tienda !== 'todas') {
        const antes = filtered.length;
        
        if (filtros.tienda.startsWith('emp_')) {
          const empresaId = filtros.tienda.replace('emp_', '');
          filtered = filtered.filter(item => {
            const itemEmp = typeof item.emp === 'string' ? item.emp : item.emp?.toString();
            return itemEmp === empresaId;
          });
        } else if (filtros.tienda.startsWith('div_')) {
          const divisionId = filtros.tienda.replace('div_', '');
          filtered = filtered.filter(item => {
            const itemDiv = typeof item.emp_div === 'string' ? item.emp_div : item.emp_div?.toString();
            return itemDiv === divisionId;
          });
        }
        
        console.log(`Filtro tienda ${filtros.tienda}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por cliente
      if (filtros.cliente !== 'todos') {
        const clienteId = filtros.cliente;
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemCliente = typeof item.clt === 'string' ? item.clt : item.clt?.toString();
          return itemCliente === clienteId;
        });
        console.log(`Filtro cliente ${clienteId}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por vendedor
      if (filtros.vendedor !== 'todos') {
        const vendedorId = parseInt(filtros.vendedor);
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          const itemVendedor = typeof item.alt_usr === 'string' ? parseInt(item.alt_usr) : item.alt_usr;
          return itemVendedor === vendedorId;
        });
        console.log(`Filtro vendedor ${vendedorId}: ${antes} -> ${filtered.length} registros`);
      }
      
      // Filtrar por rango de fechas
      if (filtros.fechaDesde) {
        const fechaDesde = new Date(filtros.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem >= fechaDesde;
        });
        console.log(`Filtro fecha desde ${filtros.fechaDesde}: ${antes} -> ${filtered.length} registros`);
      }
      
      if (filtros.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        
        const antes = filtered.length;
        filtered = filtered.filter(item => {
          if (!item.fch) return false;
          const fechaItem = new Date(item.fch);
          return fechaItem <= fechaHasta;
        });
        console.log(`Filtro fecha hasta ${filtros.fechaHasta}: ${antes} -> ${filtered.length} registros`);
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
      tiendaEspecifica: filtros.tienda !== 'todas',
      clienteEspecifico: filtros.cliente !== 'todos',
      vendedorEspecifico: filtros.vendedor !== 'todos',
      mesEspecifico: filtros.mes !== 'todos',
      añoEspecifico: filtros.año !== 'todos',
      rangoFechas: filtros.fechaDesde || filtros.fechaHasta
    };
    
    activos.hayFiltrosActivos = Object.values(activos).some(Boolean);
    
    return activos;
  }, [filtros]);
  
  // Calcular datos para gráficos (mejorado y adaptativo)
  const ventasPorMes = useMemo(() => {
    if (!filteredData.length) return [];
    
    const meses = {};
    filteredData.forEach(item => {
      const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
      if (mes) {
        meses[mes] = (meses[mes] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(meses)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        nombreMes: obtenerNombreMes(parseInt(mes)),
        total
      }))
      .sort((a, b) => a.mes - b.mes);
  }, [filteredData]);
  
  // Ventas por semana (para cuando hay filtro de mes específico)
  const ventasPorSemana = useMemo(() => {
    if (!filteredData.length || !filtrosActivos.mesEspecifico) return [];
    
    const semanas = {};
    filteredData.forEach(item => {
      if (item.fch) {
        const fecha = new Date(item.fch);
        const weekNum = Math.ceil(fecha.getDate() / 7);
        const semanaKey = `Semana ${weekNum}`;
        semanas[semanaKey] = (semanas[semanaKey] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(semanas)
      .map(([semana, total]) => ({ semana, total }))
      .sort((a, b) => parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1]));
  }, [filteredData, filtrosActivos.mesEspecifico]);
  
  // Ventas por día (para rangos de fechas cortos)
  const ventasPorDia = useMemo(() => {
    if (!filteredData.length || !filtrosActivos.rangoFechas) return [];
    
    const dias = {};
    filteredData.forEach(item => {
      if (item.fch) {
        const fecha = new Date(item.fch).toLocaleDateString('es-ES');
        dias[fecha] = (dias[fecha] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(dias)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => new Date(a.fecha.split('/').reverse().join('-')) - new Date(b.fecha.split('/').reverse().join('-')));
  }, [filteredData, filtrosActivos.rangoFechas]);
  
  const ventasPorTienda = useMemo(() => {
    if (!filteredData.length || !empresas.length || filtrosActivos.tiendaEspecifica) return [];
    
    const tiendas = {};
    filteredData.forEach(item => {
      const tiendaId = item.emp_div || item.emp;
      if (tiendaId) {
        tiendas[tiendaId] = (tiendas[tiendaId] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(tiendas)
      .map(([tiendaId, total]) => {
        const empresa = empresas.find(e => e.id === tiendaId);
        return {
          tiendaId,
          nombreTienda: empresa ? empresa.name : `Tienda ${tiendaId}`,
          total
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData, empresas, filtrosActivos.tiendaEspecifica]);
  
  const ventasPorCliente = useMemo(() => {
    if (!filteredData.length || filtrosActivos.clienteEspecifico) return [];
    
    const clientes = {};
    filteredData.forEach(item => {
      const clienteId = typeof item.clt === 'string' ? item.clt : item.clt?.toString();
      
      if (clienteId && 
          clienteId !== '0' && 
          clienteId !== 'null' && 
          clienteId !== 'undefined' &&
          item.tot > 0) {
        clientes[clienteId] = (clientes[clienteId] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(clientes)
      .map(([clienteId, total]) => ({
        clienteId,
        nombreCliente: mapaContactos[clienteId] || `Cliente ${clienteId}`,
        total
      }))
      .filter(cliente => cliente.total > 100)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData, mapaContactos, filtrosActivos.clienteEspecifico]);
  
  const ventasPorVendedor = useMemo(() => {
    if (!filteredData.length || filtrosActivos.vendedorEspecifico) return [];
    
    const vendedores = {};
    filteredData.forEach(item => {
      const vendedorId = item.alt_usr;
      
      if (vendedorId !== undefined && vendedorId !== null && item.tot > 0) {
        if (!vendedores[vendedorId]) {
          vendedores[vendedorId] = {
            vendedorId,
            nombreVendedor: mapaUsuarios[vendedorId] || `Vendedor ${vendedorId}`,
            totalVentas: 0,
            cantidadFacturas: 0
          };
        }
        
        vendedores[vendedorId].totalVentas += (item.tot || 0);
        vendedores[vendedorId].cantidadFacturas += 1;
      }
    });
    
    return Object.values(vendedores)
      .map(vendedor => ({
        ...vendedor,
        promedioFactura: vendedor.cantidadFacturas > 0 ? 
          vendedor.totalVentas / vendedor.cantidadFacturas : 0
      }))
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 5);
  }, [filteredData, mapaUsuarios, filtrosActivos.vendedorEspecifico]);
  
  // Análisis de ticket promedio por período
  const ticketPromedioPorPeriodo = useMemo(() => {
    if (!filteredData.length) return [];
    
    let agrupacion = 'mes';
    if (filtrosActivos.mesEspecifico) agrupacion = 'semana';
    if (filtrosActivos.rangoFechas) agrupacion = 'día';
    
    const periodos = {};
    
    filteredData.forEach(item => {
      let clavePeríodo;
      
      if (agrupacion === 'día' && item.fch) {
        clavePeríodo = new Date(item.fch).toLocaleDateString('es-ES');
      } else if (agrupacion === 'semana' && item.fch) {
        const fecha = new Date(item.fch);
        const weekNum = Math.ceil(fecha.getDate() / 7);
        clavePeríodo = `Semana ${weekNum}`;
      } else {
        clavePeríodo = obtenerNombreMes(item.mes);
      }
      
      if (clavePeríodo) {
        if (!periodos[clavePeríodo]) {
          periodos[clavePeríodo] = { total: 0, cantidad: 0 };
        }
        periodos[clavePeríodo].total += (item.tot || 0);
        periodos[clavePeríodo].cantidad += 1;
      }
    });
    
    return Object.entries(periodos)
      .map(([periodo, datos]) => ({
        periodo,
        ticketPromedio: datos.cantidad > 0 ? datos.total / datos.cantidad : 0,
        cantidadVentas: datos.cantidad,
        totalVentas: datos.total
      }))
      .sort((a, b) => {
        if (agrupacion === 'día') {
          return new Date(a.periodo.split('/').reverse().join('-')) - new Date(b.periodo.split('/').reverse().join('-'));
        }
        return a.periodo.localeCompare(b.periodo);
      });
  }, [filteredData, filtrosActivos]);
  
  // ACTUALIZADO: Ventas por forma de pago con nombres reales
  const ventasPorFormaPago = useMemo(() => {
    if (!filteredData.length) return [];
    
    const formasPagoVentas = {};
    filteredData.forEach(item => {
      const formaPagoId = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      if (formaPagoId !== undefined && formaPagoId !== null) {
        formasPagoVentas[formaPagoId] = (formasPagoVentas[formaPagoId] || 0) + (item.tot || 0);
      }
    });
    
    console.log('Ventas por forma de pago (raw):', formasPagoVentas);
    console.log('Mapa formas de pago disponible:', mapaFormasPago);
    
    return Object.entries(formasPagoVentas)
      .map(([formaPagoId, total]) => {
        const id = parseInt(formaPagoId);
        const nombreFormaPago = mapaFormasPago[id] || `Forma de pago ${id}`;
        
        console.log(`Forma de pago ${id}: ${nombreFormaPago} = €${total}`);
        
        return {
          formaPagoId: id,
          nombreFormaPago,
          total
        };
      })
      .filter(fp => fp.total > 0) // Solo mostrar formas de pago con ventas
      .sort((a, b) => b.total - a.total); // Ordenar por total descendente
  }, [filteredData, mapaFormasPago]);
  
  // Calcular totales
  const totales = useMemo(() => {
    if (!filteredData.length) return { total: 0, cantidad: 0, promedio: 0 };
    
    const total = filteredData.reduce((sum, item) => sum + (item.tot || 0), 0);
    const cantidad = filteredData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }, [filteredData]);
  
  // Configuración de columnas para la tabla
  const columnasTabla = [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'fch', label: 'Fecha', format: 'date' },
    { 
      key: 'clt', 
      label: 'Cliente', 
      format: 'custom',
      formatter: (value) => mapaContactos[value] || `Cliente ${value}`
    },
    { 
      key: 'alt_usr', 
      label: 'Vendedor', 
      format: 'custom',
      formatter: (value) => mapaUsuarios[value] || `Vendedor ${value}`
    },
    { key: 'alm', label: 'Almacén' },
    { key: 'bas_tot', label: 'Base', format: 'currency' },
    { key: 'tot', label: 'Total', format: 'currency' }
  ];
  
  // Manejar cambios en los filtros
  const handleFilterChange = (id, value) => {
    console.log(`Cambiando filtro ventas ${id} a:`, value);
    
    setFiltros(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      año: 'todos',
      mes: 'todos',
      cliente: 'todos',
      tienda: 'todas',
      vendedor: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
  };
  
  if (loadingEmpresas || loadingContactos || loadingUsuarios || loadingFormasPago) {
    return <LoadingSpinner text="Cargando información de tiendas, clientes, vendedores y formas de pago..." />;
  }
  
  if (!data || !data.fac_t) {
    return <LoadingSpinner text="Cargando datos de ventas..." />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="estadisticas-container">
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
          {filtros.año !== 'todos' && <span>Año: {filtros.año}</span>}
          {filtros.mes !== 'todos' && <span>Mes: {obtenerNombreMes(parseInt(filtros.mes))}</span>}
          {filtros.tienda !== 'todas' && (
            <span>Tienda: {
              empresas.find(e => e.id === filtros.tienda.replace('emp_', '').replace('div_', ''))?.name || 
              filtros.tienda
            }</span>
          )}
          {filtros.cliente !== 'todos' && (
            <span>Cliente: {mapaContactos[filtros.cliente] || `Cliente ${filtros.cliente}`}</span>
          )}
          {filtros.vendedor !== 'todos' && (
            <span>Vendedor: {mapaUsuarios[filtros.vendedor] || `Vendedor ${filtros.vendedor}`}</span>
          )}
          {filtros.fechaDesde && <span>Desde: {formatDate(filtros.fechaDesde)}</span>}
          {filtros.fechaHasta && <span>Hasta: {formatDate(filtros.fechaHasta)}</span>}
        </div>
      )}

      <div className="summary-cards">
        <DataCard 
          title="Total Ventas" 
          value={totales.total} 
          format="currency" 
          icon="shopping-cart"
          type="primary"
        />
        <DataCard 
          title="Cantidad de Facturas" 
          value={totales.cantidad} 
          format="number" 
          icon="file-invoice-dollar"
          type="secondary"
        />
        <DataCard 
          title="Promedio por Factura" 
          value={totales.promedio} 
          format="currency" 
          icon="calculator"
          type="primary"
        />
      </div>

      <div className="charts-container">
        {/* Gráfico temporal adaptativo */}
        {filtrosActivos.mesEspecifico && ventasPorSemana.length > 0 ? (
          <ChartContainer title={`Ventas por Semana - ${obtenerNombreMes(parseInt(filtros.mes))}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasPorSemana}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0088FE" 
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : filtrosActivos.rangoFechas && ventasPorDia.length > 0 && ventasPorDia.length <= 31 ? (
          <ChartContainer title="Ventas por Día">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Ventas"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : ventasPorMes.length > 0 ? (
          <ChartContainer title="Ventas por Mes">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreMes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" fill="#0088FE" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : null}

        {/* Análisis de ticket promedio */}
        <ChartContainer title="Ticket Promedio por Período">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ticketPromedioPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'ticketPromedio') return formatCurrency(value);
                  return value;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ticketPromedio" 
                stroke="#82ca9d" 
                name="Ticket Promedio"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="cantidadVentas" 
                stroke="#ffc658" 
                name="Cantidad Ventas"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Mostrar Top 5 Tiendas solo si no hay filtro de tienda específica */}
        {!filtrosActivos.tiendaEspecifica && ventasPorTienda.length > 0 && (
          <ChartContainer title="Top 5 Tiendas">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorTienda} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombreTienda" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" fill="#00C49F" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Mostrar Top 5 Clientes solo si no hay filtro de cliente específico */}
        {!filtrosActivos.clienteEspecifico && ventasPorCliente.length > 0 && (
          <ChartContainer title="Top 5 Clientes">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorCliente} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombreCliente" type="category" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total" fill="#FFBB28" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Mostrar Top 5 Vendedores solo si no hay filtro de vendedor específico */}
        {!filtrosActivos.vendedorEspecifico && ventasPorVendedor.length > 0 && (
          <ChartContainer title="Top 5 Vendedores">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorVendedor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombreVendedor" type="category" width={150} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'totalVentas') return formatCurrency(value);
                    if (name === 'cantidadFacturas') return `${value} facturas`;
                    if (name === 'promedioFactura') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="totalVentas" fill="#FF8042" name="Ventas Totales" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* ACTUALIZADO: Ventas por Forma de Pago con nombres reales */}
        {ventasPorFormaPago.length > 0 && (
          <ChartContainer title="Ventas por Forma de Pago">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasPorFormaPago}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="nombreFormaPago"
                  label={({ nombreFormaPago, percent }) => 
                    `${nombreFormaPago}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {ventasPorFormaPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Estadísticas por Vendedor - solo si no hay filtro de vendedor específico */}
        {!filtrosActivos.vendedorEspecifico && ventasPorVendedor.length > 0 && (
          <ChartContainer title="Estadísticas por Vendedor">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorVendedor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreVendedor" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'promedioFactura') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="cantidadFacturas" fill="#82ca9d" name="Cantidad Facturas" />
                <Bar dataKey="promedioFactura" fill="#ffc658" name="Promedio por Factura" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};

export default EstadisticasVentas;