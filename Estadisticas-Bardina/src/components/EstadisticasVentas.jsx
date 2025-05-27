// components/EstadisticasVentas.jsx - Actualizado con vendedores
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ChartContainer, DataCard, LoadingSpinner, ErrorMessage, FilterBar, DataTable } from './index';
import { formatCurrency, formatDate, obtenerNombreMes } from '../utils/formatters';
import { ventasService, empresasService, contactosService, usuariosService } from '../services/api';

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
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingContactos, setLoadingContactos] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [mapaContactos, setMapaContactos] = useState({});
  const [mapaUsuarios, setMapaUsuarios] = useState({});
  
  // Cargar empresas, contactos y usuarios al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingEmpresas(true);
        setLoadingContactos(true);
        setLoadingUsuarios(true);
        
        // Cargar empresas, contactos y usuarios en paralelo
        const [empresasData, contactosData, usuariosData] = await Promise.all([
          empresasService.getEmpresas(),
          contactosService.getContactos(),
          usuariosService.getUsuarios()
        ]);
        
        setEmpresas(empresasData.emp_m || []);
        setContactos(contactosData.ent_m || []);
        setUsuarios(usuariosData.usr_m || []);
        
        // Crear mapas para búsquedas rápidas
        const mapaContactosData = contactosService.crearMapaNombres(contactosData.ent_m || []);
        const mapaUsuariosData = usuariosService.crearMapaNombres(usuariosData.usr_m || []);
        
        setMapaContactos(mapaContactosData);
        setMapaUsuarios(mapaUsuariosData);
        
        console.log('Datos cargados:', {
          empresas: empresasData.emp_m?.length || 0,
          contactos: contactosData.ent_m?.length || 0,
          usuarios: usuariosData.usr_m?.length || 0
        });
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Error al cargar empresas, contactos y usuarios');
      } finally {
        setLoadingEmpresas(false);
        setLoadingContactos(false);
        setLoadingUsuarios(false);
      }
    };
    
    loadData();
  }, []);
  
  // Debug: Verificar tipos de datos al cargar
  useEffect(() => {
    if (data && data.fac_t.length > 0) {
      console.log('Tipo de datos en ventas:', {
        primerRegistro: data.fac_t[0],
        tipoMes: typeof data.fac_t[0].mes,
        valorMes: data.fac_t[0].mes,
        tipoAño: typeof data.fac_t[0].eje,
        valorAño: data.fac_t[0].eje,
        cliente: data.fac_t[0].clt,
        nombreCliente: mapaContactos[data.fac_t[0].clt],
        vendedor: data.fac_t[0].alt_usr,
        nombreVendedor: mapaUsuarios[data.fac_t[0].alt_usr]
      });
    }
  }, [data, mapaContactos, mapaUsuarios]);
  
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
  
  // Opciones para el filtro de mes
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
  
  // Opciones para el filtro de tienda/división
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
  
  // Opciones para el filtro de cliente - CON NOMBRES
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
  
  // NUEVO: Opciones para el filtro de vendedor - CON NOMBRES
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
  
  // Configuración de filtros actualizada
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
  
  // Aplicar filtros a los datos (actualizado con vendedor)
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
      
      // NUEVO: Filtrar por vendedor
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
  
  // Calcular ventas por mes
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
  
  // Calcular ventas por tienda
  const ventasPorTienda = useMemo(() => {
    if (!filteredData.length || !empresas.length) return [];
    
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
  }, [filteredData, empresas]);
  
  // Calcular ventas por cliente - CON NOMBRES (excluyendo clientes problemáticos)
  const ventasPorCliente = useMemo(() => {
    if (!filteredData.length) return [];
    
    const clientes = {};
    filteredData.forEach(item => {
      const clienteId = typeof item.clt === 'string' ? item.clt : item.clt?.toString();
      
      // Filtrar clientes problemáticos o sin asignar
      if (clienteId && 
          clienteId !== '0' && 
          clienteId !== 'null' && 
          clienteId !== 'undefined' &&
          item.tot > 0) { // Solo incluir ventas con importe positivo
        clientes[clienteId] = (clientes[clienteId] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(clientes)
      .map(([clienteId, total]) => ({
        clienteId,
        nombreCliente: mapaContactos[clienteId] || `Cliente ${clienteId}`,
        total
      }))
      .filter(cliente => cliente.total > 100) // Filtrar importes muy pequeños
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData, mapaContactos]);
  
  // NUEVO: Calcular ventas por vendedor - CON NOMBRES
  const ventasPorVendedor = useMemo(() => {
    if (!filteredData.length) return [];
    
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
  }, [filteredData, mapaUsuarios]);
  
  // Calcular ventas por forma de pago
  const ventasPorFormaPago = useMemo(() => {
    if (!filteredData.length) return [];
    
    const formasPago = {};
    filteredData.forEach(item => {
      const formaPago = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      if (formaPago !== undefined && formaPago !== null) {
        formasPago[formaPago] = (formasPago[formaPago] || 0) + (item.tot || 0);
      }
    });
    
    return Object.entries(formasPago).map(([formaPago, total]) => ({
      formaPago: parseInt(formaPago),
      nombreFormaPago: `Forma ${formaPago}`,
      total
    }));
  }, [filteredData]);
  
  // Calcular totales
  const totales = useMemo(() => {
    if (!filteredData.length) return { total: 0, cantidad: 0, promedio: 0 };
    
    const total = filteredData.reduce((sum, item) => sum + (item.tot || 0), 0);
    const cantidad = filteredData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    
    return { total, cantidad, promedio };
  }, [filteredData]);
  
  // Configuración de columnas para la tabla - CON NOMBRES DE CLIENTES Y VENDEDORES
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
  
  if (loadingEmpresas || loadingContactos || loadingUsuarios) {
    return <LoadingSpinner text="Cargando información de tiendas, clientes y vendedores..." />;
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
      {(filtros.año !== 'todos' || filtros.mes !== 'todos' || filtros.cliente !== 'todos' || 
        filtros.tienda !== 'todas' || filtros.vendedor !== 'todos' || filtros.fechaDesde || filtros.fechaHasta) && (
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
        <DataCard 
          title="Vendedores Activos" 
          value={ventasPorVendedor.length} 
          format="number" 
          icon="users"
          type="warning"
        />
      </div>

      <div className="charts-container">
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
                label={({ nombreFormaPago, percent }) => `${nombreFormaPago}: ${(percent * 100).toFixed(0)}%`}
              >
                {ventasPorFormaPago.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

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
      </div>

      <DataTable 
        data={filteredData} 
        columns={columnasTabla} 
        title="Listado de Facturas"
        itemsPerPage={10}
      />
    </div>
  );
};

export default EstadisticasVentas;