// Script de debug para investigar el problema del peso
import { velneoAPI } from './src/services/velneoAPI.js';

async function debugPeso() {
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
    if (articulosData.art_m?.length > 0) {
      const primerArticulo = articulosData.art_m[0];
      console.log('🔍 Estructura completa del primer artículo:', primerArticulo);
      console.log('🏷️ Campos disponibles:', Object.keys(primerArticulo));
      
      // Buscar campos que puedan contener peso
      const camposPosiblesPeso = Object.keys(primerArticulo).filter(campo => 
        campo.toLowerCase().includes('peso') || 
        campo.toLowerCase().includes('pes') || 
        campo.toLowerCase().includes('weight') || 
        campo.toLowerCase().includes('grs') ||
        campo.toLowerCase().includes('gram')
      );
      console.log('🔍 Campos posibles de peso:', camposPosiblesPeso);
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

export { debugPeso };
