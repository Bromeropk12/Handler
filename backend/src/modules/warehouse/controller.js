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
  removeSample
} = require('./map-operations');

module.exports = {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf,
  getShelfMap,
  placeSample,
  moveSample,
  removeSample
};