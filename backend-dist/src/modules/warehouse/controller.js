/**
 * Warehouse Controller
 * Controlador principal que importa operaciones de módulos especializados
 */

const {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf
} = require('./shelf-operations');

const {
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  autoPlaceSamples
} = require('./map-operations');

const {
  defragmentShelf,
  confirmDefragMove
} = require('./defragment-operations');

module.exports = {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf,
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  autoPlaceSamples,
  defragmentShelf,
  confirmDefragMove
};