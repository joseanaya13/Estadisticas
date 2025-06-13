import React, { useState } from 'react';
import { velneoAPI } from '../services/velneoAPI';

const DebugPeso = () => {
  const [debugging, setDebugging] = useState(false);
  const [resultados, setResultados] = useState(null);

  const ejecutarDebug = async () => {
    setDebugging(true);
    console.log('🔍 Iniciando debug del problema de peso...');
    
    try {
      // Obtener artículos directamente
      const articulosData = await velneoAPI.getArticulos();
      console.log('📦 Datos de artículos:', {
        total: articulosData.art_m?.length || 0,
        totalCount: articulosData.total_count,
        primeros3: articulosData.art_m?.slice(0, 3)
      });
      
      // Buscar artículos con peso
      const articulosConPeso = articulosData.art_m?.filter(a => {
        return (a.peso && a.peso > 0) || 
               (a.pes && a.pes > 0) || 
               (a.weight && a.weight > 0) || 
               (a.grs && a.grs > 0);
      }) || [];
      
      console.log('⚖️ Artículos con peso:', {
        cantidad: articulosConPeso.length,
        ejemplos: articulosConPeso.slice(0, 5).map(a => ({
          id: a.id,
          name: a.name,
          peso: a.peso,
          pes: a.pes,
          weight: a.weight,
          grs: a.grs,
          todosCampos: Object.keys(a)
        }))
      });
      
      // Verificar estructura de artículo completa
      let estructuraCompleta = null;
      let camposPosiblesPeso = [];
      
      if (articulosData.art_m?.length > 0) {
        const primerArticulo = articulosData.art_m[0];
        estructuraCompleta = primerArticulo;
        console.log('🔍 Estructura completa del primer artículo:', primerArticulo);
        console.log('🏷️ Campos disponibles:', Object.keys(primerArticulo));
        
        // Buscar campos que puedan contener peso
        camposPosiblesPeso = Object.keys(primerArticulo).filter(campo => 
          campo.toLowerCase().includes('peso') || 
          campo.toLowerCase().includes('pes') || 
          campo.toLowerCase().includes('weight') || 
          campo.toLowerCase().includes('grs') ||
          campo.toLowerCase().includes('gram')
        );
        console.log('🔍 Campos posibles de peso:', camposPosiblesPeso);
      }
      
      const resultados = {
        totalArticulos: articulosData.art_m?.length || 0,
        totalCount: articulosData.total_count,
        articulosConPeso: articulosConPeso.length,
        ejemplosConPeso: articulosConPeso.slice(0, 5),
        estructuraCompleta,
        camposPosiblesPeso,
        todosLosCampos: estructuraCompleta ? Object.keys(estructuraCompleta) : []
      };
      
      setResultados(resultados);
      
    } catch (error) {
      console.error('❌ Error en debug:', error);
      setResultados({ error: error.message });
    } finally {
      setDebugging(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '10px',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h3>🔍 Debug Peso</h3>
      <button 
        onClick={ejecutarDebug} 
        disabled={debugging}
        style={{
          padding: '8px 16px',
          backgroundColor: debugging ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: debugging ? 'not-allowed' : 'pointer'
        }}
      >
        {debugging ? 'Ejecutando...' : 'Ejecutar Debug'}
      </button>
      
      {resultados && (
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <h4>Resultados:</h4>
          {resultados.error ? (
            <p style={{ color: 'red' }}>Error: {resultados.error}</p>
          ) : (
            <div>
              <p><strong>Total artículos:</strong> {resultados.totalArticulos}/{resultados.totalCount}</p>
              <p><strong>Artículos con peso:</strong> {resultados.articulosConPeso}</p>
              <p><strong>Campos posibles peso:</strong> {resultados.camposPosiblesPeso?.join(', ') || 'Ninguno'}</p>
              <p><strong>Todos los campos:</strong> {resultados.todosLosCampos?.slice(0, 10).join(', ')}...</p>
              {resultados.ejemplosConPeso?.length > 0 && (
                <div>
                  <p><strong>Ejemplos con peso:</strong></p>
                  {resultados.ejemplosConPeso.map((art, i) => (
                    <div key={i} style={{ fontSize: '10px', marginLeft: '10px' }}>
                      {art.name}: peso={art.peso}, pes={art.pes}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <p style={{ fontSize: '10px', color: '#666' }}>
            Revisa la consola del navegador para más detalles
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugPeso;
