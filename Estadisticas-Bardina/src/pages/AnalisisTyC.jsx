// pages/AnalisisTyC.jsx
import React, { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorMessage } from '../components/common';
import TycAnalisis from '../components/tyc/TycAnalisis';
import { 
  proveedoresService, 
  marcasService, 
  temporadasService,
  empresasService 
} from '../services/maestros';

const AnalisisTyC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datosReferencia, setDatosReferencia] = useState({
    proveedores: [],
    marcas: [],
    familias: [],
    temporadas: [],
    almacenes: [],
    empresas: []
  });

  // Cargar datos de referencia al montar
  useEffect(() => {
    cargarDatosReferencia();
  }, []);

  const cargarDatosReferencia = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Cargando datos de referencia para TyC...');

      // Cargar datos maestros en paralelo
      const [
        proveedoresData,
        marcasData,
        temporadasData,
        empresasData
      ] = await Promise.all([
        proveedoresService.getProveedores().catch(err => {
          console.warn('Error cargando proveedores:', err);
          return { prv_m: [] };
        }),
        marcasService.getMarcas().catch(err => {
          console.warn('Error cargando marcas:', err);
          return { mar_m: [] };
        }),
        temporadasService.getTemporadas().catch(err => {
          console.warn('Error cargando temporadas:', err);
          return { tmp_m: [] };
        }),
        empresasService.getEmpresas().catch(err => {
          console.warn('Error cargando empresas:', err);
          return { emp_m: [] };
        })
      ]);

      // Familias hardcodeadas (se pueden mover a un servicio después)
      const familiasHardcoded = [
        { id: 'CAM', name: 'Camisetas' },
        { id: 'PAN', name: 'Pantalones' },
        { id: 'ZAP', name: 'Zapatos' },
        { id: 'ACC', name: 'Accesorios' },
        { id: 'VES', name: 'Vestidos' },
        { id: 'CHA', name: 'Chaquetas' },
        { id: 'FAL', name: 'Faldas' },
        { id: 'SUD', name: 'Sudaderas' },
        { id: 'BLU', name: 'Blusas' },
        { id: 'JER', name: 'Jerseys' }
      ];

      // Almacenes hardcodeados (se pueden mover a un servicio después)
      const almacenesHardcoded = [
        { id: 'ALM01', name: 'Almacén Principal' },
        { id: 'ALM02', name: 'Almacén Secundario' },
        { id: 'TIEN01', name: 'Tienda Centro' },
        { id: 'TIEN02', name: 'Tienda Norte' },
        { id: 'TIEN03', name: 'Tienda Sur' },
        { id: 'WEB', name: 'Stock Web' }
      ];

      setDatosReferencia({
        proveedores: proveedoresData.prv_m || [],
        marcas: marcasData.mar_m || [],
        familias: familiasHardcoded,
        temporadas: temporadasData.tmp_m || [],
        almacenes: almacenesHardcoded,
        empresas: empresasData.emp_m || []
      });

      console.log('Datos de referencia cargados:', {
        proveedores: proveedoresData.prv_m?.length || 0,
        marcas: marcasData.mar_m?.length || 0,
        familias: familiasHardcoded.length,
        temporadas: temporadasData.tmp_m?.length || 0,
        almacenes: almacenesHardcoded.length,
        empresas: empresasData.emp_m?.length || 0
      });

    } catch (err) {
      console.error('Error cargando datos de referencia:', err);
      setError('Error al cargar los datos de referencia necesarios');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner />
        <h3>Cargando Análisis TyC</h3>
        <p>Preparando datos de referencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <ErrorMessage message={error} />
        <button 
          onClick={cargarDatosReferencia} 
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          <i className="fas fa-sync"></i>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="analisis-tyc-page">
      <TycAnalisis 
        proveedores={datosReferencia.proveedores}
        marcas={datosReferencia.marcas}
        familias={datosReferencia.familias}
        temporadas={datosReferencia.temporadas}
        almacenes={datosReferencia.almacenes}
        empresas={datosReferencia.empresas}
      />
    </div>
  );
};

export default AnalisisTyC;