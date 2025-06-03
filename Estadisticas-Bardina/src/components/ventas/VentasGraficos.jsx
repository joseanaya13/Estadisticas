// components/ventas/VentasGraficos.jsx
import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area, ComposedChart 
} from 'recharts';
import { ChartContainer } from '../common';
import { formatCurrency, obtenerNombreMes, parseFechaRobusta, formatDate, roundToPrecision } from '../../utils/formatters';
import { analizarDuplicados } from '../../utils/usuariosUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const VentasGraficos = ({ 
  ventasData = [], 
  mapaContactos = {}, 
  mapaUsuarios = {}, 
  mapaFormasPago = {},
  mapaEmpresas = {}, // Added this prop
  filtrosActivos = {},
  filtros = {} // Added this prop
}) => {
  
  // DEBUG: Verificar qué datos está recibiendo el componente
  console.log('🔍 DEBUG VentasGraficos - Props recibidos:', {
    totalFacturas: ventasData.length,
    filtrosActivos,
    filtros,
    primerasFacturas: ventasData.slice(0, 3).map(f => ({
      mes: f.mes,
      año: f.eje,
      total: f.tot,
      fecha: f.fch
    }))
  });
  
  // Generar títulos dinámicos según filtros activos
  const getTituloConFiltros = useMemo(() => {
    return (tituloBase) => {
      let contexto = '';
      const filtrosAplicados = [];
      
      if (filtrosActivos.añoEspecifico) {
        filtrosAplicados.push(`${filtros.año}`);
      }
      if (filtrosActivos.mesEspecifico) {
        filtrosAplicados.push(obtenerNombreMes(parseInt(filtros.mes)));
      }
      if (filtrosActivos.vendedorEspecifico) {
        const nombreVendedor = mapaUsuarios[filtros.vendedor] || `Vendedor ${filtros.vendedor}`;
        filtrosAplicados.push(nombreVendedor);
      }
      if (filtrosActivos.clienteEspecifico) {
        const nombreCliente = mapaContactos[filtros.cliente] || `Cliente ${filtros.cliente}`;
        filtrosAplicados.push(nombreCliente);
      }
      if (filtrosActivos.tiendaEspecifica) {
        const nombreTienda = mapaEmpresas[filtros.tienda] || `Tienda ${filtros.tienda}`;
        filtrosAplicados.push(nombreTienda);
      }
      if (filtrosActivos.rangoFechas) {
        if (filtros.fechaDesde && filtros.fechaHasta) {
          filtrosAplicados.push(`${formatDate(filtros.fechaDesde)} - ${formatDate(filtros.fechaHasta)}`);
        } else if (filtros.fechaDesde) {
          filtrosAplicados.push(`Desde ${formatDate(filtros.fechaDesde)}`);
        } else if (filtros.fechaHasta) {
          filtrosAplicados.push(`Hasta ${formatDate(filtros.fechaHasta)}`);
        }
      }
      
      if (filtrosAplicados.length > 0) {
        contexto = ` - ${filtrosAplicados.join(' | ')}`;
      }
      
      return tituloBase + contexto;
    };
  }, [filtrosActivos, filtros, mapaUsuarios, mapaContactos, mapaEmpresas]);

  // Crear mapa consolidado de usuarios (análisis de duplicados)
  const mapaUsuariosConsolidado = useMemo(() => {
    // Crear lista de usuarios para análisis
    const usuariosList = Object.entries(mapaUsuarios).map(([id, name]) => ({
      id: parseInt(id),
      name: name
    }));
    
    if (usuariosList.length === 0) {
      return mapaUsuarios;
    }
    
    // Analizar duplicados
    const analisis = analizarDuplicados(usuariosList);
    
    // Crear mapa consolidado
    const mapaConsolidado = { ...mapaUsuarios };
    
    analisis.duplicados.forEach(duplicado => {
      // Usar el nombre consolidado para todos los IDs del grupo
      const nombreConsolidado = duplicado.nombre;
      duplicado.usuarios.forEach(usuario => {
        mapaConsolidado[usuario.id] = nombreConsolidado;
      });
    });
    
    return mapaConsolidado;
  }, [mapaUsuarios]);

  // Separar ventas positivas de devoluciones para análisis
  const { ventasPositivas, devoluciones } = useMemo(() => {
    console.log('🔍 DEBUG: Recalculando ventasPositivas con:', ventasData.length, 'facturas');
    
    // DEBUG: Verificar si hay problemas con números negativos
    const ejemplosNegativos = ventasData.filter(v => (v.tot || 0) < 0).slice(0, 5);
    console.log('🔍 DEBUG: Ejemplos de devoluciones (negativos):', ejemplosNegativos.map(v => ({
      total: v.tot,
      tipo: typeof v.tot,
      esNegativo: v.tot < 0
    })));
    
    const positivas = ventasData.filter(venta => (venta.tot || 0) > 0);
    const negativas = ventasData.filter(venta => (venta.tot || 0) <= 0);
    
    console.log('🔍 DEBUG: Ventas positivas:', positivas.length);
    console.log('🔍 DEBUG: Devoluciones:', negativas.length);
    
    // DEBUG: Calcular total incluyendo devoluciones (como debe ser)
    const totalConDevoluciones = ventasData.reduce((sum, venta) => sum + (venta.tot || 0), 0);
    const totalSoloPositivas = positivas.reduce((sum, venta) => sum + (venta.tot || 0), 0);
    const totalDevoluciones = negativas.reduce((sum, venta) => sum + (venta.tot || 0), 0);
    
    console.log('🔍 DEBUG CRÍTICO - TOTALES:');
    console.log('  Total con devoluciones (CORRECTO):', roundToPrecision(totalConDevoluciones));
    console.log('  Total solo positivas (INCORRECTO si se usa):', roundToPrecision(totalSoloPositivas));
    console.log('  Total devoluciones:', roundToPrecision(totalDevoluciones));
    console.log('  Diferencia:', roundToPrecision(totalSoloPositivas - totalConDevoluciones));
    
    return {
      ventasPositivas: positivas,
      devoluciones: negativas
    };
  }, [ventasData, filtrosActivos, filtros]); // Agregué filtrosActivos y filtros como dependencia
  
  // Ventas por mes - INCLUYENDO DEVOLUCIONES PARA TOTAL NETO REAL
  const ventasPorMes = useMemo(() => {
    if (!ventasData.length) return [];
    
    console.log('🔍 DEBUG: Recalculando ventasPorMes con TODAS las ventas:', ventasData.length);
    
    const meses = {};
    const cantidadPorMes = {};
    const ventasPositivasPorMes = {};
    
    // Usar TODOS los datos (positivos y negativos) para el total real
    ventasData.forEach(item => {
      const mes = typeof item.mes === 'string' ? parseInt(item.mes) : item.mes;
      if (mes) {
        const monto = item.tot || 0;
        meses[mes] = (meses[mes] || 0) + monto; // Incluye devoluciones
        cantidadPorMes[mes] = (cantidadPorMes[mes] || 0) + 1;
        
        // Separar solo ventas positivas para otros cálculos
        if (monto > 0) {
          ventasPositivasPorMes[mes] = (ventasPositivasPorMes[mes] || 0) + monto;
        }
      }
    });
    
    console.log('🔍 DEBUG: Totales NETOS por mes (con devoluciones):', meses);
    console.log('🔍 DEBUG: Cantidad por mes:', cantidadPorMes);
    
    const resultado = Object.entries(meses)
      .map(([mes, total]) => ({
        mes: parseInt(mes),
        nombreMes: obtenerNombreMes(parseInt(mes)),
        total: roundToPrecision(total), // Total NETO (con devoluciones)
        cantidad: cantidadPorMes[mes],
        promedio: cantidadPorMes[mes] > 0 ? roundToPrecision(total / cantidadPorMes[mes]) : 0,
        ventasPositivas: roundToPrecision(ventasPositivasPorMes[mes] || 0)
      }))
      .sort((a, b) => a.mes - b.mes);
    
    console.log('🔍 DEBUG: Resultado final ventasPorMes (NETO):', resultado);
    
    return resultado;
  }, [ventasData, filtrosActivos, filtros]); // Usar ventasData en lugar de ventasPositivas
  
  // Ventas por semana (para filtros de mes específico, solo positivas)
  const ventasPorSemana = useMemo(() => {
    if (!ventasPositivas.length || !filtrosActivos.mesEspecifico) return [];
    
    const semanas = {};
    ventasPositivas.forEach(item => {
      if (item.fch) {
        const fecha = new Date(item.fch);
        if (!isNaN(fecha.getTime())) {
          const weekNum = Math.ceil(fecha.getDate() / 7);
          const semanaKey = `Semana ${weekNum}`;
          // NO redondear durante la suma
          const monto = item.tot || 0;
          semanas[semanaKey] = (semanas[semanaKey] || 0) + monto;
        }
      }
    });
    
    return Object.entries(semanas)
      .map(([semana, total]) => ({ 
        semana, 
        total: roundToPrecision(total) // Redondear solo al final
      }))
      .sort((a, b) => parseInt(a.semana.split(' ')[1]) - parseInt(b.semana.split(' ')[1]));
  }, [ventasPositivas, filtrosActivos.mesEspecifico]);
  
  // Top vendedores - VENTAS NETAS (incluyendo devoluciones)
  const topVendedores = useMemo(() => {
    if (!ventasData.length) return [];
    
    const vendedores = {};
    
    // Procesar TODAS las ventas (positivas y negativas) para totales netos
    ventasData.forEach(item => {
      const vendedorId = item.alt_usr;
      if (vendedorId !== undefined && vendedorId !== null) {
        const nombreVendedor = mapaUsuariosConsolidado[vendedorId] || `Vendedor ${vendedorId}`;
        
        if (!vendedores[nombreVendedor]) {
          vendedores[nombreVendedor] = {
            nombre: nombreVendedor,
            total: 0, // Total NETO (con devoluciones)
            cantidad: 0,
            ventasPositivas: 0,
            cantidadPositivas: 0,
            tieneVentasPositivas: false
          };
        }
        
        const monto = item.tot || 0;
        vendedores[nombreVendedor].total += monto; // Total NETO
        vendedores[nombreVendedor].cantidad += 1;
        
        if (monto > 0) {
          vendedores[nombreVendedor].ventasPositivas += monto;
          vendedores[nombreVendedor].cantidadPositivas += 1;
          vendedores[nombreVendedor].tieneVentasPositivas = true;
        }
      }
    });
    
    // Filtrar solo vendedores que tienen al menos 1 venta positiva y ordenar por total NETO
    return Object.values(vendedores)
      .filter(v => v.tieneVentasPositivas) // Solo vendedores con al menos 1 factura > 0
      .sort((a, b) => b.total - a.total) // Ordenar por total NETO
      .slice(0, 10)
      .map(v => ({
        ...v,
        total: roundToPrecision(v.total), // Total NETO
        ventasPositivas: roundToPrecision(v.ventasPositivas),
        promedio: v.cantidad > 0 ? roundToPrecision(v.total / v.cantidad) : 0 // Promedio NETO
      }));
  }, [ventasData, mapaUsuariosConsolidado]);
  
  // Top clientes (solo ventas positivas)
  const topClientes = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    const clientes = {};
    ventasPositivas.forEach(item => {
      const clienteId = item.clt;
      if (clienteId) {
        if (!clientes[clienteId]) {
          clientes[clienteId] = {
            clienteId,
            nombre: mapaContactos[clienteId] || `Cliente ${clienteId}`,
            total: 0,
            cantidad: 0
          };
        }
        clientes[clienteId].total += (item.tot || 0); // NO redondear aquí
        clientes[clienteId].cantidad += 1;
      }
    });
    
    return Object.values(clientes)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(c => ({
        ...c,
        total: roundToPrecision(c.total), // Redondear solo al final
        promedio: c.cantidad > 0 ? roundToPrecision(c.total / c.cantidad) : 0
      }));
  }, [ventasPositivas, mapaContactos]);
  
  // Ventas por forma de pago (solo ventas positivas para evitar valores negativos en el gráfico)
  const ventasPorFormaPago = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    const formasPago = {};
    
    // Procesar solo las ventas positivas para el gráfico
    ventasPositivas.forEach(item => {
      const formaPagoId = typeof item.fpg === 'string' ? parseInt(item.fpg) : item.fpg;
      
      if (formaPagoId !== undefined && formaPagoId !== null) {
        const nombre = mapaFormasPago[formaPagoId] || `Forma de pago ${formaPagoId}`;
        const monto = item.tot || 0; // NO redondear aquí
        formasPago[nombre] = (formasPago[nombre] || 0) + monto;
      }
    });
    
    // Incluir todas las formas de pago con valores positivos
    return Object.entries(formasPago)
      .map(([nombre, total]) => ({ 
        nombre, 
        total: roundToPrecision(total) // Redondear solo al final
      }))
      .filter(fp => fp.total > 0) // Solo mostrar formas de pago con ventas positivas
      .sort((a, b) => b.total - a.total); // Ordenar por total (mayor a menor)
  }, [ventasPositivas, mapaFormasPago]);
  
  // Análisis temporal - separar ventas y promedio
  const ventasMensuales = useMemo(() => {
    return ventasPorMes.map(mes => ({
      nombreMes: mes.nombreMes,
      total: mes.total,
      cantidad: mes.cantidad
    }));
  }, [ventasPorMes]);

  const promedioMensual = useMemo(() => {
    return ventasPorMes.map(mes => ({
      nombreMes: mes.nombreMes,
      promedio: mes.promedio
    }));
  }, [ventasPorMes]);

  // Ventas por días (adaptado a filtros aplicados)
  const ventasPorDias = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    // Obtener rango de fechas según filtros aplicados
    let fechaInicio, fechaFin, tituloperiodo;
    
    if (filtrosActivos.mesEspecifico && filtros.año !== 'todos' && filtros.mes !== 'todos') {
      // Mes específico filtrado
      const año = parseInt(filtros.año);
      const mes = parseInt(filtros.mes);
      fechaInicio = new Date(año, mes - 1, 1);
      fechaFin = new Date(año, mes, 0);
      tituloperiodo = `${obtenerNombreMes(mes)} ${año}`;
    } else if (filtrosActivos.rangoFechas && (filtros.fechaDesde || filtros.fechaHasta)) {
      // Rango de fechas específico
      fechaInicio = filtros.fechaDesde ? new Date(filtros.fechaDesde) : null;
      fechaFin = filtros.fechaHasta ? new Date(filtros.fechaHasta) : null;
      
      if (!fechaInicio) {
        // Solo fecha hasta: usar 30 días antes
        fechaInicio = new Date(fechaFin);
        fechaInicio.setDate(fechaInicio.getDate() - 30);
      }
      if (!fechaFin) {
        // Solo fecha desde: usar 30 días después
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 30);
      }
      
      tituloperiodo = `${fechaInicio.toLocaleDateString('es-ES')} - ${fechaFin.toLocaleDateString('es-ES')}`;
    } else {
      // Sin filtros específicos: último mes con datos
      const fechas = ventasPositivas
        .map(item => new Date(item.fch))
        .filter(fecha => !isNaN(fecha.getTime()))
        .sort((a, b) => b - a);
      
      if (!fechas.length) return [];
      
      const fechaMasReciente = fechas[0];
      fechaInicio = new Date(fechaMasReciente.getFullYear(), fechaMasReciente.getMonth(), 1);
      fechaFin = new Date(fechaMasReciente.getFullYear(), fechaMasReciente.getMonth() + 1, 0);
      tituloperiodo = fechaMasReciente.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
    
    console.log('Análisis ventas por días:', {
      fechaInicio: fechaInicio?.toISOString(),
      fechaFin: fechaFin?.toISOString(),
      tituloperiodo,
      filtrosActivos
    });
    
    // Crear array con todos los días del período
    const diasDelPeriodo = [];
    const diasTotal = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < diasTotal; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      
      diasDelPeriodo.push({
        dia: fecha.getDate(),
        fecha: new Date(fecha),
        total: 0,
        cantidad: 0
      });
    }
    
    // Llenar con datos reales del período filtrado
    ventasPositivas.forEach(item => {
      if (item.fch) {
        const fechaItem = new Date(item.fch);
        if (!isNaN(fechaItem.getTime()) && fechaItem >= fechaInicio && fechaItem <= fechaFin) {
          const diaData = diasDelPeriodo.find(d => 
            d.fecha.toDateString() === fechaItem.toDateString()
          );
          if (diaData) {
            diaData.total += (item.tot || 0); // NO redondear aquí
            diaData.cantidad += 1;
          }
        }
      }
    });
    
    return {
      datos: diasDelPeriodo.map(dia => ({
        ...dia,
        total: roundToPrecision(dia.total), // Redondear solo al final
        label: `${dia.dia}`,
        fechaCompleta: dia.fecha.toLocaleDateString('es-ES')
      })),
      titulo: tituloperiodo
    };
  }, [ventasPositivas, filtrosActivos, filtros]);

  // Ventas por horas (último día con ventas DEL PERÍODO FILTRADO)
  const ventasPorHoras = useMemo(() => {
    if (!ventasPositivas.length) return [];
    
    // Obtener facturas que tengan campo hor válido DEL PERÍODO FILTRADO
    const facturasConHora = ventasPositivas.filter(item => item.hor && item.fch);
    
    if (!facturasConHora.length) return [];
    
    // Obtener el último día con ventas DEL PERÍODO FILTRADO
    const fechas = facturasConHora
      .map(item => new Date(item.fch))
      .filter(fecha => !isNaN(fecha.getTime()))
      .sort((a, b) => b - a);
    
    if (!fechas.length) return [];
    
    const ultimoDia = fechas[0];
    const inicioDia = new Date(ultimoDia.getFullYear(), ultimoDia.getMonth(), ultimoDia.getDate());
    const finDia = new Date(ultimoDia.getFullYear(), ultimoDia.getMonth(), ultimoDia.getDate(), 23, 59, 59);
    
    // Generar título dinámico según filtros
    let tituloHoras = ultimoDia.toLocaleDateString('es-ES');
    if (filtrosActivos.vendedorEspecifico) {
      const nombreVendedor = mapaUsuarios[filtros.vendedor] || `Vendedor ${filtros.vendedor}`;
      tituloHoras += ` - ${nombreVendedor}`;
    }
    if (filtrosActivos.clienteEspecifico) {
      const nombreCliente = mapaContactos[filtros.cliente] || `Cliente ${filtros.cliente}`;
      tituloHoras += ` - ${nombreCliente}`;
    }
    
    console.log('Análisis ventas por horas:', {
      ultimoDia: ultimoDia.toISOString(),
      inicioDia: inicioDia.toISOString(),
      finDia: finDia.toISOString(),
      facturasConHora: facturasConHora.length,
      filtrosActivos,
      tituloHoras
    });
    
    // Crear array con todas las medias horas del día desde las 7:00 (horario comercial)
    const horasDelDia = [];
    for (let hora = 7; hora < 24; hora++) { // Empezar desde las 7:00
      for (let minuto = 0; minuto < 60; minuto += 30) {
        horasDelDia.push({
          hora: hora,
          minuto: minuto,
          horaCompleta: hora + (minuto / 60),
          label: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
          total: 0,
          cantidad: 0
        });
      }
    }
    
    // Llenar con datos reales del último día DEL PERÍODO FILTRADO
    facturasConHora.forEach(item => {
      const fechaItem = new Date(item.fch);
      
      // Verificar que es del último día del período filtrado
      if (!isNaN(fechaItem.getTime()) && 
          fechaItem.toDateString() === ultimoDia.toDateString()) {
        
        // Extraer hora del campo hor
        let horaVenta = null;
        
        try {
          const horaStr = item.hor;
          if (typeof horaStr === 'string') {
            const fechaHora = new Date(horaStr);
            if (!isNaN(fechaHora.getTime())) {
              horaVenta = fechaHora.getHours() + (fechaHora.getMinutes() / 60);
            }
          } else if (horaStr instanceof Date) {
            horaVenta = horaStr.getHours() + (horaStr.getMinutes() / 60);
          }
        } catch (error) {
          console.warn('Error parseando hora:', item.hor, error);
        }
        
        if (horaVenta !== null) {
          // Encontrar el intervalo de media hora más cercano
          const intervaloHora = Math.floor(horaVenta);
          const intervaloMinuto = horaVenta % 1 >= 0.5 ? 30 : 0;
          
          const horaData = horasDelDia.find(h => h.hora === intervaloHora && h.minuto === intervaloMinuto);
          if (horaData) {
            const monto = item.tot || 0; // NO redondear aquí
            horaData.total += monto; // SUMA EL TOTAL DE LA VENTA
            horaData.cantidad += 1; // CUENTA UNA FACTURA MÁS
          }
        }
      }
    });
    
    console.log('Muestra de datos por horas (con valores):', 
      horasDelDia.filter(h => h.cantidad > 0).slice(0, 3).map(h => ({
        hora: h.label,
        total: h.total,
        cantidad: h.cantidad,
        tipoTotal: typeof h.total,
        tipoCantidad: typeof h.cantidad
      }))
    );
    
    return {
      datos: horasDelDia.map(hora => ({
        ...hora,
        total: roundToPrecision(hora.total) // Redondear solo al final
      })),
      titulo: tituloHoras
    };
  }, [ventasPositivas, filtrosActivos, filtros, mapaUsuarios, mapaContactos]);

  if (!ventasData.length) {
    return (
      <div className="graficos-ventas">
        <div className="no-data-message">
          <i className="fas fa-chart-bar"></i>
          <h3>No hay datos para mostrar</h3>
          <p>No se encontraron ventas con los filtros aplicados.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="graficos-ventas">
      <div className="charts-container">
        
        {/* Gráfico temporal principal */}
        {filtrosActivos.mesEspecifico && ventasPorSemana.length > 0 ? (
          <ChartContainer title={`Ventas por Semana - ${obtenerNombreMes(parseInt(filtrosActivos.mesSeleccionado))}`}>
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
        ) : (
          <>
            {/* Gráfico de Ventas Mensuales */}
            {ventasMensuales.length > 0 && (
              <ChartContainer title={getTituloConFiltros("Ventas por Mes")}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ventasMensuales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombreMes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'total' ? formatCurrency(value) : `${value} €`,
                      ]} 
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#0088FE" name="Ventas Netas" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}

            {/* Gráfico de Promedio por Factura */}
            {promedioMensual.length > 0 && (
              <ChartContainer title={getTituloConFiltros("Ticket Promedio por Mes")}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={promedioMensual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombreMes" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="promedio" 
                      stroke="#FF8042" 
                      strokeWidth={3} 
                      name="Ticket Promedio"
                      dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </>
        )}

        {/* Ventas por Días (adaptado a filtros) */}
        {ventasPorDias.datos && ventasPorDias.datos.length > 0 && (
          <ChartContainer title={`Ventas por Día - ${ventasPorDias.titulo}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasPorDias.datos}>
                <defs>
                  <linearGradient id="colorVentasDias" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10 }}
                  interval={Math.max(1, Math.floor(ventasPorDias.datos.length / 15))}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '10px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                            Día {label} - {data.fechaCompleta}
                          </p>
                          <p style={{ margin: '0 0 5px 0', color: '#00C49F' }}>
                            💰 Ventas: {formatCurrency(data.total)}
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            📄 Facturas: {data.cantidad}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#00C49F" 
                  fillOpacity={1} 
                  fill="url(#colorVentasDias)" 
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}

        {/* Ventas por Horas (adaptado a filtros) */}
        {ventasPorHoras.datos && ventasPorHoras.datos.length > 0 && (
          <ChartContainer title={`Ventas por Hora - ${ventasPorHoras.titulo}`}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ventasPorHoras.datos}>
                <defs>
                  <linearGradient id="colorVentasHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFBB28" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFBB28" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 9 }}
                  interval={3} // Mostrar cada 4 etiquetas (cada 2 horas)
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      console.log('Datos del tooltip:', data); // Para debug
                      
                      return (
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '10px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Hora: {label}</p>
                          <p style={{ margin: '0 0 5px 0', color: '#FFBB28' }}>
                            💰 Ventas: {formatCurrency(data.total || 0)}
                          </p>
                          <p style={{ margin: 0, color: '#666' }}>
                            📄 Facturas: {Math.round(data.cantidad || 0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#FFBB28" 
                  fillOpacity={1} 
                  fill="url(#colorVentasHoras)" 
                  name="Ventas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Top Vendedores */}
        {topVendedores.length > 0 && (
          <ChartContainer title={getTituloConFiltros(`Top ${topVendedores.length} Vendedores por Ventas Netas`)}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topVendedores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="nombre" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : 
                    name === 'cantidad' ? `${value} facturas` :
                    name === 'ventasPositivas' ? formatCurrency(value) :
                    formatCurrency(value),
                    name === 'total' ? 'Ventas Netas (con devoluciones)' :
                    name === 'cantidad' ? 'Facturas Totales' : 
                    name === 'ventasPositivas' ? 'Ventas Positivas' : 'Promedio Neto'
                  ]} 
                />
                <Bar dataKey="total" fill="#00C49F" name="Ventas Netas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Top Clientes */}
        {topClientes.length > 0 && (
          <ChartContainer title={getTituloConFiltros(`Top ${topClientes.length} Clientes por Compras`)}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 9 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'total' ? formatCurrency(value) : 
                    name === 'cantidad' ? `${value} facturas` :
                    formatCurrency(value),
                    name === 'total' ? 'Total Compras' :
                    name === 'cantidad' ? 'Facturas' : 'Ticket Promedio'
                  ]} 
                />
                <Legend />
                <Bar dataKey="total" fill="#FFBB28" name="Total Compras" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
        {/* Formas de Pago - GRÁFICO HORIZONTAL */}
        {ventasPorFormaPago.length > 0 && (
          <ChartContainer title={getTituloConFiltros(`Ventas por Forma de Pago`)}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorFormaPago} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value), 'Ventas']}
                />
                <Bar dataKey="total" fill="#8884d8" name="Ventas por Forma de Pago">
                  {ventasPorFormaPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        
      </div>

    </div>
  );
};

export default VentasGraficos;



