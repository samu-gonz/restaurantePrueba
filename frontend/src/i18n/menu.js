import i18n from './index'

export function traducirPlato(plato) {
  const base = `menu.${plato.id}`
  return {
    ...plato,
    nombre: i18n.t(`${base}.nombre`, { defaultValue: plato.nombre }),
    descripcion: i18n.t(`${base}.descripcion`, { defaultValue: plato.descripcion }),
    alergenos: (plato.alergenos ?? []).map((alergeno) =>
      i18n.t(`allergens.${alergeno}`, { defaultValue: alergeno }),
    ),
  }
}

export function traducirCarta(platos) {
  return platos.map(traducirPlato)
}
