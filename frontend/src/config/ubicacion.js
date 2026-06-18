/** Ubicación del local en La Cruz Santa (Los Realejos). */
export const UBICACION_RESTAURANTE = {
  nombre: 'Guachinche El Realejo',
  calle: 'Camino El Vinculito, Nº 14',
  localidad: 'La Cruz Santa, 38413, Los Realejos, Santa Cruz de Tenerife',
  latitud: 28.379258,
  longitud: -16.565105,
  zoomMaps: 17,
}

/** Abre Google Maps en el pin exacto (móvil, tablet y escritorio). */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${UBICACION_RESTAURANTE.latitud},${UBICACION_RESTAURANTE.longitud}`

/** Vista embebida del mapa sin API key. */
export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${UBICACION_RESTAURANTE.latitud},${UBICACION_RESTAURANTE.longitud}&hl=es&z=${UBICACION_RESTAURANTE.zoomMaps}&output=embed`
